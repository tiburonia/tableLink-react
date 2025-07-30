
# 데이터베이스 스크립트

이 폴더에는 데이터베이스 초기화 및 마이그레이션을 위한 1회성 스크립트들이 포함되어 있습니다.

## 스크립트 목록

### 테이블 구조 관련
- `create-orders-table.js` - orders 테이블 생성 및 샘플 데이터 삽입
- `update-orders-table.js` - orders 테이블에 table_unique_id 컬럼 추가
- `update-table-schema.js` - store_tables 테이블 스키마 업데이트 및 특별 테이블 추가

### 데이터 정리 관련
- `cleanup-duplicate-vip.js` - 중복된 소문자 vip룸 테이블 삭제
- `fix-payment-issue.js` - 결제 처리 오류 수정 (unique_id 컬럼 추가)

### 주소 데이터 관련
- `add-address-column.js` - stores 테이블에 address 컬럼 추가 및 카카오 API로 주소 조회
- `remove-zipcode.js` - 매장 주소에서 우편번호 제거

### 별점 데이터 관련
- `update-ratings.js` - 모든 매장의 별점 평균 업데이트

## 사용법

```bash
# 예시: orders 테이블 생성
node scripts/database/create-orders-table.js

# 예시: 별점 평균 업데이트
node scripts/database/update-ratings.js
```

⚠️ **주의사항**: 이 스크립트들은 1회성 실행용입니다. 프로덕션 환경에서 실행하기 전에 반드시 백업을 수행하세요.
