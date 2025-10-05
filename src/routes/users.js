
const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const userController = require('../controllers/userController');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// ========== 레이어드 아키텍처 라우트 ==========

// 사용자 정보 조회 (마이페이지용)
router.post('/info', userController.getUserInfo.bind(userController));

// ========== 레거시 라우트 (Pool 직접 사용) ==========

// 사용자 즐겨찾기 상태 조회
router.get('/favorite/status/:userId/:storeId', async (req, res) => {
  try {
    const { userId, storeId } = req.params;

    const result = await pool.query(`
      SELECT id FROM favorites
      WHERE user_id = $1 AND store_id = $2
    `, [userId, storeId]);

    res.json({
      success: true,
      isFavorite: result.rows.length > 0
    });

  } catch (error) {
    console.error('❌ 즐겨찾기 상태 조회 실패:', error);
    res.json({
      success: true,
      isFavorite: false
    });
  }
});

// 즐겨찾기 토글
router.post('/favorite/toggle', async (req, res) => {
  try {
    const { userId, storeId } = req.body;

    // 기존 즐겨찾기 확인
    const existingResult = await pool.query(`
      SELECT id FROM favorites
      WHERE user_id = $1 AND store_id = $2
    `, [userId, storeId]);

    if (existingResult.rows.length > 0) {
      // 즐겨찾기 제거
      await pool.query(`
        DELETE FROM favorites
        WHERE user_id = $1 AND store_id = $2
      `, [userId, storeId]);

      res.json({
        success: true,
        isFavorite: false,
        message: '즐겨찾기에서 제거되었습니다'
      });
    } else {
      // 즐겨찾기 추가
      await pool.query(`
        INSERT INTO favorites (user_id, store_id)
        VALUES ($1, $2)
      `, [userId, storeId]);

      res.json({
        success: true,
        isFavorite: true,
        message: '즐겨찾기에 추가되었습니다'
      });
    }

  } catch (error) {
    console.error('❌ 즐겨찾기 토글 실패:', error);
    res.status(500).json({
      success: false,
      error: '즐겨찾기 처리 실패'
    });
  }
});

// 전화번호로 회원 조회
router.get('/search-by-phone', async (req, res) => {
  try {
    const { phone } = req.query;

    console.log(`🔍 전화번호로 회원 조회: ${phone}`);

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: '전화번호가 필요합니다'
      });
    }

    // 전화번호에서 하이픈 제거 (DB에는 하이픈 없이 저장됨)
    const cleanPhone = phone.replace(/[-\s]/g, '');
    console.log(`📱 정규화된 전화번호: ${phone} → ${cleanPhone}`);

    // 전화번호로 회원 조회
    const result = await pool.query(`
      SELECT 
        id,
        name,
        phone,
        email,
        created_at
      FROM users
      WHERE phone = $1
    `, [cleanPhone]);

    if (result.rows.length === 0) {
      console.log(`❌ 전화번호 ${phone}로 등록된 회원 없음`);
      return res.json({
        success: false,
        error: '해당 전화번호로 등록된 회원을 찾을 수 없습니다'
      });
    }

    const user = result.rows[0];
    console.log(`✅ 회원 조회 성공: ${user.name} (ID: ${user.id})`);

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        point: user.point || 0,
        createdAt: user.created_at
      }
    });

  } catch (error) {
    console.error('❌ 전화번호로 회원 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '회원 조회 중 오류가 발생했습니다'
    });
  }
});

module.exports = router;
