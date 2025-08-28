
const pool = require('../../shared/config/database');

async function createUserPaidOrdersTable() {
  const client = await pool.connect();
  
  try {
    console.log('📦 user_paid_orders 테이블 생성 및 TL회원 데이터 마이그레이션 시작...');
    
    await client.query('BEGIN');
    
    // 1. user_paid_orders 테이블 생성
    console.log('🆕 user_paid_orders 테이블 생성 중...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_paid_orders (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        table_number INTEGER,
        order_data JSONB NOT NULL,
        original_amount INTEGER NOT NULL,
        used_point INTEGER DEFAULT 0,
        coupon_discount INTEGER DEFAULT 0,
        final_amount INTEGER NOT NULL,
        payment_method VARCHAR(50) DEFAULT 'card',
        payment_status VARCHAR(20) DEFAULT 'completed',
        payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        order_source VARCHAR(20) DEFAULT 'TLL',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- 인덱스들
        CONSTRAINT chk_user_paid_orders_amounts CHECK (
          original_amount >= 0 AND 
          final_amount >= 0 AND 
          used_point >= 0 AND 
          coupon_discount >= 0
        ),
        CONSTRAINT chk_user_paid_orders_payment_status CHECK (
          payment_status IN ('pending', 'completed', 'failed', 'cancelled', 'refunded')
        ),
        CONSTRAINT chk_user_paid_orders_order_source CHECK (
          order_source IN ('TLL', 'POS', 'DELIVERY', 'PICKUP')
        )
      )
    `);
    
    console.log('✅ user_paid_orders 테이블 생성 완료');
    
    // 2. 인덱스 추가
    console.log('📊 user_paid_orders 인덱스 생성 중...');
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_paid_orders_user_id ON user_paid_orders(user_id);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_paid_orders_store_id ON user_paid_orders(store_id);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_paid_orders_payment_date ON user_paid_orders(payment_date);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_paid_orders_user_store ON user_paid_orders(user_id, store_id);
    `);
    
    console.log('✅ 인덱스 생성 완료');
    
    // 3. 트리거 생성 (updated_at 자동 업데이트)
    await client.query(`
      CREATE OR REPLACE FUNCTION update_user_paid_orders_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);
    
    await client.query(`
      DROP TRIGGER IF EXISTS update_user_paid_orders_updated_at_trigger ON user_paid_orders;
      CREATE TRIGGER update_user_paid_orders_updated_at_trigger
        BEFORE UPDATE ON user_paid_orders
        FOR EACH ROW
        EXECUTE FUNCTION update_user_paid_orders_updated_at();
    `);
    
    console.log('✅ 트리거 생성 완료');
    
    // 4. 기존 paid_orders에서 TL회원 데이터 마이그레이션
    console.log('🔄 기존 TL회원 결제 데이터 마이그레이션 시작...');
    
    const migrationResult = await client.query(`
      INSERT INTO user_paid_orders (
        user_id, store_id, table_number, order_data, original_amount,
        used_point, coupon_discount, final_amount, payment_method,
        payment_status, payment_date, order_source, created_at
      )
      SELECT 
        p.user_id, p.store_id, p.table_number, p.order_data, p.original_amount,
        p.used_point, p.coupon_discount, p.final_amount, p.payment_method,
        p.payment_status, p.payment_date, p.order_source, p.created_at
      FROM paid_orders p
      WHERE p.user_id IS NOT NULL 
      AND p.order_source = 'TLL'
      ON CONFLICT DO NOTHING
      RETURNING id
    `);
    
    console.log(`✅ TL회원 결제 데이터 ${migrationResult.rows.length}개 마이그레이션 완료`);
    
    // 5. 데이터 검증
    console.log('🔍 데이터 마이그레이션 검증 중...');
    
    const verificationQueries = [
      { 
        name: '총 user_paid_orders 수',
        query: 'SELECT COUNT(*) as count FROM user_paid_orders'
      },
      {
        name: 'TLL 주문 수',
        query: `SELECT COUNT(*) as count FROM user_paid_orders WHERE order_source = 'TLL'`
      },
      {
        name: '고유 사용자 수',
        query: 'SELECT COUNT(DISTINCT user_id) as count FROM user_paid_orders'
      },
      {
        name: '고유 매장 수',
        query: 'SELECT COUNT(DISTINCT store_id) as count FROM user_paid_orders'
      },
      {
        name: '총 결제 금액',
        query: 'SELECT SUM(final_amount) as total FROM user_paid_orders'
      }
    ];
    
    console.log('\n📊 마이그레이션 결과 통계:');
    for (const verification of verificationQueries) {
      const result = await client.query(verification.query);
      const value = result.rows[0].count || result.rows[0].total || 0;
      console.log(`   - ${verification.name}: ${parseInt(value).toLocaleString()}`);
    }
    
    // 6. 사용자별 통계
    const userStatsResult = await client.query(`
      SELECT 
        u.name,
        COUNT(upo.id) as order_count,
        SUM(upo.final_amount) as total_spent,
        MIN(upo.payment_date) as first_order,
        MAX(upo.payment_date) as last_order
      FROM user_paid_orders upo
      JOIN users u ON upo.user_id = u.id
      GROUP BY u.id, u.name
      ORDER BY total_spent DESC
      LIMIT 5
    `);
    
    console.log('\n👑 상위 5명 TL회원 결제 통계:');
    userStatsResult.rows.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name}: ${user.order_count}회 주문, ₩${parseInt(user.total_spent).toLocaleString()}`);
    });
    
    await client.query('COMMIT');
    
    console.log('\n🎉 user_paid_orders 테이블 생성 및 마이그레이션 완료!');
    console.log('📋 다음 단계:');
    console.log('   1. TL회원 신규 결제 시 user_paid_orders 테이블 사용');
    console.log('   2. 비회원→회원 전환 시 paid_orders → user_paid_orders 이전');
    console.log('   3. 기존 paid_orders는 비회원/POS 주문 전용으로 사용');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ user_paid_orders 테이블 생성 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 특정 사용자의 데이터를 user_paid_orders로 이전하는 함수
