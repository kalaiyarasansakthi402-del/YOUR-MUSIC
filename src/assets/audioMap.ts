/* eslint-disable @typescript-eslint/no-require-imports */
import { AVPlaybackSource } from 'expo-av';

/**
 * Static map of bundled high-fidelity audio assets for zero-latency,
 * offline, and failover playback in the native Android APK.
 */
export const BUNDLED_AUDIO_MAP: Record<string, AVPlaybackSource> = {
  track_1: require('../../assets/audio/track_1.wav'),
  track_2: require('../../assets/audio/track_2.wav'),
  track_3: require('../../assets/audio/track_3.wav'),
  track_4: require('../../assets/audio/track_4.wav'),
  track_5: require('../../assets/audio/track_5.wav'),
  track_6: require('../../assets/audio/track_6.wav'),
  track_7: require('../../assets/audio/track_7.wav'),
  track_8: require('../../assets/audio/track_8.wav'),
};

/**
 * Retrieve a bundled audio source for a given track ID
 */
export function getBundledAudioSource(trackId: string): AVPlaybackSource | null {
  if (!trackId) return null;
  return BUNDLED_AUDIO_MAP[trackId] || null;
}
