const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./database');

const app = express();
const PORT = 5000;

// CORS, JSON 파싱
app.use(cors());
app.use(express.json());

// 루트 디렉토리의 정적 파일 서빙 (css, js, 이미지 등)
app.use(express.static(__dirname));

// 루트(/) 접속 시 public/index.html 반환
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// stores 테이블 별점 평균 업데이트 함수
async function updateStoreRating(storeId) {
  try {
    console.log(`🔄 매장 ${storeId} 별점 평균 업데이트 중...`);
    
    // 해당 매장의 모든 리뷰 별점 조회
    const ratingResult = await pool.query(`
      SELECT AVG(rating) as avg_rating, COUNT(*) as review_count 
      FROM reviews 
      WHERE store_id = $1
    `, [storeId]);
    
    const avgRating = ratingResult.rows[0].avg_rating;
    const reviewCount = parseInt(ratingResult.rows[0].review_count);
    
    // 별점 평균을 소수점 1자리로 반올림, 리뷰가 없으면 0
    const formattedRating = avgRating ? parseFloat(avgRating).toFixed(1) : 0;
    
    // stores 테이블 업데이트
    await pool.query(`
      UPDATE stores 
      SET rating_average = $1, review_count = $2 
      WHERE id = $3
    `, [formattedRating, reviewCount, storeId]);
    
    console.log(`✅ 매장 ${storeId} 별점 평균 업데이트 완료: ${formattedRating}점 (${reviewCount}개 리뷰)`);
    
    return { avgRating: formattedRating, reviewCount };
  } catch (error) {
    console.error(`❌ 매장 ${storeId} 별점 평균 업데이트 실패:`, error);
    throw error;
  }
}

// stores API 엔드포인트 (실시간 테이블 정보 포함)
app.get('/api/stores', async (req, res) => {
  try {
    const storesResult = await pool.query('SELECT * FROM stores ORDER BY id');

    // 각 매장의 테이블 정보를 실시간으로 가져오기
    const storesWithTables = await Promise.all(
      storesResult.rows.map(async (store) => {
        const tablesResult = await pool.query(`
          SELECT 
            table_number,
            table_name,
            seats,
            is_occupied,
            occupied_since
          FROM store_tables 
          WHERE store_id = $1 
          ORDER BY table_number
        `, [store.id]);

        const tables = tablesResult.rows.map(table => ({
          tableNumber: table.table_number,
          tableName: table.table_name,
          seats: table.seats,
          isOccupied: table.is_occupied,
          occupiedSince: table.occupied_since
        }));

        const totalTables = tables.length;
        const availableTables = tables.filter(t => !t.isOccupied).length;
        const occupiedTables = tables.filter(t => t.isOccupied).length;

        return {
          id: store.id,
          name: store.name,
          category: store.category,
          distance: store.distance || '정보없음',
          menu: store.menu || [],
          coord: store.coord || { lat: 37.5665, lng: 126.9780 },
          reviews: store.reviews || [],
          reviewCount: store.review_count || 0,
          ratingAverage: store.rating_average || 0, // 별점 평균 추가
          isOpen: store.is_open !== false,
          tableInfo: {
            totalTables,
            availableTables,
            occupiedTables,
            occupancyRate: totalTables > 0 ? Math.round((occupiedTables / totalTables) * 100) : 0
          },
          tables: tables
        };
      })
    );

    res.json({
      message: 'TableLink API 서버가 정상 작동 중입니다.',
      stores: storesWithTables
    });
  } catch (error) {
    console.error('stores 조회 실패:', error);
    res.status(500).json({ error: 'stores 조회 실패' });
  }
});

// 사용자 회원가입 API
app.post('/api/users/signup', async (req, res) => {
  const { id, pw, name, phone } = req.body;

  try {
    await pool.query(
      'INSERT INTO users (id, pw, name, phone) VALUES ($1, $2, $3, $4)',
      [id, pw, name, phone]
    );
    res.json({ success: true, message: '회원가입 성공' });
  } catch (error) {
    if (error.code === '23505') { // 중복 키 에러
      res.status(409).json({ error: '이미 존재하는 아이디입니다' });
    } else {
      console.error('회원가입 실패:', error);
      res.status(500).json({ error: '회원가입 실패' });
    }
  }
});

