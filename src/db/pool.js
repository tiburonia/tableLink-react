require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // 최대 연결 수
  idleTimeoutMillis: 30000, // 유휴 연결 타임아웃 (30초)
  connectionTimeoutMillis: 5000, // 연결 타임아웃 (5초)
  statement_timeout: 10000, // 쿼리 실행 타임아웃 (10초)
  query_timeout: 10000, // 쿼리 타임아웃 (10초)
});

// 연결 오류 처리
pool.on('error', (err) => {
  console.error('❌ PostgreSQL 풀 오류:', err);
});

// 연결 성공 로그
pool.on('connect', () => {
  console.log('🔌 새 PostgreSQL 연결 생성됨');
});

// 연결 테스트 함수
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL 연결 테스트 성공');
    client.release();
  } catch (err) {
    console.error('❌ PostgreSQL 연결 테스트 실패:', err);
  }
}

// 재시도 가능한 쿼리 실행 함수
async function queryWithRetry(text, params, maxRetries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await pool.query(text, params);
      return result;
    } catch (error) {
      lastError = error;

      // 연결 관련 오류인 경우에만 재시도
      if (error.code === 'ECONNRESET' || 
          error.code === 'ENOTFOUND' || 
          error.code === 'ETIMEDOUT' ||
          error.message.includes('Connection terminated') ||
          error.message.includes('timeout')) {

        console.warn(`⚠️ PostgreSQL 쿼리 실패 (시도 ${attempt}/${maxRetries}):`, error.message);

        if (attempt < maxRetries) {
          // 지수 백오프로 재시도 대기
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }

      // 재시도하지 않을 오류이거나 최대 재시도 횟수 도달
      throw error;
    }
  }

  throw lastError;
}

// 초기 연결 테스트
testConnection();

module.exports = pool;
module.exports.queryWithRetry = queryWithRetry;