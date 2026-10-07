import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ShieldCheck,
  Music,
  Youtube,
  AlertCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react-native';
import { BrandLogo } from '../components/BrandLogo';
import { useTheme } from '../theme/themeContext';
import { useAuthStore } from '../store/authStore';
import { RootStackParamList } from '../navigation/types';

export const LoginScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { signInWithGoogle, isLoading, error } = useAuthStore();
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setLocalError(null);
    try {
      const user = await signInWithGoogle();
      if (user) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setLocalError(msg || 'Google sign-in could not be completed. Please try again.');
    }
  };

  const handleContinueAsGuest = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* BRAND HERO SECTION */}
        <View style={styles.heroSection}>
          <BrandLogo size={90} />
          <Text style={[styles.appName, { color: colors.text }]}>YOUR MUSIC</Text>
          <Text style={[styles.developerTag, { color: colors.primaryLight }]}>By Anzles</Text>
          <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
            Modern Material 3 Music Player & Official YouTube Integration
          </Text>
        </View>

        {/* ERROR DISPLAY */}
        {(error || localError) && (
          <View style={[styles.errorCard, { backgroundColor: 'rgba(255, 71, 87, 0.12)', borderColor: colors.error }]}>
            <AlertCircle size={18} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>
              {localError || error}
            </Text>
          </View>
        )}

        {/* FEATURE HIGHLIGHTS */}
        <View style={[styles.featureCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.featureItem}>
            <View style={[styles.featureIconWrap, { backgroundColor: 'rgba(255, 0, 0, 0.12)' }]}>
              <Youtube size={20} color="#FF0000" />
            </View>
            <View style={styles.featureInfo}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>Official YouTube Search</Text>
              <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
                Search songs, music videos, playlists, and artists with metadata and durations.
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.featureItem}>
            <View style={[styles.featureIconWrap, { backgroundColor: 'rgba(108, 92, 231, 0.12)' }]}>
              <Music size={20} color={colors.primaryLight} />
            </View>
            <View style={styles.featureInfo}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>Offline & Bundled Audio</Text>
              <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
                Full-fidelity playback, playlists, favorites, and downloads stored locally in SQLite.
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.featureItem}>
            <View style={[styles.featureIconWrap, { backgroundColor: 'rgba(46, 213, 115, 0.12)' }]}>
              <ShieldCheck size={20} color={colors.success} />
            </View>
            <View style={styles.featureInfo}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>Google OAuth 2.0 Security</Text>
              <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
                Zero password storage. Minimum read-only scopes. Tokens preserved in secure storage.
              </Text>
            </View>
          </View>
        </View>

        {/* AUTHENTICATION ACTION BUTTONS */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.googleSignInBtn, { backgroundColor: '#4285F4' }]}
            onPress={handleSignIn}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <View style={styles.btnContent}>
                <Sparkles size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.googleBtnText}>Continue with Google</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.guestBtn, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}
            onPress={handleContinueAsGuest}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Text style={[styles.guestBtnText, { color: colors.text }]}>Continue as Guest / Offline</Text>
            <ArrowRight size={16} color={colors.textSecondary} style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>

        {/* PRIVACY & COMPLIANCE FOOTER */}
        <View style={styles.footerNote}>
          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            YOUR MUSIC adheres to Google API Terms of Service. Direct playback utilizes supported official mechanisms with zero stream extraction.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
    alignItems: 'center',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  appName: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 16,
  },
  developerTag: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 2,
    marginBottom: 8,
  },
  heroSub: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    width: '100%',
    gap: 8,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  featureCard: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    marginBottom: 28,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  featureIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  featureInfo: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 11,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  actionContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  googleSignInBtn: {
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#4285F4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  googleBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  guestBtn: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footerNote: {
    paddingHorizontal: 12,
  },
  footerText: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
});
