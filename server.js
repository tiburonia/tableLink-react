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
app.use(cors());
app.use(express.json());

// 정적 파일 서빙 설정
app.use('/shared', express.static(path.join(__dirname, 'shared')));
app.use('/TLG', express.static(path.join(__dirname, 'TLG')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));
app.use('/kds', express.static(path.join(__dirname, 'kds')));
app.use('/pos', express.static(path.join(__dirname, 'pos')));
app.use('/tlm-components', express.static(path.join(__dirname, 'tlm-components')));
app.use(express.static(path.join(__dirname, 'public')));

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

// 라우트 연결
app.use('/api', authRoutes);
app.use('/api/stores', storesRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/tables', tablesRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cache', cacheRoutes);
app.use('/api/pos', posRoutes);
app.use('/api/regular-levels', require('./routes/regular-levels'));

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

io.on('connection', (socket) => {
  console.log('🔌 클라이언트 연결:', socket.id);

  // KDS 룸 참여
  socket.on('join-kds-room', (storeId) => {
    const roomName = `kds-store-${storeId}`;
    socket.join(roomName);
    
    if (!kdsClients.has(storeId)) {
      kdsClients.set(storeId, new Set());
    }
    kdsClients.get(storeId).add(socket.id);
    
    console.log(`📟 KDS 클라이언트 ${socket.id}가 매장 ${storeId} 룸에 참여`);
  });

  // KDS 룸 나가기
  socket.on('leave-kds-room', (storeId) => {
    const roomName = `kds-store-${storeId}`;
    socket.leave(roomName);
    
    if (kdsClients.has(storeId)) {
      kdsClients.get(storeId).delete(socket.id);
      if (kdsClients.get(storeId).size === 0) {
        kdsClients.delete(storeId);
      }
    }
    
    console.log(`📟 KDS 클라이언트 ${socket.id}가 매장 ${storeId} 룸에서 나감`);
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
  });
});

// KDS 주문 데이터 실시간 업데이트 함수
function broadcastKDSUpdate(storeId, updateType = 'order-update', data = null) {
  const roomName = `kds-store-${storeId}`;
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