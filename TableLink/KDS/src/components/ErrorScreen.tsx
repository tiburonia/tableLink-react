/**
 * 에러 화면 컴포넌트
 */

interface ErrorScreenProps {
  message: string;
  onRetry: () => void;
}

export function ErrorScreen({ message, onRetry }: ErrorScreenProps) {
  return (
    <div className="error-screen">
      <div className="error-icon">🚨</div>
      <h1 className="error-title">KDS 시스템 오류</h1>
      <p className="error-message">{message}</p>
      <button className="retry-btn" onClick={onRetry}>
        페이지 새로고침
      </button>
      <div className="error-help">
        <small>
          <strong>문제 해결 방법:</strong>
          <br />
          1. 페이지를 새로고침해보세요
          <br />
          2. 브라우저 캐시를 삭제해보세요
          <br />
          3. 네트워크 연결을 확인해보세요
        </small>
      </div>
    </div>
  );
}

export default ErrorScreen;
