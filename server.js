const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const pool = require('./shared/config/database');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});
const PORT = 5000;

// CORS, JSON 파싱
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma', 'X-Requested-With'],
  credentials: true
}));

// iframe 및 토스페이먼츠 호환성을 위한 헤더 설정
app.use((req, res, next) => {
  // iframe 허용 설정
  res.header('X-Frame-Options', 'SAMEORIGIN');
  res.header('Content-Security-Policy', "frame-ancestors 'self' *.replit.dev *.replit.co");

  // CORS 헤더 강화
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma');
  res.header('Access-Control-Allow-Credentials', 'true');

  // Preflight 요청 처리
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

app.use(express.json());

// 정적 파일 서빙 설정 (올바른 MIME 타입 지원)
const serveStatic = express.static;
app.use('/shared', serveStatic(path.join(__dirname, 'shared'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));
app.use('/TLG', serveStatic(path.join(__dirname, 'TLG')));
app.use('/admin', serveStatic(path.join(__dirname, 'admin')));
app.use('/kds', serveStatic(path.join(__dirname, 'kds')));
app.use('/pos', serveStatic(path.join(__dirname, 'pos')));
app.use('/krp', serveStatic(path.join(__dirname, 'krp')));
app.use('/tlm-components', serveStatic(path.join(__dirname, 'tlm-components')));
app.use(serveStatic(path.join(__dirname, 'public')));

// 라우트 모듈 import
const authRoutes = require('./routes/auth');
const { router: storesRoutes } = require('./routes/stores');
const ordersRoutes = require('./routes/orders');
const reviewsRoutes = require('./routes/reviews');
const tablesRoutes = require('./routes/tables');
const cartRoutes = require('./routes/cart');
const adminRoutes = require('./routes/admin');
const cacheRoutes = require('./routes/cache');
const posRoutes = require('./routes/pos');
const regularLevelsRoutes = require('./routes/regular-levels');
const tossRouter = require('./routes/toss');
const krpRoutes = require('./routes/krp');

// 라우트 연결
app.use('/api/auth', authRoutes);
app.use('/api/stores', storesRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/tables', tablesRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cache', cacheRoutes);
app.use('/api/pos', posRoutes);
app.use('/api/regular-levels', regularLevelsRoutes);
app.use('/api/guests', require('./routes/guests'));
app.use('/api/toss', tossRouter);
app.use('/api/krp', krpRoutes);

// 플레이스홀더 이미지 API
app.get('/api/placeholder/:width/:height', (req, res) => {
  const { width, height } = req.params;
  const w = parseInt(width) || 200;
  const h = parseInt(height) || 200;

  // SVG 플레이스홀더 이미지 생성
  const svg = `
    <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f1f5f9"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" fill="#64748b" text-anchor="middle" dy=".3em">
        ${w}×${h}
      </text>
    </svg>
  `;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=86400'); // 1일 캐시
  res.send(svg);
});


// 정적 페이지 라우트
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/ADMIN', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/KDS', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'kds.html'));
});

// 매장별 KDS 라우트
app.get('/kds/:storeId', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'kds.html'));
});

app.get('/POS', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pos.html'));
});

// 매장별 POS 라우트
app.get('/pos/:storeId', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pos.html'));
});

app.get('/tlm.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'tlm.html'));
});

app.get('/tlm/:storeId', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'tlm.html'));
});

app.get('/KRP', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'krp.html'));
});

// 매장별 KRP 라우트
app.get('/krp', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'krp.html'));
});


// 만료된 TLL 주문 테이블들만 자동 해제 체크
async function checkAndReleaseExpiredTables() {
  try {
    const result = await pool.query(`
      SELECT store_id, table_number, occupied_since, auto_release_source
      FROM store_tables
      WHERE is_occupied = true AND occupied_since IS NOT NULL AND auto_release_source = 'TLL'
    `);

    const now = new Date();

    for (const table of result.rows) {
      const occupiedSince = new Date(table.occupied_since);
      const diffMinutes = Math.floor((now - occupiedSince) / (1000 * 60));

      if (diffMinutes >= 2) {
        await pool.query(`
          UPDATE store_tables
          SET is_occupied = false, occupied_since = null, auto_release_source = null
          WHERE store_id = $1 AND table_number = $2
        `, [table.store_id, table.table_number]);

        console.log(`✅ 서버 시작 시 만료된 TLL 주문 테이블 ${table.table_number}번 (매장 ID: ${table.store_id}) 해제 완료`);
      }
    }

    // TLM 수동 점유 테이블은 그대로 유지
    const tlmTables = await pool.query(`
      SELECT COUNT(*) as count
      FROM store_tables
      WHERE is_occupied = true AND auto_release_source = 'TLM'
    `);

    if (tlmTables.rows[0].count > 0) {
      console.log(`📊 TLM 수동 점유 테이블 ${tlmTables.rows[0].count}개는 유지됩니다`);
    }
  } catch (error) {
    console.error('❌ 만료된 테이블 체크 실패:', error);
  }
}

