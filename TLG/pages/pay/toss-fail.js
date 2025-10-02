
/**
 * 토스페이먼츠 결제 실패 페이지 처리
 */

// URL 파라미터 파싱
function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    code: params.get('code'),
    message: params.get('message'),
    orderId: params.get('orderId')
  };
}

// 실패 정보 표시
function showFailure() {
  const { code, message, orderId } = getUrlParams();
  
  console.log('❌ 결제 실패:', { code, message, orderId });
  
  const container = document.querySelector('.container');
  container.innerHTML = `
    <div class="status-icon">❌</div>
    <h1>결제 실패</h1>
    <div class="error-info">
      <p><strong>사유:</strong> ${message || '결제 처리 중 오류가 발생했습니다.'}</p>
      ${orderId ? `<p><strong>주문번호:</strong> ${orderId}</p>` : ''}
      ${code ? `<p><strong>오류코드:</strong> ${code}</p>` : ''}
    </div>
    <div class="action-buttons">
      <button class="btn primary" onclick="retryPayment()">다시 시도</button>
      <button class="btn secondary" onclick="goBack()">TableLink로 돌아가기</button>
    </div>
  `;
}

// 결제 재시도
function retryPayment() {
  try {
    if (window.opener && !window.opener.closed) {
      window.opener.focus();
      window.close();
    } else {
      window.location.href = '/';
    }
  } catch (e) {
    window.location.href = '/';
  }
}

// TableLink로 돌아가기
function goBack() {
  try {
    if (window.opener && !window.opener.closed) {
      window.opener.location.href = '/';
      window.close();
    } else {
      window.location.href = '/';
    }
  } catch (e) {
    window.location.href = '/';
  }
}

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', showFailure);

console.log('✅ 토스페이먼츠 실패 페이지 로드 완료');
