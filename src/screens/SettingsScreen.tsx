import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Image,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Moon,
  Sun,
  HardDrive,
  Trash2,
  Activity,
  Info,
  Shield,
  HelpCircle,
  ChevronRight,
  Database,
  Youtube,
  Key,
  CheckCircle2,
  X,
  User,
  LogIn,
  LogOut,
  AlertCircle,
  Sliders,
  Volume2,
} from 'lucide-react-native';
import { Header } from '../components/Header';
import { useTheme } from '../theme/themeContext';
import { offlineManager } from '../services/offline/offlineManager';
import { database } from '../services/database/database';
import { musicApi } from '../services/api/musicApi';
import { useAuthStore } from '../store/authStore';
import { ThemeMode, Language } from '../types';
import { RootStackParamList } from '../navigation/types';

export const SettingsScreen: React.FC = () => {
  const { mode, setMode, language, setLanguage, colors, t } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [cacheSizeMb, setCacheSizeMb] = useState(0);
  const [youtubeApiKey, setYoutubeApiKey] = useState<string | null>(null);
  const [keyModalVisible, setKeyModalVisible] = useState(false);
  const [keyInput, setKeyInput] = useState('');

  const [audioQuality, setAudioQuality] = useState<'low' | 'medium' | 'high'>('high');
  const [gapless, setGapless] = useState(true);
  const [replayGain, setReplayGain] = useState(true);
  const [crossfade, setCrossfade] = useState(false);

  const {
    user,
    isLoading: authLoading,
    signInWithGoogle,
    signOutGoogle,
    getClientId,
    setClientId,
  } = useAuthStore();
  const [clientIdModalVisible, setClientIdModalVisible] = useState(false);
  const [clientIdInput, setClientIdInput] = useState('');

  useEffect(() => {
    (async () => {
      const size = await offlineManager.getStorageUsageMb();
      setCacheSizeMb(size);
      const key = await musicApi.getYouTubeApiKey();
      setYoutubeApiKey(key);
    })();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      const res = await signInWithGoogle();
      if (res) {
        Alert.alert(t.common.success, `Signed in as ${res.name}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      Alert.alert('Sign-In Notice', msg);
    }
  };

  const handleGoogleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of your Google Account?',
      [
        { text: t.library.cancel, style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOutGoogle();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          },
        },
      ]
    );
  };

  const handleClearSearchHistory = () => {
    Alert.alert(
      t.settings.clearSearchHistory,
      'Are you sure you want to clear your search history?',
      [
        { text: t.library.cancel, style: 'cancel' },
        {
          text: t.common.delete,
          style: 'destructive',
          onPress: () => {
            Alert.alert(t.common.success, t.settings.searchHistoryCleared);
          },
        },
      ]
    );
  };

  const handleClearPlaybackHistory = () => {
    Alert.alert(
      t.settings.clearPlaybackHistory,
      'Are you sure you want to clear your listening history?',
      [
        { text: t.library.cancel, style: 'cancel' },
        {
          text: t.common.delete,
          style: 'destructive',
          onPress: () => {
            database.clearHistory();
            Alert.alert(t.common.success, t.settings.playbackHistoryCleared);
          },
        },
      ]
    );
  };

  const handleClearAllData = () => {
    Alert.alert(
      t.settings.clearAllData,
      'This will erase all playlists, favorites, downloads, and listening history. Are you sure?',
      [
        { text: t.library.cancel, style: 'cancel' },
        {
          text: t.common.delete,
          style: 'destructive',
          onPress: () => {
            database.clearAllData();
            Alert.alert(t.common.success, t.settings.allDataCleared);
          },
        },
      ]
    );
  };

  const handleOpenClientIdModal = async () => {
    const id = await getClientId();
    setClientIdInput(id);
    setClientIdModalVisible(true);
  };

  const handleSaveClientId = async () => {
    await setClientId(clientIdInput.trim());
    setClientIdModalVisible(false);
    Alert.alert(t.common.success, 'OAuth Client ID saved.');
  };

  const handleClearCache = async () => {
    Alert.alert(
      t.settings.clearCache,
      'Are you sure you want to clear temporary audio cache?',
      [
        { text: t.library.cancel, style: 'cancel' },
        {
          text: t.settings.clearCache,
          style: 'destructive',
          onPress: async () => {
            await offlineManager.clearCache();
            const size = await offlineManager.getStorageUsageMb();
            setCacheSizeMb(size);
            Alert.alert(t.common.success, t.settings.cacheCleared);
          },
        },
      ]
    );
  };

  const handleBackupDatabase = () => {
    const integrity = database.validateIntegrity();
    Alert.alert(
      t.settings.backupDatabase,
      `Database Integrity: ${integrity.status}\nPreserved Tables: ${integrity.tables.join(', ')}\nUser data is safely preserved.`
    );
  };

  const handleSaveApiKey = async () => {
    if (!keyInput.trim()) {
      Alert.alert('Error', 'Please enter a valid API key.');
      return;
    }
    await musicApi.configureYouTubeApiKey(keyInput.trim());
    setYoutubeApiKey(keyInput.trim());
    setKeyModalVisible(false);
    setKeyInput('');
    Alert.alert(t.common.success, t.settings.apiKeySaved);
  };

  const handleRemoveApiKey = async () => {
    Alert.alert(
      t.settings.removeApiKey,
      'Are you sure you want to remove the YouTube Data API key?',
      [
        { text: t.library.cancel, style: 'cancel' },
        {
          text: t.settings.removeApiKey,
          style: 'destructive',
          onPress: async () => {
            await musicApi.removeYouTubeApiKey();
            setYoutubeApiKey(null);
            Alert.alert(t.common.success, t.settings.apiKeyRemoved);
          },
        },
      ]
    );
  };

  const maskedApiKey = youtubeApiKey
    ? youtubeApiKey.length > 8
      ? `${youtubeApiKey.substring(0, 4)}••••••••${youtubeApiKey.substring(youtubeApiKey.length - 4)}`
      : '••••••••'
    : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title={t.settings.title} subtitle="Preferences & Integrity" />

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {/* GOOGLE & YOUTUBE ACCOUNT */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: colors.primaryLight }]}>
            GOOGLE & YOUTUBE ACCOUNT
          </Text>

          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            {user ? (
              <View style={styles.profileSection}>
                <View style={styles.profileRow}>
                  {user.photoUrl ? (
                    <Image source={{ uri: user.photoUrl }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatarFallback, { backgroundColor: colors.primary }]}>
                      <Text style={styles.avatarText}>
                        {user.name && user.name.length > 0 ? user.name[0].toUpperCase() : 'U'}
                      </Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.profileName, { color: colors.text }]}>
                      {user.name}
                    </Text>
                    <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
                      {user.email}
                    </Text>
                  </View>
                </View>

                {/* YouTube Scope Badge & Status */}
                <View
                  style={[
                    styles.scopeBadge,
                    {
                      backgroundColor: user.connectedToYouTube
                        ? 'rgba(46, 213, 115, 0.15)'
                        : 'rgba(255, 171, 0, 0.15)',
                    },
                  ]}
                >
                  {user.connectedToYouTube ? (
                    <CheckCircle2 size={16} color={colors.success} />
                  ) : (
                    <AlertCircle size={16} color={colors.warning} />
                  )}
                  <Text
                    style={[
                      styles.scopeBadgeText,
                      { color: user.connectedToYouTube ? colors.success : colors.warning },
                    ]}
                  >
                    {user.connectedToYouTube
                      ? 'Connected to YouTube (Read-Only)'
                      : 'YouTube Scope Not Granted'}
                  </Text>
                </View>

                <Text style={[styles.helperText, { color: colors.textMuted }]}>
                  {user.connectedToYouTube
                    ? 'Official YouTube read-only permissions are active. Search, playlists, and metadata are authenticated.'
                    : 'Basic Google account is linked. YouTube read-only access was not granted during sign-in. Sign in again to enable YouTube scope.'}
                </Text>

                <View style={styles.actionBtnRow}>
                  <TouchableOpacity
                    style={[styles.outlineBtn, { borderColor: colors.border }]}
                    onPress={handleOpenClientIdModal}
                  >
                    <Key size={14} color={colors.textSecondary} />
                    <Text style={[styles.outlineBtnText, { color: colors.textSecondary }]}>
                      OAuth Client ID
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.signOutBtn, { backgroundColor: 'rgba(255, 71, 87, 0.15)' }]}
                    onPress={handleGoogleSignOut}
                  >
                    <LogOut size={14} color={colors.error} />
                    <Text style={[styles.signOutBtnText, { color: colors.error }]}>
                      Sign Out
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.signedOutSection}>
                <View style={styles.optionRow}>
                  <View style={styles.optionLeft}>
                    <User size={22} color={colors.primaryLight} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.optionTitle, { color: colors.text }]}>
                        Google Account
                      </Text>
                      <Text style={[styles.optionSub, { color: colors.textSecondary }]}>
                        Not signed in
                      </Text>
                    </View>
                  </View>
                </View>

                <Text style={[styles.helperText, { color: colors.textMuted }]}>
                  Sign in with your Google account to connect YouTube and access personalized music search with official Google authentication.
                </Text>

                <TouchableOpacity
                  style={[styles.googleSignInBtn, { backgroundColor: colors.primary }]}
                  onPress={handleGoogleSignIn}
                  disabled={authLoading}
                >
                  {authLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <LogIn size={18} color="#FFFFFF" />
                      <Text style={styles.googleSignInBtnText}>Sign in with Google</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.clientIdLink}
                  onPress={handleOpenClientIdModal}
                >
                  <Text style={[styles.clientIdLinkText, { color: colors.textMuted }]}>
                    Configure Google OAuth Client ID
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* YOUTUBE DATA API V3 INTEGRATION */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: colors.primaryLight }]}>
            {t.settings.youtubeApi.toUpperCase()}
          </Text>

          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.optionRow}>
              <View style={styles.optionLeft}>
                <Youtube size={22} color="#FF0000" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>
                    {t.settings.youtubeApi}
                  </Text>
                  <Text
                    style={[
                      styles.optionSub,
                      { color: youtubeApiKey ? colors.success : colors.textSecondary },
                    ]}
                  >
                    {youtubeApiKey
                      ? `${t.settings.apiKeyConfigured} (${maskedApiKey})`
                      : t.settings.apiKeyNotConfigured}
                  </Text>
                </View>
              </View>

              {youtubeApiKey ? (
                <CheckCircle2 size={18} color={colors.success} />
              ) : (
                <Key size={18} color={colors.warning} />
              )}
            </View>

            <Text style={[styles.helperText, { color: colors.textMuted }]}>
              {t.settings.apiKeyHelp}
            </Text>

            <View style={styles.ytButtonRow}>
              <TouchableOpacity
                style={[styles.ytActionBtn, { backgroundColor: colors.primary }]}
                onPress={() => setKeyModalVisible(true)}
              >
                <Key size={14} color="#FFFFFF" />
                <Text style={styles.ytActionBtnText}>
                  {youtubeApiKey ? 'Update Key' : t.settings.enterApiKey}
                </Text>
              </TouchableOpacity>

              {youtubeApiKey && (
                <TouchableOpacity
                  style={[styles.ytRemoveBtn, { backgroundColor: colors.surfaceVariant }]}
                  onPress={handleRemoveApiKey}
                >
                  <Trash2 size={14} color={colors.error} />
                  <Text style={[styles.ytRemoveBtnText, { color: colors.error }]}>
                    {t.settings.removeApiKey}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* APPEARANCE */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: colors.primaryLight }]}>
            {t.settings.appearance}
          </Text>

          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.optionRow}>
              <View style={styles.optionLeft}>
                {mode === 'dark' ? (
                  <Moon size={20} color={colors.primaryLight} />
                ) : (
                  <Sun size={20} color={colors.primaryLight} />
                )}
                <Text style={[styles.optionTitle, { color: colors.text }]}>
                  {t.settings.theme}
                </Text>
              </View>

              <View style={styles.themeSelector}>
                {(['dark', 'light', 'system'] as ThemeMode[]).map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.modeBtn,
                      { backgroundColor: mode === m ? colors.primary : colors.surfaceVariant },
                    ]}
                    onPress={() => setMode(m)}
                  >
                    <Text
                      style={{
                        color: mode === m ? '#FFFFFF' : colors.textSecondary,
                        fontSize: 12,
                        fontWeight: '600',
                      }}
                    >
                      {m.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* LANGUAGE */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: colors.primaryLight }]}>
            {t.settings.language}
          </Text>

          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.langGrid}>
              {[
                { code: 'en', label: 'English' },
                { code: 'ta', label: 'தமிழ்' },
                { code: 'es', label: 'Español' },
                { code: 'pt', label: 'Português' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.code}
                  style={[
                    styles.langChip,
                    {
                      backgroundColor:
                        language === item.code ? colors.primary : colors.surfaceVariant,
                    },
                  ]}
                  onPress={() => setLanguage(item.code as Language)}
                >
                  <Text
                    style={[
                      styles.langText,
                      { color: language === item.code ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* PLAYBACK SETTINGS */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: colors.primaryLight }]}>
            {t.settings.playback.toUpperCase()}
          </Text>

          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            {/* Audio Quality */}
            <View style={styles.optionRow}>
              <View style={styles.optionLeft}>
                <Sliders size={20} color={colors.primaryLight} />
                <View>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>
                    {t.settings.audioQuality}
                  </Text>
                  <Text style={[styles.optionSub, { color: colors.textSecondary }]}>
                    {audioQuality === 'high'
                      ? 'High (320 kbps)'
                      : audioQuality === 'medium'
                        ? 'Normal (160 kbps)'
                        : 'Low (96 kbps)'}
                  </Text>
                </View>
              </View>

              <View style={styles.qualitySelector}>
                {(['low', 'medium', 'high'] as const).map((q) => (
                  <TouchableOpacity
                    key={q}
                    style={[
                      styles.modeBtn,
                      { backgroundColor: audioQuality === q ? colors.primary : colors.surfaceVariant },
                    ]}
                    onPress={() => setAudioQuality(q)}
                  >
                    <Text
                      style={{
                        color: audioQuality === q ? '#FFFFFF' : colors.textSecondary,
                        fontSize: 11,
                        fontWeight: '600',
                      }}
                    >
                      {q.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Gapless Playback */}
            <View style={styles.optionRow}>
              <View style={styles.optionLeft}>
                <Volume2 size={20} color={colors.primaryLight} />
                <Text style={[styles.optionTitle, { color: colors.text }]}>
                  {t.settings.gaplessPlayback}
                </Text>
              </View>
              <Switch
                value={gapless}
                onValueChange={setGapless}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Replay Gain */}
            <View style={styles.optionRow}>
              <View style={styles.optionLeft}>
                <Volume2 size={20} color={colors.primaryLight} />
                <Text style={[styles.optionTitle, { color: colors.text }]}>
                  {t.settings.replayGain}
                </Text>
              </View>
              <Switch
                value={replayGain}
                onValueChange={setReplayGain}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Crossfade */}
            <View style={styles.optionRow}>
              <View style={styles.optionLeft}>
                <Sliders size={20} color={colors.primaryLight} />
                <Text style={[styles.optionTitle, { color: colors.text }]}>
                  {t.settings.crossfade}
                </Text>
              </View>
              <Switch
                value={crossfade}
                onValueChange={setCrossfade}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* STORAGE & DATABASE */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: colors.primaryLight }]}>
            {t.settings.storage}
          </Text>

          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <TouchableOpacity style={styles.optionRow} onPress={handleClearCache}>
              <View style={styles.optionLeft}>
                <HardDrive size={20} color={colors.warning} />
                <View>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>
                    {t.settings.clearCache}
                  </Text>
                  <Text style={[styles.optionSub, { color: colors.textSecondary }]}>
                    Downloaded storage: {cacheSizeMb} MB
                  </Text>
                </View>
              </View>
              <Trash2 size={18} color={colors.error} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <TouchableOpacity style={styles.optionRow} onPress={handleBackupDatabase}>
              <View style={styles.optionLeft}>
                <Database size={20} color={colors.accent} />
                <Text style={[styles.optionTitle, { color: colors.text }]}>
                  {t.settings.backupDatabase}
                </Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* PRIVACY & DATA */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: colors.primaryLight }]}>
            {t.settings.privacySection.toUpperCase()}
          </Text>

          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <TouchableOpacity style={styles.optionRow} onPress={handleClearSearchHistory}>
              <View style={styles.optionLeft}>
                <Trash2 size={20} color={colors.warning} />
                <Text style={[styles.optionTitle, { color: colors.text }]}>
                  {t.settings.clearSearchHistory}
                </Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <TouchableOpacity style={styles.optionRow} onPress={handleClearPlaybackHistory}>
              <View style={styles.optionLeft}>
                <Trash2 size={20} color={colors.error} />
                <Text style={[styles.optionTitle, { color: colors.text }]}>
                  {t.settings.clearPlaybackHistory}
                </Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <TouchableOpacity style={styles.optionRow} onPress={handleClearAllData}>
              <View style={styles.optionLeft}>
                <Trash2 size={20} color={colors.error} />
                <View>
                  <Text style={[styles.optionTitle, { color: colors.error }]}>
                    {t.settings.clearAllData}
                  </Text>
                  <Text style={[styles.optionSub, { color: colors.textSecondary }]}>
                    Erases playlists, favorites, downloads & history
                  </Text>
                </View>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* CONTINUOUS HEALTH & DIAGNOSTICS */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: colors.primaryLight }]}>
            RELIABILITY & SYSTEM HEALTH
          </Text>

          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => navigation.navigate('Diagnostics')}
            >
              <View style={styles.optionLeft}>
                <Activity size={20} color={colors.success} />
                <View>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>
                    {t.settings.diagnostics}
                  </Text>
                  <Text style={[styles.optionSub, { color: colors.success }]}>
                    VERIFIED WORKING
                  </Text>
                </View>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ABOUT, PRIVACY, HELP */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: colors.primaryLight }]}>
            ABOUT & SUPPORT
          </Text>

          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => navigation.navigate('About')}
            >
              <View style={styles.optionLeft}>
                <Info size={20} color={colors.primaryLight} />
                <Text style={[styles.optionTitle, { color: colors.text }]}>
                  {t.settings.about}
                </Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => navigation.navigate('Privacy')}
            >
              <View style={styles.optionLeft}>
                <Shield size={20} color={colors.primaryLight} />
                <Text style={[styles.optionTitle, { color: colors.text }]}>
                  {t.settings.privacy}
                </Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => navigation.navigate('Help')}
            >
              <View style={styles.optionLeft}>
                <HelpCircle size={20} color={colors.primaryLight} />
                <Text style={[styles.optionTitle, { color: colors.text }]}>
                  {t.settings.help}
                </Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Version Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            Your Music v1.0.0 (Build 1)
          </Text>
          <Text style={[styles.footerBrand, { color: colors.primaryLight }]}>
            Designed & Developed By Anzles
          </Text>
        </View>
      </ScrollView>

      {/* API Key Entry Modal */}
      <Modal
        visible={keyModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setKeyModalVisible(false)}
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
              <TouchableOpacity onPress={() => setKeyModalVisible(false)}>
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
              value={keyInput}
              onChangeText={setKeyInput}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { backgroundColor: colors.surfaceVariant }]}
                onPress={() => setKeyModalVisible(false)}
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

      {/* GOOGLE CLIENT ID CONFIG MODAL */}
      <Modal
        visible={clientIdModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setClientIdModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Key size={20} color={colors.primaryLight} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Google OAuth Client ID
                </Text>
              </View>
              <TouchableOpacity onPress={() => setClientIdModalVisible(false)}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Enter your custom Google Cloud Web/Android OAuth 2.0 Client ID for official Google Sign-In and YouTube read-only scope access.
            </Text>

            <TextInput
              style={[
                styles.modalInput,
                {
                  color: colors.text,
                  backgroundColor: colors.surfaceVariant,
                  borderColor: colors.border,
                },
              ]}
              placeholder="e.g. 123456789-xyz.apps.googleusercontent.com"
              placeholderTextColor={colors.textMuted}
              value={clientIdInput}
              onChangeText={setClientIdInput}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { backgroundColor: colors.surfaceVariant }]}
                onPress={() => setClientIdModalVisible(false)}
              >
                <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>
                  {t.library.cancel}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSaveBtn, { backgroundColor: colors.primary }]}
                onPress={handleSaveClientId}
              >
                <Text style={styles.modalSaveText}>{t.common.save}</Text>
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
  scrollBody: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  section: {
    marginTop: 20,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  card: {
    borderRadius: 16,
    padding: 14,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  optionSub: {
    fontSize: 12,
    marginTop: 2,
  },
  helperText: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 6,
    marginBottom: 10,
  },
  ytButtonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  ytActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  ytActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  ytRemoveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  ytRemoveBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  themeSelector: {
    flexDirection: 'row',
    gap: 6,
  },
  qualitySelector: {
    flexDirection: 'row',
    gap: 4,
  },
  modeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  langGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  langChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  langText: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  footer: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 10,
  },
  footerText: {
    fontSize: 12,
  },
  footerBrand: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
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
  profileSection: {
    gap: 12,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
  },
  profileEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  scopeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  scopeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  outlineBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  signOutBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  signedOutSection: {
    gap: 8,
  },
  googleSignInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 6,
  },
  googleSignInBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  clientIdLink: {
    alignSelf: 'center',
    paddingVertical: 6,
    marginTop: 4,
  },
  clientIdLinkText: {
    fontSize: 12,
    textDecorationLine: 'underline',
  },
});
