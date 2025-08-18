
const pool = require('../../shared/config/database');

async function addMissingUserColumns() {
  const client = await pool.connect();
  
  try {
    console.log('📝 사용자 테이블에 누락된 컬럼들 추가 시작...');

    // 1. 기존 컬럼 확인
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('🔍 현재 users 테이블 컬럼들:');
    columnsResult.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'NULL 허용' : 'NOT NULL'})`);
    });

    // 2. 필요한 컬럼들 추가
    const columnsToAdd = [
      { name: 'email', type: 'VARCHAR(255)', nullable: true },
      { name: 'birth', type: 'DATE', nullable: true },
      { name: 'gender', type: 'VARCHAR(10)', nullable: true },
      { name: 'address', type: 'TEXT', nullable: true },
      { name: 'detail_address', type: 'TEXT', nullable: true },
      { name: 'email_notifications', type: 'BOOLEAN', nullable: false, default: true },
      { name: 'sms_notifications', type: 'BOOLEAN', nullable: false, default: true },
      { name: 'push_notifications', type: 'BOOLEAN', nullable: false, default: false },
      { name: 'updated_at', type: 'TIMESTAMP', nullable: false, default: 'CURRENT_TIMESTAMP' }
    ];

    const existingColumns = columnsResult.rows.map(row => row.column_name);

    for (const column of columnsToAdd) {
      if (!existingColumns.includes(column.name)) {
        let sql = `ALTER TABLE users ADD COLUMN ${column.name} ${column.type}`;
        
        if (!column.nullable) {
          sql += ` NOT NULL`;
        }
        
        if (column.default) {
          sql += ` DEFAULT ${column.default}`;
        }

        await client.query(sql);
        console.log(`✅ 컬럼 추가: ${column.name} (${column.type})`);
      } else {
        console.log(`ℹ️ 컬럼 이미 존재: ${column.name}`);
      }
    }

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

    // 4. 기존 user1 데이터에 기본값 설정 (이메일만)
    await client.query(`
      UPDATE users 
      SET email = id || '@tablelink.com'
      WHERE email IS NULL AND id IS NOT NULL
    `);
    
    console.log('✅ 기존 사용자들에게 기본 이메일 설정 완료');

    console.log('\n✅ 사용자 테이블 컬럼 추가 완료!');

  } catch (error) {
    console.error('❌ 컬럼 추가 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 스크립트 직접 실행
if (require.main === module) {
  addMissingUserColumns()
    .then(() => {
      console.log('🎉 스크립트 실행 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = addMissingUserColumns;
