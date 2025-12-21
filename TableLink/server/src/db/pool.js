require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 20,
  acquireTimeoutMillis: 60000,
  createTimeoutMillis: 30000,
  destroyTimeoutMillis: 5000,
  reapIntervalMillis: 1000,
  createRetryIntervalMillis: 200
});

// 연결 오류 처리
pool.on('error', (err) => {
  console.error('❌ PostgreSQL Pool 오류:', err);
});

pool.on('connect', () => {
  console.log('✅ PostgreSQL 연결 성공');
});

// 재시도 가능한 쿼리 함수
async function queryWithRetry(text, params, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔌 새 PostgreSQL 연결 생성됨`);
      const result = await pool.query(text, params);
      return result;
    } catch (error) {
      console.error(`❌ 쿼리 실행 실패 (시도 ${attempt}/${maxRetries}):`, error.message);

      if (attempt === maxRetries) {
        throw error;
      }

      // 재시도 전 대기 (백오프)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
    }
  }
}

// 연결 테스트
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ PostgreSQL 연결 실패:', err.stack);
  } else {
    console.log('✅ PostgreSQL 연결 테스트 성공');
    release();
  }
});

module.exports = pool;
module.exports.queryWithRetry = queryWithRetry;