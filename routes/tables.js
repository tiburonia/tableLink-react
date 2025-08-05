
const express = require('express');
const router = express.Router();
const pool = require('../shared/config/database');

// 매장별 테이블 목록 조회 API
router.get('/stores/:storeId', async (req, res) => {
  const { storeId } = req.params;

  try {
    const result = await pool.query(`
      SELECT t.*, s.name as store_name 
      FROM store_tables t 
      JOIN stores s ON t.store_id = s.id 
      WHERE t.store_id = $1 
      ORDER BY t.table_number
    `, [storeId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '매장의 테이블 정보를 찾을 수 없습니다' });
    }

    const tables = result.rows.map(row => ({
      id: row.id,
      tableNumber: row.table_number,
      tableName: row.table_name,
      seats: row.seats,
      isOccupied: row.is_occupied,
      occupiedSince: row.occupied_since,
      storeName: row.store_name
    }));

    const occupiedTables = tables.filter(t => t.isOccupied);
    if (occupiedTables.length > 0) {
      console.log(`📊 매장 ${storeId} 점유된 테이블:`, occupiedTables.map(t => `테이블 ${t.tableNumber} (${t.isOccupied})`));
    }

    res.json({
      success: true,
      storeId: parseInt(storeId),
      totalTables: tables.length,
      availableTables: tables.filter(t => !t.isOccupied).length,
      occupiedTables: tables.filter(t => t.isOccupied).length,
      tables: tables
    });

  } catch (error) {
    console.error('테이블 조회 실패:', error);
    res.status(500).json({ error: '테이블 조회 실패' });
  }
});

// 테이블 상태 업데이트 API
router.post('/update', async (req, res) => {
  const { storeId, tableName, isOccupied } = req.body;

  try {
    const tableResult = await pool.query(
      'SELECT * FROM store_tables WHERE store_id = $1 AND table_name = $2',
      [storeId, tableName]
    );

    if (tableResult.rows.length === 0) {
      return res.status(404).json({ error: '테이블을 찾을 수 없습니다' });
    }

    const table = tableResult.rows[0];
    const occupiedSince = isOccupied ? new Date() : null;
    
    await pool.query(`
      UPDATE store_tables 
      SET is_occupied = $1, occupied_since = $2 
      WHERE unique_id = $3
    `, [isOccupied, occupiedSince, table.unique_id]);

    const updatedTable = await pool.query(
      'SELECT * FROM store_tables WHERE unique_id = $1',
      [table.unique_id]
    );

    res.json({
      success: true,
      message: `${table.table_name} 상태가 ${isOccupied ? '사용중' : '빈 테이블'}으로 변경되었습니다`,
      table: {
        id: updatedTable.rows[0].id,
        uniqueId: updatedTable.rows[0].unique_id,
        tableNumber: updatedTable.rows[0].table_number,
        tableName: updatedTable.rows[0].table_name,
        seats: updatedTable.rows[0].seats,
        isOccupied: updatedTable.rows[0].is_occupied,
        occupiedSince: updatedTable.rows[0].occupied_since
      }
    });

  } catch (error) {
    console.error('테이블 상태 업데이트 실패:', error);
    res.status(500).json({ error: '테이블 상태 업데이트 실패' });
  }
});

