
const pool = require('../../shared/config/database');

// 전국 도시 데이터 (첨부된 JSON 기반)
const NATIONAL_CITIES = [
  {"name":"서울특별시","type":"특별시","province":"서울특별시","bbox":{"minLat":37.4165,"minLng":126.7780,"maxLat":37.7165,"maxLng":127.1780}},
  {"name":"부산광역시","type":"광역시","province":"부산광역시","bbox":{"minLat":35.0296,"minLng":128.8756,"maxLat":35.3296,"maxLng":129.2756}},
  {"name":"대구광역시","type":"광역시","province":"대구광역시","bbox":{"minLat":35.7514,"minLng":128.4514,"maxLat":35.9914,"maxLng":128.7514}},
  {"name":"인천광역시","type":"광역시","province":"인천광역시","bbox":{"minLat":37.3363,"minLng":126.5252,"maxLat":37.5763,"maxLng":126.8852}},
  {"name":"광주광역시","type":"광역시","province":"광주광역시","bbox":{"minLat":35.0595,"minLng":126.7326,"maxLat":35.2595,"maxLng":126.9726}},
  {"name":"대전광역시","type":"광역시","province":"대전광역시","bbox":{"minLat":36.2504,"minLng":127.2645,"maxLat":36.4504,"maxLng":127.5045}},
  {"name":"울산광역시","type":"광역시","province":"울산광역시","bbox":{"minLat":35.4184,"minLng":129.1514,"maxLat":35.6584,"maxLng":129.4714}},
  {"name":"세종특별자치시","type":"특별자치시","province":"세종특별자치시","bbox":{"minLat":36.4100,"minLng":127.2090,"maxLat":36.5500,"maxLng":127.3690}},
  {"name":"수원시","type":"시","province":"경기도","bbox":{"minLat":37.2036,"minLng":126.9586,"maxLat":37.3236,"maxLng":127.0986}},
  {"name":"성남시","type":"시","province":"경기도","bbox":{"minLat":37.3949,"minLng":127.0789,"maxLat":37.4949,"maxLng":127.1989}},
  {"name":"용인시","type":"시","province":"경기도","bbox":{"minLat":37.1611,"minLng":127.0775,"maxLat":37.3211,"maxLng":127.2775}},
  {"name":"고양시","type":"시","province":"경기도","bbox":{"minLat":37.5984,"minLng":126.7520,"maxLat":37.7184,"maxLng":126.9120}},
  {"name":"화성시","type":"시","province":"경기도","bbox":{"minLat":37.0995,"minLng":126.7114,"maxLat":37.2995,"maxLng":126.9514}},
  {"name":"남양주시","type":"시","province":"경기도","bbox":{"minLat":37.5560,"minLng":127.1165,"maxLat":37.7160,"maxLng":127.3165}},
  {"name":"안산시","type":"시","province":"경기도","bbox":{"minLat":37.2619,"minLng":126.7509,"maxLat":37.3819,"maxLng":126.9109}},
  {"name":"부천시","type":"시","province":"경기도","bbox":{"minLat":37.4535,"minLng":126.7060,"maxLat":37.5535,"maxLng":126.8260}},
  {"name":"안양시","type":"시","province":"경기도","bbox":{"minLat":37.3443,"minLng":126.8968,"maxLat":37.4443,"maxLng":127.0168}},
  {"name":"평택시","type":"시","province":"경기도","bbox":{"minLat":36.9221,"minLng":127.0229,"maxLat":37.0621,"maxLng":127.2029}},
  {"name":"파주시","type":"시","province":"경기도","bbox":{"minLat":37.6899,"minLng":126.7000,"maxLat":37.8299,"maxLng":126.8600}},
  {"name":"김포시","type":"시","province":"경기도","bbox":{"minLat":37.5453,"minLng":126.6350,"maxLat":37.6853,"maxLng":126.7950}},
  {"name":"시흥시","type":"시","province":"경기도","bbox":{"minLat":37.3300,"minLng":126.7450,"maxLat":37.4300,"maxLng":126.8650}},
  {"name":"의정부시","type":"시","province":"경기도","bbox":{"minLat":37.6881,"minLng":126.9850,"maxLat":37.7881,"maxLng":127.1050}},
  {"name":"광주시","type":"시","province":"경기도","bbox":{"minLat":37.3338,"minLng":127.1573,"maxLat":37.4938,"maxLng":127.3573}},
  {"name":"군포시","type":"시","province":"경기도","bbox":{"minLat":37.3216,"minLng":126.8850,"maxLat":37.4016,"maxLng":126.9850}},
  {"name":"하남시","type":"시","province":"경기도","bbox":{"minLat":37.4993,"minLng":127.1647,"maxLat":37.5793,"maxLng":127.2647}},
  {"name":"오산시","type":"시","province":"경기도","bbox":{"minLat":37.1099,"minLng":127.0270,"maxLat":37.1899,"maxLng":127.1270}},
  {"name":"이천시","type":"시","province":"경기도","bbox":{"minLat":37.2004,"minLng":127.3420,"maxLat":37.3604,"maxLng":127.5420}},
  {"name":"안성시","type":"시","province":"경기도","bbox":{"minLat":36.9303,"minLng":127.1703,"maxLat":37.0903,"maxLng":127.3703}},
  {"name":"춘천시","type":"시","province":"강원특별자치도","bbox":{"minLat":37.7813,"minLng":127.6100,"maxLat":37.9813,"maxLng":127.8500}},
  {"name":"원주시","type":"시","province":"강원특별자치도","bbox":{"minLat":37.2422,"minLng":127.8200,"maxLat":37.4422,"maxLng":128.0200}},
  {"name":"강릉시","type":"시","province":"강원특별자치도","bbox":{"minLat":37.6719,"minLng":128.7761,"maxLat":37.8319,"maxLng":128.9761}},
  {"name":"속초시","type":"시","province":"강원특별자치도","bbox":{"minLat":38.1543,"minLng":128.5312,"maxLat":38.2543,"maxLng":128.6512}},
  {"name":"동해시","type":"시","province":"강원특별자치도","bbox":{"minLat":37.4717,"minLng":129.0540,"maxLat":37.5717,"maxLng":129.1740}},
  {"name":"삼척시","type":"시","province":"강원특별자치도","bbox":{"minLat":37.3793,"minLng":129.0853,"maxLat":37.5193,"maxLng":129.2453}},
  {"name":"청주시","type":"시","province":"충청북도","bbox":{"minLat":36.5624,"minLng":127.3890,"maxLat":36.7224,"maxLng":127.5890}},
  {"name":"충주시","type":"시","province":"충청북도","bbox":{"minLat":36.9110,"minLng":127.8250,"maxLat":37.0710,"maxLng":128.0250}},
  {"name":"제천시","type":"시","province":"충청북도","bbox":{"minLat":37.0800,"minLng":128.1467,"maxLat":37.2200,"maxLng":128.2867}},
  {"name":"천안시","type":"시","province":"충청남도","bbox":{"minLat":36.7351,"minLng":127.0139,"maxLat":36.8951,"maxLng":127.2139}},
  {"name":"아산시","type":"시","province":"충청남도","bbox":{"minLat":36.7090,"minLng":126.9049,"maxLat":36.8690,"maxLng":127.1049}},
  {"name":"서산시","type":"시","province":"충청남도","bbox":{"minLat":36.7010,"minLng":126.3520,"maxLat":36.8610,"maxLng":126.5520}},
  {"name":"당진시","type":"시","province":"충청남도","bbox":{"minLat":36.8126,"minLng":126.5490,"maxLat":36.9726,"maxLng":126.7090}},
  {"name":"전주시","type":"시","province":"전라북도","bbox":{"minLat":35.7442,"minLng":127.0480,"maxLat":35.9042,"maxLng":127.2480}},
  {"name":"군산시","type":"시","province":"전라북도","bbox":{"minLat":35.8876,"minLng":126.6365,"maxLat":36.0476,"maxLng":126.8365}},
  {"name":"익산시","type":"시","province":"전라북도","bbox":{"minLat":35.8683,"minLng":126.8577,"maxLat":36.0283,"maxLng":127.0577}},
  {"name":"목포시","type":"시","province":"전라남도","bbox":{"minLat":34.7318,"minLng":126.2922,"maxLat":34.8918,"maxLng":126.4922}},
  {"name":"여수시","type":"시","province":"전라남도","bbox":{"minLat":34.6704,"minLng":127.5622,"maxLat":34.8504,"maxLng":127.7622}},
  {"name":"순천시","type":"시","province":"전라남도","bbox":{"minLat":34.8707,"minLng":127.3872,"maxLat":35.0307,"maxLng":127.5872}},
  {"name":"광양시","type":"시","province":"전라남도","bbox":{"minLat":34.8686,"minLng":127.6159,"maxLat":35.0086,"maxLng":127.7759}},
  {"name":"포항시","type":"시","province":"경상북도","bbox":{"minLat":35.9190,"minLng":129.2235,"maxLat":36.1190,"maxLng":129.4635}},
  {"name":"경주시","type":"시","province":"경상북도","bbox":{"minLat":35.8014,"minLng":129.4014,"maxLat":35.9414,"maxLng":129.8014}},
  {"name":"구미시","type":"시","province":"경상북도","bbox":{"minLat":36.0780,"minLng":128.2810,"maxLat":36.2380,"maxLng":128.4810}},
  {"name":"안동시","type":"시","province":"경상북도","bbox":{"minLat":36.4700,"minLng":128.6010,"maxLat":36.6500,"maxLng":128.8010}},
  {"name":"창원시","type":"시","province":"경상남도","bbox":{"minLat":35.1283,"minLng":128.5611,"maxLat":35.3283,"maxLng":128.8011}},
  {"name":"진주시","type":"시","province":"경상남도","bbox":{"minLat":35.1300,"minLng":128.0100,"maxLat":35.2900,"maxLng":128.2100}},
  {"name":"김해시","type":"시","province":"경상남도","bbox":{"minLat":35.1800,"minLng":128.7500,"maxLat":35.3400,"maxLng":128.9500}},
  {"name":"양산시","type":"시","province":"경상남도","bbox":{"minLat":35.2700,"minLng":129.0000,"maxLat":35.4300,"maxLng":129.2000}},
  {"name":"제주시","type":"시","province":"제주특별자치도","bbox":{"minLat":33.3800,"minLng":126.3000,"maxLat":33.5600,"maxLng":126.6200}},
  {"name":"서귀포시","type":"시","province":"제주특별자치도","bbox":{"minLat":33.1900,"minLng":126.3500,"maxLat":33.3400,"maxLng":126.6500}}
];

