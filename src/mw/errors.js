
/**
 * 404 Not Found 핸들러
 */
function notFound(req, res, next) {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
}

/**
 * 에러 핸들러 미들웨어
 */
function errorHandler(error, req, res, next) {
  let statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  
  // PostgreSQL 에러 코드 매핑
  if (error.code) {
    switch (error.code) {
      case '23505': // unique_violation
        statusCode = 409;
        break;
      case '23503': // foreign_key_violation
        statusCode = 400;
        break;
      case '23514': // check_violation
        statusCode = 400;
        break;
      case '42P01': // undefined_table
        statusCode = 500;
        break;
      default:
        statusCode = 500;
    }
  }

  // 개발 환경에서만 스택 트레이스 포함
  const response = {
    message: error.message,
    code: error.code || 'INTERNAL_ERROR',
    timestamp: new Date().toISOString()
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
    response.details = error.detail;
  }

  console.error('❌ 에러 발생:', {
    url: req.originalUrl,
    method: req.method,
    statusCode,
    message: error.message,
    code: error.code
  });

  res.status(statusCode).json(response);
}

module.exports = { notFound, errorHandler };
