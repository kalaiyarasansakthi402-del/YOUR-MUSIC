import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { logger } from '../../utils/logger';

export const YOUTUBE_API_KEY_STORAGE = '@your_music_yt_api_key';
export const NOT_CONFIGURED_MESSAGE = 'YouTube API is not configured.\nPlease configure YOUTUBE_API_KEY.';

export interface ConfigValidationResult {
  configured: boolean;
  source: 'environment' | 'storage' | 'none';
  envVarName: 'YOUTUBE_API_KEY';
}

export class YouTubeConfigService {
  private customApiKey: string | null = null;

  /**
   * Set or override API key in memory (e.g. for testing)
   */
  public setApiKey(key: string | null): void {
    this.customApiKey = key ? key.trim() : null;
  }

  /**
   * Automatically resolve the YouTube API key from Environment, Expo Config, or Storage.
   * Never logs the actual key value.
   */
  public async getApiKey(): Promise<string | null> {
    // 1. In-memory override
    if (this.customApiKey) {
      return this.customApiKey;
    }

    // 2. Persistent AsyncStorage
    try {
      const savedKey = await AsyncStorage.getItem(YOUTUBE_API_KEY_STORAGE);
      if (savedKey && savedKey.trim().length > 0) {
        this.customApiKey = savedKey.trim();
        return this.customApiKey;
      }
    } catch {
      // Storage unavailable or error, fall through
    }

    // 3. Expo Constants extra configuration
    try {
      const expoExtra = Constants.expoConfig?.extra as Record<string, unknown> | undefined;
      if (expoExtra && typeof expoExtra.youtubeApiKey === 'string' && expoExtra.youtubeApiKey.trim().length > 0) {
        return expoExtra.youtubeApiKey.trim();
      }
    } catch {
      // Ignore
    }

    // 4. Process environment variables (supports YOUTUBE_API_KEY and EXPO_PUBLIC_YOUTUBE_API_KEY)
    const env = (typeof process !== 'undefined' && process.env ? process.env : {}) as Record<string, string | undefined>;
    const envKey = env['YOUTUBE_API_KEY'] || env['EXPO_PUBLIC_YOUTUBE_API_KEY'] || null;

    if (envKey && envKey.trim().length > 0) {
      return envKey.trim();
    }

    return null;
  }

  /**
   * Check whether YouTube Data API key is available
   */
  public async isConfigured(): Promise<boolean> {
    const key = await this.getApiKey();
    return Boolean(key && key.length > 0);
  }

  /**
   * Save API key in persistent storage
   */
  public async saveApiKey(key: string): Promise<void> {
    const clean = key.trim();
    this.setApiKey(clean);
    await AsyncStorage.setItem(YOUTUBE_API_KEY_STORAGE, clean);
    logger.info('YouTube API key configured successfully.');
  }

  /**
   * Remove stored API key
   */
  public async removeApiKey(): Promise<void> {
    this.setApiKey(null);
    await AsyncStorage.removeItem(YOUTUBE_API_KEY_STORAGE);
    logger.info('YouTube API key removed.');
  }

  /**
   * Check the source and status of YouTube API key without exposing its value
   */
  public async validateStatus(): Promise<ConfigValidationResult> {
    if (this.customApiKey) {
      return { configured: true, source: 'storage', envVarName: 'YOUTUBE_API_KEY' };
    }

    try {
      const savedKey = await AsyncStorage.getItem(YOUTUBE_API_KEY_STORAGE);
      if (savedKey && savedKey.trim().length > 0) {
        return { configured: true, source: 'storage', envVarName: 'YOUTUBE_API_KEY' };
      }
    } catch {
      // ignore
    }

    const env = (typeof process !== 'undefined' && process.env ? process.env : {}) as Record<string, string | undefined>;
    if (env['YOUTUBE_API_KEY'] || env['EXPO_PUBLIC_YOUTUBE_API_KEY']) {
      return { configured: true, source: 'environment', envVarName: 'YOUTUBE_API_KEY' };
    }

    return { configured: false, source: 'none', envVarName: 'YOUTUBE_API_KEY' };
  }

  /**
   * Standardized unconfigured prompt message
   */
  public getNotConfiguredMessage(): string {
    return NOT_CONFIGURED_MESSAGE;
  }

  /**
   * Returns mobile security notice & best practices documentation
   */
  public getSecurityNotice(): string {
    return (
      'Mobile Client Security Notice: API keys bundled into client applications are subject to inspection. ' +
      'Always restrict your Google Cloud YouTube Data API key to Android applications with package name ' +
      'com.yourmusic.app and your SHA-1 signing certificate fingerprint. ' +
      'For enterprise deployments requiring complete credential isolation, route requests through a secure backend proxy.'
    );
  }
}

export const youtubeConfig = new YouTubeConfigService();
