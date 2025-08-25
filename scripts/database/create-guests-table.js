
const pool = require('../../shared/config/database');

async function createGuestsTable() {
  try {
    console.log('👥 guests 테이블 생성 중...');
    
    // guests 테이블 생성
    await pool.query(`
      CREATE TABLE IF NOT EXISTS guests (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(20) UNIQUE,
        name VARCHAR(100),
        visit_count INTEGER DEFAULT 1,
        last_order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        total_spent INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ guests 테이블 생성 완료');
    
    // 인덱스 추가 (검색 성능 향상)
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_guests_phone ON guests(phone);
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_guests_last_order_date ON guests(last_order_date);
    `);
    
    console.log('✅ guests 테이블 인덱스 생성 완료');
    
    // 샘플 게스트 데이터 삽입 (테스트용)
    const existingGuests = await pool.query('SELECT COUNT(*) FROM guests');
    
    if (parseInt(existingGuests.rows[0].count) === 0) {
      console.log('📝 샘플 게스트 데이터 생성 중...');
      
      const sampleGuests = [
        { phone: '010-1234-5678', name: '김게스트' },
        { phone: '010-9876-5432', name: '이방문객' },
        { phone: '010-5555-1111', name: '박고객' }
      ];
      
      for (const guest of sampleGuests) {
        await pool.query(`
          INSERT INTO guests (phone, name) VALUES ($1, $2)
        `, [guest.phone, guest.name]);
      }
      
      console.log('✅ 샘플 게스트 데이터 삽입 완료');
    }
    
    console.log('🎉 guests 테이블 설정 완료!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ guests 테이블 생성 실패:', error);
    process.exit(1);
  }
}

createGuestsTable();
