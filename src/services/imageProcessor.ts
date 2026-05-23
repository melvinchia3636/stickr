import { Platform } from 'react-native'

import { getSetting } from '@/database/repositories'
import type { ConvertResult } from '@/types'
import {
  arrayBufferToBase64,
  getWebPMetadata,
  isStickerWhatsAppCompliant
} from '@/utils/image'
import RNFS from 'react-native-fs'

import { getStickerPath } from './stickerFileManager'

async function getApiBaseUrl(): Promise<string> {
  const customUrl = await getSetting('server_host_url', '')

  if (customUrl) {
    return customUrl
  }

  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL
  }

  if (__DEV__) {
    return Platform.OS === 'android'
      ? 'http://10.0.2.2:3000'
      : 'http://localhost:3000'
  }

  return 'http://10.0.2.2:3000'
}

const TRAY_FILE_NAME = 'tray_icon.png'

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = 30000
): Promise<Response> {
  const controller = new AbortController()

  const id = setTimeout(() => {
    controller.abort()
  }, timeoutMs)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })

    clearTimeout(id)

    return response
  } catch (error: unknown) {
    clearTimeout(id)
    throw error
  }
}

export async function isServerHealthy(): Promise<boolean> {
  const SERVER_URL = await getApiBaseUrl()

  console.log(
    `[ImageProcessor] isServerHealthy() checking server at: ${SERVER_URL}/api/health`
  )

  try {
    const response = await fetchWithTimeout(
      `${SERVER_URL}/api/health`,
      { method: 'GET' },
      3000
    )

    console.log(
      `[ImageProcessor] isServerHealthy() response status: ${response.status}`
    )

    return response.ok
  } catch (err: any) {
    console.log(
      `[ImageProcessor] isServerHealthy() request failed: ${err.message || err}`
    )

    return false
  }
}

export async function convertToStickerWebP(
  sourceUri: string,
  identifier: string,
  fileName: string,
  forceAnimated?: boolean
): Promise<ConvertResult> {
  const SERVER_URL = await getApiBaseUrl()

  const outputPath = getStickerPath(identifier, fileName)

  console.log(
    `[ImageProcessor] convertToStickerWebP() sourceUri=${sourceUri} forceAnimated=${forceAnimated} outputPath=${outputPath}`
  )

  if (sourceUri.startsWith('http://') || sourceUri.startsWith('https://')) {
    console.log(
      `[ImageProcessor] convertToStickerWebP() remote URL, posting to server...`
    )

    try {
      const response = await fetchWithTimeout(
        `${SERVER_URL}/api/convert`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: sourceUri,
            animated: forceAnimated
          })
        },
        30000
      )

      console.log(
        `[ImageProcessor] convertToStickerWebP() remote response: ok=${response.ok} status=${response.status}`
      )

      if (!response.ok) {
        return {
          success: false,
          width: 0,
          height: 0,
          size: 0
        }
      }

      const buffer = await response.arrayBuffer()

      const fileSize = Number(
        response.headers.get('X-File-Size') || buffer.byteLength
      )

      await RNFS.writeFile(outputPath, arrayBufferToBase64(buffer), 'base64')

      console.log(
        `[ImageProcessor] convertToStickerWebP() remote success, size=${fileSize} bytes`
      )

      return {
        success: true,
        width: 512,
        height: 512,
        size: fileSize
      }
    } catch (err: any) {
      console.log(
        `[ImageProcessor] convertToStickerWebP() remote error: ${err.message || err}`
      )

      return {
        success: false,
        width: 0,
        height: 0,
        size: 0
      }
    }
  }

  const cleanUri = sourceUri.replace('file://', '')

  console.log(
    `[ImageProcessor] convertToStickerWebP() local file, reading base64 cleanUri=${cleanUri}`
  )

  const base64Data = await RNFS.readFile(cleanUri, 'base64')

  console.log(
    `[ImageProcessor] convertToStickerWebP() read base64: ${base64Data.length} chars. Posting to server...`
  )

  try {
    const response = await fetchWithTimeout(
      `${SERVER_URL}/api/convert`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fileData: base64Data, animated: forceAnimated })
      },
      30000
    )

    console.log(
      `[ImageProcessor] convertToStickerWebP() post conversion response: ok=${response.ok} status=${response.status}`
    )

    if (!response.ok) {
      return {
        success: false,
        width: 0,
        height: 0,
        size: 0
      }
    }

    const buffer = await response.arrayBuffer()

    const fileSize = Number(
      response.headers.get('X-File-Size') || buffer.byteLength
    )

    await RNFS.writeFile(outputPath, arrayBufferToBase64(buffer), 'base64')

    console.log(
      `[ImageProcessor] convertToStickerWebP() file written, size=${fileSize} bytes`
    )

    return {
      success: true,
      width: 512,
      height: 512,
      size: fileSize
    }
  } catch (err: any) {
    console.log(
      `[ImageProcessor] convertToStickerWebP() local error: ${err.message || err}`
    )
  }

  return {
    success: false,
    width: 0,
    height: 0,
    size: 0
  }
}

