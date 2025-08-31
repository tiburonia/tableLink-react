
const pool = require('../../shared/config/database');

async function clearOrderPaymentData() {
  const client = await pool.connect();
  
  try {
    console.log('🗑️ 주문, 결제 관련 테이블 데이터 삭제 시작...');
    
    await client.query('BEGIN');
    
    // 1. order_items 테이블 데이터 삭제
    console.log('🧹 order_items 테이블 데이터 삭제 중...');
    const orderItemsResult = await client.query('DELETE FROM order_items RETURNING id');
    console.log(`✅ order_items 테이블 ${orderItemsResult.rowCount}개 레코드 삭제 완료`);
    
    // 2. orders 테이블 데이터 삭제
    console.log('🧹 orders 테이블 데이터 삭제 중...');
    const ordersResult = await client.query('DELETE FROM orders RETURNING id');
    console.log(`✅ orders 테이블 ${ordersResult.rowCount}개 레코드 삭제 완료`);
    
    // 3. user_paid_orders 테이블 데이터 삭제
    console.log('🧹 user_paid_orders 테이블 데이터 삭제 중...');
    const userPaidOrdersResult = await client.query('DELETE FROM user_paid_orders RETURNING id');
    console.log(`✅ user_paid_orders 테이블 ${userPaidOrdersResult.rowCount}개 레코드 삭제 완료`);
    
    // 4. paid_orders 테이블 데이터 삭제
    console.log('🧹 paid_orders 테이블 데이터 삭제 중...');
    const paidOrdersResult = await client.query('DELETE FROM paid_orders RETURNING id');
    console.log(`✅ paid_orders 테이블 ${paidOrdersResult.rowCount}개 레코드 삭제 완료`);
    
    // 5. partial_payments 테이블 데이터 삭제 (존재하는 경우)
    try {
      console.log('🧹 partial_payments 테이블 데이터 삭제 중...');
      const partialPaymentsResult = await client.query('DELETE FROM partial_payments RETURNING id');
      console.log(`✅ partial_payments 테이블 ${partialPaymentsResult.rowCount}개 레코드 삭제 완료`);
    } catch (error) {
      if (error.code === '42P01') {
        console.log('ℹ️ partial_payments 테이블이 존재하지 않습니다 (건너뜀)');
      } else {
        throw error;
      }
    }
    
    // 6. guests 테이블에서 방문 기록 초기화
    console.log('🧹 guests 테이블 방문 기록 초기화 중...');
    const guestsResult = await client.query('UPDATE guests SET visit_count = \'{}\' RETURNING phone');
    console.log(`✅ guests 테이블 ${guestsResult.rowCount}개 레코드 방문 기록 초기화 완료`);
    
    // 7. user_store_stats 테이블에서 주문 관련 통계 초기화
    console.log('🧹 user_store_stats 테이블 주문 통계 초기화 중...');
    const userStoreStatsResult = await client.query(`
      UPDATE user_store_stats 
      SET points = 0, total_spent = 0, visit_count = 0, updated_at = CURRENT_TIMESTAMP 
      RETURNING user_id, store_id
    `);
    console.log(`✅ user_store_stats 테이블 ${userStoreStatsResult.rowCount}개 레코드 통계 초기화 완료`);
    
    // 8. 테이블 점유 상태 초기화
    console.log('🧹 store_tables 점유 상태 초기화 중...');
    const tablesResult = await client.query(`
      UPDATE store_tables 
      SET is_occupied = false, occupied_since = NULL, auto_release_source = NULL 
      WHERE is_occupied = true
      RETURNING store_id, table_number
    `);
    console.log(`✅ store_tables 테이블 ${tablesResult.rowCount}개 테이블 점유 상태 초기화 완료`);
    
    // 9. 시퀀스 초기화
    console.log('🔄 시퀀스 초기화 중...');
    
    const sequences = [
      'orders_id_seq',
      'order_items_id_seq', 
      'paid_orders_id_seq',
      'user_paid_orders_id_seq'
    ];
    
    for (const seq of sequences) {
      try {
        await client.query(`ALTER SEQUENCE ${seq} RESTART WITH 1`);
        console.log(`✅ ${seq} 시퀀스 초기화 완료`);
      } catch (error) {
        if (error.code === '42P01') {
          console.log(`ℹ️ ${seq} 시퀀스가 존재하지 않습니다 (건너뜀)`);
        } else {
          console.warn(`⚠️ ${seq} 시퀀스 초기화 실패:`, error.message);
        }
      }
    }
    
    await client.query('COMMIT');
    
    // 10. 최종 확인
    console.log('\n📊 데이터 삭제 후 테이블 상태 확인:');
    
    const finalStats = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM orders) as orders_count,
        (SELECT COUNT(*) FROM order_items) as order_items_count,
        (SELECT COUNT(*) FROM paid_orders) as paid_orders_count,
        (SELECT COUNT(*) FROM user_paid_orders) as user_paid_orders_count,
        (SELECT COUNT(*) FROM guests WHERE visit_count != '{}') as guests_with_visits,
        (SELECT COUNT(*) FROM user_store_stats WHERE total_spent > 0) as stats_with_spent,
        (SELECT COUNT(*) FROM store_tables WHERE is_occupied = true) as occupied_tables
    `);
    
    const stats = finalStats.rows[0];
    console.log(`📋 최종 상태:`);
    console.log(`  - orders: ${stats.orders_count}개`);
    console.log(`  - order_items: ${stats.order_items_count}개`);
    console.log(`  - paid_orders: ${stats.paid_orders_count}개`);
    console.log(`  - user_paid_orders: ${stats.user_paid_orders_count}개`);
    console.log(`  - 방문 기록이 있는 게스트: ${stats.guests_with_visits}개`);
    console.log(`  - 소비 기록이 있는 사용자 통계: ${stats.stats_with_spent}개`);
    console.log(`  - 점유된 테이블: ${stats.occupied_tables}개`);
    
    console.log('\n🎉 주문, 결제 관련 데이터 삭제 완료!');
    console.log('✨ 모든 테이블이 초기 상태로 복원되었습니다.');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 데이터 삭제 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 메인 실행 함수
async function main() {
  try {
    await clearOrderPaymentData();
    console.log('✅ 스크립트 실행 완료');
    process.exit(0);
  } catch (error) {
    console.error('❌ 스크립트 실행 실패:', error);
    process.exit(1);
  }
}

// 스크립트 직접 실행 시
if (require.main === module) {
  main();
}

module.exports = { clearOrderPaymentData };
