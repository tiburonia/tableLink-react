const express = require('express');
const router = express.Router();
const pool = require('../shared/config/database');
const tilebelt = require('@mapbox/tilebelt');
const compression = require('compression');

// Supercluster 모듈 임포트 (다양한 방식으로 시도)
let Supercluster;
try {
  // CommonJS 방식으로 시도
  Supercluster = require('supercluster');

  // 만약 default export라면
  if (Supercluster.default && typeof Supercluster.default === 'function') {
    Supercluster = Supercluster.default;
  }

  console.log('✅ Supercluster 모듈 로드 성공:', typeof Supercluster);
} catch (error) {
  console.error('❌ Supercluster 모듈 로드 실패:', error);
}

// 타일 데이터 조회 API
router.get('/:z/:x/:y', async (req, res) => {
  try {
    const { z, x, y } = req.params;
    const zoom = parseInt(z);
    const tileX = parseInt(x);
    const tileY = parseInt(y);

    // 타일 좌표 유효성 검사
    if (isNaN(zoom) || isNaN(tileX) || isNaN(tileY)) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 타일 좌표입니다'
      });
    }

    // 줌 레벨 제한 (0~18)
    if (zoom < 0 || zoom > 18) {
      return res.status(400).json({
        success: false,
        error: '지원하지 않는 줌 레벨입니다 (0-18)'
      });
    }

    console.log(`🗺️ 타일 요청: z=${zoom}, x=${tileX}, y=${tileY}`);

    // 타일의 bbox 계산
    const bbox = tilebelt.tileToBBOX([tileX, tileY, zoom]);
    const [west, south, east, north] = bbox;

    console.log(`📍 타일 bbox: [${west}, ${south}, ${east}, ${north}]`);

    // PostgreSQL에서 해당 bbox 내의 매장 데이터 조회 (store_address 테이블만 사용)
    const result = await pool.query(`
      SELECT 
        s.id, 
        s.name, 
        s.category, 
        s.is_open, 
        s.rating_average, 
        s.review_count,
        sa.latitude,
        sa.longitude,
        COALESCE(sa.sido, '') as sido,
        COALESCE(sa.sigungu, '') as sigungu,
        COALESCE(sa.eupmyeondong, '') as eupmyeondong
      FROM stores s
      INNER JOIN store_address sa ON s.id = sa.store_id
      WHERE sa.latitude IS NOT NULL 
        AND sa.longitude IS NOT NULL
        AND sa.longitude >= $1 
        AND sa.longitude <= $3
        AND sa.latitude >= $2 
        AND sa.latitude <= $4
      LIMIT 1000
    `, [west, south, east, north]);

    const stores = result.rows;
    console.log(`📊 타일 내 매장 수: ${stores.length}개`);

    // 빈 타일인 경우 빈 응답 반환
    if (stores.length === 0) {
      return res.json({
        success: true,
        tile: { z: zoom, x: tileX, y: tileY },
        bbox: bbox,
        data: { type: 'FeatureCollection', features: [] },
        meta: {
          totalFeatures: 0,
          clusters: 0,
          stores: 0
        }
      });
    }

    // GeoJSON Point 형태로 변환
    const points = stores.map(store => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [parseFloat(store.longitude), parseFloat(store.latitude)]
      },
      properties: {
        id: store.id,
        name: store.name,
        category: store.category,
        isOpen: store.is_open !== false,
        ratingAverage: store.rating_average ? parseFloat(store.rating_average) : 0.0,
        reviewCount: store.review_count || 0,
        sido: store.sido,
        sigungu: store.sigungu,
        eupmyeondong: store.eupmyeondong
      }
    }));

    // Supercluster 모듈 확인 및 생성
    let supercluster;

    if (!Supercluster || typeof Supercluster !== 'function') {
      console.error('❌ Supercluster 모듈이 올바르게 로드되지 않음:', typeof Supercluster);

      // Supercluster 없이 개별 포인트만 반환
      const featureCollection = {
        type: 'FeatureCollection',
        features: points
      };

      return res.json({
        success: true,
        tile: { z: zoom, x: tileX, y: tileY },
        bbox: bbox,
        data: featureCollection,
        meta: {
          totalFeatures: featureCollection.features.length,
          clusters: 0,
          stores: featureCollection.features.length
        }
      });
    }

    // Supercluster 인스턴스 생성
    try {
      console.log('🔧 Supercluster 인스턴스 생성 시도...');

      supercluster = new Supercluster({
        radius: 60,     // 클러스터링 반경 (픽셀)
        maxZoom: 16,    // 최대 클러스터링 줌 레벨
        minZoom: 0,     // 최소 클러스터링 줌 레벨
        minPoints: 2,   // 클러스터 생성을 위한 최소 포인트 수
        generateId: true
      });

      console.log('✅ Supercluster 인스턴스 생성 성공');

    } catch (error) {
      console.error('❌ Supercluster 초기화 실패:', error);
      console.error('Supercluster type:', typeof Supercluster);
      console.error('Supercluster value:', Supercluster);

      return res.status(500).json({
        success: false,
        error: 'Supercluster 초기화 실패: ' + error.message
      });
    }

    // 포인트 데이터 로드
    supercluster.load(points);

    // 클러스터링을 위한 적절한 줌 레벨 계산 (타일 줌을 Supercluster 줌으로 변환)
    const clusterZoom = Math.min(Math.max(zoom - 2, 0), 16);

    // 해당 타일의 bbox로 클러스터 데이터 가져오기 (getClusters 사용)
    let features;
    try {
      // getClusters 메서드로 올바른 GeoJSON Feature 형식 데이터 획득
      features = supercluster.getClusters(bbox, clusterZoom);
      console.log(`🔧 Supercluster 클러스터 응답 (줌 ${clusterZoom}): ${features.length}개 피처`);
      
      // 타일 범위 밖의 피처들 필터링
      features = features.filter(feature => {
        if (!feature.geometry || !feature.geometry.coordinates) return false;
        const [lng, lat] = feature.geometry.coordinates;
        return lng >= west && lng <= east && lat >= south && lat <= north;
      });
      
      console.log(`📍 타일 범위 내 피처: ${features.length}개`);
      
    } catch (clusterError) {
      console.warn(`⚠️ 타일 ${zoom}/${tileX}/${tileY} 클러스터링 실패:`, clusterError);
      features = points; // 실패 시 원본 포인트 반환
    }

    const featureCollection = {
      type: 'FeatureCollection',
      features: features
    };

    console.log(`✅ 타일 응답: ${featureCollection.features.length}개 피처`);

    // 클러스터와 개별 매장 구분을 위한 로그 (안전한 속성 확인)
    const clusterCount = featureCollection.features.filter(f => 
      f && f.properties && f.properties.cluster === true
    ).length;
    const storeCount = featureCollection.features.filter(f => 
      f && f.properties && !f.properties.cluster
    ).length;
    console.log(`   📦 클러스터: ${clusterCount}개, 개별 매장: ${storeCount}개`);

    res.json({
      success: true,
      tile: { z: zoom, x: tileX, y: tileY },
      bbox: bbox,
      data: featureCollection,
      meta: {
        totalFeatures: featureCollection.features.length,
        clusters: clusterCount,
        stores: storeCount
      }
    });

  } catch (error) {
    console.error('❌ 타일 데이터 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '타일 데이터 조회 실패: ' + error.message
    });
  }
});

