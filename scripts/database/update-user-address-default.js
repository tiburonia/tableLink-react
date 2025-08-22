
const pool = require('../../shared/config/database');

async function updateUserAddressDefault() {
  const client = await pool.connect();

  try {
    console.log('🔧 user_address 컬럼 기본값 설정 시작...');

    // 1. 현재 컬럼 상태 확인
    const currentColumn = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'user_address'
    `);

    if (currentColumn.rows.length === 0) {
      console.log('❌ user_address 컬럼이 존재하지 않습니다.');
      return;
    }

    console.log('📋 현재 user_address 컬럼 상태:', currentColumn.rows[0]);

    // 2. 기본값 설정
    await client.query(`
      ALTER TABLE users 
      ALTER COLUMN user_address SET DEFAULT '37.5666103,126.9783882'
    `);

    console.log('✅ user_address 컬럼에 기본값 설정 완료');

    // 3. 기존 NULL 값들을 기본값으로 업데이트
    const updateResult = await client.query(`
      UPDATE users 
      SET user_address = '37.5666103,126.9783882' 
      WHERE user_address IS NULL
    `);

    console.log(`✅ NULL 값 업데이트 완료: ${updateResult.rowCount}개 행`);

    // 4. 업데이트된 컬럼 상태 확인
    const updatedColumn = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'user_address'
    `);

    console.log('📋 업데이트된 user_address 컬럼 상태:', updatedColumn.rows[0]);

    // 5. 실제 데이터 확인
    const dataCheck = await client.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(user_address) as users_with_address,
        COUNT(*) - COUNT(user_address) as users_without_address
      FROM users
    `);

    console.log('📊 사용자 주소 데이터 현황:', dataCheck.rows[0]);

    console.log('🎉 user_address 컬럼 기본값 설정 완료!');

  } catch (error) {
    console.error('❌ user_address 컬럼 수정 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 스크립트 직접 실행
if (require.main === module) {
  updateUserAddressDefault()
    .then(() => {
      console.log('✨ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = updateUserAddressDefault;
