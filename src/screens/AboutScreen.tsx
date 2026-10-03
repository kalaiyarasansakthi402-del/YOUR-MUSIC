import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Music2 } from 'lucide-react-native';
import { useTheme } from '../theme/themeContext';

export const AboutScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors, t } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t.settings.about}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody}>
        <View style={styles.brandBox}>
          <View style={[styles.iconWrap, { backgroundColor: colors.primary }]}>
            <Music2 size={44} color="#FFFFFF" />
          </View>
          <Text style={[styles.appName, { color: colors.text }]}>Your Music</Text>
          <Text style={[styles.brand, { color: colors.primaryLight }]}>By Anzles</Text>
          <Text style={[styles.version, { color: colors.textSecondary }]}>Version 1.0.0 (Android Build 1)</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>About the Application</Text>
          <Text style={[styles.cardBody, { color: colors.textSecondary }]}>
            Your Music is an engineered music streaming and offline player built for Android.
            It delivers low-latency audio playback, resilient streaming with automated error recovery,
            SQLite schema persistence, and multilingual localization.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Continuous Reliability Standard</Text>
          <Text style={[styles.cardBody, { color: colors.textSecondary }]}>
            Every release and feature update is continuously validated against automated TypeScript checks,
            ESLint rules, Jest test suites, and native Android compatibility tests.
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
    paddingBottom: 40,
  },
  brandBox: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  appName: {
    fontSize: 26,
    fontWeight: '800',
  },
  brand: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  version: {
    fontSize: 12,
    marginTop: 6,
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
