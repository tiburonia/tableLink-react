
-- KDS 실시간 이벤트를 위한 PostgreSQL 트리거 함수들

-- 1. 주문 이벤트 알림 함수
CREATE OR REPLACE FUNCTION notify_kds_order_change()
RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify(
    'kds_order_events',
    json_build_object(
      'action', TG_OP,
      'order_id', COALESCE(NEW.id, OLD.id),
      'store_id', COALESCE(NEW.store_id, OLD.store_id),
      'table_num', COALESCE(NEW.table_num, OLD.table_num),
      'status', COALESCE(NEW.session_status, OLD.session_status),
      'timestamp', CURRENT_TIMESTAMP
    )::text
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 1-1. 주문 세션 상태 변경 시 테이블 해제 함수
CREATE OR REPLACE FUNCTION handle_order_session_close()
RETURNS trigger AS $$
DECLARE
  updated_rows integer;
  table_exists boolean;
BEGIN
  -- session_status가 OPEN에서 CLOSE로 변경되었을 때 (더 넓은 조건)
  IF (OLD.session_status IS NULL OR OLD.session_status = 'OPEN') AND NEW.session_status = 'CLOSE' THEN
    
    -- 디버깅 로그
    RAISE NOTICE '트리거 실행: 주문 % 세션 상태 변경 %->% (매장: %, 테이블: %)', 
                 NEW.id, OLD.session_status, NEW.session_status, NEW.store_id, NEW.table_num;
    
    -- store_tables 테이블 존재 여부 확인
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'store_tables'
    ) INTO table_exists;
    
    IF table_exists THEN
      -- 여러 방식으로 테이블 해제 시도
      -- 방법 1: table_number로 매칭 (id 필드)
      UPDATE store_tables 
      SET 
        processing_order_id = NULL,
        status = 'AVAILABLE',
        updated_at = CURRENT_TIMESTAMP
      WHERE store_id = NEW.store_id 
        AND id = NEW.table_num;
        
      GET DIAGNOSTICS updated_rows = ROW_COUNT;
      RAISE NOTICE '방법1(id=%): 업데이트된 행 %개', NEW.table_num, updated_rows;
      
      -- 방법 2: table_number 필드로 매칭 (필드가 존재하는 경우)
      IF updated_rows = 0 THEN
        UPDATE store_tables 
        SET 
          processing_order_id = NULL,
          status = 'AVAILABLE',
          updated_at = CURRENT_TIMESTAMP
        WHERE store_id = NEW.store_id 
          AND table_number = NEW.table_num;
          
        GET DIAGNOSTICS updated_rows = ROW_COUNT;
        RAISE NOTICE '방법2(table_number=%): 업데이트된 행 %개', NEW.table_num, updated_rows;
      END IF;
      
      -- 방법 3: processing_order_id로 매칭
      IF updated_rows = 0 THEN
        UPDATE store_tables 
        SET 
          processing_order_id = NULL,
          status = 'AVAILABLE',
          updated_at = CURRENT_TIMESTAMP
        WHERE store_id = NEW.store_id 
          AND processing_order_id = NEW.id;
          
        GET DIAGNOSTICS updated_rows = ROW_COUNT;
        RAISE NOTICE '방법3(processing_order_id=%): 업데이트된 행 %개', NEW.id, updated_rows;
      END IF;
      
      -- 최종 결과 로그
      IF updated_rows > 0 THEN
        RAISE NOTICE '✅ 테이블 해제 완료: 매장 %, 테이블 %, 주문 %, 업데이트 %행', 
                     NEW.store_id, NEW.table_num, NEW.id, updated_rows;
      ELSE
        RAISE NOTICE '⚠️ 테이블 해제 실패: 매장 % 테이블 %에 해당하는 store_tables 레코드 없음', 
                     NEW.store_id, NEW.table_num;
      END IF;
    ELSE
      RAISE NOTICE '⚠️ store_tables 테이블이 존재하지 않음';
    END IF;
  ELSE
    RAISE NOTICE 'ℹ️ 트리거 조건 불일치: %->% (주문 %)', OLD.session_status, NEW.session_status, NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. 티켓 이벤트 알림 함수
CREATE OR REPLACE FUNCTION notify_kds_ticket_change()
RETURNS trigger AS $$
DECLARE
  store_id_val integer;
