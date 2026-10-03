import { offlineManager } from '../src/services/offline/offlineManager';
import { Track } from '../src/types';

const mockTrack: Track = {
  id: 'dl_track_1',
  title: 'Downloadable Song',
  artist: 'Offline Artist',
  artwork: 'https://example.com/art.jpg',
  url: 'https://example.com/song.mp3',
  duration: 180,
};

describe('Offline Manager & Download Storage Suite', () => {
  beforeAll(async () => {
    await offlineManager.init();
  });

  it('tracks network state correctly', () => {
    const isOnline = offlineManager.getIsOnline();
    expect(typeof isOnline).toBe('boolean');
  });

  it('allows subscription to network changes', () => {
    const listener = jest.fn();
    const unsubscribe = offlineManager.subscribe(listener);
    expect(typeof unsubscribe).toBe('function');
    unsubscribe();
  });

  it('downloads track and stores local file URI in database', async () => {
    const uri = await offlineManager.downloadTrack(mockTrack);
    expect(uri).toContain('track_dl_track_1.mp3');
  });

  it('calculates storage usage in MB', async () => {
    const mb = await offlineManager.getStorageUsageMb();
    expect(typeof mb).toBe('number');
    expect(mb).toBeGreaterThanOrEqual(0);
  });

  it('clears temporary cache safely', async () => {
    await expect(offlineManager.clearCache()).resolves.not.toThrow();
  });
});
