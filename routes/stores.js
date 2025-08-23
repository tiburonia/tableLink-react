const express = require('express');
const router = express.Router();
const pool = require('../shared/config/database');

// 지역 선택 - 시/도 목록 조회
router.get('/regions/provinces', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT sido 
      FROM store_address 
      WHERE sido IS NOT NULL 
      ORDER BY sido
    `);

    const provinces = result.rows.map(row => row.sido);

    res.json({
      success: true,
      provinces: provinces
    });
  } catch (error) {
    console.error('시/도 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '시/도 목록 조회 실패'
    });
  }
});

// 지역 선택 - 시/군/구 목록 조회
router.get('/regions/cities', async (req, res) => {
  try {
    const { province } = req.query;

    if (!province) {
      return res.status(400).json({
        success: false,
        error: '시/도를 선택해주세요'
      });
    }

    const result = await pool.query(`
      SELECT DISTINCT sigungu 
      FROM store_address 
      WHERE sido = $1 AND sigungu IS NOT NULL 
      ORDER BY sigungu
    `, [province]);

    const cities = result.rows.map(row => row.sigungu);

    res.json({
      success: true,
      cities: cities
    });
  } catch (error) {
    console.error('시/군/구 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '시/군/구 목록 조회 실패'
    });
  }
});

// 지역 선택 - 읍/면/동 목록 조회
router.get('/regions/districts', async (req, res) => {
  try {
    const { province, city } = req.query;

    if (!province || !city) {
      return res.status(400).json({
        success: false,
        error: '시/도와 시/군/구를 선택해주세요'
      });
    }

    const result = await pool.query(`
      SELECT DISTINCT eupmyeondong 
      FROM store_address 
      WHERE sido = $1 AND sigungu = $2 AND eupmyeondong IS NOT NULL 
      ORDER BY eupmyeondong
    `, [province, city]);

    const districts = result.rows.map(row => row.eupmyeondong);

    res.json({
      success: true,
      districts: districts
    });
  } catch (error) {
    console.error('읍/면/동 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '읍/면/동 목록 조회 실패'
    });
  }
});

// 지역 선택 - 좌표 조회
router.get('/regions/coordinates', async (req, res) => {
  try {
    const { province, city, district } = req.query;

    if (!province || !city || !district) {
      return res.status(400).json({
        success: false,
        error: '모든 지역을 선택해주세요'
      });
    }

    const result = await pool.query(`
      SELECT latitude, longitude 
      FROM store_address 
      WHERE sido = $1 AND sigungu = $2 AND eupmyeondong = $3 
        AND latitude IS NOT NULL AND longitude IS NOT NULL 
      LIMIT 1
    `, [province, city, district]);

    if (result.rows.length === 0) {
      return res.json({
        success: false,
        error: '해당 지역의 좌표를 찾을 수 없습니다'
      });
    }

    const { latitude, longitude } = result.rows[0];

    res.json({
      success: true,
      coordinates: {
        lat: parseFloat(latitude),
        lng: parseFloat(longitude)
      }
    });
  } catch (error) {
    console.error('좌표 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '좌표 조회 실패'
    });
  }
});

// 현재 위치 정보 조회 (카카오 API 프록시)
router.get('/get-location-info', async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: '위도와 경도가 필요합니다'
      });
    }

    const KAKAO_API_KEY = process.env.KAKAO_API_KEY;
    if (!KAKAO_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'KAKAO_API_KEY가 설정되지 않았습니다'
      });
    }

    const response = await fetch(
      `https://dapi.kakao.com/v2/local/geo/coord2regioncode.json?input_coord=WGS84&output=json&x=${lng}&y=${lat}`,
      {
        headers: {
          'Authorization': `KakaoAK ${KAKAO_API_KEY}`
        }
      }
    );

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: '카카오 API 호출 실패'
      });
    }

    const data = await response.json();

    if (data.documents && data.documents.length > 0) {
      const location = data.documents[0];
      const address = location.road_address ? location.road_address.address_name : location.address_name;
      const addressParts = address.split(' ');

      let eupmyeondong = '';
      if (addressParts.length >= 3) {
        eupmyeondong = addressParts[2]; // 읍면동만
      } else {
        eupmyeondong = addressParts[addressParts.length - 1] || '위치 정보 없음';
      }

      res.json({
        success: true,
        eupmyeondong: eupmyeondong,
        fullAddress: address
      });
    } else {
      res.json({
        success: false,
        error: '위치 정보를 찾을 수 없습니다'
      });
    }

  } catch (error) {
    console.error('위치 정보 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '위치 정보 조회 중 오류가 발생했습니다'
    });
  }
});

// 카카오 장소 검색 프록시 API (맨 앞에 배치하여 충돌 방지)
router.get('/search-place', async (req, res) => {
  try {
    const { query, x, y, radius } = req.query;

    console.log(`🔍 프록시 장소 검색 요청: query="${query}", x=${x}, y=${y}, radius=${radius}`);

    if (!query) {
      console.error('❌ 검색어가 없습니다');
      return res.status(400).json({
        success: false,
        error: '검색어가 필요합니다'
      });
    }

    const KAKAO_API_KEY = process.env.KAKAO_API_KEY;
    console.log(`🔑 카카오 API 키 상태: ${KAKAO_API_KEY ? '✅ 설정됨' : '❌ 없음'}`);

    if (!KAKAO_API_KEY) {
      console.error('❌ KAKAO_API_KEY 환경변수가 설정되지 않았습니다');
      return res.status(500).json({
        success: false,
        error: 'KAKAO_API_KEY가 설정되지 않았습니다'
      });
    }

    // 카카오 장소 검색 API 호출 (node.js 18+ 내장 fetch 사용)
    const params = new URLSearchParams({
      query: query,
      ...(x && { x: x }),
      ...(y && { y: y }),
      ...(radius && { radius: radius })
    });

    const apiUrl = `https://dapi.kakao.com/v2/local/search/keyword.json?${params}`;
    console.log(`📡 카카오 API 호출: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `KakaoAK ${KAKAO_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`📡 카카오 API 응답 상태: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ 카카오 API 호출 실패: ${response.status} - ${errorText}`);
      return res.status(500).json({
        success: false,
        error: `카카오 API 호출 실패: ${response.status}`,
        details: errorText
      });
    }

    const data = await response.json();
    console.log(`✅ 카카오 API 응답 성공: ${data.documents?.length || 0}개 결과`);

    res.json({
      success: true,
      places: data.documents || [],
      meta: data.meta || {}
    });

  } catch (error) {
    console.error('❌ 장소 검색 프록시 실패:', error);
    res.status(500).json({
      success: false,
      error: '장소 검색 실패: ' + error.message
    });
  }
});

