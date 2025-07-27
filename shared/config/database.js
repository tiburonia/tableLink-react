
const { Pool } = require('pg');

// 환경 변수에서 데이터베이스 URL 가져오기
const databaseUrl = process.env.DATABASE_URL;

// 연결 풀 생성
const pool = new Pool({
  connectionString: databaseUrl,
  max: 10, // 최대 연결 수
});

// 데이터베이스 연결 테스트
pool.connect((err, client, release) => {
  if (err) {
    return console.error('데이터베이스 연결 실패:', err);
  }
  console.log('✅ PostgreSQL 데이터베이스 연결 성공');
  release();
});

module.exports = pool;
