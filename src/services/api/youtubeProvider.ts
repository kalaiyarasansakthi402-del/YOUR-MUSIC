import {
  Track,
  Artist,
  Album,
  YouTubeSearchResponse,
  UnifiedSearchResult,
} from '../../types';
import { logger } from '../../utils/logger';
import { youtubeConfig } from './youtubeConfig';

export class YouTubeApiError extends Error {
  public code: 'MISSING_API_KEY' | 'QUOTA_EXCEEDED' | 'NETWORK_ERROR' | 'INVALID_REQUEST' | 'UNKNOWN';
  constructor(message: string, code: YouTubeApiError['code']) {
    super(message);
    this.name = 'YouTubeApiError';
    this.code = code;
  }
}

/**
 * Parses an ISO 8601 duration string (e.g. "PT3M45S", "PT1H2M10S", "PT45S") to total seconds.
 */
export function parseIsoDuration(durationStr?: string): number {
  if (!durationStr || typeof durationStr !== 'string') return 0;
  const regex = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/i;
  const matches = durationStr.match(regex);
  if (!matches) return 0;
  const days = parseInt(matches[1] || '0', 10);
  const hours = parseInt(matches[2] || '0', 10);
  const minutes = parseInt(matches[3] || '0', 10);
  const seconds = parseInt(matches[4] || '0', 10);
  return days * 86400 + hours * 3600 + minutes * 60 + seconds;
}

interface CacheEntry {
  data: UnifiedSearchResult;
  timestamp: number;
}

export class YouTubeProvider {
  private cache = new Map<string, CacheEntry>();
  private cacheTtlMs = 5 * 60 * 1000; // 5 minutes TTL
  private timeoutMs = 10000; // 10s timeout

  public setApiKey(key: string | null): void {
    youtubeConfig.setApiKey(key);
    this.cache.clear();
  }

  public async getApiKey(): Promise<string | null> {
    return youtubeConfig.getApiKey();
  }

  public async saveApiKey(key: string): Promise<void> {
    this.cache.clear();
    await youtubeConfig.saveApiKey(key);
  }

  public async removeApiKey(): Promise<void> {
    this.cache.clear();
    await youtubeConfig.removeApiKey();
  }

