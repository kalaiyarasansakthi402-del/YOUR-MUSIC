# 🎵 Your Music — By Anzles

**Your Music** is a high-performance, continuously maintainable, native Android music player built with Expo, React Native, TypeScript, and SQLite.

---

## 🌟 Key Features

- **Real Audio Engine**: Powered by `expo-av`, featuring background audio playback, lock-screen controls, seamless track looping, shuffle, and smooth seek scrubbers.
- **Resilient API Layer**: Curated & live streaming API provider with exponential backoff retry, rate-limit handling, malformed payload protection, and offline fallback.
- **Offline & Downloads**: Local track file download and storage engine (`expo-file-system`), cache management, and automatic offline mode.
- **SQLite Database with Migrations**: Bulletproof persistence for User Playlists, Favorites, History, Downloads, and Settings with safe versioned schema migrations.
- **Modern Responsive UI**: Built for phones and tablets, featuring Dark, Light, and System themes, animated Mini Player, and Full Player modal.
- **Multilingual**: Native translations in English, Tamil, Spanish, and Portuguese.
- **Crash Recovery & Diagnostics**: Built-in `ErrorBoundary`, sanitized structured logger (`src/utils/logger.ts`), and in-app diagnostics health report viewer.

---

## 🛠️ Continuous Reliability & Health Check Commands

To maintain the verified working state:

```bash
# Run continuous health checks (TypeScript, ESLint, Jest, Expo Doctor)
npm run health

# Run release verification checks
npm run verify

# Run test suite
npm test

# Build Android APK via EAS
npm run build:apk
```

---

## 📱 Android Configuration

- **Package Name**: `com.yourmusic.app`
- **Version**: `1.0.0` (versionCode `1`)
- **Scheme**: `yourmusic://`
- **Developer**: By Anzles
