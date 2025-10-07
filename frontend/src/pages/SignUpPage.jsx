import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function SignUpPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    id: '',
    pw: '',
    pwConfirm: '',
    name: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.pw !== formData.pwConfirm) {
      setError('비밀번호가 일치하지 않습니다');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: formData.id,
          pw: formData.pw,
          name: formData.name,
          phone: formData.phone,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ 회원가입 성공:', data);
        alert(`${formData.name}님, 회원가입이 완료되었습니다!`);
        navigate('/login');
      } else {
        console.error('❌ 회원가입 실패:', response.status, data);
        setError(data.error || data.message || '회원가입에 실패했습니다');
      }
    } catch (err) {
      console.error('❌ 회원가입 오류:', err);
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
    <div className="signup-container">
      <div className="signup-card">
        <h1>TableLink</h1>
        <h2>회원가입</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="id">아이디</label>
            <input
              type="text"
              id="id"
              name="id"
              value={formData.id}
              onChange={handleChange}
              placeholder="아이디를 입력하세요"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="pw">비밀번호</label>
            <input
              type="password"
              id="pw"
              name="pw"
              value={formData.pw}
              onChange={handleChange}
              placeholder="비밀번호를 입력하세요"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="pwConfirm">비밀번호 확인</label>
            <input
              type="password"
              id="pwConfirm"
              name="pwConfirm"
              value={formData.pwConfirm}
              onChange={handleChange}
              placeholder="비밀번호를 다시 입력하세요"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="name">이름</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="이름을 입력하세요"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">전화번호</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
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