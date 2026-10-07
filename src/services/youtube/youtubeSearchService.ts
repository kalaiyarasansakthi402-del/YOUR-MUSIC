import { youtubeProvider, parseIsoDuration } from '../api/youtubeProvider';
import { UnifiedSearchResult, Track } from '../../types';
import { youtubeConfig } from '../api/youtubeConfig';

export class YouTubeSearchService {
  public async searchTracks(query: string, pageToken?: string): Promise<Track[]> {
    const res = await youtubeProvider.search(query, 'tracks', pageToken);
    return res.tracks;
  }

  public async searchAll(
    query: string,
    filter: 'all' | 'tracks' | 'artists' | 'albums' = 'all',
    pageToken?: string
  ): Promise<UnifiedSearchResult> {
    return youtubeProvider.search(query, filter, pageToken);
  }

  public parseDuration(isoString?: string): number {
    return parseIsoDuration(isoString);
  }

  public async isAvailable(): Promise<boolean> {
    return youtubeConfig.isConfigured();
  }
}

export const youtubeSearchService = new YouTubeSearchService();
