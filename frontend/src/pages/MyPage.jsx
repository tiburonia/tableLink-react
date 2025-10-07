
import { useAuth } from '../hooks/useAuth';

export default function MyPage() {
  const { user, logout } = useAuth();

  return (
    <div className="mypage">
      <h1>마이페이지</h1>
      <div className="user-info">
        <p>이름: {user?.userName}</p>
        <p>아이디: {user?.userId}</p>
      </div>
      <button onClick={logout} className="logout-btn">로그아웃</button>
    </div>
  );
}
