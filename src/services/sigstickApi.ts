import { parse as parseHTML } from 'node-html-parser'
import RNFS from 'react-native-fs'

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
    const id = href.split('/').pop() || ''
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