export async function generateTrayIcon(
  sourceUri: string,
  identifier: string
): Promise<ConvertResult> {
  const SERVER_URL = await getApiBaseUrl()

  const outputPath = getStickerPath(identifier, TRAY_FILE_NAME)

  console.log(
    `[ImageProcessor] generateTrayIcon() sourceUri=${sourceUri} outputPath=${outputPath}`
  )

  if (sourceUri.startsWith('http://') || sourceUri.startsWith('https://')) {
    console.log(
      `[ImageProcessor] generateTrayIcon() remote URL, posting to server...`
    )

    try {
      const response = await fetchWithTimeout(
        `${SERVER_URL}/api/tray`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: sourceUri })
        },
        30000
      )

      console.log(
        `[ImageProcessor] generateTrayIcon() remote response: ok=${response.ok} status=${response.status}`
      )

      if (!response.ok) {
        return {
          success: false,
          width: 0,
          height: 0,
          size: 0
        }
      }

      const buffer = await response.arrayBuffer()

      const fileSize = Number(
        response.headers.get('X-File-Size') || buffer.byteLength
      )

      await RNFS.writeFile(outputPath, arrayBufferToBase64(buffer), 'base64')

      console.log(
        `[ImageProcessor] generateTrayIcon() remote success, size=${fileSize} bytes`
      )

      return {
        success: true,
        width: 96,
        height: 96,
        size: fileSize
      }
    } catch (err: any) {
      console.log(
        `[ImageProcessor] generateTrayIcon() remote error: ${err.message || err}`
      )

      return {
        success: false,
        width: 0,
        height: 0,
        size: 0
      }
    }
  }

  const cleanUri = sourceUri.replace('file://', '')

  console.log(
    `[ImageProcessor] generateTrayIcon() local file, reading base64 cleanUri=${cleanUri}`
  )

  const base64Data = await RNFS.readFile(cleanUri, 'base64')

  try {
    const response = await fetchWithTimeout(
      `${SERVER_URL}/api/tray`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fileData: base64Data })
      },
      30000
    )

    console.log(
      `[ImageProcessor] generateTrayIcon() post tray response: ok=${response.ok} status=${response.status}`
    )

    if (!response.ok) {
      return {
        success: false,
        width: 0,
        height: 0,
        size: 0
      }
    }

    const buffer = await response.arrayBuffer()

    const fileSize = Number(
      response.headers.get('X-File-Size') || buffer.byteLength
    )

    await RNFS.writeFile(outputPath, arrayBufferToBase64(buffer), 'base64')

    console.log(
      `[ImageProcessor] generateTrayIcon() success, size=${fileSize} bytes`
    )

    return {
      success: true,
      width: 96,
      height: 96,
      size: fileSize
    }
  } catch (err: any) {
    console.log(
      `[ImageProcessor] generateTrayIcon() local error: ${err.message || err}`
    )
  }

  return {
    success: false,
    width: 0,
    height: 0,
    size: 0
  }
}

export async function ensureAnimationConsistency(
  identifier: string,
  stickers: { imageFileName: string }[]
): Promise<void> {
  let hasAnimated = false

  console.log(
    `[ImageProcessor] ensureAnimationConsistency() starting check for identifier=${identifier} stickers=${stickers.length}`
  )

  for (const s of stickers) {
    const path = getStickerPath(identifier, s.imageFileName)

    const exists = await RNFS.exists(path)

    if (exists) {
      const meta = await getWebPMetadata(path)

      console.log(
        `[ImageProcessor]   sticker: ${s.imageFileName} exists=true isAnim=${meta.isAnimated} loopCount=${meta.loopCount} frameCount=${meta.frameCount} hasAnimChunk=${meta.hasAnimChunk} hasNonZeroOffsets=${meta.hasNonZeroOffsets} hasNon512Frame=${meta.hasNon512Frame} dimensions=${meta.width}x${meta.height} size=${(meta.fileSize / 1024).toFixed(2)}KB`
      )

      if (meta.isAnimated) {
        hasAnimated = true
      }
    } else {
      console.log(`[ImageProcessor]   sticker: ${s.imageFileName} exists=false`)
    }
  }

  console.log(
    `[ImageProcessor] ensureAnimationConsistency() finished check. hasAnimated=${hasAnimated}`
  )

  for (const s of stickers) {
    const path = getStickerPath(identifier, s.imageFileName)

    const exists = await RNFS.exists(path)

    if (exists) {
      const compliant = await isStickerWhatsAppCompliant(path, hasAnimated)

      if (!compliant) {
        const tempUri = `file://${path}`

        console.log(
          `[ImageProcessor]   converting non-compliant sticker to ${hasAnimated ? 'animated' : 'static'} WebP: ${s.imageFileName}`
        )

        await convertToStickerWebP(
          tempUri,
          identifier,
          s.imageFileName,
          hasAnimated
        )
      }
    }
  }
}

export { TRAY_FILE_NAME }
