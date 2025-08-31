
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { notFound, errorHandler } = require('./mw/errors');

const app = express();
const PORT = process.env.PORT || 5000;

// 기본 미들웨어
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 1000, // 요청 제한
  message: {
    message: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});
app.use('/api/', limiter);

// 정적 파일 서빙
app.use(express.static('public'));

// 라우터 연결
try {
  const posRoutes = require('./routes/pos');
  // TODO: 다른 라우터들 추가
  // const tllRoutes = require('./routes/tll');
  // const kdsRoutes = require('./routes/kds');
  // const krpRoutes = require('./routes/krp');

  app.use('/api/pos', posRoutes);
  // app.use('/api/tll', tllRoutes);
  // app.use('/api/kds', kdsRoutes);
  // app.use('/api/krp', krpRoutes);

  console.log('✅ 라우터 로드 완료');
} catch (error) {
  console.error('❌ 라우터 로드 실패:', error);
  process.exit(1);
}

// 헬스체크
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// 에러 핸들링
app.use(notFound);
app.use(errorHandler);

// 서버 시작
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 TableLink POS 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`📱 http://localhost:${PORT} 에서 접속 가능합니다.`);
  console.log(`🏗️ POS/KDS/TLL/KRP 통합 시스템`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 서버 종료 중...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 서버 종료 중...');
  process.exit(0);
});
