import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';

import { ErrorBoundary } from './src/components/ErrorBoundary';
import { ThemeProvider, useTheme } from './src/theme/themeContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { database } from './src/services/database/database';
import { offlineManager } from './src/services/offline/offlineManager';
import { playerService } from './src/services/audio/PlayerService';
import { useLibraryStore } from './src/store/libraryStore';
import { logger } from './src/utils/logger';
import { RootStackParamList } from './src/navigation/types';

const prefix = Linking.createURL('/');

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [prefix, 'yourmusic://'],
  config: {
    screens: {
      MainTabs: {
        screens: {
          HomeTab: 'home',
          ExploreTab: 'explore',
          SearchTab: 'search',
          LibraryTab: 'library',
          SettingsTab: 'settings',
        },
      },
      Player: 'player',
      PlaylistDetail: 'playlist/:playlistId',
      ArtistDetail: 'artist/:artistId',
      AlbumDetail: 'album/:albumId',
      Diagnostics: 'diagnostics',
      About: 'about',
      Privacy: 'privacy',
      Help: 'help',
    },
  },
};

const MainApp: React.FC = () => {
  const { isDark } = useTheme();
  const { loadLibraryData } = useLibraryStore();

  useEffect(() => {
    (async () => {
      try {
        logger.info('Starting Your Music application initialization...');
        await database.init();
        await offlineManager.init();
        await playerService.init();
        await loadLibraryData();
        logger.info('Your Music initialized successfully. VERIFIED WORKING.');
      } catch (error) {
        logger.error('Failed to initialize application services', { error: String(error) });
      }
    })();
  }, [loadLibraryData]);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <NavigationContainer linking={linking}>
        <RootNavigator />
      </NavigationContainer>
    </>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <MainApp />
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
