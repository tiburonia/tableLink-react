
const pool = require('../../shared/config/database');

async function fixPaidOrdersJSONBParsing() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 paid_orders JSONB 파싱 및 reviews 테이블 스키마 수정 시작...');
    
    await client.query('BEGIN');
    
    // 1. reviews 테이블에 paid_order_id 컬럼 추가 (없다면)
    console.log('📝 reviews 테이블 스키마 확인 및 수정...');
    
    const reviewsColumnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'reviews' AND column_name = 'paid_order_id'
    `);
    
    if (reviewsColumnCheck.rows.length === 0) {
      await client.query(`
        ALTER TABLE reviews 
        ADD COLUMN paid_order_id INTEGER REFERENCES paid_orders(id) ON DELETE CASCADE
      `);
      console.log('✅ reviews 테이블에 paid_order_id 컬럼 추가 완료');
    } else {
      console.log('✅ reviews 테이블에 paid_order_id 컬럼이 이미 존재');
    }
    
    // 2. paid_orders 테이블의 order_data JSONB 구조 표준화
    console.log('📊 paid_orders 테이블 order_data 구조 분석 중...');
    
    const sampleOrdersResult = await client.query(`
      SELECT id, order_data, user_id, guest_phone
      FROM paid_orders 
      WHERE order_data IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    console.log(`📋 분석 대상 paid_orders: ${sampleOrdersResult.rows.length}개`);
    
    // 각 주문의 order_data 구조 확인 및 표준화
    let fixedCount = 0;
    for (const order of sampleOrdersResult.rows) {
      try {
        const orderData = order.order_data;
        
        // 현재 order_data 구조 확인
        console.log(`🔍 주문 ${order.id} order_data 구조:`, typeof orderData, Object.keys(orderData || {}));
        
        // 표준 구조로 변환 필요한지 확인
        let needsUpdate = false;
        let standardizedData = { ...orderData };
        
        // items 배열이 없거나 잘못된 형태인 경우 수정
        if (!standardizedData.items || !Array.isArray(standardizedData.items)) {
          if (standardizedData.메뉴) {
            // 한글 키 -> 영문 키 변환
            standardizedData.items = standardizedData.메뉴.map(item => ({
              name: item.name || item.메뉴명 || '알 수 없음',
              quantity: item.quantity || item.수량 || 1,
              price: item.price || item.가격 || 0,
              totalPrice: (item.price || item.가격 || 0) * (item.quantity || item.수량 || 1)
            }));
            delete standardizedData.메뉴;
            needsUpdate = true;
          } else if (!standardizedData.items) {
            standardizedData.items = [];
            needsUpdate = true;
          }
        }
        
        // total 필드 표준화
        if (!standardizedData.total && (standardizedData.총액 || standardizedData.totalAmount)) {
          standardizedData.total = standardizedData.총액 || standardizedData.totalAmount;
          delete standardizedData.총액;
          delete standardizedData.totalAmount;
          needsUpdate = true;
        }
        
        // store 정보 표준화
        if (!standardizedData.storeId && standardizedData.매장ID) {
          standardizedData.storeId = standardizedData.매장ID;
          delete standardizedData.매장ID;
          needsUpdate = true;
        }
        
        if (!standardizedData.storeName && standardizedData.매장명) {
          standardizedData.storeName = standardizedData.매장명;
          delete standardizedData.매장명;
          needsUpdate = true;
        }
        
        // 업데이트 필요한 경우 실행
        if (needsUpdate) {
          await client.query(`
            UPDATE paid_orders 
            SET order_data = $1
            WHERE id = $2
          `, [JSON.stringify(standardizedData), order.id]);
          
          console.log(`✅ 주문 ${order.id} order_data 표준화 완료`);
          fixedCount++;
        }
        
      } catch (parseError) {
        console.error(`❌ 주문 ${order.id} order_data 파싱 실패:`, parseError.message);
      }
    }
    
    console.log(`✅ ${fixedCount}개 주문의 order_data 표준화 완료`);
    
    // 3. paid_orders 테이블 order_data 제약조건 추가 (JSONB 유효성 보장)
    console.log('🔒 paid_orders order_data 제약조건 추가...');
    
    try {
      await client.query(`
        ALTER TABLE paid_orders 
        DROP CONSTRAINT IF EXISTS chk_paid_orders_valid_jsonb
      `);
      
      await client.query(`
        ALTER TABLE paid_orders 
        ADD CONSTRAINT chk_paid_orders_valid_jsonb 
        CHECK (
          order_data IS NOT NULL AND 
          jsonb_typeof(order_data) = 'object' AND
          order_data ? 'items' AND
          jsonb_typeof(order_data->'items') = 'array'
        )
      `);
      console.log('✅ order_data JSONB 유효성 제약조건 추가 완료');
    } catch (constraintError) {
      console.warn('⚠️ 제약조건 추가 실패 (기존 데이터 때문일 수 있음):', constraintError.message);
    }
    
    // 4. 인덱스 추가로 JSONB 쿼리 성능 향상
    console.log('📊 JSONB 인덱스 추가...');
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_paid_orders_jsonb_items 
      ON paid_orders USING GIN ((order_data->'items'))
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_paid_orders_jsonb_store 
      ON paid_orders USING GIN ((order_data->'storeId'))
    `);
    
    console.log('✅ JSONB 인덱스 추가 완료');
    
    await client.query('COMMIT');
    
    // 5. 수정 후 테이블 상태 확인
    console.log('\n📊 수정 완료된 테이블 상태 확인:');
    
    const finalStatsResult = await client.query(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN order_data ? 'items' THEN 1 END) as orders_with_items,
        COUNT(CASE WHEN order_data ? 'total' THEN 1 END) as orders_with_total,
        COUNT(CASE WHEN order_data ? 'storeId' THEN 1 END) as orders_with_store_id
      FROM paid_orders
    `);
    
    const stats = finalStatsResult.rows[0];
    console.log(`📋 paid_orders 통계:`);
    console.log(`   - 전체 주문: ${stats.total_orders}개`);
    console.log(`   - items 필드 보유: ${stats.orders_with_items}개`);
    console.log(`   - total 필드 보유: ${stats.orders_with_total}개`);
    console.log(`   - storeId 필드 보유: ${stats.orders_with_store_id}개`);
    
    // reviews 테이블 구조 확인
    const reviewsColumnsResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'reviews'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📝 reviews 테이블 구조:');
    reviewsColumnsResult.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });
    
    console.log('\n🎉 paid_orders JSONB 파싱 및 reviews 테이블 수정 완료!');
    
    process.exit(0);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ paid_orders JSONB 파싱 수정 실패:', error);
    process.exit(1);
  } finally {
    client.release();
  }
}

// 스크립트 실행
fixPaidOrdersJSONBParsing();
