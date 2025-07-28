const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./shared/config/database');

const app = express();
const PORT = 5000;

// CORS, JSON 파싱
app.use(cors());
app.use(express.json());

// 루트 디렉토리의 정적 파일 서빙 (css, js, 이미지 등)
app.use(express.static(__dirname));

// 루트(/) 접속 시 public/index.html 반환 (일반 로그인)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 관리자 로그인 페이지
app.get('/ADMIN', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// KDS 페이지
app.get('/KDS', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'kds.html'));
});

// POS 페이지
app.get('/POS', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pos.html'));
});

// TLM 페이지 (쿼리 파라미터 방식)
app.get('/tlm.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'tlm.html'));
});

// TLM 동적 라우트 (매장별 사장님 앱) - 하위 호환성
app.get('/tlm/:storeId', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'tlm.html'));
});

// TLM 동적 라우트 (대문자 버전) - 하위 호환성
app.get('/TLM/:storeId', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'tlm.html'));
});

// 로그아웃 라우팅
app.post('/api/logout', (req, res) => {
  console.log('🔓 로그아웃 요청');
  res.json({ success: true, message: '로그아웃 완료' });
});

// 매장 통계 API
app.get('/api/stores/:storeId/stats', async (req, res) => {
  try {
    const { storeId } = req.params;
    console.log(`📊 매장 ${storeId} 통계 조회 요청`);

    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date().toISOString().slice(0, 7);

    // 오늘 주문 통계
    const todayStats = await pool.query(`
      SELECT COUNT(*) as count, COALESCE(SUM(final_amount), 0) as revenue
      FROM orders 
      WHERE store_id = $1 AND DATE(order_date) = $2
    `, [storeId, today]);

    // 이번달 주문 통계
    const monthStats = await pool.query(`
      SELECT COUNT(*) as count, COALESCE(SUM(final_amount), 0) as revenue
      FROM orders 
      WHERE store_id = $1 AND DATE_TRUNC('month', order_date) = $2
    `, [storeId, thisMonth + '-01']);

    const stats = {
      todayOrders: parseInt(todayStats.rows[0].count),
      todayRevenue: parseInt(todayStats.rows[0].revenue),
      monthOrders: parseInt(monthStats.rows[0].count),
      monthRevenue: parseInt(monthStats.rows[0].revenue)
    };

    console.log(`✅ 매장 ${storeId} 통계 조회 완료:`, stats);

    res.json({
      success: true,
      stats: stats
    });

  } catch (error) {
    console.error('❌ 매장 통계 조회 실패:', error);
    res.status(500).json({ 
      success: false, 
      error: '통계 조회 실패' 
    });
  }
});

