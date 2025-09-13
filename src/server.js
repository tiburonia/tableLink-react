require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { notFound, errorHandler } = require('./mw/errors');

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
app.use('/KDS', express.static('KDS'));

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

  console.log('✅ 새 시스템 라우터 로드 완료 (auth, stores, orders, reviews, tables, cart, regular-levels, audit, tll, toss, stores-clusters)');
} catch (error) {
  console.error('❌ 라우터 로드 실패:', error);
  console.error('세부 내용:', error.message);
  // 일부 라우터 로드 실패해도 서버는 계속 실행
}

// Error Handling
app.use(notFound);
app.use(errorHandler);

// PostgreSQL LISTEN/NOTIFY 완전 구현
async function setupKDSListener() {
  try {
    const listenerClient = await pool.connect();

    // 여러 채널 구독
    await listenerClient.query('LISTEN kds_order_events');
    await listenerClient.query('LISTEN kds_ticket_events');
    await listenerClient.query('LISTEN kds_item_events');
    await listenerClient.query('LISTEN kds_payment_events');

    listenerClient.on('notification', async (msg) => {
      try {
        const payload = JSON.parse(msg.payload);
        console.log('📡 PostgreSQL NOTIFY 수신:', msg.channel, payload);

        switch (msg.channel) {
          case 'kds_order_events':
            await handleOrderNotification(payload);
            break;
          case 'kds_ticket_events':
            await handleTicketNotification(payload);
            break;
          case 'kds_item_events':
            await handleItemNotification(payload);
            break;
          case 'kds_payment_events':
            await handlePaymentNotification(payload);
            break;
        }

      } catch (error) {
        console.error('❌ PostgreSQL 알림 처리 실패:', error);
      }
    });

    console.log('✅ PostgreSQL LISTEN 설정 완료 - 4개 채널 구독');

    // 연결 끊김 감지 및 재연결
    listenerClient.on('error', async (error) => {
      console.error('❌ PostgreSQL LISTEN 연결 오류:', error);
      setTimeout(() => setupKDSListener(), 5000); // 5초 후 재연결
    });

  } catch (error) {
    console.error('❌ PostgreSQL LISTEN 설정 실패:', error);
    setTimeout(() => setupKDSListener(), 10000); // 10초 후 재시도
  }
}

// 주문 알림 처리
async function handleOrderNotification(payload) {
  const { action, order_id, store_id, table_num, status } = payload;

  if (global.io && store_id) {
    global.io.to(`kds:${store_id}`).emit('kds-update', {
      type: 'db_order_change',
      data: {
        action,
        order_id: parseInt(order_id),
        table_number: table_num,
        status,
        timestamp: new Date().toISOString(),
        source: 'db_trigger'
      }
    });

    console.log(`📡 DB 주문 변경 이벤트: 매장 ${store_id}, 주문 ${order_id} -> ${status}`);
  }
}

// 티켓 알림 처리
async function handleTicketNotification(payload) {
  const { action, ticket_id, order_id, store_id, status } = payload;

  if (global.io && store_id) {
    global.io.to(`kds:${store_id}`).emit('kds-update', {
      type: 'db_ticket_change',
      data: {
        action,
        ticket_id: parseInt(ticket_id),
        order_id: parseInt(order_id),
        status,
        timestamp: new Date().toISOString(),
        source: 'db_trigger'
      }
    });

    // 완료된 티켓의 경우 즉시 제거 이벤트
    if (status === 'DONE' || status === 'COMPLETED') {
      global.io.to(`kds:${store_id}`).emit('ticket.completed', {
        ticket_id: parseInt(ticket_id),
        status,
        action: 'remove',
        source: 'db_trigger'
      });
    }

    console.log(`📡 DB 티켓 변경 이벤트: 매장 ${store_id}, 티켓 ${ticket_id} -> ${status}`);
  }
}

// 아이템 알림 처리
async function handleItemNotification(payload) {
  const { action, item_id, ticket_id, store_id, item_status, menu_name } = payload;

  if (global.io && store_id) {
    global.io.to(`kds:${store_id}`).emit('kds-update', {
      type: 'db_item_change',
      data: {
        action,
        item_id: parseInt(item_id),
        ticket_id: parseInt(ticket_id),
        item_status,
        menu_name,
        timestamp: new Date().toISOString(),
        source: 'db_trigger'
      }
    });

    console.log(`📡 DB 아이템 변경 이벤트: 매장 ${store_id}, 아이템 ${item_id} -> ${item_status}`);
  }
}

// 결제 알림 처리
async function handlePaymentNotification(payload) {
  const { action, payment_id, store_id, table_number, final_amount } = payload;

  if (global.io && store_id) {
    global.io.to(`kds:${store_id}`).emit('kds-update', {
      type: 'db_payment_change',
      data: {
        action,
        payment_id: parseInt(payment_id),
        table_number,
        final_amount,
        timestamp: new Date().toISOString(),
        source: 'db_trigger'
      }
    });

    console.log(`📡 DB 결제 변경 이벤트: 매장 ${store_id}, 테이블 ${table_number} 결제 완료`);
  }
}

