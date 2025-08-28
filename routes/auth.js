const express = require('express');
const router = express.Router();
const pool = require('../shared/config/database');

// 아이디 중복 체크 API
router.post('/users/check-id', async (req, res) => {
  const { id } = req.body;

  console.log(`🔍 아이디 중복 확인 요청: ${id}`);

  if (!id) {
    return res.status(400).json({ success: false, error: '아이디를 입력해주세요' });
  }

  // 아이디 형식 검증
  if (!/^[a-zA-Z0-9]{3,20}$/.test(id)) {
    return res.status(400).json({ success: false, error: '아이디는 3-20자의 영문과 숫자만 사용 가능합니다' });
  }

  try {
    const result = await pool.query('SELECT id FROM users WHERE id = $1', [id.trim()]);

    if (result.rows.length > 0) {
      console.log(`❌ 아이디 중복: ${id}`);
      res.json({ success: true, available: false, message: '이미 사용 중인 아이디입니다' });
    } else {
      console.log(`✅ 아이디 사용 가능: ${id}`);
      res.json({ success: true, available: true, message: '사용 가능한 아이디입니다' });
    }
  } catch (error) {
    console.error('❌ 아이디 중복 체크 실패:', error);
    res.status(500).json({ success: false, error: '아이디 중복 체크 중 오류가 발생했습니다' });
  }
});

// 전화번호 중복 체크 API
router.post('/users/check-phone', async (req, res) => {
  const { phone } = req.body;

  console.log(`📞 전화번호 중복 확인 요청: ${phone}`);

  if (!phone) {
    return res.status(400).json({ success: false, error: '전화번호를 입력해주세요' });
  }

  // 전화번호 형식 검증
  if (!/^010-\d{4}-\d{4}$/.test(phone)) {
    return res.status(400).json({ success: false, error: '올바른 전화번호 형식이 아닙니다' });
  }

  try {
    const result = await pool.query('SELECT id FROM users WHERE phone = $1', [phone.trim()]);

    if (result.rows.length > 0) {
      console.log(`❌ 전화번호 중복: ${phone}`);
      res.json({ success: true, available: false, message: '이미 등록된 전화번호입니다' });
    } else {
      console.log(`✅ 전화번호 사용 가능: ${phone}`);
      res.json({ success: true, available: true, message: '사용 가능한 전화번호입니다' });
    }
  } catch (error) {
    console.error('❌ 전화번호 중복 체크 실패:', error);
    res.status(500).json({ success: false, error: '전화번호 중복 체크 중 오류가 발생했습니다' });
  }
});

