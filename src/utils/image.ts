import base64 from 'base-64'
import RNFS from 'react-native-fs'

export async function isAnimatedWebP(filePath: string): Promise<boolean> {
  try {
    const base64Str = await RNFS.read(filePath, 256, 0, 'base64')

    const bytes = Uint8Array.from(base64.decode(base64Str), function (char) {
      return char.charCodeAt(0)
    })

    if (bytes.length < 21) {
      return false
    }

    if (
      bytes[0] !== 0x52 || // R
      bytes[1] !== 0x49 || // I
      bytes[2] !== 0x46 || // F
      bytes[3] !== 0x46 || // F
      bytes[8] !== 0x57 || // W
      bytes[9] !== 0x45 || // E
      bytes[10] !== 0x42 || // B
      bytes[11] !== 0x50 // P
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

      if (chunkId === 'ANIM' || chunkId === 'ANMF') {
        return true
      }

      if (chunkId === 'VP8X' && chunkSize >= 4 && offset + 8 < bytes.length) {
        const flags = bytes[offset + 8]

        if (flags & 0x02) {
          return true
        }
      }

      offset += 8 + chunkSize + (chunkSize % 2)
    }
  } catch {}

  return false
}

export async function isAnimatedWebPAndLoop0(
  filePath: string
): Promise<boolean> {
  try {
    const base64Str = await RNFS.read(filePath, 256, 0, 'base64')

    const bytes = Uint8Array.from(base64.decode(base64Str), function (char) {
      return char.charCodeAt(0)
    })

    if (bytes.length < 21) {
      return false
    }

    if (
      bytes[0] !== 0x52 ||
      bytes[1] !== 0x49 ||
      bytes[2] !== 0x46 ||
      bytes[3] !== 0x46 ||
      bytes[8] !== 0x57 ||
      bytes[9] !== 0x45 ||
      bytes[10] !== 0x42 ||
      bytes[11] !== 0x50
    ) {
      return false
    }

    let offset = 12
    let hasAnimChunk = false
    let isAnimatedFromFlags = false
    let loopCount = -1

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

      if (chunkId === 'ANIM') {
        hasAnimChunk = true

        if (offset + 13 < bytes.length) {
          loopCount = bytes[offset + 12] | (bytes[offset + 13] << 8)
        }
      }

      if (chunkId === 'ANMF') {
        isAnimatedFromFlags = true
      }

      if (chunkId === 'VP8X' && chunkSize >= 4 && offset + 8 < bytes.length) {
        const flags = bytes[offset + 8]

        if (flags & 0x02) {
          isAnimatedFromFlags = true
        }
      }

      offset += 8 + chunkSize + (chunkSize % 2)
    }

    if (hasAnimChunk) {
      return loopCount === 0
    }

    return isAnimatedFromFlags && loopCount === 0
  } catch {
    return false
  }
}

export interface WebPMetadata {
  width: number
  height: number
  isAnimated: boolean
  loopCount: number
  hasAnimChunk: boolean
  fileSize: number
  frameCount: number
  hasNonZeroOffsets: boolean
  hasNon512Frame: boolean
}

