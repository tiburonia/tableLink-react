
const pool = require('../../shared/config/database');

async function createGuestsTable() {
  try {
    console.log('🗑️ 기존 guests 테이블 삭제 중...');
    
    // 기존 테이블 삭제 (외래키 제약조건도 함께 삭제됨)
    await pool.query(`DROP TABLE IF EXISTS guests CASCADE`);
    console.log('✅ 기존 guests 테이블 삭제 완료');
    
    console.log('👥 새로운 guests 테이블 생성 중...');
    
    // 새로운 guests 테이블 생성
    await pool.query(`
      CREATE TABLE guests (
        phone VARCHAR(20) PRIMARY KEY,
        visit_count JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ guests 테이블 생성 완료');
    
    // 인덱스 추가 (검색 성능 향상)
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_guests_visit_count ON guests USING GIN(visit_count);
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_guests_created_at ON guests(created_at);
    `);
    
    console.log('✅ guests 테이블 인덱스 생성 완료');
    
    // orders 테이블에 guest_phone 컬럼 추가 (기존 guest_id 대신)
    await pool.query(`
      ALTER TABLE orders 
      DROP CONSTRAINT IF EXISTS fk_orders_guest_id,
      DROP COLUMN IF EXISTS guest_id,
      ADD COLUMN IF NOT EXISTS guest_phone VARCHAR(20),
      ADD CONSTRAINT fk_orders_guest_phone 
      FOREIGN KEY (guest_phone) REFERENCES guests(phone) ON DELETE SET NULL
    `);
    
    console.log('✅ orders 테이블에 guest_phone 컬럼 추가 완료');
    
    // CHECK 제약조건 수정
    await pool.query(`
      ALTER TABLE orders 
      DROP CONSTRAINT IF EXISTS chk_orders_user_or_guest,
      ADD CONSTRAINT chk_orders_user_or_guest 
      CHECK (
        (user_id IS NOT NULL AND guest_phone IS NULL) OR 
        (user_id IS NULL AND guest_phone IS NOT NULL)
      )
    `);
    
    console.log('✅ orders 테이블 제약조건 수정 완료');
    
    // 샘플 게스트 데이터 삽입 (테스트용)
    const sampleGuests = [
      { 
        phone: '010-1234-5678', 
        visit_count: JSON.stringify({ "1": 3, "2": 1 }) // 매장 1에 3번, 매장 2에 1번 방문
      },
      { 
        phone: '010-9876-5432', 
        visit_count: JSON.stringify({ "1": 1 }) // 매장 1에 1번 방문
      },
      { 
        phone: '010-5555-1111', 
        visit_count: JSON.stringify({}) // 아직 방문하지 않음
      }
    ];
    
    console.log('📝 샘플 게스트 데이터 생성 중...');
    
    for (const guest of sampleGuests) {
      await pool.query(`
        INSERT INTO guests (phone, visit_count) VALUES ($1, $2)
      `, [guest.phone, guest.visit_count]);
    }
    
    console.log('✅ 샘플 게스트 데이터 삽입 완료');
    console.log('🎉 guests 테이블 설정 완료!');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ guests 테이블 생성 실패:', error);
    process.exit(1);
  }
}

createGuestsTable();