// WebSocket 연결 관리
const kdsClients = new Map(); // storeId -> Set of socket IDs
const posClients = new Map(); // storeId -> Set of socket IDs
const krpClients = new Map(); // storeId -> Set of socket IDs

io.on('connection', (socket) => {
  console.log('🔌 클라이언트 연결:', socket.id);

  // KDS 룸 참여
  socket.on('join-kds-room', (storeId) => {
    const roomName = `kds-${storeId}`;
    socket.join(roomName);
    console.log(`📟 클라이언트 ${socket.id}가 KDS 룸 ${roomName}에 참여`);

    socket.emit('join-kds-room-success', {
      storeId,
      clientCount: io.sockets.adapter.rooms.get(roomName)?.size || 1
    });
  });

  // KDS 룸 나가기
  socket.on('leave-kds-room', (storeId) => {
    const roomName = `kds-${storeId}`;
    socket.leave(roomName);

    if (kdsClients.has(storeId)) {
      kdsClients.get(storeId).delete(socket.id);
      if (kdsClients.get(storeId).size === 0) {
        kdsClients.delete(storeId);
      }
    }

    console.log(`📟 클라이언트 ${socket.id}가 KDS 룸 ${roomName}에서 나감`);
  });

  // POS 룸 참여
  socket.on('join-pos-room', (storeId) => {
    const roomName = `pos-store-${storeId}`;
    socket.join(roomName);

    if (!posClients.has(storeId)) {
      posClients.set(storeId, new Set());
    }
    posClients.get(storeId).add(socket.id);

    const clientCount = posClients.get(storeId).size;
    console.log(`💳 POS 클라이언트 ${socket.id}가 매장 ${storeId} 룸에 참여 (총 ${clientCount}개 클라이언트)`);

    // 참여 확인 응답
    socket.emit('join-pos-room-success', {
      storeId: parseInt(storeId),
      clientCount: clientCount
    });
  });

  // POS 룸 나가기
  socket.on('leave-pos-room', (storeId) => {
    const roomName = `pos-store-${storeId}`;
    socket.leave(roomName);

    if (posClients.has(storeId)) {
      posClients.get(storeId).delete(socket.id);
      if (posClients.get(storeId).size === 0) {
        posClients.delete(storeId);
      }
    }

    console.log(`💳 POS 클라이언트 ${socket.id}가 매장 ${storeId} 룸에서 나감`);
  });

  // KRP 룸 참여
  socket.on('join-krp-room', (storeId) => {
    const roomName = `krp-${storeId}`;
    socket.join(roomName);
    console.log(`🖨️ 클라이언트 ${socket.id}가 KRP 룸 ${roomName}에 참여`);

    socket.emit('join-krp-room-success', {
      storeId,
      clientCount: io.sockets.adapter.rooms.get(roomName)?.size || 1
    });
  });

  // KRP 룸 나가기
  socket.on('leave-krp-room', (storeId) => {
    const roomName = `krp-${storeId}`;
    socket.leave(roomName);

    if (krpClients.has(storeId)) {
      krpClients.get(storeId).delete(socket.id);
      if (krpClients.get(storeId).size === 0) {
        krpClients.delete(storeId);
      }
    }

    console.log(`🖨️ 클라이언트 ${socket.id}가 KRP 룸 ${roomName}에서 나감`);
  });

  // 연결 해제
  socket.on('disconnect', () => {
    console.log('🔌 클라이언트 연결 해제:', socket.id);

    // 모든 KDS 룸에서 제거
    for (const [storeId, clientSet] of kdsClients.entries()) {
      if (clientSet.has(socket.id)) {
        clientSet.delete(socket.id);
        if (clientSet.size === 0) {
          kdsClients.delete(storeId);
        }
      }
    }

    // 모든 POS 룸에서 제거
    for (const [storeId, clientSet] of posClients.entries()) {
      if (clientSet.has(socket.id)) {
        clientSet.delete(socket.id);
        if (clientSet.size === 0) {
          posClients.delete(storeId);
        }
      }
    }

    // 모든 KRP 룸에서 제거
    for (const [storeId, clientSet] of krpClients.entries()) {
      if (clientSet.has(socket.id)) {
        clientSet.delete(socket.id);
        if (clientSet.size === 0) {
          krpClients.delete(storeId);
        }
      }
    }
  });
});

