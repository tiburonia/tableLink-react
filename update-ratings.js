
const pool = require('./shared/config/database');

async function updateAllStoreRatings() {
  try {
    console.log('🔄 모든 매장의 별점 평균 업데이트 시작...');
    
    // 모든 매장 ID 조회
    const storesResult = await pool.query('SELECT id FROM stores ORDER BY id');
    
    for (const store of storesResult.rows) {
      const storeId = store.id;
      
      // 해당 매장의 모든 리뷰 별점 조회
      const ratingResult = await pool.query(`
        SELECT AVG(rating) as avg_rating, COUNT(*) as review_count 
        FROM reviews 
        WHERE store_id = $1
      `, [storeId]);
      
      const avgRating = ratingResult.rows[0].avg_rating;
      const reviewCount = parseInt(ratingResult.rows[0].review_count);
      
      // 별점 평균을 소수점 1자리로 반올림, 리뷰가 없으면 0
      const formattedRating = avgRating ? parseFloat(avgRating).toFixed(1) : 0;
      
      // stores 테이블 업데이트
      await pool.query(`
        UPDATE stores 
        SET rating_average = $1, review_count = $2 
        WHERE id = $3
      `, [formattedRating, reviewCount, storeId]);
      
      console.log(`✅ 매장 ${storeId} 별점 평균 업데이트: ${formattedRating}점 (${reviewCount}개 리뷰)`);
    }
    
    console.log('🎉 모든 매장의 별점 평균 업데이트 완료!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ 별점 평균 업데이트 실패:', error);
    process.exit(1);
  }
}

updateAllStoreRatings();
