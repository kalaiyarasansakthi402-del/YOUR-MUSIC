import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../theme/themeContext';

export const PrivacyScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors, t } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t.settings.privacy}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>1. Data Ownership & Privacy</Text>
          <Text style={[styles.cardBody, { color: colors.textSecondary }]}>
            Your Music stores your playlists, favorites, and listening history locally on your device
            in an encrypted SQLite database. No personal tracking or secret harvesting takes place.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>2. Audio & Media Permissions</Text>
          <Text style={[styles.cardBody, { color: colors.textSecondary }]}>
            Foreground service and audio playback permissions are utilized strictly for streaming
            and background playback controls in compliance with Android media standards.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>3. Diagnostic Sanitization</Text>
          <Text style={[styles.cardBody, { color: colors.textSecondary }]}>
            Diagnostic logs automatically sanitize and redact passwords, API keys, auth tokens,
            and personal sensitive identifiers before writing to memory.
          </Text>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  cardBody: {
    fontSize: 13,
    lineHeight: 20,
  },
});
