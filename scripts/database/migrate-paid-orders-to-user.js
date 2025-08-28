
const pool = require('../../shared/config/database');

async function migratePaidOrdersToUser() {
  const client = await pool.connect();
  
  try {
    console.log('📞 paid_orders 전화번호 기반 회원 데이터 마이그레이션 시작...');
    
    await client.query('BEGIN');
    
    // 1. paid_orders에 있는 고유한 전화번호들 조회 (guest_phone이 있는 것만)
    const phoneNumbersResult = await client.query(`
      SELECT DISTINCT guest_phone, 
             COUNT(*) as order_count,
             SUM(final_amount) as total_spent,
             MIN(payment_date) as first_order_date,
             MAX(payment_date) as last_order_date
      FROM paid_orders 
      WHERE guest_phone IS NOT NULL 
      AND guest_phone != ''
      AND user_id IS NULL
      GROUP BY guest_phone
      ORDER BY order_count DESC
    `);
    
    console.log(`📋 마이그레이션 대상 전화번호: ${phoneNumbersResult.rows.length}개`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const phoneData of phoneNumbersResult.rows) {
      const { guest_phone, order_count, total_spent, first_order_date, last_order_date } = phoneData;
      
      console.log(`\n🔄 전화번호 ${guest_phone} 처리 중... (주문 ${order_count}회, 총 ₩${total_spent.toLocaleString()})`);
      
      try {
        // 2. 해당 전화번호로 이미 가입된 회원이 있는지 확인
        const existingUserResult = await client.query(
          'SELECT id, name FROM users WHERE phone = $1',
          [guest_phone]
        );
        
        if (existingUserResult.rows.length > 0) {
          const userId = existingUserResult.rows[0].id;
          const userName = existingUserResult.rows[0].name;
          
          console.log(`👤 기존 회원 발견: ${userName} (${userId})`);
          
          // 3. paid_orders의 guest_phone을 해당 user_id로 변경
          const updateResult = await client.query(`
            UPDATE paid_orders 
            SET user_id = $1, guest_phone = NULL
            WHERE guest_phone = $2 AND user_id IS NULL
            RETURNING id, store_id, final_amount
          `, [userId, guest_phone]);
          
          console.log(`📦 ${updateResult.rows.length}개 주문을 회원 ${userId}에게 이전`);
          
          // 4. orders 테이블 업데이트는 제거 (orders 테이블에는 guest_phone 컬럼이 없음)
          console.log(`📋 orders 테이블 업데이트 스킵 (guest_phone 컬럼 없음)`);
          
          // 5. user_store_stats 테이블에 매장별 통계 정보 생성/업데이트
          if (updateResult.rows.length > 0) {
            try {
              console.log(`📊 매장별 통계 정보 생성 중...`);
              
              const statsData = {};
              for (const order of updateResult.rows) {
                const storeId = order.store_id;
                if (!statsData[storeId]) {
                  statsData[storeId] = {
                    totalSpent: 0,
                    visitCount: 0,
                    points: 0
                  };
                }
                statsData[storeId].totalSpent += order.final_amount;
                statsData[storeId].visitCount += 1;
                statsData[storeId].points += Math.floor(order.final_amount * 0.1); // 10% 포인트 적립
              }
              
              // 각 매장별 통계 정보 삽입/업데이트
              for (const [storeId, stats] of Object.entries(statsData)) {
                await client.query(`
                  INSERT INTO user_store_stats (user_id, store_id, points, total_spent, visit_count, updated_at)
                  VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
                  ON CONFLICT (user_id, store_id) 
                  DO UPDATE SET 
                    points = user_store_stats.points + $3,
                    total_spent = user_store_stats.total_spent + $4,
                    visit_count = user_store_stats.visit_count + $5,
                    updated_at = CURRENT_TIMESTAMP
                `, [userId, parseInt(storeId), stats.points, stats.totalSpent, stats.visitCount]);
              }
              
              console.log(`✅ ${Object.keys(statsData).length}개 매장 통계 정보 생성/업데이트 완료`);
            } catch (statsError) {
              console.warn(`⚠️ 매장별 통계 생성 실패: ${statsError.message}`);
            }
          }
          
          // 6. guests 테이블에서 해당 전화번호 삭제
          const guestDeleteResult = await client.query(
            'DELETE FROM guests WHERE phone = $1 RETURNING phone',
            [guest_phone]
          );
          
          if (guestDeleteResult.rows.length > 0) {
            console.log(`🗑️ 게스트 데이터 정리 완료: ${guest_phone}`);
          }
          
          migratedCount++;
          
          console.log(`✅ 전화번호 ${guest_phone} 마이그레이션 완료 - 회원 ${userId}에게 통합`);
          
        } else {
          console.log(`❌ 전화번호 ${guest_phone}에 해당하는 가입된 회원 없음 - 스킵`);
          skippedCount++;
        }
        
      } catch (phoneError) {
        console.error(`❌ 전화번호 ${guest_phone} 처리 실패:`, phoneError.message);
        skippedCount++;
      }
    }
    
    await client.query('COMMIT');
    
    console.log('\n🎉 paid_orders 마이그레이션 완료!');
    console.log(`✅ 성공적으로 마이그레이션된 전화번호: ${migratedCount}개`);
    console.log(`⏭️ 스킵된 전화번호 (미가입): ${skippedCount}개`);
    console.log(`📊 총 처리된 전화번호: ${phoneNumbersResult.rows.length}개`);
    
    // 마이그레이션 후 통계 확인
    const finalStatsResult = await client.query(`
      SELECT 
        COUNT(*) as total_paid_orders,
        COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as member_orders,
        COUNT(CASE WHEN guest_phone IS NOT NULL THEN 1 END) as guest_orders
      FROM paid_orders
    `);
    
    const finalStats = finalStatsResult.rows[0];
    console.log('\n📊 마이그레이션 후 paid_orders 통계:');
    console.log(`   - 전체 주문: ${finalStats.total_paid_orders}개`);
    console.log(`   - 회원 주문: ${finalStats.member_orders}개`);
    console.log(`   - 게스트 주문: ${finalStats.guest_orders}개`);
    console.log(`   - 회원 비율: ${((finalStats.member_orders / finalStats.total_paid_orders) * 100).toFixed(1)}%`);
    
    process.exit(0);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ paid_orders 마이그레이션 실패:', error);
    process.exit(1);
  } finally {
    client.release();
  }
}

