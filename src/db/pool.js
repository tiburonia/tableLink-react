require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// 연결 에러 핸들링
pool.on('error', (err, client) => {
  console.error('❌ PostgreSQL 연결 풀 오류:', err);
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