//모든 회원가입 정보
const users = {}

//현재 로그인한 유저 정보
const userInfo = {
  id: '',
  pw: '',
  name: '',
  phone: '',
  email: '',
  address: '',
  birth: '',
  gender: '',
  point: 0,
  orderList: [],
  reservationList: []
};



window.userInfo = userInfo
window.users = users

// 실험용 계정
users["12"] = {
  pw: "12",
  name: '',
  phone: '',
  point: '',
  orderList: [],
  totalCost : 0,
  reservationList: []
};