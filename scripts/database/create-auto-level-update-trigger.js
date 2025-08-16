
const pool = require('../../shared/config/database');

async function createAutoLevelUpdateTrigger() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 자동 레벨 업데이트 트리거 생성 시작...');
    
    // 1. 트리거 함수 생성 - 레벨 자동 업데이트
    await client.query(`
      CREATE OR REPLACE FUNCTION auto_update_user_level()
      RETURNS TRIGGER AS $$
      DECLARE
        v_new_level_id INTEGER;
        v_old_level_rank INTEGER DEFAULT 0;
        v_new_level_rank INTEGER DEFAULT 0;
        v_level_record RECORD;
      BEGIN
        -- 현재 레벨 랭크 확인
        IF OLD.current_level_id IS NOT NULL THEN
          SELECT level_rank INTO v_old_level_rank 
          FROM regular_levels 
          WHERE id = OLD.current_level_id;
        END IF;
        
        -- calculate_regular_level 함수를 사용하여 새로운 레벨 계산
        SELECT calculate_regular_level(
          NEW.user_id,
          NEW.store_id, 
          NEW.points, 
          NEW.total_spent, 
          NEW.visit_count
        ) INTO v_new_level_id;
        
        -- 새로운 레벨이 있는 경우 랭크 확인
        IF v_new_level_id IS NOT NULL THEN
          SELECT level_rank, name INTO v_new_level_rank, v_level_record.name
          FROM regular_levels 
          WHERE id = v_new_level_id;
        END IF;
        
        -- 레벨이 변경되었는지 확인
        IF (OLD.current_level_id IS NULL AND v_new_level_id IS NOT NULL) OR 
           (OLD.current_level_id IS NOT NULL AND v_new_level_id IS NOT NULL AND OLD.current_level_id != v_new_level_id) OR
           (OLD.current_level_id IS NOT NULL AND v_new_level_id IS NULL) THEN
          
          -- 레벨 업데이트
          NEW.current_level_id := v_new_level_id;
          NEW.current_level_at := CURRENT_TIMESTAMP;
          
          -- 레벨 변경 이력 기록
          INSERT INTO regular_level_history (
            user_id, store_id, from_level_id, to_level_id, reason, changed_at
          ) VALUES (
            NEW.user_id, 
            NEW.store_id, 
            OLD.current_level_id, 
            v_new_level_id, 
            'auto_promotion', 
            CURRENT_TIMESTAMP
          );
          
          -- 새 레벨 혜택 발급 (레벨업인 경우만)
          IF v_new_level_id IS NOT NULL AND v_new_level_rank > v_old_level_rank THEN
            -- 새 레벨 정보 조회
            SELECT * INTO v_level_record
            FROM regular_levels 
            WHERE id = v_new_level_id;
            
            -- 혜택이 있는 경우 발급
            IF v_level_record.benefits IS NOT NULL AND jsonb_array_length(v_level_record.benefits) > 0 THEN
              DECLARE
                benefit_item JSONB;
                expires_date TIMESTAMP;
              BEGIN
                -- 각 혜택에 대해 발급
                FOR benefit_item IN SELECT * FROM jsonb_array_elements(v_level_record.benefits) LOOP
                  -- 만료일 계산
                  expires_date := NULL;
                  IF (benefit_item->>'expires_days')::INTEGER IS NOT NULL THEN
                    expires_date := CURRENT_TIMESTAMP + INTERVAL '1 day' * (benefit_item->>'expires_days')::INTEGER;
                  END IF;
                  
                  -- 혜택 발급
                  INSERT INTO regular_level_benefit_issues (
                    user_id, store_id, level_id, benefit_type, benefit_data, 
                    expires_at, issued_at, is_used
                  ) VALUES (
                    NEW.user_id,
                    NEW.store_id,
                    v_new_level_id,
                    COALESCE(benefit_item->>'type', 'loyalty_coupon'),
                    benefit_item,
                    expires_date,
                    CURRENT_TIMESTAMP,
                    false
                  );
                END LOOP;
              END;
            END IF;
            
            -- 로그 출력 (개발용)
            RAISE NOTICE '✅ 사용자 % 매장 % 레벨 승급: % (랭크 %) → % (랭크 %)', 
              NEW.user_id, NEW.store_id, 
              COALESCE((SELECT name FROM regular_levels WHERE id = OLD.current_level_id), '신규고객'), v_old_level_rank,
              v_level_record.name, v_new_level_rank;
          END IF;
        END IF;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    console.log('✅ 트리거 함수 생성 완료');
    
    // 2. 기존 트리거 제거 (있는 경우)
    await client.query(`
      DROP TRIGGER IF EXISTS trigger_auto_update_user_level ON user_store_stats;
    `);
    
    // 3. 새 트리거 생성
    await client.query(`
      CREATE TRIGGER trigger_auto_update_user_level
      BEFORE UPDATE OF points, total_spent, visit_count ON user_store_stats
      FOR EACH ROW
      WHEN (OLD.points IS DISTINCT FROM NEW.points OR 
            OLD.total_spent IS DISTINCT FROM NEW.total_spent OR 
            OLD.visit_count IS DISTINCT FROM NEW.visit_count)
      EXECUTE FUNCTION auto_update_user_level();
    `);
    
    console.log('✅ 자동 레벨 업데이트 트리거 생성 완료');
    
    // 4. 기존 데이터 일괄 업데이트 (current_level_id가 null이거나 잘못된 경우)
    console.log('🔄 기존 데이터 레벨 재계산 시작...');
    
    const updateResult = await client.query(`
      WITH level_updates AS (
        SELECT 
          uss.user_id,
          uss.store_id,
          uss.current_level_id,
          calculate_regular_level(uss.user_id, uss.store_id, uss.points, uss.total_spent, uss.visit_count) as new_level_id
        FROM user_store_stats uss
        WHERE uss.points > 0 OR uss.total_spent > 0 OR uss.visit_count > 0
      )
      UPDATE user_store_stats uss
      SET 
        current_level_id = lu.new_level_id,
        current_level_at = CURRENT_TIMESTAMP
      FROM level_updates lu
      WHERE uss.user_id = lu.user_id 
        AND uss.store_id = lu.store_id
        AND (uss.current_level_id IS NULL OR uss.current_level_id != lu.new_level_id)
        AND lu.new_level_id IS NOT NULL
      RETURNING uss.user_id, uss.store_id, uss.current_level_id;
    `);
    
    console.log(`✅ 기존 데이터 ${updateResult.rows.length}건 레벨 업데이트 완료`);
    
    // 5. 테스트를 위한 샘플 업데이트 실행
    console.log('🧪 트리거 테스트 실행...');
    
    const testResult = await client.query(`
      UPDATE user_store_stats 
      SET points = points + 1 
      WHERE user_id = 'user1' AND store_id = 1
      RETURNING user_id, store_id, current_level_id;
    `);
    
    if (testResult.rows.length > 0) {
      console.log('✅ 트리거 테스트 성공:', testResult.rows[0]);
    }
    
    console.log('🎉 자동 레벨 업데이트 시스템 구축 완료!');
    
  } catch (error) {
    console.error('❌ 트리거 생성 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 직접 실행
if (require.main === module) {
  createAutoLevelUpdateTrigger()
    .then(() => {
      console.log('✅ 자동 레벨 업데이트 트리거 설정 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = createAutoLevelUpdateTrigger;
