
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    userId: '',
    userPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 백엔드 API 스펙에 맞게 필드명 변환
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: formData.userId,
          pw: formData.userPassword
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ 로그인 API 성공:', data);
        if (data.success && data.user) {
          login(data.user);
          console.log('✅ 지도 페이지로 이동');
          navigate('/map');
        } else {
          setError(data.message || '로그인 정보가 올바르지 않습니다');
        }
      } else {
        console.error('❌ 로그인 API 실패:', response.status, data);
        setError(data.message || data.error || '아이디 또는 비밀번호가 일치하지 않습니다');
      }
    } catch (err) {
      console.error('❌ 로그인 오류:', err);
      setError('서버와 통신할 수 없습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>TableLink</h1>
        <h2>로그인</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="userId">아이디</label>
            <input
              type="text"
              id="userId"
              name="userId"
              value={formData.userId}
              onChange={handleChange}
              placeholder="아이디를 입력하세요"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="userPassword">비밀번호</label>
            <input
              type="password"
              id="userPassword"
              name="userPassword"
              value={formData.userPassword}
              onChange={handleChange}
              placeholder="비밀번호를 입력하세요"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="signup-link">
          <p>계정이 없으신가요?</p>
          <Link to="/signup" className="signup-btn">회원가입</Link>
        </div>
      </div>
    </div>
  );
}