// stores 테이블 별점 평균 업데이트 함수
async function updateStoreRating(storeId) {
  try {
    console.log(`🔄 매장 ${storeId} 별점 평균 업데이트 중...`);

    const ratingResult = await pool.query(`
      SELECT AVG(rating) as avg_rating, COUNT(*) as review_count 
      FROM reviews 
      WHERE store_id = $1
    `, [storeId]);

    const avgRating = ratingResult.rows[0].avg_rating;
    const reviewCount = parseInt(ratingResult.rows[0].review_count);
    const formattedRating = avgRating ? parseFloat(avgRating).toFixed(1) : 0;

    await pool.query(`
      UPDATE stores 
      SET rating_average = $1, review_count = $2 
      WHERE id = $3
    `, [formattedRating, reviewCount, storeId]);

    console.log(`✅ 매장 ${storeId} 별점 평균 업데이트 완료: ${formattedRating}점 (${reviewCount}개 리뷰)`);

    return { avgRating: formattedRating, reviewCount };
  } catch (error) {
    console.error(`❌ 매장 ${storeId} 별점 평균 업데이트 실패:`, error);
    throw error;
  }
}

// 뷰포트 범위 내 매장 조회 API (가장 먼저 배치)
router.get('/viewport', async (req, res) => {
  try {
    const { swLat, swLng, neLat, neLng, level } = req.query;

    if (!swLat || !swLng || !neLat || !neLng) {
      return res.status(400).json({
        success: false,
        error: '뷰포트 좌표가 필요합니다 (swLat, swLng, neLat, neLng)'
      });
    }

    const currentLevel = parseInt(level) || 1;
    console.log(`📍 뷰포트 매장 조회 - 레벨 ${currentLevel}, 범위: (${swLat},${swLng}) ~ (${neLat},${neLng})`);

    // 뷰포트 범위 내 매장만 조회
    const queryParams = [parseFloat(swLat), parseFloat(swLng), parseFloat(neLat), parseFloat(neLng)];
    console.log(`📊 쿼리 파라미터: swLat=${queryParams[0]}, swLng=${queryParams[1]}, neLat=${queryParams[2]}, neLng=${queryParams[3]}`);

    // 전체 매장 수 확인
    const totalCountResult = await pool.query('SELECT COUNT(*) as total FROM stores');
    console.log(`📋 전체 매장 수: ${totalCountResult.rows[0].total}`);

    // 좌표가 있는 매장 수 확인
    const coordCountResult = await pool.query('SELECT COUNT(*) as coord_count FROM store_address WHERE latitude IS NOT NULL AND longitude IS NOT NULL');
    console.log(`📍 좌표가 있는 매장 수: ${coordCountResult.rows[0].coord_count}`);

    // 뷰포트 범위 내 매장 조회 전 범위 확인
    const rangeCheckResult = await pool.query(`
      SELECT COUNT(*) as in_range_count,
             MIN(sa.latitude) as min_lat, MAX(sa.latitude) as max_lat,
             MIN(sa.longitude) as min_lng, MAX(sa.longitude) as max_lng
      FROM stores s
      LEFT JOIN store_address sa ON s.id = sa.store_id
      WHERE sa.latitude IS NOT NULL AND sa.longitude IS NOT NULL
    `);

    console.log(`📊 전체 좌표 범위: Lat(${rangeCheckResult.rows[0].min_lat} ~ ${rangeCheckResult.rows[0].max_lat}), Lng(${rangeCheckResult.rows[0].min_lng} ~ ${rangeCheckResult.rows[0].max_lng})`);
    console.log(`📊 요청된 뷰포트: Lat(${queryParams[0]} ~ ${queryParams[2]}), Lng(${queryParams[1]} ~ ${queryParams[3]})`);

    // 뷰포트 범위 내 매장 수 미리 확인
    const viewportCountResult = await pool.query(`
      SELECT COUNT(*) as viewport_count
      FROM stores s
      LEFT JOIN store_address sa ON s.id = sa.store_id
      WHERE sa.latitude IS NOT NULL AND sa.longitude IS NOT NULL
        AND sa.latitude BETWEEN $1 AND $3
        AND sa.longitude BETWEEN $2 AND $4
    `, queryParams);

    console.log(`📍 뷰포트 범위 내 매장 수: ${viewportCountResult.rows[0].viewport_count}개`);

    const storesResult = await pool.query(`
      SELECT s.id, s.name, s.category, sa.address_full as address, s.is_open, s.rating_average, s.review_count, s.menu, sa.latitude, sa.longitude,
             sa.sido, sa.sigungu, sa.eupmyeondong
      FROM stores s
      LEFT JOIN store_address sa ON s.id = sa.store_id
      WHERE sa.latitude IS NOT NULL AND sa.longitude IS NOT NULL
        AND sa.latitude >= $1 AND sa.latitude <= $3
        AND sa.longitude >= $2 AND sa.longitude <= $4
      ORDER BY s.id
    `, queryParams);

    console.log(`🔍 뷰포트 쿼리 결과: ${storesResult.rows.length}개 매장`);
    if (storesResult.rows.length > 0) {
      console.log(`📍 첫 번째 매장: ${storesResult.rows[0].name} (Lat: ${storesResult.rows[0].latitude}, Lng: ${storesResult.rows[0].longitude})`);
    }

    const stores = storesResult.rows.map(store => {
      // 메뉴 데이터 처리 (JSON 문자열인 경우 파싱)
      let menuData = store.menu || [];
      if (typeof menuData === 'string') {
        try {
          menuData = JSON.parse(menuData);
        } catch (error) {
          console.warn(`⚠️ 매장 ${store.id} 메뉴 JSON 파싱 실패:`, error);
          menuData = [];
        }
      }

      return {
        id: store.id,
        name: store.name,
        category: store.category,
        address: store.address || '주소 정보 없음',
        coord: store.latitude && store.longitude 
          ? { lat: parseFloat(store.latitude), lng: parseFloat(store.longitude) }
          : { lat: 37.5665, lng: 126.9780 },
        isOpen: store.is_open !== false,
        ratingAverage: store.rating_average ? parseFloat(store.rating_average) : 0.0,
        reviewCount: store.review_count || 0,
        menu: menuData,
        sido: store.sido,
        sigungu: store.sigungu,
        eupmyeondong: store.eupmyeondong
      };
    });

    console.log(`✅ 뷰포트 매장 조회 완료: ${stores.length}개 매장 (레벨 ${currentLevel})`);

    res.json({
      success: true,
      stores: stores,
      viewport: { swLat, swLng, neLat, neLng },
      level: currentLevel,
      total: stores.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ 뷰포트 매장 조회 실패:', error);
    res.status(500).json({ 
      success: false, 
      error: '뷰포트 매장 조회 실패: ' + error.message 
    });
  }
});

// 일괄 별점 정보 조회 API
router.get('/ratings/batch', async (req, res) => {
  try {
    const { storeIds } = req.query; // 쉼표로 구분된 매장 ID들 (예: "1,2,3,4,5")

    if (!storeIds) {
      return res.status(400).json({ 
        success: false, 
        error: '매장 ID 목록이 필요합니다 (예: ?storeIds=1,2,3)' 
      });
    }

    const storeIdArray = storeIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));

    if (storeIdArray.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: '유효한 매장 ID가 없습니다' 
      });
    }

    console.log(`⭐ 일괄 별점 정보 조회 요청: ${storeIdArray.length}개 매장 [${storeIdArray.join(', ')}]`);

    const placeholders = storeIdArray.map((_, index) => `$${index + 1}`).join(',');
    const result = await pool.query(`
      SELECT id, rating_average, review_count 
      FROM stores 
      WHERE id IN (${placeholders})
      ORDER BY id
    `, storeIdArray);

    const ratingsMap = {};
    result.rows.forEach(store => {
      ratingsMap[store.id] = {
        storeId: store.id,
        ratingAverage: store.rating_average ? parseFloat(store.rating_average) : 0.0,
        reviewCount: store.review_count || 0
      };
    });

    console.log(`⭐ 일괄 별점 정보 조회 완료: ${result.rows.length}개 매장 처리`);

    res.json({
      success: true,
      total: result.rows.length,
      ratings: ratingsMap
    });

  } catch (error) {
    console.error('❌ 일괄 별점 정보 조회 실패:', error);
    res.status(500).json({ 
      success: false, 
      error: '일괄 별점 정보 조회 실패: ' + error.message 
    });
  }
});

