
const pool = require('../../shared/config/database');

async function createFavoritesTable() {
  const client = await pool.connect();
  
  try {
    console.log('❤️ favorites 테이블 생성 및 데이터 마이그레이션 시작...');
    
    await client.query('BEGIN');
    
    // 1. favorites 테이블 생성
    console.log('📋 1단계: favorites 테이블 생성...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS favorites (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        store_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, store_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
      )
    `);
    
    // 인덱스 생성
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_favorites_store_id ON favorites(store_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON favorites(created_at)
    `);
    
    console.log('✅ favorites 테이블 및 인덱스 생성 완료');
    
    // 2. 기존 사용자 데이터 조회
    console.log('📖 2단계: 기존 즐겨찾기 데이터 조회...');
    const usersResult = await client.query(`
      SELECT id, favorite_stores FROM users 
      WHERE favorite_stores IS NOT NULL 
      AND favorite_stores != 'null'
      AND favorite_stores != '[]'
    `);
    
    console.log(`📊 즐겨찾기 데이터가 있는 사용자: ${usersResult.rows.length}명`);
    
    // 3. 기존 데이터를 favorites 테이블로 마이그레이션
    let totalMigrated = 0;
    let errorCount = 0;
    
    for (const user of usersResult.rows) {
      try {
        let favoriteStores = [];
        
        // JSON 파싱
        if (typeof user.favorite_stores === 'string') {
          favoriteStores = JSON.parse(user.favorite_stores);
        } else if (Array.isArray(user.favorite_stores)) {
          favoriteStores = user.favorite_stores;
        }
        
        if (!Array.isArray(favoriteStores) || favoriteStores.length === 0) {
          continue;
        }
        
        console.log(`👤 사용자 ${user.id}: ${favoriteStores.length}개 즐겨찾기 마이그레이션 중...`);
        
        // 각 즐겨찾기 매장에 대해
        for (const storeName of favoriteStores) {
          if (!storeName || typeof storeName !== 'string') {
            continue;
          }
          
          // 매장 이름으로 store_id 찾기
          const storeResult = await client.query(
            'SELECT id FROM stores WHERE name = $1 LIMIT 1',
            [storeName]
          );
          
          if (storeResult.rows.length === 0) {
            console.warn(`⚠️ 매장 "${storeName}"을 찾을 수 없음 (사용자: ${user.id})`);
            continue;
          }
          
          const storeId = storeResult.rows[0].id;
          
          // favorites 테이블에 삽입 (중복 시 무시)
          try {
            await client.query(`
              INSERT INTO favorites (user_id, store_id, created_at)
              VALUES ($1, $2, NOW() - INTERVAL '${Math.floor(Math.random() * 30)} days')
              ON CONFLICT (user_id, store_id) DO NOTHING
            `, [user.id, storeId]);
            
            totalMigrated++;
          } catch (insertError) {
            console.warn(`⚠️ 즐겨찾기 삽입 실패 - 사용자: ${user.id}, 매장: ${storeName}:`, insertError.message);
          }
        }
        
        console.log(`✅ 사용자 ${user.id} 마이그레이션 완료`);
        
      } catch (error) {
        console.error(`❌ 사용자 ${user.id} 마이그레이션 실패:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`📊 마이그레이션 완료: ${totalMigrated}개 즐겨찾기 이전 (${errorCount}개 에러)`);
    
    // 4. 검증 쿼리
    console.log('🔍 3단계: 데이터 검증...');
    
    const favoritesCount = await client.query('SELECT COUNT(*) as total FROM favorites');
    const uniqueUsers = await client.query('SELECT COUNT(DISTINCT user_id) as count FROM favorites');
    const uniqueStores = await client.query('SELECT COUNT(DISTINCT store_id) as count FROM favorites');
    
    console.log(`✅ 총 즐겨찾기 수: ${favoritesCount.rows[0].total}개`);
    console.log(`👥 즐겨찾기한 사용자 수: ${uniqueUsers.rows[0].count}명`);
    console.log(`🏪 즐겨찾기된 매장 수: ${uniqueStores.rows[0].count}개`);
    
    // 5. 매장별 즐겨찾기 횟수 TOP 10
    const topStores = await client.query(`
      SELECT 
        s.name as store_name,
        COUNT(f.store_id) as favorite_count
      FROM favorites f
      JOIN stores s ON f.store_id = s.id
      GROUP BY f.store_id, s.name
      ORDER BY favorite_count DESC
      LIMIT 10
    `);
    
    console.log('\n🏆 즐겨찾기 TOP 10 매장:');
    topStores.rows.forEach((store, index) => {
      console.log(`  ${index + 1}. ${store.store_name}: ${store.favorite_count}회`);
    });
    
    // 6. stores 테이블에 favorite_count 컬럼 추가 (선택적)
    console.log('\n📊 4단계: stores 테이블에 favorite_count 컬럼 추가...');
    
    try {
      await client.query(`
        ALTER TABLE stores 
        ADD COLUMN IF NOT EXISTS favorite_count INTEGER DEFAULT 0
      `);
      
      // 현재 즐겨찾기 수 업데이트
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
      
      console.log('✅ stores.favorite_count 컬럼 추가 및 데이터 업데이트 완료');
      
    } catch (error) {
      console.warn('⚠️ favorite_count 컬럼 추가 실패 (이미 존재할 수 있음):', error.message);
    }
    
    await client.query('COMMIT');
    
    console.log('\n🎉 favorites 테이블 마이그레이션 완료!');
    console.log('📝 다음 단계:');
    console.log('  1. auth.js의 즐겨찾기 API 수정');
    console.log('  2. 프론트엔드 코드 업데이트');
    console.log('  3. users.favorite_stores 컬럼 제거 (선택적)');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ favorites 테이블 생성 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 스크립트 실행
if (require.main === module) {
  createFavoritesTable()
    .then(() => {
      console.log('✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = { createFavoritesTable };
