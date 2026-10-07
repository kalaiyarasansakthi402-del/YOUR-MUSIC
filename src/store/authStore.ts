import { create } from 'zustand';
import { GoogleUser, AuthState } from '../types';
import { googleAuthService } from '../services/auth/GoogleAuthService';

interface AuthStoreState extends AuthState {
  signInWithGoogle: () => Promise<GoogleUser | null>;
  signOutGoogle: () => Promise<void>;
  restoreSession: () => Promise<GoogleUser | null>;
  setClientId: (clientId: string) => Promise<void>;
  getClientId: () => Promise<string>;
}

export const useAuthStore = create<AuthStoreState>((set) => {
  // Subscribe to googleAuthService events
  googleAuthService.subscribe((state) => {
    set(state);
  });

  return {
    ...googleAuthService.getState(),

    signInWithGoogle: async () => {
      return await googleAuthService.signInWithGoogle();
    },

    signOutGoogle: async () => {
      await googleAuthService.signOutGoogle();
    },

    restoreSession: async () => {
      return await googleAuthService.restoreSession();
    },

    setClientId: async (clientId: string) => {
      await googleAuthService.setClientId(clientId);
    },

    getClientId: async () => {
      return await googleAuthService.getClientId();
    },
  };
});
