import * as FileSystem from 'expo-file-system';
import * as Network from 'expo-network';
import { database } from '../database/database';
import { Track } from '../../types';
import { logger } from '../../utils/logger';

class OfflineManager {
  private isOnline = true;
  private listeners: ((isOnline: boolean) => void)[] = [];

  public async init(): Promise<void> {
    try {
      const state = await Network.getNetworkStateAsync();
      this.isOnline = !!(state.isConnected && state.isInternetReachable);

      Network.addNetworkStateListener((networkState) => {
        const online = !!(networkState.isConnected && networkState.isInternetReachable);
        if (this.isOnline !== online) {
          this.isOnline = online;
          logger.info(`Network state changed: ${online ? 'ONLINE' : 'OFFLINE'}`);
          this.notifyListeners(online);
        }
      });
    } catch (error) {
      logger.warn('Failed to initialize Network listener', { error: String(error) });
      this.isOnline = true; // safe fallback
    }
  }

  public getIsOnline(): boolean {
    return this.isOnline;
  }

  public subscribe(listener: (isOnline: boolean) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(isOnline: boolean): void {
    this.listeners.forEach((l) => l(isOnline));
  }

  // --- DOWNLOAD MANAGER ---
  public async downloadTrack(
    track: Track,
    onProgress?: (percent: number) => void
  ): Promise<string> {
    try {
      logger.info(`Starting download for track: ${track.title} (${track.id})`);
      const tracksDir = `${FileSystem.documentDirectory}tracks/`;
      const dirInfo = await FileSystem.getInfoAsync(tracksDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(tracksDir, { intermediates: true });
      }

      const cleanFileName = `track_${track.id.replace(/[^a-zA-Z0-9_-]/g, '_')}.mp3`;
      const targetUri = `${tracksDir}${cleanFileName}`;

      let downloadedUri = targetUri;

      if (typeof FileSystem.createDownloadResumable === 'function') {
        const downloadResumable = FileSystem.createDownloadResumable(
          track.url,
          targetUri,
          {},
          (downloadProgress) => {
            if (downloadProgress.totalBytesExpectedToWrite > 0 && onProgress) {
              const progress =
                (downloadProgress.totalBytesWritten /
                  downloadProgress.totalBytesExpectedToWrite) *
                100;
              onProgress(Math.min(100, Math.max(0, progress)));
            }
          }
        );

        const result = await downloadResumable.downloadAsync();
        if (!result || !result.uri) {
          throw new Error('Download failed: No file URI returned from downloadResumable');
        }
        downloadedUri = result.uri;
      } else {
        const res = await FileSystem.downloadAsync(track.url, targetUri);
        downloadedUri = res.uri;
        if (onProgress) onProgress(100);
      }

      const fileInfo = await FileSystem.getInfoAsync(downloadedUri);
      const fileSize = fileInfo.exists && 'size' in fileInfo ? fileInfo.size || 0 : 0;

      // Save to SQLite database
      database.saveDownload(track, downloadedUri, fileSize);
      logger.info(`Successfully downloaded track: ${track.title} -> ${downloadedUri}`);
      return downloadedUri;
    } catch (error) {
      logger.error(`Download failed for track: ${track.title}`, { error: String(error) });
      throw error;
    }
  }

  public async deleteDownloadedTrack(trackId: string): Promise<void> {
    try {
      const tracks = database.getDownloads();
      const target = tracks.find((t) => t.id === trackId);
      if (target && target.localUri) {
        const fileInfo = await FileSystem.getInfoAsync(target.localUri);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(target.localUri, { idempotent: true });
        }
      }
      database.removeDownload(trackId);
      logger.info(`Deleted downloaded track: ${trackId}`);
    } catch (error) {
      logger.error(`Failed to delete downloaded track: ${trackId}`, { error: String(error) });
      throw error;
    }
  }

  public async getStorageUsageMb(): Promise<number> {
    try {
      const tracksDir = `${FileSystem.documentDirectory}tracks/`;
      const dirInfo = await FileSystem.getInfoAsync(tracksDir);
      if (!dirInfo.exists) return 0;

      const files = await FileSystem.readDirectoryAsync(tracksDir);
      let totalBytes = 0;
      for (const file of files) {
        const fInfo = await FileSystem.getInfoAsync(`${tracksDir}${file}`);
        if (fInfo.exists && 'size' in fInfo && fInfo.size) {
          totalBytes += fInfo.size;
        }
      }
      return Math.round((totalBytes / (1024 * 1024)) * 100) / 100;
    } catch {
      return 0;
    }
  }

  public async clearCache(): Promise<void> {
    try {
      const cacheDir = FileSystem.cacheDirectory;
      if (cacheDir) {
        const files = await FileSystem.readDirectoryAsync(cacheDir);
        for (const file of files) {
          await FileSystem.deleteAsync(`${cacheDir}${file}`, { idempotent: true });
        }
      }
      logger.info('Cache cleared successfully');
    } catch (error) {
      logger.error('Failed to clear cache', { error: String(error) });
    }
  }
}

export const offlineManager = new OfflineManager();
