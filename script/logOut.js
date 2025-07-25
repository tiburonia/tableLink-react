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

    alert('로그아웃 완료');
    renderLogin(); // 로그인 화면 렌더링

}