// 테이블 점유 상태 설정 및 자동 해제 API (TLL용 - 2분 자동 해제)
router.post('/occupy', async (req, res) => {
  const { storeId, tableName } = req.body;

  console.log(`🔍 [TLL] 테이블 점유 요청: 매장 ID ${storeId}, 테이블 이름 "${tableName}"`);

  try {
    // 먼저 해당 매장의 모든 테이블 확인
    const allTables = await pool.query(`
      SELECT * FROM store_tables WHERE store_id = $1
    `, [storeId]);
    
    console.log(`📊 매장 ${storeId}의 전체 테이블:`, allTables.rows.map(t => `${t.table_name} (ID: ${t.id})`));

    const existingTable = await pool.query(`
      SELECT * FROM store_tables 
      WHERE store_id = $1 AND table_name = $2
    `, [storeId, tableName]);

    if (existingTable.rows.length === 0) {
      console.log(`❌ 테이블을 찾을 수 없음: 매장 ID ${storeId}, 테이블 이름 "${tableName}"`);
      return res.status(404).json({ error: '테이블을 찾을 수 없습니다' });
    }

    const table = existingTable.rows[0];
    const occupiedTime = new Date();

    // TLL 주문용 점유 상태 설정 (auto_release_source = 'TLL')
    const updateResult = await pool.query(`
      UPDATE store_tables 
      SET is_occupied = $1, occupied_since = $2, auto_release_source = $3
      WHERE unique_id = $4
      RETURNING *
    `, [true, occupiedTime, 'TLL', table.unique_id]);

    // TLL 주문에 대해서만 2분 후 자동 해제 스케줄링
    setTimeout(async () => {
      try {
        const tableResult = await pool.query(`
          SELECT * FROM store_tables 
          WHERE unique_id = $1 AND is_occupied = true AND auto_release_source = 'TLL'
        `, [table.unique_id]);

        if (tableResult.rows.length > 0) {
          const currentTable = tableResult.rows[0];
          const occupiedSince = new Date(currentTable.occupied_since);
          const now = new Date();
          const diffMinutes = Math.floor((now - occupiedSince) / (1000 * 60));

          if (diffMinutes >= 2) {
            await pool.query(`
              UPDATE store_tables 
              SET is_occupied = $1, occupied_since = $2, auto_release_source = $3
              WHERE unique_id = $4
            `, [false, null, null, table.unique_id]);

            console.log(`✅ [TLL] 테이블 ${table.table_name} 자동 해제 완료`);
          }
        }
      } catch (error) {
        console.error('❌ [TLL] 테이블 자동 해제 실패:', error);
      }
    }, 2 * 60 * 1000);

    res.json({
      success: true,
      message: `${table.table_name}이 점유 상태로 변경되었습니다. 2분 후 자동 해제됩니다.`,
      occupiedSince: occupiedTime,
      updatedTable: updateResult.rows[0]
    });

  } catch (error) {
    console.error('❌ [TLL] 테이블 점유 상태 설정 실패:', error);
    res.status(500).json({ error: '테이블 점유 상태 설정 실패' });
  }
});

// 테이블 점유 상태 설정 API (TLM용 - 수동 제어)
router.post('/occupy-manual', async (req, res) => {
  const { storeId, tableName, duration } = req.body; // duration: 분 단위 (0이면 무제한)

  console.log(`🔍 [TLM] 수동 테이블 점유 요청: 매장 ID ${storeId}, 테이블 "${tableName}", 시간: ${duration || '무제한'}분`);

  try {
    const existingTable = await pool.query(`
      SELECT * FROM store_tables 
      WHERE store_id = $1 AND table_name = $2
    `, [storeId, tableName]);

    if (existingTable.rows.length === 0) {
      return res.status(404).json({ error: '테이블을 찾을 수 없습니다' });
    }

    const table = existingTable.rows[0];
    const occupiedTime = new Date();

    // TLM 수동 점유 상태 설정 (auto_release_source = 'TLM')
    const updateResult = await pool.query(`
      UPDATE store_tables 
      SET is_occupied = $1, occupied_since = $2, auto_release_source = $3
      WHERE unique_id = $4
      RETURNING *
    `, [true, occupiedTime, 'TLM', table.unique_id]);

    // duration이 지정된 경우에만 자동 해제 스케줄링
    if (duration && duration > 0) {
      setTimeout(async () => {
        try {
          const tableResult = await pool.query(`
            SELECT * FROM store_tables 
            WHERE unique_id = $1 AND is_occupied = true AND auto_release_source = 'TLM'
          `, [table.unique_id]);

          if (tableResult.rows.length > 0) {
            await pool.query(`
              UPDATE store_tables 
              SET is_occupied = $1, occupied_since = $2, auto_release_source = $3
              WHERE unique_id = $4
            `, [false, null, null, table.unique_id]);

            console.log(`✅ [TLM] 테이블 ${table.table_name} ${duration}분 후 자동 해제 완료`);
          }
        } catch (error) {
          console.error('❌ [TLM] 테이블 자동 해제 실패:', error);
        }
      }, duration * 60 * 1000);
    }

    const message = duration > 0 
      ? `${table.table_name}이 점유 상태로 변경되었습니다. ${duration}분 후 자동 해제됩니다.`
      : `${table.table_name}이 점유 상태로 변경되었습니다. (수동 해제 필요)`;

    res.json({
      success: true,
      message: message,
      occupiedSince: occupiedTime,
      duration: duration || 0,
      updatedTable: updateResult.rows[0]
    });

  } catch (error) {
    console.error('❌ [TLM] 테이블 점유 상태 설정 실패:', error);
    res.status(500).json({ error: '테이블 점유 상태 설정 실패' });
  }
  
});

module.exports = router;
