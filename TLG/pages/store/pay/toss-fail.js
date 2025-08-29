// URL 파라미터에서 에러 메시지 가져오기
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');
const message = urlParams.get('message');

if (message) {
    document.getElementById('errorMessage').textContent = message;
}

function goBack() {
    console.log('🔄 결제 실패 후 popup 닫기');

    // popup 환경에서 부모 창에 결제 실패 알림
    try {
        if (window.opener && !window.opener.closed) {
            console.log('📨 부모 창에 결제 실패 알림');
            
            // 부모 창에 결제 실패 알림
            window.opener.postMessage({
                type: 'TOSS_PAYMENT_FAILED',
                code: code,
                message: message,
                timestamp: Date.now()
            }, '*');

            // 부모 창으로 포커스 이동
            window.opener.focus();
        }
    } catch (e) {
        console.log('부모 창 알림 실패:', e);
    }

    // 창 닫기
    setTimeout(() => {
        try {
            console.log('🔒 결제 실패 popup 닫기');
            window.close();
        } catch (e) {
            console.log('창 닫기 실패:', e);
            // 창이 닫히지 않으면 부모 창으로 리다이렉션 시도
            if (window.opener && !window.opener.closed) {
                try {
                    window.opener.location.href = '/';
                } catch (redirectError) {
                    console.log('부모 창 리다이렉션 실패:', redirectError);
                }
            }
        }
    }, 1000);
}

// 페이지 로드 시 결제 실패 처리
window.addEventListener('load', () => {
    // 자동으로 부모 창에 실패 알림 전송
    if (window.opener && !window.opener.closed) {
        try {
            window.opener.postMessage({
                type: 'TOSS_PAYMENT_FAILED',
                code: code,
                message: message || '결제가 실패했습니다.',
                timestamp: Date.now()
            }, '*');
        } catch (e) {
            console.log('실패 알림 전송 실패:', e);
        }
    }
});

console.log('❌ 토스페이먼츠 결제 실패:', { code, message });