// 사용자 회원가입 API
router.post('/users/signup', async (req, res) => {
  const client = await pool.connect();

  try {
    const { id, pw, name, phone } = req.body;

    // 서버 측 유효성 검증
    if (!id || !pw) {
      return res.status(400).json({ error: '아이디와 비밀번호는 필수입니다' });
    }

    // 아이디 형식 검증
    if (!/^[a-zA-Z0-9]{3,20}$/.test(id)) {
      return res.status(400).json({ error: '아이디는 3-20자의 영문과 숫자만 사용 가능합니다' });
    }

    // 비밀번호 길이 검증
    if (pw.length < 4) {
      return res.status(400).json({ error: '비밀번호는 최소 4자 이상이어야 합니다' });
    }

    // 전화번호 형식 검증 (입력된 경우에만)
    if (phone && !/^010-\d{4}-\d{4}$/.test(phone)) {
      return res.status(400).json({ error: '전화번호 형식이 올바르지 않습니다' });
    }

    await client.query('BEGIN');

    // 데이터 정제
    const cleanedData = {
      id: id.trim(),
      pw: pw.trim(),
      name: name ? name.trim() : null,
      phone: phone ? phone.trim() : null
    };

    // 회원 생성
    await client.query(`
      INSERT INTO users (
        id, pw, name, phone, 
        email_notifications, sms_notifications, push_notifications
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      cleanedData.id, 
      cleanedData.pw, 
      cleanedData.name, 
      cleanedData.phone,
      true,  // email_notifications 기본값
      true,  // sms_notifications 기본값
      false  // push_notifications 기본값
    ]);

    console.log(`✅ 새 사용자 가입: ${cleanedData.id} (${cleanedData.name || '익명'})`);

    // 🔄 전화번호가 있는 경우 기존 게스트 주문 자동 연결
    let transferredOrders = 0;
    let transferredPayments = 0;

    if (cleanedData.phone) {
      console.log(`🔍 전화번호 ${cleanedData.phone}로 기존 게스트 주문 확인 중...`);

      // 1. orders 테이블의 게스트 주문을 회원으로 이전
      const orderTransferResult = await client.query(`
        UPDATE orders 
        SET user_id = $1, guest_phone = NULL
        WHERE guest_phone = $2
        RETURNING id
      `, [cleanedData.id, cleanedData.phone]);

      transferredOrders = orderTransferResult.rows.length;

      // 2. paid_orders 테이블의 게스트 주문을 회원으로 이전
      const paidOrderTransferResult = await client.query(`
        UPDATE paid_orders 
        SET user_id = $1, guest_phone = NULL
        WHERE guest_phone = $2
        RETURNING id, store_id, final_amount
      `, [cleanedData.id, cleanedData.phone]);

      transferredPayments = paidOrderTransferResult.rows.length;

      // 3. user_store_stats 테이블에 매장별 통계 정보 생성/업데이트
      if (paidOrderTransferResult.rows.length > 0) {
        try {
          console.log(`📊 매장별 통계 정보 생성 중...`);

          const statsData = {};
          for (const order of paidOrderTransferResult.rows) {
            const storeId = order.store_id;
            if (!statsData[storeId]) {
              statsData[storeId] = {
                totalSpent: 0,
                visitCount: 0,
                points: 0
              };
            }
            statsData[storeId].totalSpent += order.final_amount;
            statsData[storeId].visitCount += 1;
            statsData[storeId].points += Math.floor(order.final_amount * 0.1);
          }

          // 각 매장별 통계 정보 삽입
          for (const [storeId, stats] of Object.entries(statsData)) {
            await client.query(`
              INSERT INTO user_store_stats (user_id, store_id, points, total_spent, visit_count, updated_at)
              VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
              ON CONFLICT (user_id, store_id) 
              DO UPDATE SET 
                points = user_store_stats.points + $3,
                total_spent = user_store_stats.total_spent + $4,
                visit_count = user_store_stats.visit_count + $5,
                updated_at = CURRENT_TIMESTAMP
            `, [cleanedData.id, parseInt(storeId), stats.points, stats.totalSpent, stats.visitCount]);
          }

          console.log(`✅ ${Object.keys(statsData).length}개 매장 통계 정보 생성 완료`);
        } catch (statsError) {
          console.warn('⚠️ 매장별 통계 생성 실패:', statsError);
        }
      }

      // 4. guests 테이블에서 해당 전화번호 삭제
      if (transferredOrders > 0 || transferredPayments > 0) {
        await client.query('DELETE FROM guests WHERE phone = $1', [cleanedData.phone]);
        console.log(`🗑️ 게스트 데이터 정리 완료: ${cleanedData.phone}`);
      }

      console.log(`🔄 게스트 주문 자동 연결 완료 - 주문: ${transferredOrders}개, 결제내역: ${transferredPayments}개`);
    }

    await client.query('COMMIT');

    res.json({ 
      success: true, 
      message: '회원가입 성공',
      transferredData: cleanedData.phone ? {
        transferredOrders,
        transferredPayments,
        phone: cleanedData.phone
      } : null
    });

  } catch (error) {
    await client.query('ROLLBACK');

    if (error.code === '23505') {
      res.status(409).json({ error: '이미 존재하는 아이디입니다' });
    } else {
      console.error('회원가입 실패:', error);
      res.status(500).json({ error: '회원가입 처리 중 오류가 발생했습니다' });
    }
  } finally {
    client.release();
  }
});

// 사용자 로그인 API
router.post('/users/login', async (req, res) => {
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

// 로그아웃 API
router.post('/logout', (req, res) => {
  console.log('🔓 로그아웃 요청');
  res.json({ success: true, message: '로그아웃 완료' });
});

// 사용자 정보 조회 API (POST 방식)
router.post('/users/info', async (req, res) => {
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

// 사용자 정보 조회 API (GET 방식)
router.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;

  console.log(`🔍 사용자 정보 조회 요청: ${userId}`);

  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);

    if (result.rows.length === 0) {
      console.log(`❌ 사용자를 찾을 수 없음: ${userId}`);
      return res.status(404).json({ 
        success: false, 
        error: '사용자를 찾을 수 없습니다' 
      });
    }

    const user = result.rows[0];
    
    console.log(`✅ 사용자 정보 조회 성공: ${user.name} (${user.id})`);

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
    console.error('❌ 사용자 정보 조회 실패:', error);
    res.status(500).json({ 
      success: false, 
      error: '사용자 정보 조회 실패' 
    });
  }
});

// 즐겨찾기 조회 API
router.get('/users/favorites/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    // 사용자 존재 확인
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    // favorites 테이블에서 즐겨찾기 매장 조회
    const favoritesResult = await pool.query(`
      SELECT 
        f.id as favorite_id,
        f.created_at,
        s.id, s.name, s.category, s.rating_average, s.review_count, s.is_open,
        sa.address_full as address, sa.latitude, sa.longitude
      FROM favorites f
      JOIN stores s ON f.store_id = s.id
      LEFT JOIN store_address sa ON s.id = sa.store_id
      WHERE f.user_id = $1
      ORDER BY f.created_at DESC
    `, [userId]);

    const favoriteStores = favoritesResult.rows.map(store => ({
      id: store.id,
      favoriteId: store.favorite_id,
      name: store.name,
      category: store.category,
      address: store.address || '주소 정보 없음',
      ratingAverage: store.rating_average ? parseFloat(store.rating_average) : 0.0,
      reviewCount: store.review_count || 0,
      isOpen: store.is_open !== false,
      favoriteDate: store.created_at,
      coord: store.latitude && store.longitude 
        ? { lat: parseFloat(store.latitude), lng: parseFloat(store.longitude) }
        : null
    }));

    console.log(`✅ 사용자 ${userId} 즐겨찾기 조회: ${favoriteStores.length}개 매장`);

    res.json({
      success: true,
      stores: favoriteStores
    });

  } catch (error) {
    console.error('즐겨찾기 조회 실패:', error);
    res.status(500).json({ error: '즐겨찾기 조회 실패' });
  }
});

// 즐겨찾기 토글 API (store_id 기반)
router.post('/users/favorite/toggle', async (req, res) => {
  const { userId, storeId, action } = req.body;

  console.log(`🔄 즐겨찾기 토글 요청: userId=${userId}, storeId=${storeId}, action=${action}`);

  try {
    // 입력 검증
    if (!userId || !storeId) {
      return res.status(400).json({ 
        success: false,
        error: 'userId와 storeId가 필요합니다' 
      });
    }

    // 사용자 및 매장 존재 확인
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: '사용자를 찾을 수 없습니다' 
      });
    }

    const storeCheck = await pool.query('SELECT id, name FROM stores WHERE id = $1', [parseInt(storeId)]);
    if (storeCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: '매장을 찾을 수 없습니다' 
      });
    }

    const storeName = storeCheck.rows[0].name;

    // 현재 즐겨찾기 상태 확인
    const currentFavorite = await pool.query(
      'SELECT id FROM favorites WHERE user_id = $1 AND store_id = $2',
      [userId, parseInt(storeId)]
    );

    const isFavorited = currentFavorite.rows.length > 0;
    console.log(`📋 현재 즐겨찾기 상태: ${isFavorited ? '등록됨' : '등록안됨'}`);

    // action이 없으면 현재 상태를 토글
    let finalAction = action;
    if (!action) {
      finalAction = isFavorited ? 'remove' : 'add';
    }

    if (finalAction === 'add') {
      if (isFavorited) {
        console.log(`ℹ️ 이미 즐겨찾기 등록된 매장: ${storeName}`);
        return res.json({
          success: true,
          message: '이미 즐겨찾기에 등록된 매장입니다',
          storeName: storeName,
          action: 'already_added'
        });
      }

      // 즐겨찾기 추가 (트리거가 favorite_count 자동 업데이트)
      await pool.query(`
        INSERT INTO favorites (user_id, store_id)
        VALUES ($1, $2)
      `, [userId, parseInt(storeId)]);

      console.log(`✅ 사용자 ${userId}가 매장 ${storeName} 즐겨찾기 추가`);

      res.json({
        success: true,
        message: '즐겨찾기에 추가되었습니다',
        storeName: storeName,
        action: 'added'
      });

    } else if (finalAction === 'remove') {
      if (!isFavorited) {
        console.log(`ℹ️ 즐겨찾기에 없는 매장: ${storeName}`);
        return res.json({
          success: true,
          message: '즐겨찾기에 없는 매장입니다',
          storeName: storeName,
          action: 'not_found'
        });
      }

      // 즐겨찾기 제거 (트리거가 favorite_count 자동 업데이트)
      const deleteResult = await pool.query(
        'DELETE FROM favorites WHERE user_id = $1 AND store_id = $2',
        [userId, parseInt(storeId)]
      );

      console.log(`✅ 사용자 ${userId}가 매장 ${storeName} 즐겨찾기 제거 (삭제된 행: ${deleteResult.rowCount})`);

      res.json({
        success: true,
        message: '즐겨찾기에서 제거되었습니다',
        storeName: storeName,
        action: 'removed'
      });

    } else {
      res.status(400).json({ 
        success: false,
        error: '잘못된 액션입니다. add 또는 remove만 허용됩니다.' 
      });
    }

  } catch (error) {
    console.error('❌ 즐겨찾기 토글 실패:', error);
    res.status(500).json({ 
      success: false,
      error: '즐겨찾기 설정 실패: ' + error.message 
    });
  }
});

// 즐겨찾기 상태 확인 API
router.get('/users/favorite/status/:userId/:storeId', async (req, res) => {
  try {
    const { userId, storeId } = req.params;

    console.log(`🔍 즐겨찾기 상태 확인: userId=${userId}, storeId=${storeId}`);

    if (!userId || !storeId) {
      return res.status(400).json({ 
        success: false,
        error: 'userId와 storeId가 필요합니다' 
      });
    }

    const result = await pool.query(
      'SELECT id FROM favorites WHERE user_id = $1 AND store_id = $2',
      [userId, parseInt(storeId)]
    );

    const isFavorited = result.rows.length > 0;

    console.log(`✅ 즐겨찾기 상태 확인 완료: ${isFavorited ? '등록됨' : '등록안됨'}`);

    res.json({
      success: true,
      userId: userId,
      storeId: parseInt(storeId),
      isFavorited: isFavorited
    });

  } catch (error) {
    console.error('❌ 즐겨찾기 상태 확인 실패:', error);
    res.status(500).json({ 
      success: false,
      error: '즐겨찾기 상태 확인 실패: ' + error.message 
    });
  }
});

// 예약 추가 API
router.post('/reservations/add', async (req, res) => {
  const { userId, reservationData } = req.body;

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    const user = userResult.rows[0];
    const currentReservations = user.reservation_list || [];
    const newReservations = [...currentReservations, reservationData];

    await pool.query(
      'UPDATE users SET reservation_list = $1 WHERE id = $2',
      [JSON.stringify(newReservations), userId]
    );

    res.json({
      success: true,
      message: '예약이 추가되었습니다',
      reservations: newReservations
    });

  } catch (error) {
    console.error('예약 추가 실패:', error);
    res.status(500).json({ error: '예약 추가 실패' });
  }
});

// 쿠폰 발급 API
router.post('/coupons/issue', async (req, res) => {
  const { userId, couponData } = req.body;

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    const user = userResult.rows[0];
    const currentCoupons = user.coupons || { unused: [], used: [] };
    currentCoupons.unused.push(couponData);

    await pool.query(
      'UPDATE users SET coupons = $1 WHERE id = $2',
      [JSON.stringify(currentCoupons), userId]
    );

    res.json({
      success: true,
      message: '쿠폰이 발급되었습니다',
      coupon: couponData
    });

  } catch (error) {
    console.error('쿠폰 발급 실패:', error);
    res.status(500).json({ error: '쿠폰 발급 실패' });
  }
});

// 사용자 정보 업데이트 API
router.put('/users/update', async (req, res) => {
  const client = await pool.connect();

  try {
    console.log('📝 사용자 정보 업데이트 요청:', req.body);

    const { 
      userId, 
      name, 
      phone, 
      email, 
      birth, 
      gender, 
      address, 
      detailAddress, 
      notifications 
    } = req.body;

    if (!userId || !name || !phone) {
      return res.status(400).json({
        success: false,
        message: '필수 필드가 누락되었습니다.'
      });
    }

    // 전화번호 중복 검사 (자신 제외)
    const phoneCheckQuery = `
      SELECT id FROM users 
      WHERE phone = $1 AND id != $2
    `;

    const phoneCheck = await client.query(phoneCheckQuery, [phone, userId]);

    if (phoneCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: '이미 사용 중인 전화번호입니다.'
      });
    }

    // 먼저 테이블 컬럼 확인
    const columnsResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);

    const existingColumns = columnsResult.rows.map(row => row.column_name);

    // 기본 필드만 업데이트 (필수 컬럼들)
    let updateQuery = `
      UPDATE users 
      SET 
        name = $1,
        phone = $2,
        updated_at = CURRENT_TIMESTAMP
    `;

    let updateValues = [
      name?.trim() || null,
      phone?.trim() || null
    ];

    let paramIndex = 3;

    // 선택적 컬럼들 추가
    if (existingColumns.includes('email')) {
      updateQuery += `, email = $${paramIndex}`;
      updateValues.push(email?.trim() || null);
      paramIndex++;
    }

    if (existingColumns.includes('birth')) {
      updateQuery += `, birth = $${paramIndex}`;
      updateValues.push(birth || null);
      paramIndex++;
    }

    if (existingColumns.includes('gender')) {
      updateQuery += `, gender = $${paramIndex}`;
      updateValues.push(gender || null);
      paramIndex++;
    }

    if (existingColumns.includes('address')) {
      updateQuery += `, address = $${paramIndex}`;
      updateValues.push(address?.trim() || null);
      paramIndex++;
    }

    if (existingColumns.includes('detail_address')) {
      updateQuery += `, detail_address = $${paramIndex}`;
      updateValues.push(detailAddress?.trim() || null);
      paramIndex++;
    }

    if (existingColumns.includes('email_notifications')) {
      updateQuery += `, email_notifications = $${paramIndex}`;
      updateValues.push(notifications?.email === true);
      paramIndex++;
    }

    if (existingColumns.includes('sms_notifications')) {
      updateQuery += `, sms_notifications = $${paramIndex}`;
      updateValues.push(notifications?.sms === true);
      paramIndex++;
    }

    if (existingColumns.includes('push_notifications')) {
      updateQuery += `, push_notifications = $${paramIndex}`;
      updateValues.push(notifications?.push === true);
      paramIndex++;
    }

    updateQuery += ` WHERE id = $${paramIndex} RETURNING *`;
    updateValues.push(userId);

    const result = await client.query(updateQuery, updateValues);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      });
    }

    console.log('✅ 사용자 정보 업데이트 완료:', userId);

    res.json({
      success: true,
      message: '사용자 정보가 성공적으로 업데이트되었습니다.',
      user: result.rows[0]
    });

  } catch (error) {
    console.error('❌ 사용자 정보 업데이트 실패:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  } finally {
    client.release();
  }
});

module.exports = router;