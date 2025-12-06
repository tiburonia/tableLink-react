
# TableLink API 명세서

## 📋 개요

TableLink는 통합 레스토랑 관리 플랫폼으로, RESTful API와 WebSocket을 통해 실시간 서비스를 제공합니다.

- **Base URL**: `https://your-domain.replit.dev` 또는 `http://localhost:5000`
- **API Prefix**: `/api`
- **Content-Type**: `application/json`

## 🔐 인증

### 세션 기반 인증
대부분의 API는 세션 기반 인증을 사용합니다.

```http
Cookie: userInfo=encoded_user_data
```

### 매장 인증
일부 매장 전용 API는 헤더 인증을 사용합니다.

```http
X-Store-Id: 매장ID
```

## 📝 공통 응답 형식

### 성공 응답
```json
{
  "success": true,
  "data": {},
  "message": "성공 메시지"
}
```

### 오류 응답
```json
{
  "success": false,
  "error": "오류 메시지",
  "details": "상세 오류 정보"
}
```

## 🔑 인증 API

### 로그인
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "id": "user123",
  "pw": "password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "로그인 성공",
  "user": {
    "id": "user123",
    "userId": 1,
    "name": "홍길동",
    "phone": "010-1234-5678",
    "email": "user@example.com"
  }
}
```

### 회원가입
```http
POST /api/auth/users/signup
```

**Request Body:**
```json
{
  "id": "user123",
  "pw": "password",
  "name": "홍길동",
  "phone": "010-1234-5678"
}
```

### 사용자 정보 조회
```http
GET /api/auth/user/{userId}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user123",
    "name": "홍길동",
    "phone": "010-1234-5678",
    "coupons": {
      "unused": [],
      "used": []
    }
  }
}
```

## 🏪 매장 API

### 매장 검색
```http
GET /api/stores/search?query={검색어}&limit={결과수}
```

**Parameters:**
- `query` (required): 검색어
- `limit` (optional): 결과 수 (default: 20, max: 100)

**Response:**
```json
{
  "success": true,
  "stores": [
    {
      "id": 1,
      "name": "맛있는 음식점",
      "category": "한식",
      "address": "서울시 강남구...",
      "isOpen": true,
      "ratingAverage": 4.5
    }
  ],
  "count": 1
}
```

### 매장 상세 정보
```http
GET /api/stores/{storeId}
```

**Response:**
```json
{
  "success": true,
  "store": {
    "id": 1,
    "name": "맛있는 음식점",
    "is_open": true,
    "store_tel_number": "02-1234-5678",
    "rating_average": 4.5,
    "review_count": 123,
    "full_address": "서울시 강남구 역삼동",
    "lat": 37.5665,
    "lng": 126.978
  }
}
```

### 매장 메뉴 조회 (TLL용)
```http
GET /api/stores/{storeId}/menu/tll
```

**Response:**
```json
{
  "success": true,
  "store": {
    "id": 1,
    "name": "맛있는 음식점"
  },
  "menu": [
    {
      "id": 1,
      "name": "김치찌개",
      "description": "맛있는 김치찌개",
      "price": 8000,
      "cook_station": "KITCHEN",
      "category": "KITCHEN"
    }
  ]
}
```

## 📋 주문 API

### 주문 생성 (통합)
```http
POST /api/orders/create-or-add
```

**Request Body:**
```json
{
  "storeId": 1,
  "tableNumber": 5,
  "userId": "user123",
  "guestPhone": "010-1234-5678",
  "customerName": "홍길동",
  "sourceSystem": "TLL",
  "items": [
    {
      "name": "김치찌개",
      "price": 8000,
      "quantity": 2,
      "category": "KITCHEN",
      "options": {}
    }
  ]
}
```

### 주문 결제
```http
POST /api/orders/pay/{checkId}
```

**Request Body:**
```json
{
  "paymentMethod": "TOSS",
  "paymentData": {
    "paymentKey": "payment_key_here",
    "orderId": "order_id_here",
    "amount": 16000
  },
  "discountAmount": 0
}
```

### 주문 진행 상황 조회
```http
GET /api/orders/processing/{orderId}
```

**Response:**
```json
{
  "success": true,
  "order": {
    "id": 1,
    "storeId": 1,
    "storeName": "맛있는 음식점",
    "tableNumber": 5,
    "status": "OPEN",
    "totalAmount": 16000,
    "tickets": [
      {
        "ticket_id": 1,
        "status": "PENDING",
        "items": [
          {
            "id": 1,
            "menu_name": "김치찌개",
            "quantity": 2,
            "unit_price": 8000,
            "item_status": "PENDING",
            "cook_station": "KITCHEN"
          }
        ]
      }
    ]
  }
}
```

### 주문 세션 종료
```http
PUT /api/orders/{orderId}/end-session
```

### 사용자별 주문 목록
```http
GET /api/orders/users/{userId}?limit=20&offset=0&status=OPEN
```

## 🍽️ TLL (QR 주문) API

### QR로 주문 세션 생성
```http
POST /api/tll/checks/from-qr
```

**Request Body:**
```json
{
  "qr_code": "TABLE_5",
  "user_id": "user123",
  "guest_phone": "010-1234-5678"
}
```

**Response:**
```json
{
  "success": true,
  "check_id": 1,
  "order_id": 1,
  "store_id": 9,
  "table_number": 5
}
```

### TLL 주문 생성
```http
POST /api/tll/orders
```

**Request Body:**
```json
{
  "check_id": 1,
  "items": [
    {
      "menu_name": "김치찌개",
      "unit_price": 8000,
      "quantity": 2,
      "cook_station": "KITCHEN",
      "options": {},
      "notes": ""
    }
  ],
  "payment_method": "TOSS",
  "user_notes": "맵지 않게 해주세요"
}
```

### TLL 결제 확인
```http
POST /api/tll/payments/confirm
```

**Request Body:**
```json
{
  "check_id": 1,
  "payment_key": "payment_key_from_toss",
  "order_id": "toss_order_id",
  "amount": 16000
}
```

### TLL 주문 상태 조회
```http
GET /api/tll/checks/{checkId}
```

## 🍳 KDS (Kitchen Display System) API

### KDS 주문 목록 조회
```http
GET /api/kds/{storeId}
```

**Response:**
```json
{
  "success": true,
  "orders": [
    {
      "check_id": 1,
      "ticket_id": 1,
      "customer_name": "테이블 5",
      "table_number": 5,
      "status": "PENDING",
      "created_at": "2025-01-21T12:00:00Z",
      "items": [
        {
          "id": 1,
          "menuName": "김치찌개",
          "quantity": 2,
          "status": "PENDING",
          "cook_station": "KITCHEN"
        }
      ]
    }
  ]
}
```

### 아이템 상태 업데이트
```http
PUT /api/kds/items/{itemId}/status
```

**Request Body:**
```json
{
  "status": "COOKING",
  "kitchenNotes": "매운맛으로 조리"
}
```

### 티켓 조리 시작
```http
PUT /api/kds/tickets/{ticketId}/start-cooking
```

### 티켓 출력 요청
```http
PUT /api/kds/tickets/{ticketId}/print
```

### 티켓 완료 처리
```http
PUT /api/kds/tickets/{ticketId}/complete
```

## 🖨️ KRP (Kitchen Receipt Printer) API

### 출력 대기 목록 조회
```http
GET /api/krp?storeId={storeId}
```

**Response:**
```json
{
  "success": true,
  "orders": [
    {
      "ticket_id": 1,
      "order_id": 1,
      "table_number": 5,
      "customer_name": "홍길동",
      "total_amount": 16000,
      "items": [
        {
          "menuName": "김치찌개",
          "quantity": 2,
          "price": 8000,
          "totalPrice": 16000
        }
      ]
    }
  ]
}
```

### 출력 완료 처리
```http
POST /api/krp/print
```

**Request Body:**
```json
{
  "storeId": 1,
  "orderId": 1,
  "ticketId": 1
}
```

### 출력 상태 업데이트
```http
PUT /api/krp/update-print-status/{ticketId}
```

## 💳 토스페이먼츠 API

### 결제 준비
```http
POST /api/toss/prepare
```

**Request Body:**
```json
{
  "userId": 1,
  "storeId": 9,
  "storeName": "맛있는 음식점",
  "tableNumber": 5,
  "orderData": {
    "items": [
      {
        "menuId": 1,
        "name": "김치찌개",
        "price": 8000,
        "quantity": 2,
        "cook_station": "KITCHEN"
      }
    ],
    "total": 16000
  },
  "amount": 16000,
  "usedPoint": 0,
  "couponDiscount": 0,
  "paymentMethod": "카드"
}
```

**Response:**
```json
{
  "success": true,
  "orderId": "TLL_1642781234567_abc123def",
  "message": "결제 준비가 완료되었습니다"
}
```

### 결제 승인
```http
POST /api/toss/confirm
```

**Request Body:**
```json
{
  "paymentKey": "payment_key_from_toss",
  "orderId": "TLL_1642781234567_abc123def",
  "amount": 16000
}
```

### 토스 클라이언트 키 조회
```http
GET /api/toss/client-key
```

## 💰 포인트 & 단골 레벨 API

### 매장별 포인트 조회
```http
GET /api/regular-levels/user/{userId}/store/{storeId}/points
```

**Response:**
```json
{
  "success": true,
  "points": 1500,
  "store_name": "맛있는 음식점",
  "updated_at": "2025-01-21T12:00:00Z"
}
```

### 포인트 사용
```http
POST /api/regular-levels/user/{userId}/store/{storeId}/points/use
```

**Request Body:**
```json
{
  "points": 1000,
  "orderId": 1
}
```

### 포인트 적립
```http
POST /api/regular-levels/user/{userId}/store/{storeId}/points/earn
```

**Request Body:**
```json
{
  "points": 160,
  "orderId": 1
}
```

### 단골 레벨 조회
```http
GET /api/regular-levels/user/{userId}
```

**Response:**
```json
{
  "success": true,
  "regularStores": [
    {
      "storeId": 1,
      "storeName": "맛있는 음식점",
      "visitCount": 10,
      "totalSpent": 80000,
      "points": 800,
      "currentLevel": {
        "rank": 2,
        "name": "실버",
        "description": "실버 단골 고객"
      }
    }
  ]
}
```

## 📢 알림 API

### 알림 목록 조회
```http
GET /api/notifications?userId={userId}&type={type}&limit=50&offset=0
```

**Response:**
```json
{
  "success": true,
  "notifications": [
    {
      "id": 1,
      "type": "order",
      "title": "주문이 완료되었습니다",
      "message": "김치찌개 2개 주문이 완료되었습니다",
      "metadata": {
        "order_id": 1,
        "store_id": 1,
        "ticket_id": 1
      },
      "createdAt": "2025-01-21T12:00:00Z",
      "isRead": false
    }
  ]
}
```

### 알림 읽음 처리
```http
PUT /api/notifications/{notificationId}/read
```

**Request Body:**
```json
{
  "userId": 1
}
```

### 모든 알림 읽음 처리
```http
PUT /api/notifications/mark-all-read
```

**Request Body:**
```json
{
  "userId": 1
}
```

## 📝 리뷰 API

### 매장별 리뷰 조회
```http
GET /api/reviews/stores/{storeId}?page=1&limit=10
```

### 사용자별 리뷰 조회
```http
GET /api/reviews/users/{userId}?limit=10
```

### 리뷰 작성
```http
POST /api/reviews/submit
```

**Request Body:**
```json
{
  "storeId": 1,
  "userId": 1,
  "rating": 5,
  "content": "정말 맛있었습니다!"
}
```

## 🔌 WebSocket 이벤트

### 연결
```javascript
const socket = io();

