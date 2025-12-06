
-- 트리거 테스트 스크립트

-- 1. 현재 등록된 트리거 확인
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers 
WHERE trigger_name LIKE '%session%' OR trigger_name LIKE '%order%';

-- 2. store_tables 테이블 구조 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'store_tables'
ORDER BY ordinal_position;

-- 3. orders 테이블의 session_status 필드 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'orders' AND column_name LIKE '%status%'
ORDER BY ordinal_position;

-- 4. 테스트용 orders 레코드 생성 및 업데이트
-- (실제 실행 전 데이터 확인 필요)
/*
INSERT INTO orders (store_id, table_num, session_status, total_price) 
VALUES (1, 1, 'OPEN', 10000);

UPDATE orders 
SET session_status = 'CLOSE' 
WHERE store_id = 1 AND table_num = 1 AND session_status = 'OPEN';
*/

-- 5. store_tables 상태 확인
SELECT * FROM store_tables WHERE store_id = 1 LIMIT 5;

-- 6. 최근 로그 확인 (PostgreSQL 로그에서 NOTICE 메시지 확인)
-- psql에서 \set VERBOSITY verbose 설정 후 테스트 실행
