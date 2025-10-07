
# TableLink - 통합 레스토랑 관리 플랫폼

TableLink는 POS, KDS, TLL(QR 주문), KRP(영수증 출력) 시스템을 통합한 웹 기반 레스토랑 관리 플랫폼입니다.

## 🏗️ 시스템 아키텍처

### 통합 시스템 구성
```
TableLink 플랫폼
├── TLG (TableLink Customer) - 고객용 앱
├── POS (Point of Sale) - 매장 직원용 주문 관리
├── KDS (Kitchen Display System) - 주방 디스플레이
├── KRP (Kitchen Receipt Printer) - 주방 영수증 출력
├── TLM (TableLink Manager) - 사장님 앱
└── Admin - 관리자 시스템
```

## 🚀 주요 시스템

### 1. TLG (TableLink Customer)
고객용 모바일 웹 애플리케이션
- **QR 주문 (TLL)**: QR 코드 스캔으로 간편 주문
- **매장 검색**: 위치 기반 매장 찾기 (Kakao Maps API)
- **리뷰 시스템**: 별점 및 텍스트 리뷰
- **포인트 & 쿠폰**: 적립/사용 시스템
- **마이페이지**: 주문 내역, 즐겨찾기 관리
- **알림**: 실시간 주문 상태 알림

### 2. POS (Point of Sale)
매장 직원용 주문 관리 시스템
- **주문 접수**: 매장 내 직접 주문 처리
- **테이블 관리**: 테이블 상태 실시간 모니터링
- **결제 처리**: 다양한 결제 수단 지원
- **매출 관리**: 일일/월별 매출 통계

### 3. KDS (Kitchen Display System)
주방용 주문 현황 디스플레이
- **실시간 주문 표시**: WebSocket 기반 실시간 업데이트
- **조리 상태 관리**: PENDING → COOKING → READY → DONE
- **아이템별 상태**: 개별 메뉴 아이템 상태 추적
- **사운드 알림**: 새 주문 및 완료 알림음

### 4. KRP (Kitchen Receipt Printer)
주방 영수증 출력 시스템
- **자동 출력**: KDS에서 완료된 주문 자동 출력 대기
- **출력 관리**: 출력 상태 추적 및 관리
- **실시간 연동**: WebSocket을 통한 즉시 출력 지시

### 5. TLM (TableLink Manager)
사장님용 매장 관리 앱
- **매출 대시보드**: 실시간 매출 현황
- **주문 관리**: 주문 현황 모니터링
- **테이블 관리**: 테이블 상태 제어
- **통계**: 매출, 고객, 메뉴 분석

### 6. Admin
관리자용 시스템 관리
- **매장 관리**: 매장 등록/수정/삭제
- **사용자 관리**: 회원 정보 관리
- **시스템 모니터링**: 전체 시스템 현황

## 🛠️ 기술 스택

### Frontend
- **Vanilla JavaScript**: 모듈화된 순수 JavaScript
- **HTML5/CSS3**: 반응형 웹 디자인
- **WebSocket**: 실시간 통신 (Socket.IO)
- **Kakao Maps API**: 지도 및 위치 서비스
- **Toss Payments**: 결제 시스템 연동

### Backend
- **Node.js**: 서버 런타임 환경
- **Express.js**: 웹 프레임워크
- **PostgreSQL**: 관계형 데이터베이스
- **Socket.IO**: 실시간 WebSocket 통신
- **RESTful API**: 표준 REST API 구조

### Infrastructure
- **Replit**: 클라우드 개발 및 배포
- **PostgreSQL**: 메인 데이터베이스
- **Server-Sent Events (SSE)**: 실시간 데이터 스트리밍

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

### 3. 환경 변수 설정
```bash
# .env 파일 생성
DATABASE_URL=postgresql://username:password@host:port/database
PORT=5000
NODE_ENV=development
TOSS_CLIENT_KEY=your_toss_client_key
TOSS_SECRET_KEY=your_toss_secret_key
```

### 4. 데이터베이스 초기화
```bash
node scripts/database/create-integrated-pos-schema.js
```

### 5. 서버 실행
```bash
npm start
# 또는
node src/server.js
```

### 6. 접속 URL
- **고객용 (TLG)**: http://localhost:5000
- **POS**: http://localhost:5000/pos
- **KDS**: http://localhost:5000/kds.html
- **KRP**: http://localhost:5000/krp.html
- **사장님앱 (TLM)**: http://localhost:5000/tlm.html
- **관리자**: http://localhost:5000/admin.html

## 📊 데이터베이스 스키마

