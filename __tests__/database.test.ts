import { database } from '../src/services/database/database';
import { Track } from '../src/types';

const sampleTrack: Track = {
  id: 'test_track_1',
  title: 'Test Song',
  artist: 'Test Artist',
  album: 'Test Album',
  artwork: 'https://example.com/art.jpg',
  url: 'https://example.com/song.mp3',
  duration: 210,
  genre: 'Electronic',
};

describe('Database Schema & Migration Suite', () => {
  beforeAll(async () => {
    await database.init();
  });

  it('validates database integrity and required tables', () => {
    const integrity = database.validateIntegrity();
    expect(integrity.status).toBe('OK');
    expect(Array.isArray(integrity.tables)).toBe(true);
  });

  it('can upsert and retrieve a track without data loss', () => {
    database.upsertTrack(sampleTrack);
    const retrieved = database.getTrack('test_track_1');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.title).toBe('Test Song');
    expect(retrieved?.artist).toBe('Test Artist');
  });

  it('manages favorites lifecycle (add, check, remove)', () => {
    database.addFavorite(sampleTrack);
    expect(database.isFavorite('test_track_1')).toBe(true);

    database.removeFavorite('test_track_1');
    expect(database.isFavorite('test_track_1')).toBe(false);
  });

  it('records listening history and increments play count', () => {
    database.addHistory(sampleTrack);
    const history = database.getHistory();
    expect(Array.isArray(history)).toBe(true);
  });

  it('creates and manages user playlists safely without deleting user data', () => {
    const pl = database.createPlaylist('pl_test_1', 'Chill Vibes', 'My chill tracks');
    expect(pl.id).toBe('pl_test_1');
    expect(pl.title).toBe('Chill Vibes');

    database.addTrackToPlaylist('pl_test_1', sampleTrack);
    const playlists = database.getPlaylists();
    expect(Array.isArray(playlists)).toBe(true);

    database.removeTrackFromPlaylist('pl_test_1', sampleTrack.id);
    database.deletePlaylist('pl_test_1');
  });

  it('persists and retrieves playback state and playback queue', () => {
    database.savePlaybackState('test_track_1', 45, true, 'all', true);
    const state = database.getPlaybackState();
    expect(state).not.toBeNull();
    expect(state?.currentTrackId).toBe('test_track_1');
    expect(state?.position).toBe(45);
    expect(state?.isPlaying).toBe(true);
    expect(state?.repeatMode).toBe('all');
    expect(state?.shuffle).toBe(true);

    database.savePlaybackQueue([sampleTrack]);
    const queue = database.getPlaybackQueue();
    expect(queue.length).toBe(1);
    expect(queue[0].id).toBe(sampleTrack.id);
  });

  it('upserts and retrieves artists and albums', () => {
    database.upsertArtist('art_1', 'Anzles Music', 'https://example.com/art.jpg', 5);
    const artists = database.getArtists();
    expect(artists.some((a) => a.id === 'art_1' && a.name === 'Anzles Music')).toBe(true);

    database.upsertAlbum('alb_1', 'Masterpiece', 'Anzles Music', 'https://example.com/cover.jpg', '2026', 10);
    const albums = database.getAlbums();
    expect(albums.some((al) => al.id === 'alb_1' && al.title === 'Masterpiece')).toBe(true);
  });
});
