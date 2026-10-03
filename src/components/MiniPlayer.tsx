import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Play, Pause, SkipForward, Heart } from 'lucide-react-native';
import { usePlayerStore } from '../store/playerStore';
import { useLibraryStore } from '../store/libraryStore';
import { useTheme } from '../theme/themeContext';
import { RootStackParamList } from '../navigation/types';

export const MiniPlayer: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();
  const { currentTrack, isPlaying, isBuffering, togglePlayPause, next, position, duration } =
    usePlayerStore();
  const { toggleFavorite, isFavorite } = useLibraryStore();

  if (!currentTrack) return null;

  const isFav = isFavorite(currentTrack.id);
  const progressPercent =
    duration > 0 ? Math.min(100, Math.max(0, (position / duration) * 100)) : 0;

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.tabBarBackground }]}>
      <TouchableOpacity
        style={[styles.container, { backgroundColor: colors.miniPlayerBackground }]}
        onPress={() => navigation.navigate('Player')}
        activeOpacity={0.9}
        testID="mini-player"
      >
        {/* Progress Bar Header */}
        <View style={[styles.progressBarBackground, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressBarFill,
              { backgroundColor: colors.primary, width: `${progressPercent}%` },
            ]}
          />
        </View>

        <View style={styles.content}>
          {/* Artwork */}
          <Image source={{ uri: currentTrack.artwork }} style={styles.artwork} />

          {/* Track Info */}
          <View style={styles.info}>
            <Text numberOfLines={1} style={[styles.title, { color: colors.text }]}>
              {currentTrack.title}
            </Text>
            <Text
              numberOfLines={1}
              style={[styles.artist, { color: colors.textSecondary }]}
            >
              {currentTrack.artist}
            </Text>
          </View>

          {/* Quick Actions */}
          <View style={styles.controls}>
            <TouchableOpacity
              onPress={() => toggleFavorite(currentTrack)}
              style={styles.iconButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Heart
                size={20}
                color={isFav ? colors.secondary : colors.textMuted}
                fill={isFav ? colors.secondary : 'transparent'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={togglePlayPause}
              style={[styles.playButton, { backgroundColor: colors.primary }]}
              activeOpacity={0.8}
              testID="mini-player-toggle-play"
            >
              {isBuffering ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : isPlaying ? (
                <Pause size={18} color="#FFFFFF" fill="#FFFFFF" />
              ) : (
                <Play size={18} color="#FFFFFF" fill="#FFFFFF" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={next}
              style={styles.iconButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              testID="mini-player-next"
            >
              <SkipForward size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  progressBarBackground: {
    height: 3,
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  artwork: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  info: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  artist: {
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    padding: 6,
  },
  playButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
