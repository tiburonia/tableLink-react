const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// 통합 클러스터 API - 레벨과 뷰포트에 따라 개별/클러스터 반환
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

    if (mapLevel <= 5) {
      // 개별 매장 모드
      result = await getIndividualStores(xmin, ymin, xmax, ymax);
    } else {
      // 클러스터 모드
      const gridSize = getGridSizeForLevel(mapLevel);
      result = await getClusteredStores(xmin, ymin, xmax, ymax, gridSize);
    }

    res.json({
      success: true,
      data: result,
      meta: {
        level: mapLevel,
        bbox: { xmin, ymin, xmax, ymax },
        count: result.length
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

// 레벨별 그리드 크기 결정
function getGridSizeForLevel(level) {
  if (level >= 6 && level <= 7) return 300;
  if (level >= 8 && level <= 10) return 2000;
  if (level > 10) return 10000;
  return 300; // 기본값
}

// 개별 매장 조회
async function getIndividualStores(xmin, ymin, xmax, ymax) {
  const query = `
    WITH viewport AS (
      SELECT ST_MakeEnvelope($1, $2, $3, $4, 4326) AS box
    )
    SELECT
      'individual' AS kind,
      sa.id,
      sa.store_id,
      si.name,
      si.category,
      si.rating_average,
      si.review_count,
      s.is_open,
      ST_X(sa.geom) AS lon,
      ST_Y(sa.geom) AS lat,
      sa.sido,
      sa.sigungu,
      sa.eupmyeondong
    FROM store_addresses sa
    JOIN stores s ON s.id = sa.store_id
    LEFT JOIN store_info si ON si.store_id = sa.store_id
    CROSS JOIN viewport v
    WHERE sa.geom && v.box
      AND ST_Intersects(sa.geom, v.box)
    LIMIT 1000
  `;

  const result = await pool.query(query, [xmin, ymin, xmax, ymax]);
  return result.rows;
}

// 클러스터 매장 조회
async function getClusteredStores(xmin, ymin, xmax, ymax, gridSizeMeters) {
  const query = `
    WITH viewport AS (
      SELECT ST_MakeEnvelope($1, $2, $3, $4, 4326) AS box
    ),
    grid_clusters AS (
      SELECT
        ST_SnapToGrid(ST_Transform(sa.geom, 3857), $5) AS grid_point,
        COUNT(*) as store_count,
        COUNT(CASE WHEN s.is_open = true THEN 1 END) as open_count,
        ST_Centroid(ST_Collect(sa.geom)) as center_geom,
        ARRAY_AGG(DISTINCT sa.sido) as sidos,
        ARRAY_AGG(DISTINCT sa.sigungu) as sigungus,
        ARRAY_AGG(DISTINCT sa.eupmyeondong) as eupmyeondongs
      FROM store_addresses sa
      JOIN stores s ON s.id = sa.store_id
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
      ST_X(center_geom) AS lon,
      ST_Y(center_geom) AS lat,
      sidos[1] as sido,
      sigungus[1] as sigungu,
      eupmyeondongs[1] as eupmyeondong
    FROM grid_clusters
    ORDER BY store_count DESC
    LIMIT 500
  `;

  const result = await pool.query(query, [xmin, ymin, xmax, ymax, gridSizeMeters]);
  return result.rows;
}

module.exports = router;