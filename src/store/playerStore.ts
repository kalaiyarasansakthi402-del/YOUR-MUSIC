import { create } from 'zustand';
import { Track, PlaybackState, RepeatMode } from '../types';
import { playerService } from '../services/audio/PlayerService';

interface PlayerStoreState extends PlaybackState {
  playTrack: (track: Track, queue?: Track[], index?: number) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  togglePlayPause: () => Promise<void>;
  seekTo: (seconds: number) => Promise<void>;
  next: () => Promise<void>;
  previous: () => Promise<void>;
  setShuffle: (shuffle: boolean) => void;
  setRepeatMode: (mode: RepeatMode) => void;
  setVolume: (volume: number) => void;
  addToQueue: (track: Track) => void;
  playNext: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  setPlaybackRate: (rate: number) => Promise<void>;
  clearQueue: () => void;
  retry: () => Promise<void>;
  stop: () => Promise<void>;
}

export const usePlayerStore = create<PlayerStoreState>((set) => {
  // Subscribe to playerService updates
  playerService.subscribe((state) => {
    set(state);
  });

  return {
    ...playerService.getState(),

    playTrack: async (track: Track, queue?: Track[], index?: number) => {
      await playerService.playTrack(track, queue, index);
    },

    pause: async () => {
      await playerService.pause();
    },

    resume: async () => {
      await playerService.resume();
    },

    togglePlayPause: async () => {
      await playerService.togglePlayPause();
    },

    seekTo: async (seconds: number) => {
      await playerService.seekTo(seconds);
    },

    next: async () => {
      await playerService.next();
    },

    previous: async () => {
      await playerService.previous();
    },

    setShuffle: (shuffle: boolean) => {
      playerService.setShuffle(shuffle);
    },

    setRepeatMode: (mode: RepeatMode) => {
      playerService.setRepeatMode(mode);
    },

    setVolume: (volume: number) => {
      playerService.setVolume(volume);
    },

    addToQueue: (track: Track) => {
      playerService.addToQueue(track);
    },

    playNext: (track: Track) => {
      playerService.playNext(track);
    },

    removeFromQueue: (index: number) => {
      playerService.removeFromQueue(index);
    },

    reorderQueue: (fromIndex: number, toIndex: number) => {
      playerService.reorderQueue(fromIndex, toIndex);
    },

    setPlaybackRate: async (rate: number) => {
      await playerService.setPlaybackRate(rate);
    },

    clearQueue: () => {
      playerService.clearQueue();
    },

    retry: async () => {
      await playerService.retry();
    },

    stop: async () => {
      await playerService.stop();
    },
  };
});
