
-- KDS 출력 시간 추적을 위한 컬럼 추가
ALTER TABLE order_tickets 
ADD COLUMN IF NOT EXISTS printed_at TIMESTAMP DEFAULT NULL;

-- 출력 상태 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_order_tickets_printed_at ON order_tickets(printed_at);

COMMENT ON COLUMN order_tickets.printed_at IS 'KDS에서 출력된 시간';
-- order_tickets 테이블에 printed_at 컬럼 추가
ALTER TABLE order_tickets 
ADD COLUMN IF NOT EXISTS printed_at TIMESTAMP NULL;

-- 기존 PRINTED 상태인 레코드들에 대해 printed_at 설정
UPDATE order_tickets 
SET printed_at = updated_at 
WHERE print_status = 'PRINTED' AND printed_at IS NULL;

-- 인덱스 추가 (출력 대기 목록 조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_order_tickets_print_status_created 
ON order_tickets(print_status, created_at) 
WHERE print_status IN ('WAITING', 'PRINTED');

-- 주방에서 출력 완료된 항목들을 빠르게 조회하기 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_order_tickets_printed_at 
ON order_tickets(printed_at DESC) 
WHERE printed_at IS NOT NULL;
