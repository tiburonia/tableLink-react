
const express = require('express');
const router = express.Router();
const pool = require('../shared/config/database');

// 사용자 회원가입 API
router.post('/users/signup', async (req, res) => {
  const { id, pw, name, phone } = req.body;

  try {
    await pool.query(
      'INSERT INTO users (id, pw, name, phone) VALUES ($1, $2, $3, $4)',
      [id, pw, name, phone]
    );
    res.json({ success: true, message: '회원가입 성공' });
  } catch (error) {
    if (error.code === '23505') {
      res.status(409).json({ error: '이미 존재하는 아이디입니다' });
    } else {
      console.error('회원가입 실패:', error);
      res.status(500).json({ error: '회원가입 실패' });
    }
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

// 사용자 정보 조회 API
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

// 즐겨찾기 토글 API
router.post('/users/favorite/toggle', async (req, res) => {
  const { userId, storeName, action } = req.body;

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    const user = userResult.rows[0];
    let favoriteStores = user.favorite_stores || [];

    if (action === 'add') {
      if (!favoriteStores.includes(storeName)) {
        favoriteStores.push(storeName);
      }
    } else if (action === 'remove') {
      favoriteStores = favoriteStores.filter(store => store !== storeName);
    }

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

module.exports = router;