// 좌표 → 주소 변환 API (현재 뷰포트 위치 정보용)
router.get('/coord-to-address', async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: '위도와 경도가 필요합니다'
      });
    }

    console.log(`📍 좌표 → 주소 변환 요청: (${lat}, ${lng})`);

    // 카카오 API를 통한 좌표 → 주소 변환
    const kakaoResponse = await fetch(
      `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${lng}&y=${lat}&input_coord=WGS84`,
      {
        headers: {
          'Authorization': `KakaoAK ${process.env.KAKAO_API_KEY || 'your-kakao-api-key'}`
        }
      }
    );

    if (!kakaoResponse.ok) {
      console.error('❌ 카카오 API 호출 실패:', kakaoResponse.status);
      return res.json({
        success: false,
        error: '주소 변환 API 호출 실패'
      });
    }

    const kakaoData = await kakaoResponse.json();

    if (kakaoData.documents && kakaoData.documents.length > 0) {
      const document = kakaoData.documents[0];
      const roadAddress = document.road_address;
      const landAddress = document.address;

      // 도로명 주소 우선, 없으면 지번 주소 사용
      const addressData = roadAddress || landAddress;

      if (addressData) {
        const address = {
          sido: addressData.region_1depth_name || null,
          sigungu: addressData.region_2depth_name || null,
          eupmyeondong: addressData.region_3depth_name || null,
          fullAddress: roadAddress ? roadAddress.address_name : landAddress.address_name
        };

        console.log(`✅ 주소 변환 성공:`, address);

        res.json({
          success: true,
          address: address
        });
      } else {
        res.json({
          success: false,
          error: '주소 정보를 찾을 수 없습니다'
        });
      }
    } else {
      console.log('⚠️ 카카오 API 응답에 주소 정보 없음');
      res.json({
        success: false,
        error: '해당 좌표의 주소를 찾을 수 없습니다'
      });
    }

  } catch (error) {
    console.error('❌ 좌표 → 주소 변환 실패:', error);
    res.status(500).json({
      success: false,
      error: '서버 오류'
    });
  }
});

