const jwt = require('jsonwebtoken');

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
 * JWT 토큰 검증 (향후 확장용)
 * TODO: 실제 JWT 구현 시 다음 기능들 추가 예정:
 * - 토큰 만료 시간 검증
 * - 리프레시 토큰 지원
 * - 역할 기반 접근 제어 (RBAC)
 * - 매장별 권한 범위 제한
 */
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: {
        code: 'MISSING_TOKEN',
        message: '인증 토큰이 필요합니다'
      }
    });
  }

  try {
    // TODO: JWT 검증 로직 구현
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // req.user = decoded;
    // 
    // RBAC 예시:
    // if (!hasPermission(decoded.role, req.route.path, req.method)) {
    //   return res.status(403).json({ error: { code: 'INSUFFICIENT_PERMISSIONS' } });
    // }
    next();
  } catch (error) {
    return res.status(401).json({
      error: {
        code: 'INVALID_TOKEN',
        message: '유효하지 않은 토큰입니다'
      }
    });
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
  checkIdempotency
};