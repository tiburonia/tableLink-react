const express = require('express');
const router = express.Router();
const axios = require('axios');

// 네이버 Static Map API 프록시
router.get('/static', async (req, res) => {
  try {
    const { 
      w = 570, 
      h = 200, 
      lat, 
      lng, 
      level = 16, 
      markers = 'type:d|size:mid|color:red',
      maptype = 'basic',
      format = 'png',
      scale = 2,
      lang = 'ko',
      crs = 'EPSG:4326'
    } = req.query;

    // 필수 파라미터 검증
    if (!lat || !lng) {
      return res.status(400).json({
        error: 'Bad request',
        code: 100,
        message: 'lat and lng are required'
      });
    }

    // 환경 변수에서 네이버 API 키 가져오기
    const clientId = process.env.NAVER_MAP_CLIENT_ID || '60k4tio1ue';
    const clientSecret = process.env.NAVER_MAP_CLIENT_SECRET || '43oLyBHwOHli6DgIaZZ8HWrNZwZwz6Ewq3uhuVJd';

    if (!clientSecret) {
      console.warn('⚠️ NAVER_MAP_CLIENT_SECRET이 설정되지 않았습니다.');
    }

    console.log('🗺️ 네이버 Static Map API 요청:', { lat, lng, w, h, level, format, scale });

    // 네이버 Static Map API URL 구성 (명세서에 따라)
    const mapUrl = 
      `https://maps.apigw.ntruss.com/map-static/v2/raster` +
      `?crs=${crs}&w=${w}&h=${h}&center=${lng},${lat}&level=${level}` +
      `&markers=${markers}|pos:${lng}%20${lat}` +
      `&scale=${scale}&maptype=${maptype}&format=${format}&lang=${lang}`;

    // 네이버 API 호출 (대문자 헤더 사용)
    const response = await axios.get(mapUrl, {
      headers: {
        'X-NCP-APIGW-API-KEY-ID': clientId,
        'X-NCP-APIGW-API-KEY': clientSecret,
      },
      responseType: 'arraybuffer',
      timeout: 5000 // 5초 타임아웃
    });

    console.log('✅ 네이버 Static Map API 응답 성공');

    // format에 따라 Content-Type 설정
    const contentTypeMap = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'png8': 'image/png'
    };
    const contentType = contentTypeMap[format] || 'image/png';

    // 이미지를 클라이언트로 전달
    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=3600'); // 1시간 캐시
    res.send(response.data);

  } catch (error) {
    console.error('❌ 네이버 Static Map API 오류:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
      
      // 네이버 API 에러 응답 처리
      if (error.response.data) {
        try {
          const errorData = JSON.parse(error.response.data.toString());
          console.error('Response data:', errorData);
          
          return res.status(error.response.status).json({
            error: errorData.message || 'Naver API Error',
            code: errorData.code || error.response.status,
            message: errorData.message || error.message
          });
        } catch (parseError) {
          console.error('Response data (raw):', error.response.data.toString());
        }
      }
    }

    // 일반 에러 응답
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch map image',
      code: error.response?.status || 500,
      message: error.message,
      details: error.code === 'ECONNABORTED' ? 'Request timeout' : null
    });
  }
});

module.exports = router;
