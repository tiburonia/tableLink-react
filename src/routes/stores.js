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

    // store_info 테이블에서 매장 정보 조회
    const storeResult = await pool.query(`
      SELECT 
        si.store_id as id,
        si.name,
        si.category,
        si.store_tel_number as phone,
        si.rating_average,
        si.review_count,
        si.favoratite_count as favorite_count,
        s.is_open,
        sa.road_address as address,
        sa.latitude,
        sa.longitude
      FROM store_info si
      LEFT JOIN stores s ON si.store_id = s.id
      LEFT JOIN store_addresses sa ON si.store_id = sa.store_id
      WHERE si.store_id = $1
    `, [storeId]);

    if (storeResult.rows.length === 0) {
      console.log(`❌ 매장 ${storeId}를 찾을 수 없음`);
      return res.status(404).json({
        success: false,
        error: '매장을 찾을 수 없습니다'
      });
    }

    const store = storeResult.rows[0];

    // 매장 메뉴 조회
    const menuResult = await pool.query(`
      SELECT 
        id,
        name,
        description,
        price,
        cook_station
      FROM store_menu
      WHERE store_id = $1
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
        si.store_id as id,
        si.name,
        si.category,
        si.rating_average,
        si.review_count,
        s.is_open,
        sa.road_address as address
      FROM store_info si
      LEFT JOIN stores s ON si.store_id = s.id
      LEFT JOIN store_addresses sa ON si.store_id = sa.store_id
      WHERE si.name ILIKE $1 OR si.category ILIKE $1
      ORDER BY si.name ASC
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

module.exports = router;