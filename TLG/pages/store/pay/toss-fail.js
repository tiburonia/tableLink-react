// URL 파라미터에서 에러 메시지 가져오기
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');
const message = urlParams.get('message');

if (message) {
    document.getElementById('errorMessage').textContent = message;
}

function goBack() {
    console.log('🔄 결제 실패 후 iframe 닫기 및 리다이렉션');

    // 1. 먼저 iframe 닫기 시도
    setTimeout(() => {
        try {
            console.log('🔒 결제 실패 - iframe 닫기 시도');
            window.close();
        } catch (e) {
            console.log('iframe 닫기 실패:', e);
        }
    }, 500);

    // 2. 부모 창에 리다이렉션 메시지 전송
    const redirectMessage = {
        type: 'PAYMENT_FAIL_REDIRECT',
        action: 'redirect',
        url: '/',
        timestamp: Date.now()
    };

    try {
        if (window.opener && !window.opener.closed) {
            console.log('📨 opener에게 리다이렉션 메시지 전송');
            window.opener.postMessage(redirectMessage, '*');
            window.opener.location.href = '/';
        }
    } catch (e) {
        console.log('opener 리다이렉션 실패:', e);
    }

    try {
        if (window.parent && window.parent !== window) {
            console.log('📨 parent에게 리다이렉션 메시지 전송');
            window.parent.postMessage(redirectMessage, '*');
            window.parent.location.href = '/';
        }
    } catch (e) {
        console.log('parent 리다이렉션 실패:', e);
    }

    try {
        if (window.top && window.top !== window) {
            console.log('📨 top에게 리다이렉션 메시지 전송');
            window.top.postMessage(redirectMessage, '*');
            window.top.location.href = '/';
        }
    } catch (e) {
        console.log('top 리다이렉션 실패:', e);
    }

    // 3. 독립적인 창인 경우 직접 리다이렉션
    if (window === window.top) {
        console.log('🔄 독립적인 창 - 직접 리다이렉션');
        setTimeout(() => {
            window.location.replace('/');
        }, 1000);
    }
}

console.log('❌ 토스페이먼츠 결제 실패:', { code, message });