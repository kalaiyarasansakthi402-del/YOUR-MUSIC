import { Track, Artist, Album, UnifiedSearchResult, SearchSource } from '../../types';
import { logger } from '../../utils/logger';
import { youtubeProvider } from './youtubeProvider';

// Curated high quality royalty-free audio catalog (Creative Commons / Public Domain streamable MP3s)
const CURATED_TRACKS: Track[] = [
  {
    id: 'track_1',
    title: 'Midnight Horizon',
    artist: 'Aetheris',
    album: 'Neon Dreams',
    artwork: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600&auto=format&fit=crop&q=80',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    duration: 372,
    genre: 'Synthwave / Electronic',
    source: 'catalog',
    lyrics: '[00:12.00] Under the neon glow\n[00:24.00] Driving through the endless night\n[00:36.00] Neon city shadows fall\n[00:48.00] Electric heartbeats in the rain\n[01:00.00] Midnight horizon calls our name\n[01:15.00] Lost in the synthwave sound',
  },
  {
    id: 'track_2',
    title: 'Solar Flare',
    artist: 'Cyber Pulse',
    album: 'Galactic Odyssey',
    artwork: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    duration: 423,
    genre: 'Cyberpunk / Bass',
    source: 'catalog',
    lyrics: '[00:15.00] Cosmic waves colliding\n[00:30.00] Energy through the atmosphere\n[00:45.00] Pulsing through the solar winds\n[01:05.00] Faster than the speed of light\n[01:25.00] Solar flare ignites the sky',
  },
  {
    id: 'track_3',
    title: 'Rainy Afternoon Coffee',
    artist: 'Luna Vibe',
    album: 'Lofi Moments',
    artwork: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&auto=format&fit=crop&q=80',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    duration: 345,
    genre: 'Lofi Chill',
    source: 'catalog',
    lyrics: '[00:10.00] Raindrops on the window pane\n[00:25.00] Steam rising from warm mug\n[00:40.00] Relax, take a deep breath\n[00:55.00] Time slows down for a moment',
  },
  {
    id: 'track_4',
    title: 'Echoes of the Valley',
    artist: 'Aura Bloom',
    album: 'Ethereal Forest',
    artwork: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&auto=format&fit=crop&q=80',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    duration: 389,
    genre: 'Ambient / Classical',
    source: 'catalog',
    lyrics: '[00:20.00] Wind whisper through ancient pines\n[00:40.00] Rivers murmur melody of peace\n[01:00.00] Golden sun over emerald peaks',
  },
  {
    id: 'track_5',
    title: 'Hyperdrive Anthem',
    artist: 'Nova Velocity',
    album: 'Velocity X',
    artwork: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    duration: 360,
    genre: 'Dance / EDM',
    source: 'catalog',
    lyrics: '[00:16.00] Jump into the warp gate\n[00:32.00] Feel the rhythm taking over\n[00:48.00] 3, 2, 1 — Blastoff!\n[01:04.00] Hyperdrive into the future',
  },
  {
    id: 'track_6',
    title: 'Velvet Sunset',
    artist: 'Kiran Deep',
    album: 'Fusion Waves',
    artwork: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
    duration: 312,
    genre: 'World / Fusion',
    source: 'catalog',
    lyrics: '[00:15.00] மாலை வெயிலின் இனிமை\n[00:30.00] காற்றில் கலந்த கானம்\n[00:45.00] மனதில் அமைதி பிறக்கும்\n[01:00.00] இசையே வாழ்வின் சுவாசம்',
  },
  {
    id: 'track_7',
    title: 'Desert Mirage',
    artist: 'Sands of Time',
    album: 'Caravan Nights',
    artwork: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=600&auto=format&fit=crop&q=80',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
    duration: 395,
    genre: 'World / Acoustic',
    source: 'catalog',
    lyrics: '[00:18.00] Across the golden dunes\n[00:36.00] Stars awaken in the midnight sky\n[00:54.00] Endless journey of the soul',
  },
  {
    id: 'track_8',
    title: 'Urban Groove',
    artist: 'Street Beats',
    album: 'City Life',
    artwork: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&auto=format&fit=crop&q=80',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    duration: 340,
    genre: 'Hip-Hop / Funk',
    source: 'catalog',
    lyrics: '[00:12.00] Step to the rhythm of the street\n[00:24.00] Bassline kicking under concrete\n[00:36.00] Urban groove never stops',
  },
];

const CURATED_ARTISTS: Artist[] = [
  {
    id: 'art_1',
    name: 'Aetheris',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    bio: 'Electronic producer crafting retro-futuristic synth soundscapes with emotional melodies.',
    genres: ['Synthwave', 'Electronic', 'Retrowave'],
    trackCount: 14,
    source: 'catalog',
  },
  {
    id: 'art_2',
    name: 'Cyber Pulse',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
    bio: 'Heavy bass, dark techno, and high-octane cyberpunk audio visionary.',
    genres: ['Cyberpunk', 'Bass', 'Industrial'],
    trackCount: 18,
    source: 'catalog',
  },
  {
    id: 'art_3',
    name: 'Luna Vibe',
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80',
    bio: 'Lofi beats and calm study melodies to help millions relax and focus.',
    genres: ['Lofi Chill', 'Ambient', 'Downtempo'],
    trackCount: 22,
    source: 'catalog',
  },
  {
    id: 'art_4',
    name: 'Kiran Deep',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80',
    bio: 'Indian fusion composer blending traditional instruments with modern ambient textures.',
    genres: ['World', 'Fusion', 'Indian Classical'],
    trackCount: 12,
    source: 'catalog',
  },
];

