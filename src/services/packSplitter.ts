import type { PackWithStickers, Sticker } from '@/types'
import RNFS from 'react-native-fs'

import {
  TRAY_FILE_NAME,
  ensureAnimationConsistency,
  generateTrayIcon
} from './imageProcessor'
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

export interface SubPack {
  identifier: string
  label: string
}

export let pendingSubPacksGlobal: SubPack[] = []

export let lastAttemptedIndexGlobal: number = -1

export function setPendingSubPacksGlobal(subPacks: SubPack[]): void {
  pendingSubPacksGlobal = subPacks
}

export function setLastAttemptedIndexGlobal(index: number): void {
  lastAttemptedIndexGlobal = index
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

    await RNFS.stat(trayDest)
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

  const subDir = getPackDir(subId)

  await RNFS.readDir(subDir)

  return { identifier: subId, label: partLabel }
}

export async function prepareSubPacks(
  pack: PackWithStickers
): Promise<SubPack[]> {
  await ensureAnimationConsistency(pack.identifier, pack.stickers)

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

  const chunks = pack.stickers.reduce<PackWithStickers['stickers'][]>(
    (chunks, item, index) => {
      if (index % 30 === 0) {
        chunks.push([item])
      } else {
        chunks[chunks.length - 1].push(item)
      }

      return chunks
    },
    []
  )

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
  if (pack.stickers.length <= 30) {
    await addStickerPackToWhatsApp(pack.identifier, pack.name)

    return
  }

  const subPacks = await prepareSubPacks(pack)

  pendingSubPacksGlobal = subPacks.slice(1)
  lastAttemptedIndexGlobal = 0

  await addSubPackToWhatsApp(subPacks[0])
}
