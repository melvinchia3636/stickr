import { drizzle } from 'drizzle-orm/sqlite-proxy'
import { open } from 'react-native-nitro-sqlite'

import * as schema from './schema'

let db: ReturnType<typeof open> | null = null
let drizzleDb: ReturnType<typeof drizzle<typeof schema>> | null = null

function initDatabase(): void {
  if (db) return
  db = open({
    name: 'stickercreator.db',
    location: 'default'
  })

  db.execute('PRAGMA journal_mode = DELETE')
  db.execute('PRAGMA synchronous = FULL')

  db.execute(`
    CREATE TABLE IF NOT EXISTS sticker_packs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      identifier TEXT NOT NULL UNIQUE,
      publisher TEXT DEFAULT '',
      tray_image_file TEXT,
      image_data_version TEXT DEFAULT '1',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      sigstick_id TEXT
    )
  `)

  try {
    db.execute('ALTER TABLE sticker_packs ADD COLUMN sigstick_id TEXT')
  } catch {
    // Column already exists, ignore error
  }

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
  `)

  db.execute(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `)
}

function extractColumnsFromSql(sql: string): string[] {
  const selectMatch = sql.match(/^\s*select\s+(.+?)\s+from\b/i)

  if (!selectMatch) {
    return []
  }

  const columnsPart = selectMatch[1]

  const parts = columnsPart.split(',')

  return parts.map(part => {
    const aliasParts = part.split(/\s+as\s+/i)

    let columnExpr = aliasParts[aliasParts.length - 1].trim()

    const dotParts = columnExpr.split('.')

    columnExpr = dotParts[dotParts.length - 1].trim()

    return columnExpr.replace(/["`]/g, '').trim()
  })
}

export function getDrizzle() {
  if (drizzleDb) {
    return drizzleDb
  }

  if (!db) {
    initDatabase()
  }

  drizzleDb = drizzle<typeof schema>(
    async (sql, params, method) => {
      const result = db!.execute(sql, params)

      const rawRows = result.rows?._array || []

      const columns = extractColumnsFromSql(sql)

      const mapRow = (row: Record<string, unknown>) => {
        if (columns.length > 0) {
          return columns.map(col => row[col])
        }

        return Object.values(row)
      }

      if (method === 'get') {
        return {
          rows: rawRows.length > 0 ? mapRow(rawRows[0]) : []
        }
      }

      if (method === 'all' || method === 'values') {
        return {
          rows: rawRows.map((row: Record<string, unknown>) => mapRow(row))
        }
      }

      return {
        rows: []
      }
    },
    { schema }
  )

  return drizzleDb
}

export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
    drizzleDb = null
  }
}
