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
import { ChevronLeft, Play, Sparkles } from 'lucide-react-native';
import { TrackItem } from '../components/TrackItem';
import { useTheme } from '../theme/themeContext';
import { usePlayerStore } from '../store/playerStore';
import { musicApi } from '../services/api/musicApi';
import { Artist, Track } from '../types';
import { RootStackParamList } from '../navigation/types';

type ArtistDetailRouteProp = RouteProp<RootStackParamList, 'ArtistDetail'>;

export const ArtistDetailScreen: React.FC = () => {
  const route = useRoute<ArtistDetailRouteProp>();
  const navigation = useNavigation();
  const { colors, t } = useTheme();
  const { artistId, name } = route.params;
  const { playTrack } = usePlayerStore();

  const [artist, setArtist] = useState<Artist | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);

  useEffect(() => {
    (async () => {
      const art = await musicApi.getArtistById(artistId);
      const trks = await musicApi.getArtistTracks(artistId);
      setArtist(art);
      setTracks(trks);
    })();
  }, [artistId]);

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      playTrack(tracks[0], tracks, 0);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={28} color={colors.text} />
        </TouchableOpacity>
        <Text numberOfLines={1} style={[styles.headerTitle, { color: colors.text }]}>
          {artist?.name || name}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.hero}>
          {artist?.image ? (
            <Image source={{ uri: artist.image }} style={styles.heroImage} />
          ) : (
            <View style={[styles.heroPlaceholder, { backgroundColor: colors.surfaceVariant }]}>
              <Sparkles size={40} color={colors.primaryLight} />
            </View>
          )}

          <Text style={[styles.name, { color: colors.text }]}>{artist?.name || name}</Text>
          {artist?.bio ? (
            <Text style={[styles.bio, { color: colors.textSecondary }]}>{artist.bio}</Text>
          ) : null}

          {tracks.length > 0 && (
            <TouchableOpacity
              style={[styles.playBtn, { backgroundColor: colors.primary }]}
              onPress={handlePlayAll}
            >
              <Play size={18} color="#FFFFFF" fill="#FFFFFF" />
              <Text style={styles.playBtnText}>{t.common.play} Top Tracks</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tracks List */}
        <View style={styles.trackSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Popular Releases</Text>
          {tracks.map((track, idx) => (
            <TrackItem key={track.id} track={track} queue={tracks} index={idx} />
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
  hero: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  heroImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    marginBottom: 16,
  },
  heroPlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  bio: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
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
