import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'
import os from 'os'

const execAsync = promisify(exec)

export async function convertToWebPServerFlow(
  inputPath: string,
  tempDir: string,
  outputPath: string,
  quality: number,
  fps: number
): Promise<void> {
  const filter = `fps=${fps},scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:-1:-1:color=0x00000000`
  const ffmpegCommand = `ffmpeg -y -i "${inputPath}" -vf "${filter}" "${path.join(tempDir, 'frame_%03d.png')}"`
  await execAsync(ffmpegCommand)
  const pngFiles = fs.readdirSync(tempDir)
    .filter(function (file) {
      return file.endsWith('.png')
    })
    .sort()
  if (pngFiles.length === 0) {
    throw new Error('No PNG frames were extracted from the input source')
  }
  const frameArgs = pngFiles
    .map(function (file) {
      return `"${path.join(tempDir, file)}"`
    })
    .join(' ')
  const duration = Math.round(1000 / fps)
  const img2webpCommand = `img2webp -loop 0 -lossy -q ${quality} -d ${duration} ${frameArgs} -o "${outputPath}"`
  await execAsync(img2webpCommand)
}

export async function convertWithCompressionFallback(
  inputPath: string,
  outputPath: string
): Promise<number> {
  const steps = [
    { q: 70, fps: 15 },
    { q: 60, fps: 12 },
    { q: 50, fps: 10 },
    { q: 40, fps: 8 },
    { q: 30, fps: 5 }
  ]
  const MAX_SIZE = 500 * 1024
  for (let i = 0; i < steps.length; i++) {
    const { q, fps } = steps[i]
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sticker-convert-'))
    try {
      await convertToWebPServerFlow(inputPath, tempDir, outputPath, q, fps)
      const stats = fs.statSync(outputPath)
      if (stats.size <= MAX_SIZE) {
        return stats.size
      }
    } finally {
      try {
        if (fs.existsSync(tempDir)) {
          const files = fs.readdirSync(tempDir)
          for (const file of files) {
            fs.unlinkSync(path.join(tempDir, file))
          }
          fs.rmdirSync(tempDir)
        }
      } catch {}
    }
  }
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sticker-convert-'))
  try {
    await convertToWebPServerFlow(inputPath, tempDir, outputPath, 20, 5)
    const stats = fs.statSync(outputPath)
    return stats.size
  } finally {
    try {
      if (fs.existsSync(tempDir)) {
        const files = fs.readdirSync(tempDir)
        for (const file of files) {
          fs.unlinkSync(path.join(tempDir, file))
        }
        fs.rmdirSync(tempDir)
      }
    } catch {}
  }
}

export async function generateTrayIconServer(
  inputPath: string,
  outputPath: string
): Promise<number> {
  const filter = `scale=96:96:force_original_aspect_ratio=decrease,pad=96:96:-1:-1:color=0x00000000`
  const command = `ffmpeg -y -i "${inputPath}" -vframes 1 -vf "${filter}" "${outputPath}"`
  await execAsync(command)
  const stats = fs.statSync(outputPath)
  return stats.size
}