export async function getWebPMetadata(filePath: string): Promise<WebPMetadata> {
  const result: WebPMetadata = {
    width: -1,
    height: -1,
    isAnimated: false,
    loopCount: -1,
    hasAnimChunk: false,
    fileSize: 0,
    frameCount: 0,
    hasNonZeroOffsets: false,
    hasNon512Frame: false
  }

  try {
    const stats = await RNFS.stat(filePath)

    result.fileSize = stats.size

    const base64Str = await RNFS.readFile(filePath, 'base64')

    const bytes = Uint8Array.from(base64.decode(base64Str), function (char) {
      return char.charCodeAt(0)
    })

    if (bytes.length < 21) {
      return result
    }

    if (
      bytes[0] !== 0x52 ||
      bytes[1] !== 0x49 ||
      bytes[2] !== 0x46 ||
      bytes[3] !== 0x46 ||
      bytes[8] !== 0x57 ||
      bytes[9] !== 0x45 ||
      bytes[10] !== 0x42 ||
      bytes[11] !== 0x50
    ) {
      return result
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

      if (chunkId === 'ANIM') {
        result.hasAnimChunk = true
        result.isAnimated = true

        if (offset + 13 < bytes.length) {
          result.loopCount = bytes[offset + 12] | (bytes[offset + 13] << 8)
        }
      }

      if (chunkId === 'ANMF') {
        result.isAnimated = true
        result.frameCount++

        if (offset + 20 < bytes.length) {
          const xOffset =
            bytes[offset + 8] |
            (bytes[offset + 9] << 8) |
            (bytes[offset + 10] << 16)

          const yOffset =
            bytes[offset + 11] |
            (bytes[offset + 12] << 8) |
            (bytes[offset + 13] << 16)

          const frameWidth =
            1 +
            (bytes[offset + 14] |
              (bytes[offset + 15] << 8) |
              (bytes[offset + 16] << 16))

          const frameHeight =
            1 +
            (bytes[offset + 17] |
              (bytes[offset + 18] << 8) |
              (bytes[offset + 19] << 16))

          if (xOffset !== 0 || yOffset !== 0) {
            result.hasNonZeroOffsets = true
          }

          if (frameWidth !== 512 || frameHeight !== 512) {
            result.hasNon512Frame = true
          }
        }
      }

      if (chunkId === 'VP8X' && chunkSize >= 10 && offset + 17 < bytes.length) {
        const flags = bytes[offset + 8]

        if (flags & 0x02) {
          result.isAnimated = true
        }

        result.width =
          1 +
          (bytes[offset + 12] |
            (bytes[offset + 13] << 8) |
            (bytes[offset + 14] << 16))

        result.height =
          1 +
          (bytes[offset + 15] |
            (bytes[offset + 16] << 8) |
            (bytes[offset + 17] << 16))
      }

      if (chunkId === 'VP8 ' && chunkSize >= 10 && offset + 17 < bytes.length) {
        const payloadOffset = offset + 8

        if (
          bytes[payloadOffset + 3] === 0x9d &&
          bytes[payloadOffset + 4] === 0x01 &&
          bytes[payloadOffset + 5] === 0x2a
        ) {
          result.width =
            (bytes[payloadOffset + 6] | (bytes[payloadOffset + 7] << 8)) &
            0x3fff
          result.height =
            (bytes[payloadOffset + 8] | (bytes[payloadOffset + 9] << 8)) &
            0x3fff
        }
      }

      if (chunkId === 'VP8L' && chunkSize >= 5 && offset + 12 < bytes.length) {
        const payloadOffset = offset + 8

        if (bytes[payloadOffset] === 0x2f) {
          const val =
            bytes[payloadOffset + 1] |
            (bytes[payloadOffset + 2] << 8) |
            (bytes[payloadOffset + 3] << 16) |
            (bytes[payloadOffset + 4] << 24)

          result.width = 1 + (val & 0x3fff)
          result.height = 1 + ((val >> 14) & 0x3fff)
        }
      }

      offset += 8 + chunkSize + (chunkSize % 2)
    }

    if (!result.isAnimated) {
      result.frameCount = 1
    }
  } catch {}

  return result
}

export async function isStickerWhatsAppCompliant(
  filePath: string,
  expectsAnimated: boolean
): Promise<boolean> {
  try {
    const meta = await getWebPMetadata(filePath)

    if (meta.width !== 512 || meta.height !== 512) {
      return false
    }

    if (expectsAnimated) {
      if (!meta.isAnimated) return false
      if (meta.frameCount < 2) return false
      if (meta.loopCount !== 0) return false
      if (meta.hasNonZeroOffsets) return false
      if (meta.hasNon512Frame) return false
      if (meta.fileSize > 500 * 1024) return false
    } else {
      if (meta.isAnimated) return false
      if (meta.fileSize > 100 * 1024) return false
    }

    return true
  } catch {
    return false
  }
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = ''

  const bytes = new Uint8Array(buffer)

  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }

  return btoa(binary)
}
