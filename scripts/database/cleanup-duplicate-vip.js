
const pool = require('./shared/config/database');

async function cleanupDuplicateVip() {
  try {
    console.log('🔄 중복된 소문자 vip룸 테이블 삭제 시작...');

    // 소문자 "vip룸"으로 시작하는 테이블들 조회
    const duplicateVip = await pool.query(`
      SELECT id, table_name, unique_id 
      FROM store_tables 
      WHERE table_name LIKE 'vip룸%'
    `);

    console.log(`🔍 발견된 소문자 vip룸 테이블: ${duplicateVip.rows.length}개`);

    for (const table of duplicateVip.rows) {
      console.log(`🗑️ 삭제 중: ${table.table_name} (ID: ${table.id}, unique_id: ${table.unique_id})`);
      
      await pool.query(`
        DELETE FROM store_tables 
        WHERE id = $1
      `, [table.id]);
      
      console.log(`✅ ${table.table_name} 삭제 완료`);
    }

    console.log('🎉 소문자 vip룸 테이블 정리 완료!');
    process.exit(0);

  } catch (error) {
    console.error('❌ vip룸 정리 실패:', error);
    process.exit(1);
  }
}

cleanupDuplicateVip();
