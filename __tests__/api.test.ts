import { musicApi } from '../src/services/api/musicApi';

describe('Music API Resilient Layer Suite', () => {
  it('retrieves trending tracks safely', async () => {
    const tracks = await musicApi.getTrendingTracks();
    expect(Array.isArray(tracks)).toBe(true);
    expect(tracks.length).toBeGreaterThan(0);
    expect(tracks[0]).toHaveProperty('id');
    expect(tracks[0]).toHaveProperty('title');
    expect(tracks[0]).toHaveProperty('url');
  });

  it('retrieves genres list', async () => {
    const genres = await musicApi.getGenres();
    expect(Array.isArray(genres)).toBe(true);
    expect(genres).toContain('Synthwave');
    expect(genres).toContain('Lofi Chill');
  });

  it('retrieves artists and artist details', async () => {
    const artists = await musicApi.getArtists();
    expect(artists.length).toBeGreaterThan(0);

    const firstArtist = artists[0];
    const fetched = await musicApi.getArtistById(firstArtist.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.name).toBe(firstArtist.name);
  });

  it('performs live catalog search with keyword matching', async () => {
    const results = await musicApi.search('Midnight', 'all');
    expect(results.tracks.length).toBeGreaterThan(0);
    expect(results.tracks[0].title).toContain('Midnight');
  });

  it('handles empty or blank search safely without throwing', async () => {
    const emptyResult = await musicApi.search('', 'all');
    expect(emptyResult.tracks).toEqual([]);
    expect(emptyResult.artists).toEqual([]);
    expect(emptyResult.albums).toEqual([]);
  });
});
