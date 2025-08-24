
const express = require('express');
const router = express.Router();
const pool = require('../shared/config/database');

// POS 전용 사용자 생성/조회
async function ensurePOSUser() {
  try {
    let userResult = await pool.query('SELECT * FROM users WHERE id = $1', ['pos-user']);
    
    if (userResult.rows.length === 0) {
      // POS 전용 사용자 생성
      await pool.query(`
        INSERT INTO users (id, name, email, password_hash, phone, is_pos_user)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, ['pos-user', 'POS 시스템', 'pos@system.local', 'pos-system', '000-0000-0000', true]);
      
      userResult = await pool.query('SELECT * FROM users WHERE id = $1', ['pos-user']);
      console.log('✅ POS 전용 사용자 생성 완료');
    }
    
    return userResult.rows[0];
  } catch (error) {
    console.error('❌ POS 사용자 확인/생성 실패:', error);
    throw error;
  }
}

// POS 매장 목록 조회
router.get('/stores', async (req, res) => {
  try {
    console.log('🏪 POS 매장 목록 조회');
    
    const result = await pool.query(`
      SELECT s.id, s.name, s.category, s.is_open as "isOpen"
      FROM stores s
      ORDER BY s.name
    `);
    
    res.json({
      success: true,
      stores: result.rows
    });
    
  } catch (error) {
    console.error('❌ POS 매장 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '매장 목록 조회 실패'
    });
  }
});

// POS 매장별 메뉴 조회
router.get('/stores/:storeId/menu', async (req, res) => {
  try {
    const { storeId } = req.params;
    console.log(`🍽️ POS 매장 ${storeId} 메뉴 조회`);
    
    const result = await pool.query(`
      SELECT id, name, category, menu
      FROM stores
      WHERE id = $1
    `, [parseInt(storeId)]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '매장을 찾을 수 없습니다'
      });
    }
    
    const store = result.rows[0];
    let menu = store.menu || [];
    
    if (typeof menu === 'string') {
      try {
        menu = JSON.parse(menu);
      } catch (error) {
        console.warn('메뉴 JSON 파싱 실패:', error);
        menu = [];
      }
    }
    
    res.json({
      success: true,
      menu: menu
    });
    
  } catch (error) {
    console.error('❌ POS 메뉴 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '메뉴 조회 실패'
    });
  }
});

// POS 매장별 테이블 조회
router.get('/stores/:storeId/tables', async (req, res) => {
  try {
    const { storeId } = req.params;
    console.log(`🪑 POS 매장 ${storeId} 테이블 조회`);
    
    const result = await pool.query(`
      SELECT id, table_number as "tableNumber", table_name as "tableName", 
             seats, is_occupied as "isOccupied", occupied_since as "occupiedSince"
      FROM store_tables
      WHERE store_id = $1
      ORDER BY table_number
    `, [parseInt(storeId)]);
    
    res.json({
      success: true,
      tables: result.rows
    });
    
  } catch (error) {
    console.error('❌ POS 테이블 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '테이블 조회 실패'
    });
  }
});

// POS 주문 처리
router.post('/orders', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { storeId, storeName, tableNumber, items, totalAmount } = req.body;
    
    console.log('💳 POS 주문 처리:', {
      storeId, storeName, tableNumber, 
      itemCount: items?.length, 
      totalAmount
    });
    
    await client.query('BEGIN');
    
    // POS 사용자 확인
    const posUser = await ensurePOSUser();
    
    // 주문 데이터 생성
    const orderData = {
      items: items,
      total: totalAmount,
      storeName: storeName,
      tableNumber: tableNumber,
      source: 'POS'
    };
    
    // 주문 저장
    const orderResult = await client.query(`
      INSERT INTO orders (
        user_id, store_id, table_number, order_data,
        total_amount, original_amount, used_point, coupon_discount, final_amount,
        order_status, order_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `, [
      posUser.id,
      storeId,
      tableNumber,
      JSON.stringify(orderData),
      totalAmount,
      totalAmount,
      0,
      0,
      totalAmount,
      'completed',
      new Date()
    ]);
    
    const orderId = orderResult.rows[0].id;
    
    // order_items 테이블에 메뉴별 데이터 저장
    for (const item of items) {
      await client.query(`
        INSERT INTO order_items (
          order_id, menu_name, quantity, price, cooking_status
        ) VALUES ($1, $2, $3, $4, $5)
      `, [
        orderId,
        item.name,
        item.quantity,
        item.price,
        'PENDING'
      ]);
    }
    
    await client.query('COMMIT');
    
    // KDS 실시간 업데이트
    if (global.kdsWebSocket) {
      console.log(`📡 POS 주문 ${orderId} KDS 실시간 업데이트 전송`);
      global.kdsWebSocket.broadcast(storeId, 'new-order', {
        orderId: orderId,
        storeName: storeName,
        tableNumber: tableNumber,
        customerName: 'POS 주문',
        itemCount: items.length,
        totalAmount: totalAmount,
        source: 'POS'
      });
    }
    
    res.json({
      success: true,
      orderId: orderId,
      message: '주문이 성공적으로 처리되었습니다'
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ POS 주문 처리 실패:', error);
    res.status(500).json({
      success: false,
      error: '주문 처리 실패: ' + error.message
    });
  } finally {
    client.release();
  }
});

// POS 매장별 오늘 주문 통계
router.get('/stores/:storeId/stats', async (req, res) => {
  try {
    const { storeId } = req.params;
    const today = new Date().toISOString().split('T')[0];
    
    console.log(`📊 POS 매장 ${storeId} 오늘 통계 조회`);
    
    const result = await pool.query(`
      SELECT 
        COUNT(*) as order_count,
        COALESCE(SUM(final_amount), 0) as total_revenue
      FROM orders
      WHERE store_id = $1 AND DATE(order_date) = $2
    `, [parseInt(storeId), today]);
    
    const stats = result.rows[0];
    
    res.json({
      success: true,
      stats: {
        orderCount: parseInt(stats.order_count),
        totalRevenue: parseInt(stats.total_revenue),
        date: today
      }
    });
    
  } catch (error) {
    console.error('❌ POS 통계 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '통계 조회 실패'
    });
  }
});

module.exports = router;
