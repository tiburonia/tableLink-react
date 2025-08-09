
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

// 더 다양한 매장 카테고리별 이름 템플릿
const STORE_TEMPLATES = {
  한식: [
    '한식당', '정성한식', '전통밥집', '고향밥상', '한정식', '한옥마을', '정갈한밥상', '감동한식',
    '국밥전문점', '김치찌개집', '된장찌개마을', '순두부찌개집', '부대찌개전문점', '제육볶음집',
    '갈비천국', '삼겹살구이', '불고기명가', '족발보쌈', '닭갈비마을', '순대국밥',
    '설렁탕전문점', '곰탕집', '갈비탕명가', '삼계탕집', '냉면전문점', '막국수집'
  ],
  중식: [
    '중국관', '차이나타운', '홍콩반점', '베이징반점', '상해각', '화룡각', '금룡각', '용궁각',
    '짜장면의달인', '짬뽕나라', '탕수육전문점', '마라탕천국', '마라샹궈집', '딤섬전문점',
    '유린기명가', '깐풍기집', '양장피전문점', '중화요리전문점', '사천요리', '광동요리',
    '볶음밥전문점', '울면집', '크림새우', '라조기집', '팔보채전문점', '양꼬치집'
  ],
  일식: [
    '스시야', '이자카야', '와라쿠', '사쿠라테이', '도쿄식당', '오사카반점', '교토정식',
    '라멘상점', '우동집', '소바전문점', '돈카츠전문점', '규동집', '사시미전문점',
    '야키토리집', '타코야키전문점', '오코노미야키집', '덴푸라집', '회전초밥', '스시오마카세',
    '가츠동집', '텐동전문점', '모츠나베', '샤브샤브전문점', '일식정통집', '하이볼바'
  ],
  양식: [
    '비스트로', '트라토리아', '브라세리', '스테이크하우스', '그릴레스토랑', '파스타하우스',
    '이탈리안키친', '프렌치카페', '와인바', '펍', '브루어리', '피자리아',
    '햄버거팩토리', '샐러드바', '브런치카페', '팬케이크하우스', '오믈렛전문점',
    '리조또전문점', '바베큐하우스', '로스트비프', '그릴치킨', '파니니전문점'
  ],
  카페: [
    '카페베네', '투썸플레이스', '스타벅스', '이디야커피', '커피빈', '할리스커피',
    '로스터리카페', '핸드드립전문점', '디저트카페', '베이커리카페', '브런치카페',
    '테마카페', '북카페', '갤러리카페', '루프탑카페', '힐링카페', '감성카페',
    '와플하우스', '아이스크림카페', '티하우스', '차전문점', '마카롱전문점'
  ],
  치킨: [
    '교촌치킨', 'BBQ', '후라이드참잘하는집', 'BHC', '네네치킨', '굽네치킨',
    '양념치킨전문점', '바삭치킨', '순살치킨집', '닭강정전문점', '치킨앤비어',
    '치킨호프', '치킨버거전문점', '뿌링클치킨', '불닭치킨', '허니콤보치킨',
    '간장치킨집', '갈릭치킨', '치킨윙전문점', '치킨텐더', '핫윙전문점'
  ],
  분식: [
    '분식천국', '떡볶이명가', '김밥나라', '순대타운', '어묵집', '튀김마을',
    '떡볶이의신', '김밥천국', '라면사랑', '쫄면집', '냉면전문점', '막국수집',
    '칼국수전문점', '잔치국수집', '만두전문점', '떡볶이카페', '분식코너',
    '즉석떡볶이', '포장마차', '길거리음식', '학교앞분식', '전통분식'
  ],
  술집: [
    '이자카야', '호프집', '맥주창고', '포차', '선술집', '주점', '와인바',
    '칵테일바', '펜션바', '루프탑바', '스포츠바', '맥주전문점', '생맥주집',
    '소주방', '막걸리집', '전통주점', '치킨호프', '안주전문점', '노래방주점',
    '감성주점', '개미집', '소맥집', '하이볼바', '위스키바', '사케바'
  ]
};