// KDS 룸 조인
socket.emit('join-kds', storeId);
socket.on('joined-kds', (data) => {
  console.log('KDS 연결됨:', data.message);
});

// KRP 룸 조인
socket.emit('join-krp', storeId);
socket.on('joined-krp', (data) => {
  console.log('KRP 연결됨:', data.message);
});
```

### KDS 이벤트
```javascript
// KDS 업데이트 수신
socket.on('kds-update', (data) => {
  console.log('KDS 업데이트:', data);
  /*
  {
    type: 'item_status_update',
    storeId: 1,
    data: {
      item_id: 1,
      ticket_id: 1,
      item_status: 'COOKING',
      menu_name: '김치찌개'
    }
  }
  */
});

// 아이템 상태 변경 요청
socket.emit('item:setStatus', {
  item_id: 1,
  next: 'READY'
});

// 티켓 상태 변경 요청
socket.emit('ticket:setStatus', {
  ticket_id: 1,
  next: 'DONE'
});
```

### KRP 이벤트
```javascript
// 새 출력 요청 수신
socket.on('krp:new-print', (data) => {
  console.log('새 출력 요청:', data);
  /*
  {
    ticket_id: 1,
    order_id: 1,
    table_number: 5,
    customer_name: '홍길동',
    total_amount: 16000,
    items: [...]
  }
  */
});

