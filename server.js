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

app.use((req, res, next) => {
  res.header('X-Frame-Options', 'SAMEORIGIN');
  res.header('Content-Security-Policy', "frame-ancestors 'self' *.replit.dev *.replit.co");
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

// 정적 파일 서빙
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

// 라우트 모듈 연결 (오류 수정)
try {
  const authRoutes = require('./routes/auth');
  const { router: storesRoutes } = require('./routes/stores'); // Original line kept for compatibility if structure changes
  const ordersRoutes = require('./routes/orders');
  const reviewsRoutes = require('./routes/reviews');
  const tablesRoutes = require('./routes/tables');
  const cartRoutes = require('./routes/cart');
  const adminRoutes = require('./routes/admin');
  const cacheRoutes = require('./routes/cache');
  const posRoutes = require('./routes/pos');
  const regularLevelsRoutes = require('./routes/regular-levels');
  const tossRouter = require('./routes/toss'); // Original line kept
  const krpRoutes = require('./routes/krp');
  const guestsRoutes = require('./routes/guests'); // Added from edited code

  // 라우트 연결
  app.use('/api/auth', authRoutes);
  app.use('/api/stores', storesRoutes); // Use the imported router directly
  app.use('/api/orders', ordersRoutes);
  app.use('/api/reviews', reviewsRoutes);
  app.use('/api/tables', tablesRoutes);
  app.use('/api/cart', cartRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/cache', cacheRoutes);
  app.use('/api/pos', posRoutes);
  app.use('/api/regular-levels', regularLevelsRoutes);
  app.use('/api/guests', guestsRoutes); // Added from edited code
  app.use('/api/toss', tossRouter); // Original line kept
  app.use('/api/krp', krpRoutes);

  console.log('✅ 모든 라우트 모듈 로드 완료');
} catch (error) {
  console.error('❌ 라우트 모듈 로드 실패:', error);
  process.exit(1);
}

// 플레이스홀더 이미지 API
app.get('/api/placeholder/:width/:height', (req, res) => {
  const { width, height } = req.params;
  const w = parseInt(width) || 200;
  const h = parseInt(height) || 200;

  const svg = `
    <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f1f1f1"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" fill="#777" text-anchor="middle" dy=".3em">
        ${w}×${h}
      </text>
    </svg>
  `;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=86400');
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

app.get('/kds/:storeId', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'kds.html'));
});

app.get('/POS', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pos.html'));
});

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

app.get('/krp', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'krp.html'));
});

// 만료된 TLL 주문 테이블 자동 해제
async function checkAndReleaseExpiredTables() {
  try {
    const result = await pool.query(`
      SELECT store_id, table_number
      FROM store_tables
      WHERE is_occupied = true
        AND occupied_since IS NOT NULL
        AND auto_release_source = 'TLL'
        AND occupied_since < NOW() - INTERVAL '2 minutes'
    `);

    for (const table of result.rows) {
      await pool.query(`
        UPDATE store_tables
        SET is_occupied = false, occupied_since = null, auto_release_source = null
        WHERE store_id = $1 AND table_number = $2
      `, [table.store_id, table.table_number]);

      console.log(`✅ 만료된 TLL 테이블 ${table.table_number}번 (매장 ${table.store_id}) 해제`);
    }
  } catch (error) {
    console.error('❌ 만료된 테이블 체크 실패:', error);
  }
}

// WebSocket 연결 관리
const kdsClients = new Map();
const posClients = new Map();
const krpClients = new Map();

