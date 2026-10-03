import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, HelpCircle } from 'lucide-react-native';
import { useTheme } from '../theme/themeContext';

export const HelpScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors, t } = useTheme();

  const faqs = [
    {
      q: 'How does background playback work?',
      a: 'Your Music utilizes Android Foreground Audio Services to keep playing audio even when your screen is locked or while multitasking.',
    },
    {
      q: 'Can I listen to music offline?',
      a: 'Yes! Tap the download button on any song to save it locally. Downloaded tracks will be available in Your Library -> Downloads anytime without an active internet connection.',
    },
    {
      q: 'How do I backup or preserve my playlists?',
      a: 'Your playlists and favorites are stored in a persistent SQLite database with automated forward schema migrations. Updating the application will preserve your personal data.',
    },
    {
      q: 'What should I do if a stream fails to play?',
      a: 'The player engine automatically retries with exponential backoff and safely skips to the next track if a stream URL is unreachable.',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t.settings.help}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody}>
        {faqs.map((faq, idx) => (
          <View key={idx} style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.questionRow}>
              <HelpCircle size={18} color={colors.primaryLight} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>{faq.q}</Text>
            </View>
            <Text style={[styles.cardBody, { color: colors.textSecondary }]}>{faq.a}</Text>
          </View>
        ))}
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
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  cardBody: {
    fontSize: 13,
    lineHeight: 20,
  },
});
