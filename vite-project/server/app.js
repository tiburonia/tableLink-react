require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { pool } = require('./config/database');

const app = express();

// Middleware
app.use(cors())
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 테스트 엔드포인트
app.get('/', (req, res) => {
  res.send('Hello from TableLink API Server!');
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API Routes - 레이어드 아키텍처
app.use('/api/db', routes);

// 404 핸들러
app.use((req, res) => {
  res.status(404).json({ error: '엔드포인트를 찾을 수 없습니다' });
});

// Graceful Shutdown
process.on('SIGTERM', async () => {
  console.log('⏹️  SIGTERM 신호 수신, 서버 종료 중...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('⏹️  SIGINT 신호 수신, 서버 종료 중...');
  await pool.end();
  process.exit(0);
});

module.exports = { app, pool };
