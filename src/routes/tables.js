
const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');

// 매장별 테이블 조회 API
router.get('/stores/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;

    const result = await pool.query(`
      SELECT 
        id,
        table_number as "tableNumber",
        4 as seats,
        is_occupied as "isOccupied",
        occupied_at as "occupiedSince"
      FROM store_tables 
      WHERE store_id = $1 
      ORDER BY table_number ASC
    `, [storeId]);

    res.json({
      success: true,
      tables: result.rows
    });
  } catch (error) {
    console.error('테이블 조회 실패:', error);
    res.status(500).json({ 
      success: false,
      error: '테이블 조회 실패' 
    });
  }
});

// 테이블 상태 업데이트 API
router.post('/update', async (req, res) => {
  try {
    const { storeId, tableNumber, isOccupied } = req.body;

    const result = await pool.query(`
      UPDATE store_tables 
      SET is_occupied = $1, updated_at = NOW()
      WHERE store_id = $2 AND table_number = $3
      RETURNING *
    `, [isOccupied, storeId, tableNumber]);

    res.json({
      success: true,
      table: result.rows[0]
    });
  } catch (error) {
    console.error('테이블 상태 업데이트 실패:', error);
    res.status(500).json({ 
      success: false,
      error: '테이블 상태 업데이트 실패' 
    });
  }
});

// 테이블 점유 API
router.post('/occupy-manual', async (req, res) => {
  try {
    const { storeId, tableName, duration } = req.body;
    
    // tableName에서 테이블 번호 추출 (예: "테이블 1" -> 1)
    const tableNumber = tableName.replace(/[^0-9]/g, '');

    const result = await pool.query(`
      UPDATE store_tables 
      SET is_occupied = true, updated_at = NOW()
      WHERE store_id = $1 AND table_number = $2
      RETURNING *
    `, [storeId, tableNumber]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '테이블을 찾을 수 없습니다'
      });
    }

    res.json({
      success: true,
      table: result.rows[0]
    });
  } catch (error) {
    console.error('테이블 점유 실패:', error);
    res.status(500).json({ 
      success: false,
      error: '테이블 점유 실패' 
    });
  }
});

module.exports = router;
