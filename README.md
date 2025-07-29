
# TableLink - 스마트 레스토랑 통합 관리 시스템

TableLink는 레스토랑의 테이블 관리, 주문 처리, 고객 관리를 통합한 웹 기반 시스템입니다.

## 🏗️ 시스템 아키텍처 및 폴더 구조

### 프로젝트 전체 구조
```
tablelink/
├── TLG/                       # 고객용 TableLink 컴포넌트
│   ├── assets/               # 고객용 정적 자원
│   ├── components/           # 고객용 컴포넌트 (현재 비어있음)
│   ├── pages/               # 고객용 페이지 컴포넌트
│   │   ├── auth/            # 인증 관련 페이지
│   │   │   └── renderLogin.js      # 로그인 화면
│   │   ├── main/            # 메인 화면 관련
│   │   │   ├── modules/     # 메인 화면 모듈
│   │   │   │   ├── mapMarkerManager.js    # 지도 마커 관리
│   │   │   │   └── mapPanelUI.js         # 지도 패널 UI
│   │   │   ├── renderMap.js        # 지도 화면 렌더링
│   │   │   ├── renderSearch.js     # 검색 화면 렌더링
│   │   │   └── renderSignUp.js     # 회원가입 화면 렌더링
│   │   ├── mypage/          # 마이페이지 관련
│   │   │   ├── renderMyAccount.js  # 내 계정 화면
│   │   │   └── renderMyPage.js     # 마이페이지 메인
│   │   └── store/           # 매장 관련 페이지
│   │       ├── cart/        # 장바구니 관련
│   │       │   ├── renderCart.js        # 장바구니 화면
│   │       │   ├── renderCartWidget.js  # 장바구니 위젯
│   │       │   └── saveCart.js          # 장바구니 저장
│   │       ├── favoriteStore/      # 즐겨찾기 관련
│   │       │   └── toggleFavoriteF.js   # 즐겨찾기 토글
│   │       ├── modules/     # 매장 화면 모듈
│   │       │   ├── renderStoreUI.js     # 매장 UI 렌더링
│   │       │   ├── reviewManager.js     # 리뷰 관리
│   │       │   ├── storePanelManager.js # 매장 패널 관리
│   │       │   ├── storeTabManager.js   # 매장 탭 관리
│   │       │   └── tableInfoManager.js  # 테이블 정보 관리
│   │       ├── newStore/    # 신규 매장 관련
│   │       │   ├── renderMenuHTML.js    # 메뉴 HTML 렌더링
│   │       │   └── renderReviewHTML.js  # 리뷰 HTML 렌더링
│   │       ├── pay/         # 결제 관련
│   │       │   ├── confirmPayF.js       # 결제 확인
│   │       │   └── renderdPay.js        # 결제 화면 렌더링
│   │       ├── review/      # 리뷰 관련
│   │       │   └── renderAllReview.js   # 전체 리뷰 화면
│   │       ├── renderOrderScreen.js     # 주문 화면
│   │       ├── renderReservationScreen.js # 예약 화면
│   │       └── renderStore.js           # 매장 메인 화면
│   └── utils/               # 고객용 유틸리티
│       ├── TLL.js          # TableLink Light (QR 주문)
│       ├── cacheFileManager.js  # 파일 캐시 관리
│       ├── creatCoupon.js       # 쿠폰 생성
│       ├── localStorage.js      # 로컬스토리지 관리
│       └── logOut.js           # 로그아웃 처리
│
├── admin/                     # 관리자 시스템
│   ├── assets/               # 관리자용 정적 자원
│   ├── components/           # 관리자 컴포넌트
│   │   └── renderAdmin/
│   │       └── renderAdminMain.js      # 관리자 메인 화면
│   ├── pages/               # 관리자 페이지 (현재 비어있음)
│   └── utils/               # 관리자 유틸리티 (현재 비어있음)
│
├── kds/                      # 주방 디스플레이 시스템
│   ├── assets/              # KDS 정적 자원
│   ├── components/          # KDS 컴포넌트
│   │   └── kds/
│   │       └── renderKDS.js        # KDS 메인 화면
│   ├── pages/               # KDS 페이지 (현재 비어있음)
│   └── utils/               # KDS 유틸리티 (현재 비어있음)
│
├── pos/                      # POS 시스템
│   ├── assets/              # POS 정적 자원
│   ├── components/          # POS 컴포넌트
│   │   └── pos/            # (현재 비어있음)
│   ├── pages/               # POS 페이지 (현재 비어있음)
│   └── utils/               # POS 유틸리티 (현재 비어있음)
│
├── public/                   # 정적 HTML 페이지
│   ├── admin.html          # 관리자 페이지
│   ├── index.html          # 고객용 메인 페이지
│   ├── kds.html            # 주방 디스플레이 페이지
│   ├── pos.html            # POS 시스템 페이지
│   └── tlm.html            # 사장님 앱 페이지
│
├── routes/                   # API 라우트 모듈
│   ├── admin.js            # 관리자 API
│   ├── auth.js             # 인증 API
│   ├── cache.js            # 캐시 API
│   ├── cart.js             # 장바구니 API
│   ├── orders.js           # 주문 API
│   ├── reviews.js          # 리뷰 API
│   ├── stores.js           # 매장 API
│   └── tables.js           # 테이블 API
│
├── shared/                   # 공유 리소스
│   ├── assets/             # 공유 정적 자원
│   ├── config/             # 설정 파일
│   │   ├── database.js     # 데이터베이스 연결 설정
│   │   └── init-db.js      # 데이터베이스 초기화
│   ├── css/                # 공유 스타일시트
│   │   ├── favoriteStore.css    # 즐겨찾기 스타일
│   │   ├── globalBody.css       # 전역 바디 스타일
│   │   ├── renderLogin.css      # 로그인 스타일
│   │   └── renderMain.css       # 메인 스타일
│   └── utils/              # 공유 유틸리티
│       ├── cacheFileManager.js  # 파일 캐시 관리
│       ├── localStorage.js      # 로컬스토리지 관리
│       └── logOut.js           # 로그아웃 처리
│
├── tlm-components/           # 사장님 앱 (TableLink Manager)
│   └── renderTLMMain.js    # TLM 메인 화면
│
├── txt/                      # 문서 및 메모
│   ├── 노트.txt
│   ├── 메모.txt
│   └── 통합본.txt
│
├── .config/                  # 설정 디렉토리
│   └── npm/
│       └── node_global/
│           └── lib/
│
├── .gitignore              # Git 무시 파일 목록
├── .replit                 # Replit 설정 파일
├── .replit.backup          # Replit 설정 백업
├── README.md               # 프로젝트 문서
├── TableLink.png           # 프로젝트 로고 이미지
├── TableLink2.png          # 프로젝트 로고 이미지 2
├── TableLink원본.png        # 원본 로고 이미지
├── package-lock.json       # npm 의존성 잠금 파일
├── package.json            # npm 패키지 설정
├── server.js               # 메인 서버 파일
│
└── 데이터베이스 관리 스크립트들
    ├── add-address-column.js      # 주소 컬럼 추가
    ├── cleanup-duplicate-vip.js   # 중복 VIP룸 정리
    ├── create-orders-table.js     # 주문 테이블 생성
    ├── fix-payment-issue.js       # 결제 이슈 수정
    ├── remove-zipcode.js          # 우편번호 제거
    ├── update-orders-table.js     # 주문 테이블 업데이트
    ├── update-ratings.js          # 별점 업데이트
    └── update-table-schema.js     # 테이블 스키마 업데이트
```

