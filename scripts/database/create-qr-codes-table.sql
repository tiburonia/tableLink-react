
-- QR 코드 테이블 생성
CREATE TABLE IF NOT EXISTS qr_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(100) UNIQUE NOT NULL,
  store_id INTEGER NOT NULL REFERENCES stores(id),
  table_number INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 샘플 QR 코드 데이터
INSERT INTO qr_codes (code, store_id, table_number) VALUES
('TABLE_1', 1, 1),
('TABLE_2', 1, 2),
('TABLE_3', 1, 3),
('TABLE_4', 1, 4),
('TABLE_5', 1, 5);

-- KDS 이벤트 알림을 위한 트리거 함수
CREATE OR REPLACE FUNCTION notify_kds_line_event()
RETURNS TRIGGER AS $$
BEGIN
  -- order_lines 변경 시 KDS에 알림
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
