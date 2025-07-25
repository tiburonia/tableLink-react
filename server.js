const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 5000;

// CORS, JSON 파싱
app.use(cors());
app.use(express.json());

// 루트 디렉토리의 정적 파일 서빙 (css, js, 이미지 등)
app.use(express.static(__dirname));

// 루트(/) 접속 시 public/index.html 반환
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// (예시) API 엔드포인트
app.get('/api/stores', (req, res) => {
  res.json({
    message: 'TableLink API 서버가 정상 작동 중입니다.',
    stores: []
  });
});

// 서버 실행
app.listen(PORT, () => {
  console.log(`🚀 TableLink 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`📱 http://localhost:${PORT} 에서 접속 가능합니다.`);
});

