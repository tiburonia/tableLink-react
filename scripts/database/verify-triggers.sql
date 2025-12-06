
-- 트리거 설정 확인 스크립트

-- 1. 현재 등록된 트리거 목록
SELECT 
  schemaname,
  tablename,
  triggername,
  tgtype,
  tgenabled
FROM pg_catalog.pg_trigger 
JOIN pg_catalog.pg_class ON tgrelid = pg_class.oid
JOIN pg_catalog.pg_namespace ON relnamespace = pg_namespace.oid
WHERE tgname NOT LIKE 'RI_%'
  AND schemaname = 'public'
  AND tablename IN ('orders', 'order_tickets', 'order_items', 'payments')
ORDER BY tablename, triggername;

-- 2. 트리거 함수 확인
SELECT 
  routine_name,
  routine_type,
  created
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name LIKE '%kds%'
ORDER BY routine_name;

-- 3. 테스트용 주문 세션 상태 업데이트 (실제 테이블에 데이터가 있는 경우)
-- 주의: 실제 데이터에 영향을 주므로 신중하게 사용
/*
SELECT 'Testing trigger...' as status;
UPDATE orders 
SET session_status = 'CLOSE' 
WHERE session_status = 'OPEN' 
  AND id IN (SELECT id FROM orders WHERE session_status = 'OPEN' LIMIT 1);
*/
