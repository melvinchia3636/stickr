import type { PackWithStickers, Sticker, StickerPack } from '@/types'

import { getDatabase } from './init'

export function getAllPacks(): StickerPack[] {
  const db = getDatabase()
  const result = db.execute(
    'SELECT * FROM sticker_packs ORDER BY updated_at DESC'
  )
  return (result.rows?._array || []).map(mapRowToPack)
}

export function getPackById(id: string): StickerPack | null {
  const db = getDatabase()
  const result = db.execute('SELECT * FROM sticker_packs WHERE id = ?', [id])
  const rows = result.rows?._array || []
  return rows.length > 0 ? mapRowToPack(rows[0]) : null
}

export function getPackWithStickers(id: string): PackWithStickers | null {
  const db = getDatabase()
  const result = db.execute('SELECT * FROM sticker_packs WHERE id = ?', [id])
  const rows = result.rows?._array || []
  if (rows.length === 0) return null
  const pack = mapRowToPack(rows[0])
  const stickers = getStickersForPack(id)
  return { ...pack, stickers }
}

export function createPack(
  name: string,
  identifier: string,
  trayImageFile: string | null
): string {
  const db = getDatabase()
  const now = Date.now()
  db.execute(
    `INSERT INTO sticker_packs (id, name, identifier, tray_image_file, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [identifier, name, identifier, trayImageFile, now, now]
  )
  return identifier
}

export function updatePackName(id: string, name: string): void {
  const db = getDatabase()
  db.execute('UPDATE sticker_packs SET name = ?, updated_at = ? WHERE id = ?', [
    name,
    Date.now(),
    id
  ])
}

export function updatePackTrayImage(id: string, trayImageFile: string): void {
  const db = getDatabase()
  db.execute(
    'UPDATE sticker_packs SET tray_image_file = ?, updated_at = ? WHERE id = ?',
    [trayImageFile, Date.now(), id]
  )
}

export function deletePack(id: string): void {
  const db = getDatabase()
  db.execute('DELETE FROM stickers WHERE pack_id = ?', [id])
  db.execute('DELETE FROM sticker_packs WHERE id = ?', [id])
}

export function getPackCount(): number {
  const db = getDatabase()
  const result = db.execute('SELECT COUNT(*) as count FROM sticker_packs')
  const rows = result.rows?._array || []
  return rows.length > 0 ? (rows[0] as Record<string, number>).count : 0
}

export function addSticker(
  id: string,
  packId: string,
  imageFileName: string,
  emojis: string,
  sortOrder: number
): void {
  const db = getDatabase()
  db.execute(
    `INSERT INTO stickers (id, pack_id, image_file_name, emojis, sort_order)
     VALUES (?, ?, ?, ?, ?)`,
    [id, packId, imageFileName, emojis, sortOrder]
  )
}

export function getStickersForPack(packId: string): Sticker[] {
  const db = getDatabase()
  const result = db.execute(
    'SELECT * FROM stickers WHERE pack_id = ? ORDER BY sort_order ASC',
    [packId]
  )
  return (result.rows?._array || []).map(mapRowToSticker)
}

export function getStickerCountForPack(packId: string): number {
  const db = getDatabase()
  const result = db.execute(
    'SELECT COUNT(*) as count FROM stickers WHERE pack_id = ?',
    [packId]
  )
  const rows = result.rows?._array || []
  return rows.length > 0 ? (rows[0] as Record<string, number>).count : 0
}

export function updateStickerEmojis(id: string, emojis: string): void {
  const db = getDatabase()
  db.execute('UPDATE stickers SET emojis = ? WHERE id = ?', [emojis, id])
}

export function updateStickerSortOrder(id: string, sortOrder: number): void {
  const db = getDatabase()
  db.execute('UPDATE stickers SET sort_order = ? WHERE id = ?', [sortOrder, id])
}

export function deleteSticker(id: string): void {
  const db = getDatabase()
  db.execute('DELETE FROM stickers WHERE id = ?', [id])
}

export function deleteStickersForPack(packId: string): void {
  const db = getDatabase()
  db.execute('DELETE FROM stickers WHERE pack_id = ?', [packId])
}

function mapRowToPack(row: Record<string, unknown>): StickerPack {
  return {
    id: row.id as string,
    name: row.name as string,
    identifier: row.identifier as string,
    publisher: (row.publisher as string) || '',
    trayImageFile: (row.tray_image_file as string) || null,
    imageDataVersion: (row.image_data_version as string) || '1',
    createdAt: row.created_at as number,
    updatedAt: row.updated_at as number
  }
}

function mapRowToSticker(row: Record<string, unknown>): Sticker {
  return {
    id: row.id as string,
    packId: row.pack_id as string,
    imageFileName: row.image_file_name as string,
    emojis: (row.emojis as string) || '',
    accessibilityText: (row.accessibility_text as string) || '',
    sortOrder: row.sort_order as number
  }
}
