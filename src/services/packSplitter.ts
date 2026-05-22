import type { PackWithStickers, Sticker } from '@/types'
import RNFS from 'react-native-fs'

import { TRAY_FILE_NAME, generateTrayIcon } from './imageProcessor'
import {
  ensurePackDir,
  getPackDir,
  getStickerPath,
  writeContentsJson
} from './stickerFileManager'
import {
  addStickerPackToWhatsApp,
  refreshContentProvider
} from './whatsappBridge'

const MAX_STICKERS_PER_PACK = 30

export interface SubPack {
  identifier: string
  label: string
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []

  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }

  return chunks
}

function getSubPackIdentifier(
  parentIdentifier: string,
  partIndex: number
): string {
  return `${parentIdentifier}_part${partIndex + 1}`
}

async function createSubPack(
  pack: PackWithStickers,
  stickers: Sticker[],
  partIndex: number,
  totalParts: number
): Promise<SubPack> {
  const subId = getSubPackIdentifier(pack.identifier, partIndex)

  await ensurePackDir(subId)

  const traySource = getStickerPath(
    pack.identifier,
    pack.trayImageFile || TRAY_FILE_NAME
  )

  const trayDest = getStickerPath(subId, TRAY_FILE_NAME)

  const trayExists = await RNFS.exists(traySource)

  if (trayExists) {
    await RNFS.copyFile(traySource, trayDest)
  } else {
    const firstStickerSrc = getStickerPath(
      pack.identifier,
      stickers[0].imageFileName
    )

    await generateTrayIcon(`file://${firstStickerSrc}`, subId)
  }

  for (const sticker of stickers) {
    const src = getStickerPath(pack.identifier, sticker.imageFileName)

    const dest = getStickerPath(subId, sticker.imageFileName)

    await RNFS.copyFile(src, dest)
  }

  const partLabel = `${pack.name} (${partIndex + 1}/${totalParts})`

  await writeContentsJson(
    subId,
    partLabel,
    pack.publisher || 'Sticker Creator',
    TRAY_FILE_NAME,
    stickers.map(s => ({
      imageFileName: s.imageFileName,
      emojis: s.emojis
    }))
  )

  return { identifier: subId, label: partLabel }
}

export async function prepareSubPacks(
  pack: PackWithStickers
): Promise<SubPack[]> {
  const stickersBaseDir = `${RNFS.DocumentDirectoryPath}/stickers`

  const allDirs = await RNFS.readDir(stickersBaseDir)

  for (const dir of allDirs) {
    if (!dir.isDirectory()) continue

    if (dir.name.includes('_part')) {
      await RNFS.unlink(dir.path)
    } else {
      const contentsPath = `${dir.path}/contents.json`

      if (await RNFS.exists(contentsPath)) {
        try {
          const raw = await RNFS.readFile(contentsPath, 'utf8')

          const parsed = JSON.parse(raw)

          const trayFile = parsed.sticker_packs?.[0]?.tray_image_file

          if (trayFile) {
            const trayPath = `${dir.path}/${trayFile}`

            if (!(await RNFS.exists(trayPath))) {
              await RNFS.unlink(contentsPath)
            }
          }
        } catch {
          await RNFS.unlink(contentsPath)
        }
      }
    }
  }

  const chunks = chunkArray(pack.stickers, MAX_STICKERS_PER_PACK)

  const subPacks: SubPack[] = []

  for (let i = 0; i < chunks.length; i++) {
    const subPack = await createSubPack(pack, chunks[i], i, chunks.length)

    subPacks.push(subPack)
  }

  const parentContentsJson = `${getPackDir(pack.identifier)}/contents.json`

  const parentExists = await RNFS.exists(parentContentsJson)

  if (parentExists) {
    await RNFS.unlink(parentContentsJson)
  }

  await refreshContentProvider()

  return subPacks
}

export async function addSubPackToWhatsApp(subPack: SubPack): Promise<void> {
  await addStickerPackToWhatsApp(subPack.identifier, subPack.label)
}

export async function addPackToWhatsApp(pack: PackWithStickers): Promise<void> {
  if (pack.stickers.length <= MAX_STICKERS_PER_PACK) {
    await addStickerPackToWhatsApp(pack.identifier, pack.name)

    return
  }

  const subPacks = await prepareSubPacks(pack)

  await addSubPackToWhatsApp(subPacks[0])
}

export function needsSplitting(stickerCount: number): boolean {
  return stickerCount > MAX_STICKERS_PER_PACK
}

export function getPartCount(stickerCount: number): number {
  return Math.ceil(stickerCount / MAX_STICKERS_PER_PACK)
}
