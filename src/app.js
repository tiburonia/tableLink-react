
const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { notFound, errorHandler } = require('./mw/errors');

const app = express();

// Trust proxy for rate limiting in cloud environments (Replit 환경)
app.set('trust proxy', 1);

// Basic Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    message: 'Too many requests from this IP, please try again after 15 minutes',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});
app.use('/api/', limiter);

// Static file serving
app.use(express.static('public'));
app.use('/pos', express.static('pos'));
app.use('/KDS', express.static('KDS'));

// 레거시 TLG 시스템 정적 파일 서빙
app.use('/shared', express.static(path.join(__dirname, '../shared')));
app.use('/TLG', express.static(path.join(__dirname, '../TLG')));
app.use('/krp', express.static(path.join(__dirname, '../krp')));
app.use('/admin', express.static(path.join(__dirname, '../admin')));
app.use('/tlm-components', express.static(path.join(__dirname, '../tlm-components')));
app.use('/kds', express.static(path.join(__dirname, '../kds')));

// React 앱 빌드 파일 제공
app.use(express.static(path.join(__dirname, '../dist')));

// Health Check
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API 기본 경로 핸들러
app.all('/api', (req, res) => {
  res.json({
    message: 'TableLink POS 서버',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: [
      '/api/auth',
      '/api/stores',
      '/api/orders',
      '/api/reviews',
      '/api/tables',
      '/api/cart',
      '/api/regular-levels',
      '/api/audit',
      '/api/pos',
      '/api/tll',
      '/api/toss',
      '/api/clusters',
      '/api/krp'
    ]
  });
});

// Router mounting
try {
  // 새로운 POS 통합 시스템 라우터
  const posRoutes = require('./routes/pos');
  const posPaymentRoutes = require('./routes/pos-payment');
  const posPaymentTLLRoutes = require('./routes/pos-payment-tll');
  const tllRoutes = require('./routes/tll');
  const krpRoutes = require('./routes/krp');
  const kdsRoutes = require('./routes/kds');
  const tossRoutes = require('./routes/toss');
  const storesClustersRouter = require('./routes/stores-clusters');

  // 새 시스템 라우터
  const authRoutes = require('./routes/auth');
  const storesRoutes = require('./routes/stores');
  const ordersRoutes = require('./routes/orders');
  const reviewRoutes = require('./routes/reviews');
  const tableRoutes = require('./routes/tables');
  const cartRoutes = require('./routes/cart');
  const regularLevelsRoutes = require('./routes/regular-levels');
  const auditRoutes = require('./routes/audit');
  const usersRouter = require('./routes/users');
  const notificationsRoutes = require('./routes/notifications');

  // 새로운 POS 시스템 API
  app.use('/api/pos', posRoutes);
  app.use('/api/pos-payment', posPaymentRoutes);
  app.use('/api/pos-payment-tll', posPaymentTLLRoutes);
  app.use('/api/tll', tllRoutes);
  app.use('/api/kds', kdsRoutes);
  app.use('/api/payments', krpRoutes);
  app.use('/api/toss', tossRoutes);
  app.use('/api/clusters', storesClustersRouter);

  // 라우터 등록
  app.use('/api/auth', authRoutes);
  app.use('/api/stores', storesRoutes);
  app.use('/api/users', usersRouter);
  app.use('/api/orders', ordersRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/tables', tableRoutes);
  app.use('/api/cart', cartRoutes);
  app.use('/api/regular-levels', regularLevelsRoutes);
  app.use('/api/audit', auditRoutes);
  app.use('/api/notifications', notificationsRoutes);
  app.use('/api/tll', tllRoutes);
  app.use('/api/toss', tossRoutes);
  app.use('/api/krp', krpRoutes);

  // SSE 라우트 추가
  const sseRoutes = require('./routes/sse');
  app.use('/api/sse', sseRoutes);

  console.log('✅ 새 시스템 라우터 로드 완료');
} catch (error) {
  console.error('❌ 라우터 로드 실패:', error);
  console.error('세부 내용:', error.message);
}

// KRP 진입을 위한 루트 라우트 설정
app.get('/krp', (req, res) => {
  res.send('<h1>KRP (주방 영수증 프린터) 화면입니다.</h1><p>이곳에 KRP UI를 구현하세요.</p>');
});

// Error Handling Middleware (라우터들 다음에 위치해야 함)
app.use(notFound);
app.use(errorHandler);

module.exports = app;
