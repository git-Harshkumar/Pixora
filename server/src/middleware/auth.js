import { verifyToken } from '../utils/jwt.js'
import prisma from '../lib/prisma.js'
import { errorResponse } from '../utils/response.js'

/**
 * Middleware: verify Bearer JWT and attach req.user
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'No token provided', 401)
    }

    const token = authHeader.split(' ')[1]
    const payload = verifyToken(token)

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        bio: true,
        createdAt: true,
      },
    })

    if (!user) return errorResponse(res, 'User not found', 401)

    req.user = user
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return errorResponse(res, 'Token expired', 401)
    }
    return errorResponse(res, 'Invalid token', 401)
  }
}

/**
 * Middleware: optionally attach req.user if Bearer JWT is valid.
 * Never blocks the request when token is missing/invalid.
 */
export const optionalAuthenticate = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) return next()

    const token = authHeader.split(' ')[1]
    const payload = verifyToken(token)

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        bio: true,
        createdAt: true,
      },
    })

    if (user) req.user = user
  } catch {
    // ignore
  } finally {
    next()
  }
}