// 개별 매장 정보 조회 API (TLM용)
app.get('/api/stores/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;
    console.log(`🏪 개별 매장 정보 조회 요청: ${storeId}`);

    const storeResult = await pool.query('SELECT * FROM stores WHERE id = $1', [parseInt(storeId)]);

    if (storeResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: '매장을 찾을 수 없습니다' 
      });
    }

    const store = storeResult.rows[0];

    // 테이블 정보 조회
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
    `, [parseInt(storeId)]);

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

    const storeData = {
      id: store.id,
      name: store.name,
      category: store.category,
      distance: store.distance || '정보없음',
      address: store.address || '주소 정보 없음',
      menu: store.menu || [],
      coord: store.coord || { lat: 37.5665, lng: 126.9780 },
      reviews: store.reviews || [],
      reviewCount: store.review_count || 0,
      ratingAverage: store.rating_average ? parseFloat(store.rating_average) : 0.0,
      isOpen: store.is_open !== false,
      tableInfo: {
        totalTables,
        availableTables,
        occupiedTables,
        occupancyRate: totalTables > 0 ? Math.round((occupiedTables / totalTables) * 100) : 0
      },
      tables: tables
    };

    console.log(`✅ 매장 ${storeId} 정보 조회 완료`);
    res.json({
      success: true,
      store: storeData
    });

  } catch (error) {
    console.error('❌ 개별 매장 조회 실패:', error);
    res.status(500).json({ 
      success: false, 
      error: '매장 정보 조회 실패' 
    });
  }
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
          address: store.address || '주소 정보 없음',
          menu: store.menu || [],
          coord: store.coord || { lat: 37.5665, lng: 126.9780 },
          reviews: store.reviews || [],
          reviewCount: store.review_count || 0,
          ratingAverage: store.rating_average ? parseFloat(store.rating_average) : 0.0, // null/undefined 처리 개선
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
      success: true,
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

// 주문 처리 API (orders 테이블에도 저장)
app.post('/api/orders/pay', async (req, res) => {
  const { 
    userId, 
    orderData, 
    usedPoint, 
    finalTotal, 
    selectedCouponId, 
    couponDiscount 
  } = req.body;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 사용자 정보 조회
    const userResult = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    const user = userResult.rows[0];
    const currentCoupons = user.coupons || { unused: [], used: [] };

    // 포인트 부족 확인
    if (usedPoint > user.point) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: '포인트가 부족합니다' });
    }

    // 쿠폰 유효성 확인
    let usedCoupon = null;
    if (selectedCouponId) {
      usedCoupon = currentCoupons.unused.find(c => c.id == selectedCouponId);
      if (!usedCoupon) {
        await client.query('ROLLBACK');
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

    // 사용자 테이블 업데이트
    await client.query(
      'UPDATE users SET point = $1, order_list = $2, coupons = $3 WHERE id = $4',
      [newPoint, JSON.stringify(newOrderList), JSON.stringify(newCoupons), userId]
    );

    // 테이블 이름으로 고유 ID 및 실제 테이블 정보 찾기
    let tableUniqueId = null;
    let actualTableNumber = null;

    if (orderData.tableNum && orderData.storeId) {
      console.log(`🔍 테이블 정보 조회 시작: "${orderData.tableNum}" (매장 ID: ${orderData.storeId})`);

      try {
        // 매장 ID와 테이블 이름으로 실제 테이블 정보 조회
        const tableResult = await client.query(`
          SELECT unique_id, table_number, table_name 
          FROM store_tables 
          WHERE store_id = $1 AND table_name = $2
        `, [orderData.storeId, orderData.tableNum]);

        if (tableResult.rows.length > 0) {
          const table = tableResult.rows[0];
          tableUniqueId = table.unique_id;
          actualTableNumber = table.table_number;
          console.log(`✅ 테이블 정보 찾음: ${table.table_name} -> unique_id: ${tableUniqueId}, table_number: ${actualTableNumber}`);
        } else {
          console.log(`❌ 테이블을 찾을 수 없음: "${orderData.tableNum}" (매장 ID: ${orderData.storeId})`);

          // 백업: 테이블 이름에서 숫자 추출 시도
          const numberMatches = orderData.tableNum.toString().match(/\d+/g);
          if (numberMatches && numberMatches.length > 0) {
            actualTableNumber = parseInt(numberMatches[numberMatches.length - 1]);
            console.log(`🔄 백업 방식으로 테이블 번호 추출: ${actualTableNumber}`);
          }
        }
      } catch (error) {
        console.error(`❌ 테이블 정보 조회 실패:`, error);
      }
    } else {
      console.log(`❌ tableNum 또는 storeId가 없음`);
    }

    // orders 테이블에 주문 정보 저장 (table_unique_id 컬럼 추가 필요)
    await client.query(`
      INSERT INTO orders (
        store_id, user_id, table_number, table_unique_id, order_data, 
        total_amount, discount_amount, final_amount, 
        order_status, order_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
    `, [
      orderData.storeId || null,
      userId,
      actualTableNumber,
      tableUniqueId,
      JSON.stringify(orderData),
      orderData.total,
      appliedPoint + couponDiscount,
      realTotal,
      'completed'
    ]);

    await client.query('COMMIT');

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
    await client.query('ROLLBACK');
    console.error('결제 처리 실패:', error);
    res.status(500).json({ error: '결제 처리 실패' });
  } finally {
    client.release();
  }
});

// 매장별 주문 내역 조회 API (TLM용)
app.get('/api/stores/:storeId/orders', async (req, res) => {
  try {
    const { storeId } = req.params;
    const { status, limit = 50 } = req.query;

    console.log(`📋 매장 ${storeId} 주문 내역 조회 요청`);

    let query = `
      SELECT 
        o.*,
        u.name as customer_name,
        u.phone as customer_phone
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.store_id = $1
    `;

    const params = [parseInt(storeId)];

    if (status) {
      query += ` AND o.order_status = $${params.length + 1}`;
      params.push(status);
    }

    query += ` ORDER BY o.order_date DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit));

    const result = await pool.query(query, params);

    const orders = result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      tableNumber: row.table_number,
      orderData: row.order_data,
      totalAmount: row.total_amount,
      discountAmount: row.discount_amount,
      finalAmount: row.final_amount,
      paymentMethod: row.payment_method,
      orderStatus: row.order_status,
      orderDate: row.order_date,
      completedAt: row.completed_at
    }));

    console.log(`✅ 매장 ${storeId} 주문 내역 ${orders.length}개 조회 완료`);

    res.json({
      success: true,
      storeId: parseInt(storeId),
      total: orders.length,
      orders: orders
    });

  } catch (error) {
    console.error('❌ 매장 주문 내역 조회 실패:', error);
    res.status(500).json({ 
      success: false, 
      error: '주문 내역 조회 실패' 
    });
  }
});

