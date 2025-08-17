
const pool = require('../../shared/config/database');

// 더미 사용자 목록
const dummyUsers = [
  { id: '12', name: '테스트사용자' },
  { id: 'user001', name: '배고픈곰' },
  { id: 'user002', name: '익명1' },
  { id: 'user003', name: '이현수' },
  { id: 'user004', name: '푸드파이터' },
  { id: 'user005', name: '미식광' },
  { id: 'user006', name: '매운맛사랑' },
  { id: 'user007', name: '맛집탐험가' },
  { id: 'user008', name: '치킨러버' },
  { id: 'user009', name: '분식마니아' },
  { id: 'user010', name: '카페인중독' },
  { id: 'user011', name: '라면킬러' },
  { id: 'user012', name: '디저트천사' },
  { id: 'user013', name: '술꾼친구' },
  { id: 'user014', name: '건강식단' },
  { id: 'user015', name: '야식왕' }
];

// 더미 리뷰 템플릿
const reviewTemplates = [
  { rating: 5, text: "음식이 정말 맛있고 서비스도 친절해요! 재방문 의사 100%입니다." },
  { rating: 4, text: "깔끔하고 맛있어요. 다만 조금 짜긴 하지만 전체적으로 만족스럽습니다." },
  { rating: 5, text: "항상 맛있게 먹고 있어요. 사장님도 친절하시고 음식도 빨리 나와요." },
  { rating: 3, text: "보통이에요. 나쁘지 않지만 특별히 좋지도 않네요." },
  { rating: 4, text: "가격대비 괜찮은 것 같아요. 양도 충분하고 맛도 좋습니다." },
  { rating: 5, text: "정말 맛있어요! 친구들과 함께 와서 즐겁게 먹었습니다." },
  { rating: 4, text: "배달도 빨라요. 포장 상태도 깔끔했어요." },
  { rating: 3, text: "다음에 또 올게요. 분위기가 좋네요." },
  { rating: 5, text: "음식 나오는 속도도 빠르고 맛도 좋습니다!" },
  { rating: 4, text: "추천합니다! 가족과 함께 먹기 좋아요." },
  { rating: 2, text: "가격도 괜찮고 맛도 좋지만 양이 조금 적어요." },
  { rating: 5, text: "친절하고 빠름! 단골 될 것 같아요." },
  { rating: 4, text: "깨끗하고 위생적이에요. 안심하고 먹을 수 있습니다." },
  { rating: 3, text: "무난한 맛이에요. 기대했던 것보다는 평범했네요." },
  { rating: 5, text: "최고의 맛! 여기만큼 맛있는 곳은 처음이에요." },
  { rating: 4, text: "직원분들이 매우 친절하시고 음식도 맛있어요." },
  { rating: 2, text: "음식은 괜찮은데 서비스가 아쉬워요." },
  { rating: 5, text: "완벽해요! 다음에도 꼭 올 거예요." },
  { rating: 3, text: "평균적인 맛이에요. 나쁘지 않습니다." },
  { rating: 4, text: "포장 주문했는데 빠르게 나와서 좋았어요." },
  { rating: 5, text: "여기 진짜 맛집이네요! 강력 추천합니다." },
  { rating: 4, text: "재료가 신선하고 맛있어요. 또 올게요." },
  { rating: 3, text: "그럭저럭 먹을만해요. 특별함은 없지만 나쁘지 않네요." },
  { rating: 5, text: "사장님이 정말 친절하시고 음식도 최고예요!" },
  { rating: 4, text: "분위기도 좋고 맛도 좋아요. 데이트 장소로 추천!" }
];

// 랜덤 날짜 생성 (최근 3개월 내)
function getRandomDate() {
  const now = new Date();
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(now.getMonth() - 3);
  
  const randomTime = threeMonthsAgo.getTime() + Math.random() * (now.getTime() - threeMonthsAgo.getTime());
  return new Date(randomTime).toLocaleString('ko-KR');
}

