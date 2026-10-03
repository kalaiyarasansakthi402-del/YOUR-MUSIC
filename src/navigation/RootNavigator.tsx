import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, Compass, Search, ListMusic, Settings } from 'lucide-react-native';

import { HomeScreen } from '../screens/HomeScreen';
import { ExploreScreen } from '../screens/ExploreScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { LibraryScreen } from '../screens/LibraryScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { PlayerScreen } from '../screens/PlayerScreen';
import { PlaylistDetailScreen } from '../screens/PlaylistDetailScreen';
import { ArtistDetailScreen } from '../screens/ArtistDetailScreen';
import { AlbumDetailScreen } from '../screens/AlbumDetailScreen';
import { DiagnosticsScreen } from '../screens/DiagnosticsScreen';
import { AboutScreen } from '../screens/AboutScreen';
import { PrivacyScreen } from '../screens/PrivacyScreen';
import { HelpScreen } from '../screens/HelpScreen';
import { MiniPlayer } from '../components/MiniPlayer';

import { useTheme } from '../theme/themeContext';
import { TabParamList, RootStackParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const TabNavigator: React.FC = () => {
  const { colors, t } = useTheme();

  return (
    <View style={styles.tabContainer}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.tabBarBackground,
            borderTopColor: colors.border,
            height: 60,
            paddingBottom: 8,
            paddingTop: 6,
          },
          tabBarActiveTintColor: colors.tabBarActive,
          tabBarInactiveTintColor: colors.tabBarInactive,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
        }}
      >
        <Tab.Screen
          name="HomeTab"
          component={HomeScreen}
          options={{
            tabBarLabel: t.tabs.home,
            tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
          }}
        />
        <Tab.Screen
          name="ExploreTab"
          component={ExploreScreen}
          options={{
            tabBarLabel: t.tabs.explore,
            tabBarIcon: ({ color, size }) => <Compass color={color} size={size} />,
          }}
        />
        <Tab.Screen
          name="SearchTab"
          component={SearchScreen}
          options={{
            tabBarLabel: t.tabs.search,
            tabBarIcon: ({ color, size }) => <Search color={color} size={size} />,
          }}
        />
        <Tab.Screen
          name="LibraryTab"
          component={LibraryScreen}
          options={{
            tabBarLabel: t.tabs.library,
            tabBarIcon: ({ color, size }) => <ListMusic color={color} size={size} />,
          }}
        />
        <Tab.Screen
          name="SettingsTab"
          component={SettingsScreen}
          options={{
            tabBarLabel: t.tabs.settings,
            tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
          }}
        />
      </Tab.Navigator>
      <MiniPlayer />
    </View>
  );
};

export const RootNavigator: React.FC = () => {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen
        name="Player"
        component={PlayerScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen name="PlaylistDetail" component={PlaylistDetailScreen} />
      <Stack.Screen name="ArtistDetail" component={ArtistDetailScreen} />
      <Stack.Screen name="AlbumDetail" component={AlbumDetailScreen} />
      <Stack.Screen name="Diagnostics" component={DiagnosticsScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="Privacy" component={PrivacyScreen} />
      <Stack.Screen name="Help" component={HelpScreen} />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flex: 1,
  },
});
