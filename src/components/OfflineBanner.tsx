import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WifiOff } from 'lucide-react-native';
import { offlineManager } from '../services/offline/offlineManager';
import { useTheme } from '../theme/themeContext';

export const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState(offlineManager.getIsOnline());
  const { colors, t } = useTheme();

  useEffect(() => {
    const unsubscribe = offlineManager.subscribe((online) => {
      setIsOnline(online);
    });
    return unsubscribe;
  }, []);

  if (isOnline) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.warning }]}>
      <WifiOff size={16} color="#000000" />
      <Text style={styles.text}>{t.home.offlineMessage}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  text: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '600',
  },
});
