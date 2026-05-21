import { v4 as uuid } from 'uuid'
import 'react-native-get-random-values'
import { parse as parseHTML } from 'node-html-parser'
import RNFS from 'react-native-fs'

import { addSticker, createPack } from '@/database/packRepository'
import { regenerateContentsJson } from '@/services/contentsJsonGenerator'
import { TRAY_FILE_NAME, convertToStickerWebP, generateTrayIcon } from '@/services/imageProcessor'
import { ensureStickersDir } from '@/services/stickerFileManager'
import { refreshContentProvider } from '@/services/whatsappBridge'

export interface SigStickSearchResult {
  id: string
  title: string
  thumbnail: string
}

export interface SigStickPack {
  id: string
  title: string
  coverUrl: string | null
  stickers: string[]
}

export function fullyDecodeURIComponent(str: string): string {
  let current = str
  while (true) {
    try {
      const decoded = decodeURIComponent(current)
      if (decoded === current) {
        break
      }
      current = decoded
    } catch {
      break
    }
  }
  return current
}

export async function searchStickerPacks(
  keyword: string
): Promise<SigStickSearchResult[]> {
  const url = `https://www.sigstick.com/stickers?keyword=${encodeURIComponent(keyword)}`
  const response = await fetch(url)
  const text = await response.text()

  const doc = parseHTML(text)
  const links = doc.querySelectorAll('a[class*="PackItem_stickerPack"]')
  const results: SigStickSearchResult[] = []

  for (const link of links) {
    const href = link.getAttribute('href') || ''
    const rawId = href.split('/').pop() || ''
    const id = fullyDecodeURIComponent(rawId)
    const img = link.querySelector('img')
    const thumbnail = img?.getAttribute('src') || ''
    const titleEl = link.querySelector('.text-blue-500')
    const title = titleEl?.textContent?.trim() || `Pack ${id}`
    results.push({ id, title, thumbnail })
  }

  return results
}

function cleanSigStickUrl(url: string): string {
  if (!url) return url
  return url
    .replace(/\.thumb\d+\.png/g, '.png')
    .replace(/\.thumb\d+\.webp/g, '.webp')
    .replace(/\.thumb\d+\.gif/g, '.gif')
    .replace(/\.thumb\.png/g, '.png')
    .replace(/\.thumb\.webp/g, '.webp')
    .replace(/\.thumb\.gif/g, '.gif')
}

export async function getStickerPackDetail(id: string): Promise<SigStickPack> {
  const url = `https://www.sigstick.com/pack/${id}`
  const response = await fetch(url)
  const text = await response.text()

  const doc = parseHTML(text)
  const script = doc.querySelector('script#__NEXT_DATA__')
  if (!script?.textContent) {
    throw new Error('Failed to parse sticker pack data')
  }

  const data = JSON.parse(script.textContent)
  const pack = data.props?.pageProps?.pack
  if (!pack) {
    throw new Error('Invalid sticker pack data')
  }

  const coverImg = doc.querySelector('img[alt="Sticker pack cover"]')
  const coverUrl = coverImg?.getAttribute('src') || null

  return {
    id,
    title: pack.title || 'Unknown Pack',
    coverUrl: coverUrl ? cleanSigStickUrl(coverUrl) : null,
    stickers: (pack.stickers || []).map((s: { url: string }) => cleanSigStickUrl(s.url))
  }
}

export async function downloadStickerToFile(
  imageUrl: string,
  destPath: string
): Promise<string> {
  const result = await RNFS.downloadFile({
    fromUrl: imageUrl,
    toFile: destPath
  }).promise

  if (result.statusCode !== 200) {
    throw new Error(`Failed to download sticker: status ${result.statusCode}`)
  }

  return destPath
}

export async function downloadSigStickPack(
  packTitle: string,
  stickerUrls: string[],
  coverUrl: string | null,
  sigstickId: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  const identifier = uuid()
  await ensureStickersDir()
  const stickerDir = `${RNFS.DocumentDirectoryPath}/stickers/${identifier}`
  await RNFS.mkdir(stickerDir)
  await createPack(packTitle || 'SigStick Pack', identifier, TRAY_FILE_NAME, sigstickId)

  for (let i = 0; i < stickerUrls.length; i++) {
    const fileName = `sticker_${String(i + 1).padStart(3, '0')}.webp`
    const tmpPath = `${stickerDir}/tmp_${fileName}`
    await downloadStickerToFile(stickerUrls[i]!, tmpPath)
    await convertToStickerWebP(`file://${tmpPath}`, identifier, fileName)
    await RNFS.unlink(tmpPath)
    await addSticker(uuid(), identifier, fileName, '', i + 1)
    onProgress?.(i + 1)
  }

  if (coverUrl) {
    const coverTmpPath = `${stickerDir}/cover_tmp.webp`
    await downloadStickerToFile(coverUrl, coverTmpPath)
    await generateTrayIcon(`file://${coverTmpPath}`, identifier)
    await RNFS.unlink(coverTmpPath)
  } else {
    await generateTrayIcon(`file://${stickerDir}/sticker_001.webp`, identifier)
  }

  await regenerateContentsJson(identifier)
  await refreshContentProvider()

  return identifier
}
