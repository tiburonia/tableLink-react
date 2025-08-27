const pool = require('../../shared/config/database');

async function fixPOSPaymentIssues() {
  const client = await pool.connect();

  try {
    console.log('🔄 POS 결제 관련 데이터베이스 문제 수정 시작...');

    await client.query('BEGIN');

    // 1. orders 테이블의 table_release_source 컬럼 길이 확장
    console.log('📏 orders.table_release_source 컬럼 길이 확인 및 확장...');

    const columnInfo = await client.query(`
      SELECT character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'table_release_source'
    `);

    if (columnInfo.rows.length > 0) {
      const currentLength = columnInfo.rows[0].character_maximum_length;
      console.log(`현재 table_release_source 컬럼 길이: ${currentLength}`);

      if (currentLength < 30) {
        await client.query(`
          ALTER TABLE orders 
          ALTER COLUMN table_release_source TYPE VARCHAR(50)
        `);
        console.log('✅ orders.table_release_source 컬럼을 VARCHAR(50)으로 확장 완료');
      }
    } else {
      // 컬럼이 없으면 추가
      await client.query(`
        ALTER TABLE orders 
        ADD COLUMN IF NOT EXISTS table_release_source VARCHAR(50)
      `);
      console.log('✅ orders.table_release_source 컬럼 추가 완료');
    }

    // 2. store_tables 테이블의 auto_release_source 컬럼도 확인
    console.log('📏 store_tables.auto_release_source 컬럼 확인...');

    const tableColumnInfo = await client.query(`
      SELECT character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = 'store_tables' AND column_name = 'auto_release_source'
    `);

    if (tableColumnInfo.rows.length > 0) {
      const currentLength = tableColumnInfo.rows[0].character_maximum_length;
      console.log(`현재 auto_release_source 컬럼 길이: ${currentLength}`);

      if (currentLength < 30) {
        await client.query(`
          ALTER TABLE store_tables 
          ALTER COLUMN auto_release_source TYPE VARCHAR(50)
        `);
        console.log('✅ store_tables.auto_release_source 컬럼을 VARCHAR(50)으로 확장 완료');
      }
    } else {
      // 컬럼이 없으면 추가
      await client.query(`
        ALTER TABLE store_tables 
        ADD COLUMN IF NOT EXISTS auto_release_source VARCHAR(50)
      `);
      console.log('✅ store_tables.auto_release_source 컬럼 추가 완료');
    }

    // 3. order_items 테이블 스키마 확인 및 수정
    console.log('📊 order_items 테이블 스키마 확인 및 수정...');

    // paid_order_id 컬럼 존재 여부 확인
    const orderItemsColumnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'order_items' AND column_name = 'paid_order_id'
    `);

    if (orderItemsColumnCheck.rows.length === 0) {
      // paid_order_id 컬럼 추가
      await client.query(`
        ALTER TABLE order_items 
        ADD COLUMN paid_order_id INTEGER REFERENCES paid_orders(id)
      `);
      console.log('✅ order_items 테이블에 paid_order_id 컬럼 추가 완료');
    } else {
      console.log('✅ order_items 테이블에 paid_order_id 컬럼이 이미 존재');
    }

    // 기존 데이터 정합성 확인 및 수정
    const orphanedItems = await client.query(`
      SELECT oi.id, oi.order_id, o.paid_order_id
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE oi.paid_order_id IS NULL 
      AND o.paid_order_id IS NOT NULL
      LIMIT 100
    `);

    if (orphanedItems.rows.length > 0) {
      console.log(`🔄 ${orphanedItems.rows.length}개의 order_items paid_order_id 동기화 중...`);

      for (const item of orphanedItems.rows) {
        await client.query(`
          UPDATE order_items 
          SET paid_order_id = $1 
          WHERE id = $2
        `, [item.paid_order_id, item.id]);
      }

      console.log('✅ order_items paid_order_id 동기화 완료');
    }

    // 4. paid_orders 테이블에 처리 상태 컬럼 추가
    console.log('💳 paid_orders 테이블 처리 상태 컬럼 확인 및 추가...');

    const processingColumns = [
      { name: 'processing_status', type: 'VARCHAR(50)', comment: 'POS 처리 상태' },
      { name: 'processing_completed_at', type: 'TIMESTAMP', comment: 'POS 처리 완료 시간' }
    ];

    for (const col of processingColumns) {
      const existsResult = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'paid_orders' AND column_name = $1
      `, [col.name]);

      if (existsResult.rows.length === 0) {
        await client.query(`
          ALTER TABLE paid_orders 
          ADD COLUMN ${col.name} ${col.type}
        `);
        console.log(`✅ paid_orders.${col.name} 컬럼 추가 완료: ${col.comment}`);
      }
    }

    // 5. 기존 오류로 인해 실패한 데이터 정리
    console.log('🧹 오류로 인해 불완전한 결제 데이터 정리...');

    // CLOSED 상태이지만 테이블이 여전히 점유 상태인 경우 해제
    const incompletePayments = await client.query(`
      SELECT DISTINCT o.store_id, o.table_number
      FROM orders o
      JOIN store_tables st ON o.store_id = st.store_id AND o.table_number = st.table_number
      WHERE o.cooking_status = 'CLOSED'
      AND o.completed_at IS NOT NULL
      AND st.is_occupied = true
      AND o.completed_at >= NOW() - INTERVAL '1 hour'
    `);

    for (const payment of incompletePayments.rows) {
      await client.query(`
        UPDATE store_tables 
        SET is_occupied = false, 
            occupied_since = NULL,
            auto_release_source = 'PAYMENT_CLEANUP'
        WHERE store_id = $1 AND table_number = $2
      `, [payment.store_id, payment.table_number]);

      console.log(`✅ 테이블 ${payment.table_number} (매장 ${payment.store_id}) 정리 완료`);
    }

    await client.query('COMMIT');

    // 6. 수정된 컬럼 정보 확인
    const updatedColumns = await client.query(`
      SELECT 
        table_name, 
        column_name, 
        data_type, 
        character_maximum_length,
        is_nullable
      FROM information_schema.columns 
      WHERE (table_name = 'orders' AND column_name = 'table_release_source')
      OR (table_name = 'store_tables' AND column_name = 'auto_release_source')
      OR (table_name = 'order_items' AND column_name = 'paid_order_id')
      OR (table_name = 'paid_orders' AND column_name IN ('processing_status', 'processing_completed_at'))
      ORDER BY table_name, column_name
    `);

    console.log('\n📊 수정된 컬럼 정보:');
    updatedColumns.rows.forEach(col => {
      console.log(`  - ${col.table_name}.${col.column_name}: ${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'}`);
    });

    console.log('🎉 POS 결제 관련 데이터베이스 문제 수정 완료!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ POS 결제 문제 수정 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 스크립트 직접 실행
if (require.main === module) {
  fixPOSPaymentIssues()
    .then(() => {
      console.log('✅ 마이그레이션 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 마이그레이션 실패:', error);
      process.exit(1);
    });
}

module.exports = { fixPOSPaymentIssues };