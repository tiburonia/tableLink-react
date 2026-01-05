/**
 * 로딩 화면 컴포넌트
 */

export function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-icon">🍳</div>
      <h2 className="loading-title">KDS 시스템 로드 중...</h2>
      <p className="loading-text">모듈을 불러오고 있습니다</p>
    </div>
  );
}

export default LoadingScreen;
