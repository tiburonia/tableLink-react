
const pool = require('../../shared/config/database');

async function addUserProfileColumns() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 사용자 프로필 관련 컬럼 추가 시작...');
    
    await client.query('BEGIN');
    
    // 추가할 컬럼들 정의
    const columnsToAdd = [
      {
        name: 'email',
        type: 'VARCHAR(255)',
        description: '이메일 주소'
      },
      {
        name: 'birth',
        type: 'DATE',
        description: '생년월일'
      },
      {
        name: 'gender',
        type: 'VARCHAR(10)',
        description: '성별'
      },
      {
        name: 'address',
        type: 'TEXT',
        description: '주소'
      },
      {
        name: 'detail_address',
        type: 'VARCHAR(255)',
        description: '상세주소'
      },
      {
        name: 'email_notifications',
        type: 'BOOLEAN DEFAULT true',
        description: '이메일 알림 수신 여부'
      },
      {
        name: 'sms_notifications',
        type: 'BOOLEAN DEFAULT true',
        description: 'SMS 알림 수신 여부'
      },
      {
        name: 'push_notifications',
        type: 'BOOLEAN DEFAULT false',
        description: '푸시 알림 수신 여부'
      },
      {
        name: 'updated_at',
        type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        description: '정보 수정일시'
      }
    ];
    
    // 각 컬럼이 존재하는지 확인하고 없으면 추가
    for (const column of columnsToAdd) {
      try {
        const columnExists = await client.query(`
          SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = $1
          )
        `, [column.name]);
        
        if (!columnExists.rows[0].exists) {
          await client.query(`
            ALTER TABLE users ADD COLUMN ${column.name} ${column.type}
          `);
          console.log(`✅ ${column.name} 컬럼 추가 완료 - ${column.description}`);
        } else {
          console.log(`⚠️ ${column.name} 컬럼이 이미 존재함`);
        }
      } catch (error) {
        console.error(`❌ ${column.name} 컬럼 추가 실패:`, error.message);
      }
    }
    
    // 이메일 인덱스 추가 (있다면 무시)
    try {
      await client.query(`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email 
        ON users(email) WHERE email IS NOT NULL
      `);
      console.log('✅ 이메일 인덱스 추가 완료');
    } catch (error) {
      console.log('⚠️ 이메일 인덱스 추가 스킵:', error.message);
    }
    
    await client.query('COMMIT');
    
    // 최종 users 테이블 구조 확인
    const finalColumns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 최종 users 테이블 구조:');
    finalColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    
    console.log('\n🎉 사용자 프로필 컬럼 추가 완료!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 사용자 프로필 컬럼 추가 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 스크립트 실행
addUserProfileColumns()
  .then(() => {
    console.log('🚀 프로필 컬럼 추가 프로세스 완료');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ 프로세스 실패:', error);
    process.exit(1);
  });
