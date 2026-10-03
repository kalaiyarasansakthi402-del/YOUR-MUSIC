import { Audio, InterruptionModeIOS, InterruptionModeAndroid, AVPlaybackStatus } from 'expo-av';
import { Track, PlaybackState, RepeatMode } from '../../types';
import { database } from '../database/database';
import { logger } from '../../utils/logger';

type StateListener = (state: PlaybackState) => void;

class PlayerService {
  private sound: Audio.Sound | null = null;
  private listeners: StateListener[] = [];
  private state: PlaybackState = {
    currentTrack: null,
    isPlaying: false,
    isBuffering: false,
    position: 0,
    duration: 0,
    playbackRate: 1.0,
    volume: 1.0,
    isMuted: false,
    shuffle: false,
    repeatMode: 'off',
    queue: [],
    queueIndex: -1,
    error: null,
  };

  private originalQueue: Track[] = [];
  private isConfigured = false;

  public async init(): Promise<void> {
    if (this.isConfigured) return;
    try {
      await Audio.setAudioModeAsync({
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        interruptionModeIOS: InterruptionModeIOS.DuckOthers,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      this.isConfigured = true;
      logger.info('Audio mode configured for background playback.');
    } catch (error) {
      logger.error('Failed to configure Audio mode', { error: String(error) });
    }
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.push(listener);
    listener(this.getState());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public getState(): PlaybackState {
    return { ...this.state };
  }

  private notify(): void {
    const currentState = this.getState();
    this.listeners.forEach((l) => l(currentState));
  }

  public async playTrack(
    track: Track,
    queue?: Track[],
    index?: number
  ): Promise<void> {
    await this.init();
    try {
      if (queue && queue.length > 0) {
        this.originalQueue = [...queue];
        this.state.queue = this.state.shuffle ? this.shuffleArray([...queue]) : [...queue];
        this.state.queueIndex = index !== undefined && index >= 0 ? index : this.state.queue.findIndex((t) => t.id === track.id);
      } else if (this.state.queue.length === 0) {
        this.originalQueue = [track];
        this.state.queue = [track];
        this.state.queueIndex = 0;
      }

      // Unload previous sound instance
      if (this.sound) {
        try {
          await this.sound.unloadAsync();
        } catch {
          // ignore
        }
        this.sound = null;
      }

      this.state.currentTrack = track;
      this.state.isBuffering = true;
      this.state.error = null;
      this.state.position = 0;
      this.state.duration = track.duration || 0;
      this.notify();

      // Prefer local file URI if downloaded, otherwise remote stream URL
      const playbackUri = track.localUri || track.url;
      logger.info(`Loading sound: ${track.title} (${playbackUri})`);

      const { sound } = await Audio.Sound.createAsync(
        { uri: playbackUri },
        {
          shouldPlay: true,
          volume: this.state.volume,
          isLooping: this.state.repeatMode === 'one',
        },
        this.onPlaybackStatusUpdate
      );

      this.sound = sound;
      this.state.isPlaying = true;
      this.state.isBuffering = false;
      this.notify();

      // Record in listening history & database
      database.addHistory(track);
    } catch (error) {
      logger.error(`Error loading track: ${track.title}`, { error: String(error) });
      this.state.isBuffering = false;
      this.state.isPlaying = false;
      this.state.error = 'Failed to load audio stream. Moving to next track.';
      this.notify();

      // Auto recovery: skip to next track after 2 seconds if queue available
      setTimeout(() => {
        if (this.state.queue.length > 1) {
          this.next();
        }
      }, 2000);
    }
  }

  public async pause(): Promise<void> {
    if (this.sound && this.state.isPlaying) {
      try {
        await this.sound.pauseAsync();
        this.state.isPlaying = false;
        this.notify();
      } catch (error) {
        logger.error('Error pausing sound', { error: String(error) });
      }
    }
  }

  public async resume(): Promise<void> {
    if (this.sound && !this.state.isPlaying) {
      try {
        await this.sound.playAsync();
        this.state.isPlaying = true;
        this.notify();
      } catch (error) {
        logger.error('Error resuming sound', { error: String(error) });
      }
    } else if (!this.sound && this.state.currentTrack) {
      await this.playTrack(this.state.currentTrack);
    }
  }

  public async togglePlayPause(): Promise<void> {
    if (this.state.isPlaying) {
      await this.pause();
    } else {
      await this.resume();
    }
  }

  public async seekTo(seconds: number): Promise<void> {
    if (this.sound) {
      try {
        await this.sound.setPositionAsync(Math.max(0, seconds * 1000));
        this.state.position = seconds;
        this.notify();
      } catch (error) {
        logger.error('Error seeking sound', { error: String(error) });
      }
    }
  }

  public async next(): Promise<void> {
    if (this.state.queue.length === 0) return;

    let nextIndex = this.state.queueIndex + 1;
    if (nextIndex >= this.state.queue.length) {
      if (this.state.repeatMode === 'all') {
        nextIndex = 0;
      } else {
        await this.pause();
        return;
      }
    }

    const nextTrack = this.state.queue[nextIndex];
    if (nextTrack) {
      this.state.queueIndex = nextIndex;
      await this.playTrack(nextTrack);
    }
  }

  public async previous(): Promise<void> {
    // If more than 3 seconds in, restart current track
    if (this.state.position > 3) {
      await this.seekTo(0);
      return;
    }

    if (this.state.queue.length === 0) return;

    let prevIndex = this.state.queueIndex - 1;
    if (prevIndex < 0) {
      prevIndex = this.state.queue.length - 1;
    }

    const prevTrack = this.state.queue[prevIndex];
    if (prevTrack) {
      this.state.queueIndex = prevIndex;
      await this.playTrack(prevTrack);
    }
  }

  public setShuffle(shuffle: boolean): void {
    this.state.shuffle = shuffle;
    if (shuffle) {
      const current = this.state.currentTrack;
      const shuffled = this.shuffleArray([...this.originalQueue]);
      if (current) {
        const idx = shuffled.findIndex((t) => t.id === current.id);
        if (idx !== -1) {
          shuffled.splice(idx, 1);
          shuffled.unshift(current);
        }
      }
      this.state.queue = shuffled;
      this.state.queueIndex = 0;
    } else {
      this.state.queue = [...this.originalQueue];
      if (this.state.currentTrack) {
        this.state.queueIndex = this.state.queue.findIndex(
          (t) => t.id === this.state.currentTrack?.id
        );
      }
    }
    this.notify();
  }

  public setRepeatMode(mode: RepeatMode): void {
    this.state.repeatMode = mode;
    if (this.sound) {
      this.sound.setIsLoopingAsync(mode === 'one');
    }
    this.notify();
  }

  public setVolume(volume: number): void {
    const clamped = Math.max(0, Math.min(1, volume));
    this.state.volume = clamped;
    if (this.sound) {
      this.sound.setVolumeAsync(clamped);
    }
    this.notify();
  }

  public addToQueue(track: Track): void {
    this.state.queue.push(track);
    this.originalQueue.push(track);
    this.notify();
  }

  public removeFromQueue(index: number): void {
    if (index >= 0 && index < this.state.queue.length) {
      this.state.queue.splice(index, 1);
      if (index < this.state.queueIndex) {
        this.state.queueIndex--;
      }
      this.notify();
    }
  }

  private onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) {
        logger.error(`AVPlaybackStatus error: ${status.error}`);
        this.state.error = status.error;
        this.state.isPlaying = false;
        this.notify();
      }
      return;
    }

    this.state.isPlaying = status.isPlaying;
    this.state.isBuffering = status.isBuffering;
    this.state.position = Math.floor((status.positionMillis || 0) / 1000);
    this.state.duration = Math.floor((status.durationMillis || 0) / 1000);

    if (status.didJustFinish && !status.isLooping) {
      logger.info('Track finished playing, advancing to next.');
      this.next();
    } else {
      this.notify();
    }
  };

  private shuffleArray(array: Track[]): Track[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}

export const playerService = new PlayerService();