// WebSocket 연결 처리
io.on('connection', (socket) => {
  const authData = socket.handshake.auth;
  const userType = authData?.userType || 'unknown';

  console.log(`🔌 새로운 WebSocket 연결: ${socket.id} (${userType})`);

  // KDS 룸 조인 (인증 선택사항)
  socket.on('join-kds', (storeId) => {
    const roomName = `kds:${storeId}`;
    socket.join(roomName);

    const connectionType = userType === 'kds-anonymous' ? '익명 KDS' : 'authenticated';
    console.log(`🏪 KDS 룸 조인: ${socket.id} -> ${roomName} (${connectionType})`);

    socket.emit('joined-kds', {
      storeId,
      message: `매장 ${storeId} KDS에 연결되었습니다`,
      connectionType: connectionType
    });
  });

  // KDS 룸 떠나기
  socket.on('leave-kds', (storeId) => {
    const roomName = `kds:${storeId}`;
    socket.leave(roomName);
    console.log(`🚪 KDS 룸 떠남: ${socket.id} -> ${roomName}`);
  });

  // 아이템 상태 변경 요청 처리
  socket.on('item:setStatus', async (data) => {
    try {
      const { item_id, next } = data;
      console.log(`🔄 아이템 상태 변경 요청: ${item_id} -> ${next}`);

      // 아이템 상태 업데이트
      const updateResult = await pool.query(`
        UPDATE order_items 
        SET status = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `, [next, item_id]);

      if (updateResult.rows.length > 0) {
        const updatedItem = updateResult.rows[0];

        // 주문 정보 조회
        const orderResult = await pool.query(`
          SELECT o.store_id, o.check_id, o.table_number
          FROM orders o
          JOIN order_items oi ON o.id = oi.order_id
          WHERE oi.id = $1
        `, [item_id]);

        if (orderResult.rows.length > 0) {
          const order = orderResult.rows[0];

          // 모든 KDS 클라이언트에게 브로드캐스트
          io.to(`kds:${order.store_id}`).emit('item.updated', {
            item_id: item_id,
            ticket_id: order.check_id,
            item_status: next,
            menu_name: updatedItem.menu_name,
            quantity: updatedItem.quantity,
            cook_station: updatedItem.cook_station
          });

          socket.emit('item:statusUpdated', {
            success: true,
            item_id,
            status: next
          });
        }
      }

    } catch (error) {
      console.error('❌ 아이템 상태 변경 실패:', error);
      socket.emit('item:statusUpdated', {
        success: false,
        error: error.message
      });
    }
  });

  // 티켓 상태 변경 요청 처리
  socket.on('ticket:setStatus', async (data) => {
    try {
      const { ticket_id, next } = data;
      console.log(`🎫 티켓 상태 변경 요청: ${ticket_id} -> ${next}`);

      const updateResult = await pool.query(`
        UPDATE orders 
        SET status = $1, updated_at = NOW()
        WHERE check_id = $2
        RETURNING *
      `, [next, ticket_id]);

      if (updateResult.rows.length > 0) {
        const updatedOrder = updateResult.rows[0];

        // 모든 KDS 클라이언트에게 브로드캐스트
        io.to(`kds:${updatedOrder.store_id}`).emit('ticket.updated', {
          ticket_id: ticket_id,
          status: next,
          order_id: updatedOrder.id,
          table_number: updatedOrder.table_number
        });

        socket.emit('ticket:statusUpdated', {
          success: true,
          ticket_id,
          status: next
        });
      }

    } catch (error) {
      console.error('❌ 티켓 상태 변경 실패:', error);
      socket.emit('ticket:statusUpdated', {
        success: false,
        error: error.message
      });
    }
  });

  // 티켓 숨김 요청 처리
  socket.on('ticket:hide', async (data) => {
    try {
      const { ticket_id } = data;
      console.log(`👻 티켓 숨김 요청: ${ticket_id}`);

      const orderResult = await pool.query(`
        SELECT store_id FROM orders WHERE check_id = $1
      `, [ticket_id]);

      if (orderResult.rows.length > 0) {
        const storeId = orderResult.rows[0].store_id;

        // 모든 KDS 클라이언트에게 브로드캐스트
        io.to(`kds:${storeId}`).emit('ticket.hidden', {
          ticket_id: ticket_id
        });

        socket.emit('ticket:hidden', {
          success: true,
          ticket_id
        });
      }

    } catch (error) {
      console.error('❌ 티켓 숨김 실패:', error);
      socket.emit('ticket:hidden', {
        success: false,
        error: error.message
      });
    }
  });

  // 연결 해제
  socket.on('disconnect', () => {
    console.log(`🔌 WebSocket 연결 해제: ${socket.id}`);
  });
});

// KDS 웹소켓 브로드캐스트 함수
global.broadcastKDSUpdate = (storeId, event, data) => {
  const roomName = `kds:${storeId}`;
  io.to(roomName).emit('kds-update', {
    type: event,
    storeId: parseInt(storeId),
    data: data,
    timestamp: Date.now()
  });
  console.log(`📡 KDS 브로드캐스트: ${roomName} -> ${event}`, data);
};

// 라우터 등록
app.use('/api/auth', require('./routes/auth'));
app.use('/api/stores', require('./routes/stores'));
app.use('/api/users', require('./routes/users'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/toss', require('./routes/toss'));
app.use('/api/tll', require('./routes/tll'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/pos', require('./routes/pos'));
app.use('/api/regular-levels', require('./routes/regular-levels'));
app.use('/api/tables', require('./routes/tables'));
app.use('/api/stores-clusters', require('./routes/stores-clusters'));
app.use('/api/audit', require('./routes/audit'));

// Start Server
server.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 TableLink POS 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`📱 http://localhost:${PORT} 에서 접속 가능합니다.`);
  console.log('🏗️ POS/TLL/KRP 통합 시스템');
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