// 매장 카테고리별 이름 템플릿
const STORE_TEMPLATES = {
  한식: [
    '한식당', '밥집', '국밥집', '정식집', '갈비집', '삼겹살집', '불고기집', '비빔밥집', 
    '김치찌개집', '된장찌개집', '순두부찌개집', '부대찌개집', '김치볶음밥집', '제육볶음집',
    '한정식', '백반집', '보쌈집', '족발집', '닭갈비집', '돼지갈비집', '순대국집', '설렁탕집'
  ],
  중식: [
    '중국집', '짜장면집', '짬뽕집', '탕수육집', '마라탕집', '마라샹궈집', '딤섬집',
    '볶음밥집', '울면집', '양장피집', '깐풍기집', '팔보채집', '유린기집', '꿔바로우집', '중화요리집'
  ],
  일식: [
    '일식당', '초밥집', '라멘집', '우동집', '돈카츠집', '규동집', '사시미집', '회집',
    '야키토리집', '오코노미야키집', '타코야키집', '카츠동집', '덴푸라집', '소바집', '텐동집'
  ],
  양식: [
    '양식당', '스테이크하우스', '파스타집', '피자집', '햄버거집', '샐러드집', '브런치카페',
    '이탈리안레스토랑', '프렌치레스토랑', '그릴하우스', '비스트로', '펍', '와인바', '바베큐집'
  ],
  카페: [
    '카페', '커피숍', '디저트카페', '베이커리카페', '브런치카페', '로스터리카페',
    '스페셜티카페', '테마카페', '디저트전문점', '와플하우스', '아이스크림카페', '티하우스'
  ],
  치킨: [
    '치킨집', '후라이드치킨집', '양념치킨집', '간장치킨집', '치킨호프', '닭강정집',
    '치킨버거집', '순살치킨집', '뿌링클치킨집', '불닭치킨집', '허니콤보치킨집'
  ],
  분식: [
    '분식집', '떡볶이집', '김밥집', '순대집', '어묵집', '튀김집', '만두집',
    '라면집', '쫄면집', '냉면집', '막국수집', '칼국수집', '잔치국수집'
  ],
  술집: [
    '주점', '호프집', '맥주집', '포차', '술집', '이자카야', '와인바', '칵테일바',
    '소주방', '막걸리집', '생맥주집', '치킨호프', '안주집', '노래방주점'
  ]
};

