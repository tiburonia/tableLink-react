const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// 개별 매장만 반환하는 단순화된 API
router.get('/clusters', async (req, res) => {
  try {
    const { level, bbox } = req.query;

    if (!level || !bbox) {
      return res.status(400).json({
        success: false,
        error: '레벨과 bbox 파라미터가 필요합니다'
      });
    }

    const [xmin, ymin, xmax, ymax] = bbox.split(',').map(parseFloat);
    const mapLevel = parseInt(level);

    console.log(`🎯 개별 매장 전용 API: 레벨 ${mapLevel}, bbox: ${xmin},${ymin},${xmax},${ymax}`);

    // 모든 레벨에서 개별 매장만 반환
    const stores = await getIndividualStores(xmin, ymin, xmax, ymax);

    // 표준화된 응답 포맷
    const response = {
      success: true,
      type: 'individual',
      data: stores,
      features: stores,  // 호환성 유지
      meta: {
        level: mapLevel,
        bbox: { xmin, ymin, xmax, ymax },
        count: stores.length,
        timestamp: new Date().toISOString()
      }
    };

    console.log(`✅ 개별 매장 ${stores.length}개 반환`);
    res.json(response);

  } catch (error) {
    console.error('❌ 개별 매장 API 오류:', error);
    res.status(500).json({
      success: false,
      error: '매장 데이터 조회 실패'
    });
  }
});

