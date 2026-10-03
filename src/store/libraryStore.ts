import { create } from 'zustand';
import { Track, Playlist } from '../types';
import { database } from '../services/database/database';
import { offlineManager } from '../services/offline/offlineManager';
import { logger } from '../utils/logger';

interface LibraryStoreState {
  favorites: Track[];
  history: Track[];
  playlists: Playlist[];
  downloads: Track[];
  isLoading: boolean;
  downloadProgress: Record<string, number>;

  loadLibraryData: () => Promise<void>;
  toggleFavorite: (track: Track) => void;
  isFavorite: (trackId: string) => boolean;
  createPlaylist: (title: string, description?: string) => Playlist;
  deletePlaylist: (playlistId: string) => void;
  addTrackToPlaylist: (playlistId: string, track: Track) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  downloadTrack: (track: Track) => Promise<void>;
  deleteDownload: (trackId: string) => Promise<void>;
  clearHistory: () => void;
}

export const useLibraryStore = create<LibraryStoreState>((set, get) => ({
  favorites: [],
  history: [],
  playlists: [],
  downloads: [],
  isLoading: false,
  downloadProgress: {},

  loadLibraryData: async () => {
    set({ isLoading: true });
    try {
      await database.init();
      const favorites = database.getFavorites();
      const history = database.getHistory();
      const playlists = database.getPlaylists();
      const downloads = database.getDownloads();
      set({ favorites, history, playlists, downloads, isLoading: false });
    } catch (error) {
      logger.error('Failed to load library data from SQLite', { error: String(error) });
      set({ isLoading: false });
    }
  },

  toggleFavorite: (track: Track) => {
    const isFav = database.isFavorite(track.id);
    if (isFav) {
      database.removeFavorite(track.id);
    } else {
      database.addFavorite(track);
    }
    const updatedFavorites = database.getFavorites();
    set({ favorites: updatedFavorites });
  },

  isFavorite: (trackId: string) => {
    return get().favorites.some((f) => f.id === trackId);
  },

  createPlaylist: (title: string, description = '') => {
    const id = `pl_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newPlaylist = database.createPlaylist(id, title, description);
    set({ playlists: [newPlaylist, ...get().playlists] });
    return newPlaylist;
  },

  deletePlaylist: (playlistId: string) => {
    database.deletePlaylist(playlistId);
    set({ playlists: get().playlists.filter((p) => p.id !== playlistId) });
  },

  addTrackToPlaylist: (playlistId: string, track: Track) => {
    database.addTrackToPlaylist(playlistId, track);
    const updatedPlaylists = database.getPlaylists();
    set({ playlists: updatedPlaylists });
  },

  removeTrackFromPlaylist: (playlistId: string, trackId: string) => {
    database.removeTrackFromPlaylist(playlistId, trackId);
    const updatedPlaylists = database.getPlaylists();
    set({ playlists: updatedPlaylists });
  },

  downloadTrack: async (track: Track) => {
    try {
      set((state) => ({
        downloadProgress: { ...state.downloadProgress, [track.id]: 1 },
      }));

      await offlineManager.downloadTrack(track, (progress) => {
        set((state) => ({
          downloadProgress: { ...state.downloadProgress, [track.id]: Math.round(progress) },
        }));
      });

      const downloads = database.getDownloads();
      set((state) => {
        const newProgress = { ...state.downloadProgress };
        delete newProgress[track.id];
        return { downloads, downloadProgress: newProgress };
      });
    } catch (error) {
      logger.error('Error downloading track in store', { error: String(error) });
      set((state) => {
        const newProgress = { ...state.downloadProgress };
        delete newProgress[track.id];
        return { downloadProgress: newProgress };
      });
    }
  },

  deleteDownload: async (trackId: string) => {
    await offlineManager.deleteDownloadedTrack(trackId);
    const downloads = database.getDownloads();
    set({ downloads });
  },

  clearHistory: () => {
    database.clearHistory();
    set({ history: [] });
  },
}));
