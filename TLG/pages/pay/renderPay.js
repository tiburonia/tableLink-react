/**
 * 결제 페이지 렌더링 모듈 (레이어드 아키텍처 버전)
 * 새로운 PaymentController를 사용하여 간소화
 */

import { PaymentController } from './controllers/paymentController.js';

let paymentControllerInstance = null;

/**
 * 결제 화면 렌더링 함수
 * @param {Object|Array} currentOrder - 현재 주문 데이터
 * @param {Object} store - 매장 정보
 * @param {number} tableNum - 테이블 번호
 */
async function renderPay(currentOrder) {
  console.log('🔄 renderPay 호출:', { currentOrder});

  try {
    // 입력 데이터 검증
    if (!currentOrder || (Array.isArray(currentOrder) && currentOrder.length === 0) || 
        (typeof currentOrder === 'object' && Object.keys(currentOrder).length === 0)) {
      throw new Error('주문 데이터가 없습니다.');
    }

    if (!currentOrder.store_id) {
      throw new Error('매장 정보가 올바르지 않습니다.');
    }

    // PaymentController 인스턴스 생성
    paymentControllerInstance = new PaymentController();

    // 결제 화면 초기화
    await paymentControllerInstance.initializePayment(currentOrder);

    console.log('✅ renderPay 완료');

  } catch (error) {
    console.error('❌ renderPay 오류:', error);
    
    const main = document.getElementById('main') || document.body;
    main.innerHTML = `
      <div style="
        position: fixed; 
        top: 50%; 
        left: 50%; 
        transform: translate(-50%, -50%);
        text-align: center;
        padding: 40px;
        background: white;
        border-radius: 16px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        max-width: 90%;
        width: 400px;
      ">
        <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
        <h2 style="color: #dc2626; margin-bottom: 16px;">결제 화면 로드 실패</h2>
        <p style="color: #64748b; margin-bottom: 24px;">${error.message}</p>
        <button 
          onclick="window.history.back()" 
          style="
            background: #f1f5f9;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            color: #475569;
          "
        >
          ← 뒤로가기
        </button>
      </div>
    `;
  }
}

// 전역 등록
window.renderPay = renderPay;

console.log('✅ renderPay 모듈 로드 완료 (레이어드 아키텍처)');
