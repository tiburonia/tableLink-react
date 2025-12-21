# Store 페이지 아키텍처

## 📐 Feature-Sliced Design (FSD) 구조

```
Store/
├── ui/                          # 재사용 가능한 UI 컴포넌트
│   ├── StoreHeader/             # 헤더
│   ├── StoreHero/               # 히어로 섹션
│   ├── TabNavigation/           # 탭 네비게이션
│   ├── BottomActions/           # 하단 액션 버튼
│   ├── LoadingState/            # 로딩 상태
│   ├── ErrorState/              # 에러 상태
│   ├── PhotoModal/              # 사진 모달
│   ├── StarRating/              # 별점
│   └── index.ts                 # Public API
│
├── features/                    # 비즈니스 기능
│   ├── info/                    # 매장 정보 기능
│   │   ├── ui/                  # UI 컴포넌트
│   │   │   ├── InfoTab.tsx
│   │   │   ├── BusinessHours.tsx
│   │   │   ├── LocationInfo.tsx
│   │   │   ├── AmenitiesSection.tsx
│   │   │   └── PhotoGallery.tsx
│   │   └── index.ts
│   │
│   ├── menu/                    # 메뉴 기능
│   │   ├── ui/
│   │   │   ├── MenuTab.tsx
│   │   │   ├── MenuList.tsx
│   │   │   └── MenuItem.tsx
│   │   └── index.ts
│   │
│   ├── review/                  # 리뷰 기능
│   │   ├── ui/
│   │   │   ├── ReviewTab.tsx
│   │   │   ├── ReviewList.tsx
│   │   │   ├── ReviewItem.tsx
│   │   │   ├── ReviewSummarySection.tsx
│   │   │   └── RatingSummary.tsx
│   │   └── index.ts
│   │
│   ├── promotion/               # 프로모션 기능
│   │   ├── ui/
│   │   │   ├── PromotionSection.tsx
│   │   │   └── PromotionCard.tsx
│   │   └── index.ts
│   │
│   ├── table/                   # 테이블 기능
│   │   ├── ui/
│   │   │   ├── TableInfo.tsx
│   │   │   └── TopUsersCard.tsx
│   │   └── index.ts
│   │
│   ├── regular/                 # 단골 기능
│   │   ├── ui/
│   │   │   └── RegularTab.tsx
│   │   └── index.ts
│   │
│   └── storeInfo/               # 매장 상세 정보
│       ├── ui/
│       │   ├── StoreInfoTab.tsx
│       │   └── StoreInfo.tsx
│       └── index.ts
│
├── model/                       # 비즈니스 로직 & 데이터
│   ├── hooks/                   # React Hooks
│   │   ├── useStoreData.ts
│   │   ├── useStoreTabs.ts
│   │   └── index.ts
│   ├── constants.ts             # 상수
│   └── index.ts
│
├── lib/                         # 유틸리티
│   └── (future utilities)
│
├── data/                        # 더미 데이터
│   └── dummyReviews.ts
│
├── StorePage.tsx                # 메인 페이지
├── StorePage.module.css         # 페이지 스타일
└── index.ts                     # Public API

```

## 🎯 아키텍처 원칙

### 1. 레이어 구분
- **ui/**: 순수 UI 컴포넌트 (로직 최소화)
- **features/**: 비즈니스 기능 단위
- **model/**: 데이터 & 로직
- **lib/**: 유틸리티 함수

### 2. Import 규칙
```tsx
// ✅ Good: 레이어별 import
import { StoreHeader } from './ui'
import { ReviewTab } from './features/review'
import { useStoreData } from './model/hooks'

// ❌ Bad: 직접 파일 import
import { StoreHeader } from './ui/StoreHeader/StoreHeader'
```

### 3. 의존성 방향
```
StorePage.tsx
    ↓
features/* → ui/* → model/*
    ↓         ↓
  model/*   lib/*
```

- 상위 레이어는 하위 레이어 import 가능
- 하위 레이어는 상위 레이어 import 불가

### 4. 파일 구조
```
ComponentName/
├── ComponentName.tsx           # 컴포넌트
├── ComponentName.module.css    # 스타일 (CSS Module)
├── ComponentName.test.tsx      # 테스트 (선택)
└── index.ts                    # Re-export
```

## 📝 작명 규칙

- **폴더**: camelCase (info, review, storeInfo)
- **컴포넌트**: PascalCase (ReviewTab, MenuItem)
- **파일**: 컴포넌트명과 동일
- **CSS Module**: ComponentName.module.css
- **Hooks**: use + 기능명 (useStoreData)

## 🔄 마이그레이션 완료

### Before (55개 파일 혼재)
```
Store/
└── components/  (55개 파일)
    ├── ReviewTab.tsx
    ├── ReviewItem.tsx
    ├── ReviewItem.css
    ├── ReviewItem.module.css
    ├── ReviewItem.backup
    ├── ReviewItem.new.tsx
    └── ... (혼란!)
```

### After (FSD 구조)
```
Store/
├── ui/          (8개 공통 컴포넌트)
├── features/    (7개 기능)
├── model/       (비즈니스 로직)
└── lib/         (유틸리티)
```

## ✅ 장점

1. **명확한 책임 분리**: 각 폴더가 명확한 역할
2. **확장 용이**: 새 기능 추가 시 features에 추가
3. **재사용성**: ui 컴포넌트 다른 페이지에서 재사용
4. **유지보수**: 파일 찾기 쉬움
5. **테스트**: 기능별로 독립적 테스트 가능

## 🚀 다음 단계

- [ ] Review 페이지를 Store/features/review로 통합
- [ ] 공통 UI를 src/shared/ui로 이동 고려
- [ ] 각 feature에 README 추가
- [ ] 유닛 테스트 작성
