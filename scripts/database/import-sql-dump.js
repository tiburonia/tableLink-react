
const pool = require('../../shared/config/database');
const fs = require('fs');
const path = require('path');

/**
 * SQL 덤프 파일 적용 스크립트
 * 사용법: 
 * 1. SQL 파일을 backups/ 폴더에 저장
 * 2. node scripts/database/import-sql-dump.js [파일명]
 */

async function importSQLDump() {
  console.log('📂 SQL 덤프 파일 적용 시작');
  
  if (!filename) {
    console.error('❌ 사용법: node scripts/database/import-sql-dump.js [파일명]');
    process.exit(1);
  }

  const filePath = path.join(__dirname, '../../backups', filename);
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ 파일을 찾을 수 없습니다: ${filePath}`);
    process.exit(1);
  }

  const client = await pool.connect();

  try {
    // 1. 기존 데이터베이스 완전 초기화
    console.log('\n🗑️ 기존 데이터베이스 완전 초기화...');
    const { completeDatabaseReset } = require('./complete-database-reset');
    await completeDatabaseReset();

    // 2. SQL 파일 읽기
    console.log(`\n📖 SQL 파일 읽는 중: ${filename}`);
    const sqlContent = fs.readFileSync(filePath, 'utf8');

    // 3. SQL 실행
    console.log('\n⚡ SQL 덤프 적용 중...');
    await client.query('BEGIN');
    
    // SQL을 세미콜론으로 분할하여 개별 실행
    const sqlStatements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    for (let i = 0; i < sqlStatements.length; i++) {
      const statement = sqlStatements[i];
      try {
        await client.query(statement);
        if (i % 100 === 0) {
          console.log(`  📊 ${i + 1}/${sqlStatements.length} 문장 처리 중...`);
        }
      } catch (error) {
        console.warn(`⚠️ 문장 실행 실패 (${i + 1}): ${error.message}`);
      }
    }

    await client.query('COMMIT');
    
    console.log('\n✅ SQL 덤프 적용 완료!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ SQL 덤프 적용 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 스크립트 실행
if (require.main === module) {
  const filename = process.argv[2];
  importSQLDump(filename)
    .then(() => {
      console.log('\n🎉 SQL 덤프 적용 성공!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 SQL 덤프 적용 실패:', error);
      process.exit(1);
    });
}

module.exports = { importSQLDump };
