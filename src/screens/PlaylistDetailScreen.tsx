import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { ChevronLeft, Play, Shuffle, Trash2, ListMusic } from 'lucide-react-native';
import { TrackItem } from '../components/TrackItem';
import { useTheme } from '../theme/themeContext';
import { useLibraryStore } from '../store/libraryStore';
import { usePlayerStore } from '../store/playerStore';
import { database } from '../services/database/database';
import { Playlist } from '../types';
import { RootStackParamList } from '../navigation/types';

type PlaylistDetailRouteProp = RouteProp<RootStackParamList, 'PlaylistDetail'>;

export const PlaylistDetailScreen: React.FC = () => {
  const route = useRoute<PlaylistDetailRouteProp>();
  const navigation = useNavigation();
  const { colors, t } = useTheme();
  const { playlistId, title } = route.params;

  const { deletePlaylist } = useLibraryStore();
  const { playTrack, setShuffle } = usePlayerStore();

  const [playlist, setPlaylist] = useState<Playlist | null>(null);

  useEffect(() => {
    const pl = database.getPlaylistById(playlistId);
    setPlaylist(pl);
  }, [playlistId]);

  const handleDelete = () => {
    Alert.alert(
      t.common.delete,
      t.common.confirmDelete,
      [
        { text: t.library.cancel, style: 'cancel' },
        {
          text: t.common.delete,
          style: 'destructive',
          onPress: () => {
            deletePlaylist(playlistId);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handlePlayAll = (shuffleMode = false) => {
    if (playlist && playlist.tracks.length > 0) {
      setShuffle(shuffleMode);
      playTrack(playlist.tracks[0], playlist.tracks, 0);
    }
  };

  if (!playlist) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textSecondary }}>Playlist not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={28} color={colors.text} />
        </TouchableOpacity>
        <Text numberOfLines={1} style={[styles.headerTitle, { color: colors.text }]}>
          {playlist.title || title}
        </Text>
        <TouchableOpacity style={styles.iconBtn} onPress={handleDelete}>
          <Trash2 size={20} color={colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View style={styles.bannerContainer}>
          <View style={[styles.artworkBox, { backgroundColor: colors.surfaceVariant }]}>
            <ListMusic size={60} color={colors.primaryLight} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{playlist.title}</Text>
          {playlist.description ? (
            <Text style={[styles.desc, { color: colors.textSecondary }]}>
              {playlist.description}
            </Text>
          ) : null}
          <Text style={[styles.trackCount, { color: colors.primaryLight }]}>
            {t.library.tracksCount(playlist.tracks.length)}
          </Text>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.playBtn, { backgroundColor: colors.primary }]}
              onPress={() => handlePlayAll(false)}
              disabled={playlist.tracks.length === 0}
            >
              <Play size={18} color="#FFFFFF" fill="#FFFFFF" />
              <Text style={styles.playBtnText}>{t.common.play}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.shuffleBtn, { backgroundColor: colors.surfaceVariant }]}
              onPress={() => handlePlayAll(true)}
              disabled={playlist.tracks.length === 0}
            >
              <Shuffle size={18} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tracks List */}
        <View style={styles.trackList}>
          {playlist.tracks.length === 0 ? (
            <Text style={[styles.emptyTracks, { color: colors.textMuted }]}>
              This playlist has no songs yet. Search and add tracks to build your mix!
            </Text>
          ) : (
            playlist.tracks.map((track, idx) => (
              <TrackItem key={`${track.id}_${idx}`} track={track} queue={playlist.tracks} index={idx} />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  iconBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  scrollBody: {
    paddingBottom: 100,
  },
  bannerContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  artworkBox: {
    width: 140,
    height: 140,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  desc: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  trackCount: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
  },
  playBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  shuffleBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackList: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  emptyTracks: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 14,
    lineHeight: 20,
  },
});
