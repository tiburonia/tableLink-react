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
  totalCost : 0,
  realCost : 0,
  reservationList: [],
  coupons : {
     unused : [],
      used : []
  },
  favorites : []
 
  
};



window.userInfo = userInfo
window.users = users

// 실험용 계정
users["12"] = {
  pw: "12",
  name: '',
  phone: '',
  email: '',
  address: '',
  birth: '',
  gender: '',
  point: 0,
  totalCost : 0,
  realCost :0,
  orderList: [] ,
  reservationList: [],
  coupons : {
     unused : [],
    
      used : []
  },
  favorites :[]
};

for (let i = 1; i <= 10; i++) {
  const id = `user${i}`; // user1, user2, ...
  users[id] = {
    pw: `${i}${i}`, // ex: '11', '22', ...
    name: `테스트유저${i}`,
    phone: `010-0000-000${i}`,
    email: `test${i}@example.com`,
    address: `서울시 가상동 ${i}번지`,
    birth: `199${i}-01-01`,
    gender: i % 2 === 0 ? '남자' : '여자',
    point: 0,
    orderList: [],
    totalCost: 0,
    realCost: 0,
    reservationList: [],
    coupons : {
       unused : [],
        used : []
    },
    favorites :[]
  };
}

