import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Play, Sparkles, Flame, Clock, Radio } from 'lucide-react-native';
import { Header } from '../components/Header';
import { OfflineBanner } from '../components/OfflineBanner';
import { TrackItem } from '../components/TrackItem';
import { useTheme } from '../theme/themeContext';
import { usePlayerStore } from '../store/playerStore';
import { useLibraryStore } from '../store/libraryStore';
import { musicApi } from '../services/api/musicApi';
import { Track } from '../types';
import { RootStackParamList } from '../navigation/types';

export const HomeScreen: React.FC = () => {
  const { colors, t } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { playTrack } = usePlayerStore();
  const { history, playlists } = useLibraryStore();

  const [trendingTracks, setTrendingTracks] = useState<Track[]>([]);
  const [quickPicks, setQuickPicks] = useState<Track[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [trending, quick] = await Promise.all([
        musicApi.getTrendingTracks(),
        musicApi.getQuickPicks(),
      ]);
      setTrendingTracks(trending);
      setQuickPicks(quick);
    } catch {
      // Handled internally with fallback
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header />
      <OfflineBanner />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section: Trending Now */}
        <View style={styles.sectionHeader}>
          <Flame size={20} color={colors.secondary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.home.trendingNow}</Text>
        </View>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={trendingTracks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.horizontalList}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={[styles.trendingCard, { backgroundColor: colors.surface }]}
              onPress={() => playTrack(item, trendingTracks, index)}
              activeOpacity={0.8}
            >
              <Image source={{ uri: item.artwork }} style={styles.trendingImage} />
              <TouchableOpacity
                style={[styles.trendingPlayBtn, { backgroundColor: colors.primary }]}
                onPress={() => playTrack(item, trendingTracks, index)}
              >
                <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
              </TouchableOpacity>
              <Text numberOfLines={1} style={[styles.cardTitle, { color: colors.text }]}>
                {item.title}
              </Text>
              <Text numberOfLines={1} style={[styles.cardArtist, { color: colors.textSecondary }]}>
                {item.artist}
              </Text>
            </TouchableOpacity>
          )}
        />

        {/* Recently Played Section (if any) */}
        {history.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Clock size={20} color={colors.accent} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t.home.recentlyPlayed}
              </Text>
            </View>
            {history.slice(0, 4).map((item, index) => (
              <TrackItem key={`hist_${item.id}_${index}`} track={item} queue={history} index={index} />
            ))}
          </View>
        )}

        {/* Quick Picks List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Sparkles size={20} color={colors.primaryLight} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.home.quickPicks}</Text>
          </View>

          {quickPicks.slice(0, 5).map((item, index) => (
            <TrackItem key={item.id} track={item} queue={quickPicks} index={index} />
          ))}
        </View>

        {/* Curated Playlists / Mixes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Radio size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t.home.curatedPlaylists}
            </Text>
          </View>

          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={playlists}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.horizontalList}
            ListEmptyComponent={
              <TouchableOpacity
                style={[styles.playlistCard, { backgroundColor: colors.surface }]}
                onPress={() => navigation.navigate('MainTabs', { screen: 'LibraryTab' })}
              >
                <View style={[styles.playlistPlaceholder, { backgroundColor: colors.surfaceVariant }]}>
                  <Sparkles size={24} color={colors.primaryLight} />
                </View>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Explore Playlists</Text>
                <Text style={[styles.cardArtist, { color: colors.textSecondary }]}>
                  Create your personal mix
                </Text>
              </TouchableOpacity>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.playlistCard, { backgroundColor: colors.surface }]}
                onPress={() => navigation.navigate('PlaylistDetail', { playlistId: item.id, title: item.title })}
                activeOpacity={0.8}
              >
                {item.coverImage ? (
                  <Image source={{ uri: item.coverImage }} style={styles.playlistImage} />
                ) : (
                  <View style={[styles.playlistPlaceholder, { backgroundColor: colors.surfaceVariant }]}>
                    <Radio size={24} color={colors.primaryLight} />
                  </View>
                )}
                <Text numberOfLines={1} style={[styles.cardTitle, { color: colors.text }]}>
                  {item.title}
                </Text>
                <Text numberOfLines={1} style={[styles.cardArtist, { color: colors.textSecondary }]}>
                  {t.library.tracksCount(item.tracks?.length || 0)}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  horizontalList: {
    paddingLeft: 20,
    paddingRight: 8,
    gap: 14,
  },
  trendingCard: {
    width: 150,
    padding: 10,
    borderRadius: 16,
    position: 'relative',
  },
  trendingImage: {
    width: 130,
    height: 130,
    borderRadius: 12,
    marginBottom: 8,
  },
  trendingPlayBtn: {
    position: 'absolute',
    right: 18,
    bottom: 58,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  playlistCard: {
    width: 140,
    padding: 10,
    borderRadius: 16,
  },
  playlistImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginBottom: 8,
  },
  playlistPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  cardArtist: {
    fontSize: 12,
    marginTop: 2,
  },
});