// 더 풍부한 메뉴 템플릿
const MENU_TEMPLATES = {
  한식: [
    { name: '김치찌개', price: 8000, desc: '신김치로 끓인 얼큰한 김치찌개' },
    { name: '된장찌개', price: 7000, desc: '구수한 된장으로 끓인 시원한 국물' },
    { name: '불고기', price: 15000, desc: '달콤하게 양념한 한우 불고기' },
    { name: '갈비탕', price: 12000, desc: '푸짐한 갈비가 들어간 보양탕' },
    { name: '비빔밥', price: 9000, desc: '신선한 나물과 고슬고슬한 밥' },
    { name: '제육볶음', price: 10000, desc: '매콤달콤한 돼지고기 볶음' },
    { name: '삼겹살', price: 16000, desc: '구이용 신선한 삼겹살' },
    { name: '족발', price: 25000, desc: '부드럽게 삶은 대족발' },
    { name: '보쌈', price: 23000, desc: '수육과 신선한 쌈야채' },
    { name: '순두부찌개', price: 8500, desc: '부드러운 순두부와 해산물' },
    { name: '부대찌개', price: 9000, desc: '햄과 소시지가 들어간 얼큰한 찌개' },
    { name: '설렁탕', price: 11000, desc: '진한 사골 국물의 설렁탕' }
  ],
  중식: [
    { name: '짜장면', price: 7000, desc: '진한 춘장소스의 전통 짜장면' },
    { name: '짬뽕', price: 8000, desc: '얼큰한 해물이 가득한 짬뽁' },
    { name: '탕수육', price: 18000, desc: '바삭한 돼지고기와 새콤달콤한 소스' },
    { name: '마라탕', price: 12000, desc: '얼얼한 중국식 마라 국물요리' },
    { name: '볶음밥', price: 8000, desc: '고슬고슬한 계란볶음밥' },
    { name: '깐풍기', price: 20000, desc: '바삭한 닭고기와 달콤한 소스' },
    { name: '유린기', price: 19000, desc: '부드러운 닭고기와 특제 소스' },
    { name: '양장피', price: 15000, desc: '쫄깃한 면과 새콤달콤한 소스' },
    { name: '마라샹궈', price: 14000, desc: '매운 향신료로 볶은 중국식 요리' },
    { name: '딤섬', price: 16000, desc: '다양한 중국식 만두' }
  ],
  일식: [
    { name: '초밥세트', price: 15000, desc: '신선한 회와 샤리의 조화' },
    { name: '라멘', price: 9000, desc: '진한 돈코츠 국물의 라멘' },
    { name: '돈카츠', price: 11000, desc: '바삭한 돼지고기 튀김' },
    { name: '우동', price: 7000, desc: '쫄깃한 면과 깔끔한 국물' },
    { name: '사시미', price: 25000, desc: '신선한 회 모듬' },
    { name: '규동', price: 8000, desc: '달콤하게 조린 소고기 덮밥' },
    { name: '야키토리', price: 12000, desc: '숯불에 구운 닭꼬치' },
    { name: '타코야키', price: 6000, desc: '문어가 들어간 일본식 튀김' },
    { name: '덴푸라', price: 13000, desc: '바삭한 새우와 야채 튀김' },
    { name: '소바', price: 8500, desc: '메밀면과 시원한 쯔유' }
  ],
  양식: [
    { name: '스테이크', price: 25000, desc: '육즙 가득한 프리미엄 스테이크' },
    { name: '파스타', price: 13000, desc: '알덴테로 삶은 정통 파스타' },
    { name: '피자', price: 20000, desc: '수제 도우와 신선한 토핑' },
    { name: '햄버거', price: 12000, desc: '육즙 가득한 패티와 신선한 야채' },
    { name: '샐러드', price: 10000, desc: '신선한 야채와 드레싱' },
    { name: '리조또', price: 15000, desc: '크리미한 이탈리안 리조또' },
    { name: '그릴치킨', price: 14000, desc: '허브로 양념한 그릴 치킨' },
    { name: '바베큐립', price: 22000, desc: '부드러운 돼지갈비 바베큐' },
    { name: '파니니', price: 9000, desc: '따뜻하게 구운 샌드위치' },
    { name: '브루스케타', price: 8000, desc: '토마토와 바질의 이탈리안 전채' }
  ],
  카페: [
    { name: '아메리카노', price: 4000, desc: '진한 원두의 깔끔한 커피' },
    { name: '카페라떼', price: 4500, desc: '부드러운 우유와 에스프레소' },
    { name: '카푸치노', price: 5000, desc: '풍성한 우유거품의 커피' },
    { name: '케이크', price: 6000, desc: '달콤한 수제 케이크' },
    { name: '샌드위치', price: 8000, desc: '신선한 재료의 샌드위치' },
    { name: '와플', price: 7000, desc: '바삭한 벨기에 와플' },
    { name: '마카롱', price: 2500, desc: '달콤한 프렌치 마카롱' },
    { name: '크로와상', price: 3500, desc: '버터향 가득한 크로와상' },
    { name: '스콘', price: 4000, desc: '영국식 전통 스콘' },
    { name: '카페모카', price: 5500, desc: '초콜릿과 커피의 만남' }
  ],
  치킨: [
    { name: '후라이드치킨', price: 16000, desc: '바삭하게 튀긴 클래식 치킨' },
    { name: '양념치킨', price: 17000, desc: '달콤매콤한 양념 치킨' },
    { name: '간장치킨', price: 17000, desc: '고소한 간장 양념 치킨' },
    { name: '반반치킨', price: 18000, desc: '후라이드와 양념 반반' },
    { name: '닭강정', price: 15000, desc: '쫄깃한 닭고기 강정' },
    { name: '순살치킨', price: 19000, desc: '뼈없는 부드러운 치킨' },
    { name: '갈릭치킨', price: 18000, desc: '마늘향 가득한 치킨' },
    { name: '허니치킨', price: 17500, desc: '달콤한 꿀 양념 치킨' },
    { name: '불닭치킨', price: 18500, desc: '매콤한 불닭 양념' },
    { name: '치킨윙', price: 14000, desc: '바삭한 닭날개' }
  ],
  분식: [
    { name: '떡볶이', price: 3000, desc: '매콤달콤한 즉석 떡볶이' },
    { name: '김밥', price: 3500, desc: '신선한 재료의 김밥' },
    { name: '라면', price: 4000, desc: '뜨끈한 라면' },
    { name: '순대', price: 5000, desc: '찰진 순대' },
    { name: '튀김', price: 500, desc: '바삭한 야채튀김' },
    { name: '어묵', price: 1000, desc: '따뜻한 어묵탕' },
    { name: '참치김밥', price: 4000, desc: '참치가 들어간 김밥' },
    { name: '쫄면', price: 4500, desc: '새콤달콤한 쫄면' },
    { name: '만두', price: 3000, desc: '속이 꽉찬 군만두' },
    { name: '잔치국수', price: 3500, desc: '따뜻한 멸치국수' }
  ],
  술집: [
    { name: '생맥주', price: 4000, desc: '시원한 생맥주 500ml' },
    { name: '소주', price: 4000, desc: '깔끔한 소주' },
    { name: '안주세트', price: 15000, desc: '다양한 안주 모음' },
    { name: '치킨', price: 16000, desc: '바삭한 후라이드 치킨' },
    { name: '파전', price: 12000, desc: '바삭한 해물파전' },
    { name: '과일안주', price: 20000, desc: '신선한 과일 모음' },
    { name: '하이볼', price: 6000, desc: '위스키 하이볼' },
    { name: '막걸리', price: 5000, desc: '전통 막걸리' },
    { name: '족발', price: 28000, desc: '보쌈과 함께하는 족발' },
    { name: '오징어', price: 8000, desc: '마른오징어 안주' }
  ]
};

