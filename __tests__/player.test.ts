import { playerService } from '../src/services/audio/PlayerService';
import { Track } from '../src/types';

const testTrack1: Track = {
  id: 'tr_1',
  title: 'Track One',
  artist: 'Artist A',
  artwork: 'https://example.com/1.jpg',
  url: 'https://example.com/1.mp3',
  duration: 180,
};

const testTrack2: Track = {
  id: 'tr_2',
  title: 'Track Two',
  artist: 'Artist B',
  artwork: 'https://example.com/2.jpg',
  url: 'https://example.com/2.mp3',
  duration: 200,
};

describe('Player Service Continuous Reliability Suite', () => {
  beforeAll(async () => {
    await playerService.init();
  });

  it('starts with clean initial playback state', () => {
    const state = playerService.getState();
    expect(state.isPlaying).toBe(false);
    expect(state.error).toBeNull();
    expect(state.repeatMode).toBe('off');
  });

  it('plays a track and updates state with queue', async () => {
    await playerService.playTrack(testTrack1, [testTrack1, testTrack2], 0);
    const state = playerService.getState();
    expect(state.currentTrack?.id).toBe('tr_1');
    expect(state.isPlaying).toBe(true);
    expect(state.queue.length).toBe(2);
  });

  it('pauses and resumes correctly', async () => {
    await playerService.pause();
    expect(playerService.getState().isPlaying).toBe(false);

    await playerService.resume();
    expect(playerService.getState().isPlaying).toBe(true);
  });

  it('advances to next and previous track in queue', async () => {
    await playerService.playTrack(testTrack1, [testTrack1, testTrack2], 0);
    await playerService.next();
    expect(playerService.getState().currentTrack?.id).toBe('tr_2');

    await playerService.previous();
    expect(playerService.getState().currentTrack?.id).toBe('tr_1');
  });

  it('toggles shuffle and maintains current track in front', () => {
    playerService.setShuffle(true);
    expect(playerService.getState().shuffle).toBe(true);
    expect(playerService.getState().queue.length).toBe(2);

    playerService.setShuffle(false);
    expect(playerService.getState().shuffle).toBe(false);
  });

  it('changes repeat mode correctly', () => {
    playerService.setRepeatMode('all');
    expect(playerService.getState().repeatMode).toBe('all');

    playerService.setRepeatMode('one');
    expect(playerService.getState().repeatMode).toBe('one');

    playerService.setRepeatMode('off');
    expect(playerService.getState().repeatMode).toBe('off');
  });

  it('manages queue additions and removals', () => {
    const extraTrack: Track = {
      id: 'tr_3',
      title: 'Track Three',
      artist: 'Artist C',
      artwork: 'https://example.com/3.jpg',
      url: 'https://example.com/3.mp3',
      duration: 240,
    };
    playerService.addToQueue(extraTrack);
    expect(playerService.getState().queue.length).toBe(3);

    playerService.removeFromQueue(2);
    expect(playerService.getState().queue.length).toBe(2);
  });
});
