
# TableLink - 매장 주문 및 예약 시스템

## 📁 프로젝트 구조

```
TableLink/
├── public/              # 정적 파일들
│   ├── assets/         # 이미지, 아이콘 등
│   ├── index.html      # 메인 HTML
│   ├── admin.html      # 관리자 페이지
│   ├── kds.html        # KDS 페이지
│   └── pos.html        # POS 페이지
├── src/                # 소스 코드
│   ├── components/     # 재사용 가능한 컴포넌트
│   │   ├── admin/      # 관리자 컴포넌트
│   │   ├── kds/        # KDS 컴포넌트
│   │   └── pos/        # POS 컴포넌트
│   ├── pages/          # 페이지별 컴포넌트
│   │   ├── auth/       # 로그인, 회원가입
│   │   ├── main/       # 메인, 검색, 지도
│   │   ├── mypage/     # 마이페이지
│   │   └── store/      # 매장 관련 페이지
│   ├── utils/          # 유틸리티 함수들
│   └── api/            # API 관련 함수들
├── config/             # 설정 파일들
│   ├── database.js     # 데이터베이스 설정
│   └── init-db.js      # 초기 데이터베이스 설정
├── css/                # 스타일시트
├── server.js           # Express 서버
└── package.json        # 패키지 정보
```

## 🚀 실행 방법

1. 개발 서버 실행: `npm run dev`
2. 정적 서버 실행: `npm run static`

## 📋 주요 기능

- 사용자 인증 (로그인/회원가입)
- 매장 검색 및 상세 정보
- 주문 및 결제 시스템
- 예약 관리
- 관리자 패널
- KDS (Kitchen Display System)
- POS (Point of Sale) 시스템
