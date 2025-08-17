
const pool = require('./shared/config/database');

async function updateTableSchema() {
  try {
    console.log('🔄 테이블 스키마 업데이트 시작...');

    // unique_id 컬럼이 없으면 추가
    await pool.query(`
      ALTER TABLE store_tables 
      ADD COLUMN IF NOT EXISTS unique_id VARCHAR(50) UNIQUE
    `);

    // 기존 테이블들에 unique_id 생성
    const existingTables = await pool.query(`
      SELECT id, store_id, table_number, table_name 
      FROM store_tables 
      WHERE unique_id IS NULL
    `);

    for (const table of existingTables.rows) {
      const uniqueId = `store_${table.store_id}_table_${table.table_number}`;
      await pool.query(`
        UPDATE store_tables 
        SET unique_id = $1 
        WHERE id = $2
      `, [uniqueId, table.id]);
    }

    console.log('✅ 기존 테이블들에 unique_id 추가 완료');

    // 각 매장에 VIP룸과 특별 테이블 추가
    const storeIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
    
    for (const storeId of storeIds) {
      // VIP룸 추가 (각 매장마다 2개)
      for (let vipNum = 1; vipNum <= 2; vipNum++) {
        const uniqueId = `store_${storeId}_vip_${vipNum}`;
        
        // 이미 존재하는지 확인
        const existingVip = await pool.query(`
          SELECT id FROM store_tables WHERE unique_id = $1
        `, [uniqueId]);

        if (existingVip.rows.length === 0) {
          await pool.query(`
            INSERT INTO store_tables (store_id, table_number, table_name, seats, is_occupied, unique_id)
            VALUES ($1, $2, $3, $4, $5, $6)
          `, [storeId, 100 + vipNum, `vip룸 ${vipNum}`, 8, false, uniqueId]);
        }
      }

      // 커플석 추가 (각 매장마다 3개)
      for (let coupleNum = 1; coupleNum <= 3; coupleNum++) {
        const uniqueId = `store_${storeId}_couple_${coupleNum}`;
        
        const existingCouple = await pool.query(`
          SELECT id FROM store_tables WHERE unique_id = $1
        `, [uniqueId]);

        if (existingCouple.rows.length === 0) {
          await pool.query(`
            INSERT INTO store_tables (store_id, table_number, table_name, seats, is_occupied, unique_id)
            VALUES ($1, $2, $3, $4, $5, $6)
          `, [storeId, 200 + coupleNum, `커플석 ${coupleNum}`, 2, false, uniqueId]);
        }
      }

      // 단체석 추가 (각 매장마다 1개)
      const groupUniqueId = `store_${storeId}_group_1`;
      const existingGroup = await pool.query(`
        SELECT id FROM store_tables WHERE unique_id = $1
      `, [groupUniqueId]);

      if (existingGroup.rows.length === 0) {
        await pool.query(`
          INSERT INTO store_tables (store_id, table_number, table_name, seats, is_occupied, unique_id)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [storeId, 300, '단체석 1', 12, false, groupUniqueId]);
      }
    }

    console.log('✅ 모든 매장에 VIP룸, 커플석, 단체석 추가 완료');

    // 인덱스 추가
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_store_tables_unique_id ON store_tables(unique_id);
    `);

    console.log('✅ 테이블 스키마 업데이트 완료');
    process.exit(0);

  } catch (error) {
    console.error('❌ 테이블 스키마 업데이트 실패:', error);
    process.exit(1);
  }
}

updateTableSchema();
