const pool = require('../../shared/config/database');

async function createCompleteDummyData() {
  const client = await pool.connect();

  try {
    console.log('🏗️ 완전한 더미데이터 생성 시작...');
    console.log('📋 참조 관계를 고려한 순차적 데이터 생성');

    await client.query('BEGIN');

    // 1️⃣ 기본 사용자 5명 생성
    console.log('\n👤 1. 사용자 더미데이터 생성...');
    const users = [
      { id: 'testuser1', pw: '1234', name: '김테스트', phone: '010-1111-1111', email: 'test1@example.com' },
      { id: 'testuser2', pw: '1234', name: '이테스트', phone: '010-2222-2222', email: 'test2@example.com' },
      { id: 'testuser3', pw: '1234', name: '박테스트', phone: '010-3333-3333', email: 'test3@example.com' },
      { id: 'testuser4', pw: '1234', name: '최테스트', phone: '010-4444-4444', email: 'test4@example.com' },
      { id: 'testuser5', pw: '1234', name: '정테스트', phone: '010-5555-5555', email: 'test5@example.com' }
    ];

    for (const user of users) {
      try {
        await client.query(`
          INSERT INTO users (
            id, pw, name, phone, email, point,
            email_notifications, sms_notifications, push_notifications,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (id) DO NOTHING
        `, [
          user.id, user.pw, user.name, user.phone, user.email, 
          Math.floor(Math.random() * 10000) + 1000, // 1000-11000 포인트
          true, true, false,
          new Date(), new Date()
        ]);
        console.log(`✅ 사용자 생성: ${user.name} (${user.id})`);
      } catch (error) {
        console.log(`ℹ️ 사용자 이미 존재: ${user.id}`);
      }
    }

    // 2️⃣ 서울 매장 20개 생성 (기존 100개 대신 관리 가능한 수)
    console.log('\n🏪 2. 매장 더미데이터 생성...');

    const categories = ['한식', '중식', '일식', '양식', '카페', '치킨', '분식'];
    const seoulAreas = ['강남구', '서초구', '송파구', '마포구', '용산구'];

    const maxIdResult = await client.query('SELECT COALESCE(MAX(id), 0) as max_id FROM stores');
    let storeId = parseInt(maxIdResult.rows[0].max_id) + 1;

    const createdStoreIds = [];

    for (let i = 0; i < 20; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const area = seoulAreas[Math.floor(Math.random() * seoulAreas.length)];
      const storeName = `${category} 전문점 ${area}${i + 1}호점`;

      // 매장 생성
      await client.query(`
        INSERT INTO stores (
          id, name, category, phone, is_open, 
          rating_average, review_count, favorite_count,
          menu, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        storeId, storeName, category, `02-${1000 + i}-${1000 + i}`, true,
        (3.5 + Math.random() * 1.5).toFixed(1), // 3.5-5.0 평점
        Math.floor(Math.random() * 50), // 0-50 리뷰수
        Math.floor(Math.random() * 20), // 0-20 즐겨찾기
        JSON.stringify([
          { name: `${category}1`, price: 8000 + Math.floor(Math.random() * 7000), description: `맛있는 ${category}1입니다.` },
          { name: `${category}2`, price: 10000 + Math.floor(Math.random() * 10000), description: `특별한 ${category}2입니다.` },
          { name: `${category}3`, price: 12000 + Math.floor(Math.random() * 8000), description: `인기있는 ${category}3입니다.` }
        ]),
        new Date(), new Date()
      ]);

      // 매장 주소 생성
      const lat = 37.5 + Math.random() * 0.1;
      const lng = 126.9 + Math.random() * 0.1;

      await client.query(`
        INSERT INTO store_address (
          store_id, address_full, sido, sigungu, dong,
          latitude, longitude, coord
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        storeId, `서울특별시 ${area} 테스트동 ${i + 1}번지`,
        '서울특별시', area, '테스트동',
        lat, lng, JSON.stringify({ lat, lng })
      ]);

      // 매장 테이블 3-6개 생성
      const tableCount = Math.floor(Math.random() * 4) + 3;
      for (let tableNum = 1; tableNum <= tableCount; tableNum++) {
        await client.query(`
          INSERT INTO store_tables (
            store_id, table_number, table_name, seats, is_occupied
          ) VALUES ($1, $2, $3, $4, $5)
        `, [storeId, tableNum, `테이블 ${tableNum}`, [2, 4, 6][Math.floor(Math.random() * 3)], false]);
      }

      createdStoreIds.push(storeId);
      console.log(`✅ 매장 생성: ${storeName} (ID: ${storeId})`);
      storeId++;
    }

    // 3️⃣ 즐겨찾기 데이터 생성
    console.log('\n⭐ 3. 즐겨찾기 데이터 생성...');

    for (const user of users) {
      const favoriteCount = Math.floor(Math.random() * 5) + 2; // 2-6개
      const shuffledStores = [...createdStoreIds].sort(() => Math.random() - 0.5).slice(0, favoriteCount);

      for (const storeId of shuffledStores) {
        try {
          await client.query(`
            INSERT INTO favorites (user_id, store_id, created_at)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id, store_id) DO NOTHING
          `, [user.id, storeId, new Date()]);
        } catch (error) {
          // 중복 무시
        }
      }
      console.log(`✅ ${user.name} 즐겨찾기 ${favoriteCount}개 생성`);
    }

    // 4️⃣ 리뷰 데이터 생성
    console.log('\n📝 4. 리뷰 데이터 생성...');

    const reviewTexts = [
      '정말 맛있어요! 강력 추천합니다.',
      '음식이 깔끔하고 서비스도 좋아요.',
      '가격대비 훌륭합니다.',
      '분위기도 좋고 맛도 좋아요.',
      '무난한 맛이에요. 나쁘지 않습니다.',
      '여기 단골될 것 같아요!',
      '친구들과 함께 와서 즐겁게 먹었어요.',
      '배달도 빨라요. 포장 상태도 깔끔했어요.'
    ];

    for (const user of users) {
      const reviewCount = Math.floor(Math.random() * 4) + 1; // 1-4개
      const reviewStores = [...createdStoreIds].sort(() => Math.random() - 0.5).slice(0, reviewCount);

      for (const storeId of reviewStores) {
        const rating = Math.floor(Math.random() * 3) + 3; // 3-5점
        const comment = reviewTexts[Math.floor(Math.random() * reviewTexts.length)];

        try {
          await client.query(`
            INSERT INTO reviews (
              store_id, user_id, rating, comment, created_at
            ) VALUES ($1, $2, $3, $4, $5)
          `, [storeId, user.id, rating, comment, new Date()]);
        } catch (error) {
          // 중복 무시
        }
      }
      console.log(`✅ ${user.name} 리뷰 ${reviewCount}개 생성`);
    }

    // 5️⃣ 단골 통계 데이터 생성
    console.log('\n📊 5. 단골 통계 데이터 생성...');

    for (const user of users) {
      const statsCount = Math.floor(Math.random() * 6) + 3; // 3-8개 매장
      const statsStores = [...createdStoreIds].sort(() => Math.random() - 0.5).slice(0, statsCount);

      for (const storeId of statsStores) {
        const visitCount = Math.floor(Math.random() * 15) + 5; // 5-20회 방문
        const totalSpent = visitCount * (8000 + Math.floor(Math.random() * 12000)); // 방문당 8-20k
        const points = Math.floor(totalSpent * 0.01); // 1% 포인트

        try {
          await client.query(`
            INSERT INTO user_store_stats (
              user_id, store_id, points, total_spent, visit_count,
              level, next_level_threshold, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (user_id, store_id) DO NOTHING
          `, [
            user.id, storeId, points, totalSpent, visitCount,
            visitCount >= 15 ? 'VIP' : visitCount >= 10 ? 'GOLD' : visitCount >= 5 ? 'SILVER' : 'BRONZE',
            visitCount >= 15 ? 50000 : visitCount >= 10 ? 30000 : visitCount >= 5 ? 15000 : 10000,
            new Date(), new Date()
          ]);
        } catch (error) {
          // 중복 무시
        }
      }
      console.log(`✅ ${user.name} 단골 통계 ${statsCount}개 매장 생성`);
    }

    // 6️⃣ 체크(주문) 데이터 생성
    console.log('\n🛒 6. 체크/주문 데이터 생성...');

    for (const user of users) {
      const checkCount = Math.floor(Math.random() * 5) + 2; // 2-6개 주문

      for (let i = 0; i < checkCount; i++) {
        const storeId = createdStoreIds[Math.floor(Math.random() * createdStoreIds.length)];
        const tableId = Math.floor(Math.random() * 5) + 1; // 1-5번 테이블
        const totalAmount = Math.floor(Math.random() * 50000) + 10000; // 10-60k

        try {
          const checkResult = await client.query(`
            INSERT INTO checks (
              store_id, user_id, table_id, total_amount, final_amount,
              status, payment_method, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id
          `, [
            storeId, user.id, tableId, totalAmount, totalAmount,
            'closed', 'card', new Date(), new Date()
          ]);

          const checkId = checkResult.rows[0].id;

          // 주문 아이템 2-4개 생성
          const itemCount = Math.floor(Math.random() * 3) + 2;
          for (let j = 0; j < itemCount; j++) {
            const itemPrice = Math.floor(Math.random() * 15000) + 5000;
            const quantity = Math.floor(Math.random() * 3) + 1;

            await client.query(`
              INSERT INTO orders (
                check_id, item_name, quantity, unit_price, 
                total_price, status, created_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
              checkId, `메뉴아이템${j + 1}`, quantity, itemPrice,
              itemPrice * quantity, 'completed', new Date()
            ]);
          }

        } catch (error) {
          console.error(`❌ 주문 생성 실패: ${user.id}`, error.message);
        }
      }
      console.log(`✅ ${user.name} 주문 ${checkCount}개 생성`);
    }

    // 7️⃣ 게스트 데이터 생성
    console.log('\n👥 7. 게스트 데이터 생성...');

    const guests = [
      { phone: '010-7777-7777', name: '김게스트' },
      { phone: '010-8888-8888', name: '이게스트' },
      { phone: '010-9999-9999', name: '박게스트' }
    ];

    for (const guest of guests) {
      try {
        await client.query(`
          INSERT INTO guests (phone, name, visit_count, created_at)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (phone) DO NOTHING
        `, [guest.phone, guest.name, Math.floor(Math.random() * 5) + 1, new Date()]);

        // 게스트 주문 1-2개 생성
        const guestOrderCount = Math.floor(Math.random() * 2) + 1;
        for (let i = 0; i < guestOrderCount; i++) {
          const storeId = createdStoreIds[Math.floor(Math.random() * createdStoreIds.length)];
          const tableId = Math.floor(Math.random() * 5) + 1;
          const totalAmount = Math.floor(Math.random() * 30000) + 8000;

          await client.query(`
            INSERT INTO checks (
              store_id, guest_phone, table_id, total_amount, final_amount,
              status, payment_method, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          `, [
            storeId, guest.phone, tableId, totalAmount, totalAmount,
            'closed', 'cash', new Date(), new Date()
          ]);
        }
        console.log(`✅ 게스트 생성: ${guest.name} (${guest.phone})`);
      } catch (error) {
        console.log(`ℹ️ 게스트 이미 존재: ${guest.phone}`);
      }
    }

    // 8️⃣ 정규 레벨 혜택 데이터 생성
    console.log('\n🎁 8. 정규 레벨 혜택 데이터 생성...');

    for (const storeId of createdStoreIds) {
      try {
        await client.query(`
          INSERT INTO regular_levels (
            store_id, bronze_threshold, bronze_benefit, bronze_description,
            silver_threshold, silver_benefit, silver_description,
            gold_threshold, gold_benefit, gold_description,
            vip_threshold, vip_benefit, vip_description,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
          ON CONFLICT (store_id) DO NOTHING
        `, [
          storeId,
          10000, 3, '3% 할인', // BRONZE
          30000, 5, '5% 할인 + 음료 서비스', // SILVER  
          100000, 10, '10% 할인 + 디저트 서비스', // GOLD
          300000, 15, '15% 할인 + VIP 라운지 이용', // VIP
          new Date(), new Date()
        ]);
      } catch (error) {
        // 중복 무시
      }
    }
    console.log(`✅ ${createdStoreIds.length}개 매장 정규 레벨 혜택 생성`);

    await client.query('COMMIT');

    // 📊 최종 결과 확인
    console.log('\n📊 더미데이터 생성 완료 - 최종 통계:');

    const finalStats = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as user_count,
        (SELECT COUNT(*) FROM stores) as store_count,
        (SELECT COUNT(*) FROM favorites) as favorite_count,
        (SELECT COUNT(*) FROM reviews) as review_count,
        (SELECT COUNT(*) FROM checks) as check_count,
        (SELECT COUNT(*) FROM orders) as order_count,
        (SELECT COUNT(*) FROM guests) as guest_count,
        (SELECT COUNT(*) FROM user_store_stats) as stats_count,
        (SELECT COUNT(*) FROM regular_levels) as level_count
    `);

    const stats = finalStats.rows[0];
    console.log(`👤 사용자: ${stats.user_count}명`);
    console.log(`🏪 매장: ${stats.store_count}개`);
    console.log(`⭐ 즐겨찾기: ${stats.favorite_count}개`);
    console.log(`📝 리뷰: ${stats.review_count}개`);
    console.log(`🛒 체크: ${stats.check_count}개`);
    console.log(`📦 주문: ${stats.order_count}개`);
    console.log(`👥 게스트: ${stats.guest_count}명`);
    console.log(`📊 단골 통계: ${stats.stats_count}개`);
    console.log(`🎁 정규 레벨: ${stats.level_count}개`);

    console.log('\n🎉 모든 참조 관계를 포함한 완전한 더미데이터 생성 완료!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 더미데이터 생성 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 실행
if (require.main === module) {
  createCompleteDummyData()
    .then(() => {
      console.log('✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = createCompleteDummyData;