// 대표 메뉴 템플릿
const MENU_TEMPLATES = {
  한식: [
    { name: '김치찌개', price: 8000 }, { name: '된장찌개', price: 7000 }, { name: '불고기', price: 15000 },
    { name: '갈비탕', price: 12000 }, { name: '비빔밥', price: 9000 }, { name: '제육볶음', price: 10000 },
    { name: '삼겹살', price: 16000 }, { name: '족발', price: 25000 }, { name: '보쌈', price: 23000 }
  ],
  중식: [
    { name: '짜장면', price: 7000 }, { name: '짬뽕', price: 8000 }, { name: '탕수육', price: 18000 },
    { name: '마라탕', price: 12000 }, { name: '볶음밥', price: 8000 }, { name: '깐풍기', price: 20000 }
  ],
  일식: [
    { name: '초밥세트', price: 15000 }, { name: '라멘', price: 9000 }, { name: '돈카츠', price: 11000 },
    { name: '우동', price: 7000 }, { name: '사시미', price: 25000 }, { name: '규동', price: 8000 }
  ],
  양식: [
    { name: '스테이크', price: 25000 }, { name: '파스타', price: 13000 }, { name: '피자', price: 20000 },
    { name: '햄버거', price: 12000 }, { name: '샐러드', price: 10000 }, { name: '리조또', price: 15000 }
  ],
  카페: [
    { name: '아메리카노', price: 4000 }, { name: '카페라떼', price: 4500 }, { name: '카푸치노', price: 5000 },
    { name: '케이크', price: 6000 }, { name: '샌드위치', price: 8000 }, { name: '와플', price: 7000 }
  ],
  치킨: [
    { name: '후라이드치킨', price: 16000 }, { name: '양념치킨', price: 17000 }, { name: '간장치킨', price: 17000 },
    { name: '반반치킨', price: 18000 }, { name: '닭강정', price: 15000 }, { name: '순살치킨', price: 19000 }
  ],
  분식: [
    { name: '떡볶이', price: 3000 }, { name: '김밥', price: 3500 }, { name: '라면', price: 4000 },
    { name: '순대', price: 5000 }, { name: '튀김', price: 500 }, { name: '어묵', price: 1000 }
  ],
  술집: [
    { name: '생맥주', price: 4000 }, { name: '소주', price: 4000 }, { name: '안주세트', price: 15000 },
    { name: '치킨', price: 16000 }, { name: '팬케이크', price: 12000 }, { name: '과일안주', price: 20000 }
  ]
};