// 매장 검색 API
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ 
        success: false, 
        error: '검색어가 필요합니다' 
      });
    }

    console.log(`🔍 매장 검색 요청: "${query}"`);

    const result = await pool.query(`
      SELECT s.*, sa.address_full as address, sa.latitude, sa.longitude
      FROM stores s 
      LEFT JOIN store_address sa ON s.id = sa.store_id
      WHERE s.name ILIKE $1 
      ORDER BY s.id
      LIMIT 20
    `, [`%${query}%`]);

    const stores = result.rows.map(store => ({
      id: store.id,
      name: store.name,
      category: store.category,
      address: store.address,
      coord: store.latitude && store.longitude 
        ? { lat: parseFloat(store.latitude), lng: parseFloat(store.longitude) }
        : { lat: 37.5665, lng: 126.9780 },
      isOpen: store.is_open,
      ratingAverage: store.rating_average ? parseFloat(store.rating_average) : 0.0,
      reviewCount: store.review_count || 0
    }));

    console.log(`✅ 매장 검색 완료: "${query}" - ${stores.length}개 결과`);

    res.json({
      success: true,
      query: query,
      total: stores.length,
      stores: stores
    });

  } catch (error) {
    console.error('❌ 매장 검색 실패:', error);
    res.status(500).json({ 
      success: false, 
      error: '매장 검색 실패: ' + error.message 
    });
  }
});

// 일괄 매장 정보 조회 API (캐시용)
router.get('/batch/basic-info', async (req, res) => {
  try {
    console.log('📦 일괄 매장 기본 정보 조회 요청');

    const storesResult = await pool.query(`
      SELECT s.id, s.name, s.category, sa.address_full as address, s.is_open, s.rating_average, s.review_count, sa.latitude, sa.longitude
      FROM stores s
      LEFT JOIN store_address sa ON s.id = sa.store_id
      ORDER BY s.id
    `);

    const stores = storesResult.rows.map(store => ({
      id: store.id,
      name: store.name,
      category: store.category,
      address: store.address || '주소 정보 없음',
      coord: store.latitude && store.longitude 
        ? { lat: parseFloat(store.latitude), lng: parseFloat(store.longitude) }
        : { lat: 37.5665, lng: 126.9780 },
      isOpen: store.is_open !== false,
      ratingAverage: store.rating_average ? parseFloat(store.rating_average) : 0.0,
      reviewCount: store.review_count || 0
    }));

    console.log(`✅ 일괄 매장 기본 정보 조회 완료: ${stores.length}개 매장`);

    res.json({
      success: true,
      stores: stores,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ 일괄 매장 기본 정보 조회 실패:', error);
    res.status(500).json({ 
      success: false, 
      error: '일괄 매장 기본 정보 조회 실패: ' + error.message 
    });
  }
});

// 모든 매장 조회 API
router.get('/', async (req, res) => {
  try {
    const storesResult = await pool.query(`
      SELECT s.*, sa.address_full as address, sa.latitude, sa.longitude
      FROM stores s 
      LEFT JOIN store_address sa ON s.id = sa.store_id 
      ORDER BY s.id
    `);

    const storesWithTables = await Promise.all(
      storesResult.rows.map(async (store) => {
        const tablesResult = await pool.query(`
          SELECT 
            table_number, table_name, seats, is_occupied, occupied_since
          FROM store_tables 
          WHERE store_id = $1 
          ORDER BY table_number
        `, [store.id]);

        const tables = tablesResult.rows.map(table => ({
          tableNumber: table.table_number,
          tableName: table.table_name,
          seats: table.seats,
          isOccupied: table.is_occupied,
          occupiedSince: table.occupied_since
        }));

        const totalTables = tables.length;
        const availableTables = tables.filter(t => !t.isOccupied).length;
        const occupiedTables = tables.filter(t => t.isOccupied).length;

        return {
          id: store.id,
          name: store.name,
          category: store.category,
          distance: store.distance || '정보없음',
          address: store.address || '주소 정보 없음',
          menu: store.menu || [],
          coord: store.latitude && store.longitude 
            ? { lat: parseFloat(store.latitude), lng: parseFloat(store.longitude) }
            : { lat: 37.5665, lng: 126.9780 },
          reviews: store.reviews || [],
          reviewCount: store.review_count || 0,
          ratingAverage: store.rating_average ? parseFloat(store.rating_average) : 0.0,
          isOpen: store.is_open !== false,
          tableInfo: {
            totalTables,
            availableTables,
            occupiedTables,
            occupancyRate: totalTables > 0 ? Math.round((occupiedTables / totalTables) * 100) : 0
          },
          tables: tables
        };
      })
    );

    res.json({
      success: true,
      message: 'TableLink API 서버가 정상 작동 중입니다.',
      stores: storesWithTables
    });
  } catch (error) {
    console.error('stores 조회 실패:', error);
    res.status(500).json({ error: 'stores 조회 실패' });
  }
});

// === 매개변수 라우트들 (특정 경로 라우트 이후에 배치) ===

// 특정 매장 조회 API
router.get('/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;
    console.log(`🏪 매장 ${storeId} 상세 정보 조회 요청`);

    const storeResult = await pool.query(`
      SELECT s.*, sa.address_full as address, sa.latitude, sa.longitude,
             sa.sido, sa.sigungu, sa.eupmyeondong
      FROM stores s 
      LEFT JOIN store_address sa ON s.id = sa.store_id 
      WHERE s.id = $1
    `, [storeId]);

    if (storeResult.rows.length === 0) {
      console.log(`❌ 매장 ${storeId}를 찾을 수 없음`);
      return res.status(404).json({ success: false, error: '매장을 찾을 수 없습니다' });
    }

    const store = storeResult.rows[0];
    console.log(`✅ 매장 ${storeId} 기본 정보 조회 완료: ${store.name}`);

    // 테이블 정보 조회
    const tablesResult = await pool.query(`
      SELECT id, table_number, table_name, seats, is_occupied, occupied_since 
      FROM store_tables 
      WHERE store_id = $1 
      ORDER BY table_number
    `, [storeId]);

    const tables = tablesResult.rows.map(table => ({
      id: table.id,
      tableNumber: table.table_number,
      tableName: table.table_name,
      seats: table.seats,
      isOccupied: table.is_occupied,
      occupiedSince: table.occupied_since
    }));

    const totalTables = tables.length;
    const occupiedTables = tables.filter(t => t.is_occupied).length;
    const availableTables = totalTables - occupiedTables;
    const occupancyRate = totalTables > 0 ? Math.round((occupiedTables / totalTables) * 100) : 0;

    console.log(`🪑 테이블 정보: 총 ${totalTables}개, 사용중 ${occupiedTables}개, 빈 테이블 ${availableTables}개`);

    // 메뉴 데이터 처리 (JSON 문자열인 경우 파싱)
    let menuData = store.menu || [];
    if (typeof menuData === 'string') {
      try {
        menuData = JSON.parse(menuData);
        console.log(`🍽️ 메뉴 JSON 파싱 성공: ${menuData.length}개 메뉴`);
      } catch (error) {
        console.warn(`⚠️ 매장 ${store.id} 메뉴 JSON 파싱 실패:`, error);
        menuData = [];
      }
    } else if (Array.isArray(menuData)) {
      console.log(`🍽️ 메뉴 배열 형태: ${menuData.length}개 메뉴`);
    } else {
      console.warn(`⚠️ 매장 ${store.id} 메뉴 데이터 형태 불명:`, typeof menuData);
      menuData = [];
    }

    // 좌표 정보 처리
    const coord = store.latitude && store.longitude 
      ? { lat: parseFloat(store.latitude), lng: parseFloat(store.longitude) }
      : null;

    const responseData = {
      success: true,
      store: {
        id: store.id,
        name: store.name,
        category: store.category,
        address: store.address || '주소 정보 없음',
        phone: store.phone,
        isOpen: store.is_open !== false,
        ratingAverage: store.rating_average ? parseFloat(store.rating_average) : 0.0,
        reviewCount: store.review_count || 0,
        description: store.description,
        operatingHours: store.operating_hours,
        coord: coord,
        sido: store.sido,
        sigungu: store.sigungu,
        eupmyeondong: store.eupmyeondong,
        menu: menuData,
        tables: tables,
        tableInfo: {
          totalTables: totalTables,
          availableTables: availableTables,
          occupiedTables: occupiedTables,
          occupancyRate: occupancyRate
        }
      }
    };

    console.log(`✅ 매장 ${storeId} 상세 정보 조회 완료`);
    res.json(responseData);

  } catch (error) {
    console.error(`❌ 매장 ${req.params.storeId} 조회 실패:`, error);
    res.status(500).json({ success: false, error: '매장 조회 실패: ' + error.message });
  }
});

