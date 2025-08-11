const express = require('express');
const router = express.Router();
const pool = require('../shared/config/database');

// 행정기관 좌표 배치 조회 (성능 최적화)
router.post('/administrative-offices-batch', async (req, res) => {
  try {
    const { requests } = req.body;

    if (!requests || !Array.isArray(requests)) {
      return res.status(400).json({
        success: false,
        error: '요청 배열이 필요합니다'
      });
    }

    console.log(`🚀 행정기관 좌표 배치 조회: ${requests.length}개 요청`);

    // 요청을 타입별로 그룹화
    const sidoRequests = requests.filter(req => req.regionType === 'sido');
    const sigunguRequests = requests.filter(req => req.regionType === 'sigungu');

    const offices = [];

    // 시도 단위 배치 조회
    if (sidoRequests.length > 0) {
      const sidoNames = sidoRequests.map(req => `%${req.regionName}%`);
      const sidoQuery = `
        SELECT latitude, longitude, region_name as name
        FROM administrative_offices 
        WHERE region_type = 'sido' AND (${sidoNames.map((_, i) => `region_name LIKE $${i + 1}`).join(' OR ')})
      `;
      const sidoResult = await pool.query(sidoQuery, sidoNames);
      offices.push(...sidoResult.rows);
    }

    // 시군구 단위 배치 조회
    if (sigunguRequests.length > 0) {
      const sigunguNames = sigunguRequests.map(req => `%${req.regionName}%`);
      const sigunguQuery = `
        SELECT latitude, longitude, region_name as name
        FROM administrative_offices 
        WHERE region_type = 'sigungu' AND (${sigunguNames.map((_, i) => `region_name LIKE $${i + 1}`).join(' OR ')})
      `;
      const sigunguResult = await pool.query(sigunguQuery, sigunguNames);
      offices.push(...sigunguResult.rows);
    }

    console.log(`✅ 배치 조회 완료: ${offices.length}개 행정기관`);

    res.json({
      success: true,
      offices: offices
    });
  } catch (error) {
    console.error('❌ 행정기관 배치 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '서버 오류'
    });
  }
});

// 행정기관 좌표 조회 (기존 API 유지)
router.get('/administrative-office', async (req, res) => {
  try {
    const { regionType, regionName } = req.query;

    if (!regionType || !regionName) {
      return res.status(400).json({
        success: false,
        error: '지역 타입과 이름이 필요합니다'
      });
    }

    console.log(`🏛️ 행정기관 좌표 조회: ${regionType} - ${regionName}`);

    let query;
    if (regionType === 'sido') {
      query = `
        SELECT latitude, longitude, region_name as name
        FROM administrative_offices 
        WHERE region_type = 'sido' AND region_name LIKE $1
        LIMIT 1
      `;
    } else {
      query = `
        SELECT latitude, longitude, region_name as name
        FROM administrative_offices 
        WHERE region_type = 'sigungu' AND region_name LIKE $1
        LIMIT 1
      `;
    }

    const result = await pool.query(query, [`%${regionName}%`]);

    if (result.rows.length > 0) {
      const office = result.rows[0];
      console.log(`✅ 행정기관 좌표 발견: ${office.name} (${office.latitude}, ${office.longitude})`);
      res.json({
        success: true,
        office: office
      });
    } else {
      console.log(`⚠️ 행정기관 좌표 없음: ${regionType} - ${regionName}`);
      res.json({
        success: false,
        error: '행정기관을 찾을 수 없습니다'
      });
    }
  } catch (error) {
    console.error('❌ 행정기관 좌표 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '서버 오류'
    });
  }
});

