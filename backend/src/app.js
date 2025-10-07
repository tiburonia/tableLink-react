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

// 미들웨어 설정
app.use(cors()); // CORS 허용
app.use(express.json()); // JSON 본문 파싱
app.use(express.urlencoded({ extended: true })); // URL-encoded 본문 파싱

// Rate Limiter 미들웨어 적용
app.use(rateLimiter);

// API 라우트 설정
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/pos', posRoutes);
app.use('/api/kds', kdsRoutes);
app.use('/api/tll', tllRoutes);
app.use('/api/toss', tossRoutes);

// 레거시 시스템 정적 파일 (루트 경로)
app.use('/public', express.static(path.join(__dirname, '../../legacy/public')));
app.use('/pos', express.static(path.join(__dirname, '../../legacy/pos')));
app.use('/KDS', express.static(path.join(__dirname, '../../legacy/KDS')));
app.use('/shared', express.static(path.join(__dirname, '../../shared')));
app.use('/TLG', express.static(path.join(__dirname, '../../legacy/TLG')));
app.use('/krp', express.static(path.join(__dirname, '../../legacy/krp')));
app.use('/admin', express.static(path.join(__dirname, '../../legacy/admin')));
app.use('/tlm-components', express.static(path.join(__dirname, '../../legacy/tlm-components')));
app.use('/kds', express.static(path.join(__dirname, '../../legacy/kds')));

// 기본 API 엔드포인트 (테스트용)
app.get('/api', (req, res) => {
  res.json({ 
    message: 'TableLink API is running...',
    timestamp: new Date().toISOString()
  });
});

// 에러 핸들러 미들웨어 (라우트 뒤에 위치)
app.use(errorHandler);

// Express 앱만 export (서버 시작은 server.js에서)
module.exports = app;
