import { googleAuthService } from '../auth/GoogleAuthService';
import { Playlist, Artist, Track } from '../../types';
import { logger } from '../../utils/logger';

export interface YouTubeUserProfile {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
  connectedToYouTube: boolean;
}

interface YouTubeRawPlaylistItem {
  id: string;
  snippet?: {
    title?: string;
    description?: string;
    thumbnails?: {
      high?: { url?: string };
      medium?: { url?: string };
      default?: { url?: string };
    };
    publishedAt?: string;
  };
}

interface YouTubeRawSubscriptionItem {
  id: string;
  snippet?: {
    title?: string;
    description?: string;
    thumbnails?: {
      high?: { url?: string };
      medium?: { url?: string };
      default?: { url?: string };
    };
    resourceId?: {
      channelId?: string;
    };
  };
}

export class YouTubeAuthService {
  /**
   * Check if a Google user is authenticated
   */
  public isAuthenticated(): boolean {
    const user = googleAuthService.getCurrentUser();
    return !!user && !!user.accessToken;
  }

  /**
   * Check if the authenticated user has authorized YouTube scope
   */
  public hasYouTubeScope(): boolean {
    const user = googleAuthService.getCurrentUser();
    return !!user?.connectedToYouTube;
  }

  /**
   * Get the current user profile
   */
  public getUserProfile(): YouTubeUserProfile | null {
    const user = googleAuthService.getCurrentUser();
    if (!user) return null;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      photoUrl: user.photoUrl,
      connectedToYouTube: user.connectedToYouTube,
    };
  }

  /**
   * Get authorization headers for authenticated YouTube API requests
   */
  public getAuthHeaders(): Record<string, string> | null {
    const user = googleAuthService.getCurrentUser();
    if (!user?.accessToken) return null;
    return {
      Authorization: `Bearer ${user.accessToken}`,
      Accept: 'application/json',
    };
  }

  /**
   * Fetch authenticated user's YouTube playlists
   * Scope: https://www.googleapis.com/auth/youtube.readonly
   */
  public async getUserPlaylists(): Promise<Playlist[]> {
    const headers = this.getAuthHeaders();
    if (!headers || !this.hasYouTubeScope()) {
      logger.info('YOUTUBE_USER_PLAYLISTS_SKIP: User not authenticated or YouTube scope not granted');
      return [];
    }

    logger.info('YOUTUBE_USER_PLAYLISTS_START: Fetching authenticated user playlists');

    try {
      const url = 'https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&mine=true&maxResults=25';
      const response = await fetch(url, { headers });

      if (response.status === 401) {
        logger.warn('YOUTUBE_AUTH_EXPIRED: OAuth token expired or revoked');
        return [];
      }

      if (!response.ok) {
        logger.error('YOUTUBE_USER_PLAYLISTS_ERROR: Failed to fetch playlists', {
          status: response.status,
        });
        return [];
      }

      const data = await response.json();
      const items = data.items || [];

      const playlists: Playlist[] = items.map((item: YouTubeRawPlaylistItem) => ({
        id: item.id,
        title: item.snippet?.title || 'YouTube Playlist',
        description: item.snippet?.description || '',
        coverImage:
          item.snippet?.thumbnails?.high?.url ||
          item.snippet?.thumbnails?.medium?.url ||
          item.snippet?.thumbnails?.default?.url ||
          '',
        createdAt: item.snippet?.publishedAt
          ? Math.floor(new Date(item.snippet.publishedAt).getTime() / 1000)
          : Math.floor(Date.now() / 1000),
        tracks: [] as Track[],
        isCustom: false,
        source: 'youtube',
      }));

      logger.info('YOUTUBE_USER_PLAYLISTS_SUCCESS', { count: playlists.length });
      return playlists;
    } catch (error) {
      logger.error('YOUTUBE_USER_PLAYLISTS_ERROR', { error: String(error) });
      return [];
    }
  }

  /**
   * Fetch authenticated user's subscribed YouTube channels/artists
   */
  public async getUserSubscriptions(): Promise<Artist[]> {
    const headers = this.getAuthHeaders();
    if (!headers || !this.hasYouTubeScope()) {
      return [];
    }

    try {
      const url = 'https://www.googleapis.com/youtube/v3/subscriptions?part=snippet&mine=true&maxResults=25';
      const response = await fetch(url, { headers });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      const items = data.items || [];

      const artists: Artist[] = items.map((item: YouTubeRawSubscriptionItem) => ({
        id: item.snippet?.resourceId?.channelId || item.id,
        name: item.snippet?.title || 'Channel',
        image:
          item.snippet?.thumbnails?.high?.url ||
          item.snippet?.thumbnails?.medium?.url ||
          item.snippet?.thumbnails?.default?.url ||
          '',
        bio: item.snippet?.description || '',
        channelId: item.snippet?.resourceId?.channelId,
        source: 'youtube',
      }));

      return artists;
    } catch (error) {
      logger.error('YOUTUBE_SUBSCRIPTIONS_ERROR', { error: String(error) });
      return [];
    }
  }

  /**
   * Sign out current user
   */
  public async signOut(): Promise<void> {
    await googleAuthService.signOutGoogle();
  }
}

export const youtubeAuthService = new YouTubeAuthService();
