// URL 파라미터에서 에러 메시지 가져오기
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');
const message = urlParams.get('message');

if (message) {
    document.getElementById('errorMessage').textContent = message;
}

function goBack() {
    console.log('🔄 결제 실패 후 뒤로가기 - postMessage 전용');

    const message = {
        type: 'PAYMENT_FAIL',
        action: 'navigate',
        url: '/',
        timestamp: Date.now()
    };

    // 모든 가능한 부모에게 메시지 전송
    try {
        if (window.opener && !window.opener.closed) {
            window.opener.postMessage(message, '*');
        }
        if (window.parent && window.parent !== window) {
            window.parent.postMessage(message, '*');
        }
        if (window.top && window.top !== window) {
            window.top.postMessage(message, '*');
        }
    } catch (e) {
        console.log('메시지 전송 실패:', e);
    }

    setTimeout(() => {
        try {
            window.close();
        } catch (e) {
            window.location.href = '/';
        }
    }, 3000);
}

console.log('❌ 토스페이먼츠 결제 실패:', { code, message });