// 모든 매장에 랜덤 리뷰 생성
async function generateRandomReviewsForAllStores() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 모든 매장에 랜덤 리뷰 생성 시작...');

    // 트랜잭션 시작
    await client.query('BEGIN');

    // 더미 사용자들 먼저 생성/확인
    console.log('👥 더미 사용자 생성/확인 중...');
    for (const user of dummyUsers) {
      const existingUser = await client.query('SELECT COUNT(*) FROM users WHERE id = $1', [user.id]);
      
      if (parseInt(existingUser.rows[0].count) === 0) {
        await client.query(`
          INSERT INTO users (id, pw, name, phone, point, order_list, coupons, favorite_stores)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          user.id,
          '1234',
          user.name,
          `010-${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
          Math.floor(Math.random() * 10000),
          JSON.stringify([]),
          JSON.stringify({ unused: [], used: [] }),
          JSON.stringify([])
        ]);
        console.log(`  ✅ 사용자 ${user.id} (${user.name}) 생성 완료`);
      }
    }

    // 모든 매장 조회
    const storesResult = await client.query('SELECT id, name, category FROM stores ORDER BY id');
    const stores = storesResult.rows;
    
    console.log(`📊 총 ${stores.length}개 매장에 리뷰 생성 예정`);

    let totalReviewsCreated = 0;
    let processedStores = 0;

    // 각 매장에 대해 리뷰 생성
    for (const store of stores) {
      try {
        // 8~11개 랜덤 리뷰 수 결정
        const reviewCount = Math.floor(Math.random() * 4) + 8; // 8~11개
        const storeReviews = [];
        let orderIndex = 0;

        console.log(`🏪 매장 ${store.id} (${store.name}) - ${reviewCount}개 리뷰 생성 중...`);

        // 리뷰 생성
        for (let i = 0; i < reviewCount; i++) {
          const randomReview = reviewTemplates[Math.floor(Math.random() * reviewTemplates.length)];
          const randomUser = dummyUsers[Math.floor(Math.random() * dummyUsers.length)];
          const orderDate = getRandomDate();

          // 리뷰 삽입
          const reviewResult = await client.query(`
            INSERT INTO reviews (user_id, store_id, order_index, rating, review_text, order_date, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW() - INTERVAL '${Math.floor(Math.random() * 90)} days')
            RETURNING id
          `, [
            randomUser.id,
            store.id,
            orderIndex++,
            randomReview.rating,
            randomReview.text,
            orderDate
          ]);

          storeReviews.push({
            id: reviewResult.rows[0].id,
            rating: randomReview.rating,
            text: randomReview.text,
            user: randomUser.name
          });
        }

        // 매장의 평균 별점 계산
        const ratingSum = storeReviews.reduce((sum, review) => sum + review.rating, 0);
        const avgRating = (ratingSum / reviewCount).toFixed(1);

        // stores 테이블의 rating_average와 review_count 업데이트
        await client.query(`
          UPDATE stores 
          SET rating_average = $1, review_count = $2 
          WHERE id = $3
        `, [avgRating, reviewCount, store.id]);

        totalReviewsCreated += reviewCount;
        processedStores++;

        console.log(`  ✅ 매장 ${store.id} 완료: ${reviewCount}개 리뷰, 평균 ${avgRating}점`);

        // 진행률 표시 (100개마다)
        if (processedStores % 100 === 0) {
          console.log(`📊 진행률: ${processedStores}/${stores.length} (${Math.round(processedStores/stores.length*100)}%)`);
        }

      } catch (storeError) {
        console.error(`❌ 매장 ${store.id} 리뷰 생성 실패:`, storeError.message);
      }
    }

    // 트랜잭션 커밋
    await client.query('COMMIT');

    console.log('\n🎉 모든 매장 리뷰 생성 완료!');
    console.log(`📊 처리된 매장: ${processedStores}개`);
    console.log(`📝 생성된 총 리뷰: ${totalReviewsCreated}개`);

    // 최종 검증
    const verificationResult = await client.query(`
      SELECT 
        COUNT(*) as total_stores,
        COUNT(CASE WHEN review_count > 0 THEN 1 END) as stores_with_reviews,
        COUNT(CASE WHEN review_count = 0 OR review_count IS NULL THEN 1 END) as stores_without_reviews,
        SUM(review_count) as total_reviews
      FROM stores
    `);

    const stats = verificationResult.rows[0];
    console.log('\n📈 최종 통계:');
    console.log(`  📊 전체 매장: ${stats.total_stores}개`);
    console.log(`  ⭐ 리뷰가 있는 매장: ${stats.stores_with_reviews}개`);
    console.log(`  📭 리뷰가 없는 매장: ${stats.stores_without_reviews}개`);
    console.log(`  📝 전체 리뷰 수: ${stats.total_reviews}개`);

    if (parseInt(stats.stores_without_reviews) === 0) {
      console.log('🎊 모든 매장에 리뷰가 성공적으로 생성되었습니다!');
    }

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 리뷰 생성 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 스크립트 실행
if (require.main === module) {
  generateRandomReviewsForAllStores()
    .then(() => {
      console.log('✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = { generateRandomReviewsForAllStores };
