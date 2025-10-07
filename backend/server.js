const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const express = require('express');
require('dotenv').config();

// Express 앱 import
const app = require('./src/app');

// DB Pool import
const pool = require('./src/db/pool');

// Socket 핸들러 import
const setupSocketHandlers = require('./src/socket/handlers');

// HTTP 서버 생성
const server = http.createServer(app);

// Socket.IO 설정
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// 전역 io 설정 (socket handlers에서 사용)
global.io = io;

// Socket 핸들러 설정
setupSocketHandlers(io, pool);

// 포트 설정
const PORT = process.env.PORT || 5000;

// 레거시 시스템 정적 파일 서빙 (/legacy 경로 매핑)
// 주의: 순서가 중요! 가장 구체적인 경로부터 먼저 매칭
app.use('/legacy/public', express.static(path.join(__dirname, '../legacy/public')));
app.use('/legacy/shared', express.static(path.join(__dirname, '../shared')));
app.use('/legacy/TLG', express.static(path.join(__dirname, '../legacy/TLG')));
app.use('/legacy/pos', express.static(path.join(__dirname, '../legacy/pos')));
app.use('/legacy/KDS', express.static(path.join(__dirname, '../legacy/KDS')));
app.use('/legacy/krp', express.static(path.join(__dirname, '../legacy/krp')));
app.use('/legacy/admin', express.static(path.join(__dirname, '../legacy/admin')));
app.use('/legacy/tlm-components', express.static(path.join(__dirname, '../legacy/tlm-components')));
app.use('/legacy/kds', express.static(path.join(__dirname, '../legacy/kds')));

// /legacy 루트 경로 처리
app.use('/legacy', express.static(path.join(__dirname, '../legacy/public'), {
  index: 'index.html'
}));

// React 빌드 파일 서빙 (프로덕션) - /legacy 경로 제외!
app.use((req, res, next) => {
  // /legacy 경로는 React static 미들웨어 건너뛰기
  if (req.path.startsWith('/legacy')) {
    return next();
  }
  express.static(path.join(__dirname, '../frontend/dist'))(req, res, next);
});

// SPA 폴백 (React Router 지원) - Express 5 호환
app.get(/^\/.*/, (req, res, next) => {
  // API 요청은 제외
  if (req.path.startsWith('/api')) {
    return next();
  }

  // 레거시 시스템은 이미 위에서 처리됨
  if (req.path.startsWith('/legacy')) {
    return next();
  }

  // 정적 파일 제외
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|html)$/)) {
    return next();
  }

  // React 앱 index.html 제공
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// 서버 시작
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 TableLink Server running on http://0.0.0.0:${PORT}`);
  console.log(`🔧 API: http://0.0.0.0:${PORT}/api`);
  console.log(`🏪 Legacy: http://0.0.0.0:${PORT}/legacy`);
  console.log(`⚛️  React App: http://0.0.0.0:${PORT}/`);
});

// 에러 핸들링
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});