// 매장의 전체 주문 조회 API (TLM용)
app.get('/api/stores/:storeId/orders', async (req, res) => {
  try {
    const { storeId } = req.params;
    const limit = req.query.limit || 100; // 기본 100개 제한

    console.log(`📋 매장 ${storeId} 전체 주문 조회 요청 (최대 ${limit}개)`);

    const result = await pool.query(`
      SELECT 
        id, store_id, user_id, table_number, order_data, 
        total_amount, discount_amount, final_amount, 
        order_status, order_date, completed_at
      FROM orders 
      WHERE store_id = $1 
      ORDER BY order_date DESC 
      LIMIT $2
    `, [storeId, limit]);

    const orders = result.rows.map(row => ({
      id: row.id,
      storeId: row.store_id,
      userId: row.user_id,
      tableNumber: row.table_number,
      orderData: row.order_data,
      totalAmount: row.total_amount,
      discountAmount: row.discount_amount,
      finalAmount: row.final_amount,
      orderStatus: row.order_status,
      orderDate: row.order_date,
      completedAt: row.completed_at
    }));

    console.log(`✅ 매장 ${storeId} 전체 주문 ${orders.length}개 조회 완료`);

    res.json({
      success: true,
      storeId: parseInt(storeId),
      total: orders.length,
      orders: orders
    });

  } catch (error) {
    console.error('❌ 매장 전체 주문 조회 실패:', error);
    res.status(500).json({ 
      success: false, 
      error: '전체 주문 조회 실패' 
    });
  }
});

// 매장의 전체 리뷰 조회 API (TLM용)
app.get('/api/stores/:storeId/reviews', async (req, res) => {
  try {
    const { storeId } = req.params;
    const limit = req.query.limit || 100; // 기본 100개 제한

    console.log(`⭐ 매장 ${storeId} 전체 리뷰 조회 요청 (최대 ${limit}개)`);

    const result = await pool.query(`
      SELECT 
        id, user_id, store_id, order_index, rating, 
        review_text, order_date, created_at
      FROM reviews 
      WHERE store_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2
    `, [storeId, limit]);

    const reviews = result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      storeId: row.store_id,
      orderIndex: row.order_index,
      rating: row.rating,
      reviewText: row.review_text,
      orderDate: row.order_date,
      createdAt: row.created_at
    }));

    console.log(`✅ 매장 ${storeId} 전체 리뷰 ${reviews.length}개 조회 완료`);

    res.json({
      success: true,
      storeId: parseInt(storeId),
      total: reviews.length,
      reviews: reviews
    });

  } catch (error) {
    console.error('❌ 매장 전체 리뷰 조회 실패:', error);
    res.status(500).json({ 
      success: false, 
      error: '전체 리뷰 조회 실패' 
    });
  }
});

