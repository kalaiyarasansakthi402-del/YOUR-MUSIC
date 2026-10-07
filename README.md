# YOUR MUSIC

**Your Music — By Anzles** is an Android music app built with Expo, React Native, and TypeScript. It combines a curated sample catalog, bundled offline audio, a personal music library, and optional YouTube Data API search.

| Project | Value |
| --- | --- |
| Developer | By Anzles |
| Android package | `com.yourmusic.app` |
| Version | `1.0.0` |
| Android version code | `1` |
| URL scheme | `yourmusic://` |

## Features

- Home and Explore screens with sample tracks, genres, artists, and albums.
- Audio playback for bundled WAV assets, downloaded files, and direct audio URLs, with play/pause, seeking, queue controls, shuffle, repeat, volume, and playback speed.
- Mini player and full player with track artwork and available lyrics.
- Favorites, playlists, listening history, and downloads stored locally in SQLite with versioned migrations.
- Downloads for direct audio sources, download progress, cache controls, and network status indicators.
- YouTube search for videos, channels, and playlists, with pagination, result caching, request timeouts, retries, and quota error handling.
- Light, dark, and system themes; English, Tamil, Spanish, and Portuguese translations.
- Guest/offline entry, optional Google account sign-in, error recovery, and in-app diagnostics.

YouTube results open in the official YouTube app or a browser. In-app audio playback uses bundled, local, or direct audio sources. The sample catalog includes generated audio assets in `assets/audio/`.

## Tech stack

| Area | Technology |
| --- | --- |
| App framework | Expo SDK 52, React Native 0.76.6, React 18.3.1 |
| Language | TypeScript |
| Navigation | React Navigation native stack and bottom tabs |
| State | Zustand |
| Audio | `expo-av` |
| Local data | `expo-sqlite`, AsyncStorage |
| Files and connectivity | `expo-file-system`, `expo-network` |
| Authentication | Expo AuthSession and WebBrowser |
| UI | Lucide icons, React Native SVG |
| Quality checks | TypeScript, ESLint, Jest, React Native Testing Library, Expo Doctor |
| Android builds | Gradle and Expo Application Services (EAS) |

## Architecture and Android background playback

Expo registers the React Native entry point in `index.js`. `App.tsx` mounts React Navigation inside the theme and error-handling providers and initializes SQLite, offline storage, the player, and the library during startup. TypeScript screens and shared components live in `src/`; Zustand stores connect them to the audio, API, authentication, database, and offline services.

`PlayerService` manages the queue and playback state and uses `expo-av` to play audio. It requests background audio with `staysActiveInBackground: true`, and the Android manifest declares media-playback foreground-service and wake-lock permissions. If audio-mode setup fails, the service falls back to foreground playback. Background behavior should be checked on the target Android device, including its battery restrictions. This playback path uses bundled files, local downloads, and direct audio URLs; YouTube results open externally.

## Installation

Install Node.js and npm, plus Git. Native Android development also requires a JDK, Android Studio/Android SDK, and an emulator or USB-connected device configured for development.

```powershell
git clone https://github.com/kalaiyarasansakthi402-del/YOUR-MUSIC.git
cd YOUR-MUSIC
npm install
```

The lockfile records the project's dependency versions. For a clean installation that strictly follows the committed lockfile, use `npm ci` instead of `npm install`.

The repository includes the native Android source. Debug builds use the existing local `android/app/debug.keystore` when present, or Android's default development signing configuration on a fresh clone. Signing files stay outside Git.

When the native `android/` folder is present, EAS Build uses that project and does not automatically synchronize Expo prebuild properties from `app.json`. Keep native configuration aligned with intended Expo configuration changes; Expo Doctor reports this setup as a configuration warning.

## Development commands

```powershell
# Start the Expo development server
npm start

# Build and launch the native Android app
npm run android

# Restart Expo with its cache cleared
npm start -- --clear
```

Choose **Continue as Guest / Offline** on the login screen to explore the sample catalog without configuring Google sign-in.

| Command | Purpose |
| --- | --- |
| `npm run ios` | Build and launch iOS; requires macOS and Xcode |
| `npm run web` | Start Expo's web target; native functionality needs platform validation |
| `npm run typecheck` | Check TypeScript without emitting files |
| `npm run lint` | Run ESLint with zero warnings allowed |
| `npm run lint:fix` | Apply available ESLint fixes |
| `npm test` | Run the Jest suite |
| `npm run test:coverage` | Run tests with coverage reporting |
| `npm run doctor` | Run Expo Doctor |
| `npm run health` | Run TypeScript, ESLint, Jest, and Expo Doctor checks |
| `npm run verify` | Run release configuration, source secret-pattern, code, test, and Android permission checks |
| `npm run build:apk` | Build an Android APK with the EAS `preview` profile; requires EAS CLI |

The health and verification scripts accept certain Expo Doctor network failures after validating local configuration. Review their output when assessing dependency compatibility.

