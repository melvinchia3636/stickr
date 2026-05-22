import { Platform } from 'react-native'

import { getSetting } from '@/database/repositories'
import type { ConvertResult } from '@/types'
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

export async function convertToStickerWebP(
  sourceUri: string,
  identifier: string,
  fileName: string
): Promise<ConvertResult> {
  const SERVER_URL = await getApiBaseUrl()

  const outputPath = getStickerPath(identifier, fileName)

  if (sourceUri.startsWith('http://') || sourceUri.startsWith('https://')) {
    const apiQuery = `${SERVER_URL}/api/convert?url=${encodeURIComponent(sourceUri)}`

    const downloadJob = RNFS.downloadFile({
      fromUrl: apiQuery,
      toFile: outputPath
    })

    let timerId: ReturnType<typeof setTimeout> | null = null

    const timeoutPromise = new Promise<never>((_, reject) => {
      timerId = setTimeout(() => {
        RNFS.stopDownload(downloadJob.jobId)
        reject(new Error('Request timeout'))
      }, 30000)
    })

    try {
      const downloadResult = await Promise.race([
        downloadJob.promise,
        timeoutPromise
      ])

      if (timerId) {
        clearTimeout(timerId)
      }

      if (downloadResult.statusCode !== 200) {
        return {
          success: false,
          width: 0,
          height: 0,
          size: 0
        }
      }

      const stats = await RNFS.stat(outputPath)

      return {
        success: true,
        width: 512,
        height: 512,
        size: Number(stats.size)
      }
    } catch {
      if (timerId) {
        clearTimeout(timerId)
      }

      return {
        success: false,
        width: 0,
        height: 0,
        size: 0
      }
    }
  }

  const cleanUri = sourceUri.replace('file://', '')

  const base64Data = await RNFS.readFile(cleanUri, 'base64')

  try {
    const response = await fetchWithTimeout(
      `${SERVER_URL}/api/convert`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fileData: base64Data })
      },
      30000
    )

    if (!response.ok) {
      return {
        success: false,
        width: 0,
        height: 0,
        size: 0
      }
    }

    const result = await response.json()

    if (result.success && result.base64) {
      await RNFS.writeFile(outputPath, result.base64, 'base64')

      return {
        success: true,
        width: 512,
        height: 512,
        size: result.size || 0
      }
    }
  } catch {
    // Timeout or network error
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

  if (sourceUri.startsWith('http://') || sourceUri.startsWith('https://')) {
    const apiQuery = `${SERVER_URL}/api/tray?url=${encodeURIComponent(sourceUri)}`

    const downloadJob = RNFS.downloadFile({
      fromUrl: apiQuery,
      toFile: outputPath
    })

    let timerId: ReturnType<typeof setTimeout> | null = null

    const timeoutPromise = new Promise<never>((_, reject) => {
      timerId = setTimeout(() => {
        RNFS.stopDownload(downloadJob.jobId)
        reject(new Error('Request timeout'))
      }, 30000)
    })

    try {
      const downloadResult = await Promise.race([
        downloadJob.promise,
        timeoutPromise
      ])

      if (timerId) {
        clearTimeout(timerId)
      }

      if (downloadResult.statusCode !== 200) {
        return {
          success: false,
          width: 0,
          height: 0,
          size: 0
        }
      }

      const stats = await RNFS.stat(outputPath)

      return {
        success: true,
        width: 96,
        height: 96,
        size: Number(stats.size)
      }
    } catch {
      if (timerId) {
        clearTimeout(timerId)
      }

      return {
        success: false,
        width: 0,
        height: 0,
        size: 0
      }
    }
  }

  const cleanUri = sourceUri.replace('file://', '')

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

    if (!response.ok) {
      return {
        success: false,
        width: 0,
        height: 0,
        size: 0
      }
    }

    const result = await response.json()

    if (result.success && result.base64) {
      await RNFS.writeFile(outputPath, result.base64, 'base64')

      const stats = await RNFS.stat(outputPath)

      return {
        success: true,
        width: 96,
        height: 96,
        size: Number(stats.size)
      }
    }
  } catch {
    // Timeout or network error
  }

  return {
    success: false,
    width: 0,
    height: 0,
    size: 0
  }
}

export { TRAY_FILE_NAME }
