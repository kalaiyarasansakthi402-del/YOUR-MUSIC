import AsyncStorage from '@react-native-async-storage/async-storage';
import { googleAuthService } from '../src/services/auth/GoogleAuthService';
import { youtubeAuthService } from '../src/services/youtube';
import { useAuthStore } from '../src/store/authStore';
import { GoogleUser } from '../src/types';

describe('Google Authentication & YouTube Authorization Suite', () => {
  const mockUser: GoogleUser = {
    id: 'google_user_123',
    name: 'Anzles Tester',
    email: 'anzles@example.com',
    photoUrl: 'https://example.com/avatar.jpg',
    connectedToYouTube: true,
    signedInAt: Date.now(),
  };

  beforeEach(async () => {
    await AsyncStorage.clear();
    await googleAuthService.signOutGoogle();
    jest.clearAllMocks();
  });

  it('starts with signed out state', () => {
    const user = googleAuthService.getCurrentUser();
    expect(user).toBeNull();
    const state = googleAuthService.getState();
    expect(state.user).toBeNull();
    expect(state.isLoading).toBe(false);
  });

  it('manages OAuth client ID in storage', async () => {
    await googleAuthService.setClientId('test-client-id-1234.apps.googleusercontent.com');
    const clientId = await googleAuthService.getClientId();
    expect(clientId).toBe('test-client-id-1234.apps.googleusercontent.com');

    // Clean up
    await googleAuthService.setClientId('');
  });

  it('restores persisted session from AsyncStorage', async () => {
    await AsyncStorage.setItem('@your_music:google_user', JSON.stringify(mockUser));
    const restored = await googleAuthService.restoreSession();
    expect(restored).not.toBeNull();
    expect(restored?.email).toBe('anzles@example.com');
    expect(restored?.connectedToYouTube).toBe(true);

    const currentUser = googleAuthService.getCurrentUser();
    expect(currentUser?.name).toBe('Anzles Tester');
  });

  it('clears persisted session on sign out', async () => {
    await AsyncStorage.setItem('@your_music:google_user', JSON.stringify(mockUser));
    await googleAuthService.restoreSession();
    expect(googleAuthService.getCurrentUser()).not.toBeNull();

    await googleAuthService.signOutGoogle();
    expect(googleAuthService.getCurrentUser()).toBeNull();
    expect(await AsyncStorage.getItem('@your_music:google_user')).toBeNull();
  });

  it('bridges auth events through useAuthStore Zustand hook', async () => {
    await AsyncStorage.setItem('@your_music:google_user', JSON.stringify(mockUser));
    await useAuthStore.getState().restoreSession();

    const authState = useAuthStore.getState();
    expect(authState.user?.id).toBe('google_user_123');
    expect(authState.user?.connectedToYouTube).toBe(true);

    await useAuthStore.getState().signOutGoogle();
    expect(useAuthStore.getState().user).toBeNull();
  });

  describe('YouTube Authorization Service', () => {
    it('detects unauthenticated state', () => {
      expect(youtubeAuthService.isAuthenticated()).toBe(false);
      expect(youtubeAuthService.hasYouTubeScope()).toBe(false);
      expect(youtubeAuthService.getUserProfile()).toBeNull();
      expect(youtubeAuthService.getAuthHeaders()).toBeNull();
    });

    it('detects authenticated user with YouTube scope and provides auth headers', async () => {
      const userWithToken: GoogleUser = {
        ...mockUser,
        accessToken: 'ya29.mock_access_token_123',
      };
      await AsyncStorage.setItem('@your_music:google_user', JSON.stringify(userWithToken));
      await googleAuthService.restoreSession();

      expect(youtubeAuthService.isAuthenticated()).toBe(true);
      expect(youtubeAuthService.hasYouTubeScope()).toBe(true);

      const profile = youtubeAuthService.getUserProfile();
      expect(profile?.name).toBe('Anzles Tester');
      expect(profile?.connectedToYouTube).toBe(true);

      const headers = youtubeAuthService.getAuthHeaders();
      expect(headers).toEqual({
        Authorization: 'Bearer ya29.mock_access_token_123',
        Accept: 'application/json',
      });
    });

    it('handles sign out through youtubeAuthService', async () => {
      await AsyncStorage.setItem('@your_music:google_user', JSON.stringify(mockUser));
      await googleAuthService.restoreSession();

      await youtubeAuthService.signOut();
      expect(googleAuthService.getCurrentUser()).toBeNull();
    });
  });
});
