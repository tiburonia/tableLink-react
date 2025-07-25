
function logOut() {
  // userInfo 초기화
  window.userInfo = {
    id: '',
    name: '',
    phone: '',
    point: 0,
    orderList: [],
    reservationList: [],
    coupons: { unused: [], used: [] },
    favorites: []
  };
  
  alert('로그아웃되었습니다');
  renderLogin();
}

window.logOut = logOut;
