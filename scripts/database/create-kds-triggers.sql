
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
BEGIN
  -- session_status가 OPEN에서 CLOSE로 변경되었을 때
  IF OLD.session_status = 'OPEN' AND NEW.session_status = 'CLOSE' THEN
    -- 해당 테이블의 processing_order_id를 null로 설정하고 status를 AVAILABLE로 변경
    UPDATE store_tables 
    SET 
      processing_order_id = NULL,
      status = 'AVAILABLE',
      updated_at = CURRENT_TIMESTAMP
    WHERE store_id = NEW.store_id 
      AND table_number = NEW.table_num 
      AND (processing_order_id = NEW.id OR processing_order_id IS NULL);
      
    GET DIAGNOSTICS updated_rows = ROW_COUNT;
    
    -- 로그 출력
    RAISE NOTICE '테이블 해제: 매장 %, 테이블 %, 주문 %, 업데이트된 행: %', 
                 NEW.store_id, NEW.table_num, NEW.id, updated_rows;
                 
    -- store_tables 테이블이 없거나 해당 테이블이 없는 경우에도 처리
    IF updated_rows = 0 THEN
      RAISE NOTICE '경고: 매장 % 테이블 %에 해당하는 store_tables 레코드를 찾을 수 없음', 
                   NEW.store_id, NEW.table_num;
    END IF;
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

-- 트리거 생성

-- orders 테이블 트리거 (KDS 알림)
DROP TRIGGER IF EXISTS orders_kds_notify ON orders;
CREATE TRIGGER orders_kds_notify
  AFTER INSERT OR UPDATE OR DELETE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_kds_order_change();

-- orders 테이블 트리거 (세션 상태 변경 시 테이블 해제)
DROP TRIGGER IF EXISTS orders_session_close ON orders;
CREATE TRIGGER orders_session_close
  AFTER UPDATE OF session_status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION handle_order_session_close();

-- order_tickets 테이블 트리거 (상태 변경만 감지)
DROP TRIGGER IF EXISTS order_tickets_kds_notify ON order_tickets;
CREATE TRIGGER order_tickets_kds_notify
  AFTER UPDATE OF status, display_status ON order_tickets
  FOR EACH ROW
  EXECUTE FUNCTION notify_kds_ticket_change();

-- order_items 테이블 트리거 (아이템 상태 변경만 감지)
DROP TRIGGER IF EXISTS order_items_kds_notify ON order_items;
CREATE TRIGGER order_items_kds_notify
  AFTER UPDATE OF item_status ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION notify_kds_item_change();

-- payments 테이블 트리거 (결제 완료 감지)
DROP TRIGGER IF EXISTS payments_kds_notify ON payments;
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
