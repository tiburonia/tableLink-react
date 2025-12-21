
function initializeServices() {
  // 이벤트 기반 서비스 초기화
  try {
    const kdsService = require('./kdsService');
    const paymentService = require('./paymentService');
    console.log('✅ 이벤트 기반 서비스 초기화 완료 (KDS, Payment)');
  } catch (error) {
    console.error('❌ 이벤트 기반 서비스 초기화 실패:', error);
  }
}

module.exports = initializeServices;