// KDS 주문 데이터 실시간 업데이트 함수
function broadcastKDSUpdate(storeId, updateType = 'order-update', data = null) {
  const roomName = `kds-${storeId}`;
  const clientCount = kdsClients.get(storeId)?.size || 0;

  console.log(`📡 KDS 브로드캐스트 시도 - 매장 ${storeId}, 타입: ${updateType}, 연결된 클라이언트: ${clientCount}개`);

  if (clientCount > 0) {
    const updateData = {
      type: updateType,
      storeId: parseInt(storeId),
      timestamp: new Date().toISOString(),
      data: data
    };

    console.log(`📡 KDS 실시간 업데이트 전송 중 - 룸: ${roomName}`, updateData);
    io.to(roomName).emit('kds-update', updateData);
    console.log(`✅ KDS 실시간 업데이트 전송 완료 - 매장 ${storeId}`);
  } else {
    console.log(`⚠️ KDS 클라이언트 없음 - 매장 ${storeId}에 연결된 클라이언트가 없습니다`);
  }

  // 연결된 모든 클라이언트 로깅
  console.log(`📊 현재 KDS 연결 상태:`, Array.from(kdsClients.entries()).map(([id, clients]) =>
    `매장 ${id}: ${clients.size}개 클라이언트`
  ));
}

// POS 실시간 업데이트 함수
function broadcastPOSUpdate(storeId, updateType = 'order-update', data = null) {
  const roomName = `pos-store-${storeId}`;
  const clientCount = posClients.get(storeId)?.size || 0;

  console.log(`📡 POS 브로드캐스트 시도 - 매장 ${storeId}, 타입: ${updateType}, 연결된 클라이언트: ${clientCount}개`);

  if (clientCount > 0) {
    const updateData = {
      type: updateType,
      storeId: parseInt(storeId),
      timestamp: new Date().toISOString(),
      updateData: data
    };

    console.log(`📡 POS 실시간 업데이트 전송 중 - 룸: ${roomName}`, updateData);
    io.to(roomName).emit('pos-update', updateData);
    console.log(`✅ POS 실시간 업데이트 전송 완료 - 매장 ${storeId}`);
  } else {
    console.log(`⚠️ POS 클라이언트 없음 - 매장 ${storeId}에 연결된 클라이언트가 없습니다`);
  }
}

// 새 주문 알림 브로드캐스트
function broadcastPOSNewOrder(storeId, orderData) {
  const posRoomName = `pos-store-${storeId}`;
  const posClientCount = posClients.get(storeId)?.size || 0;

  if (posClientCount > 0) {
    console.log(`📡 POS 새 주문 알림 전송 - 매장 ${storeId}`, orderData);
    io.to(posRoomName).emit('new-order', orderData);
  }
}

// 테이블 상태 변경 브로드캐스트
function broadcastPOSTableUpdate(storeId, tableData) {
  const posRoomName = `pos-store-${storeId}`;
  const posClientCount = posClients.get(storeId)?.size || 0;

  if (posClientCount > 0) {
    console.log(`📡 POS 테이블 상태 업데이트 전송 - 매장 ${storeId}`, tableData);
    io.to(posRoomName).emit('table-update', tableData);
  }
}

// KRP 실시간 출력 브로드캐스트
function broadcastKRPPrint(storeId, printData) {
  const krpRoomName = `krp-${storeId}`;
  const krpClientCount = krpClients.get(storeId)?.size || 0;

  if (krpClientCount > 0) {
    console.log(`🖨️ KRP 출력 브로드캐스트 전송 - 매장 ${storeId}`, printData);
    io.to(krpRoomName).emit('krp-print', printData);
  } else {
    console.log(`⚠️ KRP 클라이언트 없음 - 매장 ${storeId}에 연결된 KRP가 없습니다`);
  }
}

// POS WebSocket 글로벌 객체
global.posWebSocket = {
  broadcast: broadcastPOSUpdate,
  broadcastNewOrder: broadcastPOSNewOrder,
  broadcastTableUpdate: broadcastPOSTableUpdate
};

// KRP WebSocket 글로벌 객체
global.krpWebSocket = {
  broadcastPrint: broadcastKRPPrint
};

// 전역으로 WebSocket 인스턴스 노출
global.kdsWebSocket = {
  broadcast: broadcastKDSUpdate,
  getConnectedClients: (storeId) => kdsClients.get(storeId)?.size || 0
};


// 서버 실행
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 TableLink 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`📱 http://localhost:${PORT} 에서 접속 가능합니다.`);
  console.log(`🔌 WebSocket 서버 활성화됨`);

  // 서버 시작 시 만료된 테이블들 해제
  checkAndReleaseExpiredTables();
});