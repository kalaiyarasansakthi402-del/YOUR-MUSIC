import { youtubeConfig } from '../api/youtubeConfig';
import { logger } from '../../utils/logger';

export class YouTubeService {
  public async isConfigured(): Promise<boolean> {
    return youtubeConfig.isConfigured();
  }

  public async getApiKey(): Promise<string | null> {
    return youtubeConfig.getApiKey();
  }

  public async configureApiKey(key: string): Promise<void> {
    await youtubeConfig.saveApiKey(key);
  }

  public async removeApiKey(): Promise<void> {
    await youtubeConfig.removeApiKey();
  }

  public getNotConfiguredMessage(): string {
    return youtubeConfig.getNotConfiguredMessage();
  }

  public logQuotaNotice(endpoint: string, cost: number): void {
    logger.info('YOUTUBE_QUOTA_USAGE', { endpoint, quotaCost: cost });
  }
}

export const youtubeService = new YouTubeService();