  public decodeHtmlEntities(text: string): string {
    if (!text) return '';
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec));
  }

  /**
   * Enrich video tracks with accurate duration using the videos endpoint
   * (consumes only 1 quota unit for up to 50 items)
   */
  public async enrichTrackDurations(tracks: Track[], apiKey: string): Promise<void> {
    const videoTracks = tracks.filter((t) => t.videoId || t.youtubeVideoId);
    if (videoTracks.length === 0) return;

    const ids = videoTracks
      .map((t) => t.videoId || t.youtubeVideoId)
      .filter((id): id is string => Boolean(id));

    if (ids.length === 0) return;

    try {
      const url = new URL('https://www.googleapis.com/youtube/v3/videos');
      url.searchParams.set('part', 'contentDetails');
      url.searchParams.set('id', ids.slice(0, 50).join(','));
      url.searchParams.set('key', apiKey);

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(url.toString(), {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timer);

      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.items)) {
          const durationMap = new Map<string, number>();
          for (const item of json.items) {
            if (item.id && item.contentDetails?.duration) {
              const seconds = parseIsoDuration(item.contentDetails.duration);
              durationMap.set(item.id, seconds);
            }
          }

          for (const track of videoTracks) {
            const vid = track.videoId || track.youtubeVideoId;
            if (vid && durationMap.has(vid)) {
              track.duration = durationMap.get(vid) || 0;
            }
          }
        }
      }
    } catch {
      // Non-blocking fallback: duration enrichment is best effort
    }
  }

  /**
   * Search YouTube Data API v3 with automatic caching, retries, and quota handling
   */
  public async search(
    query: string,
    filter: 'all' | 'tracks' | 'artists' | 'albums' = 'all',
    pageToken?: string
  ): Promise<UnifiedSearchResult> {
    const trimmed = query.trim();
    if (!trimmed) {
      return {
        tracks: [],
        artists: [],
        albums: [],
        source: 'youtube',
      };
    }

    const apiKey = await youtubeConfig.getApiKey();
    if (!apiKey) {
      logger.warn('YouTube search attempted without configured YOUTUBE_API_KEY');
      return {
        tracks: [],
        artists: [],
        albums: [],
        source: 'youtube',
        error: youtubeConfig.getNotConfiguredMessage(),
      };
    }

    // Check memory cache to protect API quota
    const cacheKey = `${trimmed.toLowerCase()}_${filter}_${pageToken || 'p0'}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTtlMs) {
      logger.info('YOUTUBE_SEARCH_SUCCESS', {
        query: trimmed,
        fromCache: true,
        tracksCount: cached.data.tracks.length,
      });
      return cached.data;
    }

    logger.info('YOUTUBE_SEARCH_START', { query: trimmed, filter, pageToken });

    let typeParam = 'video,channel,playlist';
    if (filter === 'tracks') typeParam = 'video';
    else if (filter === 'artists') typeParam = 'channel';
    else if (filter === 'albums') typeParam = 'playlist';

    const url = new URL('https://www.googleapis.com/youtube/v3/search');
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('maxResults', '20');
    url.searchParams.set('q', trimmed);
    url.searchParams.set('type', typeParam);
    if (filter === 'tracks' || filter === 'all') {
      url.searchParams.set('videoCategoryId', '10'); // Music category
    }
    if (pageToken) {
      url.searchParams.set('pageToken', pageToken);
    }
    url.searchParams.set('key', apiKey);

    // Attempt request with automatic retry for transient network glitches
    const maxAttempts = 2;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        logger.info(`Executing YouTube Data API v3 search (attempt ${attempt}): "${trimmed}"`);
        const response = await fetch(url.toString(), {
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
          },
        });
        clearTimeout(timer);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errReason = errorData?.error?.errors?.[0]?.reason || '';
          const errMsg = errorData?.error?.message || response.statusText;

          if (response.status === 403 && (errReason === 'quotaExceeded' || errReason === 'dailyLimitExceeded')) {
            logger.error('YOUTUBE_SEARCH_ERROR', { error: 'quotaExceeded', message: errMsg });
            return {
              tracks: [],
              artists: [],
              albums: [],
              source: 'youtube',
              error: 'YouTube API quota exceeded. Please try again later or check your API quota.',
            };
          }

          if (response.status === 400) {
            logger.error('YOUTUBE_SEARCH_ERROR', { error: 'invalidRequest', message: errMsg });
            return {
              tracks: [],
              artists: [],
              albums: [],
              source: 'youtube',
              error: 'Invalid YouTube search request. Check your API key or query parameters.',
            };
          }

          throw new YouTubeApiError(`YouTube API error: ${response.status} ${errMsg}`, 'NETWORK_ERROR');
        }

        const data: YouTubeSearchResponse = await response.json();
        const mapped = this.mapResponse(data);

        // Enrich video tracks with accurate duration if possible
        if (mapped.tracks.length > 0) {
          await this.enrichTrackDurations(mapped.tracks, apiKey);
        }

        // Cache result to protect quota
        this.cache.set(cacheKey, { data: mapped, timestamp: Date.now() });

        logger.info('YOUTUBE_SEARCH_SUCCESS', {
          query: trimmed,
          tracksCount: mapped.tracks.length,
          artistsCount: mapped.artists.length,
          albumsCount: mapped.albums.length,
        });

        return mapped;
      } catch (error: unknown) {
        clearTimeout(timer);
        const err = error as Error;
        lastError = err;

        if (err.name === 'AbortError') {
          logger.error('YOUTUBE_SEARCH_ERROR', { query: trimmed, error: 'Request timed out' });
          return {
            tracks: [],
            artists: [],
            albums: [],
            source: 'youtube',
            error: 'YouTube search timed out. Please check your internet connection.',
          };
        }

        // On transient network errors on first attempt, wait briefly and retry
        if (attempt < maxAttempts) {
          logger.warn(`Retrying YouTube search query "${trimmed}" after error: ${err.message}`);
          await new Promise((resolve) => setTimeout(resolve, 500));
          continue;
        }
      }
    }

    logger.error('YOUTUBE_SEARCH_ERROR', { query: trimmed, error: lastError?.message });
    return {
      tracks: [],
      artists: [],
      albums: [],
      source: 'youtube',
      error: lastError?.message || 'Failed to fetch YouTube music search results.',
    };
  }

  public mapResponse(data: YouTubeSearchResponse): UnifiedSearchResult {
    const tracks: Track[] = [];
    const artists: Artist[] = [];
    const albums: Album[] = [];

    if (!data || !Array.isArray(data.items)) {
      return { tracks, artists, albums, source: 'youtube' };
    }

    for (const item of data.items) {
      const snippet = item.snippet;
      if (!snippet) continue;

      const title = this.decodeHtmlEntities(snippet.title);
      const channelTitle = this.decodeHtmlEntities(snippet.channelTitle);
      const artwork =
        snippet.thumbnails?.high?.url ||
        snippet.thumbnails?.medium?.url ||
        snippet.thumbnails?.default?.url ||
        '';

      if (item.id.kind === 'youtube#video' && item.id.videoId) {
        tracks.push({
          id: `yt_${item.id.videoId}`,
          title,
          artist: channelTitle,
          album: 'YouTube Music',
          artwork,
          thumbnail: artwork,
          url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
          videoId: item.id.videoId,
          duration: 0,
          genre: 'YouTube Music',
          lyrics: snippet.description ? this.decodeHtmlEntities(snippet.description) : undefined,
          source: 'youtube',
          youtubeVideoId: item.id.videoId,
          channelId: snippet.channelId,
          publishedAt: snippet.publishedAt,
          description: this.decodeHtmlEntities(snippet.description),
        });
      } else if (item.id.kind === 'youtube#channel' && item.id.channelId) {
        artists.push({
          id: `yt_ch_${item.id.channelId}`,
          name: title,
          image: artwork,
          bio: this.decodeHtmlEntities(snippet.description),
          channelId: item.id.channelId,
          source: 'youtube',
          genres: ['YouTube Artist'],
        });
      } else if (item.id.kind === 'youtube#playlist' && item.id.playlistId) {
        albums.push({
          id: `yt_pl_${item.id.playlistId}`,
          title,
          artist: channelTitle,
          artwork,
          playlistId: item.id.playlistId,
          source: 'youtube',
          genre: 'YouTube Playlist',
        });
      }
    }

    return {
      tracks,
      artists,
      albums,
      nextPageToken: data.nextPageToken,
      totalResults: data.pageInfo?.totalResults,
      source: 'youtube',
    };
  }
}

export const youtubeProvider = new YouTubeProvider();
