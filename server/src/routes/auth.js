import express from 'express'
import bcrypt from 'bcryptjs'
import prisma from '../lib/prisma.js'
import { signToken } from '../utils/jwt.js'
import { authenticate } from '../middleware/auth.js'
import { successResponse, errorResponse } from '../utils/response.js'

const router = express.Router()

// ─── POST /api/auth/register ─────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body

    if (!username || !email || !password) {
      return errorResponse(res, 'username, email, and password are required', 400)
    }

    if (password.length < 6) {
      return errorResponse(res, 'Password must be at least 6 characters', 400)
    }

    // Check uniqueness
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    })
    if (existing) {
      const field = existing.email === email ? 'Email' : 'Username'
      return errorResponse(res, `${field} already in use`, 409)
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: { username, email, password: hashedPassword },
      select: { id: true, username: true, email: true, avatar: true, bio: true, createdAt: true },
    })

    const token = signToken(user.id)

    return successResponse(res, { user, token }, 'Account created successfully', 201)
  } catch (err) {
    console.error('[AUTH REGISTER]', err)
    return errorResponse(res, 'Registration failed', 500)
  }
})

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return errorResponse(res, 'Email and password are required', 400)
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return errorResponse(res, 'Invalid credentials', 401)

    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) return errorResponse(res, 'Invalid credentials', 401)

    const token = signToken(user.id)

    const { password: _, ...safeUser } = user

    return successResponse(res, { user: safeUser, token }, 'Login successful')
  } catch (err) {
    console.error('[AUTH LOGIN]', err)
    return errorResponse(res, 'Login failed', 500)
  }
})

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', authenticate, async (req, res) => {
  try {
    return successResponse(res, { user: req.user }, 'Authenticated user')
  } catch (err) {
    console.error('[AUTH ME]', err)
    return errorResponse(res, 'Could not fetch user', 500)
  }
})

export default router
