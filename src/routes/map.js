const express = require('express');
const router = express.Router();
const axios = require('axios');

// 네이버 Static Map API 프록시
router.get('/static', async (req, res) => {
  try {
    const { w = 570, h = 200, lat, lng, level = 16, markers = 'type:d|size:mid|color:red' } = req.query;

    // 필수 파라미터 검증
    if (!lat || !lng) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'lat and lng are required'
      });
    }

    // 환경 변수에서 네이버 API 키 가져오기
    const clientId = process.env.NAVER_MAP_CLIENT_ID || '60k4tio1ue';
    const clientSecret = process.env.NAVER_MAP_CLIENT_SECRET || '43oLyBHwOHli6DgIaZZ8HWrNZwZwz6Ewq3uhuVJd';

    // 네이버 Static Map API URL 구성
    const mapUrl = 
      `https://naveropenapi.apigw.ntruss.com/map-static/v2/raster` +
      `?w=${w}&h=${h}&center=${lng},${lat}&level=${level}` +
      `&markers=${markers}|pos:${lng}%20${lat}` +
      `&scale=2&maptype=basic&lang=ko`;

    // 네이버 API 호출 (헤더에 인증 정보 포함)
    const response = await axios.get(mapUrl, {
      headers: {
        'X-NCP-APIGW-API-KEY-ID': clientId,
        'X-NCP-APIGW-API-KEY': clientSecret,
      },
      responseType: 'arraybuffer'
    });

    // 이미지를 클라이언트로 전달
    res.set('Content-Type', 'image/png');
    res.set('Cache-Control', 'public, max-age=3600'); // 1시간 캐시
    res.send(response.data);

  } catch (error) {
    console.error('❌ 네이버 Static Map API 오류:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data?.toString());
    }

    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch map image',
      message: error.message,
      details: error.response?.data?.toString() || null
    });
  }
});

module.exports = router;
