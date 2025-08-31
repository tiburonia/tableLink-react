
const pool = require('../../shared/config/database');

async function add5DummyUsers() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('👤 5명의 더미 사용자 생성 시작...');
    
    const dummyUsers = [
      {
        id: 'testuser1',
        pw: '1234',
        name: '김테스트',
        phone: '010-1111-1111',
        email: 'test1@example.com',
        address: '서울특별시 강남구 역삼동',
        birth: '1990-01-01',
        gender: 'M',
        point: 5000
      },
      {
        id: 'testuser2',
        pw: '1234',
        name: '이테스트',
        phone: '010-2222-2222',
        email: 'test2@example.com',
        address: '서울특별시 서초구 서초동',
        birth: '1992-05-15',
        gender: 'F',
        point: 3000
      },
      {
        id: 'testuser3',
        pw: '1234',
        name: '박테스트',
        phone: '010-3333-3333',
        email: 'test3@example.com',
        address: '서울특별시 송파구 잠실동',
        birth: '1988-12-25',
        gender: 'M',
        point: 7500
      },
      {
        id: 'testuser4',
        pw: '1234',
        name: '최테스트',
        phone: '010-4444-4444',
        email: 'test4@example.com',
        address: '서울특별시 마포구 홍대입구',
        birth: '1995-07-08',
        gender: 'F',
        point: 2000
      },
      {
        id: 'testuser5',
        pw: '1234',
        name: '정테스트',
        phone: '010-5555-5555',
        email: 'test5@example.com',
        address: '서울특별시 용산구 이태원동',
        birth: '1993-03-20',
        gender: 'M',
        point: 10000
      }
    ];

    let createdCount = 0;
    let existingCount = 0;

    for (const user of dummyUsers) {
      try {
        // 사용자 생성
        await client.query(`
          INSERT INTO users (
            id, pw, name, phone, email, address, birth, gender, point,
            email_notifications, sms_notifications, push_notifications,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        `, [
          user.id, user.pw, user.name, user.phone, user.email, user.address,
          user.birth, user.gender, user.point,
          true, true, false, // 알림 설정
          new Date(), new Date()
        ]);

        console.log(`✅ 사용자 생성: ${user.name} (${user.id})`);
        createdCount++;

      } catch (error) {
        if (error.code === '23505') { // 중복 키 에러
          console.log(`ℹ️ 사용자 이미 존재: ${user.name} (${user.id})`);
          existingCount++;
        } else {
          console.error(`❌ 사용자 생성 실패: ${user.id}`, error.message);
        }
      }
    }

    // 일부 사용자들에게 즐겨찾기 추가 (매장이 있는 경우에만)
    console.log('\n⭐ 즐겨찾기 데이터 생성 중...');
    
    const storeCheck = await client.query('SELECT id FROM stores LIMIT 10');
    if (storeCheck.rows.length > 0) {
      const storeIds = storeCheck.rows.map(row => row.id);
      
      const favoriteData = [
        { userId: 'testuser1', storeIds: storeIds.slice(0, 3) },
        { userId: 'testuser2', storeIds: storeIds.slice(1, 4) },
        { userId: 'testuser3', storeIds: storeIds.slice(2, 6) },
        { userId: 'testuser4', storeIds: storeIds.slice(0, 2) },
        { userId: 'testuser5', storeIds: storeIds.slice(3, 7) }
      ];

      for (const fav of favoriteData) {
        for (const storeId of fav.storeIds) {
          try {
            await client.query(`
              INSERT INTO favorites (user_id, store_id, created_at)
              VALUES ($1, $2, $3)
              ON CONFLICT (user_id, store_id) DO NOTHING
            `, [fav.userId, storeId, new Date()]);
          } catch (error) {
            // 사용자가 존재하지 않는 경우 무시
          }
        }
      }
      console.log('✅ 즐겨찾기 데이터 생성 완료');
    }

    // 일부 사용자들에게 리뷰 데이터 추가
    console.log('\n📝 리뷰 데이터 생성 중...');
    
    if (storeCheck.rows.length > 0) {
      const reviews = [
        { userId: 'testuser1', storeId: storeCheck.rows[0].id, rating: 5, comment: '정말 맛있어요! 강력 추천합니다.' },
        { userId: 'testuser2', storeId: storeCheck.rows[1].id, rating: 4, comment: '음식이 깔끔하고 서비스도 좋아요.' },
        { userId: 'testuser3', storeId: storeCheck.rows[2].id, rating: 5, comment: '여기 단골될 것 같아요. 최고!' },
        { userId: 'testuser4', storeId: storeCheck.rows[0].id, rating: 3, comment: '무난한 맛이에요. 나쁘지 않습니다.' },
        { userId: 'testuser5', storeId: storeCheck.rows[3].id, rating: 4, comment: '친구들과 함께 와서 즐겁게 먹었어요.' }
      ];

      for (const review of reviews) {
        try {
          await client.query(`
            INSERT INTO reviews (store_id, user_id, rating, comment, created_at)
            VALUES ($1, $2, $3, $4, $5)
          `, [review.storeId, review.userId, review.rating, review.comment, new Date()]);
        } catch (error) {
          // 사용자가 존재하지 않는 경우 무시
        }
      }
      console.log('✅ 리뷰 데이터 생성 완료');
    }

    await client.query('COMMIT');

    console.log(`\n🎉 더미 사용자 생성 완료!`);
    console.log(`📊 결과: 신규 생성 ${createdCount}명, 기존 존재 ${existingCount}명`);

    // 생성된 사용자 목록 확인
    const userList = await client.query(`
      SELECT id, name, phone, email, point, created_at
      FROM users 
      WHERE id IN ('testuser1', 'testuser2', 'testuser3', 'testuser4', 'testuser5')
      ORDER BY id
    `);

    console.log('\n👥 생성된 사용자 목록:');
    userList.rows.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.name} (${user.id})`);
      console.log(`     📞 ${user.phone} | 💰 ${user.point}P | 📧 ${user.email}`);
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 더미 사용자 생성 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 실행
if (require.main === module) {
  add5DummyUsers()
    .then(() => {
      console.log('✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = add5DummyUsers;
