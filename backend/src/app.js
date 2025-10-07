const express = require('express');
const path = require('path');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const dotenv = require('dotenv');

dotenv.config();

// 라우트 임포트
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const authRoutes = require('./routes/authRoutes');
const tableRoutes = require('./routes/tableRoutes');
const kitchenRoutes = require('./routes/kitchenRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const wsRoutes = require('./routes/wsRoutes');


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
app.use('/api/users', protect, userRoutes);
app.use('/api/products', protect, productRoutes);
app.use('/api/orders', protect, orderRoutes);
app.use('/api/payments', protect, paymentRoutes);
app.use('/api/dashboard', protect, dashboardRoutes);
app.use('/api/auth', authRoutes); // 로그인/회원가입 등 인증 관련 (protect 미적용)
app.use('/api/tables', protect, tableRoutes);
app.use('/api/kitchen', protect, kitchenRoutes);
app.use('/api/notifications', protect, notificationRoutes);

// 웹소켓 라우트 설정 (별도의 라우터 파일에서 관리)
// wsRoutes(io); // setupWebSocket 함수에서 io 객체를 받아 처리하도록 수정

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