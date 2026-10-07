import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Music,
  Disc3,
  Users,
  Heart,
  ArrowDownCircle,
  Clock,
  ListMusic,
  Plus,
  Play,
  Trash2,
} from 'lucide-react-native';
import { Header } from '../components/Header';
import { TrackItem } from '../components/TrackItem';
import { useTheme } from '../theme/themeContext';
import { useLibraryStore } from '../store/libraryStore';
import { usePlayerStore } from '../store/playerStore';
import { musicApi } from '../services/api/musicApi';
import { Track, Album, Artist } from '../types';
import { RootStackParamList } from '../navigation/types';

type LibraryTab =
  | 'songs'
  | 'albums'
  | 'artists'
  | 'playlists'
  | 'favorites'
  | 'history'
  | 'downloads';

export const LibraryScreen: React.FC = () => {
  const { colors, t } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    playlists,
    favorites,
    downloads,
    history,
    allTracks,
    loadLibraryData,
    createPlaylist,
    clearHistory,
  } = useLibraryStore();
  const { playTrack } = usePlayerStore();

  const [activeTab, setActiveTab] = useState<LibraryTab>('songs');
  const [albums, setAlbums] = useState<Album[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [catalogSongs, setCatalogSongs] = useState<Track[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');

  const loadExtraData = useCallback(async () => {
    try {
      const [albs, arts, trks] = await Promise.all([
        musicApi.getAlbums(),
        musicApi.getArtists(),
        musicApi.getTrendingTracks(),
      ]);
      setAlbums(albs);
      setArtists(arts);
      setCatalogSongs(trks);
    } catch {
      // Fallback
    }
  }, []);

  useEffect(() => {
    loadLibraryData();
    loadExtraData();
  }, [loadLibraryData, loadExtraData]);

  const handleCreatePlaylist = () => {
    if (!newPlaylistTitle.trim()) {
      Alert.alert('Required', 'Please enter a playlist name.');
      return;
    }
    createPlaylist(newPlaylistTitle.trim(), newPlaylistDesc.trim());
    setNewPlaylistTitle('');
    setNewPlaylistDesc('');
    setModalVisible(false);
  };

  const handlePlayAll = (tracks: Track[]) => {
    if (tracks.length > 0) {
      playTrack(tracks[0], tracks, 0);
    }
  };

  // Determine songs list: prefer stored tracks or catalog fallback
  const librarySongs: Track[] =
    allTracks.length > 0
      ? allTracks
      : favorites.length > 0
        ? favorites
        : catalogSongs;

  const tabsConfig = [
    { key: 'songs' as LibraryTab, label: t.library.songs, icon: Music, count: librarySongs.length },
    { key: 'albums' as LibraryTab, label: t.library.albums, icon: Disc3, count: albums.length },
    { key: 'artists' as LibraryTab, label: t.library.artists, icon: Users, count: artists.length },
    { key: 'playlists' as LibraryTab, label: t.library.playlists, icon: ListMusic, count: playlists.length },
    { key: 'favorites' as LibraryTab, label: t.library.favorites, icon: Heart, count: favorites.length },
    { key: 'downloads' as LibraryTab, label: t.library.downloads, icon: ArrowDownCircle, count: downloads.length },
    { key: 'history' as LibraryTab, label: t.library.history, icon: Clock, count: history.length },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title={t.library.title} subtitle="Personal Collection" />

      {/* HORIZONTAL CATEGORY FILTER CHIPS */}
      <View style={styles.chipBarContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipScroll}
        >
          {tabsConfig.map((tab) => {
            const isActive = activeTab === tab.key;
            const Icon = tab.icon;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isActive ? colors.primary : colors.surfaceVariant,
                    borderColor: isActive ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.8}
              >
                <Icon
                  size={15}
                  color={isActive ? '#FFFFFF' : colors.textMuted}
                />
                <Text
                  style={[
                    styles.chipText,
                    {
                      color: isActive ? '#FFFFFF' : colors.text,
                      fontWeight: isActive ? '700' : '500',
                    },
                  ]}
                >
                  {tab.label} ({tab.count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        {/* TAB 1: SONGS */}
        {activeTab === 'songs' && (
          <View style={styles.section}>
            {librarySongs.length > 0 && (
              <TouchableOpacity
                style={[styles.playAllBtn, { backgroundColor: colors.primary }]}
                onPress={() => handlePlayAll(librarySongs)}
                activeOpacity={0.8}
              >
                <Play size={18} color="#FFFFFF" fill="#FFFFFF" />
                <Text style={styles.playAllText}>Play All Songs ({librarySongs.length})</Text>
              </TouchableOpacity>
            )}

            {librarySongs.length === 0 ? (
              <View style={styles.emptyState}>
                <Music size={40} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  {t.library.emptySongs}
                </Text>
              </View>
            ) : (
              librarySongs.map((track, idx) => (
                <TrackItem key={`lib_song_${track.id}_${idx}`} track={track} queue={librarySongs} index={idx} />
              ))
            )}
          </View>
        )}

        {/* TAB 2: ALBUMS */}
        {activeTab === 'albums' && (
          <View style={styles.section}>
            {albums.length === 0 ? (
              <View style={styles.emptyState}>
                <Disc3 size={40} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  {t.library.emptyAlbums}
                </Text>
              </View>
            ) : (
              <View style={styles.albumGrid}>
                {albums.map((alb) => (
                  <TouchableOpacity
                    key={alb.id}
                    style={[styles.albumCard, { backgroundColor: colors.surface }]}
                    onPress={() => navigation.navigate('AlbumDetail', { albumId: alb.id, title: alb.title })}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: alb.artwork }} style={styles.albumArt} />
                    <Text numberOfLines={1} style={[styles.albumTitle, { color: colors.text }]}>
                      {alb.title}
                    </Text>
                    <Text numberOfLines={1} style={[styles.albumArtist, { color: colors.textSecondary }]}>
                      {alb.artist}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* TAB 3: ARTISTS */}
        {activeTab === 'artists' && (
          <View style={styles.section}>
            {artists.length === 0 ? (
              <View style={styles.emptyState}>
                <Users size={40} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  {t.library.emptyArtists}
                </Text>
              </View>
            ) : (
              artists.map((art) => (
                <TouchableOpacity
                  key={art.id}
                  style={[styles.artistItem, { backgroundColor: colors.surface }]}
                  onPress={() => navigation.navigate('ArtistDetail', { artistId: art.id, name: art.name })}
                  activeOpacity={0.7}
                >
                  <Image source={{ uri: art.image }} style={styles.artistAvatar} />
                  <View style={styles.artistInfo}>
                    <Text numberOfLines={1} style={[styles.artistName, { color: colors.text }]}>
                      {art.name}
                    </Text>
                    <Text numberOfLines={1} style={[styles.artistSub, { color: colors.textSecondary }]}>
                      {art.genres ? art.genres.join(' • ') : 'Artist'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* TAB 4: PLAYLISTS */}
        {activeTab === 'playlists' && (
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}
              onPress={() => setModalVisible(true)}
              activeOpacity={0.8}
            >
              <Plus size={20} color={colors.primaryLight} />
              <Text style={[styles.createButtonText, { color: colors.primaryLight }]}>
                {t.library.createPlaylist}
              </Text>
            </TouchableOpacity>

            {playlists.length === 0 ? (
              <View style={styles.emptyState}>
                <ListMusic size={40} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  {t.library.emptyPlaylists}
                </Text>
              </View>
            ) : (
              playlists.map((pl) => (
                <TouchableOpacity
                  key={pl.id}
                  style={[styles.playlistItem, { backgroundColor: colors.surface }]}
                  onPress={() => navigation.navigate('PlaylistDetail', { playlistId: pl.id, title: pl.title })}
                  activeOpacity={0.7}
                >
                  <View style={[styles.plIconWrap, { backgroundColor: colors.surfaceVariant }]}>
                    <ListMusic size={22} color={colors.primaryLight} />
                  </View>
                  <View style={styles.plInfo}>
                    <Text numberOfLines={1} style={[styles.plTitle, { color: colors.text }]}>
                      {pl.title}
                    </Text>
                    <Text numberOfLines={1} style={[styles.plSub, { color: colors.textSecondary }]}>
                      {t.library.tracksCount(pl.tracks?.length || 0)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* TAB 5: FAVORITES */}
        {activeTab === 'favorites' && (
          <View style={styles.section}>
            {favorites.length > 0 && (
              <TouchableOpacity
                style={[styles.playAllBtn, { backgroundColor: colors.primary }]}
                onPress={() => handlePlayAll(favorites)}
                activeOpacity={0.8}
              >
                <Play size={18} color="#FFFFFF" fill="#FFFFFF" />
                <Text style={styles.playAllText}>Play All ({favorites.length})</Text>
              </TouchableOpacity>
            )}

            {favorites.length === 0 ? (
              <View style={styles.emptyState}>
                <Heart size={40} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  {t.library.emptyFavorites}
                </Text>
              </View>
            ) : (
              favorites.map((track, idx) => (
                <TrackItem key={`fav_${track.id}_${idx}`} track={track} queue={favorites} index={idx} />
              ))
            )}
          </View>
        )}

        {/* TAB 6: DOWNLOADS */}
        {activeTab === 'downloads' && (
          <View style={styles.section}>
            {downloads.length > 0 && (
              <TouchableOpacity
                style={[styles.playAllBtn, { backgroundColor: colors.primary }]}
                onPress={() => handlePlayAll(downloads)}
                activeOpacity={0.8}
              >
                <Play size={18} color="#FFFFFF" fill="#FFFFFF" />
                <Text style={styles.playAllText}>Play Offline Songs ({downloads.length})</Text>
              </TouchableOpacity>
            )}

            {downloads.length === 0 ? (
              <View style={styles.emptyState}>
                <ArrowDownCircle size={40} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  {t.library.emptyDownloads}
                </Text>
              </View>
            ) : (
              downloads.map((track, idx) => (
                <TrackItem key={`dl_${track.id}_${idx}`} track={track} queue={downloads} index={idx} />
              ))
            )}
          </View>
        )}

        {/* TAB 7: HISTORY */}
        {activeTab === 'history' && (
          <View style={styles.section}>
            {history.length > 0 && (
              <View style={styles.historyHeader}>
                <TouchableOpacity
                  style={[styles.playAllBtn, { backgroundColor: colors.primary, flex: 1 }]}
                  onPress={() => handlePlayAll(history)}
                >
                  <Play size={18} color="#FFFFFF" fill="#FFFFFF" />
                  <Text style={styles.playAllText}>Play History</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.clearBtn, { backgroundColor: colors.surfaceVariant }]}
                  onPress={clearHistory}
                >
                  <Trash2 size={16} color={colors.error} />
                </TouchableOpacity>
              </View>
            )}

            {history.length === 0 ? (
              <View style={styles.emptyState}>
                <Clock size={40} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  {t.library.emptyHistory}
                </Text>
              </View>
            ) : (
              history.map((track, idx) => (
                <TrackItem key={`hist_tab_${track.id}_${idx}`} track={track} queue={history} index={idx} />
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* CREATE PLAYLIST MODAL */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t.library.createPlaylist}</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.surfaceVariant, color: colors.text }]}
              placeholder={t.library.newPlaylistName}
              placeholderTextColor={colors.textMuted}
              value={newPlaylistTitle}
              onChangeText={setNewPlaylistTitle}
              autoFocus
            />
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.surfaceVariant, color: colors.text, height: 60 }]}
              placeholder="Description (Optional)"
              placeholderTextColor={colors.textMuted}
              value={newPlaylistDesc}
              onChangeText={setNewPlaylistDesc}
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.surfaceVariant }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={{ color: colors.text }}>{t.library.cancel}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                onPress={handleCreatePlaylist}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>{t.library.create}</Text>
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
  chipBarContainer: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  chipScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
  },
  bodyContent: {
    paddingBottom: 100,
    paddingTop: 16,
  },
  section: {
    paddingHorizontal: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
  },
  plIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plInfo: {
    marginLeft: 14,
    flex: 1,
  },
  plTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 3,
  },
  plSub: {
    fontSize: 12,
  },
  albumGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  albumCard: {
    width: '48%',
    borderRadius: 14,
    padding: 10,
    marginBottom: 6,
  },
  albumArt: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 10,
    marginBottom: 8,
  },
  albumTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  albumArtist: {
    fontSize: 12,
  },
  artistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
  },
  artistAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  artistInfo: {
    marginLeft: 14,
    flex: 1,
  },
  artistName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 3,
  },
  artistSub: {
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  playAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    marginBottom: 14,
  },
  playAllText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  historyHeader: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  clearBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  modalInput: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  modalBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
