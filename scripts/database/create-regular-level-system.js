const pool = require('../../shared/config/database');

async function createRegularLevelSystem() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('🏆 단골 레벨 시스템 테이블 생성 시작...');

    // 1. regular_levels 테이블 생성 (매장별 단골 레벨 규칙)
    await client.query(`
      CREATE TABLE IF NOT EXISTS regular_levels (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        level_rank INTEGER NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        required_points INTEGER DEFAULT 0,
        required_total_spent NUMERIC(10,2) DEFAULT 0,
        required_visit_count INTEGER DEFAULT 0,
        eval_policy VARCHAR(10) NOT NULL DEFAULT 'OR' CHECK (eval_policy IN ('OR', 'AND')),
        benefits JSONB DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
        UNIQUE(store_id, level_rank)
      )
    `);

    console.log('✅ regular_levels 테이블 생성 완료');

    // 2. user_store_stats 테이블 생성 (유저×매장 단골 누적 지표)
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_store_stats (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        store_id INTEGER NOT NULL,
        points INTEGER DEFAULT 0,
        total_spent NUMERIC(10,2) DEFAULT 0,
        visit_count INTEGER DEFAULT 0,
        last_visit_at TIMESTAMP,
        current_level_id INTEGER,
        current_level_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
        FOREIGN KEY (current_level_id) REFERENCES regular_levels(id) ON DELETE SET NULL,
        UNIQUE(user_id, store_id)
      )
    `);

    console.log('✅ user_store_stats 테이블 생성 완료');

    // 3. regular_level_history 테이블 생성 (레벨 변경 이력)
    await client.query(`
      CREATE TABLE IF NOT EXISTS regular_level_history (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        store_id INTEGER NOT NULL,
        from_level_id INTEGER,
        to_level_id INTEGER,
        reason VARCHAR(50) NOT NULL DEFAULT 'system' CHECK (reason IN ('system', 'purchase', 'manual', 'promo')),
        changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
        FOREIGN KEY (from_level_id) REFERENCES regular_levels(id) ON DELETE SET NULL,
        FOREIGN KEY (to_level_id) REFERENCES regular_levels(id) ON DELETE SET NULL
      )
    `);

    console.log('✅ regular_level_history 테이블 생성 완료');

    // 4. regular_level_benefit_issues 테이블 생성 (혜택 발급 로그)
    await client.query(`
      CREATE TABLE IF NOT EXISTS regular_level_benefit_issues (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        store_id INTEGER NOT NULL,
        level_id INTEGER NOT NULL,
        benefit_type VARCHAR(100) NOT NULL,
        benefit_data JSONB DEFAULT '{}',
        issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        used_at TIMESTAMP,
        expires_at TIMESTAMP,
        is_used BOOLEAN DEFAULT false,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
        FOREIGN KEY (level_id) REFERENCES regular_levels(id) ON DELETE CASCADE
      )
    `);

    console.log('✅ regular_level_benefit_issues 테이블 생성 완료');

    // 5. 인덱스 생성
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_regular_levels_store_rank ON regular_levels(store_id, level_rank);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_store_stats_user_store ON user_store_stats(user_id, store_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_regular_level_history_user_store ON regular_level_history(user_id, store_id);
    `);

    console.log('✅ 인덱스 생성 완료');

    // 6. 레벨 산정 함수 생성
    await client.query(`
      CREATE OR REPLACE FUNCTION calculate_regular_level(
        p_user_id VARCHAR(50),
        p_store_id INTEGER,
        p_points INTEGER,
        p_total_spent NUMERIC,
        p_visit_count INTEGER
      ) RETURNS INTEGER AS $$
      DECLARE
        v_level_id INTEGER;
        v_level RECORD;
      BEGIN
        v_level_id := NULL;

        -- 해당 매장의 활성화된 레벨들을 높은 rank 순으로 조회
        FOR v_level IN 
          SELECT id, level_rank, required_points, required_total_spent, required_visit_count, eval_policy
          FROM regular_levels 
          WHERE store_id = p_store_id AND is_active = true 
          ORDER BY level_rank DESC
        LOOP
          -- eval_policy에 따른 조건 확인
          IF v_level.eval_policy = 'AND' THEN
            -- 모든 조건을 만족해야 함
            IF p_points >= v_level.required_points 
               AND p_total_spent >= v_level.required_total_spent 
               AND p_visit_count >= v_level.required_visit_count THEN
              v_level_id := v_level.id;
              EXIT; -- 가장 높은 레벨을 찾았으므로 종료
            END IF;
          ELSE
            -- OR 조건: 하나 이상의 조건을 만족하면 됨
            IF p_points >= v_level.required_points 
               OR p_total_spent >= v_level.required_total_spent 
               OR p_visit_count >= v_level.required_visit_count THEN
              v_level_id := v_level.id;
              EXIT;
            END IF;
          END IF;
        END LOOP;

        RETURN v_level_id;
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.log('✅ calculate_regular_level 함수 생성 완료');

    // 7. 단골 지표 업데이트 함수 생성
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
          last_visit_at, current_level_id, current_level_at,
          created_at, updated_at
        ) VALUES (
          p_user_id, p_store_id, 
          v_new_points, -- 1% 포인트 적립
          p_order_total, 
          1, 
          p_order_date, 
          NULL, 
          NULL,
          p_order_date,
          p_order_date
        )
        ON CONFLICT (user_id, store_id) DO UPDATE SET
          points = user_store_stats.points + v_new_points,
          total_spent = user_store_stats.total_spent + p_order_total,
          visit_count = user_store_stats.visit_count + 1,
          last_visit_at = p_order_date,
          updated_at = p_order_date;

        RAISE NOTICE '✅ 단골 지표 업데이트 완료: 사용자 %, 매장 %, 포인트 +%, 결제액 +%, 방문 +1', 
          p_user_id, p_store_id, v_new_points, p_order_total;
          
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.log('✅ update_user_store_stats 함수 생성 완료');

    // 8. 레벨 혜택 발급 함수 생성
    await client.query(`
      CREATE OR REPLACE FUNCTION issue_level_benefits(
        p_user_id VARCHAR(50),
        p_store_id INTEGER,
        p_level_id INTEGER
      ) RETURNS VOID AS $$
      DECLARE
        v_level RECORD;
        v_benefit JSONB;
      BEGIN
        -- 레벨 정보 조회
        SELECT benefits INTO v_level
        FROM regular_levels
        WHERE id = p_level_id;

        IF NOT FOUND OR v_level.benefits IS NULL THEN
          RETURN;
        END IF;

        -- benefits JSONB 배열을 순회하며 각 혜택 발급
        FOR v_benefit IN SELECT * FROM jsonb_array_elements(v_level.benefits)
        LOOP
          INSERT INTO regular_level_benefit_issues (
            user_id, store_id, level_id, benefit_type, benefit_data, 
            expires_at, issued_at
          ) VALUES (
            p_user_id, p_store_id, p_level_id,
            v_benefit->>'type',
            v_benefit,
            CASE 
              WHEN v_benefit->>'expires_days' IS NOT NULL 
              THEN CURRENT_TIMESTAMP + INTERVAL '1 day' * (v_benefit->>'expires_days')::INTEGER
              ELSE NULL 
            END,
            CURRENT_TIMESTAMP
          );
        END LOOP;

      END;
      $$ LANGUAGE plpgsql;
    `);

    console.log('✅ issue_level_benefits 함수 생성 완료');

    // 9. orders 테이블 업데이트 트리거 함수 생성 (레벨 자동 업데이트 로직 포함)
    await client.query(`
      CREATE OR REPLACE FUNCTION trigger_update_regular_stats_and_level()
      RETURNS TRIGGER AS $$
      DECLARE
        v_old_level_id INTEGER;
        v_new_level_id INTEGER;
        v_user_id TEXT;
        v_store_id INTEGER;
        v_order_date TIMESTAMP;
      BEGIN
        -- 트리거 호출 시점의 이전 레벨 ID 가져오기 (user_store_stats 테이블에서)
        SELECT current_level_id INTO v_old_level_id FROM user_store_stats WHERE user_id = NEW.user_id AND store_id = NEW.store_id;

        -- 주문 상태가 'completed'로 변경되거나, 주문이 처음으로 완료되는 경우에만 처리
        IF NEW.order_status = 'completed' AND (OLD.order_status IS NULL OR OLD.order_status != 'completed') THEN
          -- 단골 지표 업데이트
          PERFORM update_user_store_stats(
            NEW.user_id,
            NEW.store_id,
            NEW.total_amount,
            COALESCE(NEW.order_date, CURRENT_TIMESTAMP)
          );

          -- 업데이트된 지표로 새로운 레벨 계산
          SELECT current_level_id INTO v_new_level_id 
          FROM user_store_stats 
          WHERE user_id = NEW.user_id AND store_id = NEW.store_id;

          -- 레벨 변경이 감지되면 이력 기록 및 혜택 발급
          IF v_new_level_id IS DISTINCT FROM v_old_level_id THEN
            -- user_store_stats에 current_level_at 업데이트
            UPDATE user_store_stats
            SET current_level_at = COALESCE(NEW.order_date, CURRENT_TIMESTAMP)
            WHERE user_id = NEW.user_id AND store_id = NEW.store_id;

            -- 레벨 변경 이력 기록
            INSERT INTO regular_level_history (
              user_id, store_id, from_level_id, to_level_id, reason, changed_at
            ) VALUES (
              NEW.user_id,
              NEW.store_id,
              v_old_level_id,
              v_new_level_id,
              'system', -- 또는 'purchase' 등 더 구체적인 이유
              COALESCE(NEW.order_date, CURRENT_TIMESTAMP)
            );

            -- 새로운 레벨의 혜택 발급 (레벨업인 경우)
            IF v_new_level_id IS NOT NULL AND (v_old_level_id IS NULL OR v_new_level_id > v_old_level_id) THEN
              PERFORM issue_level_benefits(NEW.user_id, NEW.store_id, v_new_level_id);
            END IF;
          END IF;
        END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.log('✅ trigger_update_regular_stats_and_level 함수 생성 완료');

    // 10. 트리거 생성
    await client.query(`
      DROP TRIGGER IF EXISTS orders_regular_stats_level_trigger ON orders;

      CREATE TRIGGER orders_regular_stats_level_trigger
        AFTER UPDATE ON orders
        FOR EACH ROW
        WHEN (OLD.order_status IS DISTINCT FROM NEW.order_status) -- 상태 변경 시에만 실행
        EXECUTE FUNCTION trigger_update_regular_stats_and_level();
    `);

    console.log('✅ orders_regular_stats_level_trigger 트리거 생성 완료');

    // 11. 샘플 레벨 데이터 삽입
    const existingLevels = await client.query('SELECT COUNT(*) FROM regular_levels');

    if (parseInt(existingLevels.rows[0].count) === 0) {
      console.log('📝 샘플 단골 레벨 데이터 생성 중...');

      // 매장 1-10에 대한 샘플 레벨 생성
      for (let storeId = 1; storeId <= 10; storeId++) {
        await client.query(`
          INSERT INTO regular_levels (
            store_id, level_rank, name, description, 
            required_points, required_total_spent, required_visit_count,
            eval_policy, benefits
          ) VALUES
          ($1, 1, '브론즈', '첫 방문 고객', 0, 0, 1, 'OR', 
           '[{"type":"welcome_coupon","name":"신규고객 5% 할인","discount":5,"expires_days":30}]'),
          ($1, 2, '실버', '단골 손님', 100, 50000, 5, 'OR',
           '[{"type":"loyalty_coupon","name":"실버회원 10% 할인","discount":10,"expires_days":30}]'),
          ($1, 3, '골드', '충성 고객', 500, 200000, 15, 'AND',
           '[{"type":"vip_coupon","name":"골드회원 15% 할인","discount":15,"expires_days":60},
             {"type":"free_drink","name":"음료 무료 쿠폰","expires_days":30}]'),
          ($1, 4, '플래티넘', 'VIP 고객', 1000, 500000, 30, 'AND',
           '[{"type":"platinum_coupon","name":"플래티넘 20% 할인","discount":20,"expires_days":90},
             {"type":"priority_service","name":"우선 서비스"},
             {"type":"birthday_special","name":"생일 특별 혜택"}]')
        `, [storeId]);
      }

      console.log('✅ 샘플 단골 레벨 데이터 삽입 완료');
    }

    await client.query('COMMIT');
    console.log('🎉 단골 레벨 시스템 설정 완료!');

    // 12. 시스템 상태 출력
    const levelCount = await client.query('SELECT COUNT(*) as total FROM regular_levels');
    const storeCount = await client.query('SELECT COUNT(DISTINCT store_id) as total FROM regular_levels');

    console.log(`📊 생성된 레벨 수: ${levelCount.rows[0].total}개`);
    console.log(`🏪 레벨이 설정된 매장 수: ${storeCount.rows[0].total}개`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 단골 레벨 시스템 생성 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 실행
if (require.main === module) {
  createRegularLevelSystem()
    .then(() => {
      console.log('✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = createRegularLevelSystem;