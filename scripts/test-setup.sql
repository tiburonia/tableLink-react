
-- 테스트 환경 초기화

-- QR 코드 테이블이 없으면 생성
CREATE TABLE IF NOT EXISTS qr_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(100) UNIQUE NOT NULL,
  store_id INTEGER NOT NULL REFERENCES stores(id),
  table_number INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 테스트용 QR 코드 추가
INSERT INTO qr_codes (code, store_id, table_number) VALUES
('TABLE_1', 1, 1),
('TABLE_2', 1, 2), 
('TABLE_3', 1, 3),
('TABLE_4', 1, 4),
('TABLE_5', 1, 5)
ON CONFLICT (code) DO NOTHING;

-- 기존 테스트 데이터 정리
DELETE FROM payments WHERE check_id IN (SELECT id FROM checks WHERE store_id = 1);
DELETE FROM adjustments WHERE check_id IN (SELECT id FROM checks WHERE store_id = 1);
DELETE FROM line_options WHERE line_id IN (
  SELECT ol.id FROM order_lines ol 
  JOIN orders o ON o.id = ol.order_id 
  JOIN checks c ON c.id = o.check_id 
  WHERE c.store_id = 1
);
DELETE FROM order_lines WHERE order_id IN (
  SELECT o.id FROM orders o 
  JOIN checks c ON c.id = o.check_id 
  WHERE c.store_id = 1
);
DELETE FROM order_events WHERE check_id IN (SELECT id FROM checks WHERE store_id = 1);
DELETE FROM orders WHERE check_id IN (SELECT id FROM checks WHERE store_id = 1);
DELETE FROM checks WHERE store_id = 1;

-- AUTO INCREMENT 리셋
SELECT setval('checks_id_seq', COALESCE((SELECT MAX(id) FROM checks), 1), false);
SELECT setval('orders_id_seq', COALESCE((SELECT MAX(id) FROM orders), 1), false);
SELECT setval('order_lines_id_seq', COALESCE((SELECT MAX(id) FROM order_lines), 1), false);
SELECT setval('payments_id_seq', COALESCE((SELECT MAX(id) FROM payments), 1), false);

-- KDS 알림 트리거 함수
CREATE OR REPLACE FUNCTION notify_kds_line_event()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('kds_line_events', 
    json_build_object(
      'line_id', COALESCE(NEW.id, OLD.id),
      'order_id', COALESCE(NEW.order_id, OLD.order_id),
      'status', COALESCE(NEW.status, 'deleted'),
      'event_type', TG_OP,
      'timestamp', EXTRACT(epoch FROM NOW())
    )::text
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS order_lines_notify_trigger ON order_lines;
CREATE TRIGGER order_lines_notify_trigger
  AFTER INSERT OR UPDATE OR DELETE ON order_lines
  FOR EACH ROW EXECUTE FUNCTION notify_kds_line_event();
