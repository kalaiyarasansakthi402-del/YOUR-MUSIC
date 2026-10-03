import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
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
import { RootStackParamList } from '../navigation/types';

type LibraryTab = 'playlists' | 'favorites' | 'downloads' | 'history';

export const LibraryScreen: React.FC = () => {
  const { colors, t } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    playlists,
    favorites,
    downloads,
    history,
    loadLibraryData,
    createPlaylist,
    clearHistory,
  } = useLibraryStore();
  const { playTrack } = usePlayerStore();

  const [activeTab, setActiveTab] = useState<LibraryTab>('playlists');
  const [modalVisible, setModalVisible] = useState(false);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');

  useEffect(() => {
    loadLibraryData();
  }, [loadLibraryData]);

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

  const handlePlayAll = (tracks: typeof favorites) => {
    if (tracks.length > 0) {
      playTrack(tracks[0], tracks, 0);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title={t.library.title} subtitle="Personal Collection" />

      {/* Library Navigation Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'playlists' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('playlists')}
        >
          <ListMusic size={18} color={activeTab === 'playlists' ? colors.primaryLight : colors.textMuted} />
          <Text style={[styles.tabText, { color: activeTab === 'playlists' ? colors.text : colors.textMuted }]}>
            {t.library.playlists} ({playlists.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'favorites' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('favorites')}
        >
          <Heart size={18} color={activeTab === 'favorites' ? colors.secondary : colors.textMuted} />
          <Text style={[styles.tabText, { color: activeTab === 'favorites' ? colors.text : colors.textMuted }]}>
            {t.library.favorites} ({favorites.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'downloads' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('downloads')}
        >
          <ArrowDownCircle size={18} color={activeTab === 'downloads' ? colors.success : colors.textMuted} />
          <Text style={[styles.tabText, { color: activeTab === 'downloads' ? colors.text : colors.textMuted }]}>
            {t.library.downloads} ({downloads.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'history' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('history')}
        >
          <Clock size={18} color={activeTab === 'history' ? colors.accent : colors.textMuted} />
          <Text style={[styles.tabText, { color: activeTab === 'history' ? colors.text : colors.textMuted }]}>
            {t.library.history}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        {/* TAB 1: PLAYLISTS */}
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

        {/* TAB 2: FAVORITES */}
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
                <TrackItem key={track.id} track={track} queue={favorites} index={idx} />
              ))
            )}
          </View>
        )}

        {/* TAB 3: DOWNLOADS */}
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
                <TrackItem key={track.id} track={track} queue={downloads} index={idx} />
              ))
            )}
          </View>
        )}

        {/* TAB 4: HISTORY */}
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
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
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
