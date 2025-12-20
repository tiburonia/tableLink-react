const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// 개별 매장만 반환하는 단순화된 API
router.get('/', async (req, res) => {
  try {
    const { level, bbox } = req.query;

    // 파라미터 유효성 검사
    if (!level || !bbox) {
      return res.status(400).json({
        success: false,
        error: '레벨과 bbox 파라미터가 필요합니다',
        required_params: { level: 'number', bbox: 'xmin,ymin,xmax,ymax' }
      });
    }

    // bbox 파싱 및 검증
    const bboxParts = bbox.split(',');
    if (bboxParts.length !== 4) {
      return res.status(400).json({
        success: false,
        error: 'bbox 형식이 올바르지 않습니다 (xmin,ymin,xmax,ymax 형식이어야 함)'
      });
    }

    const [xmin, ymin, xmax, ymax] = bboxParts.map(parseFloat);
    const mapLevel = parseInt(level);

    // 좌표값 유효성 검사
    if ([xmin, ymin, xmax, ymax].some(coord => isNaN(coord))) {
      return res.status(400).json({
        success: false,
        error: 'bbox 좌표값이 유효하지 않습니다'
      });
    }

    // 레벨 유효성 검사
    if (isNaN(mapLevel) || mapLevel < 1 || mapLevel > 19) {
      return res.status(400).json({
        success: false,
        error: '지도 레벨이 유효하지 않습니다 (1-19 사이여야 함)'
      });
    }

    console.log(`🎯 개별 매장 전용 API: 레벨 ${mapLevel}, bbox: ${xmin},${ymin},${xmax},${ymax}`);

    // 매장 데이터 조회
    const stores = await getIndividualStores(xmin, ymin, xmax, ymax);

    // 응답 데이터 검증
    const validStores = Array.isArray(stores) ? stores : [];

    // 표준화된 응답 포맷
    const response = {
      success: true,
      type: 'individual',
      data: validStores,
      features: validStores,  // 호환성 유지
      meta: {
        level: mapLevel,
        bbox: { xmin, ymin, xmax, ymax },
        count: validStores.length,
        timestamp: new Date().toISOString(),
        message: validStores.length === 0 ? '해당 영역에 매장이 없습니다' : undefined
      }
    };

    console.log(`✅ 개별 매장 ${validStores.length}개 반환`);
    res.json(response);

  } catch (error) {
    console.error('❌ 개별 매장 API 오류:', error);
    
    // 에러 타입별 상세 응답
    let errorMessage = '매장 데이터 조회 실패';
    let statusCode = 500;
    
    if (error.message.includes('데이터베이스 연결')) {
      errorMessage = '데이터베이스 연결에 실패했습니다';
      statusCode = 503;
    } else if (error.message.includes('데이터 조회 중 오류')) {
      errorMessage = '데이터 조회 중 오류가 발생했습니다';
      statusCode = 500;
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      type: 'server_error',
      timestamp: new Date().toISOString(),
      meta: {
        data: [],
        features: [],
        count: 0
      }
    });
  }
});

