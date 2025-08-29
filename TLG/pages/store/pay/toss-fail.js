
// URL 파라미터에서 에러 메시지 가져오기
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');
const message = urlParams.get('message');

if (message) {
    document.getElementById('errorMessage').textContent = message;
}

function goBack() {
    try {
        // postMessage로 부모 창에 메시지 전송 시도
        if (window.opener && !window.opener.closed) {
            window.opener.postMessage({ 
                type: 'PAYMENT_FAILURE_REDIRECT', 
                action: 'navigate', 
                url: '/' 
            }, window.location.origin);
            
            // 잠시 대기 후 창 닫기
            setTimeout(() => {
                try {
                    window.close();
                } catch (e) {
                    // 창 닫기 실패시 현재 창에서 리다이렉트
                    window.location.href = '/';
                }
            }, 500);
            return;
        }
    } catch (error) {
        console.warn('부모 창 통신 실패:', error);
    }
    
    // 기본적으로 현재 창에서 리다이렉트
    window.location.href = '/';
}

console.log('❌ 토스페이먼츠 결제 실패:', { code, message });
