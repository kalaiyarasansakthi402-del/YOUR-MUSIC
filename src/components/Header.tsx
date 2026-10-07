import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Activity, Settings } from 'lucide-react-native';
import { useTheme } from '../theme/themeContext';
import { useAuthStore } from '../store/authStore';
import { BrandLogo } from './BrandLogo';
import { RootStackParamList } from '../navigation/types';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showDiagnostics?: boolean;
  showSettings?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showDiagnostics = true,
  showSettings = true,
}) => {
  const { colors, t } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuthStore();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.brandRow}>
        <BrandLogo size={36} />
        <View style={styles.titleWrap}>
          <Text style={[styles.title, { color: colors.text }]}>
            {title || t.appName}
          </Text>
          <Text style={[styles.subtitle, { color: colors.primaryLight }]}>
            {subtitle || t.tagline}
          </Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        {showDiagnostics && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.surfaceVariant }]}
            onPress={() => navigation.navigate('Diagnostics')}
            activeOpacity={0.7}
            testID="header-diagnostics-button"
            accessibilityLabel="System Health & Diagnostics"
          >
            <Activity size={16} color={colors.accent} />
          </TouchableOpacity>
        )}

        {showSettings && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.surfaceVariant }]}
            onPress={() => navigation.navigate('MainTabs', { screen: 'SettingsTab' })}
            activeOpacity={0.7}
            testID="header-settings-button"
            accessibilityLabel="Settings"
          >
            {user?.photoUrl ? (
              <Image source={{ uri: user.photoUrl }} style={styles.userAvatar} />
            ) : user?.name ? (
              <Text style={[styles.userInitials, { color: colors.primaryLight }]}>
                {user.name[0].toUpperCase()}
              </Text>
            ) : (
              <Settings size={18} color={colors.textSecondary} />
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  userInitials: {
    fontSize: 14,
    fontWeight: '700',
  },
});
