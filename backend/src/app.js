const express = require('express');
const path = require('path');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
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


// 컨트롤러 임포트 (필요한 경우)
// const userController = require('./controllers/userController');

// 미들웨어 임포트
const { errorHandler } = require('./mw/errorHandler');
const { protect } = require('./mw/authMiddleware');
const { rateLimiter } = require('./mw/rateLimiter');

// DB 연결
const connectDB = require('./db/connect');

// 소켓 연결
const setupWebSocket = require('./socket');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // 모든 오리진 허용 (실제 운영 환경에서는 구체적으로 명시해야 함)
    methods: ["GET", "POST"]
  }
});

// DB 연결
connectDB();

// 미들웨어 설정
app.use(cors()); // CORS 허용
app.use(express.json()); // JSON 본문 파싱
app.use(express.urlencoded({ extended: true })); // URL-encoded 본문 파싱

// Rate Limiter 미들웨어 적용 (모든 요청에 대해)
app.use(rateLimiter);

// API 라우트 설정
app.use('/api/auth', authRoutes); // 로그인/회원가입 등 인증 관련 (protect 미적용)
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

// 웹소켓은 setupWebSocket에서 처리

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
  res.send('API is running...');
});

// 웹소켓 설정
setupWebSocket(io);

// 에러 핸들러 미들웨어 설정 (라우트 뒤에 위치해야 함)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));