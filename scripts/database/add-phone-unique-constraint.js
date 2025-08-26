
const pool = require('../../shared/config/database');

async function addPhoneUniqueConstraint() {
  const client = await pool.connect();
  
  try {
    console.log('📞 전화번호 unique 제약조건 추가 시작...');
    
    await client.query('BEGIN');
    
    // 1. users 테이블에 phone unique 제약조건 추가
    console.log('👥 users 테이블 phone unique 제약조건 확인 중...');
    
    // 기존 중복 전화번호 확인
    const duplicateUsers = await client.query(`
      SELECT phone, COUNT(*) as count
      FROM users 
      WHERE phone IS NOT NULL AND phone != '' AND phone != '000-0000-0000'
      GROUP BY phone 
      HAVING COUNT(*) > 1
    `);
    
    if (duplicateUsers.rows.length > 0) {
      console.log(`⚠️ 중복 전화번호 ${duplicateUsers.rows.length}개 발견:`);
      duplicateUsers.rows.forEach(row => {
        console.log(`   - ${row.phone}: ${row.count}개 계정`);
      });
      
      // 중복 전화번호 처리 (가장 최근 계정만 유지)
      for (const duplicate of duplicateUsers.rows) {
        console.log(`🔧 중복 전화번호 ${duplicate.phone} 처리 중...`);
        
        const duplicateAccounts = await client.query(`
          SELECT id, name, created_at
          FROM users 
          WHERE phone = $1
          ORDER BY created_at DESC
        `, [duplicate.phone]);
        
        // 가장 최근 계정 제외하고 나머지 전화번호를 NULL로 변경
        for (let i = 1; i < duplicateAccounts.rows.length; i++) {
          const account = duplicateAccounts.rows[i];
          await client.query(`
            UPDATE users 
            SET phone = NULL 
            WHERE id = $1
          `, [account.id]);
          
          console.log(`   📱 ${account.name} (${account.id})의 전화번호 제거`);
        }
        
        console.log(`   ✅ ${duplicateAccounts.rows[0].name} (${duplicateAccounts.rows[0].id})의 전화번호 유지`);
      }
    }
    
    // users 테이블에 unique 제약조건 추가
    try {
      await client.query(`
        ALTER TABLE users 
        ADD CONSTRAINT unique_users_phone 
        UNIQUE (phone)
      `);
      console.log('✅ users 테이블 phone unique 제약조건 추가 완료');
    } catch (constraintError) {
      if (constraintError.code === '23505' || constraintError.message.includes('already exists')) {
        console.log('ℹ️ users 테이블 phone unique 제약조건 이미 존재');
      } else {
        throw constraintError;
      }
    }
    
    // 2. guests 테이블은 이미 phone이 PRIMARY KEY이므로 unique함
    console.log('👤 guests 테이블은 이미 phone이 PRIMARY KEY (unique)');
    
    // 3. 전화번호 인덱스 추가 (성능 향상)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_phone_not_null 
      ON users(phone) 
      WHERE phone IS NOT NULL
    `);
    console.log('✅ users 테이블 phone 인덱스 추가 완료');
    
    await client.query('COMMIT');
    
    // 4. 제약조건 확인
    const constraints = await client.query(`
      SELECT constraint_name, table_name, column_name
      FROM information_schema.key_column_usage
      WHERE table_name IN ('users', 'guests')
      AND column_name = 'phone'
      ORDER BY table_name, constraint_name
    `);
    
    console.log('\n📋 전화번호 관련 제약조건:');
    constraints.rows.forEach(row => {
      console.log(`   - ${row.table_name}.${row.column_name}: ${row.constraint_name}`);
    });
    
    console.log('\n✅ 전화번호 unique 제약조건 설정 완료!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 전화번호 unique 제약조건 추가 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 직접 실행
if (require.main === module) {
  addPhoneUniqueConstraint()
    .then(() => {
      console.log('🎉 전화번호 unique 제약조건 설정 작업 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 작업 실패:', error);
      process.exit(1);
    });
}

module.exports = { addPhoneUniqueConstraint };
