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
import {
  Play,
  Sparkles,
  Flame,
  Clock,
  Radio,
  Disc3,
  Users,
  Heart,
  RotateCcw,
  AlertCircle,
  Plus,
} from 'lucide-react-native';
import { Header } from '../components/Header';
import { OfflineBanner } from '../components/OfflineBanner';
import { useTheme } from '../theme/themeContext';
import { usePlayerStore } from '../store/playerStore';
import { useLibraryStore } from '../store/libraryStore';
import { musicApi } from '../services/api/musicApi';
import { Track, Artist } from '../types';
import { RootStackParamList } from '../navigation/types';

export const HomeScreen: React.FC = () => {
  const { colors, t } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { playTrack } = usePlayerStore();
  const { history, playlists, favorites, loadLibraryData } = useLibraryStore();

  const [trendingTracks, setTrendingTracks] = useState<Track[]>([]);
  const [quickPicks, setQuickPicks] = useState<Track[]>([]);
  const [recommendedSongs, setRecommendedSongs] = useState<Track[]>([]);
  const [recommendedArtists, setRecommendedArtists] = useState<Artist[]>([]);
  const [newReleases, setNewReleases] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setHasError(false);
      const [trending, quick, recSongs, recArtists, releases] = await Promise.all([
        musicApi.getTrendingTracks(),
        musicApi.getQuickPicks(),
        musicApi.getRecommendedSongs(),
        musicApi.getRecommendedArtists(),
        musicApi.getNewReleases(),
      ]);
      setTrendingTracks(trending);
      setQuickPicks(quick);
      setRecommendedSongs(recSongs);
      setRecommendedArtists(recArtists);
      setNewReleases(releases);
      await loadLibraryData();
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [loadLibraryData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const renderSkeleton = () => (
    <View style={styles.skeletonContainer}>
      <View style={styles.skeletonHeader} />
      <View style={styles.skeletonRow}>
        {[1, 2, 3].map((i) => (
          <View
            key={i}
            style={[styles.skeletonCard, { backgroundColor: colors.surfaceVariant }]}
          />
        ))}
      </View>
      <View style={styles.skeletonHeader} />
      <View style={styles.skeletonRow}>
        {[4, 5, 6].map((i) => (
          <View
            key={i}
            style={[styles.skeletonCard, { backgroundColor: colors.surfaceVariant }]}
          />
        ))}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header />
      <OfflineBanner />

      {isLoading ? (
        renderSkeleton()
      ) : hasError ? (
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color={colors.error} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>Unable to load content</Text>
          <Text style={[styles.errorSubtitle, { color: colors.textSecondary }]}>
            Please check your connection and tap retry.
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              setIsLoading(true);
              loadData();
            }}
          >
            <RotateCcw size={16} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* SECTION 1: QUICK PICKS */}
          {quickPicks.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Sparkles size={20} color={colors.primaryLight} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {t.home.quickPicks}
                </Text>
              </View>

              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={quickPicks}
                keyExtractor={(item) => `qp_${item.id}`}
                contentContainerStyle={styles.horizontalList}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    style={[styles.trackCard, { backgroundColor: colors.surface }]}
                    onPress={() => playTrack(item, quickPicks, index)}
                    activeOpacity={0.8}
                    accessibilityLabel={`Play ${item.title} by ${item.artist}`}
                  >
                    <Image source={{ uri: item.artwork }} style={styles.cardImage} />
                    <TouchableOpacity
                      style={[styles.playBtnOverlay, { backgroundColor: colors.primary }]}
                      onPress={() => playTrack(item, quickPicks, index)}
                      accessibilityLabel="Play song"
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
            </View>
          )}

          {/* SECTION 2: RECENTLY PLAYED */}
          {history.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Clock size={20} color={colors.accent} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {t.home.recentlyPlayed}
                </Text>
              </View>

              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={history.slice(0, 10)}
                keyExtractor={(item, index) => `hist_${item.id}_${index}`}
                contentContainerStyle={styles.horizontalList}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    style={[styles.trackCard, { backgroundColor: colors.surface }]}
                    onPress={() => playTrack(item, history, index)}
                    activeOpacity={0.8}
                    accessibilityLabel={`Play ${item.title}`}
                  >
                    <Image source={{ uri: item.artwork }} style={styles.cardImage} />
                    <Text numberOfLines={1} style={[styles.cardTitle, { color: colors.text }]}>
                      {item.title}
                    </Text>
                    <Text numberOfLines={1} style={[styles.cardArtist, { color: colors.textSecondary }]}>
                      {item.artist}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

          {/* SECTION 3: RECOMMENDED SONGS */}
          {recommendedSongs.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Disc3 size={20} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Recommended Songs
                </Text>
              </View>

              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={recommendedSongs}
                keyExtractor={(item) => `rec_${item.id}`}
                contentContainerStyle={styles.horizontalList}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    style={[styles.trackCard, { backgroundColor: colors.surface }]}
                    onPress={() => playTrack(item, recommendedSongs, index)}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: item.artwork }} style={styles.cardImage} />
                    <TouchableOpacity
                      style={[styles.playBtnOverlay, { backgroundColor: colors.primary }]}
                      onPress={() => playTrack(item, recommendedSongs, index)}
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
            </View>
          )}

          {/* SECTION 4: RECOMMENDED ARTISTS */}
          {recommendedArtists.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Users size={20} color={colors.secondary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Featured Artists
                </Text>
              </View>

              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={recommendedArtists}
                keyExtractor={(item) => `art_${item.id}`}
                contentContainerStyle={styles.horizontalList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.artistCircleCard}
                    onPress={() => navigation.navigate('ArtistDetail', { artistId: item.id, name: item.name })}
                    activeOpacity={0.8}
                    accessibilityLabel={`View artist ${item.name}`}
                  >
                    <Image source={{ uri: item.image }} style={styles.artistCircleImage} />
                    <Text numberOfLines={1} style={[styles.artistCircleName, { color: colors.text }]}>
                      {item.name}
                    </Text>
                    <Text numberOfLines={1} style={[styles.artistCircleSub, { color: colors.textSecondary }]}>
                      {item.genres?.[0] || 'Artist'}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

          {/* SECTION 5: TRENDING MUSIC */}
          {trendingTracks.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Flame size={20} color="#FF7675" />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {t.home.trendingNow}
                </Text>
              </View>

              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={trendingTracks}
                keyExtractor={(item) => `trend_${item.id}`}
                contentContainerStyle={styles.horizontalList}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    style={[styles.trackCard, { backgroundColor: colors.surface }]}
                    onPress={() => playTrack(item, trendingTracks, index)}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: item.artwork }} style={styles.cardImage} />
                    <TouchableOpacity
                      style={[styles.playBtnOverlay, { backgroundColor: colors.primary }]}
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
            </View>
          )}

          {/* SECTION 6: NEW RELEASES */}
          {newReleases.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Radio size={20} color={colors.accent} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  New Releases
                </Text>
              </View>

              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={newReleases}
                keyExtractor={(item) => `nr_${item.id}`}
                contentContainerStyle={styles.horizontalList}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    style={[styles.trackCard, { backgroundColor: colors.surface }]}
                    onPress={() => playTrack(item, newReleases, index)}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: item.artwork }} style={styles.cardImage} />
                    <Text numberOfLines={1} style={[styles.cardTitle, { color: colors.text }]}>
                      {item.title}
                    </Text>
                    <Text numberOfLines={1} style={[styles.cardArtist, { color: colors.textSecondary }]}>
                      {item.artist}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

          {/* SECTION 7: YOUR PLAYLISTS */}
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
              keyExtractor={(item) => `pl_${item.id}`}
              contentContainerStyle={styles.horizontalList}
              ListEmptyComponent={
                <TouchableOpacity
                  style={[styles.emptyPlaylistCard, { backgroundColor: colors.surface }]}
                  onPress={() => navigation.navigate('MainTabs', { screen: 'LibraryTab' })}
                  activeOpacity={0.8}
                >
                  <Plus size={24} color={colors.primaryLight} />
                  <Text style={[styles.emptyPlaylistTitle, { color: colors.text }]}>
                    Create Playlist
                  </Text>
                  <Text style={[styles.emptyPlaylistSub, { color: colors.textSecondary }]}>
                    Add your favorite songs
                  </Text>
                </TouchableOpacity>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.playlistCard, { backgroundColor: colors.surface }]}
                  onPress={() => navigation.navigate('PlaylistDetail', { playlistId: item.id, title: item.title })}
                  activeOpacity={0.8}
                >
                  <View style={[styles.playlistArtPlaceholder, { backgroundColor: colors.surfaceVariant }]}>
                    <Radio size={36} color={colors.primaryLight} />
                  </View>
                  <Text numberOfLines={1} style={[styles.cardTitle, { color: colors.text }]}>
                    {item.title}
                  </Text>
                  <Text numberOfLines={1} style={[styles.cardArtist, { color: colors.textSecondary }]}>
                    {item.tracks?.length || 0} songs
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>

          {/* SECTION 8: FAVORITES (IF ANY) */}
          {favorites.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Heart size={20} color={colors.secondary} fill={colors.secondary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Your Favorites ({favorites.length})
                </Text>
              </View>

              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={favorites}
                keyExtractor={(item) => `fav_${item.id}`}
                contentContainerStyle={styles.horizontalList}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    style={[styles.trackCard, { backgroundColor: colors.surface }]}
                    onPress={() => playTrack(item, favorites, index)}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: item.artwork }} style={styles.cardImage} />
                    <TouchableOpacity
                      style={[styles.playBtnOverlay, { backgroundColor: colors.primary }]}
                      onPress={() => playTrack(item, favorites, index)}
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
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  horizontalList: {
    paddingHorizontal: 20,
    gap: 14,
  },
  trackCard: {
    width: 152,
    borderRadius: 16,
    padding: 10,
    position: 'relative',
  },
  cardImage: {
    width: 132,
    height: 132,
    borderRadius: 12,
    marginBottom: 8,
  },
  playBtnOverlay: {
    position: 'absolute',
    right: 18,
    top: 106,
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  cardArtist: {
    fontSize: 12,
  },
  artistCircleCard: {
    width: 104,
    alignItems: 'center',
    marginRight: 6,
  },
  artistCircleImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
    marginBottom: 8,
  },
  artistCircleName: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  artistCircleSub: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
  },
  playlistCard: {
    width: 152,
    borderRadius: 16,
    padding: 10,
  },
  playlistArtPlaceholder: {
    width: 132,
    height: 132,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyPlaylistCard: {
    width: 220,
    height: 140,
    borderRadius: 16,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    borderColor: '#7F8FA6',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    gap: 4,
  },
  emptyPlaylistTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  emptyPlaylistSub: {
    fontSize: 12,
    textAlign: 'center',
  },
  skeletonContainer: {
    padding: 20,
    gap: 20,
  },
  skeletonHeader: {
    width: 160,
    height: 20,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  skeletonRow: {
    flexDirection: 'row',
    gap: 14,
  },
  skeletonCard: {
    width: 140,
    height: 170,
    borderRadius: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    gap: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },
  errorSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
