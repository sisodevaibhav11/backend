const asyncHandler = (RequestHandler) => {
  return (req, res, next) => {               // Wraps an async request handler to catch errors
    Promise.resolve(RequestHandler(req, res, next)).catch(err => next(err));
  };
}
export { asyncHandler };