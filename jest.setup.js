import '@testing-library/jest-native/extend-expect';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock expo-av
jest.mock('expo-av', () => {
  let mockStatusUpdateCallback = null;
  const mockSoundInstance = {
    loadAsync: jest.fn().mockResolvedValue({ isLoaded: true, isPlaying: false }),
    unloadAsync: jest.fn().mockResolvedValue({ isLoaded: false }),
    playAsync: jest.fn().mockImplementation(async () => {
      if (mockStatusUpdateCallback) {
        mockStatusUpdateCallback({ isLoaded: true, isPlaying: true, positionMillis: 0, durationMillis: 180000 });
      }
      return { isLoaded: true, isPlaying: true };
    }),
    pauseAsync: jest.fn().mockImplementation(async () => {
      if (mockStatusUpdateCallback) {
        mockStatusUpdateCallback({ isLoaded: true, isPlaying: false, positionMillis: 1000, durationMillis: 180000 });
      }
      return { isLoaded: true, isPlaying: false };
    }),
    stopAsync: jest.fn().mockResolvedValue({ isLoaded: true, isPlaying: false, positionMillis: 0 }),
    setPositionAsync: jest.fn().mockImplementation(async (pos) => {
      if (mockStatusUpdateCallback) {
        mockStatusUpdateCallback({ isLoaded: true, isPlaying: true, positionMillis: pos, durationMillis: 180000 });
      }
      return { isLoaded: true, positionMillis: pos };
    }),
    setOnPlaybackStatusUpdate: jest.fn().mockImplementation((cb) => {
      mockStatusUpdateCallback = cb;
    }),
    setIsLoopingAsync: jest.fn().mockResolvedValue({ isLoaded: true }),
    setVolumeAsync: jest.fn().mockResolvedValue({ isLoaded: true }),
    getStatusAsync: jest.fn().mockResolvedValue({ isLoaded: true, isPlaying: false, positionMillis: 0, durationMillis: 180000 }),
  };

  return {
    Audio: {
      Sound: {
        createAsync: jest.fn().mockResolvedValue({
          sound: mockSoundInstance,
          status: { isLoaded: true, isPlaying: false, positionMillis: 0, durationMillis: 180000 },
        }),
      },
      setAudioModeAsync: jest.fn().mockResolvedValue({}),
    },
    InterruptionModeIOS: { DoNotMix: 1, DuckOthers: 2 },
    InterruptionModeAndroid: { DoNotMix: 1, DuckOthers: 2 },
  };
});

// Mock expo-network
jest.mock('expo-network', () => ({
  getNetworkStateAsync: jest.fn().mockResolvedValue({
    isConnected: true,
    isInternetReachable: true,
  }),
  addNetworkStateListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
}));

// Mock expo-file-system
jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///data/user/0/com.yourmusic.app/files/',
  cacheDirectory: 'file:///data/user/0/com.yourmusic.app/cache/',
  downloadAsync: jest.fn().mockResolvedValue({ uri: 'file:///data/user/0/com.yourmusic.app/files/tracks/track_1.mp3', status: 200 }),
  deleteAsync: jest.fn().mockResolvedValue(true),
  getInfoAsync: jest.fn().mockResolvedValue({ exists: true, size: 5242880 }),
  makeDirectoryAsync: jest.fn().mockResolvedValue(true),
  readDirectoryAsync: jest.fn().mockResolvedValue(['track_1.mp3']),
  createDownloadResumable: jest.fn().mockImplementation((url, fileUri, options, callback) => ({
    downloadAsync: jest.fn().mockImplementation(async () => {
      if (callback) {
        callback({ totalBytesWritten: 500000, totalBytesExpectedToWrite: 1000000 });
      }
      return { uri: fileUri, status: 200 };
    }),
  })),
}));

// Mock expo-sharing
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn().mockResolvedValue(true),
}));

