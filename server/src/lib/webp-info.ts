import fs from 'fs'

import { execAsync } from '../utils'

export interface WebPInfo {
  isAnimated: boolean
  frameCount: number
  durations: number[]
}

export function isWebPFile(filePath: string): boolean {
  try {
    const buffer = Buffer.alloc(12)

    const fd = fs.openSync(filePath, 'r')

    fs.readSync(fd, buffer, 0, 12, 0)
    fs.closeSync(fd)

    return (
      buffer.toString('ascii', 0, 4) === 'RIFF' &&
      buffer.toString('ascii', 8, 12) === 'WEBP'
    )
  } catch {
    return false
  }
}

export function parseWebPInfo(stdout: string): WebPInfo {
  const isAnimated = stdout.includes('animation')

  let frameCount = 1

  const durations: number[] = []

  if (!isAnimated) {
    return { isAnimated, frameCount, durations }
  }

  const match = stdout.match(/Number of frames:\s*(\d+)/i)

  if (match) {
    frameCount = parseInt(match[1], 10)
  }

  for (const line of stdout.split('\n')) {
    const parts = line.trim().split(/\s+/)

    if (parts.length >= 5 && /^\d+$/.test(parts[0])) {
      const duration = parseInt(parts[4], 10)

      if (!isNaN(duration)) {
        durations.push(duration)
      }
    }
  }

  return { isAnimated, frameCount, durations }
}

export async function getWebPInfo(filePath: string): Promise<WebPInfo> {
  try {
    const { stdout } = await execAsync(`webpmux -info "${filePath}"`)

    return parseWebPInfo(stdout)
  } catch {
    return { isAnimated: false, frameCount: 1, durations: [] }
  }
}
