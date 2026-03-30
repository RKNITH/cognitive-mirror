export const errorHandler = (err, req, res, next) => {
  const status = err.statusCode || 500;
  console.error('[Error]', err.message);
  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
};

export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}
