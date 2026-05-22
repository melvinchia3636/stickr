import type { PackWithStickers, StickerPack } from '@/types'
import { desc, eq } from 'drizzle-orm'

import { getDrizzle } from '../init'
import { stickerPacks } from '../schema'
import { getStickersForPack } from './stickerRepository'

export async function getAllPacks(): Promise<StickerPack[]> {
  return getDrizzle()
    .select()
    .from(stickerPacks)
    .orderBy(desc(stickerPacks.updatedAt))
}

export async function getPackWithStickers(
  id: string
): Promise<PackWithStickers | null> {
  const rows = await getDrizzle()
    .select()
    .from(stickerPacks)
    .where(eq(stickerPacks.id, id))

  const pack = rows.length > 0 ? rows[0] : null

  if (!pack) return null

  const stickers = await getStickersForPack(id)

  return { ...pack, stickers }
}

export async function getPackWithStickersBySigstickId(
  sigstickId: string
): Promise<PackWithStickers | null> {
  const rows = await getDrizzle()
    .select()
    .from(stickerPacks)
    .where(eq(stickerPacks.sigstickId, sigstickId))

  if (rows.length === 0) return null

  const pack = rows[0]

  const stickers = await getStickersForPack(pack.id)

  return { ...pack, stickers }
}

export async function createPack(
  name: string,
  identifier: string,
  trayImageFile: string | null,
  sigstickId?: string | null
): Promise<void> {
  await getDrizzle()
    .insert(stickerPacks)
    .values({
      id: identifier,
      name,
      identifier,
      trayImageFile,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      sigstickId: sigstickId || null
    })
}

export async function updatePackName(id: string, name: string): Promise<void> {
  await getDrizzle()
    .update(stickerPacks)
    .set({
      name,
      updatedAt: Date.now()
    })
    .where(eq(stickerPacks.id, id))
}

export async function deletePack(id: string): Promise<void> {
  await getDrizzle().delete(stickerPacks).where(eq(stickerPacks.id, id))
}
