import fs from 'fs'
import path from 'path'

import { execAsync, withTempDir } from '../utils'
import { SCALE_BASE, scaleFilter } from './filters'
import { processStickerInput } from './sticker'
import { getWebPInfo, isWebPFile } from './webp-info'

// WhatsApp sticker size limits:
//   - Static: 100 KB max
//   - Animated: 500 KB max
// These limits are strict - WhatsApp will reject stickers that exceed them.
// This function progressively lowers quality/fps until the output fits within
// the respective limit.

export async function convertWithCompressionFallback(
  inputPath: string,
  outputPath: string,
  forceAnimated?: boolean
): Promise<number> {
  // --- Determine if input is static or animated ---

  let isStatic = false

  if (forceAnimated) {
    isStatic = false
  } else if (isWebPFile(inputPath)) {
    const info = await getWebPInfo(inputPath)

    isStatic = !info.isAnimated || info.frameCount <= 1
  } else {
    // Non-WebP: extract first few frames at 15 fps to count them.
    await withTempDir('sticker-convert-check-', async checkTempDir => {
      const ffmpegCommand = `ffmpeg -y -i "${inputPath}" -vf "${scaleFilter(15)}" "${path.join(checkTempDir, 'frame_%03d.png')}"`

      await execAsync(ffmpegCommand)

      const pngFiles = fs
        .readdirSync(checkTempDir)
        .filter(file => file.endsWith('.png'))
        .sort()

      if (pngFiles.length === 0) {
        throw new Error('No PNG frames were extracted from the input source')
      }
      isStatic = pngFiles.length === 1
    })
  }

  // --- Static path: step down quality until ≤ 100 KB (WhatsApp limit) ---

  if (isStatic) {
    const staticSteps = [80, 70, 60, 50, 40, 30, 20]

    const MAX_STATIC_SIZE = 100 * 1024

    return await withTempDir('sticker-convert-static-', async tempDir => {
      const framePath = path.join(tempDir, 'frame.png')

      // Decode input to a single 512×512 PNG frame.
      if (isWebPFile(inputPath)) {
        const tempWebpFrame = path.join(tempDir, 'temp_frame.png')

        await execAsync(`dwebp "${inputPath}" -o "${tempWebpFrame}"`)

        const scaleCommand = `ffmpeg -y -i "${tempWebpFrame}" -vf "${SCALE_BASE}" "${framePath}"`

        await execAsync(scaleCommand)
      } else {
        const extractCommand = `ffmpeg -y -i "${inputPath}" -vf "${SCALE_BASE}" -vframes 1 "${framePath}"`

        await execAsync(extractCommand)
      }

      // Try each quality level; return as soon as size is acceptable.
      for (let i = 0; i < staticSteps.length; i++) {
        const q = staticSteps[i]

        const cmd = `cwebp -exact -q ${q} "${framePath}" -o "${outputPath}"`

        await execAsync(cmd)

        const stats = fs.statSync(outputPath)

        if (stats.size <= MAX_STATIC_SIZE || i === staticSteps.length - 1) {
          return stats.size
        }
      }

      return fs.statSync(outputPath).size
    })
  }

  // --- Animated path: step down quality+fps until ≤ 500 KB (WhatsApp limit) ---

  const steps = [
    { q: 70, fps: 15 },
    { q: 60, fps: 12 },
    { q: 50, fps: 10 },
    { q: 40, fps: 8 },
    { q: 30, fps: 5 }
  ]

  const MAX_ANIMATED_SIZE = 450 * 1024

  for (let i = 0; i < steps.length; i++) {
    const { q, fps } = steps[i]

    const size = await withTempDir('sticker-convert-', async tempDir => {
      await processStickerInput(
        inputPath,
        tempDir,
        outputPath,
        q,
        fps,
        forceAnimated
      )

      const stats = fs.statSync(outputPath)

      return stats.size
    })

    if (size <= MAX_ANIMATED_SIZE) {
      return size
    }
  }

  // Last resort: lowest quality/fps.
  return await withTempDir('sticker-convert-', async tempDir => {
    await processStickerInput(
      inputPath,
      tempDir,
      outputPath,
      20,
      5,
      forceAnimated
    )

    return fs.statSync(outputPath).size
  })
}