## 🚀 주요 기능

### 고객용 앱 (TableLink Customer - TLG)
- **매장 검색 & 지도**: 위치 기반 매장 찾기 (Kakao Maps API 활용)
- **QR 주문 (TLL)**: QR 코드로 간편 주문 시스템
- **리뷰 시스템**: 별점 및 텍스트 리뷰 작성/조회
- **마이페이지**: 주문 내역, 포인트, 쿠폰 관리
- **즐겨찾기**: 자주 가는 매장 저장 및 관리
- **장바구니**: 주문 전 메뉴 임시 저장 및 관리
- **결제**: 통합 결제 시스템

### 사장님 앱 (TLM - TableLink Manager)
- **매장 통계**: 실시간 매출, 주문 현황 대시보드
- **주문 관리**: 주문 상태 변경, 처리 현황 모니터링
- **리뷰 관리**: 고객 리뷰 확인 및 관리
- **테이블 관리**: 테이블 상태 실시간 모니터링 및 제어
- **매장 운영 설정**: 영업 시간, 운영 상태 관리

### 관리자 시스템 (Admin)
- **전체 매장 관리**: 매장 등록, 수정, 삭제
- **사용자 관리**: 고객 및 사장님 정보 관리
- **시스템 통계**: 전체 시스템 현황 모니터링
- **테이블 현황**: 전체 매장 테이블 상태 통합 관리

### POS 시스템
- **주문 접수**: 매장 내 직접 주문 처리
- **결제 처리**: 다양한 결제 수단 지원
- **영수증 출력**: 주문 확인서 출력 기능

### KDS (Kitchen Display System)
- **주문 표시**: 주방용 주문 현황 실시간 디스플레이
- **상태 관리**: 조리 진행 상황 관리
- **실시간 업데이트**: 주문 상태 실시간 반영

## 🛠️ 기술 스택

### Frontend
- **Vanilla JavaScript**: 순수 자바스크립트 (모듈화된 구조)
- **HTML5/CSS3**: 반응형 웹 디자인
- **Kakao Maps API**: 지도 서비스 및 위치 검색
- **모듈화된 컴포넌트**: 기능별 분리된 모듈 구조

### Backend
- **Node.js**: 서버 런타임 환경
- **Express.js**: 웹 프레임워크 (라우터 모듈화)
- **PostgreSQL**: 관계형 데이터베이스
- **RESTful API**: 표준 REST API 설계

