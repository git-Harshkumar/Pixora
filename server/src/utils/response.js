/**
 * Standardised API response helper.
 * All responses follow: { success, data, message }
 */

export const successResponse = (res, data = {}, message = 'OK', statusCode = 200) => {
  return res.status(statusCode).json({ success: true, data, message })
}

export const errorResponse = (res, message = 'Something went wrong', statusCode = 500, data = {}) => {
  return res.status(statusCode).json({ success: false, data, message })
}