// 행정구역 캐싱 API (Kakao 좌표→주소 변환)
router.post('/cache-admin-region', async (req, res) => {
  try {
    const { storeId, latitude, longitude } = req.body;

    if (!storeId || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: 'storeId, latitude, longitude가 필요합니다'
      });
    }

    console.log(`🏛️ 행정구역 캐싱: 매장 ${storeId} (${latitude}, ${longitude})`);

    // Kakao 좌표→주소 API 호출
    const kakaoResponse = await fetch(
      `https://dapi.kakao.com/v2/local/geo/coord2regioncode.json?x=${longitude}&y=${latitude}&input_coord=WGS84`,
      {
        headers: {
          'Authorization': `KakaoAK ${process.env.KAKAO_API_KEY}`
        }
      }
    );

    if (!kakaoResponse.ok) {
      throw new Error(`Kakao API 호출 실패: ${kakaoResponse.status}`);
    }

    const kakaoData = await kakaoResponse.json();
    const regions = kakaoData.documents || [];

    if (regions.length === 0) {
      console.warn(`⚠️ 행정구역 정보 없음: 매장 ${storeId}`);
      return res.json({
        success: false,
        error: '해당 좌표의 행정구역 정보를 찾을 수 없습니다'
      });
    }

    // 행정동 정보 추출 (H 타입)
    const adminRegion = regions.find(r => r.region_type === 'H');
    if (!adminRegion) {
      console.warn(`⚠️ 행정동 정보 없음: 매장 ${storeId}`);
      return res.json({
        success: false,
        error: '행정동 정보를 찾을 수 없습니다'
      });
    }

    // store_address 테이블 업데이트
    await pool.query(`
      UPDATE store_address 
      SET 
        sido = $1,
        sigungu = $2,
        eupmyeondong = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE store_id = $4
    `, [
      adminRegion.region_1depth_name,  // 시도
      adminRegion.region_2depth_name,  // 시군구
      adminRegion.region_3depth_name,  // 읍면동
      storeId
    ]);

    console.log(`✅ 행정구역 캐싱 완료: ${adminRegion.region_1depth_name} ${adminRegion.region_2depth_name} ${adminRegion.region_3depth_name}`);

    res.json({
      success: true,
      storeId: storeId,
      adminRegion: {
        sido: adminRegion.region_1depth_name,
        sigungu: adminRegion.region_2depth_name,
        eupmyeondong: adminRegion.region_3depth_name
      }
    });

  } catch (error) {
    console.error('❌ 행정구역 캐싱 실패:', error);
    res.status(500).json({
      success: false,
      error: '행정구역 캐싱 실패: ' + error.message
    });
  }
});

module.exports = router;