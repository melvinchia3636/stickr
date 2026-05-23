import { beforeAll, describe, expect, mock, test } from 'bun:test'
import fs from 'fs'
import os from 'os'
import path from 'path'

import type { convertWithCompressionFallback as FallbackFn } from './lib/compression'
import type { processStickerInput as ConvertFn } from './lib/sticker'
import type { generateTrayIcon as TrayFn } from './lib/tray-icon'
import type {
  isWebPFile as IsWebPFileFn,
  parseWebPInfo as ParseWebPInfoFn
} from './lib/webp-info'

// Register mock before importing the target module
mock.module('child_process', () => ({
  exec: (
    cmd: string,
    cb: (err: Error | null, stdout: string, stderr: string) => void
  ) => {
    if (cmd.includes('frame_%03d.png')) {
      const match = cmd.match(/"([^"]+)"$/)

      if (match && match[1]) {
        const literalPath = match[1]

        const dir = path.dirname(literalPath)

        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
        fs.writeFileSync(path.join(dir, 'frame_001.png'), 'dummy frame')
      }
    } else {
      const match = cmd.match(/"([^"]+)"$/)

      if (match && match[1]) {
        const outPath = match[1]

        const dir = path.dirname(outPath)

        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
        fs.writeFileSync(outPath, Buffer.alloc(1024))
      }
    }
    setTimeout(() => {
      cb(null, 'stdout', 'stderr')
    }, 10)
  }
}))

let processStickerInput: typeof ConvertFn
let convertWithCompressionFallback: typeof FallbackFn
let isWebPFile: typeof IsWebPFileFn
let parseWebPInfo: typeof ParseWebPInfoFn
let generateTrayIcon: typeof TrayFn

beforeAll(async () => {
  const compressionMod = await import('./lib/compression')

  const convertFlowMod = await import('./lib/sticker')

  const webpInfoMod = await import('./lib/webp-info')

  const trayConverterMod = await import('./lib/tray-icon')

  convertWithCompressionFallback = compressionMod.convertWithCompressionFallback
  processStickerInput = convertFlowMod.processStickerInput
  isWebPFile = webpInfoMod.isWebPFile
  parseWebPInfo = webpInfoMod.parseWebPInfo
  generateTrayIcon = trayConverterMod.generateTrayIcon
})

describe('Converter Module Tests', () => {
  test('processStickerInput should call exec and generate a file', async () => {
    const input = path.join(os.tmpdir(), 'input.mp4')

    const tempDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'sticker-convert-test-')
    )

    const output = path.join(os.tmpdir(), 'output.webp')

    fs.writeFileSync(input, 'dummy data')

    try {
      await processStickerInput(input, tempDir, output, 70, 15)
      expect(fs.existsSync(output)).toBe(true)

      const stats = fs.statSync(output)

      expect(stats.size).toBe(1024)
    } finally {
      if (fs.existsSync(input)) fs.unlinkSync(input)
      if (fs.existsSync(output)) fs.unlinkSync(output)

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
  })

  test('processStickerInput with forceAnimated should duplicate frames and produce a file', async () => {
    const input = path.join(os.tmpdir(), 'input_anim.mp4')

    const tempDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'sticker-convert-anim-test-')
    )

    const output = path.join(os.tmpdir(), 'output_anim.webp')

    fs.writeFileSync(input, 'dummy data')

    try {
      await processStickerInput(input, tempDir, output, 70, 15, true)
      expect(fs.existsSync(output)).toBe(true)

      const stats = fs.statSync(output)

      expect(stats.size).toBe(1024)
    } finally {
      if (fs.existsSync(input)) fs.unlinkSync(input)
      if (fs.existsSync(output)) fs.unlinkSync(output)

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
  })

  test('convertWithCompressionFallback should perform scaling and return file size', async () => {
    const input = path.join(os.tmpdir(), 'input2.mp4')

    const output = path.join(os.tmpdir(), 'output2.webp')

    fs.writeFileSync(input, 'dummy data')

    try {
      const size = await convertWithCompressionFallback(input, output)

      expect(size).toBe(1024)
      expect(fs.existsSync(output)).toBe(true)
    } finally {
      if (fs.existsSync(input)) fs.unlinkSync(input)
      if (fs.existsSync(output)) fs.unlinkSync(output)
    }
  })

  test('generateTrayIcon should generate standard static png file', async () => {
    const input = path.join(os.tmpdir(), 'input3.webp')

    const output = path.join(os.tmpdir(), 'output3.png')

    fs.writeFileSync(input, 'dummy data')

    try {
      const size = await generateTrayIcon(input, output)

      expect(size).toBe(1024)
      expect(fs.existsSync(output)).toBe(true)
    } finally {
      if (fs.existsSync(input)) fs.unlinkSync(input)
      if (fs.existsSync(output)) fs.unlinkSync(output)
    }
  })

  test('isWebPFile should correctly identify WebP signatures', () => {
    const webpPath = path.join(os.tmpdir(), 'test_sig.webp')

    const nonWebpPath = path.join(os.tmpdir(), 'test_sig.txt')

    const webpBuffer = Buffer.alloc(12)

    webpBuffer.write('RIFF', 0, 4, 'ascii')
    webpBuffer.write('WEBP', 8, 4, 'ascii')
    fs.writeFileSync(webpPath, webpBuffer)

    fs.writeFileSync(nonWebpPath, 'not a webp file')

    try {
      expect(isWebPFile(webpPath)).toBe(true)
      expect(isWebPFile(nonWebpPath)).toBe(false)
    } finally {
      if (fs.existsSync(webpPath)) fs.unlinkSync(webpPath)
      if (fs.existsSync(nonWebpPath)) fs.unlinkSync(nonWebpPath)
    }
  })

  test('parseWebPInfo should parse animated and static info', () => {
    const staticStdout = 'Canvas size: 512 x 512\nNo features present.\n'

    const staticInfo = parseWebPInfo(staticStdout)

    expect(staticInfo.isAnimated).toBe(false)
    expect(staticInfo.frameCount).toBe(1)

    const animatedStdout = `Canvas size: 512 x 512
Features: animation transparent
Background color: 0x00000000  Loop count: 0
Number of frames: 3
No. image_file/canvas_pos_x/pos_y/duration/dispose/blend
  1 rgb(a)      0     0    40   none   yes
  2 rgb(a)      0     0    50   none   yes
  3 rgb(a)      0     0    60   none   yes`

    const animatedInfo = parseWebPInfo(animatedStdout)

    expect(animatedInfo.isAnimated).toBe(true)
    expect(animatedInfo.frameCount).toBe(3)
    expect(animatedInfo.durations).toEqual([40, 50, 60])
  })
})
