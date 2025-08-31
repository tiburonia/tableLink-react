
const pool = require('../../shared/config/database');
const fs = require('fs').promises;
const path = require('path');

async function backupCurrentStructure() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 현재 DB 구조 전체 백업 시작...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupDir = path.join(__dirname, '../../backups');
    const backupFile = path.join(backupDir, `full-backup-${timestamp}.sql`);
    
    // 백업 디렉토리 생성
    await fs.mkdir(backupDir, { recursive: true });
    
    // 모든 테이블 백업
    const tables = [
      'users', 'stores', 'store_address', 'store_tables', 'favorites',
      'orders', 'order_items', 'paid_orders', 'user_paid_orders',
      'user_store_stats', 'guests', 'reviews', 'store_promotions'
    ];
    
    let fullBackup = `-- TableLink Database Full Backup
-- Generated: ${new Date().toISOString()}
-- Pre-migration backup

BEGIN;

`;
    
    for (const table of tables) {
      try {
        console.log(`💾 백업 중: ${table}`);
        
        // 테이블 생성문
        const createResult = await client.query(`
          SELECT 'CREATE TABLE ' || tablename || ' (' || 
          string_agg(column_name || ' ' || data_type || 
            CASE WHEN character_maximum_length IS NOT NULL 
                 THEN '(' || character_maximum_length || ')' 
                 ELSE '' END ||
            CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
            CASE WHEN column_default IS NOT NULL 
                 THEN ' DEFAULT ' || column_default 
                 ELSE '' END, ', ') || ');' as create_stmt
          FROM information_schema.columns 
          WHERE table_name = $1
          GROUP BY tablename
        `, [table]);
        
        if (createResult.rows.length > 0) {
          fullBackup += `-- Table: ${table}\n`;
          fullBackup += `DROP TABLE IF EXISTS ${table}_backup CASCADE;\n`;
          fullBackup += `CREATE TABLE ${table}_backup AS SELECT * FROM ${table};\n\n`;
        }
        
        // 데이터 개수 확인
        const countResult = await client.query(`SELECT COUNT(*) as total FROM ${table}`);
        console.log(`✅ ${table}: ${countResult.rows[0].total} rows`);
        
      } catch (error) {
        console.warn(`⚠️ ${table} 백업 실패:`, error.message);
      }
    }
    
    fullBackup += '\nCOMMIT;\n';
    
    await fs.writeFile(backupFile, fullBackup, 'utf8');
    
    const stats = await fs.stat(backupFile);
    console.log(`✅ 전체 백업 완료: ${backupFile}`);
    console.log(`📊 백업 파일 크기: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    
    return {
      success: true,
      backupFile: backupFile,
      size: stats.size,
      timestamp: timestamp
    };
    
  } catch (error) {
    console.error('❌ 백업 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  backupCurrentStructure()
    .then(result => {
      console.log('🎉 백업 성공:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 백업 실패:', error);
      process.exit(1);
    });
}

module.exports = { backupCurrentStructure };
