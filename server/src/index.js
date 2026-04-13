import 'dotenv/config'
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'

import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import postRoutes from './routes/posts.js'
import messageRoutes from './routes/messages.js'
import { initSocket } from './socket/index.js'

/** Comma-separated list, e.g. https://app.vercel.app,https://*.vercel.app not supported — list each preview host or use one production URL */
const clientOrigins = (process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

const isProd = process.env.NODE_ENV === 'production'
const isLocalhostOrigin = (origin) =>
  typeof origin === 'string' && /^https?:\/\/localhost(:\d+)?$/.test(origin)

const corsOrigin =
  clientOrigins.length === 0
    ? true
    : (origin, cb) => {
        if (!origin) return cb(null, true)
        if (!isProd && isLocalhostOrigin(origin)) return cb(null, true)
        if (clientOrigins.includes(origin)) return cb(null, true)
        else cb(new Error(`CORS blocked origin: ${origin}`))
      }

const app = express()
const httpServer = createServer(app)

// ── Socket.IO ──────────────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
initSocket(io)
app.set('io', io)

// ── Global Middleware ──────────────────────────────────────────────────────────
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
)
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(compression())
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// ── Health Check ───────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Pixora API is running' })
})

// ── API Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/messages', messageRoutes)

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` })
})

// ── Global Error Handler ───────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[GLOBAL ERROR]', err)
  const status = err.status || 500
  res.status(status).json({ success: false, message: err.message || 'Internal server error' })
})

// ── Start Server ───────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 5000

httpServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n[SERVER] Port ${PORT} is already in use.`)
    console.error(`[SERVER] Stop the other process or change PORT, then restart.\n`)
    return
  }
  console.error('\n[SERVER] Failed to start:', err)
})

httpServer.listen(PORT, () => {
  console.log(`\n Pixora server running on http://localhost:${PORT}`)
  console.log(` Socket.IO ready`)
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}\n`)
}) 