// 운영시간 템플릿
const OPERATING_HOURS = [
  '09:00 - 21:00',
  '10:00 - 22:00', 
  '11:00 - 23:00',
  '24시간 운영',
  '08:00 - 20:00',
  '12:00 - 02:00',
  '17:00 - 03:00'
];

// 매장 설명 템플릿
const DESCRIPTIONS = [
  '신선한 재료로 만든 정성스러운 요리를 제공합니다.',
  '가족과 함께 즐길 수 있는 아늑한 분위기의 매장입니다.',
  '합리적인 가격으로 맛있는 음식을 즐기실 수 있습니다.',
  '정통 요리의 맛을 그대로 살린 전문점입니다.',
  '깔끔하고 위생적인 환경에서 식사하실 수 있습니다.',
  '친절한 서비스와 빠른 음식 제공이 자랑입니다.',
  '현지인들이 자주 찾는 맛집으로 유명합니다.',
  '신선한 재료만을 사용하여 건강한 음식을 만듭니다.'
];

// 전화번호 생성 함수
function generatePhoneNumber() {
  const areaCode = ['02', '031', '032', '033', '041', '042', '043', '044', '051', '052', '053', '054', '055', '061', '062', '063', '064'];
  const area = areaCode[Math.floor(Math.random() * areaCode.length)];
  const middle = Math.floor(Math.random() * 9000) + 1000;
  const last = Math.floor(Math.random() * 9000) + 1000;
  return `${area}-${middle}-${last}`;
}

