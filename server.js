const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');
const pool = require('./shared/config/database');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const PORT = process.env.PORT || 5000;

// WebSocket 연결 관리
const storeConnections = new Map(); // storeId -> Set of WebSocket connections

// CORS, JSON 파싱
app.use(cors());
app.use(express.json());

// WebSocket 연결 처리
wss.on('connection', (ws, req) => {
  console.log('🔌 새로운 WebSocket 연결');

  // URL에서 storeId 추출
  const urlParts = req.url.split('/');
  const storeId = urlParts[urlParts.length - 1];

  if (!storeId || storeId === 'undefined') {
    console.error('❌ 유효하지 않은 storeId:', storeId);
    ws.close(1008, 'Invalid store ID');
    return;
  }

  console.log(`🏪 WebSocket 연결: 매장 ${storeId}`);

  // 매장별 연결 관리
  if (!storeConnections.has(storeId)) {
    storeConnections.set(storeId, new Set());
  }
  storeConnections.get(storeId).add(ws);

  // 연결 시 초기 테이블 정보 전송
  sendInitialTableData(ws, storeId);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log(`📨 WebSocket 메시지 수신 (매장 ${storeId}):`, data);

      // 클라이언트로부터의 요청 처리
      handleWebSocketMessage(ws, storeId, data);
    } catch (error) {
      console.error('❌ WebSocket 메시지 파싱 오류:', error);
    }
  });

  ws.on('close', () => {
    console.log(`🔌 WebSocket 연결 종료: 매장 ${storeId}`);
    if (storeConnections.has(storeId)) {
      storeConnections.get(storeId).delete(ws);
      if (storeConnections.get(storeId).size === 0) {
        storeConnections.delete(storeId);
      }
    }
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket 오류:', error);
  });
});

// 초기 테이블 데이터 전송
async function sendInitialTableData(ws, storeId) {
  try {
    const query = `
      SELECT 
        t.id,
        t.table_number as "tableNumber",
        t.table_name as "tableName",
        t.seats,
        t.is_occupied as "isOccupied",
        t.occupied_since as "occupiedSince",
        t.customer_name as "customerName"
      FROM tables t
      WHERE t.store_id = $1
      ORDER BY t.table_number
    `;

    const result = await pool.query(query, [storeId]);
    const tables = result.rows;

    const totalTables = tables.length;
    const occupiedTables = tables.filter(t => t.isOccupied).length;
    const availableTables = totalTables - occupiedTables;

    const initialData = {
      type: 'table_update',
      payload: {
        storeId: parseInt(storeId),
        totalTables,
        availableTables,
        occupiedTables,
        tables
      }
    };

    ws.send(JSON.stringify(initialData));
    console.log(`📤 초기 테이블 데이터 전송: 매장 ${storeId}`);
  } catch (error) {
    console.error('❌ 초기 테이블 데이터 전송 실패:', error);
  }
}

// WebSocket 메시지 처리
function handleWebSocketMessage(ws, storeId, data) {
  switch(data.type) {
    case 'request_table_update':
      sendInitialTableData(ws, storeId);
      break;
    case 'ping':
      ws.send(JSON.stringify({ type: 'pong' }));
      break;
    default:
      console.log('🔍 알 수 없는 메시지 타입:', data.type);
  }
}

// 매장의 모든 WebSocket 클라이언트에게 메시지 브로드캐스트
function broadcastToStore(storeId, message) {
  if (storeConnections.has(storeId)) {
    const connections = storeConnections.get(storeId);
    const messageStr = JSON.stringify(message);

    connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(messageStr);
        } catch (error) {
          console.error('❌ 메시지 전송 실패:', error);
          connections.delete(ws);
        }
      } else {
        connections.delete(ws);
      }
    });

    if (connections.size === 0) {
      storeConnections.delete(storeId);
    }
  }
}

// 테이블 상태 변경 시 실시간 업데이트
function notifyTableStatusChange(storeId, tableData) {
  const message = {
    type: 'table_status_change',
    payload: {
      storeId: parseInt(storeId),
      ...tableData
    }
  };

  broadcastToStore(storeId.toString(), message);
  console.log(`📡 테이블 상태 변경 알림: 매장 ${storeId}, 테이블 ${tableData.tableNumber}`);
}

// 매장 상태 업데이트
function notifyStoreStatusUpdate(storeId, statusData) {
  const message = {
    type: 'store_status_update',
    payload: {
      storeId: parseInt(storeId),
      ...statusData
    }
  };

  broadcastToStore(storeId.toString(), message);
  console.log(`📡 매장 상태 업데이트 알림: 매장 ${storeId}`);
}

// 루트 디렉토리의 정적 파일 서빙
app.use(express.static(__dirname));

// 라우트 모듈 import
const authRoutes = require('./routes/auth');
const { router: storesRoutes } = require('./routes/stores');
const ordersRoutes = require('./routes/orders');
const reviewsRoutes = require('./routes/reviews');
const tablesRoutes = require('./routes/tables');
const cartRoutes = require('./routes/cart');
const adminRoutes = require('./routes/admin');
const cacheRoutes = require('./routes/cache');

// 라우트 연결
app.use('/api', authRoutes);
app.use('/api/stores', storesRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/tables', tablesRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/admin', adminRoutes);
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

app.get('/POS', (req, res) => {
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

// 서버 실행
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ HTTP 서버가 http://0.0.0.0:${PORT} 에서 실행 중입니다`);
  console.log(`🔌 WebSocket 서버가 ws://0.0.0.0:${PORT}/ws/tables/{storeId} 에서 실행 중입니다`);
});

// 전역 함수로 내보내기 (다른 라우트에서 사용할 수 있도록)
global.notifyTableStatusChange = notifyTableStatusChange;
global.notifyStoreStatusUpdate = notifyStoreStatusUpdate;
global.broadcastToStore = broadcastToStore;