// 매장 통계 API
router.get('/:storeId/stats', async (req, res) => {
  try {
    const { storeId } = req.params;
    console.log(`📊 매장 ${storeId} 통계 조회 요청`);

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];

    const todayStats = await pool.query(`
      SELECT COUNT(*) as count, COALESCE(SUM(final_amount), 0) as revenue
      FROM orders 
      WHERE store_id = $1 AND DATE(order_date) = $2
    `, [parseInt(storeId), todayStr]);

    const monthStats = await pool.query(`
      SELECT COUNT(*) as count, COALESCE(SUM(final_amount), 0) as revenue
      FROM orders 
      WHERE store_id = $1 AND order_date >= $2
    `, [parseInt(storeId), thisMonthStart]);

    const stats = {
      todayOrders: parseInt(todayStats.rows[0].count) || 0,
      todayRevenue: parseInt(todayStats.rows[0].revenue) || 0,
      monthOrders: parseInt(monthStats.rows[0].count) || 0,
      monthRevenue: parseInt(monthStats.rows[0].revenue) || 0
    };

    console.log(`✅ 매장 ${storeId} 통계 조회 완료:`, stats);

    res.json({
      success: true,
      stats: stats
    });

  } catch (error) {
    console.error('❌ 매장 통계 조회 실패:', error);
    res.status(500).json({ 
      success: false, 
      error: '통계 조회 실패: ' + error.message 
    });
  }
});

// 매장별 리뷰 조회 API 
router.get('/:storeId/reviews', async (req, res) => {
  try {
    const { storeId } = req.params;
    const limit = req.query.limit || 100;

    console.log(`📖 매장 ${storeId} 리뷰 조회 API 시작 (stores.js에서 처리)`);

    const query = `
      SELECT 
        r.id,
        r.rating as score,
        r.review_text as content,
        r.order_date,
        r.created_at,
        u.name as user_name,
        u.id as user_id
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.store_id = $1
      ORDER BY r.created_at DESC
      LIMIT $2
    `;

    console.log('🔍 실행할 SQL 쿼리:', query);
    console.log('🔍 쿼리 파라미터 - storeId:', storeId, ', limit:', limit);

    const result = await pool.query(query, [parseInt(storeId), parseInt(limit)]);

    console.log('🔍 데이터베이스 쿼리 결과:', result.rows.length + '개 리뷰 발견');

    const reviews = result.rows.map(row => ({
      id: row.id,
      score: row.score,
      content: row.content,
      date: new Date(row.created_at).toLocaleDateString('ko-KR'),
      orderDate: row.order_date,
      user: row.user_name,
      userId: row.user_id
    }));

    console.log(`✅ 매장 ${storeId} 리뷰 ${reviews.length}개 처리 완료`);

    const responseData = {
      success: true,
      storeId: parseInt(storeId),
      total: reviews.length,
      reviews: reviews
    };

    console.log('📤 클라이언트로 전송할 최종 데이터:', JSON.stringify(responseData, null, 2));

    res.json(responseData);

  } catch (error) {
    console.error('❌ 매장 리뷰 조회 실패:', error);
    console.error('❌ 오류 스택:', error.stack);
    res.status(500).json({ 
      success: false, 
      error: '리뷰 조회 실패: ' + error.message
    });
  }
});

