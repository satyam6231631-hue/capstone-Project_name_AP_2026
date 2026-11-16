function errorMiddleware(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500;

  res.status(statusCode).json({
    error: err.message || "Internal server error"
  });
}

module.exports = errorMiddleware;
