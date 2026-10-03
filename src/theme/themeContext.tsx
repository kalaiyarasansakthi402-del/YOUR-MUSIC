import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkColors, lightColors, ThemeColors } from './colors';
import { ThemeMode, Language } from '../types';
import { getTranslation, translations } from '../i18n';

interface ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => Promise<void>;
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: typeof translations.en;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'dark',
  isDark: true,
  colors: darkColors,
  setMode: async () => {},
  language: 'en',
  setLanguage: async () => {},
  t: translations.en,
});

const STORAGE_THEME_KEY = '@your_music_theme_mode';
const STORAGE_LANG_KEY = '@your_music_language';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('dark');
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    (async () => {
      try {
        const savedMode = await AsyncStorage.getItem(STORAGE_THEME_KEY);
        if (savedMode && (savedMode === 'light' || savedMode === 'dark' || savedMode === 'system')) {
          setModeState(savedMode as ThemeMode);
        }
        const savedLang = await AsyncStorage.getItem(STORAGE_LANG_KEY);
        if (savedLang && (savedLang === 'en' || savedLang === 'ta' || savedLang === 'es' || savedLang === 'pt')) {
          setLanguageState(savedLang as Language);
        }
      } catch {
        // Fallback to defaults on error
      }
    })();
  }, []);

  const setMode = async (newMode: ThemeMode) => {
    setModeState(newMode);
    try {
      await AsyncStorage.setItem(STORAGE_THEME_KEY, newMode);
    } catch {
      // Ignored
    }
  };

  const setLanguage = async (newLang: Language) => {
    setLanguageState(newLang);
    try {
      await AsyncStorage.setItem(STORAGE_LANG_KEY, newLang);
    } catch {
      // Ignored
    }
  };

  const isDark = mode === 'system' ? systemColorScheme !== 'light' : mode === 'dark';
  const colors = isDark ? darkColors : lightColors;
  const t = getTranslation(language);

  return (
    <ThemeContext.Provider value={{ mode, isDark, colors, setMode, language, setLanguage, t }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
