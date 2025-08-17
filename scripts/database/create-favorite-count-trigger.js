
const pool = require('../../shared/config/database');

async function createFavoriteCountTrigger() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 favorite_count 자동 업데이트 트리거 생성 시작...');
    
    await client.query('BEGIN');
    
    // 1. stores 테이블에 favorite_count 컬럼 추가 (없는 경우)
    console.log('📋 1단계: favorite_count 컬럼 확인 및 추가...');
    await client.query(`
      ALTER TABLE stores 
      ADD COLUMN IF NOT EXISTS favorite_count INTEGER DEFAULT 0
    `);
    
    // 2. 현재 즐겨찾기 수로 초기화
    console.log('🔄 2단계: 현재 즐겨찾기 수로 초기화...');
    await client.query(`
      UPDATE stores 
      SET favorite_count = COALESCE(fav_counts.count, 0)
      FROM (
        SELECT store_id, COUNT(*) as count 
        FROM favorites 
        GROUP BY store_id
      ) as fav_counts
      WHERE stores.id = fav_counts.store_id
    `);
    
    // 3. 트리거 함수 생성
    console.log('⚙️ 3단계: 트리거 함수 생성...');
    await client.query(`
      CREATE OR REPLACE FUNCTION update_store_favorite_count()
      RETURNS TRIGGER AS $$
      BEGIN
        -- INSERT 시 favorite_count 증가
        IF TG_OP = 'INSERT' THEN
          UPDATE stores 
          SET favorite_count = favorite_count + 1
          WHERE id = NEW.store_id;
          RETURN NEW;
        END IF;
        
        -- DELETE 시 favorite_count 감소
        IF TG_OP = 'DELETE' THEN
          UPDATE stores 
          SET favorite_count = GREATEST(favorite_count - 1, 0)
          WHERE id = OLD.store_id;
          RETURN OLD;
        END IF;
        
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    // 4. 기존 트리거 제거 (있는 경우)
    console.log('🗑️ 4단계: 기존 트리거 제거...');
    await client.query(`
      DROP TRIGGER IF EXISTS trigger_update_favorite_count ON favorites;
    `);
    
    // 5. 새 트리거 생성
    console.log('🎯 5단계: 새 트리거 생성...');
    await client.query(`
      CREATE TRIGGER trigger_update_favorite_count
        AFTER INSERT OR DELETE ON favorites
        FOR EACH ROW
        EXECUTE FUNCTION update_store_favorite_count();
    `);
    
    await client.query('COMMIT');
    
    // 6. 검증
    console.log('🔍 6단계: 트리거 작동 검증...');
    
    // 트리거 목록 확인
    const triggerCheck = await client.query(`
      SELECT trigger_name, event_manipulation, event_object_table
      FROM information_schema.triggers 
      WHERE trigger_name = 'trigger_update_favorite_count'
    `);
    
    if (triggerCheck.rows.length > 0) {
      console.log('✅ 트리거 생성 확인됨');
      triggerCheck.rows.forEach(trigger => {
        console.log(`   📍 ${trigger.trigger_name} - ${trigger.event_manipulation} on ${trigger.event_object_table}`);
      });
    }
    
    // favorite_count 현황 확인
    const countCheck = await client.query(`
      SELECT 
        COUNT(*) as total_stores,
        COUNT(CASE WHEN favorite_count > 0 THEN 1 END) as stores_with_favorites,
        MAX(favorite_count) as max_favorites
      FROM stores
    `);
    
    console.log(`📊 매장 통계:`);
    console.log(`   🏪 전체 매장: ${countCheck.rows[0].total_stores}개`);
    console.log(`   ❤️ 즐겨찾기가 있는 매장: ${countCheck.rows[0].stores_with_favorites}개`);
    console.log(`   🏆 최대 즐겨찾기 수: ${countCheck.rows[0].max_favorites}개`);
    
    console.log('\n🎉 favorite_count 자동 업데이트 트리거 생성 완료!');
    console.log('📝 이제 favorites 테이블의 INSERT/DELETE 시 stores.favorite_count가 자동으로 업데이트됩니다.');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 트리거 생성 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 스크립트 실행
if (require.main === module) {
  createFavoriteCountTrigger()
    .then(() => {
      console.log('✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = { createFavoriteCountTrigger };
