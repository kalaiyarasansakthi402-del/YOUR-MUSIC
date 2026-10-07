import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  Share,
  Dimensions,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  ListMusic,
  FileText,
  Share2,
  ArrowDownCircle,
  CheckCircle2,
  X,
  Volume2,
  AlertCircle,
  RotateCcw,
  Youtube,
  ExternalLink,
  Gauge,
  Trash2,
} from 'lucide-react-native';
import { usePlayerStore } from '../store/playerStore';
import { useLibraryStore } from '../store/libraryStore';
import { useTheme } from '../theme/themeContext';
import { RepeatMode } from '../types';

const { width } = Dimensions.get('window');

export const PlayerScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors, t } = useTheme();
  const {
    currentTrack,
    isPlaying,
    isBuffering,
    position,
    duration,
    shuffle,
    repeatMode,
    queue,
    queueIndex,
    error,
    togglePlayPause,
    seekTo,
    next,
    previous,
    retry,
    setShuffle,
    setRepeatMode,
    playbackRate,
    setPlaybackRate,
    clearQueue,
    playTrack,
    removeFromQueue,
  } = usePlayerStore();

  const { toggleFavorite, isFavorite, downloadTrack, downloadProgress } = useLibraryStore();

  const [showQueue, setShowQueue] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);

  if (!currentTrack) {
    return (
      <View style={[styles.container, styles.emptyContainer, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textSecondary }}>No track selected</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Text style={{ color: colors.primaryLight }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isFav = isFavorite(currentTrack.id);
  const progressPercent =
    duration > 0 ? Math.min(100, Math.max(0, (position / duration) * 100)) : 0;
  const isDownloading = downloadProgress[currentTrack.id] !== undefined;

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleToggleRepeat = () => {
    const modes: RepeatMode[] = ['off', 'all', 'one'];
    const nextMode = modes[(modes.indexOf(repeatMode) + 1) % modes.length];
    setRepeatMode(nextMode);
  };

  const handleToggleSpeed = () => {
    const speeds = [0.75, 1.0, 1.25, 1.5, 2.0];
    const currentIndex = speeds.indexOf(playbackRate ?? 1.0);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setPlaybackRate(nextSpeed);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Listening to "${currentTrack.title}" by ${currentTrack.artist} on Your Music — By Anzles!`,
      });
    } catch {
      // Ignored
    }
  };

  const handleScrub = (event: { nativeEvent: { locationX: number } }) => {
    const trackWidth = width - 48;
    const clickX = event.nativeEvent.locationX;
    const ratio = Math.max(0, Math.min(1, clickX / trackWidth));
    seekTo(Math.floor(ratio * duration));
  };

  const handleOpenYouTube = async () => {
    if (!currentTrack) return;
    const videoId = currentTrack.videoId || currentTrack.youtubeVideoId;
    const url = videoId ? `https://www.youtube.com/watch?v=${videoId}` : (currentTrack.url || '');
    if (!url) return;
    try {
      const appUrl = videoId ? `vnd.youtube://${videoId}` : url;
      const can = await Linking.canOpenURL(appUrl);
      if (can) {
        await Linking.openURL(appUrl);
      } else {
        await Linking.openURL(url);
      }
    } catch {
      await Linking.openURL(url).catch(() => {});
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.playerBackground }]}>
      {/* Top Navigation Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigation.goBack()}
          testID="player-close-button"
        >
          <ChevronDown size={28} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.topTitleWrap}>
          <Text style={[styles.topSub, { color: colors.primaryLight }]}>NOW PLAYING</Text>
          <Text numberOfLines={1} style={[styles.topTitle, { color: colors.text }]}>
            {currentTrack.album || 'Your Music'}
          </Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={handleShare}>
          <Share2 size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {/* Main Artwork */}
        <View style={styles.artworkContainer}>
          <Image source={{ uri: currentTrack.artwork }} style={styles.artwork} />
        </View>

        {/* Track Title, Artist, and Favorite */}
        <View style={styles.metaRow}>
          <View style={styles.metaInfo}>
            <Text numberOfLines={1} style={[styles.trackTitle, { color: colors.text }]}>
              {currentTrack.title}
            </Text>
            <Text numberOfLines={1} style={[styles.trackArtist, { color: colors.textSecondary }]}>
              {currentTrack.artist}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.favBtn}
            onPress={() => toggleFavorite(currentTrack)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            testID="player-fav-button"
          >
            <Heart
              size={26}
              color={isFav ? colors.secondary : colors.textMuted}
              fill={isFav ? colors.secondary : 'transparent'}
            />
          </TouchableOpacity>
        </View>

        {/* Error State with Retry Button */}
        {error && (
          <View style={[styles.errorBanner, { backgroundColor: colors.surfaceVariant, borderColor: colors.error }]}>
            <View style={styles.errorTextRow}>
              <AlertCircle size={18} color={colors.error} />
              <Text numberOfLines={2} style={[styles.errorBannerText, { color: colors.text }]}>
                {error}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.retryBtn, { backgroundColor: colors.primary }]}
              onPress={retry}
              activeOpacity={0.8}
            >
              <RotateCcw size={14} color="#FFFFFF" />
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* YouTube Official Video Action */}
        {currentTrack.source === 'youtube' && (
          <View style={[styles.youtubeBanner, { backgroundColor: 'rgba(255, 0, 0, 0.08)', borderColor: '#FF0000' }]}>
            <View style={styles.errorTextRow}>
              <Youtube size={20} color="#FF0000" />
              <Text style={[styles.youtubeBannerText, { color: colors.text }]}>
                YouTube Music Video
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.openYtBtn, { backgroundColor: '#FF0000' }]}
              onPress={handleOpenYouTube}
              activeOpacity={0.8}
            >
              <Text style={styles.openYtBtnText}>Watch on YouTube</Text>
              <ExternalLink size={12} color="#FFFFFF" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>
        )}

        {/* Audio Scrubber / Progress Bar */}
        <View style={styles.scrubberContainer}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={handleScrub}
            style={[styles.scrubberTrack, { backgroundColor: colors.border }]}
          >
            <View
              style={[
                styles.scrubberFill,
                { backgroundColor: colors.primary, width: `${progressPercent}%` },
              ]}
            >
              <View style={[styles.scrubberKnob, { backgroundColor: colors.primaryLight }]} />
            </View>
          </TouchableOpacity>
          <View style={styles.timeRow}>
            <Text style={[styles.timeText, { color: colors.textMuted }]}>{formatTime(position)}</Text>
            <Text style={[styles.timeText, { color: colors.textMuted }]}>{formatTime(duration)}</Text>
          </View>
        </View>

        {/* Main Playback Controls */}
        <View style={styles.controlsRow}>
          {/* Shuffle */}
          <TouchableOpacity
            style={styles.ctrlBtn}
            onPress={() => setShuffle(!shuffle)}
            testID="player-shuffle-button"
          >
            <Shuffle size={22} color={shuffle ? colors.primaryLight : colors.textMuted} />
          </TouchableOpacity>

          {/* Previous */}
          <TouchableOpacity
            style={styles.ctrlBtn}
            onPress={previous}
            testID="player-previous-button"
          >
            <SkipBack size={30} color={colors.text} />
          </TouchableOpacity>

          {/* Play / Pause / Buffering */}
          <TouchableOpacity
            style={[styles.mainPlayBtn, { backgroundColor: colors.primary }]}
            onPress={togglePlayPause}
            activeOpacity={0.8}
            testID="player-play-pause-button"
          >
            {isBuffering ? (
              <ActivityIndicator size="large" color="#FFFFFF" />
            ) : isPlaying ? (
              <Pause size={32} color="#FFFFFF" fill="#FFFFFF" />
            ) : (
              <Play size={32} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 4 }} />
            )}
          </TouchableOpacity>

          {/* Next */}
          <TouchableOpacity
            style={styles.ctrlBtn}
            onPress={next}
            testID="player-next-button"
          >
            <SkipForward size={30} color={colors.text} />
          </TouchableOpacity>

          {/* Repeat */}
          <TouchableOpacity
            style={styles.ctrlBtn}
            onPress={handleToggleRepeat}
            testID="player-repeat-button"
          >
            {repeatMode === 'one' ? (
              <Repeat1 size={22} color={colors.primaryLight} />
            ) : (
              <Repeat size={22} color={repeatMode === 'all' ? colors.primaryLight : colors.textMuted} />
            )}
          </TouchableOpacity>
        </View>

        {/* Extra Action Buttons */}
        <View style={styles.extraBar}>
          <TouchableOpacity
            style={[styles.extraBtn, { backgroundColor: colors.surfaceVariant }]}
            onPress={() => setShowLyrics(true)}
          >
            <FileText size={16} color={colors.text} />
            <Text style={[styles.extraBtnText, { color: colors.text }]}>{t.player.lyrics}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.extraBtn, { backgroundColor: colors.surfaceVariant }]}
            onPress={() => setShowQueue(true)}
          >
            <ListMusic size={16} color={colors.text} />
            <Text style={[styles.extraBtnText, { color: colors.text }]}>Queue ({queue.length})</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.extraBtn,
              {
                backgroundColor:
                  playbackRate && playbackRate !== 1.0 ? colors.primary : colors.surfaceVariant,
              },
            ]}
            onPress={handleToggleSpeed}
          >
            <Gauge
              size={16}
              color={playbackRate && playbackRate !== 1.0 ? '#FFFFFF' : colors.text}
            />
            <Text
              style={[
                styles.extraBtnText,
                { color: playbackRate && playbackRate !== 1.0 ? '#FFFFFF' : colors.text },
              ]}
            >
              {playbackRate ? `${playbackRate}x` : '1.0x'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.extraBtn, { backgroundColor: colors.surfaceVariant }]}
            onPress={() => downloadTrack(currentTrack)}
            disabled={currentTrack.isDownloaded || isDownloading}
          >
            {isDownloading ? (
              <ActivityIndicator size="small" color={colors.primaryLight} />
            ) : currentTrack.isDownloaded ? (
              <CheckCircle2 size={16} color={colors.success} />
            ) : (
              <ArrowDownCircle size={16} color={colors.text} />
            )}
            <Text style={[styles.extraBtnText, { color: colors.text }]}>
              {currentTrack.isDownloaded ? 'Saved' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* LYRICS MODAL */}
      <Modal visible={showLyrics} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.drawerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.drawerHeader}>
              <Text style={[styles.drawerTitle, { color: colors.text }]}>{t.player.lyrics}</Text>
              <TouchableOpacity onPress={() => setShowLyrics(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.lyricsScroll}>
              {currentTrack.lyrics ? (
                <Text style={[styles.lyricsText, { color: colors.text }]}>{currentTrack.lyrics}</Text>
              ) : (
                <Text style={[styles.noLyricsText, { color: colors.textSecondary }]}>
                  {t.player.noLyrics}
                </Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* QUEUE MODAL */}
      <Modal visible={showQueue} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.drawerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.drawerHeader}>
              <Text style={[styles.drawerTitle, { color: colors.text }]}>{t.player.queue}</Text>
              <View style={styles.queueHeaderActions}>
                {queue.length > 1 && (
                  <TouchableOpacity
                    style={[styles.clearQueueBtn, { backgroundColor: colors.surfaceVariant }]}
                    onPress={clearQueue}
                  >
                    <Trash2 size={14} color={colors.error} />
                    <Text style={[styles.clearQueueText, { color: colors.error }]}>Clear</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setShowQueue(false)}>
                  <X size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView contentContainerStyle={styles.queueScroll}>
              {queue.map((track, idx) => {
                const isPlayingThis = idx === queueIndex;
                return (
                  <TouchableOpacity
                    key={`${track.id}_${idx}`}
                    style={[
                      styles.queueItem,
                      {
                        backgroundColor: isPlayingThis ? colors.surfaceVariant : 'transparent',
                      },
                    ]}
                    onPress={() => {
                      playTrack(track, queue, idx);
                      setShowQueue(false);
                    }}
                  >
                    <Image source={{ uri: track.artwork }} style={styles.queueThumb} />
                    <View style={styles.queueMeta}>
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.queueTitle,
                          { color: isPlayingThis ? colors.primaryLight : colors.text },
                        ]}
                      >
                        {track.title}
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={[styles.queueArtist, { color: colors.textSecondary }]}
                      >
                        {track.artist}
                      </Text>
                    </View>
                    {isPlayingThis ? (
                      <Volume2 size={18} color={colors.primaryLight} />
                    ) : (
                      <TouchableOpacity
                        onPress={() => removeFromQueue(idx)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <X size={16} color={colors.textMuted} />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
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
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    marginTop: 16,
    padding: 12,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  topTitleWrap: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 12,
  },
  topSub: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  topTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  iconBtn: {
    padding: 6,
  },
  scrollBody: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  artworkContainer: {
    width: width - 64,
    height: width - 64,
    maxWidth: 360,
    maxHeight: 360,
    borderRadius: 24,
    overflow: 'hidden',
    marginTop: 16,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  artwork: {
    width: '100%',
    height: '100%',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  metaInfo: {
    flex: 1,
    marginRight: 16,
  },
  trackTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  trackArtist: {
    fontSize: 16,
  },
  favBtn: {
    padding: 6,
  },
  scrubberContainer: {
    width: '100%',
    marginBottom: 20,
  },
  scrubberTrack: {
    height: 6,
    borderRadius: 3,
    position: 'relative',
  },
  scrubberFill: {
    height: '100%',
    borderRadius: 3,
    position: 'relative',
  },
  scrubberKnob: {
    width: 14,
    height: 14,
    borderRadius: 7,
    position: 'absolute',
    right: -7,
    top: -4,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  ctrlBtn: {
    padding: 10,
  },
  mainPlayBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  extraBar: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  extraBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
  },
  extraBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  drawerCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '75%',
    borderWidth: 1,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  queueHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clearQueueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  clearQueueText: {
    fontSize: 12,
    fontWeight: '600',
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  lyricsScroll: {
    paddingVertical: 10,
  },
  lyricsText: {
    fontSize: 16,
    lineHeight: 28,
    textAlign: 'center',
    fontWeight: '500',
  },
  noLyricsText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },
  queueScroll: {
    paddingVertical: 10,
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
  },
  queueThumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  queueMeta: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  queueTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  queueArtist: {
    fontSize: 12,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginVertical: 10,
    width: '100%',
  },
  errorTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  errorBannerText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  youtubeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginVertical: 10,
    width: '100%',
  },
  youtubeBannerText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  openYtBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  openYtBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
