# JWT + Zustand 인증 시스템 구현 가이드

TableLink 프로젝트에 JWT 토큰 기반 인증과 Zustand 상태 관리가 적용되었습니다.

## 🔧 설정

### 1. 환경 변수 설정 (.env)

```bash
# JWT Secret Keys (반드시 안전한 랜덤 문자열로 변경)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production

# JWT Token Expiry
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

**보안 중요!** 프로덕션 환경에서는 반드시 강력한 랜덤 문자열로 변경하세요.

---

## 📦 백엔드 (Server)

### JWT 토큰 구조

#### Access Token (15분)
```json
{
  "userId": 1,
  "id": "user123",
  "name": "홍길동",
  "phone": "010-1234-5678",
  "role": "user",
  "iat": 1640000000,
  "exp": 1640000900,
  "iss": "tablelink-server"
}
```

#### Refresh Token (7일)
```json
{
  "userId": 1,
  "iat": 1640000000,
  "exp": 1640604800,
  "iss": "tablelink-server"
}
```

### 로그인 API 응답

```javascript
POST /api/auth/login

// 요청
{
  "id": "user123",
  "password": "password123"
}

// 응답
{
  "success": true,
  "message": "로그인 성공",
  "user": {
    "id": "user123",
    "userId": 1,
    "name": "홍길동",
    "phone": "010-1234-5678",
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### 토큰 갱신 API

```javascript
POST /api/auth/refresh

// 요청
{
  "refreshToken": "eyJhbGc..."
}

// 응답
{
  "success": true,
  "accessToken": "eyJhbGc..."
}
```

### 보호된 라우트 적용

```javascript
const { verifyToken, optionalAuth } = require('../mw/auth');

// 필수 인증 (로그인 필요)
router.get('/users/:userId/mypage', verifyToken, userController.getMypageData);

// 선택적 인증 (로그인 선택)
router.post('/users/check-guest-orders', optionalAuth, authController.checkGuestOrders);
```

---

## 🎨 프론트엔드 (React + TypeScript)

### 1. Zustand 인증 스토어 사용

```typescript
import { useAuthStore } from '@/shared/stores/authStore';

function LoginPage() {
  const { login, user, isAuthenticated } = useAuthStore();

  const handleLogin = async () => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'user123', password: 'pass123' })
    });

    const data = await response.json();
    
    if (data.success) {
      login(
        data.user,
        data.user.accessToken,
        data.user.refreshToken
      );
    }
  };

  return (
    <div>
      {isAuthenticated ? (
        <p>환영합니다, {user?.name}님!</p>
      ) : (
        <button onClick={handleLogin}>로그인</button>
      )}
    </div>
  );
}
```

### 2. API 클라이언트 사용 (자동 토큰 추가)

```typescript
import { api } from '@/shared/api/apiClient';

function MyPage() {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    // 자동으로 Authorization: Bearer {token} 헤더 추가됨
    const fetchData = async () => {
      try {
        const response = await api.get('/users/123/mypage');
        setUserData(response.data);
      } catch (error) {
        console.error('데이터 로딩 실패:', error);
      }
    };

    fetchData();
  }, []);

  return <div>{userData?.name}</div>;
}
```

### 3. 로그아웃

```typescript
import { useAuthStore } from '@/shared/stores/authStore';

function LogoutButton() {
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout(); // localStorage 및 상태 초기화
    window.location.href = '/login';
  };

  return <button onClick={handleLogout}>로그아웃</button>;
}
```

### 4. 사용자 정보 업데이트

```typescript
import { useAuthStore } from '@/shared/stores/authStore';

function ProfileUpdate() {
  const { updateUser, user } = useAuthStore();

  const handleUpdate = () => {
    updateUser({
      name: '새이름',
      phone: '010-9999-8888'
    });
  };

  return (
    <div>
      <p>현재 이름: {user?.name}</p>
      <button onClick={handleUpdate}>이름 변경</button>
    </div>
  );
}
```

---

## 🔄 자동 토큰 갱신 흐름

1. **API 요청** → Access Token이 자동으로 헤더에 추가됨
2. **401 에러 발생** → 토큰 만료 감지
3. **Refresh Token으로 갱신 시도** → 새 Access Token 발급
4. **원래 요청 재시도** → 새 토큰으로 자동 재전송
5. **Refresh Token도 만료** → 자동 로그아웃 + 로그인 페이지 이동

---

## 🛡️ 보안 권장사항

1. **환경 변수**: `.env` 파일을 `.gitignore`에 추가하고 비밀키를 공유하지 마세요
2. **HTTPS 사용**: 프로덕션에서는 반드시 HTTPS로 통신하세요
3. **토큰 저장**: localStorage 대신 httpOnly 쿠키 사용 검토
4. **CORS 설정**: 프로덕션에서는 특정 도메인만 허용하도록 설정하세요
5. **비밀번호 해싱**: 현재는 평문 저장이지만 bcrypt 등으로 해싱 필요

---

## 📝 예제 코드

### 완전한 로그인 흐름

```typescript
import { useAuthStore } from '@/shared/stores/authStore';
import { api } from '@/shared/api/apiClient';

function LoginForm() {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await api.post('/login', { id, password });
      const { user } = response.data;

      login(
        {
          id: user.id,
          userId: user.userId,
          name: user.name,
          phone: user.phone
        },
        user.accessToken,
        user.refreshToken
      );

      // 로그인 성공 후 리다이렉트
      window.location.href = '/';
    } catch (error) {
      alert('로그인 실패');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={id}
        onChange={(e) => setId(e.target.value)}
        placeholder="아이디"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="비밀번호"
      />
      <button type="submit">로그인</button>
    </form>
  );
}
```

---

## ✅ 구현 완료 항목

- ✅ JWT 토큰 생성/검증 유틸리티 (`server/src/utils/jwtUtils.js`)
- ✅ JWT 인증 미들웨어 (`server/src/mw/auth.js`)
- ✅ 로그인 시 토큰 자동 발급
- ✅ Refresh Token 엔드포인트 (`POST /api/db/refresh`)
- ✅ Zustand 인증 스토어 (`src/shared/stores/authStore.ts`)
- ✅ API 인터셉터 (자동 토큰 추가 + 갱신) (`src/shared/api/apiClient.ts`)
- ✅ 보호된 라우트에 JWT 미들웨어 적용
- ✅ localStorage에 토큰 영구 저장

---

## 🚀 시작하기

1. `.env` 파일에 JWT_SECRET 설정
2. 서버 재시작: `npm start`
3. 프론트엔드에서 `api` 객체 사용하여 API 호출
4. 자동으로 토큰이 관리됩니다!

문제가 있으면 브라우저 콘솔과 서버 로그를 확인하세요.
