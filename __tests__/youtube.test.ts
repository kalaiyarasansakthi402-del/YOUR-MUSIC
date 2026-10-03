import AsyncStorage from '@react-native-async-storage/async-storage';
import { YouTubeProvider } from '../src/services/api/youtubeProvider';
import { youtubeConfig, YOUTUBE_API_KEY_STORAGE, NOT_CONFIGURED_MESSAGE } from '../src/services/api/youtubeConfig';
import { musicApi } from '../src/services/api/musicApi';
import { logger } from '../src/utils/logger';
import { YouTubeSearchResponse } from '../src/types';

describe('YouTube Data API v3 Provider & Integration Suite', () => {
  let provider: YouTubeProvider;
  const mockApiKey = 'AIzaSyMockTestKey12345678901234567';

  beforeEach(async () => {
    provider = new YouTubeProvider();
    await AsyncStorage.clear();
    youtubeConfig.setApiKey(null);
    delete process.env['EXPO_PUBLIC_YOUTUBE_API_KEY'];
    delete process.env['YOUTUBE_API_KEY'];
    jest.restoreAllMocks();
  });

  describe('API Key Configuration, Detection & Security', () => {
    it('detects when API key is missing', async () => {
      const isConfigured = await youtubeConfig.isConfigured();
      expect(isConfigured).toBe(false);

      const status = await youtubeConfig.validateStatus();
      expect(status.configured).toBe(false);
      expect(status.source).toBe('none');
      expect(status.envVarName).toBe('YOUTUBE_API_KEY');
    });

    it('automatically detects YOUTUBE_API_KEY from environment', async () => {
      process.env['YOUTUBE_API_KEY'] = mockApiKey;
      const key = await youtubeConfig.getApiKey();
      expect(key).toBe(mockApiKey);

      const status = await youtubeConfig.validateStatus();
      expect(status.configured).toBe(true);
      expect(status.source).toBe('environment');
    });

    it('saves and retrieves API key via AsyncStorage', async () => {
      await youtubeConfig.saveApiKey(mockApiKey);
      const key = await youtubeConfig.getApiKey();
      expect(key).toBe(mockApiKey);
      expect(await AsyncStorage.getItem(YOUTUBE_API_KEY_STORAGE)).toBe(mockApiKey);

      const status = await youtubeConfig.validateStatus();
      expect(status.configured).toBe(true);
      expect(status.source).toBe('storage');
    });

    it('removes API key correctly', async () => {
      await youtubeConfig.saveApiKey(mockApiKey);
      await youtubeConfig.removeApiKey();
      const key = await youtubeConfig.getApiKey();
      expect(key).toBeNull();
      expect(await AsyncStorage.getItem(YOUTUBE_API_KEY_STORAGE)).toBeNull();
    });

    it('ensures API key is NEVER logged in raw format', () => {
      const secretKey = 'AIzaSySecretApiKeyMustBeRedacted123';
      const sanitized = logger.sanitize(`Request with apiKey: ${secretKey}`) as string;
      expect(sanitized).not.toContain(secretKey);
      expect(sanitized).toContain('[REDACTED]');

      const contextObj = { youtube_api_key: secretKey, query: 'test' };
      const sanitizedObj = logger.sanitize(contextObj) as Record<string, unknown>;
      expect(sanitizedObj.youtube_api_key).toBe('[REDACTED]');
    });

    it('provides mobile client security guidance', () => {
      const notice = youtubeConfig.getSecurityNotice();
      expect(notice).toContain('com.yourmusic.app');
      expect(notice).toContain('SHA-1');
      expect(notice).toContain('backend proxy');
    });
  });

  describe('Search Execution & Error Handling', () => {
    it('returns empty result when query is empty without making API calls', async () => {
      const result = await provider.search('   ');
      expect(result.tracks).toHaveLength(0);
      expect(result.artists).toHaveLength(0);
      expect(result.albums).toHaveLength(0);
      expect(result.source).toBe('youtube');
    });

    it('returns exact prompt error when API key is missing', async () => {
      const result = await provider.search('coldplay');
      expect(result.error).toBe(NOT_CONFIGURED_MESSAGE);
      expect(result.tracks).toHaveLength(0);
    });

    it('maps YouTube search response correctly into tracks, artists, and playlists', async () => {
      provider.setApiKey(mockApiKey);

      const mockResponse: YouTubeSearchResponse = {
        kind: 'youtube#searchListResponse',
        etag: 'mock_etag_123',
        nextPageToken: 'NEXT_PAGE_TOKEN_ABC',
        pageInfo: {
          totalResults: 42,
          resultsPerPage: 3,
        },
        items: [
          {
            id: { kind: 'youtube#video', videoId: 'dQw4w9WgXcQ' },
            snippet: {
              publishedAt: '2026-01-15T12:00:00Z',
              channelId: 'UC_channel_123',
              title: 'Never Gonna Give You Up &amp; Dance',
              description: 'Official Music Video &quot;Remastered&#39; 2026&quot;',
              thumbnails: {
                high: { url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg' },
              },
              channelTitle: 'Rick Astley &amp; Band',
            },
          },
          {
            id: { kind: 'youtube#channel', channelId: 'UC_artist_channel' },
            snippet: {
              publishedAt: '2020-05-01T00:00:00Z',
              channelId: 'UC_artist_channel',
              title: 'The Synthwave Artist',
              description: 'Retro synth music producer &amp; composer',
              thumbnails: {
                high: { url: 'https://i.ytimg.com/channel/artist.jpg' },
              },
              channelTitle: 'The Synthwave Artist',
            },
          },
          {
            id: { kind: 'youtube#playlist', playlistId: 'PL_playlist_999' },
            snippet: {
              publishedAt: '2026-02-10T08:30:00Z',
              channelId: 'UC_creator',
              title: 'Top Hits 2026 Playlist',
              description: 'Best trending hits collection',
              thumbnails: {
                high: { url: 'https://i.ytimg.com/playlist/top.jpg' },
              },
              channelTitle: 'Music Charts Official',
            },
          },
        ],
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await provider.search('rick astley');

      expect(result.source).toBe('youtube');
      expect(result.nextPageToken).toBe('NEXT_PAGE_TOKEN_ABC');
      expect(result.totalResults).toBe(42);

      // Verify Video -> Track mapping & entity decoding
      expect(result.tracks).toHaveLength(1);
      const track = result.tracks[0];
      expect(track.id).toBe('yt_dQw4w9WgXcQ');
      expect(track.title).toBe('Never Gonna Give You Up & Dance'); // Decoded &amp;
      expect(track.artist).toBe('Rick Astley & Band');
      expect(track.url).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      expect(track.youtubeVideoId).toBe('dQw4w9WgXcQ');
      expect(track.channelId).toBe('UC_channel_123');
      expect(track.publishedAt).toBe('2026-01-15T12:00:00Z');
      expect(track.description).toBe('Official Music Video "Remastered\' 2026"');
      expect(track.artwork).toBe('https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
      expect(track.source).toBe('youtube');

      // Verify Channel -> Artist mapping
      expect(result.artists).toHaveLength(1);
      const artist = result.artists[0];
      expect(artist.id).toBe('yt_ch_UC_artist_channel');
      expect(artist.name).toBe('The Synthwave Artist');
      expect(artist.channelId).toBe('UC_artist_channel');
      expect(artist.bio).toBe('Retro synth music producer & composer');
      expect(artist.source).toBe('youtube');

      // Verify Playlist -> Album mapping
      expect(result.albums).toHaveLength(1);
      const album = result.albums[0];
      expect(album.id).toBe('yt_pl_PL_playlist_999');
      expect(album.title).toBe('Top Hits 2026 Playlist');
      expect(album.playlistId).toBe('PL_playlist_999');
      expect(album.artist).toBe('Music Charts Official');
      expect(album.source).toBe('youtube');
    });

    it('caches search results to prevent duplicate quota consumption', async () => {
      provider.setApiKey(mockApiKey);
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          kind: 'youtube#searchListResponse',
          items: [],
          pageInfo: { totalResults: 0, resultsPerPage: 20 },
        }),
      } as unknown as Response);
      global.fetch = mockFetch;

      // 1st search -> fetch called
      await provider.search('chillhop');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // 2nd search with same query -> hit cache, fetch NOT called again
      await provider.search('chillhop');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('retries once on transient network failures before failing', async () => {
      provider.setApiKey(mockApiKey);

      const transientError = new Error('Connection reset by peer');
      const mockFetch = jest.fn()
        .mockRejectedValueOnce(transientError)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            kind: 'youtube#searchListResponse',
            items: [],
            pageInfo: { totalResults: 0, resultsPerPage: 20 },
          }),
        } as unknown as Response);
      global.fetch = mockFetch;

      const result = await provider.search('synthwave retry');
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.source).toBe('youtube');
      expect(result.tracks).toHaveLength(0);
    });

    it('handles YouTube API quotaExceeded (403) gracefully', async () => {
      provider.setApiKey(mockApiKey);

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({
          error: {
            errors: [{ reason: 'quotaExceeded', message: 'Quota exceeded for project' }],
            message: 'Quota exceeded for project',
          },
        }),
      } as Response);

      const result = await provider.search('trending tracks');
      expect(result.tracks).toHaveLength(0);
      expect(result.error).toContain('YouTube API quota exceeded');
    });

    it('handles YouTube API invalid request (400) gracefully', async () => {
      provider.setApiKey(mockApiKey);

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({
          error: {
            message: 'API key not valid. Please pass a valid API key.',
          },
        }),
      } as Response);

      const result = await provider.search('invalid query');
      expect(result.error).toContain('Invalid YouTube search request');
    });

    it('handles network timeout abort gracefully', async () => {
      provider.setApiKey(mockApiKey);

      const abortError = new Error('The user aborted a request.');
      abortError.name = 'AbortError';
      global.fetch = jest.fn().mockRejectedValue(abortError);

      const result = await provider.search('slow request');
      expect(result.error).toContain('YouTube search timed out');
    });
  });

  describe('Repository Layer (ResilientMusicApi) Routing', () => {
    it('routes search to curated catalog by default', async () => {
      const result = await musicApi.search('Midnight');
      expect(result.source).toBe('catalog');
      expect(result.tracks.length).toBeGreaterThan(0);
      expect(result.tracks[0].title).toBe('Midnight Horizon');
    });

    it('routes search to YouTube provider when source is "youtube"', async () => {
      await musicApi.removeYouTubeApiKey();
      const result = await musicApi.search('Midnight', 'all', 'youtube');
      expect(result.source).toBe('youtube');
      expect(result.error).toBe(NOT_CONFIGURED_MESSAGE);
    });

    it('manages YouTube API key through musicApi repository methods', async () => {
      await musicApi.configureYouTubeApiKey('my_repo_api_key_777');
      const key = await musicApi.getYouTubeApiKey();
      expect(key).toBe('my_repo_api_key_777');

      await musicApi.removeYouTubeApiKey();
      const removedKey = await musicApi.getYouTubeApiKey();
      expect(removedKey).toBeNull();
    });
  });
});
