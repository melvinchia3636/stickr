import fs from 'fs'
import path from 'path'

import { execAsync, withTempDir } from '../utils'
import { TRAY_FILTER, paletteReduceFilter } from './filters'
import { isWebPFile } from './webp-info'

const TRAY_SIZE_LIMIT = 50 * 1024

// Color palettes to try when PNG exceeds 50 KB (descending color count).
const PALETTES = [256, 128, 64, 32, 16]

// Extracts the first frame of any image/video and resizes it to a 96×96 PNG
// for use as the sticker pack tray icon (the preview shown in WhatsApp's
// sticker picker). WhatsApp requires tray icons to be under 50 KB.
// If the full-color PNG exceeds the limit, the palette is reduced iteratively.
export async function generateTrayIcon(
  inputPath: string,
  outputPath: string
): Promise<number> {
  await withTempDir('sticker-convert-tray-', async tempDir => {
    const rawFrame = path.join(tempDir, 'raw.png')

    // --- Extract first frame as a 96×96 PNG ---

    if (isWebPFile(inputPath)) {
      // Try webpmux -get frame 1 (animated); fall back to dwebp (static).
      try {
        const tempWebp = path.join(tempDir, 'temp.webp')

        await execAsync(
          `webpmux -get frame 1 "${inputPath}" -o "${tempWebp}"`
        )
        await execAsync(`dwebp "${tempWebp}" -o "${rawFrame}"`)
      } catch {
        await execAsync(`dwebp "${inputPath}" -o "${rawFrame}"`)
      }
    } else {
      await execAsync(
        `ffmpeg -y -i "${inputPath}" -vframes 1 -vf "${TRAY_FILTER}" "${rawFrame}"`
      )
    }

    // Check if full-color PNG already fits.
    const rawStats = fs.statSync(rawFrame)

    if (rawStats.size <= TRAY_SIZE_LIMIT) {
      fs.copyFileSync(rawFrame, outputPath)

      return rawStats.size
    }

    // --- Reduce palette until size fits ---

    for (let i = 0; i < PALETTES.length; i++) {
      const colors = PALETTES[i]

      const reduced = path.join(tempDir, `p${colors}.png`)

      // Generate a palette and map the frame to it, dithering to preserve
      // visual quality despite fewer colors.
      await execAsync(
        `ffmpeg -y -i "${rawFrame}" -vf "${paletteReduceFilter(colors)}" "${reduced}"`
      )

      const stats = fs.statSync(reduced)

      if (stats.size <= TRAY_SIZE_LIMIT || i === PALETTES.length - 1) {
        fs.copyFileSync(reduced, outputPath)

        return stats.size
      }
    }
  })

  const stats = fs.statSync(outputPath)

  return stats.size
}
