const asyncHandler = (RequestHandler) => (req, res, next) => {
  Promise.resolve(RequestHandler(req, res, next)).catch(err => next(err));
};

export { asyncHandler };