// 사용자 로그인 API
app.post('/api/users/login', async (req, res) => {
  const { id, pw } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: '존재하지 않는 아이디입니다' });
    }

    const user = result.rows[0];
    if (user.pw !== pw) {
      return res.status(401).json({ error: '비밀번호가 일치하지 않습니다' });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        point: user.point || 0,
        orderList: user.order_list || [],
        reservationList: user.reservation_list || [],
        coupons: user.coupons || { unused: [], used: [] },
        favoriteStores: user.favorite_stores || []
      }
    });
  } catch (error) {
    console.error('로그인 실패:', error);
    res.status(500).json({ error: '로그인 실패' });
  }
});

// 장바구니 저장 API
app.post('/api/cart/save', async (req, res) => {
  const { userId, storeId, storeName, tableNum, order, savedAt } = req.body;

  try {
    await pool.query(
      'INSERT INTO carts (user_id, store_id, store_name, table_num, order_data, saved_at) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (user_id, store_id) DO UPDATE SET order_data = $5, saved_at = $6',
      [userId, storeId, storeName, tableNum, JSON.stringify(order), savedAt]
    );
    res.json({ success: true, message: '장바구니 저장 성공' });
  } catch (error) {
    console.error('장바구니 저장 실패:', error);
    res.status(500).json({ error: '장바구니 저장 실패' });
  }
});

// 장바구니 조회 API
app.get('/api/cart/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query('SELECT * FROM carts WHERE user_id = $1', [userId]);
    res.json({
      success: true,
      carts: result.rows.map(row => ({
        id: row.id,
        storeId: row.store_id,
        storeName: row.store_name,
        tableNum: row.table_num,
        order: row.order_data,
        savedAt: row.saved_at
      }))
    });
  } catch (error) {
    console.error('장바구니 조회 실패:', error);
    res.status(500).json({ error: '장바구니 조회 실패' });
  }
});

// 주문 처리 API
app.post('/api/orders/pay', async (req, res) => {
  const { 
    userId, 
    orderData, 
    usedPoint, 
    finalTotal, 
    selectedCouponId, 
    couponDiscount 
  } = req.body;

  try {
    // 사용자 정보 조회
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    const user = userResult.rows[0];
    const currentCoupons = user.coupons || { unused: [], used: [] };

    // 포인트 부족 확인
    if (usedPoint > user.point) {
      return res.status(400).json({ error: '포인트가 부족합니다' });
    }

    // 쿠폰 유효성 확인
    let usedCoupon = null;
    if (selectedCouponId) {
      usedCoupon = currentCoupons.unused.find(c => c.id == selectedCouponId);
      if (!usedCoupon) {
        return res.status(400).json({ error: '유효하지 않은 쿠폰입니다' });
      }
    }

    // 계산
    const appliedPoint = Math.min(usedPoint, user.point, orderData.total);
    const realTotal = orderData.total - couponDiscount - appliedPoint;
    const earnedPoint = Math.floor(orderData.total * 0.1);

    // 사용자 정보 업데이트
    const newPoint = user.point - appliedPoint + earnedPoint;
    const currentOrderList = user.order_list || [];

    // 주문 기록 생성
    const orderRecord = {
      ...orderData,
      total: orderData.total,
      usedPoint: appliedPoint,
      couponDiscount: couponDiscount,
      totalDiscount: appliedPoint + couponDiscount,
      couponUsed: selectedCouponId || null,
      realTotal: realTotal,
      earnedPoint: earnedPoint,
      paymentStrategy: (couponDiscount > 0 || appliedPoint > 0)
        ? (couponDiscount >= appliedPoint ? "couponFirst" : "pointFirst")
        : "none"
    };

    // 쿠폰 처리
    let newCoupons = { ...currentCoupons };
    if (usedCoupon) {
      const unusedIndex = newCoupons.unused.findIndex(c => c.id == selectedCouponId);
      if (unusedIndex !== -1) {
        const movedCoupon = newCoupons.unused.splice(unusedIndex, 1)[0];
        newCoupons.used.push(movedCoupon);
      }
    }

    // 첫 주문시 웰컴 쿠폰 발급
    let welcomeCoupon = null;
    if (currentOrderList.length === 0) {
      const today = new Date();
      const expireDate = new Date(today);
      expireDate.setDate(today.getDate() + 14);

      welcomeCoupon = {
        id: Math.floor(Math.random() * 100000),
        name: "첫 주문 10% 할인",
        type: "welcome",
        discountType: "percent",
        discountValue: 10,
        minOrderAmount: 5000,
        validUntil: expireDate.toISOString().slice(0, 10),
        issuedAt: today.toISOString().slice(0, 10)
      };

      newCoupons.unused.push(welcomeCoupon);
    }

    // 주문 목록 업데이트
    const newOrderList = [...currentOrderList, orderRecord];

    // 데이터베이스 업데이트
    await pool.query(
      'UPDATE users SET point = $1, order_list = $2, coupons = $3 WHERE id = $4',
      [newPoint, JSON.stringify(newOrderList), JSON.stringify(newCoupons), userId]
    );

    res.json({
      success: true,
      message: '결제가 완료되었습니다',
      result: {
        finalTotal: realTotal,
        appliedPoint: appliedPoint,
        earnedPoint: earnedPoint,
        totalDiscount: appliedPoint + couponDiscount,
        welcomeCoupon: welcomeCoupon
      }
    });

  } catch (error) {
    console.error('결제 처리 실패:', error);
    res.status(500).json({ error: '결제 처리 실패' });
  }
});

