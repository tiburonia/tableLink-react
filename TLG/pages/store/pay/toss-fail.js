
// URL 파라미터에서 에러 메시지 가져오기
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');
const message = urlParams.get('message');

if (message) {
    document.getElementById('errorMessage').textContent = message;
}

function goBack() {
    if (window.opener) {
        window.opener.location.reload();
        window.close();
    } else {
        window.location.href = '/';
    }
}

console.log('❌ 토스페이먼츠 결제 실패:', { code, message });
