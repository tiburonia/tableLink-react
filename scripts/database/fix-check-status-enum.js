
const pool = require('../../shared/config/database');

async function fixCheckStatusEnum() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 check_status ENUM 수정 시작...');
    
    // 현재 ENUM 값들 확인
    const enumResult = await client.query(`
      SELECT unnest(enum_range(NULL::check_status)) as status_value
    `);
    
    const currentValues = enumResult.rows.map(row => row.status_value);
    console.log('📋 현재 check_status 값들:', currentValues);
    
    // 필요한 값들이 있는지 확인하고 추가
    const requiredValues = ['open', 'closed', 'canceled'];
    
    for (const value of requiredValues) {
      if (!currentValues.includes(value)) {
        console.log(`➕ check_status에 '${value}' 추가 중...`);
        
        await client.query(`
          ALTER TYPE check_status ADD VALUE IF NOT EXISTS '${value}'
        `);
        
        console.log(`✅ '${value}' 추가 완료`);
      } else {
        console.log(`✅ '${value}' 이미 존재`);
      }
    }
    
    // 업데이트된 ENUM 값들 확인
    const updatedEnumResult = await client.query(`
      SELECT unnest(enum_range(NULL::check_status)) as status_value
    `);
    
    const updatedValues = updatedEnumResult.rows.map(row => row.status_value);
    console.log('📋 업데이트된 check_status 값들:', updatedValues);
    
    console.log('🎉 check_status ENUM 수정 완료!');
    
  } catch (error) {
    console.error('❌ check_status ENUM 수정 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 실행
if (require.main === module) {
  fixCheckStatusEnum()
    .then(() => {
      console.log('✅ 실행 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = { fixCheckStatusEnum };
