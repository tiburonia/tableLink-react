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
  // 이미 응답이 전송된 경우 Express 기본 에러 핸들러로 위임
  if (res.headersSent) {
    return next(error);
  }

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

  // 표준화된 에러 응답 구조
  const response = {
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message,
      timestamp: new Date().toISOString()
    }
  };

  // 개발 환경에서만 추가 정보 포함
  if (process.env.NODE_ENV === 'development') {
    response.error.details = {
      stack: error.stack,
      detail: error.detail,
      url: req.originalUrl,
      method: req.method
    };
  }

  // 상세한 에러 로깅 (개발/운영 환경 모두)
  console.error('\n=== 📍 에러 발생 ===');
  console.error(`🌐 URL: ${req.method} ${req.originalUrl}`);
  console.error(`📊 Status: ${statusCode}`);
  console.error(`💬 Message: ${error.message}`);
  console.error(`🔍 Code: ${error.code || 'N/A'}`);

  // PostgreSQL 상세 에러 정보
  if (error.detail) {
    console.error(`📋 Detail: ${error.detail}`);
  }
  if (error.hint) {
    console.error(`💡 Hint: ${error.hint}`);
  }
  if (error.position) {
    console.error(`📍 Position: ${error.position}`);
  }

  // 스택 트레이스 출력 (항상)
  if (error.stack) {
    console.error('📚 Stack Trace:');
    console.error(error.stack);
  }

  // 요청 본문 로깅 (POST/PUT 요청시)
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
    console.error('📦 Request Body:', JSON.stringify(req.body, null, 2));
  }

  console.error('=== 📍 에러 종료 ===\n');

  res.status(statusCode).json(response);
}

module.exports = { notFound, errorHandler };