// 동 이름 리스트 (더 다양하게)
const DONG_NAMES = [
  '신촌동', '홍대동', '명동', '강남동', '역삼동', '논현동', '압구정동', '청담동', '삼성동', '잠실동',
  '서초동', '반포동', '한남동', '이태원동', '용산동', '종로동', '을지로동', '중구동', '성북동', '성수동',
  '건대동', '왕십리동', '동대문동', '혜화동', '대학로', '창신동', '제기동', '회기동', '석계동', '중계동',
  '태릉동', '공릉동', '하계동', '월계동', '상계동', '도봉동', '방학동', '창동', '수유동', '미아동',
  '번동', '길음동', '정릉동', '북가좌동', '홍제동', '연희동', '서대문동', '현저동', '합정동', '망원동',
  '상암동', '성산동', '마포동', '공덕동', '아현동', '신수동', '충정로동', '서소문동', '회현동', '광희동'
];

// 구 이름 리스트
const GU_NAMES = [
  '중구', '종로구', '용산구', '성동구', '광진구', '동대문구', '중랑구', '성북구', '강북구', '도봉구',
  '노원구', '은평구', '서대문구', '마포구', '양천구', '강서구', '구로구', '금천구', '영등포구', '동작구',
  '관악구', '서초구', '강남구', '송파구', '강동구', '남구', '북구', '서구', '동구', '수성구',
  '달서구', '달성군', '해운대구', '사하구', '부산진구', '동래구', '남구', '연제구', '수영구'
];

