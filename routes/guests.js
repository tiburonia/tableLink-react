
const express = require('express');
const router = express.Router();
const pool = require('../shared/config/database');

// 게스트 조회 (전화번호로)
router.get('/phone/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    
    console.log(`🔍 게스트 조회: ${phone}`);
    
    const result = await pool.query(`
      SELECT id, phone, name, visit_count, last_order_date, total_spent, created_at
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
      WHERE o.guest_id = $1
      ORDER BY o.order_date DESC
      LIMIT 5
    `, [guest.id]);
    
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
router.post('/:guestId/convert-to-member', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { guestId } = req.params;
    const { userId } = req.body;
    
    console.log(`🔄 게스트 ${guestId}를 회원 ${userId}로 전환 시작`);
    
    await client.query('BEGIN');
    
    // 게스트 정보 조회
    const guestResult = await client.query('SELECT * FROM guests WHERE id = $1', [guestId]);
    if (guestResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: '게스트를 찾을 수 없습니다' });
    }
    
    const guest = guestResult.rows[0];
    
    // 회원 정보 조회
    const userResult = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: '회원을 찾을 수 없습니다' });
    }
    
    // 게스트의 모든 주문을 회원으로 이전
    const transferResult = await client.query(`
      UPDATE orders 
      SET user_id = $1, guest_id = NULL, order_source = 'TLL'
      WHERE guest_id = $2
      RETURNING id
    `, [userId, guestId]);
    
    console.log(`✅ ${transferResult.rows.length}개 주문 이전 완료`);
    
    // 게스트 데이터 삭제 (주문 이전 후)
    await client.query('DELETE FROM guests WHERE id = $1', [guestId]);
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      message: `게스트 ${guest.name}(${guest.phone})가 회원으로 전환되었습니다`,
      transferredOrders: transferResult.rows.length,
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
      SELECT DISTINCT g.id, g.phone, g.name, g.visit_count, g.total_spent, g.last_order_date
      FROM guests g
      INNER JOIN orders o ON g.id = o.guest_id
      WHERE o.store_id = $1
      ORDER BY g.last_order_date DESC
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