// 매장별 별점 정보 조회 API (실제 리뷰 데이터 기반)
router.get('/:storeId/rating', async (req, res) => {
  try {
    const { storeId } = req.params;
    console.log(`⭐ 매장 ${storeId} 실제 리뷰 기반 별점 정보 조회 요청`);

    // 실시간으로 reviews 테이블에서 계산
    const reviewResult = await pool.query(`
      SELECT 
        AVG(rating) as avg_rating, 
        COUNT(*) as review_count 
      FROM reviews 
      WHERE store_id = $1
    `, [parseInt(storeId)]);

    const avgRating = reviewResult.rows[0].avg_rating;
    const reviewCount = parseInt(reviewResult.rows[0].review_count) || 0;
    const actualRating = avgRating ? parseFloat(avgRating).toFixed(1) : 0.0;

    console.log(`📊 매장 ${storeId} 실시간 리뷰 통계: ${actualRating}점 (${reviewCount}개 리뷰)`);

    // stores 테이블도 동시에 업데이트
    if (reviewCount > 0) {
      await pool.query(`
        UPDATE stores 
        SET rating_average = $1, review_count = $2 
        WHERE id = $3
      `, [actualRating, reviewCount, parseInt(storeId)]);
      console.log(`✅ 매장 ${storeId} stores 테이블 별점 동기화 완료`);
    }

    const ratingData = {
      success: true,
      storeId: parseInt(storeId),
      ratingAverage: parseFloat(actualRating),
      reviewCount: reviewCount
    };

    console.log(`⭐ 매장 ${storeId} 실제 리뷰 기반 별점 정보 조회 완료: ${ratingData.ratingAverage}점 (${ratingData.reviewCount}개 리뷰)`);
    res.json(ratingData);

  } catch (error) {
    console.error('❌ 매장 별점 정보 조회 실패:', error);
    res.status(500).json({ 
      success: false, 
      error: '매장 별점 정보 조회 실패: ' + error.message 
    });
  }
});

// 매장별 테이블 정보 조회 API
router.get('/:storeId/tables', async (req, res) => {
  try {
    const { storeId } = req.params;
    console.log(`🪑 매장 ${storeId} 테이블 정보 조회 요청`);

    const tablesResult = await pool.query(`
      SELECT 
        id, table_number, table_name, seats, is_occupied, occupied_since
      FROM store_tables 
      WHERE store_id = $1 
      ORDER BY table_number
    `, [storeId]);

    const tables = tablesResult.rows.map(table => ({
      id: table.id,
      tableNumber: table.table_number,
      tableName: table.table_name,
      seats: table.seats,
      isOccupied: table.is_occupied,
      occupiedSince: table.occupied_since
    }));

    const totalTables = tables.length;
    const occupiedTables = tables.filter(t => t.isOccupied).length;
    const availableTables = totalTables - occupiedTables;

    console.log(`✅ 매장 ${storeId} 테이블 정보 조회 완료: 총 ${totalTables}개, 사용중 ${occupiedTables}개, 빈 테이블 ${availableTables}개`);

    res.json({
      success: true,
      storeId: parseInt(storeId),
      totalTables: totalTables,
      availableTables: availableTables,
      occupiedTables: occupiedTables,
      tables: tables
    });

  } catch (error) {
    console.error('매장별 테이블 정보 조회 실패:', error);
    res.status(500).json({ success: false, error: '테이블 정보 조회 실패' });
  }
});

// 매장별 주문 조회 API
router.get('/:storeId/orders', async (req, res) => {
  try {
    const { storeId } = req.params;
    console.log(`📋 매장 ${storeId} 주문 조회 요청`);

    const ordersResult = await pool.query(`
      SELECT 
        o.id,
        u.name as customer_name,
        o.table_number,
        o.order_data,
        o.final_amount,
        o.order_status,
        o.order_date,
        o.created_at
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id 
      WHERE o.store_id = $1 
      ORDER BY o.order_date DESC
      LIMIT 50
    `, [parseInt(storeId)]);

    const orders = ordersResult.rows.map(order => ({
      id: order.id,
      customerName: order.customer_name || '고객정보없음',
      tableNumber: order.table_number,
      orderData: order.order_data,
      finalAmount: order.final_amount,
      orderStatus: order.order_status,
      orderDate: order.order_date,
      createdAt: order.created_at
    }));

    console.log(`✅ 매장 ${storeId} 주문 조회 완료: ${orders.length}개`);

    res.json({
      success: true,
      storeId: parseInt(storeId),
      total: orders.length,
      orders: orders
    });

  } catch (error) {
    console.error('❌ 매장별 주문 조회 실패:', error);
    res.status(500).json({ 
      success: false, 
      error: '주문 조회 실패: ' + error.message 
    });
  }
});