io.on('connection', (socket) => {
  console.log('🔌 클라이언트 연결:', socket.id);

  // KDS 룸 관리
  socket.on('join-kds-room', (storeId) => {
    const roomName = `kds-${storeId}`;
    socket.join(roomName);

    if (!kdsClients.has(storeId)) {
      kdsClients.set(storeId, new Set());
    }
    kdsClients.get(storeId).add(socket.id);

    console.log(`📟 KDS 클라이언트 ${socket.id} → 매장 ${storeId} 참여`);

    socket.emit('join-kds-room-success', {
      storeId: parseInt(storeId),
      clientCount: kdsClients.get(storeId).size
    });
  });

  socket.on('leave-kds-room', (storeId) => {
    const roomName = `kds-${storeId}`;
    socket.leave(roomName);

    if (kdsClients.has(storeId)) {
      kdsClients.get(storeId).delete(socket.id);
      if (kdsClients.get(storeId).size === 0) {
        kdsClients.delete(storeId);
      }
    }

    console.log(`📟 KDS 클라이언트 ${socket.id} ← 매장 ${storeId} 나감`);
  });

  // POS 룸 관리
  socket.on('join-pos-room', (storeId) => {
    const roomName = `pos-store-${storeId}`;
    socket.join(roomName);

    if (!posClients.has(storeId)) {
      posClients.set(storeId, new Set());
    }
    posClients.get(storeId).add(socket.id);

    console.log(`💳 POS 클라이언트 ${socket.id} → 매장 ${storeId} 참여`);

    socket.emit('join-pos-room-success', {
      storeId: parseInt(storeId),
      clientCount: posClients.get(storeId).size
    });
  });

  socket.on('leave-pos-room', (storeId) => {
    if (posClients.has(storeId)) {
      posClients.get(storeId).delete(socket.id);
      if (posClients.get(storeId).size === 0) {
        posClients.delete(storeId);
      }
    }
    console.log(`💳 POS 클라이언트 ${socket.id} ← 매장 ${storeId} 나감`);
  });

  // KRP 룸 관리
  socket.on('join-krp-room', (storeId) => {
    const roomName = `krp-${storeId}`;
    socket.join(roomName);

    if (!krpClients.has(storeId)) {
      krpClients.set(storeId, new Set());
    }
    krpClients.get(storeId).add(socket.id);

    console.log(`🖨️ KRP 클라이언트 ${socket.id} → 매장 ${storeId} 참여`);

    socket.emit('join-krp-room-success', {
      storeId: parseInt(storeId),
      clientCount: krpClients.get(storeId).size
    });
  });

  socket.on('disconnect', () => {
    console.log('🔌 클라이언트 연결 해제:', socket.id);

    // 모든 룸에서 제거
    [kdsClients, posClients, krpClients].forEach(clientMap => {
      for (const [storeId, clientSet] of clientMap.entries()) {
        if (clientSet.has(socket.id)) {
          clientSet.delete(socket.id);
          if (clientSet.size === 0) {
            clientMap.delete(storeId);
          }
        }
      }
    });
  });
});

// WebSocket 브로드캐스트 함수들
function broadcastKDSUpdate(storeId, updateType, data) {
  const roomName = `kds-${storeId}`;
  const clientCount = kdsClients.get(storeId)?.size || 0;

  if (clientCount > 0) {
    io.to(roomName).emit('kds-update', {
      type: updateType,
      storeId: parseInt(storeId),
      timestamp: new Date().toISOString(),
      data: data
    });
    console.log(`📡 KDS 브로드캐스트: ${updateType} → 매장 ${storeId} (${clientCount}개 클라이언트)`);
  }
}

function broadcastPOSUpdate(storeId, updateType, data) {
  const roomName = `pos-store-${storeId}`;
  const clientCount = posClients.get(storeId)?.size || 0;

  if (clientCount > 0) {
    io.to(roomName).emit('pos-update', {
      type: updateType,
      storeId: parseInt(storeId),
      timestamp: new Date().toISOString(),
      updateData: data
    });
    console.log(`📡 POS 브로드캐스트: ${updateType} → 매장 ${storeId} (${clientCount}개 클라이언트)`);
  }
}

function broadcastKRPPrint(storeId, printData) {
  const roomName = `krp-${storeId}`;
  const clientCount = krpClients.get(storeId)?.size || 0;

  if (clientCount > 0) {
    io.to(roomName).emit('krp-print', printData);
    console.log(`🖨️ KRP 브로드캐스트 → 매장 ${storeId} (${clientCount}개 클라이언트)`);
  }
}

// 전역 WebSocket 객체
global.kdsWebSocket = {
  broadcast: broadcastKDSUpdate,
  getConnectedClients: (storeId) => kdsClients.get(storeId)?.size || 0
};

global.posWebSocket = {
  broadcast: broadcastPOSUpdate,
  broadcastNewOrder: (storeId, data) => broadcastPOSUpdate(storeId, 'new-order', data),
  broadcastTableUpdate: (storeId, data) => broadcastPOSUpdate(storeId, 'table-update', data)
};

global.krpWebSocket = {
  broadcastPrint: broadcastKRPPrint
};

// 서버 실행
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 TableLink 통합 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`📱 http://localhost:${PORT} 에서 접속 가능합니다.`);
  console.log(`🔌 WebSocket 서버 활성화됨`);
  console.log(`🏗️ POS/KDS/TLL/KRP 통합 스키마 기반`);

  // 서버 시작 시 만료된 테이블들 해제
  checkAndReleaseExpiredTables();
});