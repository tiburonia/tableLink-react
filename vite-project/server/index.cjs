require('dotenv').config({ path: '../.env' });
const { app } = require('./app');

const PORT = process.env.PORT || 5000;

// 서버 시작
app.listen(PORT, '0.0.0.0', () => {
  console.log('\n=== 🚀 TableLink API 서버 시작 ===');
  console.log(`📍 포트: ${PORT}`);
  console.log(`🌐 로컬: http://localhost:${PORT}`);
  console.log(`📊 헬스 체크: http://localhost:${PORT}/api/health`);
  console.log(`🗄️  DB 초기화: POST http://localhost:${PORT}/api/db/init`);
  console.log(`🔗 DB 연결 테스트: GET http://localhost:${PORT}/api/db/test-connection`);
  console.log(`📚 매장 조회: GET http://localhost:${PORT}/api/db/stores`);
  console.log(`👥 사용자 조회: GET http://localhost:${PORT}/api/db/users`);
  console.log('✅ 준비 완료!\n');
});
