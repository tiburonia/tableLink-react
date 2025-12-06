TableLink 데이터베이스 마이그레이션 가이드
=========================================

📁 파일 목록:
- tablelink_full_dump_20251008_101231.sql : 전체 데이터베이스 덤프
- restore_database.sh : 복원 스크립트
- README.txt : 이 파일

📊 포함된 테이블 (20개):
- administrative_areas
- coupons
- favorites
- global_regular_levels
- guests
- notifications
- order_adjustments
- order_items
- order_tickets
- orders
- payment_details
- payments
- pending_payments
- refunds
- reservations
- review_repiles
- reviews
- store_addresses
- store_hours
- store_info
(+ 추가 테이블들)

🔧 사용 방법:

1. 새 Replit 프로젝트에서 PostgreSQL 데이터베이스 생성

2. 이 폴더의 파일들을 새 프로젝트로 복사

3. Shell에서 복원 스크립트 실행:
   chmod +x restore_database.sh
   ./restore_database.sh $DATABASE_URL

4. 또는 수동으로 복원:
   psql $DATABASE_URL < tablelink_full_dump_20251008_101231.sql

⚠️ 주의사항:
- PostGIS 확장이 필요합니다 (자동 설치됨)
- 대상 데이터베이스는 빈 상태여야 합니다
- DATABASE_URL 환경변수가 설정되어 있어야 합니다

🔗 원본 데이터베이스:
- PostgreSQL 16.9
- PostGIS 확장 포함
- Neon 호스팅

생성일: 2024-10-08
