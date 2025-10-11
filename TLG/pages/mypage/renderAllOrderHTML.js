
/**
 * Order History Entry Point
 * 레이어드 아키텍처 기반 주문 내역
 */

async function renderAllOrderHTML(userInfo) {
  try {
    console.log('📦 renderAllOrderHTML 호출 (레이어드 아키텍처)');

    // 동적 import로 컨트롤러 로드
    const { orderController } = await import('./controllers/orderController.js');
    
    await orderController.renderAllOrders(userInfo);

  } catch (error) {
    console.error('❌ renderAllOrderHTML 실행 실패:', error);

    const main = document.getElementById('main');
    if (main) {
      main.innerHTML = `
        <div style="padding: 20px; text-align: center; color: #666;">
          <h2>🚫 주문 내역을 불러올 수 없습니다</h2>
          <p style="color: #999; margin: 10px 0;">${error.message}</p>
          <button onclick="renderMyPage()" style="
            padding: 10px 20px;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
          ">마이페이지로 돌아가기</button>
        </div>
      `;
    }
  }
}

// 전역 함수 등록
window.renderAllOrderHTML = renderAllOrderHTML;
console.log('✅ renderAllOrderHTML 전역 등록 완료 (레이어드 아키텍처)');
