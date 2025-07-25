
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 5000;

// 미들웨어 설정
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // 정적 파일 제공

// API 라우트 예시
app.get('/api/stores', (req, res) => {
  res.json({
    message: 'TableLink API 서버가 정상 작동 중입니다.',
    stores: []
  });
});

// 메인 페이지
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 TableLink 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`📱 http://localhost:${PORT} 에서 접속 가능합니다.`);
});