// 개별 매장 조회 - 서버에서 더 많은 집계 처리
async function getIndividualStores(xmin, ymin, xmax, ymax) {
  try {
    console.log(`🔍 매장 조회 시작 - bbox: [${xmin}, ${ymin}, ${xmax}, ${ymax}]`);

    // 입력값 유효성 검사
    if (!isFinite(xmin) || !isFinite(ymin) || !isFinite(xmax) || !isFinite(ymax)) {
      console.error('❌ 유효하지 않은 bbox 좌표:', { xmin, ymin, xmax, ymax });
      return [];
    }

    // bbox 크기 검사 (너무 작거나 큰 영역 방지)
    const lngRange = Math.abs(xmax - xmin);
    const latRange = Math.abs(ymax - ymin);
    
    if (lngRange > 10 || latRange > 10) {
      console.warn('⚠️ bbox 영역이 너무 큽니다:', { lngRange, latRange });
      return [];
    }

    if (lngRange < 0.001 || latRange < 0.001) {
      console.warn('⚠️ bbox 영역이 너무 작습니다:', { lngRange, latRange });
      return [];
    }

    // 먼저 전체 매장 수 확인
    const totalStoresQuery = `SELECT COUNT(*) as total FROM store_addresses WHERE geom IS NOT NULL`;
    const totalResult = await pool.query(totalStoresQuery);
    console.log(`📊 전체 매장 수: ${totalResult.rows[0]?.total || 0}`);

    if (parseInt(totalResult.rows[0]?.total || 0) === 0) {
      console.warn('⚠️ 전체 매장 데이터가 없습니다');
      return [];
    }

    // bbox 영역 내 매장 수 확인 (조건 완화)
    const bboxQuery = `
      SELECT COUNT(*) as count,
             MIN(ST_X(geom)) as min_lng, MAX(ST_X(geom)) as max_lng,
             MIN(ST_Y(geom)) as min_lat, MAX(ST_Y(geom)) as max_lat
      FROM store_addresses sa
      WHERE geom IS NOT NULL
        AND ST_X(geom) BETWEEN $1 AND $3 
        AND ST_Y(geom) BETWEEN $2 AND $4
    `;

    const bboxResult = await pool.query(bboxQuery, [xmin, ymin, xmax, ymax]);
    const bboxCount = parseInt(bboxResult.rows[0]?.count || 0);
    console.log(`📍 bbox 영역 내 매장 수: ${bboxCount}`);
    
    if (bboxResult.rows[0]) {
      console.log(`📍 DB 좌표 범위: lng(${bboxResult.rows[0].min_lng} ~ ${bboxResult.rows[0].max_lng}), lat(${bboxResult.rows[0].min_lat} ~ ${bboxResult.rows[0].max_lat})`);
    }

    const query = `
      WITH viewport AS (
        SELECT ST_MakeEnvelope($1, $2, $3, $4, 4326) AS box
      )
      SELECT
        'individual' AS kind,
        sa.store_id as id,
        sa.store_id as store_id,
        COALESCE(si.name, s.name, '매장명 없음') as name,
        COALESCE(si.category, '기타') as category,
        COALESCE(si.rating_average, 0)::numeric(3,1) as rating_average,
        COALESCE(si.review_count, 0) as review_count,
        COALESCE(s.is_open, true) as is_open,
        ST_Y(sa.geom) AS latitude,
        ST_X(sa.geom) AS longitude,
        CONCAT_WS(' ', COALESCE(sa.sido, ''), COALESCE(sa.sigungu, ''), COALESCE(sa.eupmyeondong, '')) as full_address,
        COALESCE(sa.sido, '') as sido,
        COALESCE(sa.sigungu, '') as sigungu,
        COALESCE(sa.eupmyeondong, '') as eupmyeondong,
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
      WHERE sa.geom IS NOT NULL
        AND sa.geom && v.box
        AND ST_Intersects(sa.geom, v.box)
      ORDER BY COALESCE(s.is_open, true) DESC, COALESCE(si.rating_average, 0) DESC
      LIMIT 2000
    `;

    console.log(`🔍 실행할 SQL 쿼리 시작`);
    const result = await pool.query(query, [xmin, ymin, xmax, ymax]);
    console.log(`📊 쿼리 결과: ${result.rows.length}개 매장 조회됨`);

    // 결과가 없는 경우 디버깅 정보 추가
    if (result.rows.length === 0) {
      console.log('❌ 주 쿼리 결과 없음 - 디버깅 시작');

      // 1. 간단한 카운트 쿼리로 데이터 존재 확인
      const debugCountQuery = `
        SELECT 
          COUNT(*) as total_stores,
          COUNT(CASE WHEN geom IS NOT NULL THEN 1 END) as stores_with_geom,
          COUNT(CASE WHEN ST_X(geom) BETWEEN $1 AND $3 AND ST_Y(geom) BETWEEN $2 AND $4 THEN 1 END) as stores_in_bbox
        FROM store_addresses sa
        JOIN stores s ON s.id = sa.store_id
      `;
      
      const debugResult = await pool.query(debugCountQuery, [xmin, ymin, xmax, ymax]);
      console.log('🔍 디버깅 결과:', debugResult.rows[0]);

      // 2. 가장 가까운 매장 찾기 (fallback)
      try {
        const centerLng = (xmin + xmax) / 2;
        const centerLat = (ymin + ymax) / 2;
        
        const nearestQuery = `
          SELECT sa.store_id, ST_X(sa.geom) as longitude, ST_Y(sa.geom) as latitude, 
                 COALESCE(s.name, '매장명 없음') as name,
                 ST_Distance(sa.geom, ST_Point($1, $2)::geography) as distance_meters
          FROM store_addresses sa
          JOIN stores s ON s.id = sa.store_id
          WHERE sa.geom IS NOT NULL
          ORDER BY sa.geom <-> ST_Point($1, $2)
          LIMIT 3
        `;

        const nearestResult = await pool.query(nearestQuery, [centerLng, centerLat]);
        console.log(`📍 가장 가까운 매장들 (거리순):`, nearestResult.rows.map(r => ({
          name: r.name,
          distance_km: (r.distance_meters / 1000).toFixed(2)
        })));
      } catch (nearestError) {
        console.warn('⚠️ 가장 가까운 매장 조회 실패:', nearestError.message);
      }
    }

  // 데이터 변환 시 예외 처리
    const data = result.rows.map(row => {
      try {
        if (row.kind === 'cluster') {
          return {
            kind: 'cluster',
            lat: parseFloat(row.latitude) || 0,
            lng: parseFloat(row.longitude) || 0,
            count: parseInt(row.count) || 0,
            bounds: row.bounds
          };
        } else {
          // 필수 필드 검증
          const storeId = parseInt(row.store_id);
          const latitude = parseFloat(row.latitude);
          const longitude = parseFloat(row.longitude);
          
          if (!storeId || isNaN(latitude) || isNaN(longitude)) {
            console.warn('⚠️ 유효하지 않은 매장 데이터 건너뜀:', {
              store_id: row.store_id,
              latitude: row.latitude,
              longitude: row.longitude
            });
            return null;
          }

          // 통합된 storeData 객체 형식으로 반환
          const address = `${row.sido || ''} ${row.sigungu || ''} ${row.eupmyeondong || ''}`.trim();
          
          return {
            kind: 'individual',
            id: storeId,
            store_id: storeId,
            name: row.name || '매장명 없음',
            category: row.category || '기타',
            address: address || '주소 정보 없음',
            ratingAverage: parseFloat(row.rating_average) || 0.0,
            reviewCount: parseInt(row.review_count) || 0,
            favoriteCount: 0,
            isOpen: row.is_open !== false,
            coord: { 
              lat: latitude, 
              lng: longitude 
            },
            region: {
              sido: row.sido || '',
              sigungu: row.sigungu || '',
              eupmyeondong: row.eupmyeondong || ''
            },
            // 하위 호환성을 위한 추가 필드들
            lat: latitude,
            lng: longitude,
            full_address: address,
            is_open: row.is_open !== false,
            rating_average: parseFloat(row.rating_average) || 0.0,
            review_count: parseInt(row.review_count) || 0,
            category_icon: row.category_icon || '🍽️'
          };
        }
      } catch (transformError) {
        console.error('❌ 매장 데이터 변환 실패:', transformError, row);
        return null;
      }
    }).filter(item => item !== null); // null 값 제거

    console.log(`✅ 유효한 매장 데이터 ${data.length}개 변환 완료`);
    return data;

  } catch (error) {
    console.error('❌ 매장 조회 중 오류:', error);
    
    // DB 연결 문제인지 확인
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.error('❌ 데이터베이스 연결 실패');
      throw new Error('데이터베이스 연결에 실패했습니다');
    }
    
    // SQL 오류인지 확인
    if (error.code && error.code.startsWith('4')) {
      console.error('❌ SQL 쿼리 오류:', error.message);
      throw new Error('데이터 조회 중 오류가 발생했습니다');
    }
    
    // 기타 오류
    throw error;
  }
}

module.exports = router;