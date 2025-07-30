
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
const cacheRoutes = require('./routes/cache');

// 라우트 연결
app.use('/api', authRoutes);
app.use('/api/stores', storesRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api', reviewsRoutes);
app.use('/api/tables', tablesRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cache', cacheRoutes);

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
app.listen(PORT, () => {
  console.log(`🚀 TableLink 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`📱 http://localhost:${PORT} 에서 접속 가능합니다.`);

  // 서버 시작 시 만료된 테이블들 해제
  checkAndReleaseExpiredTables();
});
