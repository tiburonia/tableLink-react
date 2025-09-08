const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// 아이디 중복 체크 API
router.post('/users/check-id', async (req, res) => {
  const { id } = req.body;

  console.log(`🔍 아이디 중복 확인 요청: ${id}`);

  if (!id) {
    return res.status(400).json({ success: false, error: '아이디를 입력해주세요' });
  }

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

    if (!id || !pw) {
      return res.status(400).json({ error: '아이디와 비밀번호는 필수입니다' });
    }

    if (!/^[a-zA-Z0-9]{3,20}$/.test(id)) {
      return res.status(400).json({ error: '아이디는 3-20자의 영문과 숫자만 사용 가능합니다' });
    }

    if (pw.length < 4) {
      return res.status(400).json({ error: '비밀번호는 최소 4자 이상이어야 합니다' });
    }

    if (phone && !/^010-\d{4}-\d{4}$/.test(phone)) {
      return res.status(400).json({ error: '전화번호 형식이 올바르지 않습니다' });
    }

    await client.query('BEGIN');

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
      true, true, false
    ]);

    console.log(`✅ 새 사용자 가입: ${cleanedData.id} (${cleanedData.name || '익명'})`);

    // 🔄 전화번호가 있는 경우 기존 게스트 주문 자동 연결
    let transferredChecks = 0;

    if (cleanedData.phone) {
      console.log(`🔍 전화번호 ${cleanedData.phone}로 기존 게스트 주문 확인 중...`);

      // 게스트 체크들을 회원으로 이전
      const transferResult = await client.query(`
        UPDATE checks 
        SET user_id = $1, guest_phone = NULL
        WHERE guest_phone = $2 AND status = 'closed'
        RETURNING id, store_id, final_amount
      `, [cleanedData.id, cleanedData.phone]);

      transferredChecks = transferResult.rows.length;

      // 매장별 통계 정보 생성
      if (transferResult.rows.length > 0) {
        const statsData = {};
        for (const check of transferResult.rows) {
          const storeId = check.store_id;
          if (!statsData[storeId]) {
            statsData[storeId] = { totalSpent: 0, visitCount: 0, points: 0 };
          }
          statsData[storeId].totalSpent += check.final_amount;
          statsData[storeId].visitCount += 1;
          statsData[storeId].points += Math.floor(check.final_amount * 0.01);
        }

        for (const [storeId, stats] of Object.entries(statsData)) {
          await client.query(`
            INSERT INTO user_store_stats (user_id, store_id, points, total_spent, visit_count)
            VALUES ($1, $2, $3, $4, $5)
          `, [cleanedData.id, parseInt(storeId), stats.points, stats.totalSpent, stats.visitCount]);
        }

        console.log(`✅ ${Object.keys(statsData).length}개 매장 통계 정보 생성 완료`);
      }

      // 게스트 데이터 삭제
      if (transferredChecks > 0) {
        await client.query('DELETE FROM guests WHERE phone = $1', [cleanedData.phone]);
        console.log(`🗑️ 게스트 데이터 정리 완료: ${cleanedData.phone}`);
      }

      console.log(`🔄 게스트 주문 자동 연결 완료 - 체크: ${transferredChecks}개`);
    }

    await client.query('COMMIT');

    res.json({ 
      success: true, 
      message: '회원가입 성공',
      transferredData: cleanedData.phone ? {
        transferredChecks,
        phone: cleanedData.phone
      } : null
    });

  } catch (error) {
    await client.query('ROLLBACK');

    if (error.code === '23505') {
      res.status(409).json({ error: '이미 존재하는 아이디 또는 전화번호입니다' });
    } else {
      console.error('회원가입 실패:', error);
      res.status(500).json({ error: '회원가입 처리 중 오류가 발생했습니다' });
    }
  } finally {
    client.release();
  }
});

// 통합 로그인 함수
async function handleLogin(req, res) {
  const { id, pw } = req.body;

  console.log('🔍 로그인 요청:', { id });

  if (!id || !pw) {
    return res.status(400).json({ 
      success: false, 
      error: '아이디와 비밀번호를 입력해주세요' 
    });
  }

  try {
    // users 테이블에서 사용자 조회 (실제 스키마에 맞춤)
    const result = await pool.query('SELECT * FROM users WHERE user_id = $1', [id]);

    if (result.rows.length === 0) {
      console.log(`❌ 사용자를 찾을 수 없음: ${id}`);
      return res.status(401).json({ 
        success: false, 
        error: '아이디 또는 비밀번호가 일치하지 않습니다' 
      });
    }

    const user = result.rows[0];
    if (user.user_pw !== pw) {
      console.log(`❌ 비밀번호 불일치: ${id}`);
      return res.status(401).json({ 
        success: false, 
        error: '아이디 또는 비밀번호가 일치하지 않습니다' 
      });
    }

    console.log(`✅ 로그인 성공: ${user.name} (${user.user_id})`);

    res.json({
      success: true,
      message: '로그인 성공',
      user: {
        id: user.user_id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        address: user.address,
        birth: user.birth,
        gender: user.gender
      }
    });
  } catch (error) {
    console.error('❌ 로그인 실패:', error);
    res.status(500).json({ 
      success: false, 
      error: '로그인 처리 중 오류가 발생했습니다' 
    });
  }
}

