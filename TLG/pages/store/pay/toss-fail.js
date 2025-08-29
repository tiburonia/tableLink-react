
// URL 파라미터에서 에러 메시지 가져오기
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');
const message = urlParams.get('message');

if (message) {
    document.getElementById('errorMessage').textContent = message;
}

function goBack() {
    try {
        // 부모 창이 있고 같은 도메인인 경우
        if (window.opener && !window.opener.closed) {
            try {
                window.opener.postMessage({ 
                    type: 'PAYMENT_FAILURE_REDIRECT', 
                    action: 'navigate', 
                    url: '/' 
                }, '*');
                
                setTimeout(() => {
                    window.close();
                }, 300);
                return;
            } catch (crossOriginError) {
                console.warn('Cross-origin 제한으로 부모 창 통신 실패:', crossOriginError);
            }
        }
        
        // 최상위 창에서 리디렉트 시도
        if (window.top && window.top !== window) {
            window.top.location.href = '/';
            return;
        }
    } catch (error) {
        console.warn('부모 창 통신 실패:', error);
    }
    
    window.location.href = '/';
}

console.log('❌ 토스페이먼츠 결제 실패:', { code, message });
