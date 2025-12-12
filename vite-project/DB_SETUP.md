# PostgreSQL 데이터베이스 설정 가이드

## 📦 개요

TableLink vite-project는 **Neon PostgreSQL** 데이터베이스를 사용하여 매장, 사용자, 주문 등의 데이터를 관리합니다.

## 🔧 설치 및 설정

### 1. 환경 변수 설정

`.env` 파일에 PostgreSQL 연결 문자열을 추가합니다:

```env
DATABASE_URL=postgresql://neondb_owner:npg_7LsUSBauDf6g@ep-royal-morning-a1c4rtwd-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### 2. 필요한 패키지 설치

```bash
npm install pg dotenv
npm install --save-dev @types/node @types/pg
```

## 📁 파일 구조

```
src/utils/db/
├── pool.ts              # PostgreSQL 연결 풀 관리
├── types.ts             # TypeScript 인터페이스 정의
├── storeService.ts      # 매장 관련 DB 함수
├── userService.ts       # 사용자 관련 DB 함수
└── index.ts             # 모듈 인덱스
```

## 🔗 주요 함수

### Pool 관리

```typescript
import { initializePool, getPool, testConnection, query, transaction, closePool } from '@/utils/db'

// 연결 테스트
const isConnected = await testConnection()

// 쿼리 실행
const results = await query('SELECT * FROM stores')

// 트랜잭션 사용
await transaction(async (client) => {
  // 트랜잭션 내 작업
})
```

### 매장 (Store) 함수

```typescript
import { 
  getAllStores, 
  getStoreById, 
  getStoresByCategory, 
  getNearbyStores, 
  createStore, 
  updateStore, 
  deleteStore, 
  searchStores 
} from '@/utils/db'

// 모든 매장 조회
const stores = await getAllStores()

// ID로 조회
const store = await getStoreById('store-id')

// 카테고리별 조회
const categoryStores = await getStoresByCategory('카페')

// 위치 기반 조회 (반경 5km)
const nearbyStores = await getNearbyStores(37.5665, 126.9780, 5)

// 매장 생성
const newStore = await createStore('새로운 가게', '서울시 강남구', 37.5665, 126.9780, {
  phone: '02-1234-5678',
  category: '음식점',
  description: '맛있는 식당'
})

// 매장 업데이트
const updated = await updateStore('store-id', { name: '수정된 이름' })

// 매장 삭제
const deleted = await deleteStore('store-id')

// 검색
const results = await searchStores('카페')
```

### 사용자 (User) 함수

```typescript
import { 
  getAllUsers, 
  getUserById, 
  getUserByEmail, 
  createUser, 
  updateUser, 
  deleteUser 
} from '@/utils/db'

// 모든 사용자 조회
const users = await getAllUsers()

// ID로 조회
const user = await getUserById('user-id')

// 이메일로 조회
const user = await getUserByEmail('user@example.com')

// 사용자 생성
const newUser = await createUser('user@example.com', '사용자명', {
  phone: '010-1234-5678'
})

// 사용자 업데이트
const updated = await updateUser('user-id', { name: '새로운 이름' })

// 사용자 삭제
const deleted = await deleteUser('user-id')
```

## 📊 데이터베이스 스키마

### stores 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | 기본 키 |
| name | VARCHAR | 매장명 |
| address | VARCHAR | 주소 |
| phone | VARCHAR | 전화번호 |
| latitude | DECIMAL | 위도 |
| longitude | DECIMAL | 경도 |
| category | VARCHAR | 카테고리 |
| rating | DECIMAL | 평점 (0-5) |
| description | TEXT | 설명 |
| opening_hours | VARCHAR | 영업시간 |
| created_at | TIMESTAMP | 생성 일시 |
| updated_at | TIMESTAMP | 수정 일시 |

### users 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | 기본 키 |
| email | VARCHAR | 이메일 (UNIQUE) |
| name | VARCHAR | 이름 |
| phone | VARCHAR | 전화번호 |
| created_at | TIMESTAMP | 생성 일시 |
| updated_at | TIMESTAMP | 수정 일시 |

## 🧪 데이터베이스 테스트

`DatabaseTest` 컴포넌트를 사용하여 연결을 테스트할 수 있습니다:

```tsx
import { DatabaseTest } from '@/components/DatabaseTest'

export function App() {
  return <DatabaseTest />
}
```

## 🔒 보안 주의사항

⚠️ **중요**: 프로덕션 환경에서는 다음을 확인하세요:

1. `.env` 파일을 `.gitignore`에 추가했는지 확인
2. 데이터베이스 암호를 안전하게 관리
3. SSL 연결 사용 (sslmode=require)
4. 최소 권한 원칙 적용

## 🐛 트러블슈팅

### "DATABASE_URL이 설정되지 않았습니다" 오류

- `.env` 파일이 프로젝트 루트에 있는지 확인
- `DATABASE_URL` 변수가 올바르게 설정되었는지 확인

### 연결 시간 초과

- 인터넷 연결 확인
- 데이터베이스 호스트가 접근 가능한지 확인
- 방화벽 설정 확인

### 권한 오류

- 사용자 계정이 필요한 권한을 가지고 있는지 확인
- 데이터베이스 역할(ROLE) 설정 확인

## 📚 참고 자료

- [PostgreSQL 공식 문서](https://www.postgresql.org/docs/)
- [node-postgres (pg) 문서](https://node-postgres.com/)
- [Neon PostgreSQL](https://neon.tech/)

## 💡 팁

- 쿼리 파라미터를 항상 사용하여 SQL Injection 방지
- 연결 풀을 사용하여 성능 최적화
- 트랜잭션을 사용하여 데이터 일관성 보장
