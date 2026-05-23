import type { Response, Router } from 'express'

import { convertWithCompressionFallback } from './lib/compression'
import { generateTrayIcon } from './lib/tray-icon'
import { handleConvert } from './lib/handler'

export function registerRoutes(router: Router): void {
  router.get('/api/health', (_, res: Response): void => {
    res.json({ status: 'ok' })
  })

  router.post(
    '/api/convert',
    handleConvert({
      label: 'CONVERT',
      ext: '.webp',
      process: convertWithCompressionFallback
    })
  )

  router.post(
    '/api/tray',
    handleConvert({
      label: 'TRAY',
      ext: '.png',
      process: generateTrayIcon
    })
  )
}