// 주문 상태 업데이트 API (TLM용)
app.put('/api/orders/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    console.log(`🔄 주문 ${orderId} 상태 변경 요청: ${status}`);

    const validStatuses = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: '유효하지 않은 주문 상태입니다' });
    }

    const completedAt = status === 'completed' ? new Date() : null;

    const result = await pool.query(`
      UPDATE orders 
      SET order_status = $1, completed_at = $2
      WHERE id = $3
      RETURNING *
    `, [status, completedAt, orderId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '주문을 찾을 수 없습니다' });
    }

    console.log(`✅ 주문 ${orderId} 상태 변경 완료: ${status}`);

    res.json({
      success: true,
      message: `주문 상태가 ${status}로 변경되었습니다`,
      order: result.rows[0]
    });

  } catch (error) {
    console.error('❌ 주문 상태 업데이트 실패:', error);
    res.status(500).json({ error: '주문 상태 업데이트 실패' });
  }
});

// 매장별 주문 통계 API (TLM용)
app.get('/api/stores/:storeId/orders/stats', async (req, res) => {
  try {
    const { storeId } = req.params;
    const { period = 'today' } = req.query;

    console.log(`📊 매장 ${storeId} 주문 통계 조회 요청 (기간: ${period})`);

    let dateCondition = '';
    switch (period) {
      case 'today':
        dateCondition = "AND DATE(order_date) = CURRENT_DATE";
        break;
      case 'week':
        dateCondition = "AND order_date >= NOW() - INTERVAL '7 days'";
        break;
      case 'month':
        dateCondition = "AND order_date >= NOW() - INTERVAL '30 days'";
        break;
      default:
        dateCondition = "AND DATE(order_date) = CURRENT_DATE";
    }

    const statsQuery = `
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN order_status = 'completed' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN order_status = 'pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN order_status = 'preparing' THEN 1 END) as preparing_orders,
        COALESCE(SUM(CASE WHEN order_status = 'completed' THEN final_amount ELSE 0 END), 0) as total_revenue,
        COALESCE(AVG(CASE WHEN order_status = 'completed' THEN final_amount ELSE NULL END), 0) as avg_order_value
      FROM orders 
      WHERE store_id = $1 ${dateCondition}
    `;

    const result = await pool.query(statsQuery, [parseInt(storeId)]);
    const stats = result.rows[0];

    console.log(`✅ 매장 ${storeId} 주문 통계 조회 완료`);

    res.json({
      success: true,
      storeId: parseInt(storeId),
      period: period,
      stats: {
        totalOrders: parseInt(stats.total_orders),
        completedOrders: parseInt(stats.completed_orders),
        pendingOrders: parseInt(stats.pending_orders),
        preparingOrders: parseInt(stats.preparing_orders),
        totalRevenue: parseInt(stats.total_revenue),
        avgOrderValue: Math.round(parseFloat(stats.avg_order_value))
      }
    });

  } catch (error) {
    console.error('❌ 매장 주문 통계 조회 실패:', error);
    res.status(500).json({ 
      success: false, 
      error: '주문 통계 조회 실패' 
    });
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

// 테이블 상태 업데이트 API (고유 ID 기반)
app.post('/api/stores/tables/update', async (req, res) => {
  const { storeId, tableName, isOccupied } = req.body;

  try {
    // 테이블 존재 확인
    const tableResult = await pool.query(
      'SELECT * FROM store_tables WHERE store_id = $1 AND table_name = $2',
      [storeId, tableName]
    );

    if (tableResult.rows.length === 0) {
      return res.status(404).json({ error: '테이블을 찾을 수 없습니다' });
    }

    const table = tableResult.rows[0];

    // 테이블 상태 업데이트
    const occupiedSince = isOccupied ? new Date() : null;
    await pool.query(`
      UPDATE store_tables 
      SET is_occupied = $1, occupied_since = $2 
      WHERE unique_id = $3
    `, [isOccupied, occupiedSince, table.unique_id]);

    // 업데이트된 테이블 정보 조회
    const updatedTable = await pool.query(
      'SELECT * FROM store_tables WHERE unique_id = $1',
      [table.unique_id]
    );

    res.json({
      success: true,
      message: `${table.table_name} 상태가 ${isOccupied ? '사용중' : '빈 테이블'}으로 변경되었습니다`,
      table: {
        id: updatedTable.rows[0].id,
        uniqueId: updatedTable.rows[0].unique_id,
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

// 테이블 점유 상태 설정 및 자동 해제 API (고유 ID 기반)
app.post('/api/tables/occupy', async (req, res) => {
  const { storeId, tableName } = req.body;

  console.log(`🔍 테이블 점유 요청: 매장 ID ${storeId}, 테이블 이름 "${tableName}"`);

  try {
    // 매장 ID와 테이블 이름으로 실제 테이블 찾기
    const existingTable = await pool.query(`
      SELECT * FROM store_tables 
      WHERE store_id = $1 AND table_name = $2
    `, [storeId, tableName]);

    if (existingTable.rows.length === 0) {
      console.log(`❌ 테이블을 찾을 수 없음: 매장 ID ${storeId}, 테이블 이름 "${tableName}"`);
      return res.status(404).json({ error: '테이블을 찾을 수 없습니다' });
    }

    const table = existingTable.rows[0];
    console.log(`📋 기존 테이블 상태:`, table);

    // 테이블 점유 상태로 변경
    const occupiedTime = new Date();

    console.log(`🔧 테이블 점유 상태 변경: ${table.table_name} (unique_id: ${table.unique_id})`);

    const updateResult = await pool.query(`
      UPDATE store_tables 
      SET is_occupied = $1, occupied_since = $2 
      WHERE unique_id = $3
      RETURNING *
    `, [true, occupiedTime, table.unique_id]);

    console.log(`✅ 테이블 점유 상태 변경 완료:`, updateResult.rows[0]);

    // 2분 후 자동 해제 스케줄링
    setTimeout(async () => {
      try {
        console.log(`⏰ 2분 후 자동 해제 시작: ${table.table_name} (unique_id: ${table.unique_id})`);

        // 2분이 지난 후 해당 테이블이 여전히 점유 상태인지 확인
        const tableResult = await pool.query(`
          SELECT * FROM store_tables 
          WHERE unique_id = $1 AND is_occupied = true
        `, [table.unique_id]);

        if (tableResult.rows.length > 0) {
          const currentTable = tableResult.rows[0];
          const occupiedSince = new Date(currentTable.occupied_since);
          const now = new Date();
          const diffMinutes = Math.floor((now - occupiedSince) / (1000 * 60));

          console.log(`⏱️ 점유 시간 확인: ${diffMinutes}분 경과`);

          // 2분 이상 지났으면 해제
          if (diffMinutes >= 2) {
            const releaseResult = await pool.query(`
              UPDATE store_tables 
              SET is_occupied = $1, occupied_since = $2 
              WHERE unique_id = $3
              RETURNING *
            `, [false, null, table.unique_id]);

            console.log(`✅ 테이블 ${table.table_name} 자동 해제 완료:`, releaseResult.rows[0]);
          }
        } else {
          console.log(`ℹ️ 테이블이 이미 해제됨: ${table.table_name}`);
        }
      } catch (error) {
        console.error('❌ 테이블 자동 해제 실패:', error);
      }
    }, 2 * 60 * 1000); // 2분 = 120,000ms

    res.json({
      success: true,
      message: `${table.table_name}이 점유 상태로 변경되었습니다. 2분 후 자동 해제됩니다.`,
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

// 매장별 별점 정보 조회 API
app.get('/api/stores/:storeId/rating', async (req, res) => {
  try {
    const { storeId } = req.params;
    console.log(`⭐ 매장 ${storeId} 별점 정보 조회 요청`);

    // stores 테이블에서 해당 매장의 별점 정보만 조회
    const result = await pool.query(`
      SELECT rating_average, review_count 
      FROM stores 
      WHERE id = $1
    `, [parseInt(storeId)]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '매장을 찾을 수 없습니다' });
    }

    const store = result.rows[0];
    const ratingData = {
      success: true,
      storeId: parseInt(storeId),
      ratingAverage: store.rating_average ? parseFloat(store.rating_average) : 0.0,
      reviewCount: store.review_count || 0
    };

    console.log(`⭐ 매장 ${storeId} 별점 정보 조회 완료: ${ratingData.ratingAverage}점 (${ratingData.reviewCount}개 리뷰)`);
    res.json(ratingData);

  } catch (error) {
    console.error('❌ 매장 별점 정보 조회 실패:', error);
    res.status(500).json({ error: '매장 별점 정보 조회 실패' });
  }
});

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

// 관리자 통계 API - 매장 통계
app.get('/api/admin/stats/stores', async (req, res) => {
  try {
    const totalStoresResult = await pool.query('SELECT COUNT(*) FROM stores');
    const activeStoresResult = await pool.query('SELECT COUNT(*) FROM stores WHERE is_open = true');

    res.json({
      total: parseInt(totalStoresResult.rows[0].count),
      active: parseInt(activeStoresResult.rows[0].count)
    });
  } catch (error) {
    console.error('매장 통계 조회 실패:', error);
    res.status(500).json({ error: '매장 통계 조회 실패' });
  }
});

// 관리자 통계 API - 사용자 통계
app.get('/api/admin/stats/users', async (req, res) => {
  try {
    const totalUsersResult = await pool.query('SELECT COUNT(*) FROM users');
    // 오늘 활성 사용자는 임시로 전체 사용자의 20%로 계산
    const totalUsers = parseInt(totalUsersResult.rows[0].count);
    const activeToday = Math.floor(totalUsers * 0.2);

    res.json({
      total: totalUsers,
      activeToday: activeToday
    });
  } catch (error) {
    console.error('사용자 통계 조회 실패:', error);
    res.status(500).json({ error: '사용자 통계 조회 실패' });
  }
});

// 매장 즐겨찾기 추가 API
app.post('/api/users/:userId/favorites/:storeId', async (req, res) => {
  const { userId, storeId } = req.params;

  try {
    // Implement the logic to add the store to the user's favorites
    // and send the appropriate response.
    res.status(501).json({ error: 'Not implemented' });
  } catch (error) {
    console.error('Failed to add store to favorites:', error);
    res.status(500).json({ error: 'Failed to add store to favorites' });
  }
});

// 매장별 테이블 정보 조회
app.get('/api/tables/store/:storeId', async (req, res) => {
  try {
    const storeId = req.params.storeId;

    // 매장의 모든 테이블 정보 조회
    const tablesResult = await pool.query(`
      SELECT t.*, s.name as store_name 
      FROM store_tables t 
      JOIN stores s ON t.store_id = s.id 
      WHERE t.store_id = $1 
      ORDER BY t.table_number
    `, [storeId]);

    const tables = tablesResult.rows;
    const totalTables = tables.length;
    const occupiedTables = tables.filter(table => table.is_occupied).length;
    const availableTables = totalTables - occupiedTables;

    res.json({
      success: true,
      storeId: parseInt(storeId),
      totalTables,
      availableTables,
      occupiedTables,
      tables
    });

  } catch (error) {
    console.error('테이블 정보 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '테이블 정보 조회에 실패했습니다.'
    });
  }
});

// 매장 운영 상태 토글
app.post('/api/stores/:storeId/toggle-status', async (req, res) => {
  try {
    const storeId = req.params.storeId;

    // 현재 상태 조회
    const currentResult = await pool.query('SELECT is_open FROM stores WHERE id = $1', [storeId]);
    if (currentResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: '매장을 찾을 수 없습니다.' });
    }

    const currentStatus = currentResult.rows[0].is_open;
    const newStatus = !currentStatus;

    // 상태 업데이트
    await pool.query('UPDATE stores SET is_open = $1 WHERE id = $2', [newStatus, storeId]);

    res.json({
      success: true,
      isOpen: newStatus,
      message: `매장이 ${newStatus ? '운영중' : '운영중지'} 상태로 변경되었습니다.`
    });

  } catch (error) {
    console.error('매장 상태 변경 실패:', error);
    res.status(500).json({ success: false, error: '매장 상태 변경에 실패했습니다.' });
  }
});

// 매장별 최근 주문 조회
app.get('/api/orders/recent/:storeId', async (req, res) => {
  try {
    const storeId = req.params.storeId;

    const ordersResult = await pool.query(`
      SELECT o.*, t.table_name, t.table_number
      FROM orders o
      JOIN store_tables t ON o.table_unique_id = t.unique_id
      WHERE t.store_id = $1
      ORDER BY o.order_date DESC
      LIMIT 10
    `, [storeId]);

    res.json({
      success: true,
      orders: ordersResult.rows
    });

  } catch (error) {
    console.error('최근 주문 조회 실패:', error);
    res.status(500).json({ success: false, error: '최근 주문 조회에 실패했습니다.' });
  }
});

// 매장별 전체 주문 조회
app.get('/api/orders/store/:storeId', async (req, res) => {
  try {
    const storeId = req.params.storeId;

    const ordersResult = await pool.query(`
      SELECT o.*, t.table_name, t.table_number
      FROM orders o
      JOIN store_tables t ON o.table_unique_id = t.unique_id
      WHERE t.store_id = $1
      ORDER BY o.order_date DESC
    `, [storeId]);

    res.json({
      success: true,
      orders: ordersResult.rows
    });

  } catch (error) {
    console.error('전체 주문 조회 실패:', error);
    res.status(500).json({ success: false, error: '전체 주문 조회에 실패했습니다.' });
  }
});

// 매장별 최근 리뷰 조회
app.get('/api/reviews/recent/:storeId', async (req, res) => {
  try {
    const storeId = req.params.storeId;

    const reviewsResult = await pool.query(`
      SELECT * FROM reviews 
      WHERE store_id = $1 
      ORDER BY created_at DESC 
      LIMIT 5
    `, [storeId]);

    res.json({
      success: true,
      reviews: reviewsResult.rows
    });

  } catch (error) {
    console.error('최근 리뷰 조회 실패:', error);
    res.status(500).json({ success: false, error: '최근 리뷰 조회에 실패했습니다.' });
  }
});

// 매장별 전체 리뷰 조회
app.get('/api/reviews/store/:storeId', async (req, res) => {
  try {
    const storeId = req.params.storeId;

    const reviewsResult = await pool.query(`
      SELECT * FROM reviews 
      WHERE store_id = $1 
      ORDER BY created_at DESC
    `, [storeId]);

    res.json({
      success: true,
      reviews: reviewsResult.rows
    });

  } catch (error) {
    console.error('전체 리뷰 조회 실패:', error);
    res.status(500).json({ success: false, error: '전체 리뷰 조회에 실패했습니다.' });
  }
});

// 서버 실행
app.listen(PORT, () => {
  console.log(`🚀 TableLink 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`📱 http://localhost:${PORT} 에서 접속 가능합니다.`);

  // 서버 시작 시 만료된 테이블들 해제
  checkAndReleaseExpiredTables();
});