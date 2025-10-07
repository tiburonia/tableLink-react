const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Express 앱 import
const app = require('./src/app');

// 포트 설정
const PORT = process.env.PORT || 5000;

// 정적 파일 서빙 (레거시 시스템)
app.use('/legacy', express.static(path.join(__dirname, '../legacy')));

// React 빌드 파일 서빙 (프로덕션)
app.use(express.static(path.join(__dirname, '../dist')));

// SPA 폴백 (React Router 지원)
app.get('*', (req, res, next) => {
  // API 요청은 제외
  if (req.path.startsWith('/api')) {
    return next();
  }

  // 레거시 시스템 제외
  if (req.path.startsWith('/legacy')) {
    return next();
  }

  // React 앱 index.html 제공
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// 서버 시작
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 TableLink Backend Server running on http://0.0.0.0:${PORT}`);
  console.log(`📱 Frontend (React): http://localhost:5173`);
  console.log(`🔧 API: http://0.0.0.0:${PORT}/api`);
  console.log(`🏪 Legacy: http://0.0.0.0:${PORT}/legacy`);
});

// 에러 핸들링
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});