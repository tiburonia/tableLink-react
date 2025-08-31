
#!/bin/bash

echo "🧪 TableLink POS/KDS/TLL/KRP 통합 테스트"
echo "==============================================="

BASE_URL="http://localhost:5000"

# AC-1: TLL에서 후라이드 2개 주문시 order_lines 두 줄 생성, 그 중 1개만 취소 가능

echo ""
echo "🧪 AC-1: TLL 주문 라인 개별 취소 테스트"
echo "-------------------------------------------"

echo "1) 체크 생성 (TLL QR)"
curl -X POST ${BASE_URL}/api/tll/checks/from-qr \
  -H "Content-Type: application/json" -H "X-Store-Id: 1" \
  -d '{"qr_code":"TABLE_3","user_id":"u1"}' | jq '.'

echo -e "\n2) 주문 생성 (TLL)"
curl -X POST ${BASE_URL}/api/tll/orders \
  -H "Content-Type: application/json" -H "X-Store-Id: 1" -H "Idempotency-Key: idem-001" \
  -d '{"check_id":1,"ext_key":"ord-001"}' | jq '.'

echo -e "\n3) 후라이드 2개 라인 추가"
curl -X POST ${BASE_URL}/api/tll/order-lines/bulk \
  -H "Content-Type: application/json" -H "X-Store-Id: 1" \
  -d '{"order_id":1,"items":[{"menu_name":"후라이드","unit_price":18000,"count":2,"cook_station":"FRY"}]}' | jq '.'

echo -e "\n4) 두 번째 라인 취소"
curl -X PATCH ${BASE_URL}/api/pos/order-lines/2 \
  -H "Content-Type: application/json" -H "X-Store-Id: 1" \
  -d '{"status":"canceled"}' | jq '.'

echo ""
echo "🧪 AC-2: POS 요약에서 취소 라인 제외 총액 계산"
echo "-----------------------------------------------"

echo "5) 체크 요약 조회 (취소 1개 제외하여 18000원이어야 함)"
curl ${BASE_URL}/api/pos/checks/1/summary -H "X-Store-Id: 1" | jq '.'

echo ""
echo "🧪 AC-3: 결제 Idempotency 및 체크 닫기"
echo "--------------------------------------"

echo "6) 첫 번째 결제 (18000원)"
curl -X POST ${BASE_URL}/api/payments \
  -H "Content-Type: application/json" -H "X-Store-Id: 1" -H "Idempotency-Key: idem-pay-001" \
  -d '{"check_id":1,"method":"card","amount":18000}' | jq '.'

echo -e "\n7) 동일 Idempotency-Key로 중복 결제 시도 (차단되어야 함)"
curl -X POST ${BASE_URL}/api/payments \
  -H "Content-Type: application/json" -H "X-Store-Id: 1" -H "Idempotency-Key: idem-pay-001" \
  -d '{"check_id":1,"method":"card","amount":18000}' | jq '.'

echo -e "\n8) 체크 상태 확인 (closed가 되어야 함)"
curl ${BASE_URL}/api/pos/checks/1/summary -H "X-Store-Id: 1" | jq '.check_status // "Status not in response"'

echo ""
echo "🧪 AC-5: served 라인 취소 시도 (409 에러)"
echo "----------------------------------------"

echo "9) 새 체크/주문/라인 생성"
curl -X POST ${BASE_URL}/api/tll/checks/from-qr \
  -H "Content-Type: application/json" -H "X-Store-Id: 1" \
  -d '{"qr_code":"TABLE_4","user_id":"u1"}' | jq '.'

curl -X POST ${BASE_URL}/api/tll/orders \
  -H "Content-Type: application/json" -H "X-Store-Id: 1" -H "Idempotency-Key: idem-002" \
  -d '{"check_id":2,"ext_key":"ord-002"}' | jq '.'

curl -X POST ${BASE_URL}/api/tll/order-lines/bulk \
  -H "Content-Type: application/json" -H "X-Store-Id: 1" \
  -d '{"order_id":2,"items":[{"menu_name":"치킨","unit_price":20000,"count":1,"cook_station":"FRY"}]}' | jq '.'

echo -e "\n10) 라인을 served 상태로 변경"
curl -X PATCH ${BASE_URL}/api/pos/order-lines/3 \
  -H "Content-Type: application/json" -H "X-Store-Id: 1" \
  -d '{"status":"served"}' | jq '.'

echo -e "\n11) served 라인 취소 시도 (409 에러가 나와야 함)"
curl -X PATCH ${BASE_URL}/api/pos/order-lines/3 \
  -H "Content-Type: application/json" -H "X-Store-Id: 1" \
  -d '{"status":"canceled"}' | jq '.'

echo ""
echo "🧪 AC-4: KDS 실시간 알림 테스트"
echo "------------------------------"
echo "브라우저에서 http://localhost:5000/kds-demo.html 열고"
echo "매장 ID: 1 입력 후 연결 버튼 클릭"
echo "그 다음 아래 명령어로 라인 상태 변경하면서 실시간 수신 확인:"
echo ""
echo "curl -X PATCH ${BASE_URL}/api/kds/lines/1 -H \"Content-Type: application/json\" -H \"X-Store-Id: 1\" -d '{\"status\":\"cooking\"}'"
echo "curl -X PATCH ${BASE_URL}/api/kds/lines/1 -H \"Content-Type: application/json\" -H \"X-Store-Id: 1\" -d '{\"status\":\"ready\"}'"

echo ""
echo "✅ 테스트 스크립트 완료"
echo "브라우저 테스트: http://localhost:5000/pos-demo.html"
echo "KDS 실시간: http://localhost:5000/kds-demo.html"
