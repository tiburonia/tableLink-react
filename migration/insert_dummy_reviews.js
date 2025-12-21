require('dotenv').config();
const { Pool } = require('pg');

// 환경 변수에서 데이터베이스 URL 가져오기
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

// 연결 풀 생성
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
  max: 10,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
});

// 리뷰 내용 샘플
const reviewContents = [
  '음식이 정말 맛있었어요! 다음에 또 방문하고 싶습니다.',
  '분위기가 좋고 서비스도 친절했습니다.',
  '가격 대비 만족스러운 식사였습니다.',
  '메뉴가 다양하고 맛도 좋았어요.',
  '조용하고 깔끔한 인테리어가 마음에 들었습니다.',
  '친구들과 함께 가기 좋은 곳이에요.',
  '음식이 빨리 나와서 좋았습니다.',
  '재방문 의사 100%입니다!',
  '직원분들이 매우 친절하셨어요.',
  '가성비가 훌륭한 맛집입니다.',
  '특별한 날에 가기 좋은 레스토랑이에요.',
  '메뉴 추천이 정확했습니다.',
  '단골이 될 것 같아요!',
  '음식 양도 푸짐하고 맛있었습니다.',
  '깔끔한 맛이 인상적이었어요.',
  '조금 아쉬운 부분이 있었지만 전반적으로 괜찮았습니다.',
  '기대 이상이었어요! 강추합니다.',
  '웨이팅할 만한 가치가 있는 맛집입니다.',
  '특별 메뉴가 정말 맛있었어요.',
  '가족과 함께 가기 좋은 곳입니다.'
];

// 이미지 URL 샘플
const imageUrls = [
  'https://picsum.photos/400/300?random=1',
  'https://picsum.photos/400/300?random=2',
  'https://picsum.photos/400/300?random=3',
  'https://picsum.photos/400/300?random=4',
  'https://picsum.photos/400/300?random=5'
];

// 랜덤 정수 생성 함수
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 랜덤 날짜 생성 함수 (최근 90일 이내)
function randomDate() {
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * 90);
  const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  return date;
}

// 랜덤 배열 요소 선택
function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// 리뷰 더미 데이터 생성 함수
async function insertDummyReviews() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 리뷰 더미 데이터 생성 시작...');
    
    await client.query('BEGIN');
    
    let orderId = 10000;
    let totalReviews = 0;
    
    // store_id 2부터 501까지 반복
    for (let storeId = 2; storeId <= 501; storeId++) {
      // 각 매장당 0~5개의 리뷰를 랜덤하게 생성
      const reviewCount = randomInt(0, 5);
      
      for (let i = 0; i < reviewCount; i++) {
        const userId = randomInt(1, 10); // 1~10
        const rating = randomInt(1, 5); // 1~5
        const content = randomElement(reviewContents);
        const hasImage = Math.random() > 0.5; // 50% 확률
        const images = hasImage ? JSON.stringify([randomElement(imageUrls)]) : null;
        const createdAt = randomDate();
        const updatedAt = randomDate();
        
        // 리뷰 삽입
        await client.query(
          `INSERT INTO reviews (
            order_id, store_id, user_id, rating, content, 
            images, status, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            orderId,
            storeId,
            userId,
            rating,
            content,
            images,
            'VISIBLE',
            createdAt,
            updatedAt
          ]
        );
        
        orderId++;
        totalReviews++;
      }
      
      // 진행 상황 출력 (매 100개 매장마다)
      if (storeId % 100 === 0) {
        console.log(`📊 진행 중: ${storeId - 1}/500 매장 처리 완료`);
      }
    }
    
    await client.query('COMMIT');
    
    console.log('✅ 리뷰 더미 데이터 생성 완료!');
    console.log(`📝 총 ${totalReviews}개의 리뷰가 생성되었습니다.`);
    
    // 생성된 데이터 확인
    const stats = await client.query(`
      SELECT 
        COUNT(*) as total_reviews,
        COUNT(DISTINCT store_id) as stores_with_reviews,
        ROUND(AVG(rating)::NUMERIC, 2) as avg_rating,
        MIN(created_at) as oldest_review,
        MAX(created_at) as newest_review
      FROM reviews
      WHERE order_id >= 10000
    `);
    
    console.log('\n📊 생성된 리뷰 통계:');
    console.log(stats.rows[0]);
    
    // 각 매장별 리뷰 수 분포 확인
    const distribution = await client.query(`
      SELECT 
        review_count,
        COUNT(*) as store_count
      FROM (
        SELECT 
          store_id,
          COUNT(*) as review_count
        FROM reviews
        WHERE store_id BETWEEN 2 AND 501
        GROUP BY store_id
      ) as store_reviews
      GROUP BY review_count
      ORDER BY review_count
    `);
    
    console.log('\n📊 매장별 리뷰 수 분포:');
    distribution.rows.forEach(row => {
      console.log(`  리뷰 ${row.review_count}개: ${row.store_count}개 매장`);
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 오류 발생:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// 스크립트 실행
insertDummyReviews()
  .then(() => {
    console.log('\n✅ 스크립트 실행 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 스크립트 실행 실패:', error);
    process.exit(1);
  });
