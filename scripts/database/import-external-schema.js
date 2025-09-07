
const pool = require('../../shared/config/database');

/**
 * 외부 프로젝트 스키마 적용 스크립트
 * 사용법: node scripts/database/import-external-schema.js
 */

async function importExternalSchema() {
  console.log('🔄 외부 스키마 적용 시작');
  console.log('⚠️  이 작업은 되돌릴 수 없습니다. 기존 데이터가 모두 삭제됩니다.');

  const client = await pool.connect();

  try {
    // 1단계: 기존 데이터베이스 완전 초기화
    console.log('\n1️⃣ 기존 데이터베이스 완전 초기화...');
    const { completeDatabaseReset } = require('./complete-database-reset');
    await completeDatabaseReset();

    // 2단계: 여기에 외부 스키마 SQL을 붙여넣으세요
    console.log('\n2️⃣ 새로운 스키마 적용...');
    
    await client.query('BEGIN');

    // ========================================
    // 여기에 외부 프로젝트의 스키마 SQL을 붙여넣으세요
    // ========================================
    
    // 예시: CREATE TABLE 문들
    /*
    await client.query(`
      CREATE TABLE example_table (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    */

    // 예시: INSERT 문들 (기본 데이터가 있다면)
    /*
    await client.query(`
      INSERT INTO example_table (name) VALUES ('Sample Data')
    `);
    */

    await client.query('COMMIT');
    
    console.log('\n✅ 외부 스키마 적용 완료!');
    console.log('🔄 서버를 재시작하여 새로운 스키마를 적용하세요.');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ 스키마 적용 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 스크립트 실행
if (require.main === module) {
  importExternalSchema()
    .then(() => {
      console.log('\n🎉 외부 스키마 적용 성공!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 스키마 적용 실패:', error);
      process.exit(1);
    });
}

module.exports = { importExternalSchema };