// 매장 운영 상태 토글
router.post('/:storeId/toggle-status', async (req, res) => {
  const { storeId } = req.params;
  let { isOpen } = req.body;

  try {
    console.log(`🔄 [API] 매장 ${storeId} 운영 상태 토글 요청 - isOpen: ${isOpen}`);

    // storeId 유효성 검사
    const storeIdInt = parseInt(storeId);
    if (isNaN(storeIdInt) || storeIdInt <= 0) {
      console.error('❌ [API] 잘못된 매장 ID:', storeId);
      return res.status(400).json({
        success: false,
        message: '잘못된 매장 ID입니다.',
        error: 'INVALID_STORE_ID'
      });
    }

    // 트랜잭션 시작
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 현재 매장 정보 확인 (행 잠금)
      const currentStoreResult = await client.query(
        'SELECT id, name, is_open FROM stores WHERE id = $1 FOR UPDATE',
        [storeIdInt]
      );

      if (currentStoreResult.rows.length === 0) {
        await client.query('ROLLBACK');
        console.error('❌ [API] 매장을 찾을 수 없음:', storeIdInt);
        return res.status(404).json({
          success: false,
          message: '매장을 찾을 수 없습니다.',
          error: 'STORE_NOT_FOUND'
        });
      }

      const currentStore = currentStoreResult.rows[0];
      console.log(`📋 [API] 현재 매장 상태: ${currentStore.name} (ID: ${currentStore.id}) - 운영중: ${currentStore.is_open}`);

      // 새로운 상태 결정
      let newStatus;
      if (isOpen === undefined || isOpen === null) {
        // isOpen이 지정되지 않은 경우 현재 상태를 토글
        newStatus = !currentStore.is_open;
      } else {
        // 명시적으로 지정된 경우 해당 값 사용
        newStatus = Boolean(isOpen);
      }

      console.log(`🔄 [API] 상태 변경: ${currentStore.is_open} → ${newStatus}`);

      // 상태가 동일한 경우 체크
      if (currentStore.is_open === newStatus) {
        await client.query('ROLLBACK');
        console.log(`ℹ️ [API] 매장 상태가 이미 ${newStatus ? '운영중' : '운영중지'} 상태입니다.`);
        return res.json({
          success: true,
          message: `매장이 이미 ${newStatus ? '운영중' : '운영중지'} 상태입니다.`,
          store: {
            id: currentStore.id,
            name: currentStore.name,
            isOpen: currentStore.is_open
          },
          isOpen: newStatus,
          changed: false
        });
      }

      // 상태 업데이트
      const updateResult = await client.query(
        'UPDATE stores SET is_open = $1 WHERE id = $2 RETURNING id, name, is_open',
        [newStatus, storeIdInt]
      );

      await client.query('COMMIT');

      if (updateResult.rows.length === 0) {
        console.error('❌ [API] 업데이트 결과가 없습니다.');
        return res.status(500).json({
          success: false,
          message: '운영 상태 업데이트에 실패했습니다.',
          error: 'UPDATE_FAILED'
        });
      }

      const updatedStore = updateResult.rows[0];
      const actionText = newStatus ? '운영 시작' : '운영 중지';

      console.log(`✅ [API] 매장 ${storeIdInt} 운영 상태 변경 완료: ${updatedStore.is_open} (${actionText})`);

      // 성공 응답
      res.json({
        success: true,
        message: `매장이 ${actionText}되었습니다.`,
        store: {
          id: updatedStore.id,
          name: updatedStore.name,
          isOpen: updatedStore.is_open
        },
        previousStatus: currentStore.is_open,
        isOpen: updatedStore.is_open,
        changed: true,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ [API] 매장 운영 상태 토글 오류:', error);

    // 상세한 에러 정보 로깅
    console.error('❌ [API] 에러 스택:', error.stack);

    res.status(500).json({
      success: false,
      message: '서버 내부 오류가 발생했습니다.',
      error: 'INTERNAL_SERVER_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 매장 프로모션 조회
router.get('/:storeId/promotions', async (req, res) => {
  try {
    const { storeId } = req.params;

    console.log(`🎉 매장 ${storeId} 프로모션 조회`);

    // 현재 진행중인 프로모션만 조회
    const result = await pool.query(`
      SELECT 
        id, name, description, type,
        discount_percent, discount_amount, point_rate,
        min_order_amount, max_discount_amount, target_customers,
        start_date, end_date, conditions, is_active
      FROM store_promotions 
      WHERE store_id = $1 AND is_active = true
      AND (start_date IS NULL OR start_date <= CURRENT_DATE)
      AND (end_date IS NULL OR end_date >= CURRENT_DATE)
      ORDER BY created_at DESC
    `, [storeId]);

    const promotions = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      type: row.type,
      discount_percent: row.discount_percent,
      discount_amount: parseFloat(row.discount_amount),
      point_rate: row.point_rate,
      min_order_amount: parseFloat(row.min_order_amount),
      max_discount_amount: parseFloat(row.max_discount_amount),
      start_date: row.start_date,
      end_date: row.end_date,
      is_active: row.is_active
    }));

    console.log(`✅ 매장 ${storeId} 프로모션 ${promotions.length}개 조회 완료`);

    res.json({
      success: true,
      storeId: parseInt(storeId),
      promotions: promotions,
      totalCount: promotions.length
    });

  } catch (error) {
    console.error('❌ 매장 프로모션 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '매장 프로모션 조회 실패: ' + error.message,
      promotions: []
    });
  }
});

// 매장 즐겨찾기 토글
router.post('/:storeId/favorite', async (req, res) => {
});

// 행정기관 좌표 조회 API
router.get('/administrative-office', async (req, res) => {
  try {
    const { regionType, regionName } = req.query;

    if (!regionType || !regionName) {
      return res.status(400).json({
        success: false,
        error: '지역 타입과 지역명이 필요합니다'
      });
    }

    console.log(`🏛️ 행정기관 좌표 조회: ${regionType} - ${regionName}`);

    const result = await pool.query(`
      SELECT office_name, latitude, longitude 
      FROM administrative_offices 
      WHERE region_type = $1 AND region_name = $2 
      LIMIT 1
    `, [regionType, regionName]);

    if (result.rows.length === 0) {
      console.log(`⚠️ 행정기관 좌표 없음: ${regionType} - ${regionName}`);
      return res.json({
        success: false,
        error: '해당 지역의 행정기관 좌표를 찾을 수 없습니다'
      });
    }

    const office = result.rows[0];
    console.log(`✅ 행정기관 좌표 발견: ${office.office_name} (${office.latitude}, ${office.longitude})`);

    res.json({
      success: true,
      office: {
        name: office.office_name,
        latitude: parseFloat(office.latitude),
        longitude: parseFloat(office.longitude)
      }
    });

  } catch (error) {
    console.error('❌ 행정기관 좌표 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '행정기관 좌표 조회 실패'
    });
  }
});

// 읍면동 중심점 좌표 조회 API
router.get('/eupmyeondong-center', async (req, res) => {
  try {
    const { sido, sigungu, eupmyeondong } = req.query;

    if (!sido || !sigungu || !eupmyeondong) {
      return res.status(400).json({
        success: false,
        error: '시도, 시군구, 읍면동이 모두 필요합니다'
      });
    }

    console.log(`📍 읍면동 중심점 조회: ${sido} ${sigungu} ${eupmyeondong}`);

    // PostGIS의 ST_PointOnSurface를 사용하여 읍면동 경계 내부의 대표 좌표 계산
    const result = await pool.query(`
      SELECT 
        ST_Y(ST_PointOnSurface(ST_Collect(ST_Point(longitude, latitude)))) as center_lat,
        ST_X(ST_PointOnSurface(ST_Collect(ST_Point(longitude, latitude)))) as center_lng
      FROM store_address 
      WHERE sido = $1 AND sigungu = $2 AND eupmyeondong = $3
        AND latitude IS NOT NULL AND longitude IS NOT NULL
      HAVING COUNT(*) > 0
    `, [sido, sigungu, eupmyeondong]);

    if (result.rows.length === 0 || !result.rows[0].center_lat) {
      console.log(`⚠️ 읍면동 중심점 계산 불가: ${sido} ${sigungu} ${eupmyeondong}`);
      return res.json({
        success: false,
        error: '해당 읍면동의 중심점을 계산할 수 없습니다'
      });
    }

    const center = result.rows[0];
    console.log(`✅ 읍면동 중심점 계산 완료: ${eupmyeondong} (${center.center_lat}, ${center.center_lng})`);

    res.json({
      success: true,
      center: {
        latitude: parseFloat(center.center_lat),
        longitude: parseFloat(center.center_lng)
      }
    });

  } catch (error) {
    console.error('❌ 읍면동 중심점 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '읍면동 중심점 조회 실패'
    });
  }
});

// 매장 상위 사용자 조회 API (더미 데이터)
router.get('/:storeId/top-users', async (req, res) => {
  try {
    const storeId = parseInt(req.params.storeId);

    if (!storeId) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 매장 ID입니다'
      });
    }

    console.log(`🏆 매장 ${storeId} 상위 사용자 조회 (더미 데이터)`);

    // 더미 상위 사용자 데이터 생성
    const dummyTopUsers = [
      {
        user_id: 'user001',
        name: '김단골',
        user_name: '김단골',
        points: 8500,
        total_spent: 450000,
        visit_count: 42,
        level_name: '다이아몬드',
        level_rank: 5,
        level_description: '최고 단골 고객',
        last_visit_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2일 전
      },
      {
        user_id: 'user002',
        name: '박VIP',
        user_name: '박VIP',
        points: 6200,
        total_spent: 320000,
        visit_count: 28,
        level_name: '플래티넘',
        level_rank: 4,
        level_description: 'VIP 고객',
        last_visit_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1일 전
      },
      {
        user_id: 'user003',
        name: '이골드',
        user_name: '이골드',
        points: 4100,
        total_spent: 180000,
        visit_count: 19,
        level_name: '골드',
        level_rank: 3,
        level_description: '골드 회원',
        last_visit_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3일 전
      },
      {
        user_id: 'user004',
        name: '최실버',
        user_name: '최실버',
        points: 2800,
        total_spent: 95000,
        visit_count: 12,
        level_name: '실버',
        level_rank: 2,
        level_description: '단골 고객',
        last_visit_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5일 전
      },
      {
        user_id: 'user005',
        name: '정브론즈',
        user_name: '정브론즈',
        points: 1200,
        total_spent: 45000,
        visit_count: 8,
        level_name: '브론즈',
        level_rank: 1,
        level_description: '신규 단골',
        last_visit_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7일 전
      },
      {
        user_id: 'user006',
        name: '윤신규',
        user_name: '윤신규',
        points: 800,
        total_spent: 28000,
        visit_count: 5,
        level_name: '브론즈',
        level_rank: 1,
        level_description: '신규 단골',
        last_visit_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10일 전
      }
    ];

    // 매장별로 약간 다른 데이터를 위해 storeId로 시드값 사용
    const seed = storeId % 1000;
    const adjustedUsers = dummyTopUsers.map((user, index) => ({
      ...user,
      points: user.points + (seed * (index + 1)),
      total_spent: user.total_spent + (seed * 100),
      visit_count: user.visit_count + Math.floor(seed / 100)
    }));

    // 상위 5명만 반환
    const topUsers = adjustedUsers.slice(0, 5);

    console.log(`✅ 매장 ${storeId} 상위 사용자 ${topUsers.length}명 조회 완료 (더미 데이터)`);

    res.json({
      success: true,
      storeId: storeId,
      users: topUsers,
      total: topUsers.length
    });

  } catch (error) {
    console.error('❌ 상위 사용자 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '상위 사용자 조회 실패'
    });
  }
});

module.exports = { router, updateStoreRating };