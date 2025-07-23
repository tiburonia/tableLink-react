const stores = [
  {
    id: 1,
    name: "치킨천국",
    category: "치킨",
    distance: "150m",
    menu: [
      { name: "후라이드치킨", price: 17000 },
      { name: "양념치킨", price: 18000 },
      { name: "간장치킨", price: 18500 }
    ]
  },
  {
    id: 2,
    name: "분식왕국",
    category: "분식",
    distance: "230m",
    menu: [
      { name: "떡볶이", price: 5000 },
      { name: "김밥", price: 3000 },
      { name: "오뎅", price: 1000 }
    ]
  },
  {
    id: 3,
    name: "한솥도시락",
    category: "도시락",
    distance: "310m",
    menu: [
      { name: "제육볶음도시락", price: 6200 },
      { name: "치킨마요", price: 4600 },
      { name: "불고기도시락", price: 5900 }
    ]
  },
  {
    id: 4,
    name: "불타는곱창",
    category: "곱창",
    distance: "450m",
    menu: [
      { name: "소곱창구이", price: 27000 },
      { name: "막창구이", price: 26000 },
      { name: "야채곱창", price: 22000 }
    ]
  },
  {
    id: 5,
    name: "돈까스마을",
    category: "일식",
    distance: "380m",
    menu: [
      { name: "등심돈까스", price: 8500 },
      { name: "치즈돈까스", price: 9500 },
      { name: "카레돈까스", price: 9000 }
    ]
  },
  {
    id: 6,
    name: "파스타하우스",
    category: "양식",
    distance: "520m",
    menu: [
      { name: "까르보나라", price: 12000 },
      { name: "토마토파스타", price: 11000 },
      { name: "봉골레", price: 12500 }
    ]
  },
  {
    id: 7,
    name: "마라탕전문점",
    category: "중식",
    distance: "610m",
    menu: [
      { name: "마라탕", price: 9000 },
      { name: "꿔바로우", price: 11000 },
      { name: "마라샹궈", price: 12000 }
    ]
  },
  {
    id: 8,
    name: "족발야시장",
    category: "한식",
    distance: "480m",
    menu: [
      { name: "족발 보통", price: 24000 },
      { name: "매운족발", price: 26000 },
      { name: "보쌈", price: 25000 }
    ]
  },
  {
    id: 9,
    name: "피자헛",
    category: "피자",
    distance: "730m",
    menu: [
      { name: "페퍼로니피자", price: 20000 },
      { name: "치즈피자", price: 18000 },
      { name: "콤비네이션피자", price: 22000 }
    ]
  },

  {
    id: 10,
    name: "소문난국밥집",
    category: "한식",
    distance: "310m",
    menu: [
      { name: "돼지국밥", price: 8500 },
      { name: "순대국밥", price: 9000 },
      { name: "내장국밥", price: 9500 }
    ]
  },
  {
    id: 11,
    name: "카페온더테이블",
    category: "카페",
    distance: "120m",
    menu: [
      { name: "아메리카노", price: 4000 },
      { name: "카페라떼", price: 4500 },
      { name: "딸기스무디", price: 5500 }
    ]
  },
  {
    id: 12,
    name: "타코의신",
    category: "멕시칸",
    distance: "670m",
    menu: [
      { name: "비프타코", price: 6800 },
      { name: "치킨타코", price: 6500 },
      { name: "나쵸세트", price: 7200 }
    ]
  },
  {
    id: 13,
    name: "인도커리하우스",
    category: "인도식",
    distance: "850m",
    menu: [
      { name: "버터치킨커리", price: 12000 },
      { name: "팔락파니르", price: 11500 },
      { name: "난 & 탄두리세트", price: 14000 }
    ]
  },
  {
    id: 14,
    name: "버거스팟",
    category: "패스트푸드",
    distance: "430m",
    menu: [
      { name: "더블치즈버거", price: 7800 },
      { name: "치킨버거", price: 7200 },
      { name: "감자튀김 세트", price: 4500 }
    ]
  },

  {
    id: 15,
    name: "미소초밥",
    category: "일식",
    distance: "660m",
    menu: [
      { name: "모둠초밥", price: 12000 },
      { name: "연어초밥", price: 13000 },
      { name: "참치마요롤", price: 9500 }
    ]
  },
  {
    id: 16,
    name: "쌀국수존맛",
    category: "아시안",
    distance: "570m",
    menu: [
      { name: "소고기쌀국수", price: 9000 },
      { name: "닭쌀국수", price: 8500 },
      { name: "짜조", price: 5500 }
    ]
  },
  {
    id: 17,
    name: "중화요리홍반장",
    category: "중식",
    distance: "200m",
    menu: [
      { name: "짜장면", price: 6000 },
      { name: "짬뽕", price: 7000 },
      { name: "탕수육", price: 13000 }
    ]
  },
  {
    id: 18,
    name: "삼겹살스토리",
    category: "한식",
    distance: "320m",
    menu: [
      { name: "삼겹살 1인분", price: 13000 },
      { name: "항정살", price: 15000 },
      { name: "된장찌개", price: 5000 }
    ]
  },
  {
    id: 19,
    name: "커리앤난",
    category: "인도식",
    distance: "720m",
    menu: [
      { name: "치킨커리", price: 11000 },
      { name: "난 2개", price: 3500 },
      { name: "라씨", price: 3000 }
    ]
  },
  {
    id: 20,
    name: "버블티하우스",
    category: "카페",
    distance: "100m",
    menu: [
      { name: "타로버블티", price: 4900 },
      { name: "망고버블티", price: 5200 },
      { name: "초코버블티", price: 5000 }
    ]
  },
  {
    id: 21,
    name: "할매국수",
    category: "분식",
    distance: "150m",
    menu: [
      { name: "잔치국수", price: 4500 },
      { name: "비빔국수", price: 5000 },
      { name: "멸치우동", price: 5500 }
    ]
  },
  {
    id: 22,
    name: "고기고기버거",
    category: "패스트푸드",
    distance: "380m",
    menu: [
      { name: "불고기버거", price: 6900 },
      { name: "베이컨버거", price: 7500 },
      { name: "감자튀김", price: 3000 }
    ]
  },
  {
    id: 23,
    name: "브런치데이",
    category: "브런치",
    distance: "250m",
    menu: [
      { name: "에그베네딕트", price: 11500 },
      { name: "프렌치토스트", price: 9500 },
      { name: "아보카도샐러드", price: 10500 }
    ]
  },
  {
    id: 24,
    name: "라면의달인",
    category: "분식",
    distance: "430m",
    menu: [
      { name: "진라면", price: 4000 },
      { name: "치즈라면", price: 4500 },
      { name: "불닭라면", price: 5000 }
    ]
  }


    
];


function assignRandomCoordsToStores() {
  const centerLat = 37.5665;
  const centerLng = 126.9780;

  stores.forEach(store => {
    const randomLat = centerLat + (Math.random() - 0.5) * 0.02; // ±0.01
    const randomLng = centerLng + (Math.random() - 0.5) * 0.03; // ±0.015

    store.coord = {
      lat: Number(randomLat.toFixed(6)),
      lng: Number(randomLng.toFixed(6))
    };
  });
}

assignRandomCoordsToStores();

window.stores = stores


