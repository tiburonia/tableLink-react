# CSS Module 리팩토링 가이드

## 📋 개요

TableLink 프로젝트를 CSS Module 방식으로 전면 리팩토링합니다.
현재 73개의 CSS 파일이 존재하며, 클래스 충돌 문제를 해결하기 위해 단계적으로 진행합니다.

## 🎯 리팩토링 목표

- ✅ 클래스 충돌 완전 제거
- ✅ 컴포넌트 단위 스타일 관리
- ✅ 유지보수성 향상
- ✅ 타입 안정성 확보

## 📊 현재 상태

```
총 CSS 파일: 73개
주요 페이지: 14개
컴포넌트: 50+개
```

## 🔄 변환 프로세스

### 1단계: 공통 스타일 설정 ✅

```
✅ /shared/styles/variables.css - CSS 변수 정의
✅ main.tsx에 variables.css import 추가
```

### 2단계: 페이지별 우선순위

#### 우선순위 1 (핵심 페이지)
- [ ] Store 페이지 (가장 복잡)
- [ ] Main 페이지  
- [ ] Login 페이지
- [ ] MyPage

#### 우선순위 2 (자주 사용)
- [ ] Map 페이지
- [ ] Order 페이지
- [ ] Payment 페이지
- [ ] Review 페이지

#### 우선순위 3 (나머지)
- [ ] QR, Pay, Regular, Notifications, Settings, OrderHistory

## 🛠️ 변환 방법

### 자동 변환 스크립트

```bash
# 1. CSS 파일을 .module.css로 복사
node scripts/css-to-module-converter.js <대상폴더>

# 2. TSX 파일 자동 변환
node scripts/tsx-module-updater.js <대상폴더>
```

### 수동 변환 (권장)

각 컴포넌트마다:

#### Before (기존)
```tsx
// Button.tsx
import './Button.css'

export const Button = () => {
  return <button className="btn-primary">클릭</button>
}
```

```css
/* Button.css */
.btn-primary {
  background: #ff6b35;
}
```

#### After (CSS Module)
```tsx
// Button.tsx
import styles from './Button.module.css'

export const Button = () => {
  return <button className={styles.btnPrimary}>클릭</button>
}
```

```css
/* Button.module.css */
.btnPrimary {
  background: var(--color-primary);
}
```

## 📝 변환 체크리스트

각 파일 변환 시:

- [ ] CSS 파일명을 `.module.css`로 변경
- [ ] TSX에서 `import styles from './Component.module.css'` 추가
- [ ] `className="xxx"` → `className={styles.xxx}` 변경
- [ ] 케밥 케이스 → 카멜 케이스 (`btn-primary` → `btnPrimary`)
- [ ] CSS 변수 활용 (`#ff6b35` → `var(--color-primary)`)
- [ ] 테스트 후 기존 `.css` 파일 삭제

## 🎨 CSS 네이밍 규칙

### 클래스명
```css
/* ❌ Bad */
.store-page {}
.store_page {}

/* ✅ Good */
.storePage {}
.pageContainer {}
.headerTitle {}
```

### CSS 변수 활용
```css
/* ❌ Bad */
.button {
  color: #ff6b35;
  font-size: 16px;
  padding: 12px;
}

/* ✅ Good */
.button {
  color: var(--color-primary);
  font-size: var(--font-size-md);
  padding: var(--spacing-md);
}
```

## 🚀 실행 계획

### Week 1: 핵심 페이지
- Day 1-2: Store 페이지 + 컴포넌트 (15개 파일)
- Day 3: Main 페이지 + 컴포넌트 (8개 파일)
- Day 4: Login/MyPage (5개 파일)
- Day 5: 테스트 및 버그 수정

### Week 2: 나머지 페이지
- Day 1: Map, Order, Payment (10개 파일)
- Day 2: Review, QR, Pay (8개 파일)
- Day 3: 나머지 페이지 (7개 파일)
- Day 4: 공통 컴포넌트 정리
- Day 5: 전체 테스트 및 최종 검증

## 📦 참고 자료

### CSS Module 예시

```typescript
// styles 객체는 타입 안전
import styles from './Component.module.css'

// 자동완성 지원
<div className={styles.container}> // ✅
<div className={styles.contaner}> // ❌ 타입 에러
```

### 조건부 클래스

```tsx
// clsx 라이브러리 사용 (설치 필요)
import clsx from 'clsx'
import styles from './Button.module.css'

<button className={clsx(
  styles.button,
  isPrimary && styles.primary,
  isDisabled && styles.disabled
)}>
```

### 전역 클래스와 혼용

```css
/* Component.module.css */
:global(.mobile-app) .container {
  /* 전역 클래스와 로컬 클래스 혼용 */
}
```

## ⚠️ 주의사항

1. **점진적 마이그레이션**: 한 번에 모든 파일을 변경하지 말 것
2. **테스트 필수**: 각 페이지 변환 후 반드시 동작 확인
3. **Git 커밋**: 페이지 단위로 커밋하여 롤백 가능하게
4. **백업**: 변환 전 현재 CSS 파일 백업
5. **의존성 확인**: 여러 컴포넌트가 공유하는 스타일 주의

## 🔧 유틸리티

### CSS 변수 목록

```
colors: primary, secondary, success, danger, warning, info
spacing: xs, sm, md, lg, xl, 2xl
font-size: xs, sm, md, lg, xl, 2xl, 3xl
font-weight: normal, medium, semibold, bold
radius: sm, md, lg, xl, full
shadow: sm, md, lg, xl
```

전체 목록: `/shared/styles/variables.css` 참고

## 📞 문의

리팩토링 중 문제 발생 시:
1. 변환 전 CSS와 변환 후 비교
2. 브라우저 개발자 도구에서 클래스명 확인
3. CSS Module이 올바르게 빌드되었는지 확인
