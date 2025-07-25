const stores = [
  {
    "id": 1,
    "name": "치킨천국",
    "category": "치킨",
    "distance": "150m",
    "menu": [
      { "name": "후라이드치킨", "price": 17000 },
      { "name": "양념치킨", "price": 18000 },
      { "name": "간장치킨", "price": 18500 },
      { "name": "순살치킨", "price": 19000 },
      { "name": "치킨마요", "price": 16000 },
      { "name": "고추치킨", "price": 17500 }
    ],
    "coord": { "lat": 37.564362, "lng": 126.980723 },
    "reviewCount": 53,
    "isOpen": true,
    "reviews": []
  },
  {
    "id": 2,
    "name": "분식왕국",
    "category": "분식",
    "distance": "230m",
    "menu": [
      { "name": "떡볶이", "price": 5000 },
      { "name": "김밥", "price": 3000 },
      { "name": "오뎅", "price": 1000 }
    ],
    "coord": { "lat": 37.567318, "lng": 126.983141 },
    "reviewCount": 27,
    "isOpen": false,
    "reviews": []
  },
  {
    "id": 3,
    "name": "한솥도시락",
    "category": "도시락",
    "distance": "310m",
    "menu": [
      { "name": "제육볶음도시락", "price": 6200 },
      { "name": "치킨마요", "price": 4600 },
      { "name": "불고기도시락", "price": 5900 }
    ],
    "coord": { "lat": 37.567607, "lng": 126.989472 },
    "reviewCount": 88,
    "isOpen": false,
    "reviews": []
  },
  {
    "id": 4,
    "name": "불타는곱창",
    "category": "곱창",
    "distance": "450m",
    "menu": [
      { "name": "소곱창구이", "price": 27000 },
      { "name": "막창구이", "price": 26000 },
      { "name": "야채곱창", "price": 22000 }
    ],
    "coord": { "lat": 37.566990, "lng": 126.967248 },
    "reviewCount": 97,
    "isOpen": false,
    "reviews": []
  },
  {
    "id": 5,
    "name": "돈까스마을",
    "category": "일식",
    "distance": "380m",
    "menu": [
      { "name": "등심돈까스", "price": 8500 },
      { "name": "치즈돈까스", "price": 9500 },
      { "name": "카레돈까스", "price": 9000 }
    ],
    "coord": { "lat": 37.559992, "lng": 126.972269 },
    "reviewCount": 75,
    "isOpen": false,
    "reviews": []
  },
  {
    "id": 6,
    "name": "파스타하우스",
    "category": "양식",
    "distance": "520m",
    "menu": [
      { "name": "까르보나라", "price": 12000 },
      { "name": "토마토파스타", "price": 11000 },
      { "name": "봉골레", "price": 12500 }
    ],
    "coord": { "lat": 37.574872, "lng": 126.979573 },
    "reviewCount": 5,
    "isOpen": true,
    "reviews": []
  },
  {
    "id": 7,
    "name": "마라탕전문점",
    "category": "중식",
    "distance": "610m",
    "menu": [
      { "name": "마라탕", "price": 9000 },
      { "name": "꿔바로우", "price": 11000 },
      { "name": "마라샹궈", "price": 12000 }
    ],
    "coord": { "lat": 37.568547, "lng": 126.967099 },
    "reviewCount": 16,
    "isOpen": false,
    "reviews": []
  },
  {
    "id": 8,
    "name": "족발야시장",
    "category": "한식",
    "distance": "480m",
    "menu": [
      { "name": "족발 보통", "price": 24000 },
      { "name": "매운족발", "price": 26000 },
      { "name": "보쌈", "price": 25000 }
    ],
    "coord": { "lat": 37.568242, "lng": 126.988126 },
    "reviewCount": 49,
    "isOpen": true,
    "reviews": []
  },
  {
    "id": 9,
    "name": "피자헛",
    "category": "피자",
    "distance": "730m",
    "menu": [
      { "name": "페퍼로니피자", "price": 20000 },
      { "name": "치즈피자", "price": 18000 },
      { "name": "콤비네이션피자", "price": 22000 }
    ],
    "coord": { "lat": 37.558711, "lng": 126.971951 },
    "reviewCount": 10,
    "isOpen": true,
    "reviews": []
  },
  {
    "id": 10,
    "name": "소문난국밥집",
    "category": "한식",
    "distance": "310m",
    "menu": [
      { "name": "돼지국밥", "price": 8500 },
      { "name": "순대국밥", "price": 9000 },
      { "name": "내장국밥", "price": 9500 }
    ],
    "coord": { "lat": 37.566871, "lng": 126.975629 },
    "reviewCount": 24,
    "isOpen": true,
    "reviews": []
  },
  {
    "id": 11,
    "name": "카페온더테이블",
    "category": "카페",
    "distance": "120m",
    "menu": [
      { "name": "아메리카노", "price": 4000 },
      { "name": "카페라떼", "price": 4500 },
      { "name": "딸기스무디", "price": 5500 }
    ],
    "coord": { "lat": 37.558867, "lng": 126.978667 },
    "reviewCount": 100,
    "isOpen": true,
    "reviews": []
  },
  {
    "id": 12,
    "name": "타코의신",
    "category": "멕시칸",
    "distance": "670m",
    "menu": [
      { "name": "비프타코", "price": 6800 },
      { "name": "치킨타코", "price": 6500 },
      { "name": "나쵸세트", "price": 7200 }
    ],
    "coord": { "lat": 37.563276, "lng": 126.991006 },
    "reviewCount": 62,
    "isOpen": true,
    "reviews": []
  },
  {
    "id": 13,
    "name": "인도커리하우스",
    "category": "인도식",
    "distance": "850m",
    "menu": [
      { "name": "버터치킨커리", "price": 12000 },
      { "name": "팔락파니르", "price": 11500 },
      { "name": "난 & 탄두리세트", "price": 14000 }
    ],
    "coord": { "lat": 37.566955, "lng": 126.984537 },
    "reviewCount": 22,
    "isOpen": false,
    "reviews": []
  },
  {
    "id": 14,
    "name": "버거스팟",
    "category": "패스트푸드",
    "distance": "430m",
    "menu": [
      { "name": "더블치즈버거", "price": 7800 },
      { "name": "치킨버거", "price": 7200 },
      { "name": "감자튀김 세트", "price": 4500 }
    ],
    "coord": { "lat": 37.566987, "lng": 126.991307 },
    "reviewCount": 7,
    "isOpen": true,
    "reviews": []
  },
  {
    "id": 15,
    "name": "미소초밥",
    "category": "일식",
    "distance": "660m",
    "menu": [
      { "name": "모둠초밥", "price": 12000 },
      { "name": "연어초밥", "price": 13000 },
      { "name": "참치마요롤", "price": 9500 }
    ],
    "coord": { "lat": 37.573777, "lng": 126.972365 },
    "reviewCount": 92,
    "isOpen": true,
    "reviews": []
  },
  {
    "id": 16,
    "name": "쌀국수존맛",
    "category": "아시안",
    "distance": "570m",
    "menu": [
      { "name": "소고기쌀국수", "price": 9000 },
      { "name": "닭쌀국수", "price": 8500 },
      { "name": "짜조", "price": 5500 }
    ],
    "coord": { "lat": 37.560091, "lng": 126.969262 },
    "reviewCount": 15,
    "isOpen": false,
    "reviews": []
  },
  {
    "id": 17,
    "name": "중화요리홍반장",
    "category": "중식",
    "distance": "200m",
    "menu": [
      { "name": "짜장면", "price": 6000 },
      { "name": "짬뽕", "price": 7000 },
      { "name": "탕수육", "price": 13000 }
    ],
    "coord": { "lat": 37.568079, "lng": 126.985982 },
    "reviewCount": 39,
    "isOpen": true,
    "reviews": []
  },
  {
    "id": 18,
    "name": "삼겹살스토리",
    "category": "한식",
    "distance": "320m",
    "menu": [
      { "name": "삼겹살 1인분", "price": 13000 },
      { "name": "항정살", "price": 15000 },
      { "name": "된장찌개", "price": 5000 }
    ],
    "coord": { "lat": 37.567677, "lng": 126.967302 },
    "reviewCount": 60,
    "isOpen": true,
    "reviews": []
  },
  {
    "id": 19,
    "name": "커리앤난",
    "category": "인도식",
    "distance": "720m",
    "menu": [
      { "name": "치킨커리", "price": 11000 },
      { "name": "난 2개", "price": 3500 },
      { "name": "라씨", "price": 3000 }
    ],
    "coord": { "lat": 37.560238, "lng": 126.976774 },
    "reviewCount": 86,
    "isOpen": true,
    "reviews": []
  },
  {
    "id": 20,
    "name": "버블티하우스",
    "category": "카페",
    "distance": "100m",
    "menu": [
      { "name": "타로버블티", "price": 4900 },
      { "name": "망고버블티", "price": 5200 },
      { "name": "초코버블티", "price": 5000 }
    ],
    "coord": { "lat": 37.574743, "lng": 126.968793 },
    "reviewCount": 1,
    "isOpen": false,
    "reviews": []
  },
  {
    "id": 21,
    "name": "할매국수",
    "category": "분식",
    "distance": "150m",
    "menu": [
      { "name": "잔치국수", "price": 4500 },
      { "name": "비빔국수", "price": 5000 },
      { "name": "멸치우동", "price": 5500 }
    ],
    "coord": { "lat": 37.563952, "lng": 126.968214 },
    "reviewCount": 50,
    "isOpen": false,
    "reviews": []
  },
  {
    "id": 22,
    "name": "고기고기버거",
    "category": "패스트푸드",
    "distance": "380m",
    "menu": [
      { "name": "불고기버거", "price": 6900 },
      { "name": "베이컨버거", "price": 7500 },
      { "name": "감자튀김", "price": 3000 }
    ],
    "coord": { "lat": 37.560420, "lng": 126.988055 },
    "reviewCount": 71,
    "isOpen": false,
    "reviews": []
  },
  {
    "id": 23,
    "name": "브런치데이",
    "category": "브런치",
    "distance": "250m",
    "menu": [
      { "name": "에그베네딕트", "price": 11500 },
      { "name": "프렌치토스트", "price": 9500 },
      { "name": "아보카도샐러드", "price": 10500 }
    ],
    "coord": { "lat": 37.574141, "lng": 126.991040 },
    "reviewCount": 36,
    "isOpen": false,
    "reviews": []
  },
  {
    "id": 24,
    "name": "라면의달인",
    "category": "분식",
    "distance": "430m",
    "menu": [
      { "name": "진라면", "price": 4000 },
      { "name": "치즈라면", "price": 4500 },
      { "name": "불닭라면", "price": 5000 }
    ],
    "coord": { "lat": 37.559751, "lng": 126.967132 },
    "reviewCount": 47,
    "isOpen": false,
    "reviews": []
  }
]


