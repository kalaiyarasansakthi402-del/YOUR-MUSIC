import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { ChevronLeft, Play, Disc3 } from 'lucide-react-native';
import { TrackItem } from '../components/TrackItem';
import { useTheme } from '../theme/themeContext';
import { usePlayerStore } from '../store/playerStore';
import { musicApi } from '../services/api/musicApi';
import { Album } from '../types';
import { RootStackParamList } from '../navigation/types';

type AlbumDetailRouteProp = RouteProp<RootStackParamList, 'AlbumDetail'>;

export const AlbumDetailScreen: React.FC = () => {
  const route = useRoute<AlbumDetailRouteProp>();
  const navigation = useNavigation();
  const { colors, t } = useTheme();
  const { albumId, title } = route.params;
  const { playTrack } = usePlayerStore();

  const [album, setAlbum] = useState<Album | null>(null);

  useEffect(() => {
    (async () => {
      const alb = await musicApi.getAlbumById(albumId);
      setAlbum(alb);
    })();
  }, [albumId]);

  const handlePlayAll = () => {
    if (album && album.tracks && album.tracks.length > 0) {
      playTrack(album.tracks[0], album.tracks, 0);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={28} color={colors.text} />
        </TouchableOpacity>
        <Text numberOfLines={1} style={[styles.headerTitle, { color: colors.text }]}>
          {album?.title || title}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        <View style={styles.banner}>
          {album?.artwork ? (
            <Image source={{ uri: album.artwork }} style={styles.artwork} />
          ) : (
            <View style={[styles.artworkPlaceholder, { backgroundColor: colors.surfaceVariant }]}>
              <Disc3 size={48} color={colors.primaryLight} />
            </View>
          )}
          <Text style={[styles.title, { color: colors.text }]}>{album?.title || title}</Text>
          <Text style={[styles.artist, { color: colors.textSecondary }]}>
            {album?.artist} • {album?.year} • {album?.genre}
          </Text>

          {album?.tracks && album.tracks.length > 0 && (
            <TouchableOpacity
              style={[styles.playBtn, { backgroundColor: colors.primary }]}
              onPress={handlePlayAll}
            >
              <Play size={18} color="#FFFFFF" fill="#FFFFFF" />
              <Text style={styles.playBtnText}>{t.common.play} Album</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.trackSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Tracklist</Text>
          {album?.tracks?.map((track, idx) => (
            <TrackItem key={track.id} track={track} queue={album.tracks} index={idx} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  scrollBody: {
    paddingBottom: 100,
  },
  banner: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  artwork: {
    width: 160,
    height: 160,
    borderRadius: 20,
    marginBottom: 16,
  },
  artworkPlaceholder: {
    width: 160,
    height: 160,
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
  artist: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 16,
  },
  playBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  trackSection: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
});
