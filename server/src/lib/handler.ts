import chalk from 'chalk'
import type { Request, Response } from 'express'
import fs from 'fs'
import path from 'path'

import { downloadFile, getTempFilePath, sendFileAsync } from '../utils'

interface HandlerConfig {
  label: string
  ext: string
  process: (
    input: string,
    output: string,
    animated?: boolean
  ) => Promise<number>
}

export function handleConvert(config: HandlerConfig) {
  return async (
    req: Request<
      unknown,
      unknown,
      {
        url?: string
        fileData?: string
        animated?: boolean
      }
    >,
    res: Response
  ): Promise<void> => {
    const { url, fileData, animated } = req.body

    if (!url && !fileData) {
      res.status(400).json({ error: 'url or fileData is required' })

      return
    }

    let inputPath = ''
    let outputPath = ''

    try {
      if (url) {
        inputPath = getTempFilePath(
          path.extname(new URL(url).pathname) || '.tmp'
        )
        outputPath = getTempFilePath(config.ext)
        await downloadFile(url, inputPath)
      } else {
        if (!fileData) {
          throw new Error('File data not found')
        }

        inputPath = getTempFilePath('.tmp')
        outputPath = getTempFilePath(config.ext)
        fs.writeFileSync(inputPath, Buffer.from(fileData, 'base64'))
      }

      const size = await config.process(inputPath, outputPath, animated)

      console.log(
        `[${new Date().toLocaleString('sv-SE')}] ${chalk.green(`[${config.label}]`)} Converted ${url ? 'remote URL' : 'local upload'} successfully -> Size: ${Math.round(size / 1024)} KB`
      )

      res.set('X-File-Size', String(size))

      await sendFileAsync(res, outputPath)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'

      const label =
        (error as NodeJS.ErrnoException).code === 'ECONNABORTED'
          ? 'transmission'
          : config.label.toLowerCase()

      console.error(
        `[${new Date().toLocaleString('sv-SE')}] ${chalk.red('[ERROR]')} ${label} failed: ${message}`
      )

      if (!res.headersSent) {
        res.status(500).json({ error: message })
      }
    } finally {
      for (const p of [inputPath, outputPath]) {
        if (!p) continue

        try {
          fs.rmSync(p, { force: true })
        } catch {}
      }
    }
  }
}