// 사용자 정보 조회 API
app.post('/api/users/info', async (req, res) => {
  const { userId } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    const user = result.rows[0];
    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email || '',
        address: user.address || '',
        birth: user.birth || '',
        gender: user.gender || '',
        point: user.point || 0,
        orderList: user.order_list || [],
        reservationList: user.reservation_list || [],
        coupons: user.coupons || { unused: [], used: [] },
        favoriteStores: user.favorite_stores || []
      }
    });
  } catch (error) {
    console.error('사용자 정보 조회 실패:', error);
    res.status(500).json({ error: '사용자 정보 조회 실패' });
  }
});

// 즐겨찾기 토글 API
app.post('/api/users/favorite/toggle', async (req, res) => {
  const { userId, storeName, action } = req.body;

  try {
    // 사용자 정보 조회
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    const user = userResult.rows[0];
    let favoriteStores = user.favorite_stores || [];

    if (action === 'add') {
      // 즐겨찾기 추가
      if (!favoriteStores.includes(storeName)) {
        favoriteStores.push(storeName);
      }
    } else if (action === 'remove') {
      // 즐겨찾기 제거
      favoriteStores = favoriteStores.filter(store => store !== storeName);
    }

    // 데이터베이스 업데이트
    await pool.query(
      'UPDATE users SET favorite_stores = $1 WHERE id = $2',
      [JSON.stringify(favoriteStores), userId]
    );

    res.json({
      success: true,
      message: action === 'add' ? '즐겨찾기에 추가되었습니다' : '즐겨찾기에서 제거되었습니다',
      favoriteStores: favoriteStores
    });

  } catch (error) {
    console.error('즐겨찾기 토글 실패:', error);
    res.status(500).json({ error: '즐겨찾기 설정 실패' });
  }
});

// 매장별 테이블 목록 조회 API
app.get('/api/stores/:storeId/tables', async (req, res) => {
  const { storeId } = req.params;

  try {
    const result = await pool.query(`
      SELECT t.*, s.name as store_name 
      FROM store_tables t 
      JOIN stores s ON t.store_id = s.id 
      WHERE t.store_id = $1 
      ORDER BY t.table_number
    `, [storeId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '매장의 테이블 정보를 찾을 수 없습니다' });
    }

    const tables = result.rows.map(row => ({
      id: row.id,
      tableNumber: row.table_number,
      tableName: row.table_name,
      seats: row.seats,
      isOccupied: row.is_occupied,
      occupiedSince: row.occupied_since,
      storeName: row.store_name
    }));

    const occupiedTables = tables.filter(t => t.isOccupied);
    if (occupiedTables.length > 0) {
      console.log(`📊 매장 ${storeId} 점유된 테이블:`, occupiedTables.map(t => `테이블 ${t.tableNumber} (${t.isOccupied})`));
    }

    res.json({
      success: true,
      storeId: parseInt(storeId),
      totalTables: tables.length,
      availableTables: tables.filter(t => !t.isOccupied).length,
      occupiedTables: tables.filter(t => t.isOccupied).length,
      tables: tables
    });

  } catch (error) {
    console.error('테이블 조회 실패:', error);
    res.status(500).json({ error: '테이블 조회 실패' });
  }
});

