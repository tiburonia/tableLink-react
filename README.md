
# TableLink - 매장 주문 및 예약 시스템

## 📁 프로젝트 구조

```
TableLink/
├── main/                   # 메인 시스템 (고객용 앱)
│   ├── pages/             # 메인 페이지들
│   │   ├── auth/          # 로그인, 회원가입
│   │   ├── main/          # 메인, 검색, 지도
│   │   ├── mypage/        # 마이페이지
│   │   └── store/         # 매장 관련 페이지
│   ├── utils/             # 메인 시스템 전용 유틸리티
│   └── assets/            # 메인 시스템 전용 에셋
├── admin/                  # 관리자 시스템
│   ├── components/        # 관리자 컴포넌트
│   ├── pages/             # 관리자 페이지들
│   ├── utils/             # 관리자 전용 유틸리티
│   └── assets/            # 관리자 전용 에셋
├── kds/                    # KDS (주방 디스플레이) 시스템
│   ├── components/        # KDS 컴포넌트
│   ├── pages/             # KDS 페이지들
│   ├── utils/             # KDS 전용 유틸리티
│   └── assets/            # KDS 전용 에셋
├── pos/                    # POS (포스기) 시스템
│   ├── components/        # POS 컴포넌트
│   ├── pages/             # POS 페이지들
│   ├── utils/             # POS 전용 유틸리티
│   └── assets/            # POS 전용 에셋
├── shared/                 # 공통 파일들
│   ├── css/               # 공통 스타일
│   ├── utils/             # 공통 유틸리티
│   ├── config/            # 설정 파일
│   └── assets/            # 공통 에셋
├── public/                 # HTML 진입점들
│   ├── index.html         # 메인 시스템 진입점
│   ├── admin.html         # 관리자 시스템 진입점
│   ├── kds.html           # KDS 시스템 진입점
│   └── pos.html           # POS 시스템 진입점
├── txt/                    # 문서 파일들
├── server.js               # Express 서버
└── package.json            # 프로젝트 설정

```

## 🌐 라우팅 구조

- `/` : 메인 시스템 (고객용 앱)
- `/admin` : 관리자 시스템
- `/KDS` : 주방 디스플레이 시스템
- `/POS` : 포스기 시스템

## 🔧 각 시스템 설명

### 메인 시스템 (Main)
- 고객이 사용하는 주문 및 예약 앱
- 매장 검색, 메뉴 주문, 결제, 리뷰 등

### 관리자 시스템 (Admin)
- 매장 운영자/관리자용 대시보드
- 매장 관리, 사용자 관리, 주문 관리, 통계 등

### KDS 시스템 (Kitchen Display System)
- 주방용 디스플레이 시스템
- 주문 접수, 조리 상태 관리

### POS 시스템 (Point of Sale)
- 매장 내 결제 시스템
- 현장 주문 처리, 결제, 영수증 발행

## 🚀 실행 방법

```bash
# 서버 실행
node server.js

# 접속 URL
- 메인: http://localhost:5000
- 관리자: http://localhost:5000/admin
- KDS: http://localhost:5000/KDS
- POS: http://localhost:5000/POS
```
