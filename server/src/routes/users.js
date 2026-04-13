import express from 'express'
import prisma from '../lib/prisma.js'
import { authenticate, optionalAuthenticate } from '../middleware/auth.js'
import { successResponse, errorResponse } from '../utils/response.js'
import { uploadImage } from '../utils/cloudinary.js'
import upload from '../middleware/upload.js'

const router = express.Router()

// ─── GET /api/users/:username/followers ────────────────────────────────────────
router.get('/:username/followers', optionalAuthenticate, async (req, res) => {
  try {
    const { username } = req.params
    const user = await prisma.user.findUnique({ where: { username }, select: { id: true } })
    if (!user) return errorResponse(res, 'User not found', 404)

    const followers = await prisma.follow.findMany({
      where: { followingId: user.id },
      orderBy: { follower: { username: 'asc' } },
      select: {
        follower: {
          select: {
            id: true,
            username: true,
            avatar: true,
            bio: true,
            _count: { select: { followers: true } },
          },
        },
      },
    })

    return successResponse(res, { followers: followers.map((f) => f.follower) })
  } catch (err) {
    console.error('[USERS GET FOLLOWERS]', err)
    return errorResponse(res, 'Could not fetch followers', 500)
  }
})

// ─── GET /api/users/:username/following ────────────────────────────────────────
router.get('/:username/following', optionalAuthenticate, async (req, res) => {
  try {
    const { username } = req.params
    const user = await prisma.user.findUnique({ where: { username }, select: { id: true } })
    if (!user) return errorResponse(res, 'User not found', 404)

    const following = await prisma.follow.findMany({
      where: { followerId: user.id },
      orderBy: { following: { username: 'asc' } },
      select: {
        following: {
          select: {
            id: true,
            username: true,
            avatar: true,
            bio: true,
            _count: { select: { followers: true } },
          },
        },
      },
    })

    return successResponse(res, { following: following.map((f) => f.following) })
  } catch (err) {
    console.error('[USERS GET FOLLOWING]', err)
    return errorResponse(res, 'Could not fetch following', 500)
  }
})

// ─── GET /api/users/:username ─────────────────────────────────────────────────
router.get('/:username', optionalAuthenticate, async (req, res) => {
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

    const viewerId = req.user?.id
    let isFollowing = false
    if (viewerId && viewerId !== user.id) {
      const existing = await prisma.follow.findUnique({
        where: {
          followerId_followingId: { followerId: viewerId, followingId: user.id },
        },
        select: { followerId: true },
      })
      isFollowing = !!existing
    }

    return successResponse(res, { user: { ...user, isFollowing } })
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
      const io = req.app.get('io')
      io?.to(followingId).emit('follow:request', {
        from: { id: req.user.id, username: req.user.username, avatar: req.user.avatar },
      })
      const delivered = !!io?.sockets?.adapter?.rooms?.get(followingId)?.size
      return successResponse(
        res,
        { following: true, followRequestDelivered: delivered },
        delivered ? 'Followed successfully' : 'Followed (user is offline)'
      )
    }
  } catch (err) {
    console.error('[USERS FOLLOW]', err)
    return errorResponse(res, 'Follow action failed', 500)
  }
})

export default router
