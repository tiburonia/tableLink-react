
const pool = require('../../shared/config/database');

async function updateOrdersVisibility() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 orders 테이블 가시성 관리를 위한 업데이트 시작...');
    
    await client.query('BEGIN');
    
    // 1. cooking_status에 새로운 상태 추가
    console.log('📋 cooking_status에 새로운 상태 추가 중...');
    
    // ARCHIVED 상태 추가 (POS 결제 완료 후 숨김용)
    // TABLE_RELEASED 상태 추가 (TLL 테이블 해제 후 숨김용)
    await client.query(`
      ALTER TABLE orders 
      DROP CONSTRAINT IF EXISTS chk_orders_cooking_status
    `);
    
    await client.query(`
      ALTER TABLE orders 
      ADD CONSTRAINT chk_orders_cooking_status 
      CHECK (cooking_status IN ('PENDING', 'COOKING', 'COMPLETED', 'ARCHIVED', 'TABLE_RELEASED'))
    `);
    console.log('✅ cooking_status 제약조건 업데이트 완료');
    
    // 2. is_visible 컬럼 추가 (POS UI에서 보여줄지 여부)
    await client.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true
    `);
    console.log('✅ is_visible 컬럼 추가 완료');
    
    // 3. table_release_source 컬럼 추가 (테이블 해제 방식 추적)
    await client.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS table_release_source VARCHAR(10)
    `);
    console.log('✅ table_release_source 컬럼 추가 완료');
    
    // 4. archived_at 컬럼 추가 (아카이브 시점 추적)
    await client.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP
    `);
    console.log('✅ archived_at 컬럼 추가 완료');
    
    // 5. 인덱스 추가
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_is_visible ON orders(is_visible);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_cooking_status_visible ON orders(cooking_status, is_visible);
    `);
    console.log('✅ 인덱스 추가 완료');
    
    await client.query('COMMIT');
    
    // 테이블 구조 확인
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      ORDER BY ordinal_position
    `);

    console.log('\n📊 업데이트된 orders 테이블 구조:');
    columnsResult.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });
    
    console.log('🎉 orders 테이블 가시성 관리 업데이트 완료!');
    process.exit(0);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ orders 테이블 업데이트 실패:', error);
    process.exit(1);
  } finally {
    client.release();
  }
}

updateOrdersVisibility();
