# Changelog

All notable changes to the **Your Music** application will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-09-30

### Added
- Complete A–Z Music Player for Android (`com.yourmusic.app`), Branded **By Anzles**.
- Real audio streaming engine with `expo-av`, background playback mode, lock-screen notification media controls, and audio focus interruption recovery.
- Resilient API architecture supporting live track search, featured albums, trending artists, and curated high-fidelity streams with automatic fallback.
- SQLite database schema migration engine (`schema_migrations`) preserving user favorites, custom playlists, listening history, downloads, and user settings.
- Multilingual support for English, Tamil, Spanish, and Portuguese.
- Dark, Light, and System dynamic themes with high accessibility contrast and tablet-responsive layouts.
- Offline playback manager with local file download caching, offline banners, and reconnection sync.
- Mini-player with smooth sliding drawer, full-screen player with interactive scrubber, seek, repeat (off/one/all), shuffle, queue management, and synced lyrics viewer.
- Security-hardened structured logger (`src/utils/logger.ts`) with automatic token/password sanitization and in-app diagnostics.
- Crash recovery `ErrorBoundary` component with "Try Again" and "Go Home" actions.
- Automated continuous health check (`npm run health`) and pre-release verification (`npm run verify`).
- Comprehensive Jest unit and integration test suite across audio, database, API, offline, i18n, logger, and UI layers.
