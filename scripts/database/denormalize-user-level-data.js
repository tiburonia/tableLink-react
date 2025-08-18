
const pool = require('../../shared/config/database');

async function denormalizeUserLevelData() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('🔧 user_store_stats 테이블 비정규화 시작...');

    // 1. user_store_stats 테이블에 레벨 정보 컬럼 추가
    console.log('📋 레벨 정보 컬럼 추가 중...');
    
    await client.query(`
      ALTER TABLE user_store_stats 
      ADD COLUMN IF NOT EXISTS current_level_rank INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS current_level_name VARCHAR(100),
      ADD COLUMN IF NOT EXISTS current_level_description TEXT
    `);

    console.log('✅ 레벨 정보 컬럼 추가 완료');

    // 2. 레벨 정보 동기화 함수 생성
    await client.query(`
      CREATE OR REPLACE FUNCTION sync_user_level_data(
        p_user_id VARCHAR(50),
        p_store_id INTEGER
      ) RETURNS VOID AS $$
      DECLARE
        v_level_record RECORD;
        v_new_level_id INTEGER;
        v_user_stats RECORD;
      BEGIN
        -- 사용자 통계 조회
        SELECT points, total_spent, visit_count, current_level_id
        INTO v_user_stats
        FROM user_store_stats
        WHERE user_id = p_user_id AND store_id = p_store_id;

        IF NOT FOUND THEN
          RAISE NOTICE '사용자 통계를 찾을 수 없음: %, %', p_user_id, p_store_id;
          RETURN;
        END IF;

        -- 새로운 레벨 계산
        v_new_level_id := calculate_regular_level(
          p_user_id, 
          p_store_id, 
          COALESCE(v_user_stats.points, 0),
          COALESCE(v_user_stats.total_spent, 0),
          COALESCE(v_user_stats.visit_count, 0)
        );

        -- 레벨 정보 조회
        IF v_new_level_id IS NOT NULL THEN
          SELECT level_rank, name, description
          INTO v_level_record
          FROM regular_levels
          WHERE id = v_new_level_id;
        END IF;

        -- user_store_stats 업데이트
        UPDATE user_store_stats SET
          current_level_id = v_new_level_id,
          current_level_rank = COALESCE(v_level_record.level_rank, 0),
          current_level_name = v_level_record.name,
          current_level_description = v_level_record.description,
          current_level_at = CASE 
            WHEN v_new_level_id IS DISTINCT FROM v_user_stats.current_level_id 
            THEN CURRENT_TIMESTAMP 
            ELSE current_level_at 
          END,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = p_user_id AND store_id = p_store_id;

        -- 레벨 변경 시 이력 기록
        IF v_new_level_id IS DISTINCT FROM v_user_stats.current_level_id THEN
          INSERT INTO regular_level_history (
            user_id, store_id, from_level_id, to_level_id, reason, changed_at
          ) VALUES (
            p_user_id, p_store_id, v_user_stats.current_level_id, v_new_level_id,
            'auto_promotion', CURRENT_TIMESTAMP
          );

          RAISE NOTICE '✅ 레벨 변경: 사용자 %, 매장 % → % (랭크 %)', 
            p_user_id, p_store_id, 
            COALESCE(v_level_record.name, '신규고객'), 
            COALESCE(v_level_record.level_rank, 0);

          -- 새 레벨 혜택 발급
          IF v_new_level_id IS NOT NULL THEN
            PERFORM issue_level_benefits(p_user_id, p_store_id, v_new_level_id);
          END IF;
        END IF;

      END;
      $$ LANGUAGE plpgsql;
    `);

    console.log('✅ sync_user_level_data 함수 생성 완료');

    // 3. 모든 사용자 통계 동기화 함수 생성
    await client.query(`
      CREATE OR REPLACE FUNCTION sync_all_user_level_data() RETURNS INTEGER AS $$
      DECLARE
        v_record RECORD;
        v_count INTEGER := 0;
      BEGIN
        FOR v_record IN
          SELECT DISTINCT user_id, store_id 
          FROM user_store_stats
          WHERE points > 0 OR total_spent > 0 OR visit_count > 0
        LOOP
          PERFORM sync_user_level_data(v_record.user_id, v_record.store_id);
          v_count := v_count + 1;
          
          -- 진행상황 출력 (100개마다)
          IF v_count % 100 = 0 THEN
            RAISE NOTICE '진행상황: %개 처리 완료', v_count;
          END IF;
        END LOOP;
        
        RETURN v_count;
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.log('✅ sync_all_user_level_data 함수 생성 완료');

    // 4. 기존 update_user_store_stats 함수 수정 (레벨 동기화 포함)
    await client.query(`
      CREATE OR REPLACE FUNCTION update_user_store_stats(
        p_user_id TEXT,
        p_store_id INTEGER,
        p_order_total NUMERIC,
        p_order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) RETURNS VOID AS $$
      DECLARE
        v_new_points INTEGER;
      BEGIN
        -- 기본 포인트는 주문 금액의 1% (100원당 1포인트)
        v_new_points := FLOOR(p_order_total * 0.01);
        
        INSERT INTO user_store_stats (
          user_id, store_id, points, total_spent, visit_count, 
          last_visit_at, current_level_id, current_level_rank,
          current_level_name, current_level_description, current_level_at,
          created_at, updated_at
        ) VALUES (
          p_user_id, p_store_id, 
          v_new_points, p_order_total, 1, p_order_date, 
          NULL, 0, NULL, NULL, NULL,
          p_order_date, p_order_date
        )
        ON CONFLICT (user_id, store_id) DO UPDATE SET
          points = user_store_stats.points + v_new_points,
          total_spent = user_store_stats.total_spent + p_order_total,
          visit_count = user_store_stats.visit_count + 1,
          last_visit_at = p_order_date,
          updated_at = p_order_date;

        -- 레벨 정보 동기화
        PERFORM sync_user_level_data(p_user_id, p_store_id);

        RAISE NOTICE '✅ 단골 지표 업데이트 완료: 사용자 %, 매장 %, 포인트 +%, 결제액 +%, 방문 +1', 
          p_user_id, p_store_id, v_new_points, p_order_total;
          
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.log('✅ update_user_store_stats 함수 업데이트 완료');

    // 5. 새로운 트리거 함수 생성 (더 간단해짐)
    await client.query(`
      CREATE OR REPLACE FUNCTION trigger_sync_user_level()
      RETURNS TRIGGER AS $$
      BEGIN
        -- 주문 완료 시에만 처리
        IF NEW.order_status = 'completed' AND 
           (OLD.order_status IS NULL OR OLD.order_status != 'completed') THEN
          
          -- 단골 지표 업데이트 (레벨 동기화 포함)
          PERFORM update_user_store_stats(
            NEW.user_id,
            NEW.store_id,
            NEW.total_amount,
            COALESCE(NEW.order_date, CURRENT_TIMESTAMP)
          );
          
        END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.log('✅ trigger_sync_user_level 함수 생성 완료');

    // 6. 기존 트리거 교체
    await client.query(`
      DROP TRIGGER IF EXISTS orders_regular_stats_level_trigger ON orders;
      DROP TRIGGER IF EXISTS trigger_auto_update_user_level ON user_store_stats;

      CREATE TRIGGER orders_sync_user_level_trigger
        AFTER UPDATE ON orders
        FOR EACH ROW
        WHEN (OLD.order_status IS DISTINCT FROM NEW.order_status)
        EXECUTE FUNCTION trigger_sync_user_level();
    `);

    console.log('✅ 새로운 트리거 생성 완료');

    // 7. 기존 데이터 동기화
    console.log('🔄 기존 사용자 레벨 데이터 동기화 시작...');
    
    const syncResult = await client.query('SELECT sync_all_user_level_data() as synced_count');
    const syncedCount = syncResult.rows[0].synced_count;

    console.log(`✅ 기존 데이터 동기화 완료: ${syncedCount}개 사용자 처리`);

    // 8. 인덱스 추가 (성능 최적화)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_store_stats_level_rank 
      ON user_store_stats(store_id, current_level_rank);
      
      CREATE INDEX IF NOT EXISTS idx_user_store_stats_level_name 
      ON user_store_stats(current_level_name);
    `);

    console.log('✅ 성능 최적화 인덱스 생성 완료');

    await client.query('COMMIT');

    console.log('🎉 사용자 레벨 데이터 비정규화 완료!');

    // 결과 확인
    const resultCheck = await client.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN current_level_rank > 0 THEN 1 END) as users_with_level,
        COUNT(CASE WHEN current_level_name IS NOT NULL THEN 1 END) as users_with_level_name
      FROM user_store_stats
    `);

    const result = resultCheck.rows[0];
    console.log(`📊 동기화 결과:`);
    console.log(`   - 총 사용자: ${result.total_users}명`);
    console.log(`   - 레벨 보유: ${result.users_with_level}명`);
    console.log(`   - 레벨명 보유: ${result.users_with_level_name}명`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 사용자 레벨 데이터 비정규화 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 실행
if (require.main === module) {
  denormalizeUserLevelData()
    .then(() => {
      console.log('✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = denormalizeUserLevelData;
