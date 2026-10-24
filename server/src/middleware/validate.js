export function validate(schemas) {
  return function validationMiddleware(request, response, next) {
    try {
      if (schemas.body) request.body = schemas.body.parse(request.body)
      if (schemas.query) request.query = schemas.query.parse(request.query)
      if (schemas.params) request.params = schemas.params.parse(request.params)
      if (schemas.headers) request.headers = schemas.headers.parse(request.headers)
      next()
    } catch (error) {
      next(error)
    }
  }
}
