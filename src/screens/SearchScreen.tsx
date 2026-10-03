import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Image,
  Modal,
  Linking,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Search as SearchIcon,
  X,
  History,
  Music,
  Key,
  ExternalLink,
  Youtube,
  Disc3,
  Layers,
  Calendar,
  AlertCircle,
} from 'lucide-react-native';
import { Header } from '../components/Header';
import { TrackItem } from '../components/TrackItem';
import { useTheme } from '../theme/themeContext';
import { musicApi } from '../services/api/musicApi';
import { Track, Artist, Album, SearchSource } from '../types';
import { RootStackParamList } from '../navigation/types';

type FilterType = 'all' | 'tracks' | 'artists' | 'albums';

export const SearchScreen: React.FC = () => {
  const { colors, t } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [query, setQuery] = useState('');
  const [source, setSource] = useState<SearchSource>('catalog');
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [results, setResults] = useState<{
    tracks: Track[];
    artists: Artist[];
    albums: Album[];
  }>({
    tracks: [],
    artists: [],
    albums: [],
  });

  const [recentSearches, setRecentSearches] = useState<string[]>([
    'Synthwave',
    'Aetheris',
    'Lofi Moments',
    'Solar Flare',
  ]);

  // Direct API Key Modal
  const [apiKeyModalVisible, setApiKeyModalVisible] = useState(false);
  const [inputApiKey, setInputApiKey] = useState('');

  const executeSearch = useCallback(
    async (searchTerm: string, activeFilter: FilterType, activeSource: SearchSource, pageToken?: string) => {
      const trimmed = searchTerm.trim();
      if (!trimmed) {
        setResults({ tracks: [], artists: [], albums: [] });
        setNextPageToken(undefined);
        setErrorMessage(null);
        return;
      }

      if (pageToken) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setErrorMessage(null);
      }

      try {
        const res = await musicApi.search(trimmed, activeFilter, activeSource, pageToken);
        if (res.error) {
          setErrorMessage(res.error);
          if (!pageToken) {
            setResults({ tracks: [], artists: [], albums: [] });
          }
        } else {
          setErrorMessage(null);
          if (pageToken) {
            setResults((prev) => ({
              tracks: [...prev.tracks, ...res.tracks],
              artists: [...prev.artists, ...res.artists],
              albums: [...prev.albums, ...res.albums],
            }));
          } else {
            setResults({
              tracks: res.tracks,
              artists: res.artists,
              albums: res.albums,
            });
          }
          setNextPageToken(res.nextPageToken);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Search failed';
        setErrorMessage(msg);
        if (!pageToken) {
          setResults({ tracks: [], artists: [], albums: [] });
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      executeSearch(query, filter, source);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, filter, source, executeSearch]);

  const handleSelectRecent = (term: string) => {
    setQuery(term);
  };

  const handleClearHistory = () => {
    setRecentSearches([]);
  };

  const handleLoadMore = () => {
    if (nextPageToken && !loadingMore && query.trim()) {
      executeSearch(query, filter, source, nextPageToken);
    }
  };

  const handleSaveApiKey = async () => {
    if (!inputApiKey.trim()) {
      Alert.alert('Error', 'Please enter a valid YouTube API key.');
      return;
    }
    await musicApi.configureYouTubeApiKey(inputApiKey.trim());
    setApiKeyModalVisible(false);
    setInputApiKey('');
    Alert.alert(t.common.success, t.settings.apiKeySaved);
    // Re-execute current search with newly added key
    executeSearch(query, filter, 'youtube');
  };

  const handleOpenExternal = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Unable to open URL', url);
      }
    } catch {
      Alert.alert('Error opening link', url);
    }
  };

  const hasResults =
    results.tracks.length > 0 || results.artists.length > 0 || results.albums.length > 0;

  const isConfigError =
    errorMessage?.includes('YouTube API is not configured') ||
    errorMessage?.includes('Configure YouTube Data API') ||
    errorMessage?.includes('YOUTUBE_API_KEY');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title={t.search.all}
        subtitle={source === 'youtube' ? 'YouTube Data API v3' : 'Curated Catalog'}
      />

      {/* Source Segmented Switch */}
      <View style={[styles.sourceSwitchContainer, { backgroundColor: colors.surfaceVariant }]}>
        <TouchableOpacity
          style={[
            styles.sourceOption,
            source === 'catalog' && [styles.sourceOptionActive, { backgroundColor: colors.primary }],
          ]}
          onPress={() => {
            setSource('catalog');
            setErrorMessage(null);
          }}
        >
          <Disc3 size={16} color={source === 'catalog' ? '#FFFFFF' : colors.textSecondary} />
          <Text
            style={[
              styles.sourceText,
              { color: source === 'catalog' ? '#FFFFFF' : colors.textSecondary },
            ]}
          >
            {t.search.catalog}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.sourceOption,
            source === 'youtube' && [styles.sourceOptionActive, { backgroundColor: '#FF0000' }],
          ]}
          onPress={() => {
            setSource('youtube');
            setErrorMessage(null);
          }}
        >
          <Youtube size={16} color={source === 'youtube' ? '#FFFFFF' : colors.textSecondary} />
          <Text
            style={[
              styles.sourceText,
              { color: source === 'youtube' ? '#FFFFFF' : colors.textSecondary },
            ]}
          >
            {t.search.youtube}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar Input */}
      <View
        style={[
          styles.searchBar,
          { backgroundColor: colors.surfaceVariant, borderColor: colors.border },
        ]}
      >
        <SearchIcon size={20} color={colors.textSecondary} />
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder={
            source === 'youtube'
              ? 'Search YouTube videos, artists, playlists...'
              : t.search.placeholder
          }
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          testID="search-input"
        />
        {query.length > 0 && (
          <TouchableOpacity
            onPress={() => setQuery('')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['all', 'tracks', 'artists', 'albums'] as FilterType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.filterChip,
              {
                backgroundColor: filter === tab ? colors.primary : colors.surfaceVariant,
              },
            ]}
            onPress={() => setFilter(tab)}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: filter === tab ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              {tab === 'all'
                ? t.search.all
                : tab === 'tracks'
                ? t.search.tracks
                : tab === 'artists'
                ? t.search.artists
                : t.search.albums}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Body Area */}
      <ScrollView contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              {source === 'youtube' ? 'Searching YouTube Data API v3...' : t.search.searching}
            </Text>
          </View>
        )}

        {/* Missing API Key Banner/Prompt */}
        {!loading && source === 'youtube' && isConfigError && (
          <View style={[styles.configCard, { backgroundColor: colors.surface, borderColor: colors.warning }]}>
            <View style={styles.configHeader}>
              <Key size={24} color={colors.warning} />
              <Text style={[styles.configTitle, { color: colors.text }]}>
                YouTube Data API Configuration
              </Text>
            </View>
            <Text style={[styles.configDescription, { color: colors.textSecondary }]}>
              {t.search.configureYouTube}
            </Text>
            <View style={styles.configActionRow}>
              <TouchableOpacity
                style={[styles.configBtn, { backgroundColor: colors.primary }]}
                onPress={() => setApiKeyModalVisible(true)}
              >
                <Key size={16} color="#FFFFFF" />
                <Text style={styles.configBtnText}>{t.search.configureApiKeyBtn}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.configBtnSecondary, { borderColor: colors.border }]}
                onPress={() => navigation.navigate('MainTabs', { screen: 'SettingsTab' })}
              >
                <Text style={[styles.configBtnSecondaryText, { color: colors.textSecondary }]}>
                  Open Settings
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* General Error Banner */}
        {!loading && errorMessage && !isConfigError && (
          <View style={[styles.errorCard, { backgroundColor: colors.surface, borderColor: colors.error }]}>
            <AlertCircle size={20} color={colors.error} />
            <Text style={[styles.errorCardText, { color: colors.text }]}>{errorMessage}</Text>
          </View>
        )}

        {/* Recent Searches (shown when no query and no error) */}
        {!loading && !query && !errorMessage && recentSearches.length > 0 && (
          <View style={styles.recentSection}>
            <View style={styles.recentHeader}>
              <View style={styles.recentTitleGroup}>
                <History size={18} color={colors.primaryLight} />
                <Text style={[styles.recentTitle, { color: colors.text }]}>
                  {t.search.recentSearches}
                </Text>
              </View>
              <TouchableOpacity onPress={handleClearHistory}>
                <Text style={[styles.clearBtn, { color: colors.textMuted }]}>
                  {t.search.clearHistory}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.recentTags}>
              {recentSearches.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.tag, { backgroundColor: colors.surfaceVariant }]}
                  onPress={() => handleSelectRecent(item)}
                >
                  <Text style={[styles.tagText, { color: colors.text }]}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Empty State */}
        {!loading && query && !hasResults && !errorMessage && (
          <View style={styles.emptyContainer}>
            <Music size={48} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {t.search.noResults}
            </Text>
          </View>
        )}

        {/* Results: Tracks / Videos */}
        {!loading && results.tracks.length > 0 && (
          <View style={styles.resultSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.resultTitle, { color: colors.text }]}>
                {source === 'youtube' ? 'YouTube Music Videos & Songs' : t.search.tracks}
              </Text>
              {source === 'youtube' && (
                <View style={styles.badgeYoutube}>
                  <Youtube size={12} color="#FFFFFF" />
                  <Text style={styles.badgeYoutubeText}>YouTube</Text>
                </View>
              )}
            </View>

            {results.tracks.map((track, idx) => (
              <View key={track.id} style={styles.trackCardWrapper}>
                <TrackItem track={track} queue={results.tracks} index={idx} />
                {track.source === 'youtube' && (
                  <View style={styles.youtubeMetaBar}>
                    {track.publishedAt && (
                      <View style={styles.metaItem}>
                        <Calendar size={12} color={colors.textMuted} />
                        <Text style={[styles.metaText, { color: colors.textMuted }]}>
                          {new Date(track.publishedAt).toLocaleDateString()}
                        </Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.openYtLink}
                      onPress={() => handleOpenExternal(track.url)}
                    >
                      <Text style={[styles.openYtText, { color: colors.primaryLight }]}>
                        {t.search.openInYouTube}
                      </Text>
                      <ExternalLink size={12} color={colors.primaryLight} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Results: Artists / Channels */}
        {!loading && results.artists.length > 0 && (
          <View style={styles.resultSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.resultTitle, { color: colors.text }]}>
                {source === 'youtube' ? 'YouTube Channels & Artists' : t.search.artists}
              </Text>
              {source === 'youtube' && (
                <View style={styles.badgeYoutube}>
                  <Layers size={12} color="#FFFFFF" />
                  <Text style={styles.badgeYoutubeText}>Channels</Text>
                </View>
              )}
            </View>

            <FlatList
              horizontal
              data={results.artists}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ gap: 14 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.artistResultCard}
                  onPress={() => {
                    if (item.source === 'youtube' && item.channelId) {
                      handleOpenExternal(`https://www.youtube.com/channel/${item.channelId}`);
                    } else {
                      navigation.navigate('ArtistDetail', { artistId: item.id, name: item.name });
                    }
                  }}
                >
                  <Image source={{ uri: item.image }} style={styles.artistResultImage} />
                  <Text numberOfLines={1} style={[styles.artistResultName, { color: colors.text }]}>
                    {item.name}
                  </Text>
                  {item.source === 'youtube' && (
                    <Text style={[styles.badgeSubText, { color: colors.textMuted }]}>Channel</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Results: Albums / Playlists */}
        {!loading && results.albums.length > 0 && (
          <View style={styles.resultSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.resultTitle, { color: colors.text }]}>
                {source === 'youtube' ? 'YouTube Playlists' : t.search.albums}
              </Text>
              {source === 'youtube' && (
                <View style={styles.badgeYoutube}>
                  <Disc3 size={12} color="#FFFFFF" />
                  <Text style={styles.badgeYoutubeText}>Playlists</Text>
                </View>
              )}
            </View>

            <FlatList
              horizontal
              data={results.albums}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ gap: 14 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.albumResultCard, { backgroundColor: colors.surface }]}
                  onPress={() => {
                    if (item.source === 'youtube' && item.playlistId) {
                      handleOpenExternal(`https://www.youtube.com/playlist?list=${item.playlistId}`);
                    } else {
                      navigation.navigate('AlbumDetail', { albumId: item.id, title: item.title });
                    }
                  }}
                >
                  <Image source={{ uri: item.artwork }} style={styles.albumResultImage} />
                  <Text
                    numberOfLines={1}
                    style={[styles.albumResultTitle, { color: colors.text }]}
                  >
                    {item.title}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[styles.albumResultArtist, { color: colors.textSecondary }]}
                  >
                    {item.artist}
                  </Text>
                  {item.source === 'youtube' && (
                    <View style={styles.playlistMetaRow}>
                      <Text style={[styles.badgeSubText, { color: colors.textMuted }]}>
                        YouTube Playlist
                      </Text>
                      <ExternalLink size={10} color={colors.textMuted} />
                    </View>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Load More Button (Pagination) */}
        {!loading && nextPageToken && hasResults && (
          <View style={styles.loadMoreContainer}>
            <TouchableOpacity
              style={[styles.loadMoreBtn, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}
              onPress={handleLoadMore}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={[styles.loadMoreBtnText, { color: colors.text }]}>
                  {t.search.loadMore}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* In-App API Key Entry Modal */}
      <Modal
        visible={apiKeyModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setApiKeyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Youtube size={22} color="#FF0000" />
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {t.settings.enterApiKey}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setApiKeyModalVisible(false)}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              {t.settings.apiKeyHelp}
            </Text>

            <TextInput
              style={[
                styles.modalInput,
                { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: colors.border },
              ]}
              placeholder="Paste API key here..."
              placeholderTextColor={colors.textMuted}
              value={inputApiKey}
              onChangeText={setInputApiKey}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { backgroundColor: colors.surfaceVariant }]}
                onPress={() => setApiKeyModalVisible(false)}
              >
                <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>
                  {t.library.cancel}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSaveBtn, { backgroundColor: colors.primary }]}
                onPress={handleSaveApiKey}
              >
                <Text style={styles.modalSaveText}>{t.settings.saveApiKey}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sourceSwitchContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  sourceOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  sourceOptionActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  sourceText: {
    fontSize: 13,
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  bodyContent: {
    paddingBottom: 120,
    paddingTop: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  configCard: {
    marginHorizontal: 20,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    gap: 12,
  },
  configHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  configTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  configDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  configActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  configBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  configBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  configBtnSecondary: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
  },
  configBtnSecondaryText: {
    fontSize: 13,
    fontWeight: '600',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    marginBottom: 16,
  },
  errorCardText: {
    fontSize: 13,
    flex: 1,
  },
  recentSection: {
    paddingHorizontal: 20,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recentTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  clearBtn: {
    fontSize: 13,
  },
  recentTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
    gap: 14,
  },
  emptyText: {
    fontSize: 15,
  },
  resultSection: {
    marginTop: 18,
    paddingHorizontal: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  badgeYoutube: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF0000',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  badgeYoutubeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  trackCardWrapper: {
    marginBottom: 8,
  },
  youtubeMetaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 6,
    marginTop: -4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
  },
  openYtLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  openYtText: {
    fontSize: 11,
    fontWeight: '600',
  },
  artistResultCard: {
    alignItems: 'center',
    width: 90,
  },
  artistResultImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 6,
  },
  artistResultName: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  badgeSubText: {
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
  albumResultCard: {
    width: 130,
    padding: 8,
    borderRadius: 14,
  },
  albumResultImage: {
    width: 114,
    height: 114,
    borderRadius: 10,
    marginBottom: 6,
  },
  albumResultTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  albumResultArtist: {
    fontSize: 11,
    marginTop: 2,
  },
  playlistMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  loadMoreContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  loadMoreBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 140,
    alignItems: 'center',
  },
  loadMoreBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    borderRadius: 20,
    padding: 20,
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  modalInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalSaveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
