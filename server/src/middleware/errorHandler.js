import { ZodError } from 'zod'

export function notFoundHandler(request, response) {
  response.status(404).json({
    success: false,
    message: 'Route not found',
  })
}

export function errorHandler(error, request, response, next) {
  if (response.headersSent) {
    next(error)
    return
  }

  if (error instanceof ZodError) {
    const errors = error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }))
    response.status(400).json({ success: false, message: 'Validation failed', errors })
    return
  }

  if (error?.name === 'AppError') {
    const body = { success: false, message: error.message }
    if (error.errors) body.errors = error.errors
    response.status(error.statusCode).json(body)
    return
  }

  if (error?.code === '23505') {
    response.status(409).json({ success: false, message: 'A record with these details already exists' })
    return
  }

  if (error?.code === '23503') {
    response.status(409).json({ success: false, message: 'The related record does not exist or cannot be removed' })
    return
  }

  console.error(error)
  response.status(500).json({ success: false, message: 'Something went wrong' })
}
