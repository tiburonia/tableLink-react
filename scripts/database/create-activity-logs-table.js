
const pool = require('../../shared/config/database');

async function createActivityLogsTable() {
  const client = await pool.connect();
  
  try {
    console.log('📊 활동 로그 테이블 생성 시작...');
    
    await client.query('BEGIN');
    
    // 활동 로그 테이블 생성
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_activity_logs (
        id SERIAL PRIMARY KEY,
        user_id TEXT,
        guest_phone TEXT,
        store_id INTEGER,
        activity_type TEXT NOT NULL,
        activity_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT chk_user_or_guest CHECK (
          (user_id IS NOT NULL AND guest_phone IS NULL) OR
          (user_id IS NULL AND guest_phone IS NOT NULL)
        ),
        CONSTRAINT chk_activity_type CHECK (activity_type IN (
          'ORDER_CREATED', 'PAYMENT_COMPLETED', 'REVIEW_CREATED',
          'FAVORITE_ADDED', 'FAVORITE_REMOVED', 'LEVEL_CHANGED'
        ))
      )
    `);
    
    // 인덱스 생성
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON user_activity_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_activity_logs_guest_phone ON user_activity_logs(guest_phone);
      CREATE INDEX IF NOT EXISTS idx_activity_logs_store_id ON user_activity_logs(store_id);
      CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON user_activity_logs(created_at);
    `);
    
    await client.query('COMMIT');
    console.log('✅ 활동 로그 테이블 생성 완료');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 활동 로그 테이블 생성 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  createActivityLogsTable()
    .then(() => {
      console.log('🎉 스크립트 실행 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = { createActivityLogsTable };
