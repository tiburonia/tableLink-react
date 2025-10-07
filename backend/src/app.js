const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

// 라우트 임포트
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/pos-payment');
const tableRoutes = require('./routes/tables');
const storeRoutes = require('./routes/stores');
const storeClustersRoutes = require('./routes/stores-clusters');
const reviewRoutes = require('./routes/reviews');
const notificationRoutes = require('./routes/notifications');
const posRoutes = require('./routes/pos');
const kdsRoutes = require('./routes/kds');
const tllRoutes = require('./routes/tll');
const tossRoutes = require('./routes/toss');

// 미들웨어 임포트
const { errorHandler } = require('./mw/errors');
const { rateLimiter } = require('./mw/rateLimiter');

const app = express();

// 프록시 신뢰 설정 (Replit 환경 - 1 hop)
// Replit은 단일 프록시 레이어를 사용하므로 1로 설정
app.set('trust proxy', 1);

// 미들웨어 설정
app.use(cors()); // CORS 허용
app.use(express.json()); // JSON 본문 파싱
app.use(express.urlencoded({ extended: true })); // URL-encoded 본문 파싱

// Rate Limiter 미들웨어 적용
app.use(rateLimiter);

// 디버깅: 모든 요청 로그
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// API 라우트 설정
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/clusters', storeClustersRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/pos', posRoutes);
app.use('/api/kds', kdsRoutes);
app.use('/api/tll', tllRoutes);
app.use('/api/toss', tossRoutes);


// 기본 API 엔드포인트 (테스트용)
app.get('/api', (req, res) => {
  res.json({ 
    message: 'TableLink API is running...',
    timestamp: new Date().toISOString()
  });
});

// ===== 레거시 시스템 정적 파일 서빙 =====
// 루트 경로 매핑 (legacy HTML 내부의 절대 경로 처리)
app.use('/public', express.static(path.join(__dirname, '../../legacy/public')));
app.use('/shared', express.static(path.join(__dirname, '../../shared')));
app.use('/TLG', express.static(path.join(__dirname, '../../legacy/TLG')));
app.use('/pos', express.static(path.join(__dirname, '../../legacy/pos')));
app.use('/KDS', express.static(path.join(__dirname, '../../legacy/KDS')));
app.use('/krp', express.static(path.join(__dirname, '../../legacy/krp')));
app.use('/admin', express.static(path.join(__dirname, '../../legacy/admin')));
app.use('/tlm-components', express.static(path.join(__dirname, '../../legacy/tlm-components')));
app.use('/kds', express.static(path.join(__dirname, '../../legacy/kds')));

// /legacy 경로 매핑 (추가 지원)
app.use('/legacy/public', express.static(path.join(__dirname, '../../legacy/public')));
app.use('/legacy/shared', express.static(path.join(__dirname, '../../shared')));
app.use('/legacy/TLG', express.static(path.join(__dirname, '../../legacy/TLG')));
app.use('/legacy/pos', express.static(path.join(__dirname, '../../legacy/pos')));
app.use('/legacy/KDS', express.static(path.join(__dirname, '../../legacy/KDS')));
app.use('/legacy/krp', express.static(path.join(__dirname, '../../legacy/krp')));
app.use('/legacy/admin', express.static(path.join(__dirname, '../../legacy/admin')));
app.use('/legacy/tlm-components', express.static(path.join(__dirname, '../../legacy/tlm-components')));
app.use('/legacy/kds', express.static(path.join(__dirname, '../../legacy/kds')));

// /legacy 루트 경로 처리
app.get('/legacy', (req, res) => {
  res.sendFile(path.join(__dirname, '../../legacy/public/index.html'));
});

app.use('/legacy', express.static(path.join(__dirname, '../../legacy/public')));

// ==================== 정적 파일 제공 ====================
// 레거시 시스템 정적 파일 (명시적 경로만)
app.use('/legacy', express.static(path.join(__dirname, '../../legacy/public')));
app.use('/legacy/assets', express.static(path.join(__dirname, '../../legacy/TLG/assets')));
app.use('/legacy/TLG', express.static(path.join(__dirname, '../../legacy/TLG')));
app.use('/legacy/pos', express.static(path.join(__dirname, '../../legacy/pos')));
app.use('/legacy/KDS', express.static(path.join(__dirname, '../../legacy/KDS')));
app.use('/legacy/krp', express.static(path.join(__dirname, '../../legacy/krp')));

// 공용 리소스
app.use('/shared', express.static(path.join(__dirname, '../../shared')));

// React 앱 (Vite 빌드 결과물) - 마지막에 배치하여 우선순위 최하위
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// ==================== SPA 폴백 라우팅 ====================
// API, Legacy 외 모든 경로는 React 앱으로
app.get('*', (req, res, next) => {
  // API 또는 레거시 경로는 제외
  if (req.path.startsWith('/api') || req.path.startsWith('/legacy')) {
    return next();
  }

  // React 앱 index.html 제공
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

// 에러 핸들러 미들웨어 (모든 라우트 뒤에 위치)
app.use(errorHandler);

// Express 앱만 export (서버 시작은 server.js에서)
module.exports = app;