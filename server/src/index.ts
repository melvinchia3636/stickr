import cors from 'cors'
import express from 'express'

import { morgan } from './lib/logger'
import { registerRoutes } from './routes'

const app = express()

app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(morgan('sticker'))

registerRoutes(app)

const PORT = 3000

app.listen(PORT, () => {
  console.log(`Sticker converter server running on port ${PORT}`)
})

export { app }
