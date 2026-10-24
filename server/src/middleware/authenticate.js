import { query } from '../config/pg.js'
import { verifyAccessToken } from '../utils/tokens.js'
import { AppError } from '../utils/AppError.js'

export async function authenticate(request, response, next) {
  try {
    const accessToken = request.cookies?.accessToken

    if (!accessToken) {
      throw new AppError('Authentication required', 401)
    }

    const payload = verifyAccessToken(accessToken)
    const userId = Number(payload.sub)
    const result = await query(`
      SELECT "id", "name", "email", "phone", "role"
      FROM "User"
      WHERE "id" = $1
    `, [userId])
    const user = result.rows[0]

    if (!user) {
      throw new AppError('Authentication required', 401)
    }

    request.user = user
    next()
  } catch (error) {
    if (error instanceof AppError) {
      next(error)
      return
    }

    next(new AppError('Authentication required', 401))
  }
}
