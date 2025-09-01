require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 3, // 더 보수적인 연결 수
  idleTimeoutMillis: 5000, // 더 빠른 idle 시간
  connectionTimeoutMillis: 3000, // 짧은 연결 타임아웃
  allowExitOnIdle: true, // idle 시 연결 종료 허용
  application_name: 'tablelink_app' // 앱 식별
});

// 연결 테스트
pool.on('connect', () => {
  console.log('✅ PostgreSQL 연결 성공');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL 연결 오류:', err);
  if (err.code === 'ECONNRESET' || err.code === 'ENOTFOUND') {
    console.log('🔄 연결 재시도 준비 중...');
  }
});

// 연결 종료 시 정리
process.on('SIGINT', async () => {
  console.log('🛑 서버 종료 중...');
  try {
    await pool.end();
    console.log('✅ PostgreSQL 풀 정리 완료');
  } catch (err) {
    console.error('❌ 풀 정리 중 오류:', err);
  }
  process.exit(0);
});

// 쿼리 헬퍼 함수
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('🔍 쿼리 실행:', { text: text.substring(0, 100), duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('❌ 쿼리 실행 실패:', { text: text.substring(0, 100), error: error.message });
    throw error;
  }
};

module.exports = pool;