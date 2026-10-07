import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '../theme/themeContext';

interface BrandLogoProps {
  size?: number;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 32 }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Defs>
          <LinearGradient id="ym_grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={colors.primaryLight} />
            <Stop offset="100%" stopColor={colors.primary} />
          </LinearGradient>
          <LinearGradient id="ym_accent" x1="0%" y1="100%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={colors.secondary} />
            <Stop offset="100%" stopColor={colors.accent} />
          </LinearGradient>
        </Defs>

        {/* Outer Circular Wave */}
        <Circle cx="24" cy="24" r="22" stroke="url(#ym_grad)" strokeWidth="2.5" opacity={0.35} />

        {/* Dynamic Equalizer / Soundwaves */}
        <Path
          d="M12 28V20M17 33V15M22 37V11M27 35V13M32 31V17M37 26V22"
          stroke="url(#ym_accent)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Central Sonic Core */}
        <Circle cx="22" cy="24" r="2.5" fill="#FFFFFF" />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
