import express from 'express'
import prisma from '../lib/prisma.js'
import { authenticate } from '../middleware/auth.js'
import { successResponse, errorResponse } from '../utils/response.js'
import { uploadImage } from '../utils/cloudinary.js'
import upload from '../middleware/upload.js'

const router = express.Router()

// Shared post select fields
const postSelect = {
  id: true,
  imageUrl: true,
  caption: true,
  createdAt: true,
  author: {
    select: { id: true, username: true, avatar: true },
  },
  _count: {
    select: { likes: true, comments: true },
  },
}

// ─── GET /api/posts/feed ──────────────────────────────────────────────────────
// Cursor-based pagination: ?cursor=<postId>&limit=10
router.get('/feed', authenticate, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10
    const cursor = req.query.cursor || undefined

    // Get IDs of users the current user is following
    const following = await prisma.follow.findMany({
      where: { followerId: req.user.id },
      select: { followingId: true },
    })
    const followingIds = following.map((f) => f.followingId)

    // Include own posts in feed
    const authorIds = [...followingIds, req.user.id]

    const posts = await prisma.post.findMany({
      where: { authorId: { in: authorIds } },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      select: {
        ...postSelect,
        likes: {
          where: { userId: req.user.id },
          select: { id: true },
        },
      },
    })

    const hasNextPage = posts.length > limit
    const items = hasNextPage ? posts.slice(0, -1) : posts
    const nextCursor = hasNextPage ? items[items.length - 1].id : null

    // Flatten: add isLiked boolean
    const feed = items.map((p) => ({
      ...p,
      isLiked: p.likes.length > 0,
      likes: undefined,
    }))

    return successResponse(res, { feed, nextCursor })
  } catch (err) {
    console.error('[POSTS FEED]', err)
    return errorResponse(res, 'Could not load feed', 500)
  }
})

// ─── POST /api/posts ──────────────────────────────────────────────────────────
router.post('/', authenticate, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return errorResponse(res, 'Image is required', 400)

    const imageUrl = await uploadImage(req.file.buffer, 'pixora/posts')
    const { caption } = req.body

    const post = await prisma.post.create({
      data: {
        imageUrl,
        caption: caption || null,
        authorId: req.user.id,
      },
      select: postSelect,
    })

    return successResponse(res, { post }, 'Post created', 201)
  } catch (err) {
    console.error('[POSTS CREATE]', err)
    return errorResponse(res, 'Could not create post', 500)
  }
})

// ─── DELETE /api/posts/:id ────────────────────────────────────────────────────
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const post = await prisma.post.findUnique({ where: { id: req.params.id } })
    if (!post) return errorResponse(res, 'Post not found', 404)
    if (post.authorId !== req.user.id) return errorResponse(res, 'Forbidden', 403)

    await prisma.post.delete({ where: { id: req.params.id } })

    return successResponse(res, {}, 'Post deleted')
  } catch (err) {
    console.error('[POSTS DELETE]', err)
    return errorResponse(res, 'Could not delete post', 500)
  }
})

// ─── POST /api/posts/:id/like ──────────────────────────────────────────────────
router.post('/:id/like', authenticate, async (req, res) => {
  try {
    const postId = req.params.id
    const userId = req.user.id

    const post = await prisma.post.findUnique({ where: { id: postId } })
    if (!post) return errorResponse(res, 'Post not found', 404)

    const existing = await prisma.like.findUnique({
      where: { userId_postId: { userId, postId } },
    })

    if (existing) {
      await prisma.like.delete({ where: { userId_postId: { userId, postId } } })
      return successResponse(res, { liked: false }, 'Post unliked')
    } else {
      await prisma.like.create({ data: { userId, postId } })
      return successResponse(res, { liked: true }, 'Post liked')
    }
  } catch (err) {
    console.error('[POSTS LIKE]', err)
    return errorResponse(res, 'Like action failed', 500)
  }
})

// ─── POST /api/posts/:id/comment ──────────────────────────────────────────────
router.post('/:id/comment', authenticate, async (req, res) => {
  try {
    const postId = req.params.id
    const { text } = req.body

    if (!text || !text.trim()) return errorResponse(res, 'Comment text is required', 400)

    const post = await prisma.post.findUnique({ where: { id: postId } })
    if (!post) return errorResponse(res, 'Post not found', 404)

    const comment = await prisma.comment.create({
      data: { text: text.trim(), userId: req.user.id, postId },
      select: {
        id: true,
        text: true,
        createdAt: true,
        user: { select: { id: true, username: true, avatar: true } },
      },
    })

    return successResponse(res, { comment }, 'Comment added', 201)
  } catch (err) {
    console.error('[POSTS COMMENT]', err)
    return errorResponse(res, 'Could not add comment', 500)
  }
})

// ─── GET /api/posts/:id/comments ──────────────────────────────────────────────
router.get('/:id/comments', async (req, res) => {
  try {
    const postId = req.params.id

    const comments = await prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        text: true,
        createdAt: true,
        user: { select: { id: true, username: true, avatar: true } },
      },
    })

    return successResponse(res, { comments })
  } catch (err) {
    console.error('[POSTS GET COMMENTS]', err)
    return errorResponse(res, 'Could not fetch comments', 500)
  }
})

export default router
