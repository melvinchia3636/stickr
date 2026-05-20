import { open } from 'react-native-nitro-sqlite';

let db: ReturnType<typeof open> | null = null;
let ready: Promise<void> | null = null;

function initDatabase(): void {
  if (db) return;
  db = open({
    name: 'stickercreator.db',
    location: 'default',
  });

  db.execute('PRAGMA journal_mode = DELETE');
  db.execute('PRAGMA synchronous = FULL');

  db.execute(`
    CREATE TABLE IF NOT EXISTS sticker_packs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      identifier TEXT NOT NULL UNIQUE,
      publisher TEXT DEFAULT '',
      tray_image_file TEXT,
      image_data_version TEXT DEFAULT '1',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  db.execute(`
    CREATE TABLE IF NOT EXISTS stickers (
      id TEXT PRIMARY KEY,
      pack_id TEXT NOT NULL,
      image_file_name TEXT NOT NULL,
      emojis TEXT DEFAULT '',
      accessibility_text TEXT DEFAULT '',
      sort_order INTEGER NOT NULL,
      FOREIGN KEY (pack_id) REFERENCES sticker_packs(id) ON DELETE CASCADE
    )
  `);
}

export function getDatabase(): ReturnType<typeof open> {
  if (!db) {
    initDatabase();
  }
  return db!;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
    ready = null;
  }
}
