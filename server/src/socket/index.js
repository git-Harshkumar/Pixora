import { verifyToken } from '../utils/jwt.js'
import prisma from '../lib/prisma.js'

/**
 * Initialise Socket.IO handlers on a given `io` instance.
 * @param {import('socket.io').Server} io
 */
export const initSocket = (io) => {
  // ── JWT Auth Middleware ──────────────────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token

      if (!token) {
        return next(new Error('Authentication required'))
      }

      const payload = verifyToken(token)
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, username: true, avatar: true },
      })

      if (!user) return next(new Error('User not found'))

      socket.user = user
      next()
    } catch (err) {
      next(new Error('Invalid or expired token'))
    }
  })

  // ── Connection Handler ───────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    const { id: userId, username } = socket.user

    // Join personal room so others can address this user by ID
    socket.join(userId)
    console.log(`[SOCKET] ${username} connected (${socket.id})`)

    // ── message:send ───────────────────────────────────────────────────────────
    socket.on('message:send', async ({ receiverId, text }) => {
      try {
        if (!receiverId || !text?.trim()) return

        // Persist to database
        const message = await prisma.message.create({
          data: {
            text: text.trim(),
            senderId: userId,
            receiverId,
          },
          select: {
            id: true,
            text: true,
            createdAt: true,
            read: true,
            sender: { select: { id: true, username: true, avatar: true } },
            receiver: { select: { id: true, username: true, avatar: true } },
          },
        })

        // Emit to receiver's room
        io.to(receiverId).emit('message:receive', { message })

        // Emit back to sender (for confirmation / multi-tab support)
        socket.emit('message:receive', { message })
      } catch (err) {
        console.error('[SOCKET message:send]', err)
        socket.emit('error', { message: 'Failed to send message' })
      }
    })

    // ── typing:start ───────────────────────────────────────────────────────────
    socket.on('typing:start', ({ receiverId }) => {
      if (!receiverId) return
      io.to(receiverId).emit('typing:indicator', {
        senderId: userId,
        username,
        typing: true,
      })
    })

    // ── typing:stop ────────────────────────────────────────────────────────────
    socket.on('typing:stop', ({ receiverId }) => {
      if (!receiverId) return
      io.to(receiverId).emit('typing:indicator', {
        senderId: userId,
        username,
        typing: false,
      })
    })

    // ── disconnect ─────────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`[SOCKET] ${username} disconnected (${socket.id})`)
    })
  })
}
