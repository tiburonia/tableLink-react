
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

/**
 * store_feeds 테이블 더미 데이터 생성
 * - 모든 매장에 대해 피드 10개씩 생성
 * - 다양한 타입: 스토리, 프로모션, 공지
 */

// 피드 타입별 템플릿
const feedTemplates = {
  story: [
    { title: '오늘의 특별 메뉴', content: '신선한 재료로 준비한 오늘의 추천 메뉴를 소개합니다! 😋', tags: ['일상', '메뉴소개'] },
    { title: '매장 내부 리뉴얼', content: '고객님들께 더 나은 환경을 제공하기 위해 인테리어를 새롭게 단장했습니다 ✨', tags: ['공지', '리뉴얼'] },
    { title: '셰프의 한마디', content: '항상 최고의 맛을 위해 노력하고 있습니다. 많은 사랑 부탁드립니다! 👨‍🍳', tags: ['일상', '셰프'] },
    { title: '신메뉴 출시', content: '고객님들의 요청으로 새로운 메뉴가 출시되었습니다. 많은 관심 부탁드립니다!', tags: ['메뉴', '신상'] },
    { title: '매장 풍경', content: '따뜻한 조명 아래 편안한 분위기에서 맛있는 식사 즐기세요 🌟', tags: ['일상', '분위기'] },
  ],
  promotion: [
    { title: '단골 고객 특별 할인', content: '단골 회원님들께 10% 특별 할인 혜택을 드립니다! 이번 주말까지! 🎁', tags: ['이벤트', '할인'] },
    { title: '1+1 이벤트', content: '인기 메뉴 1+1 이벤트 진행중! 서둘러 주문하세요!', tags: ['이벤트', '1+1'] },
    { title: '오픈 기념 이벤트', content: '새로운 매장 오픈을 기념하여 전 메뉴 20% 할인!', tags: ['이벤트', '오픈'] },
    { title: '생일 축하 이벤트', content: '생일인 고객님께 무료 디저트를 제공해드립니다! 🎂', tags: ['이벤트', '생일'] },
    { title: '단체 예약 할인', content: '10인 이상 단체 예약 시 15% 할인 혜택!', tags: ['이벤트', '단체'] },
  ],
  notice: [
    { title: '영업시간 변경 안내', content: '12월 15일(일)은 매장 정기 휴무일입니다. 이용에 참고 부탁드립니다 🙏', tags: ['공지', '휴무'] },
    { title: '주차 안내', content: '매장 이용 시 2시간 무료 주차 가능합니다. 주차권은 카운터에서 받아가세요!', tags: ['공지', '주차'] },
    { title: '예약 필수 안내', content: '주말에는 예약 고객 우선으로 운영됩니다. 사전 예약 부탁드립니다.', tags: ['공지', '예약'] },
    { title: '배달 서비스 시작', content: '이제 배달 주문도 가능합니다! 앱에서 주문하세요 🛵', tags: ['공지', '배달'] },
    { title: '위생 관리 안내', content: '매일 철저한 방역과 소독으로 안전한 환경을 유지하고 있습니다.', tags: ['공지', '위생'] },
  ]
};

// 이미지 URL 풀
const imageUrls = [
  '/TableLink.png',
  '/TableLink2.png',
  'https://via.placeholder.com/400x300/FFB800/FFF?text=Store+Feed',
  'https://via.placeholder.com/400x300/4ECDC4/FFF?text=Promotion',
  'https://via.placeholder.com/400x300/FF6B6B/FFF?text=Notice',
];

// 랜덤 선택 함수
function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// 랜덤 숫자 범위
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 랜덤 날짜 생성 (최근 30일 이내)
function randomRecentDate() {
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * 30);
  const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  return date;
}

async function createStoreFeedsDummy() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('📰 store_feeds 더미 데이터 생성 시작...');

    // 모든 매장 조회
    const storesResult = await client.query('SELECT id FROM stores ORDER BY id');
    const stores = storesResult.rows;

    console.log(`📊 총 ${stores.length}개 매장에 대해 각각 10개씩 피드 생성 중...`);

    let totalInserted = 0;

    for (const store of stores) {
      const storeId = store.id;

      // 매장당 10개의 피드 생성
      for (let i = 0; i < 10; i++) {
        // 피드 타입 랜덤 선택 (스토리 50%, 프로모션 30%, 공지 20%)
        const typeRandom = Math.random();
        let feedType;
        if (typeRandom < 0.5) {
          feedType = 'story';
        } else if (typeRandom < 0.8) {
          feedType = 'promotion';
        } else {
          feedType = 'notice';
        }

        // 템플릿에서 랜덤 선택
        const template = randomChoice(feedTemplates[feedType]);

        // 이미지 포함 여부 (70% 확률)
        const hasImage = Math.random() < 0.7;
        const imageUrlsArray = hasImage ? [randomChoice(imageUrls)] : [];

        // visibility 설정 (95% PUBLIC, 5% MEMBER_ONLY)
        const visibility = Math.random() < 0.95 ? 'PUBLIC' : 'MEMBER_ONLY';

        // 좋아요, 댓글, 조회수 랜덤 생성
        const likeCount = randomInt(0, 200);
        const commentCount = randomInt(0, 50);
        const viewCount = randomInt(likeCount, likeCount * 5 + 100);

        // 생성 날짜
        const createdAt = randomRecentDate();
        const updatedAt = createdAt;

        await client.query(`
          INSERT INTO store_feeds (
            store_id, title, content, image_urls, tags, 
            promotion_id, visibility, like_count, comment_count, 
            view_count, created_at, updated_at, is_active
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        `, [
          storeId,
          template.title,
          template.content,
          imageUrlsArray,
          template.tags,
          null, // promotion_id는 null로 설정
          visibility,
          likeCount,
          commentCount,
          viewCount,
          createdAt,
          updatedAt,
          true
        ]);

        totalInserted++;
      }

      if (storeId % 10 === 0) {
        console.log(`⏳ 진행 중... ${storeId}/${stores.length} 매장 완료 (${totalInserted}개 피드 생성)`);
      }
    }

    await client.query('COMMIT');
    console.log(`✅ store_feeds 더미 데이터 ${totalInserted}개 생성 완료!`);

    // 결과 확인
    const summary = await client.query(`
      SELECT 
        COUNT(*) as total_feeds,
        COUNT(DISTINCT store_id) as stores_with_feeds,
        SUM(CASE WHEN array_length(image_urls, 1) > 0 THEN 1 ELSE 0 END) as feeds_with_images,
        AVG(like_count)::INTEGER as avg_likes,
        AVG(view_count)::INTEGER as avg_views
      FROM store_feeds
    `);

    console.log('📊 생성된 데이터 요약:');
    console.log(`   - 총 피드 수: ${summary.rows[0].total_feeds}`);
    console.log(`   - 피드가 있는 매장: ${summary.rows[0].stores_with_feeds}`);
    console.log(`   - 이미지 포함 피드: ${summary.rows[0].feeds_with_images}`);
    console.log(`   - 평균 좋아요: ${summary.rows[0].avg_likes}`);
    console.log(`   - 평균 조회수: ${summary.rows[0].avg_views}`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ store_feeds 더미 데이터 생성 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 스크립트 실행
createStoreFeedsDummy()
  .then(() => {
    console.log('✅ 스크립트 실행 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 스크립트 실행 실패:', error);
    process.exit(1);
  });
