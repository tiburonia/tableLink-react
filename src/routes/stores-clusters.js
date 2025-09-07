
const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// 통합 클러스터 API - 표준화된 응답 포맷
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

    console.log(`🎯 통합 클러스터 API: 레벨 ${mapLevel}, bbox: ${xmin},${ymin},${xmax},${ymax}`);

    let result;
    let responseType;

    if (mapLevel <= 5) {
      // 개별 매장 모드
      result = await getIndividualStores(xmin, ymin, xmax, ymax);
      responseType = 'individual';
    } else {
      // 클러스터 모드
      const gridSize = getGridSizeForLevel(mapLevel);
      result = await getClusteredStores(xmin, ymin, xmax, ymax, gridSize);
      responseType = 'cluster';
    }

    // 표준화된 응답 포맷
    res.json({
      success: true,
      type: responseType,
      features: result,
      meta: {
        level: mapLevel,
        bbox: { xmin, ymin, xmax, ymax },
        count: result.length,
        gridSize: responseType === 'cluster' ? getGridSizeForLevel(mapLevel) : null
      }
    });

  } catch (error) {
    console.error('❌ 통합 클러스터 API 오류:', error);
    res.status(500).json({
      success: false,
      error: '클러스터 데이터 조회 실패'
    });
  }
});

// 레벨별 그리드 크기 결정 (설정 테이블화)
const GRID_SIZE_CONFIG = {
  6: 200,   // 가장 세밀한 클러스터
  7: 400,   
  8: 800,   
  9: 1600,  
  10: 3200, 
  11: 6400, 
  12: 12800,
  13: 25600,
  14: 51200  // 가장 큰 클러스터
};

function getGridSizeForLevel(level) {
  return GRID_SIZE_CONFIG[level] || GRID_SIZE_CONFIG[8]; // 기본값
}

// 개별 매장 조회 - 서버에서 더 많은 집계 처리
async function getIndividualStores(xmin, ymin, xmax, ymax) {
  const query = `
    WITH viewport AS (
      SELECT ST_MakeEnvelope($1, $2, $3, $4, 4326) AS box
    )
    SELECT
      'individual' AS kind,
      sa.store_id,
      si.name,
      si.category,
      -- 서버에서 별점 처리
      COALESCE(si.rating_average, 0)::numeric(3,1) as rating_average,
      COALESCE(si.review_count, 0) as review_count,
      s.is_open,
      ST_X(sa.geom) AS lng,
      ST_Y(sa.geom) AS lat,
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
    LIMIT 1000
  `;

  const result = await pool.query(query, [xmin, ymin, xmax, ymax]);
  return result.rows;
}

// 클러스터 매장 조회 - 거리 기반 + 격자 기반 하이브리드
async function getClusteredStores(xmin, ymin, xmax, ymax, gridSizeMeters) {
  const query = `
    WITH viewport AS (
      SELECT ST_MakeEnvelope($1, $2, $3, $4, 4326) AS box
    ),
    -- 먼저 격자로 그룹핑
    grid_clusters AS (
      SELECT
        ST_SnapToGrid(ST_Transform(sa.geom, 3857), $5) AS grid_point,
        COUNT(*) as store_count,
        COUNT(CASE WHEN s.is_open = true THEN 1 END) as open_count,
        COUNT(CASE WHEN s.is_open = false THEN 1 END) as closed_count,
        ST_Centroid(ST_Collect(sa.geom)) as center_geom,
        -- 서버에서 카테고리별 집계
        COUNT(CASE WHEN si.category LIKE '%한식%' THEN 1 END) as korean_count,
        COUNT(CASE WHEN si.category LIKE '%중식%' THEN 1 END) as chinese_count,
        COUNT(CASE WHEN si.category LIKE '%일식%' THEN 1 END) as japanese_count,
        COUNT(CASE WHEN si.category LIKE '%양식%' THEN 1 END) as western_count,
        COUNT(CASE WHEN si.category LIKE '%카페%' THEN 1 END) as cafe_count,
        -- 서버에서 평점 평균 계산
        AVG(COALESCE(si.rating_average, 0))::numeric(3,1) as avg_rating,
        SUM(COALESCE(si.review_count, 0)) as total_reviews,
        -- 지역 정보
        MODE() WITHIN GROUP (ORDER BY sa.sido) as main_sido,
        MODE() WITHIN GROUP (ORDER BY sa.sigungu) as main_sigungu,
        MODE() WITHIN GROUP (ORDER BY sa.eupmyeondong) as main_eupmyeondong
      FROM store_addresses sa
      JOIN stores s ON s.id = sa.store_id
      LEFT JOIN store_info si ON si.store_id = sa.store_id
      CROSS JOIN viewport v
      WHERE sa.geom && v.box
        AND ST_Intersects(sa.geom, v.box)
      GROUP BY grid_point
      HAVING COUNT(*) > 0
    )
    SELECT
      'cluster' AS kind,
      store_count,
      open_count,
      closed_count,
      ST_X(center_geom) AS lng,
      ST_Y(center_geom) AS lat,
      -- 서버에서 클러스터 요약 정보 생성
      avg_rating,
      total_reviews,
      korean_count,
      chinese_count,
      japanese_count,
      western_count,
      cafe_count,
      -- 주요 카테고리 아이콘 결정
      CASE 
        WHEN korean_count >= ALL(ARRAY[chinese_count, japanese_count, western_count, cafe_count]) THEN '🍚'
        WHEN chinese_count >= ALL(ARRAY[korean_count, japanese_count, western_count, cafe_count]) THEN '🥢'
        WHEN japanese_count >= ALL(ARRAY[korean_count, chinese_count, western_count, cafe_count]) THEN '🍣'
        WHEN western_count >= ALL(ARRAY[korean_count, chinese_count, japanese_count, cafe_count]) THEN '🍝'
        WHEN cafe_count >= ALL(ARRAY[korean_count, chinese_count, japanese_count, western_count]) THEN '☕'
        ELSE '🍽️'
      END as dominant_category_icon,
      CONCAT_WS(' ', main_sido, main_sigungu, main_eupmyeondong) as full_address,
      main_sido as sido,
      main_sigungu as sigungu,
      main_eupmyeondong as eupmyeondong
    FROM grid_clusters
    ORDER BY store_count DESC
    LIMIT 500
  `;

  const result = await pool.query(query, [xmin, ymin, xmax, ymax, gridSizeMeters]);
  return result.rows;
}

module.exports = router;
