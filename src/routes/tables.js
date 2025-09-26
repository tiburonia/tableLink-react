const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});


// 테이블별 TLL 연동 상태 확인
router.get('/stores/:storeId/table/:tableNumber/tll-status', async (req, res) => {
  try {
    const { storeId, tableNumber } = req.params;

    console.log(`🔍 TLL 연동 상태 확인: 매장 ${storeId}, 테이블 ${tableNumber}`);

    // 여기서는 간단히 모든 테이블을 TLL 미연동으로 처리
    // 실제 환경에서는 테이블별 TLL 연동 설정을 확인하는 로직 필요
    const hasTLLIntegration = false; // 기본값: TLL 미연동

    res.json({
      success: true,
      storeId: parseInt(storeId),
      tableNumber: parseInt(tableNumber),
      hasTLLIntegration: hasTLLIntegration,
      message: hasTLLIntegration ? 'TLL 연동 테이블' : 'TLL 미연동 테이블 (비회원 POS 주문 가능)'
    });

  } catch (error) {
    console.error('❌ TLL 연동 상태 확인 실패:', error);
    res.status(500).json({
      success: false,
      error: 'TLL 연동 상태 확인 실패'
    });
  }
});


// 매장별 테이블 조회 API (현재 스키마 기반)
router.get('/stores/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;

    console.log(`🪑 매장 ${storeId} 테이블 조회 요청`);

    // 파라미터 검증
    const parsedStoreId = parseInt(storeId);
    if (isNaN(parsedStoreId)) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 매장 ID입니다'
      });
    }

    // stores 테이블에서 매장 존재 여부 확인 (store_info 대신 stores 사용)
    const storeCheck = await pool.query(`
      SELECT id, name 
      FROM stores 
      WHERE id = $1
    `, [parsedStoreId]);

    if (storeCheck.rows.length === 0) {
      console.log(`❌ 매장 ${parsedStoreId}를 찾을 수 없음`);
      return res.status(404).json({
        success: false,
        error: '매장을 찾을 수 없습니다'
      });
    }

    const storeName = storeCheck.rows[0].name;

    // store_tables 테이블에서 실제 테이블 정보 조회
    const storeTablesResult = await pool.query(`
      SELECT 
        id,
        table_name,
        capacity as seats
      FROM store_tables 
      WHERE store_id = $1
      ORDER BY id ASC
    `, [parsedStoreId]);

    console.log(`📊 매장 ${storeId} store_tables에서 ${storeTablesResult.rows.length}개 테이블 발견`)

    // orders 테이블에서 현재 활성 주문(점유중인 테이블) 조회
    let activeOrders = [];
    try {
      const activeOrdersResult = await pool.query(`
        SELECT 
          o.table_num as table_number,
          o.created_at as opened_at,
          o.user_id,
          o.guest_phone
        FROM orders o
        WHERE o.store_id = $1 
          AND o.session_status = 'OPEN'
          AND NOT COALESCE(o.session_ended, false)
        ORDER BY o.table_num ASC
      `, [parsedStoreId]);

      activeOrders = activeOrdersResult.rows;
      console.log(`📊 매장 ${storeId} 활성 주문 ${activeOrders.length}개`);
    } catch (orderError) {
      console.warn(`⚠️ 활성 주문 조회 실패, 빈 배열로 처리:`, orderError.message);
    }

    // store_tables 데이터를 기반으로 테이블 생성
    const tables = [];

    if (storeTablesResult.rows.length > 0) {
      // store_tables에 데이터가 있으면 실제 테이블 정보 사용
      for (const storeTable of storeTablesResult.rows) {
        const tableNumber = storeTable.id; // store_tables의 id를 table_number로 사용
        const activeOrder = activeOrders.find(order => order.table_number === tableNumber);

        tables.push({
          id: tableNumber,
          tableNumber: tableNumber,
          tableName: storeTable.table_name || `${tableNumber}번`,
          seats: storeTable.seats || 4,
          isOccupied: !!activeOrder,
          occupiedSince: activeOrder ? activeOrder.opened_at : null,
          occupiedBy: activeOrder ? (activeOrder.user_id || activeOrder.guest_phone) : null
        });
      }
      console.log(`✅ store_tables 기반으로 ${tables.length}개 테이블 생성`);
    } else {
      // store_tables에 데이터가 없으면 기본 5개 테이블 생성
      console.warn(`⚠️ 매장 ${storeId}에 store_tables 데이터가 없어 기본 5개 테이블 생성`);
      for (let i = 1; i <= 5; i++) {
        const activeOrder = activeOrders.find(order => order.table_number === i);

        tables.push({
          id: i,
          tableNumber: i,
          tableName: `${i}번`,
          seats: 4,
          isOccupied: !!activeOrder,
          occupiedSince: activeOrder ? activeOrder.opened_at : null,
          occupiedBy: activeOrder ? (activeOrder.user_id || activeOrder.guest_phone) : null
        });
      }
    }

    console.log(`✅ 매장 ${storeName} (${storeId}) 테이블 ${tables.length}개 조회 완료`);
    console.log(`📊 사용중: ${tables.filter(t => t.isOccupied).length}개, 빈 테이블: ${tables.filter(t => !t.isOccupied).length}개`);

    res.json({
      success: true,
      tables: tables,
      store: {
        id: parsedStoreId,
        name: storeName
      }
    });

  } catch (error) {
    console.error('❌ 테이블 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '테이블 조회 중 오류가 발생했습니다: ' + error.message
    });
  }
});

