
const pool = require('../../shared/config/database');

async function fixMissingTables() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 누락된 테이블 생성 및 수정 시작...\n');
    
    await client.query('BEGIN');
    
    // 1. store_promotions 테이블 생성
    console.log('1️⃣ store_promotions 테이블 생성...');
    
    const promotionsExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'store_promotions'
      )
    `);
    
    if (!promotionsExists.rows[0].exists) {
      await client.query(`
        CREATE TABLE store_promotions (
          id SERIAL PRIMARY KEY,
          store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          discount_type VARCHAR(20) CHECK (discount_type IN ('percentage', 'fixed_amount')),
          discount_value DECIMAL(10,2) NOT NULL,
          min_order_amount DECIMAL(10,2) DEFAULT 0,
          max_discount_amount DECIMAL(10,2),
          start_date TIMESTAMP NOT NULL,
          end_date TIMESTAMP NOT NULL,
          is_active BOOLEAN DEFAULT true,
          usage_limit INTEGER,
          used_count INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      console.log('✅ store_promotions 테이블 생성 완료');
      
      // 샘플 프로모션 데이터 추가
      await client.query(`
        INSERT INTO store_promotions (store_id, title, description, discount_type, discount_value, start_date, end_date)
        SELECT 
          id,
          CASE 
            WHEN category = '치킨' THEN '치킨 할인 이벤트'
            WHEN category = '양식' THEN '피자 세트 할인'
            WHEN category = '한식' THEN '한식 특가 메뉴'
            ELSE '매장 특별 할인'
          END,
          CASE 
            WHEN category = '치킨' THEN '모든 치킨 메뉴 10% 할인'
            WHEN category = '양식' THEN '피자 + 음료 세트 15% 할인'
            WHEN category = '한식' THEN '정식 메뉴 20% 할인'
            ELSE '전 메뉴 5% 할인'
          END,
          'percentage',
          CASE 
            WHEN category = '치킨' THEN 10
            WHEN category = '양식' THEN 15
            WHEN category = '한식' THEN 20
            ELSE 5
          END,
          NOW(),
          NOW() + INTERVAL '30 days'
        FROM stores 
        WHERE id <= 50
      `);
      
      console.log('✅ 샘플 프로모션 데이터 추가 완료');
      
    } else {
      console.log('ℹ️ store_promotions 테이블이 이미 존재합니다');
    }
    
    // 2. 다른 누락된 필수 테이블들 확인 및 생성
    console.log('\n2️⃣ 다른 필수 테이블들 확인...');
    
    const essentialTables = [
      {
        name: 'store_hours',
        sql: `
          CREATE TABLE store_hours (
            id SERIAL PRIMARY KEY,
            store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
            day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
            open_time TIME,
            close_time TIME,
            is_closed BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `
      },
      {
        name: 'store_holidays',
        sql: `
          CREATE TABLE store_holidays (
            id SERIAL PRIMARY KEY,
            store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
            holiday_date DATE NOT NULL,
            holiday_name VARCHAR(255),
            is_closed BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `
      }
    ];
    
    for (const table of essentialTables) {
      const exists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1
        )
      `, [table.name]);
      
      if (!exists.rows[0].exists) {
        await client.query(table.sql);
        console.log(`✅ ${table.name} 테이블 생성 완료`);
        
        // store_hours에 기본 영업시간 추가
        if (table.name === 'store_hours') {
          await client.query(`
            INSERT INTO store_hours (store_id, day_of_week, open_time, close_time)
            SELECT 
              s.id,
              generate_series(0, 6) as day_of_week,
              '09:00'::TIME as open_time,
              '22:00'::TIME as close_time
            FROM stores s
            WHERE s.id <= 20
          `);
          console.log('✅ 기본 영업시간 데이터 추가 완료');
        }
        
      } else {
        console.log(`ℹ️ ${table.name} 테이블이 이미 존재합니다`);
      }
    }
    
    // 3. stores 테이블에 description 컬럼 추가 (누락된 경우)
    console.log('\n3️⃣ stores 테이블 description 컬럼 확인...');
    
    const descriptionExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'stores' AND column_name = 'description'
      )
    `);
    
    if (!descriptionExists.rows[0].exists) {
      await client.query(`
        ALTER TABLE stores ADD COLUMN description TEXT
      `);
      
      // 카테고리별 기본 설명 추가
      await client.query(`
        UPDATE stores SET description = 
        CASE 
          WHEN category = '치킨' THEN '맛있는 치킨 전문점입니다. 바삭하고 육즙 가득한 치킨을 제공합니다.'
          WHEN category = '양식' THEN '정통 양식 요리를 제공하는 레스토랑입니다. 피자, 파스타 등 다양한 메뉴가 있습니다.'
          WHEN category = '한식' THEN '전통 한식을 현대적으로 재해석한 맛집입니다. 집밥 같은 따뜻한 맛을 느껴보세요.'
          WHEN category = '카페' THEN '편안한 분위기의 카페입니다. 신선한 원두로 내린 커피와 디저트를 즐기세요.'
          WHEN category = '분식' THEN '저렴하고 맛있는 분식 전문점입니다. 떡볶이, 김밥, 순대 등을 제공합니다.'
          ELSE '맛있는 음식과 친절한 서비스를 제공하는 음식점입니다.'
        END
        WHERE description IS NULL
      `);
      
      console.log('✅ description 컬럼 추가 및 기본값 설정 완료');
    } else {
      console.log('ℹ️ description 컬럼이 이미 존재합니다');
    }
    
    // 4. 테이블 레코드 수 재확인
    console.log('\n4️⃣ 최종 테이블 상태 확인...');
    
    const finalCheck = [
      'stores', 'store_address', 'store_tables', 'store_promotions', 
      'store_hours', 'store_holidays', 'reviews', 'favorites'
    ];
    
    for (const tableName of finalCheck) {
      try {
        const count = await client.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        console.log(`  ✅ ${tableName}: ${count.rows[0].count}개`);
      } catch (error) {
        console.log(`  ❌ ${tableName}: 테이블 없음 또는 오류`);
      }
    }
    
    // 5. 외래 키 제약조건 검증
    console.log('\n5️⃣ 외래 키 제약조건 검증...');
    
    const orphanChecks = [
      {
        table: 'store_address',
        query: `SELECT COUNT(*) as count FROM store_address sa LEFT JOIN stores s ON sa.store_id = s.id WHERE s.id IS NULL`
      },
      {
        table: 'store_tables', 
        query: `SELECT COUNT(*) as count FROM store_tables st LEFT JOIN stores s ON st.store_id = s.id WHERE s.id IS NULL`
      },
      {
        table: 'reviews',
        query: `SELECT COUNT(*) as count FROM reviews r LEFT JOIN stores s ON r.store_id = s.id WHERE s.id IS NULL`
      }
    ];
    
    for (const check of orphanChecks) {
      try {
        const result = await client.query(check.query);
        const orphanCount = parseInt(result.rows[0].count);
        
        if (orphanCount === 0) {
          console.log(`  ✅ ${check.table}: 외래 키 무결성 OK`);
        } else {
          console.log(`  ⚠️ ${check.table}: ${orphanCount}개 고아 레코드 발견`);
        }
      } catch (error) {
        console.log(`  ❌ ${check.table}: 검증 실패 - ${error.message}`);
      }
    }
    
    await client.query('COMMIT');
    
    console.log('\n🎉 누락된 테이블 수정 완료!');
    console.log('이제 웹 인터페이스에서 stores 테이블의 외래 키 관계를 정상적으로 볼 수 있습니다.');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 테이블 수정 실패:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

// 스크립트 실행
fixMissingTables();
