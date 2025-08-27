
const express = require('express');
const router = express.Router();
const pool = require('../shared/config/database');

// 게스트 조회 (전화번호로)
router.get('/phone/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    
    console.log(`🔍 게스트 조회: ${phone}`);
    
    const result = await pool.query(`
      SELECT phone, visit_count, created_at, updated_at
      FROM guests
      WHERE phone = $1
    `, [phone]);
    
    if (result.rows.length === 0) {
      return res.json({
        success: false,
        message: '등록되지 않은 전화번호입니다',
        guest: null
      });
    }
    
    const guest = result.rows[0];
    
    // 최근 주문 이력도 함께 조회
    const ordersResult = await pool.query(`
      SELECT o.id, o.store_id, s.name as store_name, o.final_amount, o.order_date
      FROM orders o
      LEFT JOIN stores s ON o.store_id = s.id
      WHERE o.guest_phone = $1
      ORDER BY o.order_date DESC
      LIMIT 5
    `, [guest.phone]);
    
    res.json({
      success: true,
      guest: {
        ...guest,
        recentOrders: ordersResult.rows
      }
    });
    
  } catch (error) {
    console.error('❌ 게스트 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '게스트 조회 실패'
    });
  }
});

// 게스트를 회원으로 전환
router.post('/:guestPhone/convert-to-member', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { guestPhone } = req.params;
    const { userId } = req.body;
    
    console.log(`🔄 게스트 ${guestPhone}를 회원 ${userId}로 전환 시작`);
    
    await client.query('BEGIN');
    
    // 게스트 정보 조회
    const guestResult = await client.query('SELECT * FROM guests WHERE phone = $1', [guestPhone]);
    if (guestResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: '게스트를 찾을 수 없습니다' });
    }
    
    const guest = guestResult.rows[0];
    
    // 회원 정보 조회
    const userResult = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: '회원을 찾을 수 없습니다' });
    }
    
    // 1. orders 테이블의 게스트 주문을 회원으로 이전
    const orderTransferResult = await client.query(`
      UPDATE orders 
      SET user_id = $1, guest_phone = NULL
      WHERE guest_phone = $2
      RETURNING id
    `, [userId, guestPhone]);
    
    console.log(`✅ orders 테이블 ${orderTransferResult.rows.length}개 주문 이전 완료`);
    
    // 2. paid_orders 테이블의 게스트 주문을 회원으로 이전
    const paidOrderTransferResult = await client.query(`
      UPDATE paid_orders 
      SET user_id = $1, guest_phone = NULL
      WHERE guest_phone = $2
      RETURNING id
    `, [userId, guestPhone]);
    
    console.log(`✅ paid_orders 테이블 ${paidOrderTransferResult.rows.length}개 결제 내역 이전 완료`);
    
    // 3. user_store_stats 테이블에 게스트의 매장별 통계 정보 병합
    try {
      const guestStatsResult = await client.query(`
        SELECT 
          p.store_id,
          COUNT(*) as visit_count,
          SUM(p.final_amount) as total_spent,
          FLOOR(SUM(p.final_amount) * 0.1) as earned_points
        FROM paid_orders p
        WHERE p.user_id = $1
        GROUP BY p.store_id
      `, [userId]);
      
      for (const stat of guestStatsResult.rows) {
        await client.query(`
          INSERT INTO user_store_stats (user_id, store_id, points, total_spent, visit_count, updated_at)
          VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
          ON CONFLICT (user_id, store_id) 
          DO UPDATE SET 
            points = user_store_stats.points + $3,
            total_spent = user_store_stats.total_spent + $4,
            visit_count = user_store_stats.visit_count + $5,
            updated_at = CURRENT_TIMESTAMP
        `, [userId, stat.store_id, stat.earned_points, stat.total_spent, stat.visit_count]);
      }
      
      console.log(`✅ user_store_stats ${guestStatsResult.rows.length}개 매장 통계 병합 완료`);
    } catch (statsError) {
      console.warn('⚠️ 매장별 통계 병합 실패:', statsError);
    }
    
    // 게스트 데이터 삭제 (주문 이전 후)
    await client.query('DELETE FROM guests WHERE phone = $1', [guestPhone]);
    
    await client.query('COMMIT');
    
    const totalTransferred = orderTransferResult.rows.length + paidOrderTransferResult.rows.length;
    
    res.json({
      success: true,
      message: `게스트 ${guestPhone}가 회원으로 전환되었습니다`,
      transferredOrders: orderTransferResult.rows.length,
      transferredPayments: paidOrderTransferResult.rows.length,
      totalTransferred: totalTransferred,
      guestInfo: guest
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 게스트 회원 전환 실패:', error);
    res.status(500).json({
      success: false,
      error: '게스트 회원 전환 실패: ' + error.message
    });
  } finally {
    client.release();
  }
});

// 게스트 목록 조회 (매장별)
router.get('/store/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;
    const { limit = 50 } = req.query;
    
    console.log(`👥 매장 ${storeId} 게스트 목록 조회`);
    
    const result = await pool.query(`
      SELECT DISTINCT g.phone, g.visit_count, g.created_at, g.updated_at
      FROM guests g
      INNER JOIN orders o ON g.phone = o.guest_phone
      WHERE o.store_id = $1
      ORDER BY g.updated_at DESC
      LIMIT $2
    `, [parseInt(storeId), parseInt(limit)]);
    
    res.json({
      success: true,
      storeId: parseInt(storeId),
      guests: result.rows,
      total: result.rows.length
    });
    
  } catch (error) {
    console.error('❌ 매장 게스트 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '게스트 목록 조회 실패'
    });
  }
});

module.exports = router;
