const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

/**
 * [GET] /stores/:storeId - 매장 정보 조회 (현재 스키마 기반)
 */
router.get('/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;

    console.log(`🏪 매장 ${storeId} 정보 조회 요청`);

    // stores 테이블에서 매장 정보 조회 (현재 스키마)
    const storeResult = await pool.query(`
      SELECT 
        s.id,
        s.name,
        s.category,
        s.phone,
        s.rating_average,
        s.review_count,
        s.favorite_count,
        s.is_open,
        sa.road_address as address,
        sa.latitude,
        sa.longitude
      FROM stores s
      LEFT JOIN store_addresses sa ON s.id = sa.store_id
      WHERE s.id = $1
    `, [storeId]);

    if (storeResult.rows.length === 0) {
      console.log(`❌ 매장 ${storeId}를 찾을 수 없음`);
      return res.status(404).json({
        success: false,
        error: '매장을 찾을 수 없습니다'
      });
    }

    const store = storeResult.rows[0];

    // 매장 메뉴 조회 (현재 스키마)
    const menuResult = await pool.query(`
      SELECT 
        id,
        name,
        description,
        price
      FROM menus
      WHERE store_id = $1 AND is_available = true
      ORDER BY id ASC
    `, [storeId]);

    console.log(`✅ 매장 ${store.name} (${storeId}) 정보 조회 완료`);

    res.json({
      success: true,
      store: {
        id: store.id,
        name: store.name,
        category: store.category,
        phone: store.phone,
        address: store.address,
        rating: parseFloat(store.rating_average) || 0,
        reviewCount: store.review_count || 0,
        favoriteCount: store.favorite_count || 0,
        isOpen: store.is_open !== false,
        location: store.latitude && store.longitude ? {
          lat: parseFloat(store.latitude),
          lng: parseFloat(store.longitude)
        } : null,
        menu: menuResult.rows
      }
    });

  } catch (error) {
    console.error('❌ 매장 정보 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '매장 정보 조회 중 오류가 발생했습니다: ' + error.message
    });
  }
});

/**
 * [GET] /stores/search/:query - 매장 검색 (현재 스키마 기반)
 */
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;

    console.log(`🔍 매장 검색: "${query}"`);

    const searchResult = await pool.query(`
      SELECT 
        s.id,
        s.name,
        s.category,
        s.rating_average,
        s.review_count,
        s.is_open,
        sa.road_address as address
      FROM stores s
      LEFT JOIN store_addresses sa ON s.id = sa.store_id
      WHERE s.name ILIKE $1 OR s.category ILIKE $1
      ORDER BY s.name ASC
      LIMIT 20
    `, [`%${query}%`]);

    console.log(`✅ 매장 검색 완료: "${query}" - ${searchResult.rows.length}개 결과`);

    res.json({
      success: true,
      stores: searchResult.rows.map(store => ({
        id: store.id,
        name: store.name,
        category: store.category,
        address: store.address,
        rating: parseFloat(store.rating_average) || 0,
        reviewCount: store.review_count || 0,
        isOpen: store.is_open !== false
      }))
    });

  } catch (error) {
    console.error('❌ 매장 검색 실패:', error);
    res.status(500).json({
      success: false,
      error: '매장 검색 중 오류가 발생했습니다: ' + error.message
    });
  }
});

/**
 * [GET] /stores/get-location-info - 위치 기반 주소 정보 조회
 */
router.get('/get-location-info', async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: '위도(lat)와 경도(lng) 파라미터가 필요합니다'
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        success: false,
        error: '올바른 위도, 경도 값을 입력해주세요'
      });
    }

    console.log(`📍 위치 정보 조회: (${latitude}, ${longitude})`);

    // PostGIS를 이용한 가장 가까운 매장의 주소 정보 조회
    const locationResult = await pool.query(`
      SELECT 
        sa.sido,
        sa.sigungu,
        sa.eupmyeondong,
        sa.road_address,
        sa.jibun_address,
        s.name as store_name,
        ST_Distance(
          ST_GeogFromText('POINT(' || $2 || ' ' || $1 || ')'),
          ST_GeogFromText('POINT(' || sa.longitude || ' ' || sa.latitude || ')')
        ) as distance
      FROM store_addresses sa
      JOIN stores s ON sa.store_id = s.id
      WHERE sa.latitude IS NOT NULL AND sa.longitude IS NOT NULL
      ORDER BY distance
      LIMIT 1
    `, [latitude, longitude]);

    if (locationResult.rows.length === 0) {
      // 매장이 없는 경우 기본 서울 정보 반환
      return res.json({
        success: true,
        location: {
          sido: '서울특별시',
          sigungu: '강남구',
          eupmyeondong: '역삼동',
          fullAddress: '서울특별시 강남구 역삼동',
          nearestStore: null,
          distance: null
        }
      });
    }

    const result = locationResult.rows[0];

    console.log(`✅ 위치 정보 조회 완료: ${result.sido} ${result.sigungu} ${result.eupmyeondong}`);

    res.json({
      success: true,
      location: {
        sido: result.sido,
        sigungu: result.sigungu,
        eupmyeondong: result.eupmyeondong,
        roadAddress: result.road_address,
        jibunAddress: result.jibun_address,
        fullAddress: `${result.sido} ${result.sigungu} ${result.eupmyeondong}`,
        nearestStore: {
          name: result.store_name,
          distance: Math.round(result.distance) // 미터 단위
        }
      }
    });

  } catch (error) {
    console.error('❌ 위치 정보 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '위치 정보 조회 중 오류가 발생했습니다: ' + error.message
    });
  }
});

module.exports = router;