## YouTube Data API and environment setup

Create a Google Cloud project, enable **YouTube Data API v3**, and create an API key for public search requests. See Google's [YouTube API setup guide](https://developers.google.com/youtube/v3/getting-started) and [API key quickstart](https://developers.google.com/youtube/v3/quickstart/js).

Create `.env.local` in the project root, or copy the safe `.env.example` template if no local file exists. Use your own key locally; the example below is a placeholder:

```env
YOUTUBE_API_KEY=YOUR_API_KEY_HERE
```

Keep `.env.local` on your machine and confirm it is ignored before committing:

```powershell
git check-ignore .env.local
git status --short -- .env .env.local
```

The current configuration service checks an in-memory override, device AsyncStorage, Expo `extra.youtubeApiKey`, and environment variables. The supplied static `app.json` does not map `YOUTUBE_API_KEY` into Expo configuration. Expo also requires static `process.env.EXPO_PUBLIC_*` references for automatic client inlining; the service currently reads environment variables dynamically. Creating `.env.local` alone therefore does not guarantee that a native build receives the key. See [Expo's environment variable documentation](https://docs.expo.dev/guides/environment-variables/).

To configure the existing app on a device:

1. Open **Settings → YouTube Data API v3**.
2. Enter and save your API key.
3. Open **Search**, choose the **YouTube** source, and search for music.

The app persists this key in device AsyncStorage. A missing key produces a configuration prompt; quota and network failures produce an error message. Public YouTube search uses the API key independently of Google sign-in.

Google sign-in requires a real OAuth client configuration. The built-in client ID is a placeholder; configure your own through Settings and validate the redirect flow for your build. Never commit OAuth client secrets or account tokens.

## Build an Android APK

The existing `eas.json` provides a `preview` profile with `android.buildType: "apk"` and internal distribution. The `production` profile generates an Android App Bundle (`.aab`). See [Expo's APK build guide](https://docs.expo.dev/build-reference/apk/).

Before your first EAS build, replace the placeholder `extra.eas.projectId` (`your-music-app-id`) in `app.json` with a real EAS project. Remove that placeholder field, then log in and create or link the project:

```powershell
npx eas-cli login
npx eas-cli init
npx eas-cli build:configure -p android
```

Review any configuration changes, preserve the existing build profiles, and keep the Android package set to `com.yourmusic.app`. EAS CLI setup is documented in [Expo's first build guide](https://docs.expo.dev/build/setup/).

Run the project checks, then build the APK:

```powershell
npm run health
npm run verify
npx eas-cli build -p android --profile preview
```

If EAS CLI is already available on your PATH, the equivalent build command is:

```powershell
npm run build:apk
```

Follow EAS prompts to configure signing credentials, then download the completed APK from the build page and install it on your Android device. `.env.local` remains excluded from uploaded source; use the app's Settings flow to configure YouTube on the installed app.

For local Gradle builds on Windows, configure the JDK and Android SDK, then run:

```powershell
cd android
.\gradlew.bat assembleRelease
cd ..
```

The APK is produced under `android/app/build/outputs/apk/release/`. The current local release configuration uses the debug signing configuration; configure your own release signing before distributing a production build.

## Repository layout

```text
App.tsx              App entry and initialization
src/components/      Shared interface components
src/screens/         App screens
src/navigation/      Stack and tab navigation
src/services/        Audio, API, database, offline, and authentication services
src/store/           Application state
src/theme/           Themes and colors
src/i18n/            Translations
assets/              Icons, splash artwork, and bundled sample audio
android/             Native Android source and Gradle configuration
scripts/             Asset generation, health, and release checks
__tests__/           Automated tests
app.json             Expo configuration and app identity
eas.json             EAS build profiles
```

## Credentials and generated files

Keep real API keys, `.env` files, credentials, signing files, Google services configuration, dependency folders, caches, build outputs, APKs, and AABs outside version control. The `.env.example` template contains placeholder values only.

Mobile clients and device storage cannot provide complete credential isolation. Keep keys out of public source, restrict their use in Google Cloud as appropriate for your deployment, and use a backend if credentials must remain confidential.

## YouTube API usage and compliance

YouTube Data API v3 supplies search results and metadata. Follow the [YouTube API Services Terms of Service](https://developers.google.com/youtube/terms/api-services-terms-of-service) and [Developer Policies](https://developers.google.com/youtube/terms/developer-policies) when configuring or distributing the app.

- Do not add YouTube media downloads, offline copies, audio extraction, or hidden/background YouTube playback. The app's offline audio features are for bundled or independently authorized direct audio sources.
- Preserve YouTube attribution and respect API quotas. Refresh or delete cached API metadata according to the applicable retention rules.
- Provide the required user-facing terms, privacy disclosures, consent, and account-access revocation/deletion controls. Keep OAuth credentials and tokens private.
- Use music, artwork, and other media only when you hold the necessary rights or permission.

**Developed by Anzles · Android package: `com.yourmusic.app`**
