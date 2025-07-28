
# TableLink - 스마트 레스토랑 통합 관리 시스템

TableLink는 레스토랑의 테이블 관리, 주문 처리, 고객 관리를 통합한 웹 기반 시스템입니다.

## 🏗️ 시스템 아키텍처

### 프론트엔드 구조
```
├── public/                 # 정적 HTML 페이지
│   ├── index.html         # 고객용 메인 페이지
│   ├── admin.html         # 관리자 페이지
│   ├── tlm.html           # 사장님 앱
│   ├── kds.html           # 주방 디스플레이
│   └── pos.html           # POS 시스템
├── TLG/                   # 고객용 컴포넌트
├── admin/                 # 관리자 컴포넌트
├── tlm-components/        # 사장님 앱 컴포넌트
├── kds/                   # 주방 디스플레이 컴포넌트
└── pos/                   # POS 컴포넌트
```

### 백엔드 구조 (리팩토링됨)
```
├── server.js              # 메인 서버 파일
├── routes/                # API 라우트 모듈
│   ├── auth.js           # 인증 관련 API
│   ├── stores.js         # 매장 관리 API
│   ├── orders.js         # 주문 처리 API
│   ├── reviews.js        # 리뷰 관리 API
│   ├── tables.js         # 테이블 관리 API
│   ├── cart.js           # 장바구니 API
│   └── admin.js          # 관리자 API
└── shared/
    └── config/           # 데이터베이스 설정
```

## 🚀 주요 기능

### 고객용 앱 (TableLink Customer)
- **매장 검색 & 지도**: 위치 기반 매장 찾기
- **QR 주문**: QR 코드로 간편 주문
- **리뷰 시스템**: 별점 및 텍스트 리뷰
- **마이페이지**: 주문 내역, 포인트, 쿠폰 관리
- **즐겨찾기**: 자주 가는 매장 저장

### 사장님 앱 (TLM - TableLink Manager)
- **매장 통계**: 실시간 매출, 주문 현황
- **주문 관리**: 주문 상태 변경, 처리
- **리뷰 관리**: 고객 리뷰 확인 및 관리
- **테이블 관리**: 테이블 상태 모니터링
- **매장 운영 설정**: 영업 시간, 메뉴 관리

### 관리자 시스템 (Admin)
- **전체 매장 관리**: 매장 등록, 수정, 삭제
- **사용자 관리**: 고객 정보 관리
- **시스템 통계**: 전체 시스템 현황
- **테이블 현황**: 전체 매장 테이블 상태

### POS 시스템
- **주문 접수**: 매장 내 주문 처리
- **결제 처리**: 다양한 결제 수단 지원
- **영수증 출력**: 주문 확인서 출력

### KDS (Kitchen Display System)
- **주문 표시**: 주방용 주문 현황 디스플레이
- **상태 관리**: 조리 진행 상황 관리
- **실시간 업데이트**: 주문 상태 실시간 반영

## 🛠️ 기술 스택

### Frontend
- **Vanilla JavaScript**: 순수 자바스크립트
- **HTML5/CSS3**: 반응형 웹 디자인
- **Kakao Maps API**: 지도 서비스

### Backend
- **Node.js**: 서버 런타임
- **Express.js**: 웹 프레임워크 (모듈화된 라우터)
- **PostgreSQL**: 관계형 데이터베이스

### Infrastructure
- **Replit**: 클라우드 개발 환경
- **npm**: 패키지 관리

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
- `stores`: 매장 정보
- `users`: 사용자 정보
- `orders`: 주문 정보  
- `reviews`: 리뷰 정보
- `store_tables`: 테이블 정보
- `carts`: 장바구니 정보

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

## 🎯 주요 특징

### 1. 모듈화된 아키텍처
- 기능별로 분리된 라우트 모듈
- 재사용 가능한 컴포넌트 구조
- 유지보수성 향상

### 2. 실시간 테이블 관리
- 테이블 상태 실시간 업데이트
- 자동 해제 시스템 (2분 후)
- 충돌 방지를 위한 unique_id 시스템

### 3. 포인트 & 쿠폰 시스템
- 주문 시 포인트 적립 (10%)
- 첫 주문 웰컴 쿠폰 자동 발급
- 다양한 할인 정책 지원

### 4. 리뷰 시스템
- 별점 및 텍스트 리뷰
- 매장별 평균 별점 자동 계산
- 리뷰 수정/삭제 기능

## 🔍 디버깅 및 로깅

각 API는 상세한 로깅을 제공합니다:
- 🔍 요청 정보 로깅
- ✅ 성공 처리 로깅  
- ❌ 오류 상세 로깅
- 📊 통계 정보 로깅

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