function assignDummyReviewsToStores() {
  // 더 풍부하게 쓰고 싶으면 이름/내용 배열만 늘리면 됨
  const userNames = [
    "익명1", "익명2", "user001", "맛집헌터", "치킨광", "이현수", "푸드파이터", "김밥충", "배고픈곰", "매운맛사랑"
  ];
  const reviewContents = [
    "정말 맛있어요!", "친절하고 빠름!", "재방문 의사 100%", "분위기 깔끔", "다음에 또 올게요",
    "가격도 괜찮고 맛도 좋음", "양이 많아서 배불러요", "포장도 깔끔", "추천합니다!", "배달도 빨라요"
  ];

  stores.forEach(store => {
    store.reviews = [];
    for (let i = 0; i < 10; i++) {
      store.reviews.push({
        score: Math.floor(Math.random() * 5) + 1, // 1~5
        user: userNames[Math.floor(Math.random() * userNames.length)],
        content: reviewContents[Math.floor(Math.random() * reviewContents.length)]
      });
    }
  });
}


// 함수들을 정의만 하고 자동 실행하지 않음
function assignRandomTablesToStores() {
  stores.forEach(store => {
    // 10~15 사이의 랜덤 개수
    const tableCount = Math.floor(Math.random() * 6) + 10; // 10~15
    store.tables = Array.from({length: tableCount}, (_, i) => i + 1);
  });
}

// 필요시 함수들 실행
assignDummyReviewsToStores();
assignRandomTablesToStores();

// Node.js에서 사용할 수 있도록 exports
module.exports = {
  stores,
  assignDummyReviewsToStores,
  assignRandomTablesToStores
};

