import { youtubeProvider } from '../api/youtubeProvider';
import { Artist } from '../../types';

export class YouTubeArtistService {
  public async searchArtists(query: string, pageToken?: string): Promise<Artist[]> {
    const res = await youtubeProvider.search(query, 'artists', pageToken);
    return res.artists;
  }
}

export const youtubeArtistService = new YouTubeArtistService();
