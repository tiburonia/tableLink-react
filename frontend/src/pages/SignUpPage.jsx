
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function SignUpPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    userId: '',
    userPassword: '',
    userPasswordConfirm: '',
    userName: '',
    userPhone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.userPassword !== formData.userPasswordConfirm) {
      setError('비밀번호가 일치하지 않습니다');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        alert('회원가입이 완료되었습니다');
        navigate('/login');
      } else {
        setError(data.message || '회원가입에 실패했습니다');
      }
    } catch (err) {
      setError('서버 오류가 발생했습니다');
      console.error('회원가입 오류:', err);
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
    <div className="signup-container">
      <div className="signup-card">
        <h1>TableLink</h1>
        <h2>회원가입</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="userId">아이디</label>
            <input
              type="text"
              id="userId"
              name="userId"
              value={formData.userId}
              onChange={handleChange}
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
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="userPasswordConfirm">비밀번호 확인</label>
            <input
              type="password"
              id="userPasswordConfirm"
              name="userPasswordConfirm"
              value={formData.userPasswordConfirm}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="userName">이름</label>
            <input
              type="text"
              id="userName"
              name="userName"
              value={formData.userName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="userPhone">전화번호</label>
            <input
              type="tel"
              id="userPhone"
              name="userPhone"
              value={formData.userPhone}
              onChange={handleChange}
              placeholder="010-0000-0000"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="signup-btn" disabled={loading}>
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <div className="login-link">
          <p>이미 계정이 있으신가요?</p>
          <Link to="/login" className="login-btn">로그인</Link>
        </div>
      </div>
    </div>
  );
}
