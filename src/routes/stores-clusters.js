
const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// 통합 클러스터링 API
router.get('/clusters', async (req, res) => {
  try {
    const level = parseInt(req.query.level, 10);
    const bbox = (req.query.bbox || '').split(',').map(Number);
    
    if (isNaN(level) || bbox.length !== 4 || bbox.some(n => Number.isNaN(n))) {
      return res.status(400).json({ error: 'Invalid level or bbox parameters' });
    }
    
    const [xmin, ymin, xmax, ymax] = bbox;
    console.log(`🔄 클러스터 API 요청: level=${level}, bbox=[${bbox.join(',')}]`);

    // 레벨별 모드 및 그리드 크기 결정
    let mode = 'individual';
    let gridSizeMeters = null;
    
    if (level <= 5) {
      mode = 'individual';
    } else if (level <= 7) {
      mode = 'cluster';
      gridSizeMeters = 300;
    } else if (level <= 10) {
      mode = 'cluster';
      gridSizeMeters = 2000;
    } else {
      mode = 'cluster';
      gridSizeMeters = 10000;
    }

    if (mode === 'individual') {
      // 개별 매장 마커
      const sql = `
        WITH viewport AS (
          SELECT ST_MakeEnvelope($1, $2, $3, $4, 4326) AS box
        )
        SELECT
          'individual' AS kind,
          sa.id,
          sa.store_id,
          sa.road_address,
          ST_X(sa.geom) AS lon,
          ST_Y(sa.geom) AS lat,
          si.name,
          si.category,
          si.rating_average,
          si.review_count,
          s.is_open,
          sa.sido,
          sa.sigungu,
          sa.eupmyeondong
        FROM store_addresses sa
        JOIN stores s ON sa.store_id = s.id
        LEFT JOIN store_info si ON s.id = si.store_id
        CROSS JOIN viewport v
        WHERE sa.geom && v.box
          AND ST_Intersects(sa.geom, v.box)
        ORDER BY sa.id
        LIMIT 5000;
      `;
      
      const { rows } = await pool.query(sql, [xmin, ymin, xmax, ymax]);
      console.log(`✅ 개별 매장 ${rows.length}개 조회 완료`);
      
      return res.json({ 
        type: 'individual', 
        level: level,
        count: rows.length,
        features: rows 
      });
      
    } else {
      // 클러스터 마커
      const sql = `
        WITH
        viewport AS (
          SELECT ST_MakeEnvelope($1, $2, $3, $4, 4326) AS box4326
        ),
        v3857 AS (
          SELECT ST_Transform(box4326, 3857) AS box3857 FROM viewport
        ),
        filtered AS (
          SELECT sa.*, s.is_open, si.name, si.category
          FROM store_addresses sa
          JOIN stores s ON sa.store_id = s.id
          LEFT JOIN store_info si ON s.id = si.store_id
          CROSS JOIN viewport v
          WHERE sa.geom && v.box4326
            AND ST_Intersects(sa.geom, v.box4326)
        ),
        projected AS (
          SELECT 
            id, store_id, road_address, name, category, is_open,
            ST_Transform(geom, 3857) AS g3857
          FROM filtered
        ),
        gridded AS (
          SELECT
            ST_SnapToGrid(g3857, $5, $5) AS cell,
            COUNT(*) AS total_count,
            COUNT(*) FILTER (WHERE is_open = true) AS open_count,
            ST_Transform(
              ST_PointOnSurface(ST_Collect(g3857)),
              4326
            ) AS rep_geom,
            array_agg(DISTINCT category) FILTER (WHERE category IS NOT NULL) AS categories
          FROM projected
          CROSS JOIN v3857
          WHERE g3857 && v3857.box3857
          GROUP BY ST_SnapToGrid(g3857, $5, $5)
        )
        SELECT
          'cluster' AS kind,
          total_count,
          open_count,
          ST_X(rep_geom) AS lon,
          ST_Y(rep_geom) AS lat,
          categories
        FROM gridded
        WHERE total_count > 0;
      `;
      
      const { rows } = await pool.query(sql, [xmin, ymin, xmax, ymax, gridSizeMeters]);
      console.log(`✅ 클러스터 ${rows.length}개 조회 완료 (그리드: ${gridSizeMeters}m)`);
      
      return res.json({ 
        type: 'cluster', 
        level: level,
        gridSize: gridSizeMeters,
        count: rows.length,
        features: rows 
      });
    }
    
  } catch (error) {
    console.error('❌ 클러스터 API 오류:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
