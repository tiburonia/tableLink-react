
const pool = require('../../shared/config/database');

async function createCompleteAutoSyncSystem() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('🔄 완전 자동 동기화 시스템 구축 시작...');

    // 1. 레벨 정책 변경시 자동 재동기화 트리거 함수 생성
    await client.query(`
      CREATE OR REPLACE FUNCTION trigger_resync_on_level_policy_change()
      RETURNS TRIGGER AS $$
      DECLARE
        v_affected_users INTEGER := 0;
      BEGIN
        -- 레벨 정책이 변경된 경우에만 처리
        IF OLD.eval_policy IS DISTINCT FROM NEW.eval_policy OR 
           OLD.required_points IS DISTINCT FROM NEW.required_points OR
           OLD.required_total_spent IS DISTINCT FROM NEW.required_total_spent OR
           OLD.required_visit_count IS DISTINCT FROM NEW.required_visit_count OR
           OLD.is_active IS DISTINCT FROM NEW.is_active THEN

          RAISE NOTICE '🔄 레벨 정책 변경 감지: 매장 %, 레벨 % - 자동 재동기화 시작', NEW.store_id, NEW.name;

          -- 해당 매장의 모든 사용자 데이터 재동기화
          SELECT COUNT(*) INTO v_affected_users
          FROM user_store_stats 
          WHERE store_id = NEW.store_id;

          -- 비동기적으로 재동기화 실행 (백그라운드)
          PERFORM pg_notify('level_policy_changed', 
            json_build_object(
              'store_id', NEW.store_id,
              'level_id', NEW.id,
              'level_name', NEW.name,
              'affected_users', v_affected_users
            )::text
          );

          -- 즉시 동기화 (소규모 매장인 경우)
          IF v_affected_users <= 100 THEN
            PERFORM sync_store_users_level_data(NEW.store_id);
            RAISE NOTICE '✅ 즉시 동기화 완료: %명 사용자 처리', v_affected_users;
          ELSE
            RAISE NOTICE '📋 대용량 동기화 예약: %명 사용자 (백그라운드 처리)', v_affected_users;
          END IF;

        END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 2. 매장별 사용자 동기화 함수 생성
    await client.query(`
      CREATE OR REPLACE FUNCTION sync_store_users_level_data(p_store_id INTEGER)
      RETURNS INTEGER AS $$
      DECLARE
        v_record RECORD;
        v_count INTEGER := 0;
      BEGIN
        FOR v_record IN
          SELECT user_id, store_id 
          FROM user_store_stats
          WHERE store_id = p_store_id
        LOOP
          PERFORM sync_user_level_data(v_record.user_id, v_record.store_id);
          v_count := v_count + 1;
          
          -- 진행상황 로그 (50개마다)
          IF v_count % 50 = 0 THEN
            RAISE NOTICE '진행상황: 매장 % - %개 사용자 동기화 완료', p_store_id, v_count;
          END IF;
        END LOOP;
        
        RETURN v_count;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 3. 트리거 생성 (레벨 정책 변경시)
    await client.query(`
      DROP TRIGGER IF EXISTS trigger_level_policy_change ON regular_levels;
      
      CREATE TRIGGER trigger_level_policy_change
        AFTER UPDATE ON regular_levels
        FOR EACH ROW
        EXECUTE FUNCTION trigger_resync_on_level_policy_change();
    `);

    // 4. 실시간 모니터링 함수 생성
    await client.query(`
      CREATE OR REPLACE FUNCTION monitor_sync_status()
      RETURNS TABLE(
        store_id INTEGER,
        store_name VARCHAR(255),
        total_users INTEGER,
        synced_users INTEGER,
        pending_users INTEGER,
        last_sync_time TIMESTAMP
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          s.id as store_id,
          s.name as store_name,
          COUNT(uss.user_id)::INTEGER as total_users,
          COUNT(CASE WHEN uss.current_level_rank > 0 THEN 1 END)::INTEGER as synced_users,
          COUNT(CASE WHEN uss.current_level_rank = 0 AND (uss.points > 0 OR uss.total_spent > 0 OR uss.visit_count > 0) THEN 1 END)::INTEGER as pending_users,
          MAX(uss.updated_at) as last_sync_time
        FROM stores s
        LEFT JOIN user_store_stats uss ON s.id = uss.store_id
        GROUP BY s.id, s.name
        HAVING COUNT(uss.user_id) > 0
        ORDER BY pending_users DESC, total_users DESC;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 5. 배치 동기화 함수 생성 (대용량 처리용)
    await client.query(`
      CREATE OR REPLACE FUNCTION batch_sync_all_users(p_batch_size INTEGER DEFAULT 1000)
      RETURNS INTEGER AS $$
      DECLARE
        v_total_count INTEGER := 0;
        v_batch_count INTEGER := 0;
        v_record RECORD;
      BEGIN
        FOR v_record IN
          SELECT DISTINCT user_id, store_id 
          FROM user_store_stats
          WHERE points > 0 OR total_spent > 0 OR visit_count > 0
          ORDER BY store_id, user_id
        LOOP
          PERFORM sync_user_level_data(v_record.user_id, v_record.store_id);
          v_total_count := v_total_count + 1;
          v_batch_count := v_batch_count + 1;
          
          -- 배치 크기마다 커밋 및 진행상황 보고
          IF v_batch_count >= p_batch_size THEN
            COMMIT;
            RAISE NOTICE '📊 배치 처리 진행: %개 사용자 동기화 완료', v_total_count;
            v_batch_count := 0;
          END IF;
        END LOOP;
        
        RETURN v_total_count;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 6. 성능 최적화를 위한 인덱스 추가
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_store_stats_sync_status 
      ON user_store_stats(store_id, current_level_rank, updated_at);
      
      CREATE INDEX IF NOT EXISTS idx_regular_levels_policy 
      ON regular_levels(store_id, eval_policy, is_active);
    `);

    await client.query('COMMIT');

    console.log('✅ 완전 자동 동기화 시스템 구축 완료!');
    console.log('📋 이제 다음이 자동으로 처리됩니다:');
    console.log('   - 주문 완료시 즉시 레벨 업데이트');
    console.log('   - 레벨 정책 변경시 자동 재동기화');
    console.log('   - 실시간 동기화 상태 모니터링');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 자동 동기화 시스템 구축 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 직접 실행
if (require.main === module) {
  createCompleteAutoSyncSystem()
    .then(() => {
      console.log('🎉 완전 자동 동기화 시스템이 활성화되었습니다!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = createCompleteAutoSyncSystem;
