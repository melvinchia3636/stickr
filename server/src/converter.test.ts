import { describe, expect, test, mock, beforeAll } from 'bun:test'
import fs from 'fs'
import path from 'path'
import os from 'os'
import type { convertToWebPServerFlow as ConvertFn, convertWithCompressionFallback as FallbackFn, generateTrayIconServer as TrayFn } from './converter'

// Register mock before importing the target module
mock.module('child_process', function () {
  return {
    exec: function (cmd: string, cb: (err: Error | null, stdout: string, stderr: string) => void) {
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
      setTimeout(function () {
        cb(null, 'stdout', 'stderr')
      }, 10)
    }
  }
})

let convertToWebPServerFlow: typeof ConvertFn
let convertWithCompressionFallback: typeof FallbackFn
let generateTrayIconServer: typeof TrayFn

beforeAll(async function () {
  const mod = await import('./converter')
  convertToWebPServerFlow = mod.convertToWebPServerFlow
  convertWithCompressionFallback = mod.convertWithCompressionFallback
  generateTrayIconServer = mod.generateTrayIconServer
})

describe('Converter Module Tests', function () {
  test('convertToWebPServerFlow should call exec and generate a file', async function () {
    const input = path.join(os.tmpdir(), 'input.mp4')
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sticker-convert-test-'))
    const output = path.join(os.tmpdir(), 'output.webp')
    fs.writeFileSync(input, 'dummy data')

    try {
      await convertToWebPServerFlow(input, tempDir, output, 70, 15)
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

  test('convertWithCompressionFallback should perform scaling and return file size', async function () {
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

  test('generateTrayIconServer should generate standard static png file', async function () {
    const input = path.join(os.tmpdir(), 'input3.webp')
    const output = path.join(os.tmpdir(), 'output3.png')
    fs.writeFileSync(input, 'dummy data')

    try {
      const size = await generateTrayIconServer(input, output)
      expect(size).toBe(1024)
      expect(fs.existsSync(output)).toBe(true)
    } finally {
      if (fs.existsSync(input)) fs.unlinkSync(input)
      if (fs.existsSync(output)) fs.unlinkSync(output)
    }
  })
})
