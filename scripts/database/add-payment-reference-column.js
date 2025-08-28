
const pool = require('../../shared/config/database');

async function addPaymentReferenceColumn() {
  const client = await pool.connect();
  
  try {
    console.log('💳 user_paid_orders 테이블에 payment_reference 컬럼 추가 시작...');
    
    await client.query('BEGIN');
    
    // 1. payment_reference 컬럼 존재 여부 확인
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user_paid_orders' AND column_name = 'payment_reference'
    `);
    
    if (columnCheck.rows.length === 0) {
      // payment_reference 컬럼 추가 (JSONB 타입으로 토스페이먼츠 정보 저장)
      await client.query(`
        ALTER TABLE user_paid_orders 
        ADD COLUMN payment_reference JSONB
      `);
      console.log('✅ payment_reference 컬럼 추가 완료');
    } else {
      console.log('✅ payment_reference 컬럼이 이미 존재');
    }
    
    // 2. 인덱스 추가 (PG 결제 키로 검색 최적화)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_paid_orders_payment_reference 
      ON user_paid_orders USING GIN (payment_reference)
    `);
    console.log('✅ payment_reference JSONB 인덱스 추가 완료');
    
    await client.query('COMMIT');
    
    // 3. 테이블 구조 확인
    const tableStructure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'user_paid_orders' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📊 user_paid_orders 테이블 구조:');
    tableStructure.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    console.log('\n🎉 payment_reference 컬럼 추가 완료!');
    console.log('📋 이제 토스페이먼츠 결제 정보를 저장할 수 있습니다.');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ payment_reference 컬럼 추가 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 실행
if (require.main === module) {
  addPaymentReferenceColumn()
    .then(() => {
      console.log('🎉 실행 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = { addPaymentReferenceColumn };