// 좌표 생성 함수
function generateCoordinate(city) {
  const bbox = city.bbox;
  const lat = Math.random() * (bbox.maxLat - bbox.minLat) + bbox.minLat;
  const lng = Math.random() * (bbox.maxLng - bbox.minLng) + bbox.minLng;
  return { lat: parseFloat(lat.toFixed(6)), lng: parseFloat(lng.toFixed(6)) };
}

// 매장명 생성 함수
function generateStoreName(category, cityName) {
  const templates = STORE_TEMPLATES[category];
  const template = templates[Math.floor(Math.random() * templates.length)];
  
  const prefixes = ['맛있는', '유명한', '전통', '신선한', '특별한', '프리미엄', '고급', '정통', '본격', '진짜'];
  const suffixes = ['본점', '1호점', '2호점', '3호점', cityName + '점', '역앞점', '터미널점', '시장점', '대로점'];
  
  const usePrefix = Math.random() > 0.7;
  const useSuffix = Math.random() > 0.3;
  
  let name = template;
  if (usePrefix) {
    name = prefixes[Math.floor(Math.random() * prefixes.length)] + ' ' + name;
  }
  if (useSuffix) {
    name = name + ' ' + suffixes[Math.floor(Math.random() * suffixes.length)];
  }
  
  return name;
}

// 주소 생성 함수
function generateAddress(city, coord) {
  const districts = ['중구', '남구', '북구', '서구', '동구', '수성구', '달서구', '달성군'];
  const dongs = ['신촌동', '홍대동', '명동', '강남동', '역삼동', '논현동', '압구정동', '청담동', '삼성동', '잠실동'];
  
  const district = districts[Math.floor(Math.random() * districts.length)];
  const dong = dongs[Math.floor(Math.random() * dongs.length)];
  const buildingNum = Math.floor(Math.random() * 999) + 1;
  
  return `${city.province} ${city.name} ${district} ${dong} ${buildingNum}`;
}