// 좌표 생성 함수
function generateCoordinate(city) {
  const bbox = city.bbox;
  const lat = Math.random() * (bbox.maxLat - bbox.minLat) + bbox.minLat;
  const lng = Math.random() * (bbox.maxLng - bbox.minLng) + bbox.minLng;
  return { lat: parseFloat(lat.toFixed(6)), lng: parseFloat(lng.toFixed(6)) };
}

// 더 창의적인 매장명 생성 함수
function generateStoreName(category, cityName) {
  const templates = STORE_TEMPLATES[category];
  const template = templates[Math.floor(Math.random() * templates.length)];
  
  const prefixes = [
    '맛있는', '유명한', '전통', '신선한', '특별한', '프리미엄', '고급', '정통', '본격', '진짜',
    '황금', '명품', '최고의', '신토불이', '1등', '원조', '할머니의', '손맛', '정성', '사랑방',
    '금강산', '백두산', '한라산', '설악산', '지리산', '옛날', '추억의', '감성', '힐링', '행복한'
  ];
  
  const suffixes = [
    '본점', '1호점', '2호점', '3호점', cityName + '점', '역앞점', '터미널점', '시장점', '대로점',
    '광장점', '센터점', '타워점', '플라자점', '몰점', '거리점', '골목점', '마을점', '동네점',
    '명가', '전문점', '하우스', '레스토랑', '키친', '팩토리', '코너', '카페', '바', '펍'
  ];
  
  const usePrefix = Math.random() > 0.6;
  const useSuffix = Math.random() > 0.2;
  
  let name = template;
  if (usePrefix) {
    name = prefixes[Math.floor(Math.random() * prefixes.length)] + ' ' + name;
  }
  if (useSuffix) {
    name = name + ' ' + suffixes[Math.floor(Math.random() * suffixes.length)];
  }
  
  return name;
}

// 상세 주소 생성 함수 (sido, sigungu, dong 분리)
function generateDetailedAddress(city, coord) {
  const sido = city.province;
  const sigungu = city.name;
  const dong = DONG_NAMES[Math.floor(Math.random() * DONG_NAMES.length)];
  const buildingNum = Math.floor(Math.random() * 999) + 1;
  const detailNum = Math.floor(Math.random() * 99) + 1;
  
  const fullAddress = `${sido} ${sigungu} ${dong} ${buildingNum}-${detailNum}`;
  
  return {
    fullAddress,
    sido,
    sigungu,
    dong
  };
}

// 지역 코드 생성 함수
function generateRegionCode(sido) {
  const regionCodes = {
    '서울특별시': '11',
    '부산광역시': '21',
    '대구광역시': '22',
    '인천광역시': '23',
    '광주광역시': '24',
    '대전광역시': '25',
    '울산광역시': '26',
    '세종특별자치시': '29',
    '경기도': '31',
    '강원특별자치도': '32',
    '충청북도': '33',
    '충청남도': '34',
    '전라북도': '35',
    '전라남도': '36',
    '경상북도': '37',
    '경상남도': '38',
    '제주특별자치도': '39'
  };
  
  return regionCodes[sido] || '99';
}

