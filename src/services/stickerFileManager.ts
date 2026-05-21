import { Platform } from 'react-native'

import type { Sticker, StickerPack } from '@/types'
import RNFS from 'react-native-fs'

const STICKERS_DIR = `${RNFS.DocumentDirectoryPath}/stickers`

export async function ensureStickersDir(): Promise<void> {
  const exists = await RNFS.exists(STICKERS_DIR)
  if (!exists) {
    await RNFS.mkdir(STICKERS_DIR)
  }
}

export function getPackDir(identifier: string): string {
  return `${STICKERS_DIR}/${identifier}`
}

export function getStickerPath(identifier: string, fileName: string): string {
  return `${getPackDir(identifier)}/${fileName}`
}

export function getContentsJsonPath(identifier: string): string {
  return `${getPackDir(identifier)}/contents.json`
}

export async function ensurePackDir(identifier: string): Promise<void> {
  const dir = getPackDir(identifier)
  const exists = await RNFS.exists(dir)
  if (!exists) {
    await RNFS.mkdir(dir)
  }
}

export async function copyImageToPack(
  identifier: string,
  sourceUri: string,
  fileName: string
): Promise<string> {
  await ensurePackDir(identifier)
  const destPath = getStickerPath(identifier, fileName)

  const sourcePath =
    Platform.OS === 'android' ? sourceUri.replace('file://', '') : sourceUri
  await RNFS.copyFile(sourcePath, destPath)

  return destPath
}

export async function isAnimatedWebP(filePath: string): Promise<boolean> {
  try {
    const base64 = await RNFS.read(filePath, 256, 0, 'base64')
    const binary = atob(base64)
    if (binary.length < 21) return false
    if (binary.substring(0, 4) !== 'RIFF' || binary.substring(8, 12) !== 'WEBP')
      return false

    let offset = 12
    while (offset + 8 < binary.length) {
      const chunkId = binary.substring(offset, offset + 4)
      const chunkSize =
        binary.charCodeAt(offset + 4) |
        (binary.charCodeAt(offset + 5) << 8) |
        (binary.charCodeAt(offset + 6) << 16) |
        (binary.charCodeAt(offset + 7) << 24)

      if (chunkId === 'ANIM' || chunkId === 'ANMF') return true
      if (chunkId === 'VP8X' && chunkSize >= 4 && offset + 8 < binary.length) {
        const flags = binary.charCodeAt(offset + 8)
        if (flags & 0x02) return true
      }
      offset += 8 + chunkSize + (chunkSize % 2)
    }
  } catch {}
  return false
}

export async function hasAnimatedStickers(
  identifier: string,
  stickers: { imageFileName: string }[]
): Promise<boolean> {
  for (const s of stickers) {
    const path = getStickerPath(identifier, s.imageFileName)
    if (await isAnimatedWebP(path)) return true
  }
  return false
}

export async function writeContentsJson(
  identifier: string,
  packName: string,
  publisher: string,
  trayImageFile: string | null,
  stickers: { imageFileName: string; emojis: string }[],
  animated?: boolean
): Promise<void> {
  const isAnimated =
    animated ?? (await hasAnimatedStickers(identifier, stickers))

  const contents = {
    android_play_store_link: '',
    ios_app_store_link: '',
    sticker_packs: [
      {
        identifier,
        name: packName,
        publisher,
        tray_image_file: trayImageFile || 'tray_icon.png',
        image_data_version: '1',
        avoid_cache: false,
        animated_sticker_pack: isAnimated,
        stickers: stickers.map(s => ({
          image_file: s.imageFileName,
          emojis: s.emojis ? s.emojis.split(',').filter(Boolean) : [],
          accessibility_text: ''
        }))
      }
    ]
  }

  const jsonPath = getContentsJsonPath(identifier)
  await RNFS.writeFile(jsonPath, JSON.stringify(contents, null, 2), 'utf8')
}

export async function packDirExists(identifier: string): Promise<boolean> {
  return await RNFS.exists(getPackDir(identifier))
}

export async function deletePackDir(identifier: string): Promise<void> {
  const dir = getPackDir(identifier)
  const exists = await RNFS.exists(dir)
  if (exists) {
    await RNFS.unlink(dir)
  }
}

export async function deleteStickerFile(
  identifier: string,
  fileName: string
): Promise<void> {
  const path = getStickerPath(identifier, fileName)
  const exists = await RNFS.exists(path)
  if (exists) {
    await RNFS.unlink(path)
  }
}

export async function getStickerBase64(
  identifier: string,
  fileName: string
): Promise<string> {
  const path = getStickerPath(identifier, fileName)
  return await RNFS.readFile(path, 'base64')
}
