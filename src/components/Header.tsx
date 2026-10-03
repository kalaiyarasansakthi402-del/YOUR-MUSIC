import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Activity } from 'lucide-react-native';
import { useTheme } from '../theme/themeContext';
import { RootStackParamList } from '../navigation/types';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showDiagnostics?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showDiagnostics = true,
}) => {
  const { colors, t } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View>
        <Text style={[styles.title, { color: colors.text }]}>
          {title || t.appName}
        </Text>
        <Text style={[styles.subtitle, { color: colors.primaryLight }]}>
          {subtitle || t.tagline}
        </Text>
      </View>

      {showDiagnostics && (
        <TouchableOpacity
          style={[styles.diagButton, { backgroundColor: colors.surfaceVariant }]}
          onPress={() => navigation.navigate('Diagnostics')}
          activeOpacity={0.7}
          testID="header-diagnostics-button"
        >
          <Activity size={16} color={colors.accent} />
          <Text style={[styles.diagText, { color: colors.accent }]}>Health</Text>
        </TouchableOpacity>
      )}
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
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  diagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  diagText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
