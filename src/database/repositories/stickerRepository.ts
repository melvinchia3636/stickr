import type { Sticker } from '@/types'
import { asc, count, eq } from 'drizzle-orm'

import { getDrizzle } from '../init'
import { stickers } from '../schema'

export async function addSticker(
  id: string,
  packId: string,
  imageFileName: string,
  emojis: string,
  sortOrder: number
): Promise<void> {
  await getDrizzle().insert(stickers).values({
    id,
    packId,
    imageFileName,
    emojis,
    sortOrder
  })
}

export async function getStickersForPack(packId: string): Promise<Sticker[]> {
  return getDrizzle()
    .select()
    .from(stickers)
    .where(eq(stickers.packId, packId))
    .orderBy(asc(stickers.sortOrder))
}

export async function getStickerCountForPack(packId: string): Promise<number> {
  const result = await getDrizzle()
    .select({ count: count() })
    .from(stickers)
    .where(eq(stickers.packId, packId))

  return result[0]?.count ?? 0
}

export async function deleteSticker(id: string): Promise<void> {
  await getDrizzle().delete(stickers).where(eq(stickers.id, id))
}

export async function getAllStickers(): Promise<Sticker[]> {
  return getDrizzle()
    .select()
    .from(stickers)
    .orderBy(asc(stickers.sortOrder))
}
