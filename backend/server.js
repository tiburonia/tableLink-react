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