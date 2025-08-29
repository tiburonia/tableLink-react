const logOutF = function() {
    console.log('🚪 사용자 로그아웃 처리');

    // userInfo 객체가 존재하는 경우 개별 속성 초기화
    if (typeof userInfo !== 'undefined' && userInfo !== null) {
        userInfo.id = "";
        userInfo.pw = "";
        userInfo.name = "";
        userInfo.phone = "";
        userInfo.email = "";
        userInfo.address = "";
        userInfo.birth = "";
        userInfo.gender = "";
        userInfo.point = 0;
        userInfo.totalCost = 0;
        userInfo.realCost = 0;
        userInfo.orderList = [];
        userInfo.reservationList = [];
        userInfo.coupons = { unused: [], used: [] };
        userInfo.favorites = [];
    }

    // authManager의 clearUserInfo 함수 사용 (전역 window.userInfo 초기화)
    if (typeof window.clearUserInfo === 'function') {
        window.clearUserInfo();
    } else {
        // 백업: authManager가 없는 경우 직접 처리
        window.userInfo = null;
        
        try {
            localStorage.clear();
            console.log('🗑️ localStorage 완전 초기화 완료');
        } catch (error) {
            console.error('❌ localStorage 초기화 실패:', error);
        }

        try {
            document.cookie = 'userInfo=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
            console.log('🗑️ 사용자 정보 쿠키 삭제 완료');
        } catch (error) {
            console.error('❌ 쿠키 삭제 실패:', error);
        }
    }

    alert('로그아웃 완료');
    
    // 로그인 화면으로 이동
    if (typeof renderLogin === 'function') {
        renderLogin();
    } else {
        console.error('❌ renderLogin 함수를 찾을 수 없음');
        window.location.reload();
    }
}