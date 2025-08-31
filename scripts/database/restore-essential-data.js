
const pool = require('../../shared/config/database');

async function restoreEssentialData() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 필수 데이터 복구 시작...');
    
    await client.query('BEGIN');
    
    // 1. 기본 사용자 데이터 생성
    console.log('👤 1. 기본 사용자 데이터 생성...');
    
    await client.query(`
      INSERT INTO users (id, pw, name, phone, point, email_notifications, sms_notifications, push_notifications) VALUES
      ('user1', '1234', '김테스트', '010-1234-5678', 1000, true, true, false),
      ('user2', '1234', '이테스트', '010-9876-5432', 500, true, true, false),
      ('admin', 'admin123', '관리자', '010-0000-0000', 0, true, false, false)
      ON CONFLICT (id) DO NOTHING
    `);
    
    console.log('✅ 기본 사용자 3명 생성 완료');
    
    // 2. 매장 데이터 생성
    console.log('🏪 2. 매장 데이터 생성...');
    
    await client.query(`
      INSERT INTO stores (id, name, category, description, rating_average, review_count, favorite_count, is_open) VALUES
      (1, '치킨천국', '치킨', '맛있는 치킨 전문점', 4.5, 15, 3, true),
      (2, '피자월드', '양식', '신선한 피자 맛집', 4.2, 8, 2, true),
      (3, '한식당', '한식', '전통 한식 요리', 4.7, 20, 5, true),
      (4, '중국집', '중식', '정통 중국 요리', 4.1, 12, 1, true),
      (5, '일식집', '일식', '신선한 일본 요리', 4.6, 18, 4, true),
      (6, '카페베네', '카페', '아늑한 분위기의 카페', 4.0, 25, 7, true),
      (7, '버거킹', '패스트푸드', '맛있는 햄버거', 3.8, 30, 2, true),
      (8, '분식집', '분식', '떡볶이 맛집', 4.3, 22, 6, true)
      ON CONFLICT (id) DO NOTHING
    `);
    
    console.log('✅ 기본 매장 8개 생성 완료');
    
    // 3. 매장 주소 정보 생성
    console.log('📍 3. 매장 주소 정보 생성...');
    
    await client.query(`
      INSERT INTO store_address (store_id, address_full, sido, sigungu, eupmyeondong, latitude, longitude) VALUES
      (1, '서울특별시 강남구 역삼동 123-45', '서울특별시', '강남구', '역삼동', 37.5665, 126.9780),
      (2, '서울특별시 강남구 삼성동 67-89', '서울특별시', '강남구', '삼성동', 37.5145, 127.0559),
      (3, '서울특별시 종로구 종로1가 10-20', '서울특별시', '종로구', '종로1가', 37.5701, 126.9826),
      (4, '서울특별시 마포구 홍대입구역 30-40', '서울특별시', '마포구', '서교동', 37.5563, 126.9236),
      (5, '서울특별시 송파구 잠실동 50-60', '서울특별시', '송파구', '잠실동', 37.5144, 127.1028),
      (6, '서울특별시 강서구 김포공항 70-80', '서울특별시', '강서구', '공항동', 37.5587, 126.7941),
      (7, '서울특별시 영등포구 여의도동 90-100', '서울특별시', '영등포구', '여의도동', 37.5219, 126.9245),
      (8, '서울특별시 성북구 성신여대입구 110-120', '서울특별시', '성북구', '성신동', 37.5921, 127.0168)
      ON CONFLICT (store_id) DO NOTHING
    `);
    
    console.log('✅ 매장 주소 정보 8개 생성 완료');
    
    // 4. 매장 테이블 정보 생성
    console.log('🪑 4. 매장 테이블 정보 생성...');
    
    const tableInserts = [];
    for (let storeId = 1; storeId <= 8; storeId++) {
      const tableCount = storeId <= 3 ? 8 : storeId <= 6 ? 6 : 4; // 매장별 테이블 수
      for (let tableNum = 1; tableNum <= tableCount; tableNum++) {
        tableInserts.push(`(${storeId}, ${tableNum})`);
      }
    }
    
    await client.query(`
      INSERT INTO store_tables (store_id, table_number) VALUES
      ${tableInserts.join(', ')}
      ON CONFLICT (store_id, table_number) DO NOTHING
    `);
    
    console.log(`✅ 매장 테이블 ${tableInserts.length}개 생성 완료`);
    
    // 5. 즐겨찾기 데이터 생성
    console.log('⭐ 5. 즐겨찾기 데이터 생성...');
    
    await client.query(`
      INSERT INTO favorites (user_id, store_id) VALUES
      ('user1', 1),
      ('user1', 3),
      ('user1', 5),
      ('user2', 2),
      ('user2', 4)
      ON CONFLICT (user_id, store_id) DO NOTHING
    `);
    
    console.log('✅ 즐겨찾기 데이터 5개 생성 완료');
    
    // 6. 기본 리뷰 데이터 생성
    console.log('📝 6. 기본 리뷰 데이터 생성...');
    
    await client.query(`
      INSERT INTO reviews (store_id, user_id, rating, comment) VALUES
      (1, 'user1', 5, '치킨이 정말 맛있어요! 바삭바삭하고 양념이 일품입니다.'),
      (1, 'user2', 4, '맛은 좋은데 조금 매워요. 그래도 추천합니다.'),
      (2, 'user1', 4, '피자 도우가 쫄깃하고 토핑이 풍부해요.'),
      (3, 'user2', 5, '정통 한식 맛집이네요. 집밥 같은 따뜻한 맛!'),
      (4, 'user1', 4, '짜장면이 진짜 맛있어요. 짬뽕도 좋습니다.'),
      (5, 'user2', 5, '회가 신선하고 사시미가 두툼해요. 강추!'),
      (6, 'user1', 4, '커피 맛이 좋고 분위기도 아늑해요.'),
      (8, 'user2', 4, '떡볶이가 맵지 않고 달콤해서 좋아요.')
      ON CONFLICT DO NOTHING
    `);
    
    console.log('✅ 기본 리뷰 8개 생성 완료');
    
    // 7. 게스트 데이터 생성
    console.log('👥 7. 게스트 데이터 생성...');
    
    await client.query(`
      INSERT INTO guests (phone, name, visit_count) VALUES
      ('010-1111-1111', '김게스트', 3),
      ('010-2222-2222', '이게스트', 1),
      ('010-3333-3333', '박게스트', 2)
      ON CONFLICT (phone) DO NOTHING
    `);
    
    console.log('✅ 게스트 데이터 3개 생성 완료');
    
    // 8. 시퀀스 재설정
    console.log('🔄 8. 시퀀스 재설정...');
    
    await client.query(`SELECT setval('stores_id_seq', 8, true)`);
    await client.query(`SELECT setval('store_address_id_seq', 8, true)`);
    await client.query(`SELECT setval('store_tables_id_seq', (SELECT MAX(id) FROM store_tables), true)`);
    await client.query(`SELECT setval('favorites_id_seq', (SELECT MAX(id) FROM favorites), true)`);
    await client.query(`SELECT setval('reviews_id_seq', (SELECT MAX(id) FROM reviews), true)`);
    await client.query(`SELECT setval('guests_id_seq', (SELECT MAX(id) FROM guests), true)`);
    
    console.log('✅ 시퀀스 재설정 완료');
    
    await client.query('COMMIT');
    
    // 9. 최종 확인
    console.log('🔍 9. 데이터 생성 결과 확인...');
    
    const results = await Promise.all([
      client.query('SELECT COUNT(*) as count FROM users'),
      client.query('SELECT COUNT(*) as count FROM stores'),
      client.query('SELECT COUNT(*) as count FROM store_address'),
      client.query('SELECT COUNT(*) as count FROM store_tables'),
      client.query('SELECT COUNT(*) as count FROM favorites'),
      client.query('SELECT COUNT(*) as count FROM reviews'),
      client.query('SELECT COUNT(*) as count FROM guests')
    ]);
    
    console.log('\n📊 최종 데이터 현황:');
    console.log(`✅ users: ${results[0].rows[0].count}개`);
    console.log(`✅ stores: ${results[1].rows[0].count}개`);
    console.log(`✅ store_address: ${results[2].rows[0].count}개`);
    console.log(`✅ store_tables: ${results[3].rows[0].count}개`);
    console.log(`✅ favorites: ${results[4].rows[0].count}개`);
    console.log(`✅ reviews: ${results[5].rows[0].count}개`);
    console.log(`✅ guests: ${results[6].rows[0].count}개`);
    
    console.log('\n🎉 필수 데이터 복구 완료!');
    console.log('🔄 이제 서버를 재시작하여 정상 작동을 확인하세요.');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 필수 데이터 복구 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 스크립트 실행
if (require.main === module) {
  restoreEssentialData()
    .then(() => {
      console.log('\n✅ 필수 데이터 복구 성공!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ 필수 데이터 복구 실패:', error);
      process.exit(1);
    });
}

module.exports = { restoreEssentialData };