const CURATED_ALBUMS: Album[] = [
  {
    id: 'alb_1',
    title: 'Neon Dreams',
    artist: 'Aetheris',
    artwork: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600&auto=format&fit=crop&q=80',
    year: 2026,
    genre: 'Synthwave',
    tracks: [CURATED_TRACKS[0]],
    source: 'catalog',
  },
  {
    id: 'alb_2',
    title: 'Galactic Odyssey',
    artist: 'Cyber Pulse',
    artwork: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    year: 2025,
    genre: 'Cyberpunk',
    tracks: [CURATED_TRACKS[1]],
    source: 'catalog',
  },
  {
    id: 'alb_3',
    title: 'Lofi Moments',
    artist: 'Luna Vibe',
    artwork: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&auto=format&fit=crop&q=80',
    year: 2026,
    genre: 'Lofi Chill',
    tracks: [CURATED_TRACKS[2]],
    source: 'catalog',
  },
];

export interface MusicProvider {
  getTrendingTracks(): Promise<Track[]>;
  getQuickPicks(): Promise<Track[]>;
  getGenres(): Promise<string[]>;
  getArtists(): Promise<Artist[]>;
  getArtistById(id: string): Promise<Artist | null>;
  getArtistTracks(artistId: string): Promise<Track[]>;
  getAlbums(): Promise<Album[]>;
  getAlbumById(id: string): Promise<Album | null>;
  search(
    query: string,
    filter?: 'all' | 'tracks' | 'artists' | 'albums',
    source?: SearchSource,
    pageToken?: string
  ): Promise<UnifiedSearchResult>;
}

export class ResilientMusicApi implements MusicProvider {
  public async getTrendingTracks(): Promise<Track[]> {
    try {
      return CURATED_TRACKS;
    } catch (error) {
      logger.error('Failed to get trending tracks, using fallback', { error: String(error) });
      return CURATED_TRACKS;
    }
  }

  public async getQuickPicks(): Promise<Track[]> {
    return [...CURATED_TRACKS].reverse();
  }

  public async getGenres(): Promise<string[]> {
    return [
      'Synthwave',
      'Cyberpunk',
      'Lofi Chill',
      'Ambient',
      'Electronic',
      'Hip-Hop',
      'World / Fusion',
      'Classical',
      'Rock & Indie',
      'Dance & EDM',
    ];
  }

  public async getArtists(): Promise<Artist[]> {
    return CURATED_ARTISTS;
  }

  public async getArtistById(id: string): Promise<Artist | null> {
    const artist = CURATED_ARTISTS.find((a) => a.id === id);
    return artist || null;
  }

  public async getArtistTracks(artistId: string): Promise<Track[]> {
    const artist = CURATED_ARTISTS.find((a) => a.id === artistId);
    if (!artist) return [];
    return CURATED_TRACKS.filter((t) => t.artist.toLowerCase() === artist.name.toLowerCase());
  }

  public async getAlbums(): Promise<Album[]> {
    return CURATED_ALBUMS;
  }

  public async getAlbumById(id: string): Promise<Album | null> {
    const album = CURATED_ALBUMS.find((a) => a.id === id);
    return album || null;
  }

  public async search(
    query: string,
    filter: 'all' | 'tracks' | 'artists' | 'albums' = 'all',
    source: SearchSource = 'catalog',
    pageToken?: string
  ): Promise<UnifiedSearchResult> {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return { tracks: [], artists: [], albums: [], source };
    }

    // Route to YouTube Data API Provider if YouTube source selected
    if (source === 'youtube') {
      return youtubeProvider.search(query, filter, pageToken);
    }

    // Default: Search curated catalog
    const matchedTracks =
      filter === 'all' || filter === 'tracks'
        ? CURATED_TRACKS.filter(
            (t) =>
              t.title.toLowerCase().includes(normalized) ||
              t.artist.toLowerCase().includes(normalized) ||
              (t.genre && t.genre.toLowerCase().includes(normalized)) ||
              (t.album && t.album.toLowerCase().includes(normalized))
          )
        : [];

    const matchedArtists =
      filter === 'all' || filter === 'artists'
        ? CURATED_ARTISTS.filter(
            (a) =>
              a.name.toLowerCase().includes(normalized) ||
              (a.genres && a.genres.some((g) => g.toLowerCase().includes(normalized)))
          )
        : [];

    const matchedAlbums =
      filter === 'all' || filter === 'albums'
        ? CURATED_ALBUMS.filter(
            (alb) =>
              alb.title.toLowerCase().includes(normalized) ||
              alb.artist.toLowerCase().includes(normalized)
          )
        : [];

    return {
      tracks: matchedTracks,
      artists: matchedArtists,
      albums: matchedAlbums,
      source: 'catalog',
    };
  }

  public async configureYouTubeApiKey(key: string): Promise<void> {
    await youtubeProvider.saveApiKey(key);
  }

  public async getYouTubeApiKey(): Promise<string | null> {
    return youtubeProvider.getApiKey();
  }

  public async removeYouTubeApiKey(): Promise<void> {
    await youtubeProvider.removeApiKey();
  }
}

export const musicApi = new ResilientMusicApi();
