import { exec } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { promisify } from 'util'

const execAsync = promisify(exec)

interface WebPInfo {
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

  if (isAnimated) {
    const match = stdout.match(/Number of frames:\s*(\d+)/i)

    if (match) {
      frameCount = parseInt(match[1], 10)
    }

    const lines = stdout.split('\n')

    for (const line of lines) {
      const parts = line.trim().split(/\s+/)

      if (parts.length >= 5 && /^\d+$/.test(parts[0])) {
        const duration = parseInt(parts[4], 10)

        if (!isNaN(duration)) {
          durations.push(duration)
        }
      }
    }
  }

  return { isAnimated, frameCount, durations }
}

async function getWebPInfo(filePath: string): Promise<WebPInfo> {
  try {
    const { stdout } = await execAsync(`webpmux -info "${filePath}"`)

    return parseWebPInfo(stdout)
  } catch {
    return { isAnimated: false, frameCount: 1, durations: [] }
  }
}

export async function convertToWebPServerFlow(
  inputPath: string,
  tempDir: string,
  outputPath: string,
  quality: number,
  fps: number,
  forceAnimated?: boolean
): Promise<void> {
  if (isWebPFile(inputPath)) {
    const info = await getWebPInfo(inputPath)

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

        const filter = `scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:-1:-1:color=0x00000000`

        await execAsync(
          `ffmpeg -y -i "${framePng}" -vf "${filter}" "${scaledPng}"`
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
        const duration = info.durations[i] || Math.round(1000 / fps)
        frameArgs.push(`-frame "${frameWebps[i]}" +${duration}+0+0+1-b`)
      }

      const tempOutput = path.join(tempDir, 'temp_output.webp')
      await execAsync(`webpmux ${frameArgs.join(' ')} -o "${tempOutput}"`)
      await execAsync(`webpmux -set loop 0 "${tempOutput}" -o "${outputPath}"`)

      return
    } else {
      const framePng = path.join(tempDir, 'frame_001.png')

      const scaledPng = path.join(tempDir, 'scaled_001.png')

      await execAsync(`dwebp "${inputPath}" -o "${framePng}"`)

      const filter = `scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:-1:-1:color=0x00000000`

      await execAsync(
        `ffmpeg -y -i "${framePng}" -vf "${filter}" "${scaledPng}"`
      )

      if (forceAnimated) {
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
  }

  const filter = `fps=${fps},scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:-1:-1:color=0x00000000`

  const ffmpegCommand = `ffmpeg -y -i "${inputPath}" -vf "${filter}" "${path.join(tempDir, 'frame_%03d.png')}"`

  await execAsync(ffmpegCommand)

  const pngFiles = fs
    .readdirSync(tempDir)
    .filter(file => file.endsWith('.png'))
    .sort()

  if (pngFiles.length === 0) {
    throw new Error('No PNG frames were extracted from the input source')
  }

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
      await execAsync(
        `webpmux -set loop 0 "${tempOutput}" -o "${outputPath}"`
      )
    } else {
      await execAsync(
        `cwebp -exact -q ${quality} ${framePath} -o "${outputPath}"`
      )
    }
  } else {
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

export async function convertWithCompressionFallback(
  inputPath: string,
  outputPath: string,
  forceAnimated?: boolean
): Promise<number> {
  let isStatic = false

  if (forceAnimated) {
    isStatic = false
  } else if (isWebPFile(inputPath)) {
    const info = await getWebPInfo(inputPath)

    isStatic = !info.isAnimated || info.frameCount <= 1
  } else {
    const checkTempDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'sticker-convert-check-')
    )

    try {
      const filter =
        'fps=15,scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:-1:-1:color=0x00000000'

      const ffmpegCommand = `ffmpeg -y -i "${inputPath}" -vf "${filter}" "${path.join(checkTempDir, 'frame_%03d.png')}"`

      await execAsync(ffmpegCommand)

      const pngFiles = fs
        .readdirSync(checkTempDir)
        .filter(file => file.endsWith('.png'))
        .sort()

      if (pngFiles.length === 0) {
        throw new Error('No PNG frames were extracted from the input source')
      }
      isStatic = pngFiles.length === 1
    } finally {
      try {
        if (fs.existsSync(checkTempDir)) {
          const files = fs.readdirSync(checkTempDir)

          for (const file of files) {
            fs.unlinkSync(path.join(checkTempDir, file))
          }
          fs.rmdirSync(checkTempDir)
        }
      } catch {}
    }
  }

  if (isStatic) {
    const staticSteps = [80, 70, 60, 50, 40, 30, 20]

    const MAX_STATIC_SIZE = 100 * 1024

    const tempDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'sticker-convert-static-')
    )

    try {
      const filter =
        'scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:-1:-1:color=0x00000000'

      const framePath = path.join(tempDir, 'frame.png')

      if (isWebPFile(inputPath)) {
        const tempWebpFrame = path.join(tempDir, 'temp_frame.png')

        await execAsync(`dwebp "${inputPath}" -o "${tempWebpFrame}"`)

        const scaleCommand = `ffmpeg -y -i "${tempWebpFrame}" -vf "${filter}" "${framePath}"`

        await execAsync(scaleCommand)
      } else {
        const extractCommand = `ffmpeg -y -i "${inputPath}" -vf "${filter}" -vframes 1 "${framePath}"`

        await execAsync(extractCommand)
      }

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
  } else {
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

      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sticker-convert-'))

      try {
        await convertToWebPServerFlow(
          inputPath,
          tempDir,
          outputPath,
          q,
          fps,
          forceAnimated
        )

        const stats = fs.statSync(outputPath)

        if (stats.size <= MAX_ANIMATED_SIZE) {
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
      await convertToWebPServerFlow(
        inputPath,
        tempDir,
        outputPath,
        20,
        5,
        forceAnimated
      )

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
}

export async function generateTrayIconServer(
  inputPath: string,
  outputPath: string
): Promise<number> {
  const filter = `scale=96:96:force_original_aspect_ratio=decrease,format=rgba,pad=96:96:-1:-1:color=0x00000000`

  if (isWebPFile(inputPath)) {
    const tempDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'sticker-convert-tray-')
    )

    try {
      const tempWebp = path.join(tempDir, 'temp.webp')

      const tempPng = path.join(tempDir, 'temp.png')

      try {
        await execAsync(`webpmux -get frame 1 "${inputPath}" -o "${tempWebp}"`)
        await execAsync(`dwebp "${tempWebp}" -o "${tempPng}"`)
      } catch {
        await execAsync(`dwebp "${inputPath}" -o "${tempPng}"`)
      }

      const command = `ffmpeg -y -i "${tempPng}" -vframes 1 -vf "${filter}" "${outputPath}"`

      await execAsync(command)
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
  } else {
    const command = `ffmpeg -y -i "${inputPath}" -vframes 1 -vf "${filter}" "${outputPath}"`

    await execAsync(command)
  }

  const stats = fs.statSync(outputPath)

  return stats.size
}
