import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { GoogleUser, AuthState } from '../../types';
import { logger } from '../../utils/logger';

// Ensure web browser completes redirect in native environment
WebBrowser.maybeCompleteAuthSession();

const STORAGE_KEY = '@your_music:google_user';
const CLIENT_ID_STORAGE_KEY = '@your_music:google_client_id';

type AuthListener = (state: AuthState) => void;

class GoogleAuthService {
  private user: GoogleUser | null = null;
  private isLoading = false;
  private error: string | null = null;
  private listeners: AuthListener[] = [];
  private configuredClientId: string | null = null;

  constructor() {
    this.restoreSession().catch(() => {});
  }

  public subscribe(listener: AuthListener): () => void {
    this.listeners.push(listener);
    listener(this.getState());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public getState(): AuthState {
    return {
      user: this.user,
      isLoading: this.isLoading,
      error: this.error,
    };
  }

  private notify(): void {
    const state = this.getState();
    this.listeners.forEach((l) => l(state));
  }

  public getCurrentUser(): GoogleUser | null {
    return this.user;
  }

  public async setClientId(clientId: string): Promise<void> {
    const trimmed = clientId.trim();
    this.configuredClientId = trimmed;
    if (trimmed) {
      await AsyncStorage.setItem(CLIENT_ID_STORAGE_KEY, trimmed);
    } else {
      await AsyncStorage.removeItem(CLIENT_ID_STORAGE_KEY);
    }
  }

  public async getClientId(): Promise<string> {
    if (this.configuredClientId) return this.configuredClientId;
    try {
      const stored = await AsyncStorage.getItem(CLIENT_ID_STORAGE_KEY);
      if (stored) {
        this.configuredClientId = stored;
        return stored;
      }
    } catch {
      // Ignored
    }
    // Default Google OAuth client ID or environment variable
    return process.env.GOOGLE_CLIENT_ID || 'your-music-android.apps.googleusercontent.com';
  }

  /**
   * Restore persisted Google session on application startup
   */
  public async restoreSession(): Promise<GoogleUser | null> {
    this.isLoading = true;
    this.notify();

    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: GoogleUser = JSON.parse(stored);
        this.user = parsed;
        this.error = null;
        logger.info('GOOGLE_SIGNIN_SUCCESS: Session restored from storage', {
          userId: parsed.id,
          hasYouTube: parsed.connectedToYouTube,
        });
      } else {
        this.user = null;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.error = 'Unable to restore previous session.';
      logger.error('GOOGLE_SIGNIN_ERROR: Session restore error', { error: msg });
    } finally {
      this.isLoading = false;
      this.notify();
    }

    return this.user;
  }

  /**
   * Perform Google Sign-In with OAuth 2.0 and YouTube Read-Only scopes
   */
  public async signInWithGoogle(): Promise<GoogleUser | null> {
    logger.info('GOOGLE_SIGNIN_START: Initiating Google authentication');
    this.isLoading = true;
    this.error = null;
    this.notify();

    try {
      const clientId = await this.getClientId();
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'yourmusic',
        path: 'auth',
      });

      // Google Discovery endpoints
      const discovery = {
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenEndpoint: 'https://oauth2.googleapis.com/token',
        revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
      };

      const request = new AuthSession.AuthRequest({
        clientId,
        redirectUri,
        scopes: [
          'openid',
          'profile',
          'email',
          'https://www.googleapis.com/auth/youtube.readonly',
        ],
        responseType: AuthSession.ResponseType.Token,
        prompt: AuthSession.Prompt.SelectAccount,
      });

      const result = await request.promptAsync(discovery);

      if (result.type === 'cancel' || result.type === 'dismiss') {
        this.error = 'Google sign-in was cancelled.';
        logger.warn('GOOGLE_SIGNIN_ERROR: Google sign-in was cancelled by user');
        this.isLoading = false;
        this.notify();
        return null;
      }

      if (result.type === 'success' && result.params) {
        const accessToken = result.params.access_token;
        const idToken = result.params.id_token;

        // Fetch user profile from Google UserInfo
        let profile = {
          sub: `g_${Date.now()}`,
          name: 'Google User',
          email: '',
          picture: '',
        };

        if (accessToken) {
          try {
            const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (userInfoRes.ok) {
              profile = await userInfoRes.json();
            }
          } catch {
            // Profile fetch non-critical
          }
        }

        // Determine if YouTube scope was granted
        const grantedScopes = result.params.scope || '';
        const connectedToYouTube = grantedScopes.includes('youtube');

        const googleUser: GoogleUser = {
          id: profile.sub || `g_${Date.now()}`,
          name: profile.name || 'Google User',
          email: profile.email || '',
          photoUrl: profile.picture || undefined,
          idToken,
          accessToken,
          connectedToYouTube,
          signedInAt: Date.now(),
        };

        this.user = googleUser;
        this.error = null;
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(googleUser));

        logger.info('GOOGLE_SIGNIN_SUCCESS: Successfully authenticated Google account', {
          userId: googleUser.id,
          name: googleUser.name,
          connectedToYouTube: googleUser.connectedToYouTube,
        });

        this.isLoading = false;
        this.notify();
        return googleUser;
      }

      throw new Error('Google authentication flow could not be completed.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.error = 'Unable to sign in with Google. Please try again.';
      logger.error('GOOGLE_SIGNIN_ERROR: Sign-in failure', { error: msg });
      this.isLoading = false;
      this.notify();
      return null;
    }
  }

  /**
   * Sign out and clear stored session credentials
   */
  public async signOutGoogle(): Promise<void> {
    logger.info('GOOGLE_SIGNOUT_START: Signing out Google user');
    try {
      if (this.user?.accessToken) {
        // Optional revoke
        fetch(`https://oauth2.googleapis.com/revoke?token=${this.user.accessToken}`, {
          method: 'POST',
        }).catch(() => {});
      }
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignored
    }

    this.user = null;
    this.error = null;
    this.isLoading = false;
    this.notify();
    logger.info('GOOGLE_SIGNOUT_SUCCESS: Google session cleared');
  }
}

export const googleAuthService = new GoogleAuthService();