// 출력 완료 알림
socket.emit('krp:print-completed', {
  ticket_id: 1
});
```

## 📊 HTTP 상태 코드

| 코드 | 설명 |
|------|------|
| 200 | 성공 |
| 201 | 생성됨 |
| 400 | 잘못된 요청 |
| 401 | 인증 실패 |
| 403 | 권한 없음 |
| 404 | 찾을 수 없음 |
| 409 | 충돌 (중복) |
| 500 | 서버 오류 |

## 🔧 오류 코드

| 코드 | 설명 |
|------|------|
| `INVALID_INPUT` | 잘못된 입력 |
| `USER_NOT_FOUND` | 사용자 없음 |
| `STORE_NOT_FOUND` | 매장 없음 |
| `ORDER_NOT_FOUND` | 주문 없음 |
| `PAYMENT_FAILED` | 결제 실패 |
| `INSUFFICIENT_POINTS` | 포인트 부족 |
| `SESSION_EXPIRED` | 세션 만료 |

## 📈 레이트 리미팅

- **일반 API**: IP당 15분에 1000회 요청
- **인증 API**: IP당 15분에 10회 요청
- **WebSocket**: 연결당 100개 제한

## 🔍 개발자 도구

### API 테스트
```bash
# cURL 예제
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"id":"user123","pw":"password"}'

# 주문 생성
curl -X POST http://localhost:5000/api/tll/orders \
  -H "Content-Type: application/json" \
  -H "Cookie: userInfo=..." \
  -d '{"check_id":1,"items":[...]}'
```

### WebSocket 테스트
```javascript
const socket = io('http://localhost:5000');
socket.emit('join-kds', 1);
socket.on('kds-update', console.log);
```

---

**TableLink API** - 통합 레스토랑 관리를 위한 완전한 API 솔루션
