require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: (process.env.NODE_ENV === 'production' || (process.env.DATABASE_URL || '').includes('sslmode=require'))
    ? { rejectUnauthorized: false }
    : false,
});

pool.on('error', (err) => {
  console.error('❌ 데이터베이스 풀 에러:', err);
});

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

module.exports = { pool, JWT_SECRET };
