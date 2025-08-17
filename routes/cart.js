
const express = require('express');
const router = express.Router();
const pool = require('../shared/config/database');

// 장바구니 저장 API
router.post('/save', async (req, res) => {
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
router.get('/:userId', async (req, res) => {
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

module.exports = router;