// 더 다양한 메뉴 생성 함수
function generateMenu(category) {
  const templates = MENU_TEMPLATES[category] || MENU_TEMPLATES['한식'];
  const menuCount = Math.floor(Math.random() * 6) + 4; // 4-9개 메뉴
  const menu = [];
  const usedMenus = new Set();
  
  for (let i = 0; i < menuCount && i < templates.length; i++) {
    let template;
    do {
      template = templates[Math.floor(Math.random() * templates.length)];
    } while (usedMenus.has(template.name) && usedMenus.size < templates.length);
    
    usedMenus.add(template.name);
    
    const priceVariation = Math.floor(Math.random() * 4000) - 2000; // ±2000원 변동
    menu.push({
      name: template.name,
      price: Math.max(1000, template.price + priceVariation),
      description: template.desc || `신선한 재료로 만든 ${template.name}입니다.`
    });
  }
  
  return menu;
}

async function add2000Stores() {
  try {
    console.log('🏪 전국 2000개 매장 더미데이터 생성 시작...');
    
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
        const addressInfo = generateDetailedAddress(city, coord);
        const menu = generateMenu(category);
        const isOpen = Math.random() > 0.15; // 85% 확률로 운영중
        
        // 별점과 리뷰 수 생성 (랜덤)
        const hasReviews = Math.random() > 0.3; // 70% 확률로 리뷰 존재
        const reviewCount = hasReviews ? Math.floor(Math.random() * 100) + 1 : 0;
        const ratingAverage = hasReviews ? parseFloat((Math.random() * 2 + 3).toFixed(1)) : 0.0; // 3.0-5.0 점
        
        const regionCode = generateRegionCode(addressInfo.sido);
        
        console.log(`🏪 매장 생성: ${storeName} (${category}, ${city.name})`);
        
        try {
          // 매장 데이터 삽입하고 생성된 ID 반환받기
          const storeResult = await pool.query(`
            INSERT INTO stores (
              name, category, distance, address, menu, coord, 
              review_count, rating_average, is_open, address_status,
              sido, sigungu, dong, region_code
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING id
          `, [
            storeName,
            category,
            '정보없음',
            addressInfo.fullAddress,
            JSON.stringify(menu),
            JSON.stringify(coord),
            reviewCount,
            ratingAverage,
            isOpen,
            'complete', // address_status
            addressInfo.sido,
            addressInfo.sigungu,
            addressInfo.dong,
            regionCode
          ]);
          
          const newStoreId = storeResult.rows[0].id;
          console.log(`✅ 매장 ${newStoreId} 생성 완료: ${storeName}`);
          
          // 각 매장에 기본 테이블 2-8개 추가
          const tableCount = Math.floor(Math.random() * 7) + 2; // 2-8개
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
          console.error(`❌ 매장 생성 실패:`, error.message);
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
      SELECT sido, COUNT(*) as count
      FROM stores 
      WHERE sido IS NOT NULL
      GROUP BY sido
      ORDER BY count DESC
    `);
    
    regionDistribution.rows.forEach(row => {
      console.log(`  - ${row.sido}: ${row.count}개`);
    });
    
    // 카테고리별 분포 확인
    console.log('\n🍽️ 카테고리별 매장 분포:');
    const categoryDistribution = await pool.query(`
      SELECT category, COUNT(*) as count
      FROM stores 
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
      GROUP BY is_open
    `);
    
    console.log('\n🏪 운영상태 분포:');
    statusDistribution.rows.forEach(row => {
      console.log(`  - ${row.status}: ${row.count}개`);
    });
    
    console.log('\n✅ 모든 매장에 주소 상세 정보(sido, sigungu, dong, region_code) 포함 완료');
    
  } catch (error) {
    console.error('❌ 2000개 매장 생성 실패:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

// 스크립트 실행
add2000Stores();