// 테이블 상태 업데이트 API
app.post('/api/stores/tables/update', async (req, res) => {
  const { storeId, tableNumber, isOccupied } = req.body;

  try {
    // 테이블 존재 확인
    const tableResult = await pool.query(
      'SELECT * FROM store_tables WHERE store_id = $1 AND table_number = $2',
      [storeId, tableNumber]
    );

    if (tableResult.rows.length === 0) {
      return res.status(404).json({ error: '테이블을 찾을 수 없습니다' });
    }

    // 테이블 상태 업데이트
    const occupiedSince = isOccupied ? new Date() : null;
    await pool.query(`
      UPDATE store_tables 
      SET is_occupied = $1, occupied_since = $2 
      WHERE store_id = $3 AND table_number = $4
    `, [isOccupied, occupiedSince, storeId, tableNumber]);

    // 업데이트된 테이블 정보 조회
    const updatedTable = await pool.query(
      'SELECT * FROM store_tables WHERE store_id = $1 AND table_number = $2',
      [storeId, tableNumber]
    );

    res.json({
      success: true,
      message: `테이블 ${tableNumber}번 상태가 ${isOccupied ? '사용중' : '빈 테이블'}으로 변경되었습니다`,
      table: {
        id: updatedTable.rows[0].id,
        tableNumber: updatedTable.rows[0].table_number,
        tableName: updatedTable.rows[0].table_name,
        seats: updatedTable.rows[0].seats,
        isOccupied: updatedTable.rows[0].is_occupied,
        occupiedSince: updatedTable.rows[0].occupied_since
      }
    });

  } catch (error) {
    console.error('테이블 상태 업데이트 실패:', error);
    res.status(500).json({ error: '테이블 상태 업데이트 실패' });
  }
});

