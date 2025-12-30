const jwt = require('jsonwebtoken');

/**
 * JWT 유틸리티 함수
 * 토큰 생성, 검증, 리프레시 기능 제공
 */

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-dev';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-for-dev';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * Access Token 생성
 * @param {Object} payload - 토큰에 포함할 사용자 정보 (userId, id, role 등)
 * @returns {string} JWT access token
 */
function generateAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'tablelink-server'
  });
}

/**
 * Refresh Token 생성
 * @param {Object} payload - 토큰에 포함할 사용자 정보 (userId만 포함)
 * @returns {string} JWT refresh token
 */
function generateRefreshToken(payload) {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
    issuer: 'tablelink-server'
  });
}

/**
 * Access Token 검증
 * @param {string} token - 검증할 JWT token
 * @returns {Object} 디코딩된 payload
 * @throws {Error} 토큰이 유효하지 않을 경우 에러 발생
 */
function verifyAccessToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('TOKEN_EXPIRED');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('INVALID_TOKEN');
    } else {
      throw new Error('TOKEN_VERIFICATION_FAILED');
    }
  }
}

/**
 * Refresh Token 검증
 * @param {string} token - 검증할 JWT refresh token
 * @returns {Object} 디코딩된 payload
 * @throws {Error} 토큰이 유효하지 않을 경우 에러 발생
 */
function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('REFRESH_TOKEN_EXPIRED');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('INVALID_REFRESH_TOKEN');
    } else {
      throw new Error('REFRESH_TOKEN_VERIFICATION_FAILED');
    }
  }
}

/**
 * 토큰 디코딩 (검증 없이)
 * @param {string} token - 디코딩할 JWT token
 * @returns {Object} 디코딩된 payload
 */
function decodeToken(token) {
  return jwt.decode(token);
}

/**
 * 토큰 쌍 생성 (access + refresh)
 * @param {Object} user - 사용자 정보
 * @returns {Object} { accessToken, refreshToken }
 */
function generateTokenPair(user) {
  const accessPayload = {
    userId: user.userId || user.user_id,
    id: user.id,
    name: user.name,
    phone: user.phone,
    role: user.role || 'user'
  };

  const refreshPayload = {
    userId: user.userId || user.user_id
  };

  return {
    accessToken: generateAccessToken(accessPayload),
    refreshToken: generateRefreshToken(refreshPayload)
  };
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  generateTokenPair
};
