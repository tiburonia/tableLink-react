
/**
 * 매장 스토리 피드 렌더링 진입점
 */

async function renderStoreFeed(storeId) {
  console.log(`📱 renderStoreFeed 실행 - storeId: ${storeId}`);

  try {
    // Controller 동적 로드
    const { storeFeedController } = await import('./controllers/storeFeedController.js');

    // 피드 초기화 및 렌더링
    await storeFeedController.initialize(storeId);

  } catch (error) {
    console.error('❌ renderStoreFeed 실행 실패:', error);

    const main = document.getElementById('main');
    if (main) {
      main.innerHTML = `
        <div style="padding: 40px 20px; text-align: center;">
          <h2 style="color: #ef4444; margin-bottom: 12px;">🚫 피드를 불러올 수 없습니다</h2>
          <p style="color: #6b7280; margin-bottom: 20px;">${error.message}</p>
          <button onclick="renderStore({id: ${storeId}})" 
                  style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer;">
            매장으로 돌아가기  
          </button>
        </div>
      `;
    }
  }
}

// 전역 등록
window.renderStoreFeed = renderStoreFeed;

console.log('✅ renderStoreFeed 전역 함수 등록 완료');
