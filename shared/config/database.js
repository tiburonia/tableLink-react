
const { Pool } = require('pg');

// 환경 변수에서 데이터베이스 URL 가져오기
const databaseUrl = process.env.DATABASE_URL;

// 연결 풀 생성 (개선된 설정)
const pool = new Pool({
  connectionString: databaseUrl,
  max: 10, // 최대 연결 수
  idleTimeoutMillis: 30000, // 30초 후 유휴 연결 해제
  connectionTimeoutMillis: 10000, // 10초 연결 타임아웃
  acquireTimeoutMillis: 60000, // 60초 획득 타임아웃
  keepAlive: true, // 연결 유지
  keepAliveInitialDelayMillis: 0,
});

// 연결 오류 처리
pool.on('error', (err) => {
  console.error('❌ PostgreSQL Pool 오류:', err.message);
  console.log('🔄 연결을 재시도합니다...');
});

pool.on('connect', (client) => {
  console.log('✅ PostgreSQL 새 연결 생성');
});

pool.on('remove', () => {
  console.log('🔌 PostgreSQL 연결이 제거됨');
});

// 재시도 가능한 쿼리 함수
async function queryWithRetry(text, params, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await pool.query(text, params);
      return result;
    } catch (error) {
      console.error(`❌ 쿼리 실행 실패 (시도 ${attempt}/${maxRetries}):`, error.message);

      if (attempt === maxRetries) {
        throw error;
      }

      // 재시도 전 대기 (지수 백오프)
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`⏳ ${delay}ms 후 재시도...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// 초기 연결 테스트 (비동기)
(async () => {
  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL 데이터베이스 연결 성공');
    client.release();
  } catch (err) {
    console.error('❌ 초기 데이터베이스 연결 실패:', err.message);
  }
})();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 데이터베이스 연결 종료 중...');
  try {
    await pool.end();
    console.log('✅ 데이터베이스 연결 종료 완료');
  } catch (err) {
    console.error('❌ 데이터베이스 종료 중 오류:', err);
  }
  process.exit(0);
});

module.exports = pool;
module.exports.queryWithRetry = queryWithRetry;
