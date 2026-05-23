import fs from 'fs'
import path from 'path'

import { execAsync } from '../utils'
import { getWebPInfo, isWebPFile } from './webp-info'
import { SCALE_BASE, scaleFilter } from './filters'

// Takes any image/video/WebP input and produces a 512×512 WebP sticker
// compliant with WhatsApp requirements.
// Handles three cases:
//   1. Animated WebP → extract frames, scale, re-encode, assemble
//   2. Static WebP   → decode, scale, re-encode (optionally force-animated)
//   3. Other formats  → ffmpeg extracts PNG frames at given fps, then encode each to WebP and assemble

export async function processStickerInput(
  inputPath: string,
  tempDir: string,
  outputPath: string,
  quality: number,
  fps: number,
  forceAnimated?: boolean
): Promise<void> {
  // --- Case 1 / 2: input is already a WebP ---

  if (isWebPFile(inputPath)) {
    const info = await getWebPInfo(inputPath)

    // Case 1: animated WebP — extract each frame, scale to 512×512, re-encode, stitch back.
    if (info.isAnimated && info.frameCount > 1) {
      const scaledPngs: string[] = []

      for (let i = 1; i <= info.frameCount; i++) {
        const frameIdx = String(i).padStart(3, '0')

        const frameWebp = path.join(tempDir, `frame_${frameIdx}.webp`)

        const framePng = path.join(tempDir, `frame_${frameIdx}.png`)

        const scaledPng = path.join(tempDir, `scaled_${frameIdx}.png`)

        await execAsync(
          `webpmux -get frame ${i} "${inputPath}" -o "${frameWebp}"`
        )
        await execAsync(`dwebp "${frameWebp}" -o "${framePng}"`)

        await execAsync(
          `ffmpeg -y -i "${framePng}" -vf "${SCALE_BASE}" "${scaledPng}"`
        )
        scaledPngs.push(scaledPng)
      }

      const frameWebps: string[] = []

      for (let i = 0; i < info.frameCount; i++) {
        const frameIdx = String(i + 1).padStart(3, '0')

        const frameWebp = path.join(tempDir, `scaled_frame_${frameIdx}.webp`)

        await execAsync(
          `cwebp -exact -q ${quality} "${scaledPngs[i]}" -o "${frameWebp}"`
        )
        frameWebps.push(frameWebp)
      }

      const frameArgs: string[] = []

      for (let i = 0; i < info.frameCount; i++) {
        // Preserve original frame durations; fall back to 1000/fps.
        const duration = info.durations[i] || Math.round(1000 / fps)

        frameArgs.push(`-frame "${frameWebps[i]}" +${duration}+0+0+1-b`)
      }

      const tempOutput = path.join(tempDir, 'temp_output.webp')

      await execAsync(`webpmux ${frameArgs.join(' ')} -o "${tempOutput}"`)
      await execAsync(`webpmux -set loop 0 "${tempOutput}" -o "${outputPath}"`)

      return
    }

    // Case 2: static WebP — single frame path.
    const framePng = path.join(tempDir, 'frame_001.png')

    const scaledPng = path.join(tempDir, 'scaled_001.png')

    await execAsync(`dwebp "${inputPath}" -o "${framePng}"`)

    await execAsync(
      `ffmpeg -y -i "${framePng}" -vf "${SCALE_BASE}" "${scaledPng}"`
    )

    if (forceAnimated) {
      // Duplicate the single frame to create a minimal 2-frame animation
      // for WhatsApp animated sticker support.
      const tempWebp = path.join(tempDir, 'temp_force_anim.webp')

      const tempOutput = path.join(tempDir, 'temp_output.webp')

      await execAsync(
        `cwebp -exact -q ${quality} "${scaledPng}" -o "${tempWebp}"`
      )
      await execAsync(
        `webpmux -frame "${tempWebp}" +500+0+0+1-b -frame "${tempWebp}" +500+0+0+1-b -o "${tempOutput}"`
      )
      await execAsync(
        `webpmux -set loop 0 "${tempOutput}" -o "${outputPath}"`
      )
    } else {
      await execAsync(
        `cwebp -exact -q ${quality} "${scaledPng}" -o "${outputPath}"`
      )
    }

    return
  }

  // --- Case 3: non-WebP input (video, image, GIF) ---

  const ffmpegCommand = `ffmpeg -y -i "${inputPath}" -vf "${scaleFilter(fps)}" "${path.join(tempDir, 'frame_%03d.png')}"`

  await execAsync(ffmpegCommand)

  const pngFiles = fs
    .readdirSync(tempDir)
    .filter(file => file.endsWith('.png'))
    .sort()

  if (pngFiles.length === 0) {
    throw new Error('No PNG frames were extracted from the input source')
  }

  // Single frame — output a static (or force-animated) WebP.
  if (pngFiles.length === 1) {
    const rawFramePath = path.join(tempDir, pngFiles[0])

    const framePath = `"${rawFramePath}"`

    if (forceAnimated) {
      const tempWebp = path.join(tempDir, 'temp_force_anim.webp')

      const tempOutput = path.join(tempDir, 'temp_output.webp')

      await execAsync(
        `cwebp -exact -q ${quality} "${rawFramePath}" -o "${tempWebp}"`
      )
      await execAsync(
        `webpmux -frame "${tempWebp}" +500+0+0+1-b -frame "${tempWebp}" +500+0+0+1-b -o "${tempOutput}"`
      )
      await execAsync(`webpmux -set loop 0 "${tempOutput}" -o "${outputPath}"`)
    } else {
      await execAsync(
        `cwebp -exact -q ${quality} ${framePath} -o "${outputPath}"`
      )
    }
  } else {
    // Multiple frames — encode each as a WebP, then assemble with webpmux.
    const frameWebps: string[] = []

    for (let i = 0; i < pngFiles.length; i++) {
      const frameIdx = String(i + 1).padStart(3, '0')

      const frameWebp = path.join(tempDir, `scaled_frame_${frameIdx}.webp`)

      await execAsync(
        `cwebp -exact -q ${quality} "${path.join(tempDir, pngFiles[i])}" -o "${frameWebp}"`
      )
      frameWebps.push(frameWebp)
    }

    const duration = Math.round(1000 / fps)

    const frameArgs: string[] = []

    for (let i = 0; i < frameWebps.length; i++) {
      frameArgs.push(`-frame "${frameWebps[i]}" +${duration}+0+0+1-b`)
    }

    const tempOutput = path.join(tempDir, 'temp_output.webp')

    await execAsync(`webpmux ${frameArgs.join(' ')} -o "${tempOutput}"`)
    await execAsync(`webpmux -set loop 0 "${tempOutput}" -o "${outputPath}"`)
  }
}
