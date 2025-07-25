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

// stores API 엔드포인트
app.get('/api/stores', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM stores ORDER BY id');
    const stores = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      category: row.category,
      distance: row.distance || '정보없음',
      menu: row.menu || [],
      coord: row.coord || { lat: 37.5665, lng: 126.9780 }, // 기본 좌표 (서울시청)
      reviews: row.reviews || [],
      reviewCount: row.review_count || 0,
      isOpen: row.is_open !== false
    }));

    res.json({
      message: 'TableLink API 서버가 정상 작동 중입니다.',
      stores: stores
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

    if (user && user.pw === pw) {
      console.log('로그인 성공:', user.id);
      res.json({
        success: true,
        message: '로그인 성공',
        user: {
          id: user.id,
          name: user.name || '',
          phone: user.phone || '',
          email: user.email || '',
          address: user.address || '',
          birth: user.birth || '',
          gender: user.gender || '',
          point: user.point || 0,
          orderList: user.order_list || [],
          totalCost: user.total_cost || 0,
          realCost: user.real_cost || 0,
          reservationList: user.reservation_list || [],
          coupons: user.coupons || { unused: [], used: [] },
          favoriteStores: user.favorite_stores || []
        }
      });
    }
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

// 서버 실행
app.listen(PORT, () => {
  console.log(`🚀 TableLink 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`📱 http://localhost:${PORT} 에서 접속 가능합니다.`);
});