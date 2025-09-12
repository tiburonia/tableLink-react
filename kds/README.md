
# KDS (Kitchen Display System) v3.0

TableLink의 주방 디스플레이 시스템

## 폴더 구조

```
kds/
├── frontend/              # 프론트엔드 JavaScript 모듈들
│   ├── kds-core.js       # 데이터 관리 및 API 통신
│   ├── kds-ui.js         # UI 렌더링 및 사용자 상호작용
│   ├── kds-controller.js # 비즈니스 로직 및 이벤트 조율
│   └── kds.js            # 메인 초기화 스크립트
├── backend/               # 백엔드 라우터 및 API
│   └── kds.js            # KDS API 엔드포인트
├── styles/                # CSS 스타일시트
│   └── kds.css           # KDS 전용 스타일
├── kds.html              # KDS 메인 HTML 페이지
└── README.md             # 이 파일
```

## 접근 방법

- 메인 페이지: `/kds/kds.html`
- API 엔드포인트: `/api/kds/*`
- 정적 파일: `/kds/*`

## 주요 기능

1. **실시간 주문 티켓 표시**
2. **스테이션별 필터링**
3. **티켓 상태 관리** (대기중 → 조리중 → 완료 → 서빙완료)
4. **실시간 SSE 연결**
5. **사운드 알림**

## 개발 가이드

1. KDS 시스템은 매장별로 독립적으로 작동
2. PostgreSQL의 NOTIFY/LISTEN을 통한 실시간 업데이트
3. 모바일/태블릿 반응형 디자인
4. 다크테마 기반 UI