### 핵심 테이블
```sql
-- 매장 정보
stores (id, name, category, is_open, ...)
store_info (store_id, rating_average, review_count, ...)
store_addresses (store_id, latitude, longitude, ...)

-- 사용자 관리
users (id, user_id, name, phone, email, ...)
guests (id, phone, ...)

-- 주문 시스템
orders (id, store_id, user_id, status, total_price, ...)
order_tickets (id, order_id, status, batch_no, ...)
order_items (id, ticket_id, menu_name, quantity, item_status, cook_station, ...)

-- 결제 시스템
payments (id, order_id, method, amount, status, ...)

-- 포인트 & 리뷰
store_points (user_id, store_id, balance, ...)
reviews (id, store_id, user_id, rating, content, ...)
```

## 🔧 주요 기능

### 실시간 통신 (WebSocket)
- **KDS 업데이트**: 주문 상태 실시간 반영
- **KRP 출력 요청**: 즉시 출력 지시
- **알림 시스템**: 사용자 실시간 알림

### QR 주문 시스템 (TLL)
- **QR 생성**: `TABLE_[번호]` 형태
- **주문 세션**: 테이블별 주문 세션 관리
- **실시간 상태**: 주문부터 완료까지 실시간 추적

### 포인트 시스템
- **적립**: 결제 금액의 1% 자동 적립
- **사용**: 주문 시 포인트 차감
- **매장별 관리**: 매장별 포인트 분리 관리

### 쿠폰 시스템
- **웰컴 쿠폰**: 첫 주문 시 자동 발급
- **할인 적용**: 주문 시 쿠폰 할인 적용
- **유효기간 관리**: 자동 만료 처리

## 📱 URL 구조

### API 엔드포인트
- `/api/auth/*` - 인증 관련
- `/api/stores/*` - 매장 관리
- `/api/orders/*` - 주문 관리
- `/api/pos/*` - POS 시스템
- `/api/kds/*` - KDS 시스템
- `/api/krp/*` - KRP 시스템
- `/api/tll/*` - QR 주문 (TLL)
- `/api/toss/*` - 토스페이먼츠
- `/api/notifications/*` - 알림

### 정적 페이지
- `/` - TLG 고객용 메인
- `/pos` - POS 시스템
- `/kds.html` - KDS 화면
- `/krp.html` - KRP 화면
- `/tlm.html` - 사장님 앱
- `/admin.html` - 관리자

## 🔍 개발 가이드

### 디렉토리 구조
```
src/
├── routes/          # API 라우터
├── services/        # 비즈니스 로직
├── db/             # 데이터베이스 연결
├── mw/             # 미들웨어
└── utils/          # 유틸리티

TLG/                # 고객용 앱
├── pages/          # 페이지 컴포넌트
├── utils/          # TLG 유틸리티
└── styles/         # 스타일시트

KDS/                # KDS 시스템
├── components/     # KDS 컴포넌트
└── modules/        # KDS 모듈

pos/                # POS 시스템
krp/                # KRP 시스템
tlm-components/     # TLM 컴포넌트
```

### WebSocket 이벤트
```javascript
// KDS 이벤트
socket.emit('join-kds', storeId);
socket.on('kds-update', handleKDSUpdate);

// KRP 이벤트
socket.emit('join-krp', storeId);
socket.on('krp:new-print', handlePrintRequest);

// 아이템 상태 변경
socket.emit('item:setStatus', { item_id, next });
socket.on('item.updated', handleItemUpdate);
```

### 주요 상태 흐름
```
주문 생성 → PENDING → COOKING → READY → DONE
         ↓
    KDS 표시 → 조리 시작 → 완료 처리 → KRP 출력
```

## 🔐 보안

### 인증
- 세션 기반 인증
- 매장별 권한 분리
- API 요청 레이트 리미팅

### 데이터 보호
- 사용자 개인정보 암호화
- 결제 정보 보안 처리
- SQL 인젝션 방지

## 📈 모니터링

### 로깅
- 🔍 요청 정보 로깅
- ✅ 성공 처리 로깅  
- ❌ 오류 상세 로깅
- 📊 통계 정보 로깅

### 성능
- WebSocket 연결 제한
- 데이터베이스 인덱스 최적화
- 캐시 시스템 (필요 시)

## 🚀 배포

### Replit 배포
1. Replit에서 프로젝트 생성
2. 환경 변수 설정 (Secrets)
3. 데이터베이스 연결
4. Run 버튼으로 서버 실행

### 환경 변수
```
DATABASE_URL=postgresql://...
TOSS_CLIENT_KEY=...
TOSS_SECRET_KEY=...
PORT=5000
NODE_ENV=production
```

## 📞 지원

문제가 있거나 기능 요청이 있으면 Issue를 생성해 주세요.

---

**TableLink** - 통합 레스토랑 관리 플랫폼으로 매장 운영을 더 스마트하게!