// 전체 테이블 현황 조회 API (관리자용)
app.get('/api/admin/tables/status', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        s.id as store_id,
        s.name as store_name,
        COUNT(t.id) as total_tables,
        COUNT(CASE WHEN t.is_occupied = true THEN 1 END) as occupied_tables,
        COUNT(CASE WHEN t.is_occupied = false THEN 1 END) as available_tables
      FROM stores s
      LEFT JOIN store_tables t ON s.id = t.store_id
      GROUP BY s.id, s.name
      ORDER BY s.id
    `);

    const overallStats = await pool.query(`
      SELECT 
        COUNT(*) as total_tables,
        COUNT(CASE WHEN is_occupied = true THEN 1 END) as occupied_tables,
        COUNT(CASE WHEN is_occupied = false THEN 1 END) as available_tables,
        ROUND(COUNT(CASE WHEN is_occupied = true THEN 1 END) * 100.0 / COUNT(*), 1) as occupancy_rate
      FROM store_tables
    `);

    res.json({
      success: true,
      overall: overallStats.rows[0],
      storeStats: result.rows
    });

  } catch (error) {
    console.error('전체 테이블 현황 조회 실패:', error);
    res.status(500).json({ error: '전체 테이블 현황 조회 실패' });
  }
});

// 테이블 점유 상태 설정 및 자동 해제 API
app.post('/api/tables/occupy', async (req, res) => {
  const { storeId, tableNumber } = req.body;

  console.log(`🔍 테이블 점유 요청: 매장 ID ${storeId}, 테이블 번호 ${tableNumber}`);

  try {
    // 먼저 테이블이 존재하는지 확인
    const existingTable = await pool.query(`
      SELECT * FROM store_tables 
      WHERE store_id = $1 AND table_number = $2
    `, [storeId, tableNumber]);

    if (existingTable.rows.length === 0) {
      console.log(`❌ 테이블을 찾을 수 없음: 매장 ID ${storeId}, 테이블 번호 ${tableNumber}`);
      return res.status(404).json({ error: '테이블을 찾을 수 없습니다' });
    }

    console.log(`📋 기존 테이블 상태:`, existingTable.rows[0]);

    // 테이블 점유 상태로 변경
    const occupiedTime = new Date();

    console.log(`🔧 SQL 쿼리 실행: UPDATE store_tables SET is_occupied = true, occupied_since = '${occupiedTime.toISOString()}' WHERE store_id = ${storeId} AND table_number = ${tableNumber}`);

    const updateResult = await pool.query(`
      UPDATE store_tables 
      SET is_occupied = $1, occupied_since = $2 
      WHERE store_id = $3 AND table_number = $4
      RETURNING *
    `, [true, occupiedTime, storeId, tableNumber]);

    console.log(`✅ 테이블 점유 상태 변경 완료:`, updateResult.rows[0]);
    console.log(`🔍 반영된 행 수: ${updateResult.rowCount}`);

    // 2분 후 자동 해제 스케줄링
    setTimeout(async () => {
      try {
        console.log(`⏰ 2분 후 자동 해제 시작: 매장 ID ${storeId}, 테이블 번호 ${tableNumber}`);

        // 2분이 지난 후 해당 테이블이 여전히 점유 상태인지 확인
        const tableResult = await pool.query(`
          SELECT * FROM store_tables 
          WHERE store_id = $1 AND table_number = $2 AND is_occupied = true
        `, [storeId, tableNumber]);

        if (tableResult.rows.length > 0) {
          const table = tableResult.rows[0];
          const occupiedSince = new Date(table.occupied_since);
          const now = new Date();
          const diffMinutes = Math.floor((now - occupiedSince) / (1000 * 60));

          console.log(`⏱️ 점유 시간 확인: ${diffMinutes}분 경과`);

          // 2분 이상 지났으면 해제
          if (diffMinutes >= 2) {
            const releaseResult = await pool.query(`
              UPDATE store_tables 
              SET is_occupied = $1, occupied_since = $2 
              WHERE store_id = $3 AND table_number = $4
              RETURNING *
            `, [false, null, storeId, tableNumber]);

            console.log(`✅ 테이블 ${tableNumber}번 (매장 ID: ${storeId}) 자동 해제 완료:`, releaseResult.rows[0]);
          }
        } else {
          console.log(`ℹ️ 테이블이 이미 해제됨: 매장 ID ${storeId}, 테이블 번호 ${tableNumber}`);
        }
      } catch (error) {
        console.error('❌ 테이블 자동 해제 실패:', error);
      }
    }, 2 * 60 * 1000); // 2분 = 120,000ms

    res.json({
      success: true,
      message: `테이블 ${tableNumber}번이 점유 상태로 변경되었습니다. 2분 후 자동 해제됩니다.`,
      occupiedSince: occupiedTime,
      updatedTable: updateResult.rows[0]
    });

  } catch (error) {
    console.error('❌ 테이블 점유 상태 설정 실패:', error);
    res.status(500).json({ error: '테이블 점유 상태 설정 실패' });
  }
});

// 점유된 테이블들의 자동 해제 체크 (서버 시작 시 복구)
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

// 매장별 리뷰 조회 API (reviews 테이블에서 JOIN으로 조회)
app.get('/api/stores/:storeId/reviews', async (req, res) => {
  try {
    const { storeId } = req.params;
    console.log(`\n=== 📖 매장 ${storeId} 리뷰 조회 API 시작 (reviews 테이블 JOIN) ===`);

    // reviews 테이블에서 매장의 모든 리뷰 조회 (사용자 이름 포함)
    const query = `
      SELECT 
        r.id,
        r.rating as score,
        r.review_text as content,
        r.order_date,
        r.created_at,
        u.name as user_name,
        u.id as user_id
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.store_id = $1
      ORDER BY r.created_at DESC
    `;

    console.log('🔍 실행할 SQL 쿼리:', query);
    console.log('🔍 쿼리 파라미터 - storeId:', storeId, '(타입:', typeof storeId, ')');

    const result = await pool.query(query, [parseInt(storeId)]);
    
    console.log(`🔍 데이터베이스 쿼리 결과: ${result.rows.length}개 리뷰 발견`);
    
    if (result.rows.length > 0) {
      console.log(`📊 조회된 리뷰 상세:`, result.rows);
    } else {
      console.log('❌ 조회된 리뷰가 없음. 전체 리뷰에서 매장별 분포 확인...');
      const storeDistribution = await pool.query('SELECT store_id, COUNT(*) as count FROM reviews GROUP BY store_id ORDER BY store_id');
      console.log('📊 매장별 리뷰 분포:', storeDistribution.rows);
    }

    const reviews = result.rows.map(row => ({
      id: row.id,
      score: row.score,
      content: row.content,
      date: new Date(row.created_at).toLocaleDateString('ko-KR'),
      orderDate: row.order_date,
      user: row.user_name || `사용자${row.user_id}`, // renderAllReview.js에서 사용하는 속성명
      userId: row.user_id
    }));

    console.log(`✅ 매장 ${storeId} 리뷰 ${reviews.length}개 처리 완료`);

    const responseData = {
      success: true,
      storeId: parseInt(storeId),
      total: reviews.length,
      reviews: reviews
    };

    console.log(`📤 클라이언트로 전송할 최종 데이터:`, JSON.stringify(responseData, null, 2));

    res.json(responseData);

  } catch (error) {
    console.error('❌ 리뷰 조회 오류 (상세):', error);
    console.error('❌ 오류 스택:', error.stack);
    res.status(500).json({
      success: false,
      error: '리뷰 조회 중 오류가 발생했습니다: ' + error.message
    });
  }
});

// 리뷰 제출 API (reviews 테이블에 저장)
app.post('/api/reviews/submit', async (req, res) => {
  const { userId, storeId, storeName, orderIndex, rating, reviewText, orderDate } = req.body;

  console.log('📝 리뷰 등록 요청 받음:', { userId, storeId, orderIndex, rating, reviewText });

  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    console.log('🔍 트랜잭션 시작 - 리뷰 등록 처리 시작:', { userId, storeId, orderIndex });

    // 사용자 정보 조회
    const userResult = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      console.log('❌ 사용자를 찾을 수 없음:', userId);
      await client.query('ROLLBACK');
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    const user = userResult.rows[0];
    const orderList = user.order_list || [];
    console.log('📋 사용자 주문 목록:', orderList.length, '개');

    // 해당 주문이 존재하는지 확인
    if (orderIndex >= orderList.length) {
      console.log('❌ 존재하지 않는 주문:', { orderIndex, totalOrders: orderList.length });
      await client.query('ROLLBACK');
      return res.status(400).json({ error: '존재하지 않는 주문입니다' });
    }

    // 이미 리뷰를 작성했는지 확인 (reviews 테이블에서)
    const existingReview = await client.query(
      'SELECT id FROM reviews WHERE user_id = $1 AND order_index = $2',
      [userId, orderIndex]
    );

    console.log('🔍 기존 리뷰 확인:', existingReview.rows.length > 0 ? '이미 존재함' : '없음');
    if (existingReview.rows.length > 0) {
      console.log('❌ 이미 리뷰 작성됨:', existingReview.rows[0]);
      await client.query('ROLLBACK');
      return res.status(400).json({ error: '이미 리뷰를 작성한 주문입니다' });
    }

    // reviews 테이블에 새 리뷰 삽입
    const reviewResult = await client.query(`
      INSERT INTO reviews (user_id, store_id, order_index, rating, review_text, order_date)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, created_at
    `, [userId, storeId, orderIndex, rating, reviewText, orderDate]);

    const newReviewId = reviewResult.rows[0].id;
    const createdAt = reviewResult.rows[0].created_at;

    console.log('✅ reviews 테이블에 리뷰 추가 완료, ID:', newReviewId);

    // 사용자의 주문 목록에 리뷰ID 추가
    orderList[orderIndex].reviewId = newReviewId;
    await client.query(
      'UPDATE users SET order_list = $1 WHERE id = $2',
      [JSON.stringify(orderList), userId]
    );

    console.log('✅ 사용자 주문 목록 업데이트 완료');

    // stores 테이블의 review_count와 별점 평균 업데이트
    await updateStoreRating(storeId);

    console.log('✅ stores 테이블 review_count 및 별점 평균 업데이트 완료');

    // 트랜잭션 커밋
    await client.query('COMMIT');
    console.log('✅ 트랜잭션 커밋 완료');

    // 응답용 리뷰 객체 생성
    const responseReview = {
      id: newReviewId,
      score: rating,
      content: reviewText,
      date: new Date(createdAt).toLocaleDateString('ko-KR'),
      orderDate: orderDate,
      user: user.name || `사용자${userId}`,
      userId: userId
    };

    res.json({
      success: true,
      message: '리뷰가 성공적으로 등록되었습니다',
      review: responseReview
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 리뷰 등록 실패 (상세):', error);
    console.error('❌ 에러 스택:', error.stack);
    res.status(500).json({ error: '리뷰 등록 실패: ' + error.message });
  } finally {
    client.release();
  }
});

// 리뷰 수정 API
app.put('/api/reviews/:reviewId', async (req, res) => {
  const { reviewId } = req.params;
  const { content, score, userId } = req.body;

  console.log('✏️ 리뷰 수정 요청:', { reviewId, content, score, userId });

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 해당 리뷰가 현재 사용자의 것인지 확인
    const reviewResult = await client.query(
      'SELECT * FROM reviews WHERE id = $1 AND user_id = $2',
      [reviewId, userId]
    );

    if (reviewResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: '수정 권한이 없습니다' });
    }

    // 리뷰 수정
    const updateResult = await client.query(`
      UPDATE reviews 
      SET review_text = $1, rating = $2, created_at = NOW()
      WHERE id = $3 AND user_id = $4
      RETURNING store_id
    `, [content, score, reviewId, userId]);

    if (updateResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: '리뷰 수정 실패' });
    }

    const storeId = updateResult.rows[0].store_id;

    // stores 테이블의 별점 평균 업데이트
    await updateStoreRating(storeId);

    await client.query('COMMIT');
    console.log('✅ 리뷰 수정 및 별점 평균 업데이트 완료:', updateResult.rows[0]);

    res.json({
      success: true,
      message: '리뷰가 수정되었습니다',
      review: updateResult.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 리뷰 수정 실패:', error);
    res.status(500).json({ error: '리뷰 수정 실패: ' + error.message });
  } finally {
    client.release();
  }
});

// 리뷰 삭제 API
app.delete('/api/reviews/:reviewId', async (req, res) => {
  const { reviewId } = req.params;
  const { userId } = req.body;

  console.log('🗑️ 리뷰 삭제 요청:', { reviewId, userId });

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 해당 리뷰가 현재 사용자의 것인지 확인하고 삭제
    const deleteResult = await client.query(`
      DELETE FROM reviews 
      WHERE id = $1 AND user_id = $2
      RETURNING store_id, order_index
    `, [reviewId, userId]);

    if (deleteResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: '삭제 권한이 없거나 리뷰를 찾을 수 없습니다' });
    }

    const deletedReview = deleteResult.rows[0];
    console.log('✅ 리뷰 삭제 완료:', deletedReview);

    // 사용자의 주문 목록에서 reviewId 제거
    const userResult = await client.query('SELECT order_list FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length > 0) {
      const orderList = userResult.rows[0].order_list || [];
      if (orderList[deletedReview.order_index]) {
        delete orderList[deletedReview.order_index].reviewId;
        await client.query(
          'UPDATE users SET order_list = $1 WHERE id = $2',
          [JSON.stringify(orderList), userId]
        );
        console.log('✅ 사용자 주문 목록에서 reviewId 제거 완료');
      }
    }

    // stores 테이블의 review_count와 별점 평균 업데이트
    await updateStoreRating(deletedReview.store_id);

    console.log('✅ stores 테이블 review_count 및 별점 평균 업데이트 완료');

    await client.query('COMMIT');

    res.json({
      success: true,
      message: '리뷰가 삭제되었습니다',
      storeId: deletedReview.store_id
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 리뷰 삭제 실패:', error);
    res.status(500).json({ error: '리뷰 삭제 실패: ' + error.message });
  } finally {
    client.release();
  }
});

// 서버 실행
app.listen(PORT, () => {
  console.log(`🚀 TableLink 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`📱 http://localhost:${PORT} 에서 접속 가능합니다.`);

  // 서버 시작 시 만료된 테이블들 해제
  checkAndReleaseExpiredTables();
});