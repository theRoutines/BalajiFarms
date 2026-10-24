import { AppError } from '../utils/AppError.js'

export function requireRole(...roles) {
  return function roleMiddleware(request, response, next) {
    if (!request.user || !roles.includes(request.user.role)) {
      next(new AppError('You do not have permission to access this resource', 403))
      return
    }

    next()
  }
}