// 개별 매장 조회 - 서버에서 더 많은 집계 처리
async function getIndividualStores(xmin, ymin, xmax, ymax) {
  console.log(`🔍 매장 조회 시작 - bbox: [${xmin}, ${ymin}, ${xmax}, ${ymax}]`);

  // 먼저 전체 매장 수 확인
  const totalStoresQuery = `SELECT COUNT(*) as total FROM store_addresses`;
  const totalResult = await pool.query(totalStoresQuery);
  console.log(`📊 전체 매장 수: ${totalResult.rows[0].total}`);

  // bbox 영역 내 매장 수 확인 (조건 완화)
  const bboxQuery = `
    SELECT COUNT(*) as count,
           MIN(ST_X(geom)) as min_lng, MAX(ST_X(geom)) as max_lng,
           MIN(ST_Y(geom)) as min_lat, MAX(ST_Y(geom)) as max_lat
    FROM store_addresses sa
    WHERE ST_X(geom) BETWEEN $1 AND $3 
      AND ST_Y(geom) BETWEEN $2 AND $4
  `;

  const bboxResult = await pool.query(bboxQuery, [xmin, ymin, xmax, ymax]);
  console.log(`📍 bbox 영역 내 매장 수: ${bboxResult.rows[0].count}`);
  console.log(`📍 DB 좌표 범위: lng(${bboxResult.rows[0].min_lng} ~ ${bboxResult.rows[0].max_lng}), lat(${bboxResult.rows[0].min_lat} ~ ${bboxResult.rows[0].max_lat})`);

  const query = `
    WITH viewport AS (
      SELECT ST_MakeEnvelope($1, $2, $3, $4, 4326) AS box
    )
    SELECT
      'individual' AS kind,
      sa.store_id as id,
      sa.store_id as store_id, -- 명시적으로 store_id도 포함
      si.name,
      si.category,
      -- 서버에서 별점 처리
      COALESCE(si.rating_average, 0)::numeric(3,1) as rating_average,
      COALESCE(si.review_count, 0) as review_count,
      s.is_open,
      ST_Y(sa.geom) AS latitude,
      ST_X(sa.geom) AS longitude,
      -- 주소 조합을 서버에서 처리
      CONCAT_WS(' ', sa.sido, sa.sigungu, sa.eupmyeondong) as full_address,
      sa.sido,
      sa.sigungu,
      sa.eupmyeondong,
      -- 서버에서 카테고리 아이콘 매핑
      CASE 
        WHEN si.category LIKE '%한식%' THEN '🍚'
        WHEN si.category LIKE '%중식%' THEN '🥢'
        WHEN si.category LIKE '%일식%' THEN '🍣'
        WHEN si.category LIKE '%양식%' THEN '🍝'
        WHEN si.category LIKE '%치킨%' THEN '🍗'
        WHEN si.category LIKE '%피자%' THEN '🍕'
        WHEN si.category LIKE '%버거%' THEN '🍔'
        WHEN si.category LIKE '%카페%' THEN '☕'
        WHEN si.category LIKE '%디저트%' THEN '🍰'
        WHEN si.category LIKE '%분식%' THEN '🍜'
        WHEN si.category LIKE '%족발%' OR si.category LIKE '%보쌈%' THEN '🦶'
        WHEN si.category LIKE '%바베큐%' THEN '🥩'
        WHEN si.category LIKE '%해산물%' THEN '🦐'
        WHEN si.category LIKE '%아시안%' THEN '🍛'
        WHEN si.category LIKE '%패스트푸드%' THEN '🍟'
        WHEN si.category LIKE '%술집%' THEN '🍺'
        ELSE '🍽️'
      END as category_icon
    FROM store_addresses sa
    JOIN stores s ON s.id = sa.store_id
    LEFT JOIN store_info si ON si.store_id = sa.store_id
    CROSS JOIN viewport v
    WHERE sa.geom && v.box
      AND ST_Intersects(sa.geom, v.box)
    ORDER BY s.is_open DESC, si.rating_average DESC NULLS LAST
    LIMIT 2000
  `;

  console.log(`🔍 실행할 SQL 쿼리:`, query);
  const result = await pool.query(query, [xmin, ymin, xmax, ymax]);
  console.log(`📊 쿼리 결과: ${result.rows.length}개 매장 조회됨`);

  // 결과가 없으면 더 간단한 쿼리로 테스트
  if (result.rows.length === 0) {
    console.log('❌ 주 쿼리 결과 없음 - 대안 쿼리 실행');

    // 조건 완화한 단순 쿼리
    const simpleQuery = `
      SELECT sa.store_id, ST_X(sa.geom) as longitude, ST_Y(sa.geom) as latitude, s.name
      FROM store_addresses sa
      JOIN stores s ON s.id = sa.store_id  
      WHERE ST_X(sa.geom) BETWEEN $1 AND $3 
        AND ST_Y(sa.geom) BETWEEN $2 AND $4
      LIMIT 10
    `;

    const simpleResult = await pool.query(simpleQuery, [xmin, ymin, xmax, ymax]);
    console.log(`📍 간단한 쿼리 결과: ${simpleResult.rows.length}개`);

    if (simpleResult.rows.length > 0) {
      console.log('📍 샘플 데이터:', simpleResult.rows[0]);
    }

    // 전체 영역에서 가장 가까운 매장 찾기
    const nearestQuery = `
      SELECT sa.store_id, ST_X(sa.geom) as longitude, ST_Y(sa.geom) as latitude, s.name,
             ST_Distance(sa.geom, ST_Point($1, $2)) as distance
      FROM store_addresses sa
      JOIN stores s ON s.id = sa.store_id
      ORDER BY distance
      LIMIT 5
    `;

    const centerLng = (xmin + xmax) / 2;
    const centerLat = (ymin + ymax) / 2;
    const nearestResult = await pool.query(nearestQuery, [centerLng, centerLat]);
    console.log(`📍 가장 가까운 매장들:`, nearestResult.rows);
  }

  const data = result.rows.map(row => {
    if (row.kind === 'cluster') {
      return {
        kind: 'cluster',
        lat: parseFloat(row.latitude),
        lng: parseFloat(row.longitude),
        count: parseInt(row.count),
        bounds: row.bounds
      };
    } else {
      // 통합된 storeData 객체 형식으로 반환
      return {
        kind: 'individual',
        id: parseInt(row.store_id),
        store_id: parseInt(row.store_id),
        name: row.name || '매장명 없음',
        category: row.category || '기타',
        address: `${row.sido || ''} ${row.sigungu || ''} ${row.eupmyeondong || ''}`.trim() || '주소 정보 없음',
        ratingAverage: row.rating_average ? parseFloat(row.rating_average) : 0.0,
        reviewCount: row.review_count || 0,
        favoriteCount: 0,
        isOpen: row.is_open !== false,
        coord: { 
          lat: parseFloat(row.latitude), 
          lng: parseFloat(row.longitude) 
        },
        region: {
          sido: row.sido,
          sigungu: row.sigungu,
          eupmyeondong: row.eupmyeondong
        },
        // 하위 호환성을 위한 추가 필드들
        lat: parseFloat(row.latitude),
        lng: parseFloat(row.longitude),
        full_address: `${row.sido || ''} ${row.sigungu || ''} ${row.eupmyeondong || ''}`.trim(),
        is_open: row.is_open,
        rating_average: row.rating_average ? parseFloat(row.rating_average) : 0.0,
        review_count: row.review_count || 0
      };
    }
  });

  return data;
}

module.exports = router;