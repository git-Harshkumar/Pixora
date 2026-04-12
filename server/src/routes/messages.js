import express from 'express'
import prisma from '../lib/prisma.js'
import { authenticate } from '../middleware/auth.js'
import { successResponse, errorResponse } from '../utils/response.js'

const router = express.Router()

// ─── GET /api/messages/:userId ────────────────────────────────────────────────
// Fetch full message history between the logged-in user and another user
router.get('/:userId', authenticate, async (req, res) => {
  try {
    const currentUserId = req.user.id
    const otherUserId = req.params.userId

    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId },
      select: { id: true, username: true, avatar: true },
    })
    if (!otherUser) return errorResponse(res, 'User not found', 404)

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: currentUserId },
        ],
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        text: true,
        createdAt: true,
        read: true,
        sender: { select: { id: true, username: true, avatar: true } },
        receiver: { select: { id: true, username: true, avatar: true } },
      },
    })

    // Mark unread messages as read
    await prisma.message.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: currentUserId,
        read: false,
      },
      data: { read: true },
    })

    return successResponse(res, { messages, otherUser })
  } catch (err) {
    console.error('[MESSAGES GET]', err)
    return errorResponse(res, 'Could not fetch messages', 500)
  }
})

// ─── GET /api/messages (conversations list) ───────────────────────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id

    // Find all unique conversations
    const rawMessages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        text: true,
        createdAt: true,
        read: true,
        sender: { select: { id: true, username: true, avatar: true } },
        receiver: { select: { id: true, username: true, avatar: true } },
      },
    })

    // Build unique conversation map (keyed by other user's id)
    const conversationMap = new Map()
    for (const msg of rawMessages) {
      const other = msg.senderId === userId ? msg.receiver : msg.sender
      const otherId = other.id
      if (!conversationMap.has(otherId)) {
        conversationMap.set(otherId, {
          user: other,
          lastMessage: msg,
          unreadCount: 0,
        })
      }
      if (!msg.read && msg.receiverId === userId) {
        conversationMap.get(otherId).unreadCount++
      }
    }

    const conversations = Array.from(conversationMap.values())

    return successResponse(res, { conversations })
  } catch (err) {
    console.error('[MESSAGES LIST]', err)
    return errorResponse(res, 'Could not fetch conversations', 500)
  }
})

export default router
