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
    LIMIT 2000
  `;

  const result = await pool.query(query, [xmin, ymin, xmax, ymax]);
  return result.rows;
}

module.exports = router;