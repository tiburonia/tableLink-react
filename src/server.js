require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { notFound, errorHandler } = require('./mw/errors');
const sse = require('./services/sse');

const app = express();

// Trust proxy for rate limiting in cloud environments (Replit 환경)
app.set('trust proxy', 1);

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
const PORT = process.env.PORT || 5000;

// Database pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

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

// 레거시 TLG 시스템 정적 파일 서빙
app.use('/shared', express.static(path.join(__dirname, '../shared')));
app.use('/TLG', express.static(path.join(__dirname, '../TLG')));
app.use('/krp', express.static(path.join(__dirname, '../krp')));
app.use('/admin', express.static(path.join(__dirname, '../admin')));
app.use('/tlm-components', express.static(path.join(__dirname, '../tlm-components')));
app.use('/kds', express.static(path.join(__dirname, '../kds')));

// 루트 경로를 레거시 index.html로 리다이렉트
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

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
    message: 'TableLink API Server',
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
      '/api/kds',
      '/api/tll',
      '/api/toss',
      '/api/clusters'
    ]
  });
});

// Router mounting
try {
  // 새로운 POS 통합 시스템 라우터
  const posRoutes = require('./routes/pos');
  const kdsRouter = require('../kds/backend/kds'); // KDS 라우터 추가
  const tllRoutes = require('./routes/tll'); // TLL 라우터 추가
  const krpRoutes = require('./routes/krp');
  const tossRoutes = require('./routes/toss'); // 토스페이먼츠 라우터 추가
  const storesClustersRouter = require('./routes/stores-clusters'); // 새로운 클러스터 API 라우터 등록

  // 새 시스템 라우터
  const authRoutes = require('./routes/auth');
  const storesRoutes = require('./routes/stores');
  const ordersRoutes = require('./routes/orders');
  const reviewRoutes = require('./routes/reviews');
  const tableRoutes = require('./routes/tables');
  const cartRoutes = require('./routes/cart');
  const regularLevelsRoutes = require('./routes/regular-levels');
  const auditRoutes = require('./routes/audit'); // 감사 로그 라우터 추가
  const usersRouter = require('./routes/users');

  // 새로운 POS 시스템 API
  app.use('/api/pos', posRoutes);
  app.use('/api/kds', kdsRouter); // KDS 라우터 경로 등록
  app.use('/api/tll', tllRoutes); // TLL 라우터 경로 등록
  app.use('/api/payments', krpRoutes);
  app.use('/api/toss', tossRoutes); // 토스페이먼츠 라우터 경로 등록
  app.use('/api/clusters', storesClustersRouter); // 클러스터 API 경로 변경

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
  app.use('/api/tll', tllRoutes);
  app.use('/api/toss', tossRoutes);

  console.log('✅ 새 시스템 라우터 로드 완료 (auth, stores, orders, reviews, tables, cart, regular-levels, audit, kds, tll, toss, stores-clusters)');
} catch (error) {
  console.error('❌ 라우터 로드 실패:', error);
  console.error('세부 내용:', error.message);
  // 일부 라우터 로드 실패해도 서버는 계속 실행
}

// Error Handling
app.use(notFound);
app.use(errorHandler);

// PostgreSQL LISTEN setup (KDS Real-time Notifications)
async function setupKDSListener() {
  const client = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    const listenerClient = await client.connect();
    await listenerClient.query('LISTEN kds_line_events');

    listenerClient.on('notification', async (msg) => {
      try {
        const payload = JSON.parse(msg.payload);
        console.log('📡 KDS 이벤트 수신:', payload);

        // Get store_id from check_item_id (새 스키마)
        if (payload.check_item_id || payload.item_id) {
          const itemId = payload.check_item_id || payload.item_id;
          const storeResult = await pool.query(`
            SELECT c.store_id, c.table_number, c.customer_name, ci.menu_name, ci.status
            FROM check_items ci
            JOIN checks c ON ci.check_id = c.id
            WHERE ci.id = $1
          `, [itemId]);

          if (storeResult.rows.length > 0) {
            const { store_id, table_number, customer_name, menu_name, status } = storeResult.rows[0];
            const topic = `store:${store_id}`;

            // Broadcast to subscribers of the specific storeId
            sse.broadcast(topic, {
              type: 'item_status_update',
              data: {
                ...payload,
                store_id,
                table_number,
                customer_name,
                menu_name,
                status
              },
              timestamp: new Date().toISOString()
            });

            // Socket.IO로도 실시간 브로드캐스트
            io.to(`store:${store_id}`).emit('pos-update', {
              type: 'item-status-update',
              storeId: store_id,
              data: {
                ...payload,
                table_number,
                menu_name,
                status
              },
              timestamp: new Date().toISOString()
            });

            io.to(`kds:${store_id}`).emit('kds-update', {
              type: 'item_status_update',
              storeId: store_id,
              data: {
                ...payload,
                table_number,
                customer_name,
                menu_name,
                status
              },
              timestamp: new Date().toISOString()
            });
          }
        }
      } catch (error) {
        console.error('❌ KDS 이벤트 처리 실패:', error);
      }
    });

    console.log('👂 PostgreSQL LISTEN kds_line_events 준비완료');
  } catch (error) {
    console.error('❌ PostgreSQL LISTEN 설정 실패:', error);
  }
}

// Socket.IO 연결 관리
const storeRooms = new Map(); // storeId -> Set of socket.id

io.on('connection', (socket) => {
  console.log(`🔌 새 클라이언트 연결: ${socket.id}`);

  // POS 룸 참여
  socket.on('join-pos-room', (storeId) => {
    const roomName = `store:${storeId}`;
    socket.join(roomName);

    if (!storeRooms.has(storeId)) {
      storeRooms.set(storeId, new Set());
    }
    storeRooms.get(storeId).add(socket.id);

    console.log(`📡 POS 클라이언트가 매장 ${storeId} 룸에 참여: ${socket.id}`);

    socket.emit('join-pos-room-success', {
      storeId,
      clientCount: storeRooms.get(storeId).size
    });
  });

  // KDS 룸 참여
  socket.on('join-kds-room', (storeId) => {
    const roomName = `kds:${storeId}`;
    socket.join(roomName);
    console.log(`🖥️ KDS 클라이언트가 매장 ${storeId} 룸에 참여: ${socket.id}`);

    socket.emit('join-kds-room-success', { storeId });
  });

  // 연결 해제 처리
  socket.on('disconnect', () => {
    console.log(`❌ 클라이언트 연결 해제: ${socket.id}`);

    // 모든 매장 룸에서 제거
    for (const [storeId, clients] of storeRooms.entries()) {
      if (clients.has(socket.id)) {
        clients.delete(socket.id);
        if (clients.size === 0) {
          storeRooms.delete(storeId);
        }
        break;
      }
    }
  });
});

// Start Server
server.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 TableLink POS 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`📱 http://localhost:${PORT} 에서 접속 가능합니다.`);
  console.log('🏗️ POS/KDS/TLL/KRP 통합 시스템');
  console.log('🔌 Socket.IO 실시간 통신 준비완료');

  // Setup KDS LISTEN
  await setupKDSListener();
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