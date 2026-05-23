import chalk from 'chalk'
import morgan from 'morgan'
import type { Request } from 'express'

morgan.token('detail', (req: Request) => {
  if (req.method === 'GET' && req.query.url) {
    return ` | Remote URL: ${req.query.url}`
  }

  if (
    req.method === 'POST' &&
    req.body &&
    typeof req.body.fileData === 'string'
  ) {
    const sizeKb = Math.round(req.body.fileData.length / 1024)

    return ` | Upload Payload: ${sizeKb} KB`
  }

  return ''
})

const methodStyle = chalk.magenta

morgan.format(
  'sticker',
  (tokens, req: Request, res) => {
    const timestamp = new Date()
      .toISOString()
      .replace('T', ' ')
      .substring(0, 19)

    const method = tokens.method(req, res)

    const url = tokens.url(req, res)

    const status = tokens.status(req, res)

    const statusNum = parseInt(status || '0', 10)

    const statusStyle =
      statusNum >= 500
        ? chalk.red
        : statusNum >= 400
          ? chalk.yellow
          : statusNum >= 300
            ? chalk.cyan
            : chalk.green

    const duration = tokens['response-time'](req, res)

    const durationNum = parseFloat(duration || '0')

    const durationStyle =
      durationNum > 5000
        ? chalk.red
        : durationNum > 1000
          ? chalk.yellow
          : chalk.cyan

    const ip = tokens['remote-addr'](req, res)

    const detail = tokens.detail(req, res)

    return `[${timestamp}] ${methodStyle(method)} ${url} ${statusStyle(status)} - ${durationStyle(duration + 'ms')}${detail} (${ip})`
  }
)

export { morgan }