BEGIN
  -- order_tickets에서 store_id 가져오기
  SELECT o.store_id INTO store_id_val
  FROM orders o
  WHERE o.id = COALESCE(NEW.order_id, OLD.order_id);

  PERFORM pg_notify(
    'kds_ticket_events',
    json_build_object(
      'action', TG_OP,
      'ticket_id', COALESCE(NEW.id, OLD.id),
      'order_id', COALESCE(NEW.order_id, OLD.order_id),
      'store_id', store_id_val,
      'status', COALESCE(NEW.status, OLD.status),
      'display_status', COALESCE(NEW.display_status, OLD.display_status),
      'timestamp', CURRENT_TIMESTAMP
    )::text
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 3. 아이템 이벤트 알림 함수
CREATE OR REPLACE FUNCTION notify_kds_item_change()
RETURNS trigger AS $$
DECLARE
  store_id_val integer;
BEGIN
  -- order_items에서 store_id 가져오기
  SELECT o.store_id INTO store_id_val
  FROM orders o
  JOIN order_tickets ot ON o.id = ot.order_id
  WHERE ot.id = COALESCE(NEW.ticket_id, OLD.ticket_id);

  PERFORM pg_notify(
    'kds_item_events',
    json_build_object(
      'action', TG_OP,
      'item_id', COALESCE(NEW.id, OLD.id),
      'ticket_id', COALESCE(NEW.ticket_id, OLD.ticket_id),
      'store_id', store_id_val,
      'menu_name', COALESCE(NEW.menu_name, OLD.menu_name),
      'item_status', COALESCE(NEW.item_status, OLD.item_status),
      'cook_station', COALESCE(NEW.cook_station, OLD.cook_station),
      'timestamp', CURRENT_TIMESTAMP
    )::text
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 4. 결제 이벤트 알림 함수 (새 스키마 호환)
CREATE OR REPLACE FUNCTION notify_kds_payment_change()
RETURNS trigger AS $$
DECLARE
  store_id_val integer;
  table_number_val integer;
  ticket_ids_array integer[];
BEGIN
  -- payments에서 order_id를 통해 orders 테이블에서 store_id와 table_num 가져오기
  SELECT o.store_id, o.table_num INTO store_id_val, table_number_val
  FROM orders o
  WHERE o.id = COALESCE(NEW.order_id, OLD.order_id);

  -- payment_details에서 해당 payment의 ticket_id들 가져오기
  SELECT ARRAY_AGG(pd.ticket_id) INTO ticket_ids_array
  FROM payment_details pd
  WHERE pd.payment_id = COALESCE(NEW.id, OLD.id);

  PERFORM pg_notify(
    'kds_payment_events',
    json_build_object(
      'action', TG_OP,
      'payment_id', COALESCE(NEW.id, OLD.id),
      'order_id', COALESCE(NEW.order_id, OLD.order_id),
      'ticket_ids', COALESCE(ticket_ids_array, ARRAY[]::integer[]),
      'store_id', store_id_val,
      'table_number', table_number_val,
      'final_amount', COALESCE(NEW.amount, OLD.amount),
      'status', COALESCE(NEW.status, OLD.status),
      'timestamp', CURRENT_TIMESTAMP
    )::text
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성 (안전한 재생성을 위해 모든 트리거 먼저 삭제)

-- 모든 관련 트리거 삭제
DROP TRIGGER IF EXISTS orders_kds_notify ON orders CASCADE;
DROP TRIGGER IF EXISTS orders_session_close ON orders CASCADE;
DROP TRIGGER IF EXISTS orders_session_status_trigger ON orders CASCADE;
DROP TRIGGER IF EXISTS order_tickets_kds_notify ON order_tickets CASCADE;
DROP TRIGGER IF EXISTS order_items_kds_notify ON order_items CASCADE;
DROP TRIGGER IF EXISTS payments_kds_notify ON payments CASCADE;

-- 잠시 대기 (트랜잭션 정리)
SELECT pg_sleep(0.1);

-- orders 테이블 트리거 (KDS 알림)
CREATE TRIGGER orders_kds_notify
  AFTER INSERT OR UPDATE OR DELETE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_kds_order_change();

-- orders 테이블 트리거 (세션 상태 변경 시 테이블 해제)
CREATE TRIGGER orders_session_close
  AFTER UPDATE ON orders
  FOR EACH ROW
  WHEN (OLD.session_status IS DISTINCT FROM NEW.session_status)
  EXECUTE FUNCTION handle_order_session_close();

-- order_tickets 테이블 트리거 (상태 변경만 감지)
CREATE TRIGGER order_tickets_kds_notify
  AFTER UPDATE OF status, display_status ON order_tickets
  FOR EACH ROW
  EXECUTE FUNCTION notify_kds_ticket_change();

-- order_items 테이블 트리거 (아이템 상태 변경만 감지)
CREATE TRIGGER order_items_kds_notify
  AFTER UPDATE OF item_status ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION notify_kds_item_change();

-- payments 테이블 트리거 (결제 완료 감지)
CREATE TRIGGER payments_kds_notify
  AFTER INSERT OR UPDATE OF status ON payments
  FOR EACH ROW
  EXECUTE FUNCTION notify_kds_payment_change();

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_order_tickets_status ON order_tickets(status, updated_at);
CREATE INDEX IF NOT EXISTS idx_order_items_status ON order_items(item_status, updated_at);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status, created_at);

COMMENT ON FUNCTION notify_kds_order_change() IS 'KDS 주문 변경 실시간 알림 함수';
COMMENT ON FUNCTION handle_order_session_close() IS '주문 세션 종료 시 테이블 해제 처리 함수';
COMMENT ON FUNCTION notify_kds_ticket_change() IS 'KDS 티켓 변경 실시간 알림 함수';
COMMENT ON FUNCTION notify_kds_item_change() IS 'KDS 아이템 변경 실시간 알림 함수';
COMMENT ON FUNCTION notify_kds_payment_change() IS 'KDS 결제 변경 실시간 알림 함수 (새 스키마 호환)';