async function migrateUserToUserPaidOrders(userId) {
  const client = await pool.connect();
  
  try {
    console.log(`👤 사용자 ${userId}의 결제 데이터를 user_paid_orders로 이전 시작...`);
    
    await client.query('BEGIN');
    
    // 1. 해당 사용자가 존재하는지 확인
    const userCheck = await client.query('SELECT id, name FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      throw new Error(`사용자 ${userId}를 찾을 수 없습니다`);
    }
    
    const user = userCheck.rows[0];
    console.log(`📝 대상 사용자: ${user.name} (${user.id})`);
    
    // 2. paid_orders에서 해당 사용자 데이터 조회
    const userOrdersResult = await client.query(`
      SELECT * FROM paid_orders 
      WHERE user_id = $1 
      ORDER BY payment_date ASC
    `, [userId]);
    
    if (userOrdersResult.rows.length === 0) {
      console.log(`ℹ️ 사용자 ${userId}의 paid_orders 데이터가 없습니다`);
      return;
    }
    
    console.log(`📦 이전할 주문 수: ${userOrdersResult.rows.length}개`);
    
    // 3. user_paid_orders로 데이터 이전
    let migratedCount = 0;
    for (const order of userOrdersResult.rows) {
      try {
        await client.query(`
          INSERT INTO user_paid_orders (
            user_id, store_id, table_number, order_data, original_amount,
            used_point, coupon_discount, final_amount, payment_method,
            payment_status, payment_date, order_source, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT DO NOTHING
        `, [
          order.user_id, order.store_id, order.table_number, order.order_data,
          order.original_amount, order.used_point, order.coupon_discount,
          order.final_amount, order.payment_method, order.payment_status,
          order.payment_date, order.order_source, order.created_at
        ]);
        
        migratedCount++;
      } catch (insertError) {
        console.warn(`⚠️ 주문 ${order.id} 이전 실패:`, insertError.message);
      }
    }
    
    // 4. 기존 paid_orders에서 해당 사용자 데이터 삭제 (옵션)
    // 주의: 이 부분은 신중하게 결정해야 합니다
    /*
    await client.query('DELETE FROM paid_orders WHERE user_id = $1', [userId]);
    console.log(`🗑️ paid_orders에서 사용자 ${userId} 데이터 삭제 완료`);
    */
    
    await client.query('COMMIT');
    
    console.log(`✅ 사용자 ${user.name}의 결제 데이터 ${migratedCount}개 이전 완료`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`❌ 사용자 ${userId} 데이터 이전 실패:`, error);
    throw error;
  } finally {
    client.release();
  }
}

// 실행 부분
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length > 0 && args[0] === 'migrate-user') {
    const userId = args[1];
    if (!userId) {
      console.error('❌ 사용자 ID를 제공해주세요: npm run migrate-user <userId>');
      process.exit(1);
    }
    
    migrateUserToUserPaidOrders(userId)
      .then(() => {
        console.log('🎉 사용자 데이터 이전 완료');
        process.exit(0);
      })
      .catch(error => {
        console.error('❌ 실행 실패:', error);
        process.exit(1);
      });
  } else {
    createUserPaidOrdersTable()
      .then(() => {
        console.log('🎉 테이블 생성 및 마이그레이션 완료');
        process.exit(0);
      })
      .catch(error => {
        console.error('❌ 실행 실패:', error);
        process.exit(1);
      });
  }
}

module.exports = { createUserPaidOrdersTable, migrateUserToUserPaidOrders };
