
-- KDS 출력 시간 추적을 위한 컬럼 추가
ALTER TABLE order_tickets 
ADD COLUMN IF NOT EXISTS printed_at TIMESTAMP DEFAULT NULL;

-- 출력 상태 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_order_tickets_printed_at ON order_tickets(printed_at);

COMMENT ON COLUMN order_tickets.printed_at IS 'KDS에서 출력된 시간';
