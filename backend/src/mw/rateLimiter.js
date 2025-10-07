const rateLimit = require('express-rate-limit');

/**
 * API Rate Limiter 설정
 * 클라이언트당 15분에 최대 100개 요청
 */
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // 최대 요청 수
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '너무 많은 요청을 보냈습니다. 잠시 후 다시 시도해주세요.'
    }
  },
  standardHeaders: true, // `RateLimit-*` 헤더 반환
  legacyHeaders: false // `X-RateLimit-*` 헤더 비활성화
});

module.exports = { rateLimiter };