// 테이블 점유 처리 API
router.post('/occupy', async (req, res) => {
  const client = await pool.connect();

  try {
    const { storeId, tableNumber, userId, guestPhone, duration } = req.body;

    console.log(`🪑 테이블 점유 요청:`, { storeId, tableNumber, userId, guestPhone, duration });

    await client.query('BEGIN');

    // 이미 해당 테이블에 오픈된 체크가 있는지 확인
    const existingCheck = await client.query(`
      SELECT id FROM checks 
      WHERE store_id = $1 AND table_number = $2 AND status = 'open'
    `, [storeId, tableNumber]);

    if (existingCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        error: '이미 사용중인 테이블입니다'
      });
    }

    // 새 체크 생성
    const checkResult = await client.query(`
      INSERT INTO checks (
        store_id, 
        table_number, 
        user_id, 
        guest_phone, 
        status, 
        opened_at,
        subtotal,
        tax_amount,
        service_charge,
        discount_amount,
        final_amount
      ) VALUES ($1, $2, $3, $4, 'open', NOW(), 0, 0, 0, 0, 0)
      RETURNING id, opened_at
    `, [storeId, tableNumber, userId || null, guestPhone || null]);

    const newCheck = checkResult.rows[0];

    await client.query('COMMIT');

    console.log(`✅ 테이블 ${tableNumber} 점유 완료 - 체크 ID: ${newCheck.id}`);

    res.json({
      success: true,
      message: `테이블 ${tableNumber}번이 점유되었습니다`,
      checkId: newCheck.id,
      occupiedSince: newCheck.opened_at
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 테이블 점유 실패:', error);
    res.status(500).json({
      success: false,
      error: '테이블 점유 처리 중 오류가 발생했습니다: ' + error.message
    });
  } finally {
    client.release();
  }
});

// 테이블 해제 처리 API
router.post('/release', async (req, res) => {
  const client = await pool.connect();

  try {
    const { storeId, tableNumber } = req.body;

    console.log(`🪑 테이블 해제 요청:`, { storeId, tableNumber });

    await client.query('BEGIN');

    // 해당 테이블의 오픈된 체크 조회
    const checkResult = await client.query(`
      SELECT id FROM checks 
      WHERE store_id = $1 AND table_number = $2 AND status = 'open'
    `, [storeId, tableNumber]);

    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: '점유중인 체크를 찾을 수 없습니다'
      });
    }

    const checkId = checkResult.rows[0].id;

    // 체크 상태를 closed로 변경
    await client.query(`
      UPDATE checks 
      SET status = 'closed', closed_at = NOW()
      WHERE id = $1
    `, [checkId]);

    await client.query('COMMIT');

    console.log(`✅ 테이블 ${tableNumber} 해제 완료 - 체크 ID: ${checkId}`);

    res.json({
      success: true,
      message: `테이블 ${tableNumber}번이 해제되었습니다`,
      checkId: checkId
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 테이블 해제 실패:', error);
    res.status(500).json({
      success: false,
      error: '테이블 해제 처리 중 오류가 발생했습니다: ' + error.message
    });
  } finally {
    client.release();
  }
});





module.exports = router;