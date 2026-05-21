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

function decodeBase64(base64: string): Uint8Array {
  const cleaned = base64.replace(/[^A-Za-z0-9+/]/g, '')
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  const lookup = new Uint8Array(256)
  for (let i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i
  }
  let bufferLength = cleaned.length * 0.75
  if (cleaned[cleaned.length - 1] === '=') {
    bufferLength--
    if (cleaned[cleaned.length - 2] === '=') {
      bufferLength--
    }
  }
  const bytes = new Uint8Array(bufferLength)
  let p = 0
  for (let i = 0; i < cleaned.length; i += 4) {
    const base64x = lookup[cleaned.charCodeAt(i)]
    const base64y = lookup[cleaned.charCodeAt(i + 1)]
    const base64z = lookup[cleaned.charCodeAt(i + 2)]
    const base64w = lookup[cleaned.charCodeAt(i + 3)]
    bytes[p++] = (base64x << 2) | (base64y >> 4)
    if (p < bufferLength) bytes[p++] = ((base64y & 15) << 4) | (base64z >> 2)
    if (p < bufferLength) bytes[p++] = ((base64z & 3) << 6) | (base64w & 63)
  }
  return bytes
}

export async function isAnimatedWebP(filePath: string): Promise<boolean> {
  try {
    const base64 = await RNFS.read(filePath, 256, 0, 'base64')
    const bytes = decodeBase64(base64)
    if (bytes.length < 21) return false
    if (
      bytes[0] !== 0x52 || // R
      bytes[1] !== 0x49 || // I
      bytes[2] !== 0x46 || // F
      bytes[3] !== 0x46 || // F
      bytes[8] !== 0x57 || // W
      bytes[9] !== 0x45 || // E
      bytes[10] !== 0x42 || // B
      bytes[11] !== 0x50    // P
    ) {
      return false
    }
    let offset = 12
    while (offset + 8 < bytes.length) {
      const chunkId = String.fromCharCode(
        bytes[offset],
        bytes[offset + 1],
        bytes[offset + 2],
        bytes[offset + 3]
      )
      const chunkSize =
        bytes[offset + 4] |
        (bytes[offset + 5] << 8) |
        (bytes[offset + 6] << 16) |
        (bytes[offset + 7] << 24)
      if (chunkId === 'ANIM' || chunkId === 'ANMF') return true
      if (chunkId === 'VP8X' && chunkSize >= 4 && offset + 8 < bytes.length) {
        const flags = bytes[offset + 8]
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
