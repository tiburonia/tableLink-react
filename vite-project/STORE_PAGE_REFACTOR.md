# Store Page 리팩토링

레거시 시스템(TLG)의 `renderStore`와 유사한 구조로 React 컴포넌트 기반의 StorePage를 구현했습니다.

## 📁 구조

```
src/pages/Store/
├── StorePage.tsx              # 메인 페이지
├── StorePage.css             # 스타일
├── components/               # UI 컴포넌트
│   ├── PromotionCard.tsx    # 🎁 진행중인 혜택 카드 (NEW)
│   ├── PromotionCard.css    
│   ├── TopUsersCard.tsx     # 👑 단골 고객 카드 (NEW)
│   ├── TopUsersCard.css     
│   ├── StoreHeader.tsx      # 헤더 (즐겨찾기 버튼 추가)
│   ├── StoreHero.tsx        # 히어로 섹션 (breadcrumb 추가)
│   ├── RatingSummary.tsx    # 평점 요약 (찜 개수 추가)
│   ├── TabNavigation.tsx    # 탭 네비게이션
│   ├── InfoTab.tsx          # 정보 탭
│   ├── MenuTab.tsx          # 메뉴 탭
│   ├── ReviewTab.tsx        # 리뷰 탭
│   ├── BottomActions.tsx    # 하단 액션 버튼
│   └── ...기타 컴포넌트
├── hooks/                    # 커스텀 훅
│   ├── useStoreData.ts      # 매장 데이터 관리 (NEW)
│   ├── useStoreTabs.ts      # 탭 관리 (NEW)
│   └── index.ts
└── constants.ts             # 상수

```

## ✨ 주요 변경사항

### 1. **새로운 컴포넌트 추가**

#### PromotionCard (프로모션 카드)
- 레거시 시스템의 `promotionCardHTML` 모듈을 React 컴포넌트로 변환
- 진행중인 혜택을 카드 형태로 표시
- 로딩 스켈레톤 UI 포함
- 그라데이션 배경 및 glassmorphism 스타일 적용

#### TopUsersCard (단골 고객 카드)
- 레거시 시스템의 `topUsersHTML` 모듈을 React 컴포넌트로 변환
- 상위 단골 고객 랭킹 표시
- 방문 횟수, 결제 금액 등 통계 표시
- VIP, GOLD, SILVER 등 등급별 색상 적용

### 2. **커스텀 훅 구현**

#### useStoreData
- 매장 데이터 로딩 및 상태 관리
- 즐겨찾기 토글 기능
- 데이터 리페칭 기능

#### useStoreTabs
- 탭 전환 로직 분리
- 탭 전환 시 스크롤 자동 이동

### 3. **기존 컴포넌트 개선**

#### StoreHeader
- 즐겨찾기 버튼 추가
- SVG 아이콘으로 교체
- active 상태 스타일링

#### StoreHero
- breadcrumb (경로) 표시 추가
- region 정보 표시
- 레거시 시스템과 동일한 레이아웃

#### RatingSummary
- 찜 개수 표시 추가
- 리뷰 개수와 함께 표시

#### BottomActions
- storeId와 storeName props 추가
- 액션 핸들러 분리

### 4. **타입 정의 확장**

```typescript
// Main/types.ts
export interface Store {
  // ... 기존 속성
  reviewCount?: number      // 리뷰 개수
  favoriteCount?: number    // 찜 개수
  isFavorite?: boolean      // 즐겨찾기 여부
  region?: {                // 지역 정보
    sido?: string
    sigungu?: string
    eupmyeondong?: string
  }
}
```

## 🎨 스타일링

### Glassmorphism 효과
- `backdrop-filter: blur(10px)` 적용
- 반투명 배경색으로 모던한 느낌

### 그라데이션 배경
- 프로모션 카드: `#667eea` → `#764ba2`
- 단골 고객 카드: `#f093fb` → `#f5576c`

### 애니메이션
- 로딩 스켈레톤: shimmer 효과
- 호버 효과: transform, background transition
- 라이브 인디케이터: pulse 애니메이션

## 🔄 API 연동

현재는 임시 데이터를 사용하고 있으며, 추후 다음 API를 연동해야 합니다:

```typescript
// TODO: 구현 필요
- storeService.getPromotions(storeId)  // 프로모션 목록
- storeService.getTopUsers(storeId)    // 단골 고객 목록
- storeService.toggleFavorite(storeId, userPk)  // 즐겨찾기 토글
```

## 🚀 사용 방법

```tsx
import { StorePage } from '@/pages/Store'

// 라우터 설정
<Route path="/store/:storeId" element={<StorePage />} />
```

## 📝 레거시 시스템 참조

이 구현은 다음 레거시 파일들을 참조했습니다:

- `/server/TLG/pages/store/renderStore.js` - 메인 렌더링 로직
- `/server/TLG/pages/store/controllers/storeController.js` - 컨트롤러
- `/server/TLG/pages/store/services/storeService.js` - 서비스 로직
- `/server/TLG/pages/store/views/storeView.js` - 뷰 로직
- `/server/TLG/pages/store/views/modules/promotionCardHTML.js` - 프로모션 카드
- `/server/TLG/pages/store/views/modules/topUsersHTML.js` - 단골 고객 카드

## 🎯 향후 작업

1. [ ] 실제 API 연동
2. [ ] 프로모션 상세 페이지 구현
3. [ ] 단골 고객 전체 랭킹 페이지
4. [ ] QR 주문 페이지 연결
5. [ ] 예약 페이지 연결
6. [ ] 메뉴 탭 실제 데이터 연동
7. [ ] 리뷰 탭 실제 데이터 연동
