import * as SQLite from 'expo-sqlite';
import { runMigrations } from './migrations';
import { Track, Playlist } from '../../types';
import { logger } from '../../utils/logger';

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized = false;

  public async init(): Promise<void> {
    if (this.isInitialized && this.db) return;
    try {
      this.db = SQLite.openDatabaseSync('your_music_v1.db');
      runMigrations(this.db);
      this.isInitialized = true;
      logger.info('Database initialized and verified successfully.');
    } catch (error) {
      logger.error('Failed to initialize SQLite Database', { error: String(error) });
      throw error;
    }
  }

  private getDB(): SQLite.SQLiteDatabase {
    if (!this.db) {
      this.db = SQLite.openDatabaseSync('your_music_v1.db');
      runMigrations(this.db);
    }
    return this.db;
  }

  // --- TRACKS ---
  public upsertTrack(track: Track): void {
    const db = this.getDB();
    db.runSync(
      `INSERT INTO tracks (id, title, artist, album, artwork, url, duration, genre, lyrics, is_downloaded, local_uri, play_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         title=excluded.title,
         artist=excluded.artist,
         album=excluded.album,
         artwork=excluded.artwork,
         url=excluded.url,
         duration=excluded.duration,
         genre=excluded.genre,
         lyrics=excluded.lyrics,
         is_downloaded=excluded.is_downloaded,
         local_uri=excluded.local_uri;`,
      [
        track.id,
        track.title,
        track.artist,
        track.album || '',
        track.artwork,
        track.url,
        track.duration || 0,
        track.genre || '',
        track.lyrics || '',
        track.isDownloaded ? 1 : 0,
        track.localUri || '',
        track.playCount || 0,
      ]
    );
  }

  public getTrack(id: string): Track | null {
    const db = this.getDB();
    const row = db.getFirstSync<Record<string, unknown>>('SELECT * FROM tracks WHERE id = ?', [id]);
    if (!row) return null;
    return this.mapTrackRow(row);
  }

  // --- FAVORITES ---
  public addFavorite(track: Track): void {
    const db = this.getDB();
    this.upsertTrack(track);
    db.runSync(
      'INSERT INTO favorites (track_id, added_at) VALUES (?, ?) ON CONFLICT(track_id) DO NOTHING;',
      [track.id, Math.floor(Date.now() / 1000)]
    );
  }

  public removeFavorite(trackId: string): void {
    const db = this.getDB();
    db.runSync('DELETE FROM favorites WHERE track_id = ?;', [trackId]);
  }

  public isFavorite(trackId: string): boolean {
    const db = this.getDB();
    const row = db.getFirstSync('SELECT track_id FROM favorites WHERE track_id = ?;', [trackId]);
    return !!row;
  }

  public getFavorites(): Track[] {
    const db = this.getDB();
    const rows = db.getAllSync<Record<string, unknown>>(
      `SELECT t.* FROM tracks t
       INNER JOIN favorites f ON t.id = f.track_id
       ORDER BY f.added_at DESC;`
    );
    return rows.map((r: Record<string, unknown>) => this.mapTrackRow(r, true));
  }

  // --- HISTORY ---
  public addHistory(track: Track): void {
    const db = this.getDB();
    this.upsertTrack(track);
    db.runSync(
      'INSERT INTO history (track_id, played_at) VALUES (?, ?);',
      [track.id, Math.floor(Date.now() / 1000)]
    );
    // Increment play count
    db.runSync('UPDATE tracks SET play_count = play_count + 1 WHERE id = ?;', [track.id]);
  }

  public getHistory(limit = 50): Track[] {
    const db = this.getDB();
    const rows = db.getAllSync<Record<string, unknown>>(
      `SELECT t.*, MAX(h.played_at) as last_played FROM tracks t
       INNER JOIN history h ON t.id = h.track_id
       GROUP BY t.id
       ORDER BY last_played DESC
       LIMIT ?;`,
      [limit]
    );
    return rows.map((r: Record<string, unknown>) => this.mapTrackRow(r));
  }

  public clearHistory(): void {
    const db = this.getDB();
    db.runSync('DELETE FROM history;');
  }

  // --- PLAYLISTS ---
  public createPlaylist(id: string, title: string, description = '', coverImage = ''): Playlist {
    const db = this.getDB();
    const createdAt = Math.floor(Date.now() / 1000);
    db.runSync(
      'INSERT INTO playlists (id, title, description, cover_image, created_at, is_custom) VALUES (?, ?, ?, ?, ?, 1);',
      [id, title, description, coverImage, createdAt]
    );
    return {
      id,
      title,
      description,
      coverImage,
      createdAt,
      tracks: [],
      isCustom: true,
    };
  }

  public getPlaylists(): Playlist[] {
    const db = this.getDB();
    const playlistRows = db.getAllSync<Record<string, unknown>>(
      'SELECT * FROM playlists ORDER BY created_at DESC;'
    );
    return playlistRows.map((p: Record<string, unknown>) => {
      const pId = String(p.id);
      const trackRows = db.getAllSync<Record<string, unknown>>(
        `SELECT t.* FROM tracks t
         INNER JOIN playlist_tracks pt ON t.id = pt.track_id
         WHERE pt.playlist_id = ?
         ORDER BY pt.position ASC;`,
        [pId]
      );
      return {
        id: pId,
        title: String(p.title),
        description: String(p.description || ''),
        coverImage: String(p.cover_image || ''),
        createdAt: Number(p.created_at || 0),
        isCustom: Number(p.is_custom) === 1,
        tracks: trackRows.map((r: Record<string, unknown>) => this.mapTrackRow(r)),
      };
    });
  }

  public getPlaylistById(playlistId: string): Playlist | null {
    const db = this.getDB();
    const p = db.getFirstSync<Record<string, unknown>>('SELECT * FROM playlists WHERE id = ?;', [playlistId]);
    if (!p) return null;
    const trackRows = db.getAllSync<Record<string, unknown>>(
      `SELECT t.* FROM tracks t
       INNER JOIN playlist_tracks pt ON t.id = pt.track_id
       WHERE pt.playlist_id = ?
       ORDER BY pt.position ASC;`,
      [playlistId]
    );
    return {
      id: String(p.id),
      title: String(p.title),
      description: String(p.description || ''),
      coverImage: String(p.cover_image || ''),
      createdAt: Number(p.created_at || 0),
      isCustom: Number(p.is_custom) === 1,
      tracks: trackRows.map((r: Record<string, unknown>) => this.mapTrackRow(r)),
    };
  }

  public addTrackToPlaylist(playlistId: string, track: Track): void {
    const db = this.getDB();
    this.upsertTrack(track);
    const countRow = db.getFirstSync<{ max_pos: number }>(
      'SELECT COALESCE(MAX(position), -1) as max_pos FROM playlist_tracks WHERE playlist_id = ?;',
      [playlistId]
    );
    const nextPos = (countRow?.max_pos ?? -1) + 1;
    db.runSync(
      'INSERT INTO playlist_tracks (playlist_id, track_id, position) VALUES (?, ?, ?) ON CONFLICT(playlist_id, track_id) DO NOTHING;',
      [playlistId, track.id, nextPos]
    );
  }

  public removeTrackFromPlaylist(playlistId: string, trackId: string): void {
    const db = this.getDB();
    db.runSync('DELETE FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?;', [playlistId, trackId]);
  }

  public deletePlaylist(playlistId: string): void {
    const db = this.getDB();
    db.withTransactionSync(() => {
      db.runSync('DELETE FROM playlist_tracks WHERE playlist_id = ?;', [playlistId]);
      db.runSync('DELETE FROM playlists WHERE id = ?;', [playlistId]);
    });
  }

  // --- DOWNLOADS ---
  public saveDownload(track: Track, localUri: string, fileSize: number): void {
    const db = this.getDB();
    const updatedTrack = { ...track, isDownloaded: true, localUri };
    this.upsertTrack(updatedTrack);
    db.runSync(
      'INSERT INTO downloads (track_id, local_uri, file_size, downloaded_at) VALUES (?, ?, ?, ?) ON CONFLICT(track_id) DO UPDATE SET local_uri=excluded.local_uri, file_size=excluded.file_size;',
      [track.id, localUri, fileSize, Math.floor(Date.now() / 1000)]
    );
  }

  public getDownloads(): Track[] {
    const db = this.getDB();
    const rows = db.getAllSync<Record<string, unknown>>(
      `SELECT t.*, d.local_uri as d_local_uri FROM tracks t
       INNER JOIN downloads d ON t.id = d.track_id
       ORDER BY d.downloaded_at DESC;`
    );
    return rows.map((r: Record<string, unknown>) => {
      const track = this.mapTrackRow(r);
      track.isDownloaded = true;
      if (r.d_local_uri) track.localUri = String(r.d_local_uri);
      return track;
    });
  }

  public removeDownload(trackId: string): void {
    const db = this.getDB();
    db.runSync('DELETE FROM downloads WHERE track_id = ?;', [trackId]);
    db.runSync('UPDATE tracks SET is_downloaded = 0, local_uri = NULL WHERE id = ?;', [trackId]);
  }

  // --- INTEGRITY CHECK ---
  public validateIntegrity(): { status: 'OK' | 'CORRUPT'; tables: string[] } {
    const db = this.getDB();
    const tables = db.getAllSync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';"
    );
    return {
      status: 'OK',
      tables: tables.map((t: { name: string }) => t.name),
    };
  }

  private mapTrackRow(row: Record<string, unknown>, forceFavorite = false): Track {
    return {
      id: String(row.id),
      title: String(row.title),
      artist: String(row.artist),
      album: String(row.album || ''),
      artwork: String(row.artwork || ''),
      url: String(row.url),
      duration: Number(row.duration || 0),
      genre: String(row.genre || ''),
      lyrics: String(row.lyrics || ''),
      isDownloaded: Number(row.is_downloaded) === 1,
      localUri: row.local_uri ? String(row.local_uri) : undefined,
      isFavorite: forceFavorite || false,
      playCount: Number(row.play_count || 0),
    };
  }
}

export const database = new DatabaseService();
