# Map Page - FSD 아키텍처

## 📁 구조

```
Map/
├── MapPage.tsx              # 메인 페이지
├── MapPage.module.css       # 페이지 스타일
├── index.ts                 # Public API
├── ui/                      # (향후 확장용)
└── model/                   # (향후 확장용)
```

## 🎯 FSD 적용 내용

### 1. CSS Modules 적용
- `.css` → `.module.css` 변환
- 클래스명 camelCase로 통일
- 스타일 캡슐화

### 2. Import 최적화
- BottomNavigation을 Main/ui에서 import
- CSS Modules로 클래스명 충돌 방지

## 📦 주요 기능

### 네이버 지도 통합
- NaverMap 위젯 사용
- 서울시청 기본 위치
- 알림 버튼 헤더

## 🚀 향후 개선

1. **UI 컴포넌트 분리**
   - MapHeader → `ui/MapHeader/`
   - MapControls (줌, 현위치 등)

2. **Features 추가**
   - `features/store-search/` - 지도에서 매장 검색
   - `features/location/` - 현재 위치 감지

3. **Model 추가**
   - `model/hooks/useMapCenter` - 지도 중심 관리
   - `model/hooks/useUserLocation` - 사용자 위치

---

**리팩토링 완료일**: 2025-12-21  
**아키텍처**: Feature-Sliced Design (FSD)
