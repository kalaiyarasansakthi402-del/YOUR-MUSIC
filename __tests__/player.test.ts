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

  it('updates status and playbackSource correctly for media stream and YouTube tracks', async () => {
    await playerService.playTrack(testTrack1);
    const state = playerService.getState();
    expect(state.status).toBe('playing');
    expect(state.playbackSource).toEqual({ type: 'audio', url: testTrack1.url });

    const ytTrack: Track = {
      id: 'yt_abc123',
      title: 'YouTube Track',
      artist: 'Channel',
      artwork: 'https://example.com/yt.jpg',
      url: 'https://www.youtube.com/watch?v=abc12345678',
      videoId: 'abc12345678',
      duration: 210,
      source: 'youtube',
    };

    await playerService.playTrack(ytTrack);
    const ytState = playerService.getState();
    expect(ytState.status).toBe('ready');
    expect(ytState.playbackSource).toEqual({
      type: 'youtube',
      videoId: 'abc12345678',
      title: 'YouTube Track',
    });
  });

  it('stops playback and resets status to idle', async () => {
    await playerService.playTrack(testTrack1);
    await playerService.stop();
    const state = playerService.getState();
    expect(state.isPlaying).toBe(false);
    expect(state.status).toBe('idle');
  });

  it('updates playback rate within valid limits', async () => {
    await playerService.setPlaybackRate(1.25);
    expect(playerService.getState().playbackRate).toBe(1.25);

    await playerService.setPlaybackRate(0.5);
    expect(playerService.getState().playbackRate).toBe(0.5);

    // Reset
    await playerService.setPlaybackRate(1.0);
    expect(playerService.getState().playbackRate).toBe(1.0);
  });

  it('clears queue while preserving current track', async () => {
    await playerService.playTrack(testTrack1, [testTrack1, testTrack2], 0);
    expect(playerService.getState().queue.length).toBe(2);

    playerService.clearQueue();
    expect(playerService.getState().queue.length).toBe(1);
    expect(playerService.getState().queue[0].id).toBe('tr_1');
  });

  it('supports playNext to insert track right after current song', async () => {
    await playerService.playTrack(testTrack1, [testTrack1, testTrack2], 0);
    const testTrack3: Track = {
      id: 'tr_3',
      title: 'Track Three',
      artist: 'Artist C',
      artwork: 'https://example.com/3.jpg',
      url: 'https://example.com/3.mp3',
      duration: 150,
    };
    playerService.playNext(testTrack3);
    const state = playerService.getState();
    expect(state.queue.length).toBe(3);
    expect(state.queue[1].id).toBe('tr_3');
  });

  it('supports reorderQueue correctly', async () => {
    await playerService.playTrack(testTrack1, [testTrack1, testTrack2], 0);
    playerService.reorderQueue(0, 1);
    const state = playerService.getState();
    expect(state.queue[0].id).toBe('tr_2');
    expect(state.queue[1].id).toBe('tr_1');
  });
});
