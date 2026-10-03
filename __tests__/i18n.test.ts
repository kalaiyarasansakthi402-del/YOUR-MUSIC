import { getTranslation } from '../src/i18n';

describe('Multilingual Translation Integrity Suite', () => {
  const languages = ['en', 'ta', 'es', 'pt'] as const;

  languages.forEach((lang) => {
    it(`provides complete translation dictionary for language [${lang}]`, () => {
      const t = getTranslation(lang);
      expect(t.appName).toBeTruthy();
      expect(t.tagline).toBeTruthy();
      expect(t.tabs.home).toBeTruthy();
      expect(t.tabs.explore).toBeTruthy();
      expect(t.tabs.search).toBeTruthy();
      expect(t.tabs.library).toBeTruthy();
      expect(t.tabs.settings).toBeTruthy();
      expect(t.home.trendingNow).toBeTruthy();
      expect(t.player.nowPlaying).toBeTruthy();
      expect(t.settings.theme).toBeTruthy();
      expect(t.diagnostics.verifiedWorking).toBeTruthy();
    });
  });

  it('falls back to English for unknown language code', () => {
    // @ts-expect-error Testing fallback for invalid language
    const fallback = getTranslation('fr');
    expect(fallback.appName).toBe('Your Music');
  });
});
