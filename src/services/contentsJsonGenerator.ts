import { getPackWithStickers } from '@/database/packRepository'
import RNFS from 'react-native-fs'

import { TRAY_FILE_NAME, generateTrayIcon } from './imageProcessor'
import { getStickerPath, writeContentsJson } from './stickerFileManager'

export async function regenerateContentsJson(packId: string): Promise<void> {
  const pack = await getPackWithStickers(packId)
  if (!pack) {
    throw new Error(`Pack not found: ${packId}`)
  }

  const trayFile = pack.trayImageFile || TRAY_FILE_NAME
  const trayPath = getStickerPath(pack.identifier, trayFile)
  if (!(await RNFS.exists(trayPath)) && pack.stickers.length > 0) {
    const firstStickerPath = getStickerPath(
      pack.identifier,
      pack.stickers[0].imageFileName
    )
    await generateTrayIcon(`file://${firstStickerPath}`, pack.identifier)
  }

  await writeContentsJson(
    pack.identifier,
    pack.name,
    pack.publisher || 'Sticker Creator',
    trayFile,
    pack.stickers.map(s => ({
      imageFileName: s.imageFileName,
      emojis: s.emojis
    }))
  )
}