// In-Memory SQLite Mock Store for Tests
jest.mock('expo-sqlite', () => {
  const tracksStore = new Map();
  const favoritesStore = new Set();
  const historyStore = [];
  const playlistsStore = new Map();
  const playlistTracksStore = [];
  const downloadsStore = new Map();
  const migrationsStore = new Set([1]);

  return {
    openDatabaseSync: jest.fn().mockReturnValue({
      execSync: jest.fn(),
      runSync: jest.fn((sql, params = []) => {
        const lowerSql = sql.toLowerCase();
        if (lowerSql.includes('insert into tracks')) {
          const [id, title, artist, album, artwork, url, duration, genre, lyrics, is_downloaded, local_uri, play_count] = params;
          tracksStore.set(id, { id, title, artist, album, artwork, url, duration, genre, lyrics, is_downloaded, local_uri, play_count });
        } else if (lowerSql.includes('insert into favorites')) {
          favoritesStore.add(params[0]);
        } else if (lowerSql.includes('delete from favorites')) {
          favoritesStore.delete(params[0]);
        } else if (lowerSql.includes('insert into history')) {
          historyStore.push({ track_id: params[0], played_at: params[1] });
        } else if (lowerSql.includes('delete from history')) {
          historyStore.length = 0;
        } else if (lowerSql.includes('insert into playlists')) {
          const [id, title, description, cover_image, created_at] = params;
          playlistsStore.set(id, { id, title, description, cover_image, created_at, is_custom: 1 });
        } else if (lowerSql.includes('delete from playlists')) {
          playlistsStore.delete(params[0]);
        } else if (lowerSql.includes('insert into playlist_tracks')) {
          playlistTracksStore.push({ playlist_id: params[0], track_id: params[1], position: params[2] });
        } else if (lowerSql.includes('delete from playlist_tracks')) {
          const pId = params[0];
          const tId = params[1];
          const idx = playlistTracksStore.findIndex((pt) => pt.playlist_id === pId && (!tId || pt.track_id === tId));
          if (idx !== -1) playlistTracksStore.splice(idx, 1);
        } else if (lowerSql.includes('insert into downloads')) {
          downloadsStore.set(params[0], { track_id: params[0], local_uri: params[1], file_size: params[2], downloaded_at: params[3] });
        } else if (lowerSql.includes('delete from downloads')) {
          downloadsStore.delete(params[0]);
        }
        return { changes: 1, lastInsertRowId: 1 };
      }),
      getFirstSync: jest.fn((sql, params = []) => {
        const lowerSql = sql.toLowerCase();
        if (lowerSql.includes('from tracks where id = ?')) {
          return tracksStore.get(params[0]) || null;
        }
        if (lowerSql.includes('from favorites where track_id = ?')) {
          return favoritesStore.has(params[0]) ? { track_id: params[0] } : null;
        }
        if (lowerSql.includes('from playlists where id = ?')) {
          return playlistsStore.get(params[0]) || null;
        }
        return null;
      }),
      getAllSync: jest.fn((sql, params = []) => {
        const lowerSql = sql.toLowerCase();
        if (lowerSql.includes('sqlite_master')) {
          return [{ name: 'tracks' }, { name: 'playlists' }, { name: 'favorites' }, { name: 'history' }, { name: 'downloads' }];
        }
        if (lowerSql.includes('from schema_migrations')) {
          return Array.from(migrationsStore).map((v) => ({ version: v }));
        }
        if (lowerSql.includes('from tracks t inner join favorites')) {
          return Array.from(favoritesStore).map((id) => tracksStore.get(id)).filter(Boolean);
        }
        if (lowerSql.includes('from tracks t inner join history')) {
          return historyStore.map((h) => tracksStore.get(h.track_id)).filter(Boolean);
        }
        if (lowerSql.includes('from playlists')) {
          return Array.from(playlistsStore.values());
        }
        if (lowerSql.includes('from tracks t inner join playlist_tracks')) {
          const pId = params[0];
          const trackIds = playlistTracksStore.filter((pt) => pt.playlist_id === pId).map((pt) => pt.track_id);
          return trackIds.map((id) => tracksStore.get(id)).filter(Boolean);
        }
        if (lowerSql.includes('from tracks t inner join downloads')) {
          return Array.from(downloadsStore.values()).map((d) => {
            const t = tracksStore.get(d.track_id);
            return t ? { ...t, d_local_uri: d.local_uri } : null;
          }).filter(Boolean);
        }
        return [];
      }),
      withTransactionSync: jest.fn((callback) => callback()),
    }),
  };
});

// Mock react-native-screens & safe-area-context
jest.mock('react-native-screens', () => ({
  enableScreens: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: ({ children }) => children,
    useSafeAreaInsets: () => inset,
  };
});