// 레거시 경로 호환성: /users/login
router.post('/users/login', handleLogin);

// 새 시스템 경로: /login
router.post('/login', handleLogin);

// 사용자 정보 조회 API
router.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;

  console.log(`🔍 사용자 정보 조회 요청: ${userId}`);

  try {
    // 사용자 기본 정보 조회
    const userResult = await pool.query('SELECT * FROM users WHERE user_id = $1', [userId]);

    if (userResult.rows.length === 0) {
      console.log(`❌ 사용자를 찾을 수 없음: ${userId}`);
      return res.status(404).json({ 
        success: false, 
        error: '사용자를 찾을 수 없습니다' 
      });
    }

    const user = userResult.rows[0];

    // 사용자 쿠폰 정보 조회 (JOIN)
    const couponsResult = await pool.query(`
      SELECT 
        c.id as coupon_id,
        c.name as coupon_name,
        c.description,
        c.discount_type,
        c.discount_value,
        c.min_order_amount,
        c.max_discount,
        c.starts_at,
        c.ends_at,
        uc.used_at,
        uc.order_id,
        s.name as store_name
      FROM user_coupons uc
      JOIN coupons c ON uc.coupon_id = c.id
      LEFT JOIN stores s ON c.store_id = s.id
      WHERE uc.user_id = $1
      ORDER BY 
        CASE WHEN uc.used_at IS NULL THEN 0 ELSE 1 END,
        c.ends_at ASC
    `, [userId]);

    // 쿠폰을 사용가능/사용완료로 분류
    const coupons = {
      unused: [],
      used: []
    };

    couponsResult.rows.forEach(coupon => {
      const couponData = {
        id: coupon.coupon_id,
        name: coupon.coupon_name,
        description: coupon.description,
        discountType: coupon.discount_type,
        discountValue: coupon.discount_value,
        minOrderAmount: coupon.min_order_amount,
        maxDiscount: coupon.max_discount,
        startsAt: coupon.starts_at,
        endsAt: coupon.ends_at,
        storeName: coupon.store_name,
        validUntil: coupon.ends_at ? new Date(coupon.ends_at).toLocaleDateString() : null
      };

      if (coupon.used_at) {
        coupons.used.push({
          ...couponData,
          usedAt: coupon.used_at,
          orderId: coupon.order_id
        });
      } else {
        // 만료되지 않은 쿠폰만 사용가능 목록에 추가
        const now = new Date();
        const endDate = coupon.ends_at ? new Date(coupon.ends_at) : null;
        
        if (!endDate || endDate > now) {
          coupons.unused.push(couponData);
        } else {
          // 만료된 쿠폰은 사용완료로 처리
          coupons.used.push({
            ...couponData,
            usedAt: null,
            orderId: null,
            expired: true
          });
        }
      }
    });

    console.log(`✅ 사용자 정보 조회 성공: ${user.name} (${user.user_id}), 쿠폰 ${couponsResult.rows.length}개`);

    res.json({
      success: true,
      user: {
        id: user.user_id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        address: user.address,
        birth: user.birth,
        gender: user.gender,
        coupons: coupons,
        couponStats: {
          total: couponsResult.rows.length,
          unused: coupons.unused.length,
          used: coupons.used.length
        }
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
  try {
    const { userId } = req.params;

    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

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

// 즐겨찾기 토글 API
router.post('/users/favorite/toggle', async (req, res) => {
  const { userId, storeId, action } = req.body;

  console.log(`🔄 즐겨찾기 토글 요청: userId=${userId}, storeId=${storeId}, action=${action}`);

  try {
    if (!userId || !storeId) {
      return res.status(400).json({ 
        success: false,
        error: 'userId와 storeId가 필요합니다' 
      });
    }

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

    const currentFavorite = await pool.query(
      'SELECT id FROM favorites WHERE user_id = $1 AND store_id = $2',
      [userId, parseInt(storeId)]
    );

    const isFavorited = currentFavorite.rows.length > 0;
    let finalAction = action || (isFavorited ? 'remove' : 'add');

    if (finalAction === 'add') {
      if (isFavorited) {
        return res.json({
          success: true,
          message: '이미 즐겨찾기에 등록된 매장입니다',
          storeName: storeName,
          action: 'already_added'
        });
      }

      await pool.query(`
        INSERT INTO favorites (user_id, store_id)
        VALUES ($1, $2)
      `, [userId, parseInt(storeId)]);

      // 매장 즐겨찾기 수 증가
      await pool.query(`
        UPDATE stores SET favorite_count = favorite_count + 1 WHERE id = $1
      `, [parseInt(storeId)]);

      console.log(`✅ 사용자 ${userId}가 매장 ${storeName} 즐겨찾기 추가`);

      res.json({
        success: true,
        message: '즐겨찾기에 추가되었습니다',
        storeName: storeName,
        action: 'added'
      });

    } else if (finalAction === 'remove') {
      if (!isFavorited) {
        return res.json({
          success: true,
          message: '즐겨찾기에 없는 매장입니다',
          storeName: storeName,
          action: 'not_found'
        });
      }

      await pool.query(
        'DELETE FROM favorites WHERE user_id = $1 AND store_id = $2',
        [userId, parseInt(storeId)]
      );

      // 매장 즐겨찾기 수 감소
      await pool.query(`
        UPDATE stores SET favorite_count = GREATEST(favorite_count - 1, 0) WHERE id = $1
      `, [parseInt(storeId)]);

      console.log(`✅ 사용자 ${userId}가 매장 ${storeName} 즐겨찾기 제거`);

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

// 사용자 정보 조회 API (POST 방식 - 호환성)
router.post('/users/info', async (req, res) => {
  const { userId } = req.body;

  console.log(`🔍 사용자 정보 조회 요청 (POST): ${userId}`);

  try {
    // 사용자 기본 정보 조회
    const userResult = await pool.query('SELECT * FROM users WHERE user_id = $1', [userId]);

    if (userResult.rows.length === 0) {
      console.log(`❌ 사용자를 찾을 수 없음: ${userId}`);
      return res.status(404).json({ 
        success: false, 
        error: '사용자를 찾을 수 없습니다' 
      });
    }

    const user = userResult.rows[0];

    // 사용자 쿠폰 정보 조회 (JOIN)
    const couponsResult = await pool.query(`
      SELECT 
        c.id as coupon_id,
        c.name as coupon_name,
        c.description,
        c.discount_type,
        c.discount_value,
        c.min_order_amount,
        c.max_discount,
        c.starts_at,
        c.ends_at,
        uc.used_at,
        uc.order_id,
        s.name as store_name
      FROM user_coupons uc
      JOIN coupons c ON uc.coupon_id = c.id
      LEFT JOIN stores s ON c.store_id = s.id
      WHERE uc.user_id = $1
      ORDER BY 
        CASE WHEN uc.used_at IS NULL THEN 0 ELSE 1 END,
        c.ends_at ASC
    `, [userId]);

    // 쿠폰을 사용가능/사용완료로 분류
    const coupons = {
      unused: [],
      used: []
    };

    couponsResult.rows.forEach(coupon => {
      const couponData = {
        id: coupon.coupon_id,
        name: coupon.coupon_name,
        description: coupon.description,
        discountType: coupon.discount_type,
        discountValue: coupon.discount_value,
        minOrderAmount: coupon.min_order_amount,
        maxDiscount: coupon.max_discount,
        startsAt: coupon.starts_at,
        endsAt: coupon.ends_at,
        storeName: coupon.store_name,
        validUntil: coupon.ends_at ? new Date(coupon.ends_at).toLocaleDateString() : null
      };

      if (coupon.used_at) {
        coupons.used.push({
          ...couponData,
          usedAt: coupon.used_at,
          orderId: coupon.order_id
        });
      } else {
        // 만료되지 않은 쿠폰만 사용가능 목록에 추가
        const now = new Date();
        const endDate = coupon.ends_at ? new Date(coupon.ends_at) : null;
        
        if (!endDate || endDate > now) {
          coupons.unused.push(couponData);
        } else {
          // 만료된 쿠폰은 사용완료로 처리
          coupons.used.push({
            ...couponData,
            usedAt: null,
            orderId: null,
            expired: true
          });
        }
      }
    });

    console.log(`✅ 사용자 정보 조회 성공: ${user.name} (${user.user_id}), 쿠폰 ${couponsResult.rows.length}개`);

    res.json({
      success: true,
      user: {
        id: user.user_id,
        name: user.name,
        phone: user.phone,
        email: user.email || '',
        address: user.address || '',
        birth: user.birth || '',
        gender: user.gender || '',
        point: 0, // 포인트는 별도 테이블에서 관리
        coupons: coupons,
        couponStats: {
          total: couponsResult.rows.length,
          unused: coupons.unused.length,
          used: coupons.used.length
        }
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
    const phoneCheck = await client.query(`
      SELECT id FROM users 
      WHERE phone = $1 AND id != $2
    `, [phone, userId]);

    if (phoneCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: '이미 사용 중인 전화번호입니다.'
      });
    }

    const updateResult = await client.query(`
      UPDATE users 
      SET 
        name = $1,
        phone = $2,
        email = $3,
        birth = $4,
        gender = $5,
        address = $6,
        detail_address = $7,
        email_notifications = $8,
        sms_notifications = $9,
        push_notifications = $10,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $11 
      RETURNING *
    `, [
      name?.trim() || null,
      phone?.trim() || null,
      email?.trim() || null,
      birth || null,
      gender || null,
      address?.trim() || null,
      detailAddress?.trim() || null,
      notifications?.email === true,
      notifications?.sms === true,
      notifications?.push === true,
      userId
    ]);

    if (updateResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      });
    }

    console.log('✅ 사용자 정보 업데이트 완료:', userId);

    res.json({
      success: true,
      message: '사용자 정보가 성공적으로 업데이트되었습니다.',
      user: updateResult.rows[0]
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