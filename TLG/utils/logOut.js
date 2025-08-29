const logOutF= function() {

    // userInfo는 const로 선언 됨 -> 하나씩 재할당
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
    userInfo.coupons.unused = [];
    userInfo.coupons.used = [];
    userInfo.favorites = [];

    // localStorage 완전 초기화
    try {
        localStorage.clear();
        console.log('✅ localStorage 완전 초기화 완료');
    } catch (error) {
        console.error('❌ localStorage 초기화 실패:', error);
    }

    // 쿠키도 삭제
    try {
        document.cookie = 'userInfo=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
        console.log('✅ 사용자 정보 쿠키 삭제 완료');
    } catch (error) {
        console.error('❌ 쿠키 삭제 실패:', error);
    }

    alert('로그아웃 완료');
    renderLogin(); // 로그인 화면 렌더링

}