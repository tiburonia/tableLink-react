require('dotenv').config();
const { createServer } = require('http');
const { Server } = require('socket.io');
const { Pool } = require('pg');
const app = require('./app');
const setupSocketHandlers = require('./socket/handlers');
const initializeServices = require('./services/init');

const PORT = process.env.PORT || 3000;

// Database pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// 데이터베이스 라우트에 Pool 전달
const databaseRoutes = require('./routes/database');
databaseRoutes.setPool(pool);

// Create HTTP server and Socket.IO
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// WebSocket 인스턴스를 전역으로 설정 (라우터에서 사용)
global.io = io;

// 소켓 핸들러 설정
setupSocketHandlers(io, pool);

// 이벤트 기반 서비스 초기화
initializeServices();  

// Unhandled Promise Rejection 방지
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

// Start Server
server.listen(PORT, '0.0.0.0', () => {
  console.log('\n=== 🚀 TableLink 서버 시작 ===');
  console.log(`📍 포트: ${PORT}`);
  console.log(`🌐 로컬: http://localhost:${PORT}`);
  console.log(`🌍 개발서버: https://[프로젝트ID].replit.dev (Webview 참고)`);
  console.log(`🔧 환경: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 메모리: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
  console.log('🏗️ 시스템: POS/TLL/KRP 통합');
  console.log('🔌 WebSocket: 활성화');
  console.log('📡 PostgreSQL: 연결됨');
  console.log('=== ✅ 서버 준비 완료 ===\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 서버 종료 중...');
  io.close(() => {
    console.log('👋 Socket.IO 서버 종료됨.');
    pool.end().then(() => {
      console.log('👋 PostgreSQL 풀 종료됨.');
      process.exit(0);
    }).catch(err => {
      console.error('❌ PostgreSQL 풀 종료 오류:', err);
      process.exit(1);
    });
  });
});

process.on('SIGINT', () => {
  console.log('👋 서버 종료 중...');
  io.close(() => {
    console.log('👋 Socket.IO 서버 종료됨.');
    pool.end().then(() => {
      console.log('👋 PostgreSQL 풀 종료됨.');
      process.exit(0);
    }).catch(err => {
      console.error('❌ PostgreSQL 풀 종료 오류:', err);
      process.exit(1);
    });
  });
});