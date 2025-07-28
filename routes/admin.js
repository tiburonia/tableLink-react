
const express = require('express');
const router = express.Router();
const pool = require('../shared/config/database');

// 관리자 통계 API - 매장 통계
router.get('/stats/stores', async (req, res) => {
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
router.get('/stats/users', async (req, res) => {
  try {
    const totalUsersResult = await pool.query('SELECT COUNT(*) FROM users');
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

// 전체 테이블 현황 조회 API
router.get('/tables/status', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        s.id as store_id, s.name as store_name,
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

module.exports = router;
