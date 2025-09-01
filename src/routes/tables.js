
const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// 매장별 테이블 조회 API
router.get('/stores/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;

    const result = await pool.query(`
      SELECT * FROM tables 
      WHERE store_id = $1 
      ORDER BY table_number ASC
    `, [storeId]);

    res.json({
      success: true,
      tables: result.rows
    });
  } catch (error) {
    console.error('테이블 조회 실패:', error);
    res.status(500).json({ error: '테이블 조회 실패' });
  }
});

// 테이블 상태 업데이트 API
router.post('/update', async (req, res) => {
  try {
    const { storeId, tableNumber, status } = req.body;

    const result = await pool.query(`
      UPDATE tables 
      SET status = $1 
      WHERE store_id = $2 AND table_number = $3
      RETURNING *
    `, [status, storeId, tableNumber]);

    res.json({
      success: true,
      table: result.rows[0]
    });
  } catch (error) {
    console.error('테이블 상태 업데이트 실패:', error);
    res.status(500).json({ error: '테이블 상태 업데이트 실패' });
  }
});

module.exports = router;
