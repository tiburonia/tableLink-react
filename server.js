const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./shared/config/database');

const app = express();
const PORT = 5000;

// CORS, JSON 파싱
app.use(cors());
app.use(express.json());

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

// 라우트 연결
app.use('/api', authRoutes);
app.use('/api/stores', storesRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/tables', tablesRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/admin', adminRoutes);

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

app.get('/TLM/:storeId', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'tlm.html'));
});

// 만료된 테이블들 자동 해제 체크
async function checkAndReleaseExpiredTables() {
  try {
    const result = await pool.query(`
      SELECT store_id, table_number, occupied_since 
      FROM store_tables 
      WHERE is_occupied = true AND occupied_since IS NOT NULL
    `);

    const now = new Date();

    for (const table of result.rows) {
      const occupiedSince = new Date(table.occupied_since);
      const diffMinutes = Math.floor((now - occupiedSince) / (1000 * 60));

      if (diffMinutes >= 2) {
        await pool.query(`
          UPDATE store_tables 
          SET is_occupied = false, occupied_since = null 
          WHERE store_id = $1 AND table_number = $2
        `, [table.store_id, table.table_number]);

        console.log(`✅ 서버 시작 시 만료된 테이블 ${table.table_number}번 (매장 ID: ${table.store_id}) 해제 완료`);
      }
    }
  } catch (error) {
    console.error('❌ 만료된 테이블 체크 실패:', error);
  }
}

// 서버 실행
app.listen(PORT, () => {
  console.log(`🚀 TableLink 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`📱 http://localhost:${PORT} 에서 접속 가능합니다.`);

  // 서버 시작 시 만료된 테이블들 해제
  checkAndReleaseExpiredTables();
});