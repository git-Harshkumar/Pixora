import express from 'express'
import prisma from '../lib/prisma.js'
import { authenticate } from '../middleware/auth.js'
import { successResponse, errorResponse } from '../utils/response.js'
import { uploadImage } from '../utils/cloudinary.js'
import upload from '../middleware/upload.js'

const router = express.Router()

// ─── GET /api/users/:username ─────────────────────────────────────────────────
router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        avatar: true,
        bio: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
          },
        },
        posts: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            imageUrl: true,
            caption: true,
            createdAt: true,
            _count: { select: { likes: true, comments: true } },
          },
        },
      },
    })

    if (!user) return errorResponse(res, 'User not found', 404)

    return successResponse(res, { user })
  } catch (err) {
    console.error('[USERS GET PROFILE]', err)
    return errorResponse(res, 'Could not fetch profile', 500)
  }
})

// ─── PUT /api/users/me ────────────────────────────────────────────────────────
router.put('/me', authenticate, upload.single('avatar'), async (req, res) => {
  try {
    const { bio, removeAvatar } = req.body
    let avatarUrl
    let avatarData = {}

    if (req.file) {
      avatarUrl = await uploadImage(req.file.buffer, 'pixora/avatars')
      avatarData = { avatar: avatarUrl }
    } else if (removeAvatar === 'true') {
      avatarData = { avatar: null }
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(bio !== undefined && { bio }),
        ...avatarData,
      },
      select: {
        id: true, username: true, email: true,
        avatar: true, bio: true, createdAt: true,
      },
    })

    return successResponse(res, { user: updated }, 'Profile updated')
  } catch (err) {
    console.error('[USERS UPDATE ME]', err)
    return errorResponse(res, 'Could not update profile', 500)
  }
})

// ─── POST /api/users/:id/follow ───────────────────────────────────────────────
router.post('/:id/follow', authenticate, async (req, res) => {
  try {
    const followingId = req.params.id
    const followerId = req.user.id

    if (followerId === followingId) {
      return errorResponse(res, 'You cannot follow yourself', 400)
    }

    const target = await prisma.user.findUnique({ where: { id: followingId } })
    if (!target) return errorResponse(res, 'User not found', 404)

    // Toggle follow
    const existing = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    })

    if (existing) {
      await prisma.follow.delete({
        where: { followerId_followingId: { followerId, followingId } },
      })
      return successResponse(res, { following: false }, 'Unfollowed successfully')
    } else {
      await prisma.follow.create({ data: { followerId, followingId } })
      return successResponse(res, { following: true }, 'Followed successfully')
    }
  } catch (err) {
    console.error('[USERS FOLLOW]', err)
    return errorResponse(res, 'Follow action failed', 500)
  }
})

export default router
