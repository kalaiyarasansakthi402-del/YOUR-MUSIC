export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  artwork: string;
  url: string;
  duration: number; // in seconds
  genre?: string;
  lyrics?: string;
  isDownloaded?: boolean;
  localUri?: string;
  isFavorite?: boolean;
  playCount?: number;
  addedAt?: number;
  source?: 'catalog' | 'youtube';
  youtubeVideoId?: string;
  channelId?: string;
  publishedAt?: string;
  description?: string;
}

export interface Artist {
  id: string;
  name: string;
  image: string;
  bio?: string;
  genres?: string[];
  trackCount?: number;
  channelId?: string;
  source?: 'catalog' | 'youtube';
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  artwork: string;
  year?: number;
  genre?: string;
  tracks?: Track[];
  playlistId?: string;
  source?: 'catalog' | 'youtube';
}

export interface Playlist {
  id: string;
  title: string;
  description?: string;
  coverImage?: string;
  createdAt: number;
  tracks: Track[];
  isCustom?: boolean;
  source?: 'catalog' | 'youtube';
}

export type RepeatMode = 'off' | 'one' | 'all';

export interface PlaybackState {
  currentTrack: Track | null;
  isPlaying: boolean;
  isBuffering: boolean;
  position: number; // in seconds
  duration: number; // in seconds
  playbackRate: number;
  volume: number;
  isMuted: boolean;
  shuffle: boolean;
  repeatMode: RepeatMode;
  queue: Track[];
  queueIndex: number;
  error: string | null;
}

export type ThemeMode = 'light' | 'dark' | 'system';
export type Language = 'en' | 'ta' | 'es' | 'pt';
export type SearchSource = 'catalog' | 'youtube';

export interface UserSettings {
  theme: ThemeMode;
  language: Language;
  audioQuality: 'low' | 'medium' | 'high';
  offlineModeOnly: boolean;
  streamOverWifiOnly: boolean;
  autoDownloadFavorites: boolean;
  sleepTimer: number | null; // in minutes
  youtubeApiKey?: string;
  defaultSearchSource: SearchSource;
}

export interface YouTubeSearchItem {
  id: {
    kind: string;
    videoId?: string;
    channelId?: string;
    playlistId?: string;
  };
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      default?: { url: string; width?: number; height?: number };
      medium?: { url: string; width?: number; height?: number };
      high?: { url: string; width?: number; height?: number };
    };
    channelTitle: string;
    liveBroadcastContent?: string;
  };
}

export interface YouTubeSearchResponse {
  kind: string;
  etag: string;
  nextPageToken?: string;
  prevPageToken?: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: YouTubeSearchItem[];
}

export interface UnifiedSearchResult {
  tracks: Track[];
  artists: Artist[];
  albums: Album[];
  nextPageToken?: string;
  totalResults?: number;
  source: SearchSource;
  error?: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  context?: Record<string, unknown>;
}

export interface SystemDiagnostics {
  version: string;
  typeScriptStatus: 'PASS' | 'FAIL';
  lintStatus: 'PASS' | 'FAIL';
  testStatus: 'PASS' | 'FAIL';
  expoDoctorStatus: 'PASS' | 'FAIL';
  androidBuildStatus: 'PASS' | 'FAIL';
  apkStatus: 'GENERATED' | 'READY';
  criticalBugs: number;
  knownIssues: string[];
  lastVerified: string;
  storageUsageMb: number;
}
