import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Heart, Play, Volume2, CheckCircle2, ArrowDownCircle } from 'lucide-react-native';
import { Track } from '../types';
import { useTheme } from '../theme/themeContext';
import { usePlayerStore } from '../store/playerStore';
import { useLibraryStore } from '../store/libraryStore';

interface TrackItemProps {
  track: Track;
  queue?: Track[];
  index?: number;
  onPress?: () => void;
  showFavorite?: boolean;
  showDownload?: boolean;
}

export const TrackItem: React.FC<TrackItemProps> = ({
  track,
  queue,
  index,
  onPress,
  showFavorite = true,
  showDownload = true,
}) => {
  const { colors } = useTheme();
  const { currentTrack, isPlaying, isBuffering, playTrack } = usePlayerStore();
  const { toggleFavorite, isFavorite, downloadTrack, downloadProgress } = useLibraryStore();

  const isCurrent = currentTrack?.id === track.id;
  const isFav = isFavorite(track.id);
  const progress = downloadProgress[track.id];
  const isDownloading = progress !== undefined;

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      playTrack(track, queue, index);
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: isCurrent ? colors.surfaceVariant : 'transparent',
          borderColor: isCurrent ? colors.primary : 'transparent',
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
      testID={`track-item-${track.id}`}
    >
      {/* Artwork with fallback */}
      <View style={styles.artworkContainer}>
        {(track.artwork || track.thumbnail) ? (
          <Image source={{ uri: track.artwork || track.thumbnail }} style={styles.artwork} />
        ) : (
          <View style={[styles.placeholderArt, { backgroundColor: colors.surfaceVariant }]}>
            <Play size={20} color={colors.primaryLight} />
          </View>
        )}
        {isCurrent && (
          <View style={[styles.playingOverlay, { backgroundColor: 'rgba(0,0,0,0.55)' }]}>
            {isBuffering ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : isPlaying ? (
              <Volume2 size={18} color="#FFFFFF" />
            ) : (
              <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
            )}
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text
          numberOfLines={1}
          style={[
            styles.title,
            { color: isCurrent ? colors.primaryLight : colors.text },
          ]}
        >
          {track.title}
        </Text>
        <Text numberOfLines={1} style={[styles.artist, { color: colors.textSecondary }]}>
          {track.artist} {track.album ? `• ${track.album}` : ''}
        </Text>
      </View>

      {/* Duration */}
      <Text style={[styles.duration, { color: colors.textMuted }]}>
        {formatDuration(track.duration)}
      </Text>

      {/* Actions: Download */}
      {showDownload && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => downloadTrack(track)}
          disabled={track.isDownloaded || isDownloading}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {isDownloading ? (
            <ActivityIndicator size="small" color={colors.primaryLight} />
          ) : track.isDownloaded ? (
            <CheckCircle2 size={18} color={colors.success} />
          ) : (
            <ArrowDownCircle size={18} color={colors.textMuted} />
          )}
        </TouchableOpacity>
      )}

      {/* Actions: Favorite */}
      {showFavorite && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => toggleFavorite(track)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          testID={`favorite-button-${track.id}`}
        >
          <Heart
            size={18}
            color={isFav ? colors.secondary : colors.textMuted}
            fill={isFav ? colors.secondary : 'transparent'}
          />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginVertical: 4,
    borderWidth: 1,
  },
  artworkContainer: {
    width: 48,
    height: 48,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  artwork: {
    width: '100%',
    height: '100%',
  },
  placeholderArt: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: 14,
    marginRight: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 3,
  },
  artist: {
    fontSize: 13,
  },
  duration: {
    fontSize: 12,
    marginRight: 10,
  },
  actionButton: {
    padding: 6,
    marginLeft: 4,
  },
});