### Infrastructure
- **Replit**: 클라우드 개발 및 배포 환경
- **npm**: 패키지 관리 도구

## 📦 설치 및 실행

### 1. 프로젝트 클론
```bash
git clone <repository-url>
cd tablelink
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 데이터베이스 초기화
```bash
node shared/config/init-db.js
```

### 4. 서버 실행
```bash
npm start
# 또는
node server.js
```

### 5. 접속 URL
- **고객용**: http://localhost:5000
- **관리자**: http://localhost:5000/ADMIN
- **사장님앱**: http://localhost:5000/tlm/:storeId
- **POS**: http://localhost:5000/POS
- **KDS**: http://localhost:5000/KDS

## 📊 데이터베이스 스키마

### 주요 테이블
- `stores`: 매장 정보 (이름, 주소, 운영상태 등)
- `users`: 사용자 정보 (고객, 사장님)
- `orders`: 주문 정보 (메뉴, 금액, 상태 등)
- `reviews`: 리뷰 정보 (별점, 내용, 작성자)
- `store_tables`: 테이블 정보 (좌석수, 점유상태, 고유ID)
- `carts`: 장바구니 정보 (임시 주문 데이터)

## 🔧 API 엔드포인트

### 인증 관련 (/api)
- `POST /users/signup` - 회원가입
- `POST /users/login` - 로그인
- `POST /logout` - 로그아웃

### 매장 관련 (/api/stores)
- `GET /` - 전체 매장 조회
- `GET /:storeId` - 특정 매장 조회
- `GET /:storeId/stats` - 매장 통계
- `GET /:storeId/rating` - 매장 별점
- `GET /:storeId/orders` - 매장별 주문 조회
- `POST /:storeId/toggle-status` - 매장 운영 상태 토글

### 주문 관련 (/api/orders)
- `POST /pay` - 결제 처리
- `GET /stores/:storeId` - 매장별 주문 조회
- `PUT /:orderId/status` - 주문 상태 변경

### 리뷰 관련 (/api/reviews)
- `GET /stores/:storeId` - 매장별 리뷰 조회
- `POST /submit` - 리뷰 등록
- `PUT /:reviewId` - 리뷰 수정
- `DELETE /:reviewId` - 리뷰 삭제

### 테이블 관련 (/api/tables)
- `GET /stores/:storeId` - 매장별 테이블 조회
- `POST /update` - 테이블 상태 업데이트
- `POST /occupy` - 테이블 점유 설정

### 장바구니 관련 (/api/cart)
- `GET /:userId` - 사용자 장바구니 조회
- `POST /add` - 장바구니에 메뉴 추가
- `PUT /update` - 장바구니 업데이트
- `DELETE /clear` - 장바구니 비우기

### 캐시 관련 (/api/cache)
- 매장 정보 및 리뷰 캐시 관리

## 🎯 주요 특징

### 1. 모듈화된 아키텍처
- 기능별로 분리된 컴포넌트 구조
- 라우트 모듈 분리로 유지보수성 향상
- 재사용 가능한 유틸리티 함수들

### 2. 실시간 테이블 관리
- 테이블 상태 실시간 업데이트
- TLL 주문의 자동 해제 시스템 (2분 후)
- TLM 수동 점유 및 해제 기능
- unique_id를 통한 테이블 충돌 방지

### 3. 포인트 & 쿠폰 시스템
- 주문 시 포인트 적립 (10%)
- 첫 주문 웰컴 쿠폰 자동 발급
- 다양한 할인 정책 지원

### 4. 리뷰 시스템
- 별점 및 텍스트 리뷰
- 매장별 평균 별점 자동 계산
- 리뷰 수정/삭제 기능
- 사용자별 리뷰 관리

### 5. 캐시 시스템
- 로컬스토리지 기반 캐시
- 매장 정보 및 리뷰 캐시
- 성능 최적화를 위한 캐시 전략

## 🔍 개발 및 배포

### 개발 환경
- **Replit**: 통합 개발 환경
- **Live Server**: 개발 서버 (5000 포트)
- **PostgreSQL**: 데이터베이스 서버

### 배포 환경
- **Replit Deployment**: 클라우드 배포
- **정적 파일 서빙**: Express.js 정적 파일 서빙
- **환경 변수**: Replit Secrets 활용

## 🔍 디버깅 및 로깅

시스템 전반에 걸쳐 상세한 로깅을 제공합니다:
- 🔍 요청 정보 로깅
- ✅ 성공 처리 로깅  
- ❌ 오류 상세 로깅
- 📊 통계 정보 로깅
- 🏪 매장 운영 상태 로깅

## 📝 라이센스

이 프로젝트는 MIT 라이센스 하에 배포됩니다.

## 👥 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 지원

문제가 있거나 기능 요청이 있으면 Issue를 생성해 주세요.

---

**TableLink** - 스마트한 레스토랑 관리의 새로운 기준
