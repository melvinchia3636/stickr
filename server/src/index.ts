import express, { Request, Response } from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import os from 'os'
import chalk from 'chalk'
import { convertWithCompressionFallback, generateTrayIconServer } from './converter'

const app = express()
app.use(cors())
app.use(express.json({ limit: '50mb' }))

function getStatusStyle(status: number) {
  if (status >= 500) return chalk.red
  if (status >= 400) return chalk.yellow
  if (status >= 300) return chalk.cyan
  return chalk.green
}

function requestLogger(req: Request, res: Response, next: () => void): void {
  const start = Date.now()
  const { method, url } = req
  const ip = req.ip || req.socket.remoteAddress || 'unknown'

  res.on('finish', function () {
    const duration = Date.now() - start
    const status = res.statusCode
    const statusStyle = getStatusStyle(status)
    const methodStyle = chalk.magenta
    const durationStyle = duration > 5000 ? chalk.red : duration > 1000 ? chalk.yellow : chalk.cyan

    let details = ''
    if (method === 'GET' && req.query.url) {
      details = ` | Remote URL: ${req.query.url}`
    } else if (method === 'POST' && req.body && typeof req.body.fileData === 'string') {
      const sizeKb = Math.round(req.body.fileData.length / 1024)
      details = ` | Upload Payload: ${sizeKb} KB`
    }

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19)
    console.log(
      `[${timestamp}] ${methodStyle(method)} ${url} ${statusStyle(status)} - ${durationStyle(duration + 'ms')}${details} (${ip})`
    )
  })

  next()
}

app.use(requestLogger)

function getTempFilePath(extension: string): string {
  const randomName = Math.random().toString(36).substring(2, 15)
  return path.join(os.tmpdir(), `${randomName}${extension}`)
}

async function downloadFile(url: string, outputPath: string): Promise<void> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download file from ${url}: status ${response.status}`)
  }
  const buffer = await response.arrayBuffer()
  fs.writeFileSync(outputPath, Buffer.from(buffer))
}

app.get('/api/convert', async function (req: Request, res: Response): Promise<void> {
  const url = req.query.url as string
  if (!url) {
    res.status(400).json({ error: 'URL is required' })
    return
  }
  let inputPath = ''
  let outputPath = ''
  try {
    inputPath = getTempFilePath(path.extname(new URL(url).pathname) || '.tmp')
    outputPath = getTempFilePath('.webp')
    await downloadFile(url, inputPath)
    const size = await convertWithCompressionFallback(inputPath, outputPath)
    
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19)
    console.log(`[${timestamp}] ${chalk.green('[CONVERT]')} Converted remote URL successfully -> Size: ${Math.round(size / 1024)} KB`)
    
    res.sendFile(outputPath, function () {
      try {
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath)
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath)
      } catch (cleanupError) {
        console.error('Error during cleanup:', cleanupError)
      }
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19)
    console.error(`[${timestamp}] ${chalk.red('[ERROR]')} Remote URL conversion failed: ${message}`)
    res.status(500).json({ error: message })
    try {
      if (inputPath && fs.existsSync(inputPath)) fs.unlinkSync(inputPath)
      if (outputPath && fs.existsSync(outputPath)) fs.unlinkSync(outputPath)
    } catch {}
  }
})

app.post('/api/convert', async function (req: Request, res: Response): Promise<void> {
  const fileData = req.body.fileData as string
  if (!fileData) {
    res.status(400).json({ error: 'fileData base64 is required' })
    return
  }
  const inputPath = getTempFilePath('.tmp')
  const outputPath = getTempFilePath('.webp')
  try {
    fs.writeFileSync(inputPath, Buffer.from(fileData, 'base64'))
    const size = await convertWithCompressionFallback(inputPath, outputPath)
    const base64 = fs.readFileSync(outputPath, 'base64')
    
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19)
    console.log(`[${timestamp}] ${chalk.green('[CONVERT]')} Converted local upload successfully -> Size: ${Math.round(size / 1024)} KB`)
    
    res.json({ success: true, base64, size })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19)
    console.error(`[${timestamp}] ${chalk.red('[ERROR]')} Local upload conversion failed: ${message}`)
    res.status(500).json({ error: message })
  } finally {
    try {
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath)
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath)
    } catch {}
  }
})

app.get('/api/tray', async function (req: Request, res: Response): Promise<void> {
  const url = req.query.url as string
  if (!url) {
    res.status(400).json({ error: 'URL is required' })
    return
  }
  let inputPath = ''
  let outputPath = ''
  try {
    inputPath = getTempFilePath(path.extname(new URL(url).pathname) || '.tmp')
    outputPath = getTempFilePath('.png')
    await downloadFile(url, inputPath)
    const size = await generateTrayIconServer(inputPath, outputPath)
    
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19)
    console.log(`[${timestamp}] ${chalk.green('[TRAY]')} Generated remote URL tray icon successfully -> Size: ${Math.round(size / 1024)} KB`)
    
    res.sendFile(outputPath, function () {
      try {
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath)
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath)
      } catch {}
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19)
    console.error(`[${timestamp}] ${chalk.red('[ERROR]')} Remote URL tray icon failed: ${message}`)
    res.status(500).json({ error: message })
    try {
      if (inputPath && fs.existsSync(inputPath)) fs.unlinkSync(inputPath)
      if (outputPath && fs.existsSync(outputPath)) fs.unlinkSync(outputPath)
    } catch {}
  }
})

app.post('/api/tray', async function (req: Request, res: Response): Promise<void> {
  const fileData = req.body.fileData as string
  if (!fileData) {
    res.status(400).json({ error: 'fileData base64 is required' })
    return
  }
  const inputPath = getTempFilePath('.tmp')
  const outputPath = getTempFilePath('.png')
  try {
    fs.writeFileSync(inputPath, Buffer.from(fileData, 'base64'))
    const size = await generateTrayIconServer(inputPath, outputPath)
    const base64 = fs.readFileSync(outputPath, 'base64')
    
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19)
    console.log(`[${timestamp}] ${chalk.green('[TRAY]')} Generated local upload tray icon successfully -> Size: ${Math.round(size / 1024)} KB`)
    
    res.json({ success: true, base64 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19)
    console.error(`[${timestamp}] ${chalk.red('[ERROR]')} Local upload tray icon failed: ${message}`)
    res.status(500).json({ error: message })
  } finally {
    try {
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath)
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath)
    } catch {}
  }
})

const PORT = 3000
app.listen(PORT, function () {
  console.log(`Sticker converter server running on port ${PORT}`)
})
