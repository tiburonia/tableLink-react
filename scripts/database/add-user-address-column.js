
const pool = require('../../shared/config/database');

async function addUserAddressColumn() {
  const client = await pool.connect();

  try {
    console.log('📍 users 테이블에 user_address 컬럼 추가 시작...');

    // 1. 기존 컬럼 확인
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'user_address'
    `);

    if (columnsResult.rows.length > 0) {
      console.log('ℹ️ user_address 컬럼이 이미 존재합니다.');
      return;
    }

    // 2. user_address 컬럼 추가
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN user_address TEXT
    `);

    console.log('✅ user_address 컬럼 추가 완료');

    // 3. 업데이트된 테이블 구조 확인
    const updatedResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);

    console.log('\n📋 업데이트된 users 테이블 구조:');
    updatedResult.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'NULL 허용' : 'NOT NULL'}) ${col.column_default ? `기본값: ${col.column_default}` : ''}`);
    });

    console.log('\n✅ user_address 컬럼 추가 완료!');

  } catch (error) {
    console.error('❌ user_address 컬럼 추가 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 스크립트 직접 실행
if (require.main === module) {
  addUserAddressColumn()
    .then(() => {
      console.log('🎉 스크립트 실행 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = addUserAddressColumn;
