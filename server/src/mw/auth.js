const jwt = require('jsonwebtoken');
const { verifyAccessToken } = require('../utils/jwtUtils');

/**
 * 매장 스코프 인증 미들웨어
 * X-Store-Id 헤더를 읽어 req.storeId 설정
 */
function storeAuth(req, res, next) {
  const storeIdHeader = req.headers['x-store-id'];

  if (!storeIdHeader) {
    return res.status(400).json({
      message: 'X-Store-Id 헤더가 필요합니다',
      code: 'MISSING_STORE_ID'
    });
  }

  const storeId = parseInt(storeIdHeader, 10);

  if (isNaN(storeId) || storeId <= 0) {
    return res.status(400).json({
      message: '유효한 매장 ID가 필요합니다',
      code: 'INVALID_STORE_ID'
    });
  }

  req.storeId = storeId;
  next();
}

/**
 * JWT 토큰 검증 미들웨어
 * Authorization: Bearer {token} 헤더에서 토큰을 추출하고 검증
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: {
        code: 'MISSING_TOKEN',
        message: '인증 토큰이 필요합니다'
      }
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.message === 'TOKEN_EXPIRED') {
      return res.status(401).json({
        error: {
          code: 'TOKEN_EXPIRED',
          message: '토큰이 만료되었습니다'
        }
      });
    } else if (error.message === 'INVALID_TOKEN') {
      return res.status(401).json({
        error: {
          code: 'INVALID_TOKEN',
          message: '유효하지 않은 토큰입니다'
        }
      });
    } else {
      return res.status(401).json({
        error: {
          code: 'TOKEN_VERIFICATION_FAILED',
          message: '토큰 검증에 실패했습니다'
        }
      });
    }
  }
}

/**
 * 선택적 JWT 인증 미들웨어
 * 토큰이 있으면 검증하고, 없어도 통과시킴 (게스트 접근 허용)
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    req.user = null;
    next();
  }
}

/**
 * Idempotency 키 검증
 */
function checkIdempotency(req, res, next) {
  const idempotencyKey = req.headers['idempotency-key'];

  if (!idempotencyKey) {
    return res.status(400).json({
      message: 'Idempotency-Key 헤더가 필요합니다',
      code: 'MISSING_IDEMPOTENCY_KEY'
    });
  }

  req.idempotencyKey = idempotencyKey;
  next();
}

module.exports = {
  storeAuth,
  verifyToken,
  optionalAuth,
  checkIdempotency
};