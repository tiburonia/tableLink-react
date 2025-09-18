
const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// 사용자 장바구니 조회
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(`
      SELECT 
        c.id,
        c.menu_id,
        c.quantity,
        c.special_requests,
        m.name as menu_name,
        m.price,
        m.category
      FROM cart c
      JOIN menus m ON c.menu_id = m.id
      WHERE c.user_id = $1
    `, [userId]);

    res.json({
      success: true,
      cartItems: result.rows
    });
  } catch (error) {
    console.error('장바구니 조회 실패:', error);
    res.status(500).json({ error: '장바구니 조회 실패' });
  }
});

// 장바구니에 메뉴 추가
router.post('/add', async (req, res) => {
  try {
    const { userId, menuId, quantity, specialRequests } = req.body;

    const result = await pool.query(`
      INSERT INTO cart (user_id, menu_id, quantity, special_requests)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, menu_id) 
      DO UPDATE SET quantity = cart.quantity + $3
      RETURNING *
    `, [userId, menuId, quantity, specialRequests]);

    res.json({
      success: true,
      cartItem: result.rows[0]
    });
  } catch (error) {
    console.error('장바구니 추가 실패:', error);
    res.status(500).json({ error: '장바구니 추가 실패' });
  }
});

// 장바구니 비우기
router.delete('/clear/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    await pool.query('DELETE FROM cart WHERE user_id = $1', [userId]);

    res.json({
      success: true,
      message: '장바구니가 비워졌습니다'
    });
  } catch (error) {
    console.error('장바구니 비우기 실패:', error);
    res.status(500).json({ error: '장바구니 비우기 실패' });
  }
});

module.exports = router;
