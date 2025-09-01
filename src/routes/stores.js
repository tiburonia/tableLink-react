const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// 매장 목록 조회 (메인 지도용)
router.get('/', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    console.log(`🏪 매장 목록 조회 요청 (limit: ${limit}, offset: ${offset})`);

    const result = await pool.query(`
      SELECT 
        s.id,
        s.name,
        s.category,
        s.rating_average,
        s.review_count,
        s.favorite_count,
        s.is_open,
        sa.address_full as address,
        sa.latitude,
        sa.longitude,
        sa.sido,
        sa.sigungu,
        sa.eupmyeondong
      FROM stores s
      LEFT JOIN store_address sa ON s.id = sa.store_id
      WHERE s.is_open = true
      ORDER BY s.id
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    const stores = result.rows.map(store => ({
      id: store.id,
      name: store.name,
      category: store.category,
      address: store.address || '주소 정보 없음',
      ratingAverage: store.rating_average ? parseFloat(store.rating_average) : 0.0,
      reviewCount: store.review_count || 0,
      favoriteCount: store.favorite_count || 0,
      isOpen: store.is_open !== false,
      coord: store.latitude && store.longitude 
        ? { lat: parseFloat(store.latitude), lng: parseFloat(store.longitude) }
        : null,
      region: {
        sido: store.sido,
        sigungu: store.sigungu,
        eupmyeondong: store.eupmyeondong
      }
    }));

    console.log(`✅ 매장 목록 조회 완료: ${stores.length}개`);

    res.json({
      success: true,
      stores: stores,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: stores.length
      }
    });

  } catch (error) {
    console.error('❌ 매장 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '매장 목록 조회 실패'
    });
  }
});

// 매장 상세 정보 조회
router.get('/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;

    // 특수 경로들 처리
    if (storeId === 'get-location-info') {
      return handleLocationInfo(req, res);
    }
    if (storeId === 'viewport') {
      return handleViewport(req, res);
    }

    console.log(`🏪 매장 ${storeId} 상세 정보 조회 요청`);

    // 1. 매장 기본 정보
    const storeResult = await pool.query(`
      SELECT 
        s.*,
        sa.address_full,
        sa.latitude,
        sa.longitude,
        sa.sido,
        sa.sigungu,
        sa.eupmyeondong
      FROM stores s
      LEFT JOIN store_address sa ON s.id = sa.store_id
      WHERE s.id = $1
    `, [storeId]);

    if (storeResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '매장을 찾을 수 없습니다'
      });
    }

    const store = storeResult.rows[0];
    console.log(`✅ 매장 ${storeId} 기본 정보 조회 완료: ${store.name}`);

    // 2. 테이블 정보 조회
    const tablesResult = await pool.query(`
      SELECT table_number, is_occupied, occupied_by, occupied_at
      FROM store_tables
      WHERE store_id = $1
      ORDER BY table_number
    `, [storeId]);

    const occupiedCount = tablesResult.rows.filter(t => t.is_occupied).length;
    console.log(`🪑 테이블 정보: 총 ${tablesResult.rows.length}개, 사용중 ${occupiedCount}개, 빈 테이블 ${tablesResult.rows.length - occupiedCount}개`);

    // 3. 기본 메뉴 정보 (카테고리별 하드코딩)
    const defaultMenus = getDefaultMenusByCategory(store.category);
    console.log(`🍽️ 메뉴 배열 형태: ${defaultMenus.length}개 메뉴`);

    // 4. 프로모션 정보
    const promotionsResult = await pool.query(`
      SELECT * FROM store_promotions
      WHERE store_id = $1 AND is_active = true
      ORDER BY created_at DESC
    `, [storeId]);

    console.log(`✅ 매장 ${storeId} 상세 정보 조회 완료`);

    res.json({
      success: true,
      store: {
        id: store.id,
        name: store.name,
        category: store.category,
        description: store.description,
        address: store.address_full || '주소 정보 없음',
        coord: store.latitude && store.longitude 
          ? { lat: parseFloat(store.latitude), lng: parseFloat(store.longitude) }
          : null,
        region: {
          sido: store.sido,
          sigungu: store.sigungu,
          eupmyeondong: store.eupmyeondong
        },
        ratingAverage: store.rating_average ? parseFloat(store.rating_average) : 0.0,
        reviewCount: store.review_count || 0,
        favoriteCount: store.favorite_count || 0,
        isOpen: store.is_open !== false,
        menu: defaultMenus,
        tables: tablesResult.rows.map(t => ({
          number: t.table_number,
          isOccupied: t.is_occupied,
          occupiedBy: t.occupied_by,
          occupiedAt: t.occupied_at
        })),
        promotions: promotionsResult.rows,
        createdAt: store.created_at
      }
    });

  } catch (error) {
    console.error('❌ 매장 상세 정보 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '매장 정보 조회 실패'
    });
  }
});

// 기본 메뉴 생성 함수 (카테고리별)
function getDefaultMenusByCategory(category) {
  const menusByCategory = {
    '치킨': [
      { name: '양념치킨', price: 18000, description: '매콤달콤한 양념치킨' },
      { name: '후라이드치킨', price: 16000, description: '바삭한 후라이드치킨' },
      { name: '순살치킨', price: 19000, description: '뼈없는 순살치킨' },
      { name: '간장치킨', price: 18000, description: '담백한 간장치킨' },
      { name: '치킨무', price: 3000, description: '시원한 치킨무' },
      { name: '콜라', price: 2000, description: '시원한 콜라' }
    ],
    '양식': [
      { name: '마르게리타 피자', price: 15000, description: '클래식 마르게리타' },
      { name: '페퍼로니 피자', price: 18000, description: '매콤한 페퍼로니' },
      { name: '파스타', price: 12000, description: '크림 파스타' },
      { name: '리조또', price: 14000, description: '버섯 리조또' },
      { name: '샐러드', price: 8000, description: '신선한 샐러드' },
      { name: '콜라', price: 2500, description: '시원한 콜라' }
    ],
    '한식': [
      { name: '김치찌개', price: 8000, description: '얼큰한 김치찌개' },
      { name: '된장찌개', price: 7000, description: '구수한 된장찌개' },
      { name: '불고기', price: 15000, description: '달콤한 불고기' },
      { name: '비빔밥', price: 9000, description: '영양만점 비빔밥' },
      { name: '공기밥', price: 1000, description: '갓지은 밥' },
      { name: '음료수', price: 2000, description: '시원한 음료' }
    ]
  };

  return menusByCategory[category] || [
    { name: '기본메뉴1', price: 10000, description: '기본 메뉴' },
    { name: '기본메뉴2', price: 12000, description: '기본 메뉴' },
    { name: '음료', price: 2000, description: '시원한 음료' }
  ];
}

// 매장 검색
router.get('/search/:keyword', async (req, res) => {
  try {
    const { keyword } = req.params;
    const { limit = 20 } = req.query;

    console.log(`🔍 매장 검색 요청: "${keyword}"`);

    const result = await pool.query(`
      SELECT 
        s.id,
        s.name,
        s.category,
        s.rating_average,
        s.review_count,
        s.favorite_count,
        s.is_open,
        sa.address_full as address,
        sa.latitude,
        sa.longitude
      FROM stores s
      LEFT JOIN store_address sa ON s.id = sa.store_id
      WHERE s.is_open = true
      AND (
        s.name ILIKE $1 
        OR s.category ILIKE $1 
        OR sa.address_full ILIKE $1
        OR sa.eupmyeondong ILIKE $1
      )
      ORDER BY s.rating_average DESC, s.review_count DESC
      LIMIT $2
    `, [`%${keyword}%`, limit]);

    const stores = result.rows.map(store => ({
      id: store.id,
      name: store.name,
      category: store.category,
      address: store.address || '주소 정보 없음',
      ratingAverage: store.rating_average ? parseFloat(store.rating_average) : 0.0,
      reviewCount: store.review_count || 0,
      favoriteCount: store.favorite_count || 0,
      isOpen: store.is_open !== false,
      coord: store.latitude && store.longitude 
        ? { lat: parseFloat(store.latitude), lng: parseFloat(store.longitude) }
        : null
    }));

    console.log(`✅ 매장 검색 완료: "${keyword}" - ${stores.length}개 결과`);

    res.json({
      success: true,
      keyword: keyword,
      stores: stores,
      count: stores.length
    });

  } catch (error) {
    console.error('❌ 매장 검색 실패:', error);
    res.status(500).json({
      success: false,
      error: '매장 검색 실패'
    });
  }
});

// 뷰포트 기반 매장 조회
router.get('/viewport', async (req, res) => {
  const { swLat, swLng, neLat, neLng, level } = req.query;

  try {
    console.log('🏪 뷰포트 매장 조회:', { swLat, swLng, neLat, neLng, level });

    const result = await pool.query(`
      SELECT 
        s.id, s.name, s.category, s.rating_average, s.review_count, s.is_open,
        sa.address_full as address, sa.latitude, sa.longitude
      FROM stores s
      LEFT JOIN store_address sa ON s.id = sa.store_id
      WHERE sa.latitude BETWEEN $1 AND $3
        AND sa.longitude BETWEEN $2 AND $4
        AND s.is_open = true
      ORDER BY s.rating_average DESC, s.id ASC
      LIMIT 50
    `, [parseFloat(swLat), parseFloat(swLng), parseFloat(neLat), parseFloat(neLng)]);

    const stores = result.rows.map(store => ({
      id: store.id,
      name: store.name,
      category: store.category,
      address: store.address || '주소 정보 없음',
      ratingAverage: store.rating_average ? parseFloat(store.rating_average) : 0.0,
      reviewCount: store.review_count || 0,
      isOpen: store.is_open !== false,
      coord: store.latitude && store.longitude 
        ? { lat: parseFloat(store.latitude), lng: parseFloat(store.longitude) }
        : null
    }));

    console.log(`✅ 뷰포트 매장 조회 완료: ${stores.length}개`);

    res.json({
      success: true,
      stores: stores
    });

  } catch (error) {
    console.error('❌ 뷰포트 매장 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '뷰포트 매장 조회 중 오류가 발생했습니다.'
    });
  }
});

// 위치 정보 조회
router.get('/get-location-info', async (req, res) => {
  const { lat, lng } = req.query;

  try {
    console.log(`📍 위치 정보 조회: lat=${lat}, lng=${lng}`);

    // 간단한 지역 정보 반환 (실제로는 역지오코딩 API 사용)
    const locationInfo = {
      address: '서울특별시 중구',
      district: '중구',
      city: '서울특별시'
    };

    res.json({
      success: true,
      location: locationInfo
    });

  } catch (error) {
    console.error('❌ 위치 정보 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '위치 정보 조회 실패'
    });
  }
});

// 위치 정보 핸들러
async function handleLocationInfo(req, res) {
  const { lat, lng } = req.query;

  try {
    console.log(`📍 위치 정보 조회: lat=${lat}, lng=${lng}`);

    const locationInfo = {
      address: '서울특별시 중구',
      district: '중구', 
      city: '서울특별시'
    };

    res.json({
      success: true,
      location: locationInfo
    });
  } catch (error) {
    console.error('❌ 위치 정보 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '위치 정보 조회 실패'
    });
  }
}

// 뷰포트 핸들러
async function handleViewport(req, res) {
  const { swLat, swLng, neLat, neLng, level } = req.query;

  try {
    console.log('🏪 뷰포트 매장 조회:', { swLat, swLng, neLat, neLng, level });

    const result = await pool.query(`
      SELECT 
        s.id, s.name, s.category, s.rating_average, s.review_count, s.is_open,
        sa.address_full as address, sa.latitude, sa.longitude
      FROM stores s
      LEFT JOIN store_address sa ON s.id = sa.store_id
      WHERE sa.latitude BETWEEN $1 AND $3
        AND sa.longitude BETWEEN $2 AND $4
        AND s.is_open = true
      ORDER BY s.rating_average DESC, s.id ASC
      LIMIT 50
    `, [parseFloat(swLat), parseFloat(swLng), parseFloat(neLat), parseFloat(neLng)]);

    const stores = result.rows.map(store => ({
      id: store.id,
      name: store.name,
      category: store.category,
      address: store.address || '주소 정보 없음',
      ratingAverage: store.rating_average ? parseFloat(store.rating_average) : 0.0,
      reviewCount: store.review_count || 0,
      isOpen: store.is_open !== false,
      coord: store.latitude && store.longitude 
        ? { lat: parseFloat(store.latitude), lng: parseFloat(store.longitude) }
        : null
    }));

    console.log(`✅ 뷰포트 매장 조회 완료: ${stores.length}개`);

    res.json({
      success: true,
      stores: stores
    });
  } catch (error) {
    console.error('❌ 뷰포트 매장 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '뷰포트 매장 조회 중 오류가 발생했습니다.'
    });
  }
}

module.exports = router;