// 특정 전화번호만 마이그레이션하는 함수
async function migrateSinglePhoneNumber(phoneNumber) {
  const client = await pool.connect();
  
  try {
    console.log(`📞 단일 전화번호 ${phoneNumber} 마이그레이션 시작...`);
    
    await client.query('BEGIN');
    
    // 해당 전화번호의 주문 데이터 조회
    const phoneOrdersResult = await client.query(`
      SELECT COUNT(*) as order_count,
             SUM(final_amount) as total_spent
      FROM paid_orders 
      WHERE guest_phone = $1 AND user_id IS NULL
    `, [phoneNumber]);
    
    const phoneData = phoneOrdersResult.rows[0];
    
    if (parseInt(phoneData.order_count) === 0) {
      console.log(`❌ 전화번호 ${phoneNumber}에 해당하는 게스트 주문이 없습니다.`);
      return;
    }
    
    console.log(`📋 발견된 주문: ${phoneData.order_count}개 (총 ₩${phoneData.total_spent.toLocaleString()})`);
    
    // 해당 전화번호로 가입된 회원 확인
    const userResult = await client.query(
      'SELECT id, name FROM users WHERE phone = $1',
      [phoneNumber]
    );
    
    if (userResult.rows.length === 0) {
      console.log(`❌ 전화번호 ${phoneNumber}로 가입된 회원이 없습니다.`);
      console.log(`💡 먼저 해당 전화번호로 회원가입을 진행해주세요.`);
      return;
    }
    
    const user = userResult.rows[0];
    console.log(`👤 대상 회원: ${user.name} (${user.id})`);
    
    // paid_orders 마이그레이션
    const updateResult = await client.query(`
      UPDATE paid_orders 
      SET user_id = $1, guest_phone = NULL
      WHERE guest_phone = $2 AND user_id IS NULL
      RETURNING id, store_id, final_amount
    `, [user.id, phoneNumber]);
    
    console.log(`📦 ${updateResult.rows.length}개 결제 내역을 회원 ${user.id}에게 이전`);
    
    // orders 테이블 마이그레이션은 제거 (orders 테이블에는 guest_phone 컬럼이 없음)
    console.log(`📋 orders 테이블 업데이트 스킵 (guest_phone 컬럼 없음)`);
    
    // 매장별 통계 생성
    if (updateResult.rows.length > 0) {
      const statsData = {};
      for (const order of updateResult.rows) {
        const storeId = order.store_id;
        if (!statsData[storeId]) {
          statsData[storeId] = { totalSpent: 0, visitCount: 0, points: 0 };
        }
        statsData[storeId].totalSpent += order.final_amount;
        statsData[storeId].visitCount += 1;
        statsData[storeId].points += Math.floor(order.final_amount * 0.1);
      }
      
      for (const [storeId, stats] of Object.entries(statsData)) {
        await client.query(`
          INSERT INTO user_store_stats (user_id, store_id, points, total_spent, visit_count, updated_at)
          VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
          ON CONFLICT (user_id, store_id) 
          DO UPDATE SET 
            points = user_store_stats.points + $3,
            total_spent = user_store_stats.total_spent + $4,
            visit_count = user_store_stats.visit_count + $5,
            updated_at = CURRENT_TIMESTAMP
        `, [user.id, parseInt(storeId), stats.points, stats.totalSpent, stats.visitCount]);
      }
      
      console.log(`✅ ${Object.keys(statsData).length}개 매장 통계 정보 생성 완료`);
    }
    
    // 게스트 데이터 정리
    await client.query('DELETE FROM guests WHERE phone = $1', [phoneNumber]);
    
    await client.query('COMMIT');
    
    console.log(`🎉 전화번호 ${phoneNumber} 마이그레이션 완료!`);
    console.log(`✅ 회원 ${user.name} (${user.id})에게 모든 주문 데이터가 통합되었습니다.`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`❌ 전화번호 ${phoneNumber} 마이그레이션 실패:`, error);
  } finally {
    client.release();
  }
}

// 명령행 인자 처리
const args = process.argv.slice(2);
if (args.length > 0) {
  const phoneNumber = args[0];
  console.log(`📞 특정 전화번호 마이그레이션 모드: ${phoneNumber}`);
  migrateSinglePhoneNumber(phoneNumber);
} else {
  console.log('📞 전체 전화번호 마이그레이션 모드');
  migratePaidOrdersToUser();
}