// 메뉴 생성 함수
function generateMenu(category) {
  const templates = MENU_TEMPLATES[category] || MENU_TEMPLATES['한식'];
  const menuCount = Math.floor(Math.random() * 5) + 3; // 3-7개 메뉴
  const menu = [];
  
  for (let i = 0; i < menuCount; i++) {
    const template = templates[Math.floor(Math.random() * templates.length)];
    const priceVariation = Math.floor(Math.random() * 3000) - 1500; // ±1500원 변동
    menu.push({
      name: template.name,
      price: Math.max(1000, template.price + priceVariation),
      description: `신선한 재료로 만든 ${template.name}입니다.`
    });
  }
  
  return menu;
}

async function add2000Stores() {
  try {
    console.log('🏪 전국 2000개 매장 더미데이터 생성 시작...');
    
    // 현재 최대 매장 ID 조회
    const maxIdResult = await pool.query('SELECT COALESCE(MAX(id), 0) as max_id FROM stores');
    let currentMaxId = parseInt(maxIdResult.rows[0].max_id);
    
    console.log(`📊 현재 최대 매장 ID: ${currentMaxId}`);
    
    const categories = Object.keys(STORE_TEMPLATES);
    const storesPerBatch = 100; // 배치 단위
    const totalStores = 2000;
    
    for (let batch = 0; batch < Math.ceil(totalStores / storesPerBatch); batch++) {
      const batchStart = batch * storesPerBatch;
      const batchEnd = Math.min((batch + 1) * storesPerBatch, totalStores);
      const batchSize = batchEnd - batchStart;
      
      console.log(`\n📦 배치 ${batch + 1}/${Math.ceil(totalStores / storesPerBatch)} 처리 중... (${batchStart + 1}-${batchEnd}번째 매장)`);
      
      // 배치별 매장 데이터 생성 및 삽입
      for (let i = 0; i < batchSize; i++) {
        const storeIndex = batchStart + i;
        const city = NATIONAL_CITIES[Math.floor(Math.random() * NATIONAL_CITIES.length)];
        const category = categories[Math.floor(Math.random() * categories.length)];
        const coord = generateCoordinate(city);
        const storeName = generateStoreName(category, city.name);
        const address = generateAddress(city, coord);
        const menu = generateMenu(category);
        const isOpen = Math.random() > 0.15; // 85% 확률로 운영중
        const phoneNumber = generatePhoneNumber();
        const operatingHours = OPERATING_HOURS[Math.floor(Math.random() * OPERATING_HOURS.length)];
        const description = DESCRIPTIONS[Math.floor(Math.random() * DESCRIPTIONS.length)];
        
        // 별점과 리뷰 수 생성 (랜덤)
        const hasReviews = Math.random() > 0.3; // 70% 확률로 리뷰 존재
        const reviewCount = hasReviews ? Math.floor(Math.random() * 50) + 1 : 0;
        const ratingAverage = hasReviews ? (Math.random() * 2 + 3).toFixed(1) : '0.0'; // 3.0-5.0 점
        
        const newStoreId = currentMaxId + storeIndex + 1;
        
        console.log(`🏪 매장 ${newStoreId}: ${storeName} (${category}, ${city.name})`);
        
        try {
          // 매장 데이터 삽입
          await pool.query(`
            INSERT INTO stores (
              id, name, category, distance, address, menu, coord, 
              review_count, rating_average, is_open, phone, 
              description, operating_hours
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          `, [
            newStoreId,
            storeName,
            category,
            '정보없음',
            address,
            JSON.stringify(menu),
            JSON.stringify(coord),
            reviewCount,
            ratingAverage,
            isOpen,
            phoneNumber,
            description,
            operatingHours
          ]);
          
          // 각 매장에 기본 테이블 2-6개 추가
          const tableCount = Math.floor(Math.random() * 5) + 2; // 2-6개
          for (let tableNum = 1; tableNum <= tableCount; tableNum++) {
            const seats = [2, 4, 6, 8][Math.floor(Math.random() * 4)]; // 2, 4, 6, 8인석 중 랜덤
            const isOccupied = Math.random() > 0.7; // 30% 확률로 사용중
            
            await pool.query(`
              INSERT INTO store_tables (store_id, table_number, table_name, seats, is_occupied, occupied_since)
              VALUES ($1, $2, $3, $4, $5, $6)
            `, [
              newStoreId, 
              tableNum, 
              `테이블 ${tableNum}`, 
              seats, 
              isOccupied,
              isOccupied ? new Date() : null
            ]);
          }
          
        } catch (error) {
          console.error(`❌ 매장 ${newStoreId} 생성 실패:`, error.message);
        }
      }
      
      console.log(`✅ 배치 ${batch + 1} 완료 (${batchSize}개 매장)`);
      
      // 배치 간 잠시 대기 (데이터베이스 부하 방지)
      if (batch < Math.ceil(totalStores / storesPerBatch) - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // 최종 결과 확인
    const finalResult = await pool.query('SELECT COUNT(*) as total FROM stores');
    const totalStoresInDB = parseInt(finalResult.rows[0].total);
    
    console.log(`\n🎉 전국 2000개 매장 더미데이터 생성 완료!`);
    console.log(`📊 데이터베이스 총 매장 수: ${totalStoresInDB}개`);
    
    // 지역별 매장 분포 확인
    console.log('\n📍 지역별 매장 분포:');
    const regionDistribution = await pool.query(`
      SELECT 
        CASE 
          WHEN address LIKE '%서울%' THEN '서울특별시'
          WHEN address LIKE '%부산%' THEN '부산광역시'
          WHEN address LIKE '%대구%' THEN '대구광역시'
          WHEN address LIKE '%인천%' THEN '인천광역시'
          WHEN address LIKE '%광주%' THEN '광주광역시'
          WHEN address LIKE '%대전%' THEN '대전광역시'
          WHEN address LIKE '%울산%' THEN '울산광역시'
          WHEN address LIKE '%세종%' THEN '세종특별자치시'
          WHEN address LIKE '%경기도%' THEN '경기도'
          WHEN address LIKE '%강원%' THEN '강원특별자치도'
          WHEN address LIKE '%충청북도%' THEN '충청북도'
          WHEN address LIKE '%충청남도%' THEN '충청남도'
          WHEN address LIKE '%전라북도%' THEN '전라북도'
          WHEN address LIKE '%전라남도%' THEN '전라남도'
          WHEN address LIKE '%경상북도%' THEN '경상북도'
          WHEN address LIKE '%경상남도%' THEN '경상남도'
          WHEN address LIKE '%제주%' THEN '제주특별자치도'
          ELSE '기타'
        END as region,
        COUNT(*) as count
      FROM stores 
      WHERE id > ${currentMaxId}
      GROUP BY region
      ORDER BY count DESC
    `);
    
    regionDistribution.rows.forEach(row => {
      console.log(`  - ${row.region}: ${row.count}개`);
    });
    
    // 카테고리별 분포 확인
    console.log('\n🍽️ 카테고리별 매장 분포:');
    const categoryDistribution = await pool.query(`
      SELECT category, COUNT(*) as count
      FROM stores 
      WHERE id > ${currentMaxId}
      GROUP BY category
      ORDER BY count DESC
    `);
    
    categoryDistribution.rows.forEach(row => {
      console.log(`  - ${row.category}: ${row.count}개`);
    });
    
    // 운영상태 분포 확인
    const statusDistribution = await pool.query(`
      SELECT 
        CASE WHEN is_open THEN '운영중' ELSE '운영중지' END as status,
        COUNT(*) as count
      FROM stores 
      WHERE id > ${currentMaxId}
      GROUP BY is_open
    `);
    
    console.log('\n🏪 운영상태 분포:');
    statusDistribution.rows.forEach(row => {
      console.log(`  - ${row.status}: ${row.count}개`);
    });
    
  } catch (error) {
    console.error('❌ 2000개 매장 생성 실패:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

// 스크립트 실행
add2000Stores();
