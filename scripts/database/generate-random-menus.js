
const pool = require('../../shared/config/database');

// 카테고리별 메뉴 템플릿
const menuTemplates = {
  한식: ['김치찌개', '된장찌개', '불고기', '비빔밥', '냉면', '갈비탕', '삼계탕', '김치볶음밥', '제육볶음', '순두부찌개'],
  중식: ['짜장면', '짬뽕', '탕수육', '볶음밥', '마파두부', '깐풍기', '라조기', '울면', '팔보채', '고추잡채'],
  일식: ['초밥', '라멘', '돈카츠', '우동', '소바', '가라아게', '야키토리', '테리야키', '오니기리', '텐동'],
  양식: ['스테이크', '파스타', '피자', '햄버거', '리조또', '샐러드', '수프', '오믈렛', '그라탕', '라자냐'],
  카페: ['아메리카노', '카페라떼', '카푸치노', '에스프레소', '프라푸치노', '차', '스무디', '케이크', '쿠키', '샌드위치'],
  치킨: ['후라이드치킨', '양념치킨', '간장치킨', '마늘치킨', '허니머스타드치킨', '불닭치킨', '순살치킨', '반반치킨', '치킨버거', '치킨샐러드'],
  분식: ['떡볶이', '김밥', '순대', '어묵', '튀김', '라면', '쫄면', '냉면', '만두', '칼국수'],
  술집: ['안주세트', '치킨', '과일안주', '마른안주', '해산물안주', '육류안주', '튀김안주', '샐러드', '피자', '파스타']
};

// 가격 범위 (카테고리별)
const priceRanges = {
  한식: [8000, 15000],
  중식: [7000, 12000],
  일식: [10000, 20000],
  양식: [12000, 25000],
  카페: [3000, 8000],
  치킨: [15000, 25000],
  분식: [3000, 8000],
  술집: [5000, 15000]
};

// 랜덤 메뉴 생성 함수
function generateRandomMenus(category, count) {
  const templates = menuTemplates[category] || menuTemplates['한식']; // 기본값으로 한식 사용
  const priceRange = priceRanges[category] || [5000, 15000]; // 기본 가격 범위
  
  const menus = [];
  const usedMenus = new Set();
  
  // 카테고리명으로 메뉴 생성 (요청사항 반영)
  for (let i = 1; i <= count; i++) {
    const menuName = `${category}${i}`;
    const price = Math.floor(Math.random() * (priceRange[1] - priceRange[0] + 1)) + priceRange[0];
    const roundedPrice = Math.round(price / 500) * 500; // 500원 단위로 반올림
    
    menus.push({
      name: menuName,
      price: roundedPrice,
      description: `맛있는 ${menuName}입니다.`,
      isAvailable: Math.random() > 0.1 // 90% 확률로 주문 가능
    });
  }
  
  return menus;
}

async function generateRandomMenusForStores() {
  try {
    console.log('🍽️ stores 테이블 빈 메뉴 배열 매장들에 랜덤 메뉴 생성 시작...');
    
    // 빈 메뉴 배열을 가진 매장들 조회
    const emptyMenuStores = await pool.query(`
      SELECT id, name, category 
      FROM stores 
      WHERE menu = '[]'::jsonb OR menu IS NULL
      ORDER BY id
    `);
    
    console.log(`📊 빈 메뉴 배열을 가진 매장 수: ${emptyMenuStores.rows.length}개`);
    
    if (emptyMenuStores.rows.length === 0) {
      console.log('✅ 모든 매장에 이미 메뉴가 설정되어 있습니다.');
      return;
    }
    
    console.log('📋 메뉴 생성 대상 매장들 (처음 10개):');
    emptyMenuStores.rows.slice(0, 10).forEach(store => {
      console.log(`  - 매장 ${store.id}: ${store.name} (${store.category})`);
    });
    
    if (emptyMenuStores.rows.length > 10) {
      console.log(`  ... 및 ${emptyMenuStores.rows.length - 10}개 더`);
    }
    
    let processedCount = 0;
    let successCount = 0;
    
    // 각 매장에 대해 메뉴 생성
    for (const store of emptyMenuStores.rows) {
      try {
        const menuCount = Math.floor(Math.random() * 3) + 3; // 3~5개 랜덤
        const randomMenus = generateRandomMenus(store.category, menuCount);
        
        console.log(`🏪 매장 ${store.id} (${store.name}) - ${store.category} 카테고리, ${menuCount}개 메뉴 생성 중...`);
        
        // 메뉴 업데이트
        await pool.query(`
          UPDATE stores 
          SET menu = $1 
          WHERE id = $2
        `, [JSON.stringify(randomMenus), store.id]);
        
        console.log(`  ✅ 생성된 메뉴: ${randomMenus.map(m => `${m.name}(${m.price}원)`).join(', ')}`);
        
        successCount++;
        
        // 진행률 표시 (100개마다)
        if (processedCount % 100 === 0 && processedCount > 0) {
          console.log(`📊 진행률: ${processedCount}/${emptyMenuStores.rows.length} (${Math.round(processedCount/emptyMenuStores.rows.length*100)}%)`);
        }
        
      } catch (error) {
        console.error(`❌ 매장 ${store.id} 메뉴 생성 실패:`, error.message);
      }
      
      processedCount++;
    }
    
    console.log('\n🎉 랜덤 메뉴 생성 완료!');
    console.log(`📊 처리된 매장: ${processedCount}개`);
    console.log(`✅ 성공: ${successCount}개`);
    console.log(`❌ 실패: ${processedCount - successCount}개`);
    
    // 최종 검증
    const verificationResult = await pool.query(`
      SELECT 
        COUNT(*) as total_stores,
        COUNT(CASE WHEN menu = '[]'::jsonb OR menu IS NULL THEN 1 END) as empty_menu_stores,
        COUNT(CASE WHEN menu != '[]'::jsonb AND menu IS NOT NULL THEN 1 END) as with_menu_stores
      FROM stores
    `);
    
    const stats = verificationResult.rows[0];
    console.log('\n📈 최종 통계:');
    console.log(`  📊 전체 매장: ${stats.total_stores}개`);
    console.log(`  🍽️ 메뉴가 있는 매장: ${stats.with_menu_stores}개`);
    console.log(`  📭 빈 메뉴 매장: ${stats.empty_menu_stores}개`);
    
    if (parseInt(stats.empty_menu_stores) === 0) {
      console.log('🎊 모든 매장에 메뉴가 성공적으로 생성되었습니다!');
    }
    
  } catch (error) {
    console.error('❌ 랜덤 메뉴 생성 실패:', error);
  } finally {
    process.exit(0);
  }
}

// 스크립트 실행
if (require.main === module) {
  generateRandomMenusForStores();
}

module.exports = { generateRandomMenusForStores, generateRandomMenus };
