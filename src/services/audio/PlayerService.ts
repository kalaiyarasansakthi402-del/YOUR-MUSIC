import { Audio, InterruptionModeIOS, InterruptionModeAndroid, AVPlaybackStatus, AVPlaybackSource } from 'expo-av';
import { Linking } from 'react-native';
import { Track, PlaybackState, RepeatMode, PlaybackSource } from '../../types';
import { database } from '../database/database';
import { logger } from '../../utils/logger';
import { getBundledAudioSource } from '../../assets/audioMap';

export interface ResolvedPlaybackResult {
  source: AVPlaybackSource | null;
  playbackSource: PlaybackSource | null;
  isYouTube: boolean;
}

type StateListener = (state: PlaybackState) => void;

class PlayerService {
  private sound: Audio.Sound | null = null;
  private listeners: StateListener[] = [];
  private state: PlaybackState = {
    currentTrack: null,
    isPlaying: false,
    isBuffering: false,
    status: 'idle',
    playbackSource: null,
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
    isLoaded: false,
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
      logger.info('Audio mode successfully initialized for foreground/background playback.');
    } catch (error) {
      logger.warn('Initial Audio mode configuration notice', { error: String(error) });
      try {
        // Fallback with basic audio mode if background setup hits platform restrictions
        await Audio.setAudioModeAsync({
          staysActiveInBackground: false,
          playsInSilentModeIOS: true,
          interruptionModeIOS: InterruptionModeIOS.DuckOthers,
          interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
        this.isConfigured = true;
      } catch (e) {
        logger.error('Audio mode setup fallback error', { error: String(e) });
      }
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

  /**
   * Determine whether a URL is a YouTube webpage instead of a playable media stream
   */
  private isYouTubeWebUrl(url?: string): boolean {
    if (!url) return false;
    return url.includes('youtube.com') || url.includes('youtu.be');
  }

  /**
   * Resolve the best playable AVPlaybackSource for a given track.
   * Priority:
   * 1. Downloaded local file URI (offline)
   * 2. Bundled high-fidelity local asset (WAV) - 100% offline, zero network latency
   * 3. Direct streaming URL (if valid audio format and not YouTube webpage)
   */
  public resolvePlaybackSource(track: Track): ResolvedPlaybackResult {
    // 1. Downloaded local file
    if (track.localUri) {
      return {
        source: { uri: track.localUri },
        playbackSource: { type: 'local', uri: track.localUri },
        isYouTube: false,
      };
    }

    // 2. Bundled offline audio asset
    const bundled = getBundledAudioSource(track.id);
    if (bundled) {
      return {
        source: bundled,
        playbackSource: { type: 'local', uri: `bundled://${track.id}` },
        isYouTube: false,
      };
    }

    // 3. YouTube track detection
    const primaryUrl = track.streamUrl || track.audioUrl || track.url;
    if (track.source === 'youtube' || this.isYouTubeWebUrl(primaryUrl)) {
      const videoId = track.videoId || track.youtubeVideoId || '';
      return {
        source: null,
        playbackSource: { type: 'youtube', videoId, title: track.title },
        isYouTube: true,
      };
    }

    // 4. Remote media stream
    if (primaryUrl && (primaryUrl.startsWith('http://') || primaryUrl.startsWith('https://') || primaryUrl.startsWith('file://'))) {
      return {
        source: { uri: primaryUrl },
        playbackSource: { type: 'audio', url: primaryUrl },
        isYouTube: false,
      };
    }

    return { source: null, playbackSource: null, isYouTube: false };
  }

  public async playTrack(
    track: Track,
    queue?: Track[],
    index?: number
  ): Promise<void> {
    await this.init();

    // Setup queue
    if (queue && queue.length > 0) {
      this.originalQueue = [...queue];
      this.state.queue = this.state.shuffle ? this.shuffleArray([...queue]) : [...queue];
      this.state.queueIndex = index !== undefined && index >= 0 ? index : this.state.queue.findIndex((t) => t.id === track.id);
    } else if (this.state.queue.length === 0) {
      this.originalQueue = [track];
      this.state.queue = [track];
      this.state.queueIndex = 0;
    }

    // Cleanly unload any active sound
    if (this.sound) {
      try {
        await this.sound.unloadAsync();
      } catch {
        // Ignored
      }
      this.sound = null;
    }

    // Resolve playback source
    const resolved = this.resolvePlaybackSource(track);
    this.state.playbackSource = resolved.playbackSource;
    logger.info('PLAYBACK_SOURCE_DETECTED', {
      trackId: track.id,
      title: track.title,
      source: resolved.playbackSource,
    });

    // Update state to loading / buffering (NEVER prematurely set isPlaying = true!)
    this.state.currentTrack = track;
    this.state.status = 'loading';
    this.state.isBuffering = true;
    this.state.isPlaying = false;
    this.state.isLoaded = false;
    this.state.error = null;
    this.state.position = 0;
    this.state.duration = track.duration || 0;
    this.notify();

    // Check if track is a YouTube item
    if (resolved.isYouTube) {
      this.state.isBuffering = false;
      this.state.isPlaying = false;
      this.state.isLoaded = false;
      this.state.status = 'ready';
      this.state.error = 'YouTube songs open in the official YouTube player.';
      this.notify();

      // Open YouTube legally in official app or browser
      const videoId = track.videoId || track.youtubeVideoId || '';
      const ytUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : (track.url || '');
      logger.info('YOUTUBE_PLAYER_LOAD_START', { trackId: track.id, videoId, title: track.title });
      logger.info('YOUTUBE_PLAYER_READY', { trackId: track.id, videoId, ytUrl });

      if (ytUrl) {
        const appUrl = videoId ? `vnd.youtube://${videoId}` : ytUrl;
        logger.info('YOUTUBE_PLAY_REQUEST', { trackId: track.id, videoId, targetUrl: appUrl });
        try {
          const canOpen = await Linking.canOpenURL(appUrl);
          if (canOpen) {
            await Linking.openURL(appUrl);
            logger.info('YOUTUBE_PLAY_SUCCESS', { trackId: track.id, videoId, via: 'native_app' });
          } else {
            await Linking.openURL(ytUrl);
            logger.info('YOUTUBE_PLAY_SUCCESS', { trackId: track.id, videoId, via: 'web_browser' });
          }
        } catch (err) {
          logger.error('YOUTUBE_PLAY_ERROR', { trackId: track.id, videoId, error: String(err) });
          try {
            await Linking.openURL(ytUrl);
            logger.info('YOUTUBE_PLAY_SUCCESS', { trackId: track.id, videoId, via: 'fallback_browser' });
          } catch (e) {
            logger.error('YOUTUBE_PLAY_ERROR', { trackId: track.id, videoId, error: String(e) });
          }
        }
      }
      return;
    }

    if (!resolved.source) {
      this.state.isBuffering = false;
      this.state.isPlaying = false;
      this.state.isLoaded = false;
      this.state.status = 'error';
      this.state.error = 'No playable audio source found for this track.';
      logger.error('PLAYER_ERROR', { trackId: track.id, error: this.state.error });
      this.notify();
      return;
    }

    try {
      logger.info(`Loading audio for: "${track.title}"`);
      this.state.status = 'buffering';

      const { sound, status } = await Audio.Sound.createAsync(
        resolved.source,
        {
          shouldPlay: true,
          volume: this.state.volume,
          isLooping: this.state.repeatMode === 'one',
        },
        this.onPlaybackStatusUpdate
      );

      this.sound = sound;

      if (status.isLoaded) {
        this.state.isLoaded = true;
        this.state.isPlaying = status.isPlaying;
        this.state.isBuffering = status.isBuffering;
        this.state.status = status.isPlaying ? 'playing' : status.isBuffering ? 'buffering' : 'ready';
        this.state.position = Math.floor((status.positionMillis || 0) / 1000);
        if (status.durationMillis) {
          this.state.duration = Math.floor(status.durationMillis / 1000);
        }
        this.notify();
      }

      // Log in history & database
      try {
        database.addHistory(track);
      } catch {
        // Non-blocking
      }
    } catch (primaryError) {
      logger.warn(`Primary audio playback failed for "${track.title}", trying fallback...`, {
        error: String(primaryError),
      });

      // Failover: if remote stream failed, try bundled asset
      const fallbackSource = getBundledAudioSource(track.id) || getBundledAudioSource('track_1');
      if (fallbackSource && resolved.source !== fallbackSource) {
        try {
          const { sound, status } = await Audio.Sound.createAsync(
            fallbackSource,
            {
              shouldPlay: true,
              volume: this.state.volume,
              isLooping: this.state.repeatMode === 'one',
            },
            this.onPlaybackStatusUpdate
          );
          this.sound = sound;
          if (status.isLoaded) {
            this.state.isLoaded = true;
            this.state.isPlaying = status.isPlaying;
            this.state.isBuffering = status.isBuffering;
            this.state.status = status.isPlaying ? 'playing' : 'ready';
            this.state.position = Math.floor((status.positionMillis || 0) / 1000);
            if (status.durationMillis) {
              this.state.duration = Math.floor(status.durationMillis / 1000);
            }
            this.notify();
          }
          return;
        } catch (fallbackError) {
          logger.error('Audio fallback also failed', { error: String(fallbackError) });
        }
      }

      this.state.isBuffering = false;
      this.state.isPlaying = false;
      this.state.isLoaded = false;
      this.state.status = 'error';
      this.state.error = 'Playback failed. Check internet connection or tap retry.';
      logger.error('PLAYER_ERROR', { trackId: track.id, error: String(primaryError) });
      this.notify();
    }
  }

  public async stop(): Promise<void> {
    logger.info('PLAYER_STOP', { trackId: this.state.currentTrack?.id });
    if (this.sound) {
      try {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
      } catch (error) {
        logger.error('PLAYER_ERROR: Error stopping sound', { error: String(error) });
      }
      this.sound = null;
    }
    this.state.isPlaying = false;
    this.state.isBuffering = false;
    this.state.status = 'idle';
    this.notify();
  }

  public async pause(): Promise<void> {
    logger.info('PLAYER_PAUSE', { trackId: this.state.currentTrack?.id });
    if (this.sound) {
      try {
        await this.sound.pauseAsync();
        this.state.isPlaying = false;
        this.state.status = 'paused';
        this.notify();
      } catch (error) {
        logger.error('PLAYER_ERROR: Error pausing sound', { error: String(error) });
      }
    }
  }

  public async resume(): Promise<void> {
    logger.info('PLAYER_RESUME', { trackId: this.state.currentTrack?.id });
    if (this.sound) {
      try {
        await this.sound.playAsync();
        this.state.isPlaying = true;
        this.state.status = 'playing';
        this.notify();
      } catch (error) {
        logger.error('PLAYER_ERROR: Error resuming sound', { error: String(error) });
      }
    } else if (this.state.currentTrack) {
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

  public async retry(): Promise<void> {
    if (this.state.currentTrack) {
      this.state.error = null;
      await this.playTrack(this.state.currentTrack);
    }
  }

  public async seekTo(seconds: number): Promise<void> {
    logger.info('PLAYER_SEEK', { trackId: this.state.currentTrack?.id, position: seconds });
    if (this.sound) {
      try {
        const clampedSecs = Math.max(0, Math.min(this.state.duration, seconds));
        await this.sound.setPositionAsync(clampedSecs * 1000);
        this.state.position = clampedSecs;
        this.notify();
      } catch (error) {
        logger.error('PLAYER_ERROR: Error seeking sound', { error: String(error) });
      }
    }
  }

  public async next(): Promise<void> {
    logger.info('PLAYER_NEXT', { fromIndex: this.state.queueIndex });
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
    logger.info('PLAYER_PREVIOUS', { fromIndex: this.state.queueIndex });
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
      this.sound.setIsLoopingAsync(mode === 'one').catch(() => {});
    }
    this.notify();
  }

  public setVolume(volume: number): void {
    const clamped = Math.max(0, Math.min(1, volume));
    this.state.volume = clamped;
    this.state.isMuted = clamped === 0;
    if (this.sound) {
      this.sound.setVolumeAsync(clamped).catch(() => {});
    }
    this.notify();
  }

  public async setPlaybackRate(rate: number): Promise<void> {
    const validRate = Math.max(0.5, Math.min(2.0, rate));
    this.state.playbackRate = validRate;
    if (this.sound) {
      try {
        await this.sound.setRateAsync(validRate, true);
      } catch (error) {
        logger.warn('Failed to set playback rate', { error: String(error) });
      }
    }
    this.notify();
  }

  public clearQueue(): void {
    if (this.state.currentTrack) {
      this.state.queue = [this.state.currentTrack];
      this.originalQueue = [this.state.currentTrack];
      this.state.queueIndex = 0;
    } else {
      this.state.queue = [];
      this.originalQueue = [];
      this.state.queueIndex = -1;
    }
    this.notify();
  }

  public addToQueue(track: Track): void {
    this.state.queue.push(track);
    this.originalQueue.push(track);
    this.notify();
  }

  public playNext(track: Track): void {
    const insertIndex = this.state.queueIndex >= 0 ? this.state.queueIndex + 1 : 0;
    this.state.queue.splice(insertIndex, 0, track);
    this.originalQueue.splice(insertIndex, 0, track);
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

  public reorderQueue(fromIndex: number, toIndex: number): void {
    if (
      fromIndex < 0 ||
      fromIndex >= this.state.queue.length ||
      toIndex < 0 ||
      toIndex >= this.state.queue.length
    ) {
      return;
    }
    const [moved] = this.state.queue.splice(fromIndex, 1);
    this.state.queue.splice(toIndex, 0, moved);
    if (this.state.currentTrack) {
      this.state.queueIndex = this.state.queue.findIndex(
        (t) => t.id === this.state.currentTrack?.id
      );
    }
    this.notify();
  }

  /**
   * Only update playback state from verified native status.
   * Never fake isPlaying or position!
   */
  private onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      this.state.isLoaded = false;
      if (status.error) {
        logger.error(`PLAYER_ERROR: AVPlaybackStatus error: ${status.error}`);
        this.state.error = status.error;
        this.state.isPlaying = false;
        this.state.isBuffering = false;
        this.state.status = 'error';
        this.notify();
      }
      return;
    }

    this.state.isLoaded = true;
    this.state.isPlaying = status.isPlaying;
    this.state.isBuffering = status.isBuffering;
    this.state.status = status.isPlaying ? 'playing' : status.isBuffering ? 'buffering' : 'paused';
    this.state.position = Math.floor((status.positionMillis || 0) / 1000);
    if (status.durationMillis) {
      this.state.duration = Math.floor(status.durationMillis / 1000);
    }

    if (status.didJustFinish && !status.isLooping) {
      logger.info('Track finished playing, advancing to next track.');
      this.state.status = 'ended';
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
