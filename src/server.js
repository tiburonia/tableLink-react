require('dotenv').config();
const { createServer } = require('http');
const { Server } = require('socket.io');
const { Pool } = require('pg');
const express = require('express');
const app = require('./app');
const setupSocketHandlers = require('./socket/handlers');
const initializeServices = require('./services/init');
const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT || 5000;

// Database pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

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

// Express Routes
// 🔹 레거시 리소스 제공 비활성화 - React 앱으로 완전 전환
// app.use('/TLG', express.static(path.join(__dirname, '../TLG')));
// app.use('/KDS', express.static(path.join(__dirname, '../KDS')));
// app.use('/pos', express.static(path.join(__dirname, '../pos')));
// app.use('/shared', express.static(path.join(__dirname, '../shared')));
// app.use('/tlm-components', express.static(path.join(__dirname, '../tlm-components')));
// app.use('/krp', express.static(path.join(__dirname, '../krp')));
// app.use('/admin', express.static(path.join(__dirname, '../admin')));

// 🔹 정적 파일 제공 (이미지, 폰트 등만 유지)
app.use('/public', express.static(path.join(__dirname, '../public'), {
  index: false,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    }
  }
}));

// ===========================
// 🌐 HTML 라우팅
// ===========================

// 레거시 시스템 HTML 라우팅 비활성화 - React 앱으로 완전 전환
// app.get('/kds.html', (req, res) => {
//   res.sendFile(path.join(__dirname, '../public/kds.html'));
// });

// app.get('/pos.html', (req, res) => {
//   res.sendFile(path.join(__dirname, '../pos/index.html'));
// });

// app.get('/krp.html', (req, res) => {
//   res.sendFile(path.join(__dirname, '../public/krp.html'));
// });

// app.get('/admin.html', (req, res) => {
//   res.sendFile(path.join(__dirname, '../public/admin.html'));
// });

// app.get('/tlm.html', (req, res) => {
//   res.sendFile(path.join(__dirname, '../public/tlm.html'));
// });

// 토스 결제 페이지는 유지 (필요시)
app.get('/toss-success.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/toss-success.html'));
});

app.get('/toss-fail.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/toss-fail.html'));
});

// React SPA Catch-all (API/정적 파일 제외)
app.use((req, res, next) => {
  // API, WebSocket, SSE, 정적 파일 요청 제외
  if (req.path.startsWith('/api/') || 
      req.path.startsWith('/socket.io/') || 
      req.path.startsWith('/sse/') ||
      req.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/i)) {
    return next();
  }
  
  // React 앱 index.html 제공
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
server.listen(PORT, '0.0.0.0', () => {
  console.log('\n=== 🚀 TableLink 서버 시작 ===');
  console.log(`📍 포트: ${PORT}`);
  console.log(`🌐 접속 URL: http://localhost:${PORT}`);
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