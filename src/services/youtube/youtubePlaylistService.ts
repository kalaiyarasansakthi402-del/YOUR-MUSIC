import { youtubeProvider } from '../api/youtubeProvider';
import { Album } from '../../types';

export class YouTubePlaylistService {
  public async searchPlaylists(query: string, pageToken?: string): Promise<Album[]> {
    const res = await youtubeProvider.search(query, 'albums', pageToken);
    return res.albums;
  }
}

export const youtubePlaylistService = new YouTubePlaylistService();
