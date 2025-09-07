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

    // 표준화된 응답 포맷 (디버깅 강화)
    console.log(`📊 API 응답 준비: ${responseType}, ${result.length}개 결과`);

    const response = {
      success: true,
      type: responseType,
      data: result,  // features → data로 통일
      features: result,  // 호환성 유지
      meta: {
        level: mapLevel,
        bbox: { xmin, ymin, xmax, ymax },
        count: result.length,
        gridSize: responseType === 'cluster' ? getGridSizeForLevel(mapLevel) : null,
        timestamp: new Date().toISOString()
      }
    };

    console.log(`✅ 최종 응답:`, JSON.stringify(response, null, 2));
    res.json(response);

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

// 행정구역 기반 클러스터 매장 조회 (최적화된 집계)
async function getClusteredStores(xmin, ymin, xmax, ymax, gridSizeMeters) {
  // 줌 레벨에 따른 행정구역 단위 결정
  const level = getLevelFromGridSize(gridSizeMeters);
  let adminLevel, joinColumn;

  if (level >= 11) {
    adminLevel = 'sido';
    joinColumn = 'sa.sido_code';
  } else if (level >= 8) {
    adminLevel = 'sigungu';  
    joinColumn = 'sa.sigungu_code';
  } else {
    adminLevel = 'emd';
    joinColumn = 'sa.emd_code';
  }

  console.log(`🏛️ 행정구역 기반 집계: ${adminLevel} 단위 (레벨: ${level})`);

  const query = `
    WITH viewport AS (
      SELECT ST_MakeEnvelope($1, $2, $3, $4, 4326) AS box
    ),
    admin_clusters AS (
      SELECT
        aa.code,
        aa.name,
        aa.level,
        COUNT(sa.store_id) as store_count,
        COUNT(CASE WHEN s.is_open = true THEN 1 END) as open_count,
        COUNT(CASE WHEN s.is_open = false THEN 1 END) as closed_count,
        -- 행정구역 중심점 사용 (기하학적 중심)
        ST_Y(ST_Centroid(aa.geom)) AS lat,
        ST_X(ST_Centroid(aa.geom)) AS lng,
        -- 최소 데이터만 집계 (성능 최적화)
        AVG(COALESCE(si.rating_average, 0))::numeric(3,1) as avg_rating,
        SUM(COALESCE(si.review_count, 0)) as total_reviews
      FROM administrative_areas aa
      LEFT JOIN store_addresses sa ON ${joinColumn} = aa.code
      LEFT JOIN stores s ON sa.store_id = s.id
      LEFT JOIN store_info si ON si.store_id = sa.store_id
      CROSS JOIN viewport v
      WHERE aa.level = $5
        AND (aa.geom && v.box OR aa.geom IS NULL)
        AND (sa.geom IS NULL OR ST_Intersects(sa.geom, v.box))
      GROUP BY aa.code, aa.name, aa.level, aa.geom
      HAVING COUNT(sa.store_id) > 0
    )
    SELECT
      'cluster' AS kind,
      code,
      name,
      level,
      store_count,
      open_count,
      closed_count,
      lat,
      lng,
      avg_rating,
      total_reviews,
      -- 행정구역 이름을 주소로 사용
      name as full_address
    FROM admin_clusters
    ORDER BY store_count DESC
    LIMIT 200
  `;

  const result = await pool.query(query, [xmin, ymin, xmax, ymax, adminLevel]);
  return result.rows;
}

// 그리드 크기로부터 줌 레벨 역산 (대략적)
function getLevelFromGridSize(gridSize) {
  if (gridSize >= 25600) return 14;
  if (gridSize >= 12800) return 13;
  if (gridSize >= 6400) return 12;
  if (gridSize >= 3200) return 11;
  if (gridSize >= 1600) return 10;
  if (gridSize >= 800) return 9;
  if (gridSize >= 400) return 8;
  if (gridSize >= 200) return 7;
  return 6;
}

module.exports = router;