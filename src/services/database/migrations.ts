import { SQLiteDatabase } from 'expo-sqlite';
import { logger } from '../../utils/logger';

export interface Migration {
  version: number;
  name: string;
  up: (db: SQLiteDatabase) => void;
}

export const migrations: Migration[] = [
  {
    version: 1,
    name: '001_initial_schema',
    up: (db: SQLiteDatabase) => {
      // 1. Tracks table
      db.execSync(`
        CREATE TABLE IF NOT EXISTS tracks (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          artist TEXT NOT NULL,
          album TEXT,
          artwork TEXT,
          url TEXT NOT NULL,
          duration INTEGER NOT NULL DEFAULT 0,
          genre TEXT,
          lyrics TEXT,
          is_downloaded INTEGER NOT NULL DEFAULT 0,
          local_uri TEXT,
          play_count INTEGER NOT NULL DEFAULT 0,
          added_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
        );
      `);

      // 2. Playlists table
      db.execSync(`
        CREATE TABLE IF NOT EXISTS playlists (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          cover_image TEXT,
          created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
          is_custom INTEGER NOT NULL DEFAULT 1
        );
      `);

      // 3. Playlist Tracks join table
      db.execSync(`
        CREATE TABLE IF NOT EXISTS playlist_tracks (
          playlist_id TEXT NOT NULL,
          track_id TEXT NOT NULL,
          position INTEGER NOT NULL DEFAULT 0,
          PRIMARY KEY (playlist_id, track_id),
          FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
          FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
        );
      `);

      // 4. Favorites table
      db.execSync(`
        CREATE TABLE IF NOT EXISTS favorites (
          track_id TEXT PRIMARY KEY,
          added_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
          FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
        );
      `);

      // 5. Listening History table
      db.execSync(`
        CREATE TABLE IF NOT EXISTS history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          track_id TEXT NOT NULL,
          played_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
          FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
        );
      `);

      // 6. Downloads table
      db.execSync(`
        CREATE TABLE IF NOT EXISTS downloads (
          track_id TEXT PRIMARY KEY,
          local_uri TEXT NOT NULL,
          file_size INTEGER NOT NULL DEFAULT 0,
          downloaded_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
          FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
        );
      `);

      // 7. Settings Key-Value table
      db.execSync(`
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
      `);
    },
  },
  {
    version: 2,
    name: '002_playback_state_and_artists_albums',
    up: (db: SQLiteDatabase) => {
      // 8. Artists table
      db.execSync(`
        CREATE TABLE IF NOT EXISTS artists (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          image TEXT,
          track_count INTEGER NOT NULL DEFAULT 0
        );
      `);

      // 9. Albums table
      db.execSync(`
        CREATE TABLE IF NOT EXISTS albums (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          artist TEXT,
          artwork TEXT,
          year TEXT,
          track_count INTEGER NOT NULL DEFAULT 0
        );
      `);

      // 10. Playback queue table
      db.execSync(`
        CREATE TABLE IF NOT EXISTS playback_queue (
          position INTEGER PRIMARY KEY,
          track_id TEXT NOT NULL,
          FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
        );
      `);

      // 11. Playback state table
      db.execSync(`
        CREATE TABLE IF NOT EXISTS playback_state (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          current_track_id TEXT,
          position INTEGER NOT NULL DEFAULT 0,
          is_playing INTEGER NOT NULL DEFAULT 0,
          repeat_mode TEXT NOT NULL DEFAULT 'off',
          shuffle INTEGER NOT NULL DEFAULT 0,
          updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
        );
      `);
    },
  },
];

export const runMigrations = (db: SQLiteDatabase): void => {
  try {
    // Create migrations table if not exists
    db.execSync(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    // Fetch applied migrations
    const appliedRows = db.getAllSync<{ version: number }>('SELECT version FROM schema_migrations ORDER BY version ASC');
    const appliedVersions = new Set(appliedRows.map((r: { version: number }) => r.version));

    for (const migration of migrations) {
      if (!appliedVersions.has(migration.version)) {
        logger.info(`Applying Database Migration [${migration.version}: ${migration.name}]...`);
        db.withTransactionSync(() => {
          migration.up(db);
          db.runSync(
            'INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, datetime("now"))',
            [migration.version, migration.name]
          );
        });
        logger.info(`Migration [${migration.version}: ${migration.name}] applied successfully.`);
      }
    }
  } catch (error) {
    logger.error('Database migration failed', { error: String(error) });
    throw error;
  }
};