// 읍면동 중심점 좌표 계산 API (ST_PointOnSurface 사용)
router.get('/eupmyeondong-center', async (req, res) => {
  try {
    const { sido, sigungu, eupmyeondong } = req.query;

    if (!sido || !sigungu || !eupmyeondong) {
      return res.status(400).json({
        success: false,
        error: 'sido, sigungu, eupmyeondong이 모두 필요합니다'
      });
    }

    console.log(`📍 읍면동 중심점 계산: ${sido} ${sigungu} ${eupmyeondong}`);

    // PostGIS가 없는 경우 단순 평균 좌표로 중심점 계산
    const result = await pool.query(`
      SELECT 
        AVG(sa.latitude) as center_lat,
        AVG(sa.longitude) as center_lng,
        COUNT(*) as store_count
      FROM store_address sa
      WHERE sa.sido = $1 
        AND sa.sigungu = $2 
        AND sa.eupmyeondong = $3
        AND sa.latitude IS NOT NULL 
        AND sa.longitude IS NOT NULL
      HAVING COUNT(*) > 0;
    `, [sido, sigungu, eupmyeondong]);

    if (result.rows.length === 0 || !result.rows[0].center_lat) {
      console.log(`⚠️ 읍면동 중심점 계산 실패: ${sido} ${sigungu} ${eupmyeondong}`);
      return res.json({
        success: false,
        error: '해당 읍면동의 중심점을 계산할 수 없습니다'
      });
    }

    const center = result.rows[0];
    console.log(`✅ 읍면동 중심점: ${sido} ${sigungu} ${eupmyeondong} (${center.center_lat}, ${center.center_lng})`);

    res.json({
      success: true,
      center: {
        latitude: parseFloat(center.center_lat),
        longitude: parseFloat(center.center_lng)
      }
    });

  } catch (error) {
    console.error('❌ 읍면동 중심점 계산 실패:', error);
    res.status(500).json({
      success: false,
      error: '읍면동 중심점 계산 실패: ' + error.message
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
      SELECT s.id, s.name, s.category, sa.address_full as address, s.is_open, s.rating_average, s.review_count, sa.latitude, sa.longitude,
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
      reviewCount: store.review_count || 0,
      sido: store.sido,
      sigungu: store.sigungu,
      eupmyeondong: store.eupmyeondong
    }));

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
    const storeResult = await pool.query(`
      SELECT s.*, sa.address_full as address, sa.latitude, sa.longitude
      FROM stores s 
      LEFT JOIN store_address sa ON s.id = sa.store_id 
      WHERE s.id = $1
    `, [storeId]);

    if (storeResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: '매장을 찾을 수 없습니다' });
    }

    const store = storeResult.rows[0];

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

    res.json({
      success: true,
      store: {
        id: store.id,
        name: store.name,
        category: store.category,
        address: store.address,
        phone: store.phone,
        isOpen: store.is_open,
        ratingAverage: parseFloat(store.rating_average) || 0,
        reviewCount: store.review_count || 0,
        description: store.description,
        operatingHours: store.operating_hours,
        latitude: store.latitude,
        longitude: store.longitude,
        tables: tables,
        tableInfo: {
          totalTables: totalTables,
          availableTables: availableTables,
          occupiedTables: occupiedTables,
          occupancyRate: occupancyRate
        }
      }
    });
  } catch (error) {
    console.error('매장 조회 실패:', error);
    res.status(500).json({ success: false, error: '매장 조회 실패' });
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

// 매장별 별점 정보 조회 API (개별 조회용, 기존 호환성 유지)
router.get('/:storeId/rating', async (req, res) => {
  try {
    const { storeId } = req.params;
    console.log(`⭐ 매장 ${storeId} 별점 정보 조회 요청`);

    const result = await pool.query(`
      SELECT rating_average, review_count 
      FROM stores 
      WHERE id = $1
    `, [parseInt(storeId)]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '매장을 찾을 수 없습니다' });
    }

    const store = result.rows[0];
    const ratingData = {
      success: true,
      storeId: parseInt(storeId),
      ratingAverage: store.rating_average ? parseFloat(store.rating_average) : 0.0,
      reviewCount: store.review_count || 0
    };

    console.log(`⭐ 매장 ${storeId} 별점 정보 조회 완료: ${ratingData.ratingAverage}점 (${ratingData.reviewCount}개 리뷰)`);
    res.json(ratingData);

  } catch (error) {
    console.error('❌ 매장 별점 정보 조회 실패:', error);
    res.status(500).json({ error: '매장 별점 정보 조회 실패' });
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

      // 운영 상태 업데이트
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

module.exports = { router, updateStoreRating };