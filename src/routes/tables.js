
const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// 매장별 테이블 조회 API (현재 스키마 기반)
router.get('/stores/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;

    console.log(`🪑 매장 ${storeId} 테이블 조회 요청`);

    // store_info 테이블에서 매장 존재 여부 확인
    const storeCheck = await pool.query(`
      SELECT si.store_id, si.name 
      FROM store_info si 
      WHERE si.store_id = $1
    `, [storeId]);

    if (storeCheck.rows.length === 0) {
      console.log(`❌ 매장 ${storeId}를 찾을 수 없음`);
      return res.status(404).json({
        success: false,
        error: '매장을 찾을 수 없습니다'
      });
    }

    const storeName = storeCheck.rows[0].name;

    // checks 테이블에서 현재 오픈된 체크(점유중인 테이블) 조회
    let openChecks = [];
    try {
      const openChecksResult = await pool.query(`
        SELECT 
          table_number,
          opened_at,
          user_id,
          guest_phone
        FROM checks 
        WHERE store_id = $1 AND status = 'open'
        ORDER BY table_number ASC
      `, [storeId]);
      
      openChecks = openChecksResult.rows;
      console.log(`📊 매장 ${storeId} 오픈된 체크 ${openChecks.length}개`);
    } catch (checkError) {
      console.warn(`⚠️ 체크 조회 실패, 빈 배열로 처리:`, checkError.message);
    }

    // 기본 테이블 20개 생성 (1~20번)
    const tables = [];
    for (let i = 1; i <= 20; i++) {
      const openCheck = openChecks.find(check => check.table_number === i);
      
      tables.push({
        id: i,
        tableNumber: i,
        tableName: `${i}번`,
        seats: 4, // 기본 4석
        isOccupied: !!openCheck,
        occupiedSince: openCheck ? openCheck.opened_at : null,
        occupiedBy: openCheck ? (openCheck.user_id || openCheck.guest_phone) : null
      });
    }

    console.log(`✅ 매장 ${storeName} (${storeId}) 테이블 ${tables.length}개 조회 완료`);
    console.log(`📊 사용중: ${tables.filter(t => t.isOccupied).length}개, 빈 테이블: ${tables.filter(t => !t.isOccupied).length}개`);

    res.json({
      success: true,
      tables: tables,
      store: {
        id: parseInt(storeId),
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

// 수동 테이블 점유 API (TLM용)
router.post('/occupy-manual', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { storeId, tableName, duration } = req.body;

    // 테이블 번호 추출
    const tableNumber = parseInt(tableName?.match(/\d+/)?.[0]) || 1;

    console.log(`🪑 수동 테이블 점유:`, { storeId, tableName, tableNumber, duration });

    await client.query('BEGIN');

    // 이미 점유된 테이블인지 확인
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

    // 새 체크 생성 (관리자 점유)
    const checkResult = await client.query(`
      INSERT INTO checks (
        store_id, 
        table_number, 
        status, 
        opened_at,
        subtotal,
        tax_amount,
        service_charge,
        discount_amount,
        final_amount
      ) VALUES ($1, $2, 'open', NOW(), 0, 0, 0, 0, 0)
      RETURNING id, opened_at
    `, [storeId, tableNumber]);

    const newCheck = checkResult.rows[0];

    await client.query('COMMIT');

    const durationText = duration > 0 ? `${duration}분간` : '무제한';
    console.log(`✅ 테이블 ${tableName} ${durationText} 점유 완료`);

    res.json({
      success: true,
      message: `${tableName}이 ${durationText} 점유되었습니다`,
      checkId: newCheck.id
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 수동 테이블 점유 실패:', error);
    res.status(500).json({
      success: false,
      error: '테이블 점유 처리 중 오류가 발생했습니다: ' + error.message
    });
  } finally {
    client.release();
  }
});

// 수동 테이블 해제 API (TLM용)
router.post('/release-manual', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { storeId, tableName } = req.body;

    // 테이블 번호 추출
    const tableNumber = parseInt(tableName?.match(/\d+/)?.[0]) || 1;

    console.log(`🪑 수동 테이블 해제:`, { storeId, tableName, tableNumber });

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
        error: '점유중인 테이블을 찾을 수 없습니다'
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

    console.log(`✅ 테이블 ${tableName} 해제 완료`);

    res.json({
      success: true,
      message: `${tableName}이 해제되었습니다`,
      checkId: checkId
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 수동 테이블 해제 실패:', error);
    res.status(500).json({
      success: false,
      error: '테이블 해제 처리 중 오류가 발생했습니다: ' + error.message
    });
  } finally {
    client.release();
  }
});

module.exports = router;
