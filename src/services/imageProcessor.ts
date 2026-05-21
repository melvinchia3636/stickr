import { Platform } from 'react-native'
import RNFS from 'react-native-fs'

import type { ConvertResult } from '@/types'
import { getSetting } from '@/database/packRepository'

import { getStickerPath } from './stickerFileManager'

function getApiBaseUrl(): string {
  const customUrl = getSetting('server_host_url', '')
  if (customUrl) {
    return customUrl
  }
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL
  }
  if (__DEV__) {
    return Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000'
  }
  return 'http://10.0.2.2:3000'
}

const TRAY_FILE_NAME = 'tray_icon.png'

export async function convertToStickerWebP(
  sourceUri: string,
  identifier: string,
  fileName: string
): Promise<ConvertResult> {
  const SERVER_URL = getApiBaseUrl()
  const outputPath = getStickerPath(identifier, fileName)

  if (sourceUri.startsWith('http://') || sourceUri.startsWith('https://')) {
    const apiQuery = `${SERVER_URL}/api/convert?url=${encodeURIComponent(sourceUri)}`
    const downloadResult = await RNFS.downloadFile({
      fromUrl: apiQuery,
      toFile: outputPath
    }).promise

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
  }

  const cleanUri = sourceUri.replace('file://', '')
  const base64Data = await RNFS.readFile(cleanUri, 'base64')
  
  const response = await fetch(`${SERVER_URL}/api/convert`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fileData: base64Data })
  })

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
  const SERVER_URL = getApiBaseUrl()
  const outputPath = getStickerPath(identifier, TRAY_FILE_NAME)

  if (sourceUri.startsWith('http://') || sourceUri.startsWith('https://')) {
    const apiQuery = `${SERVER_URL}/api/tray?url=${encodeURIComponent(sourceUri)}`
    const downloadResult = await RNFS.downloadFile({
      fromUrl: apiQuery,
      toFile: outputPath
    }).promise

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
  }

  const cleanUri = sourceUri.replace('file://', '')
  const base64Data = await RNFS.readFile(cleanUri, 'base64')

  const response = await fetch(`${SERVER_URL}/api/tray`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fileData: base64Data })
  })

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

  return {
    success: false,
    width: 0,
    height: 0,
    size: 0
  }
}

export { TRAY_FILE_NAME }


