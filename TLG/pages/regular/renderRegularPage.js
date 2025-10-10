
/**
 * 단골매장 페이지 진입점
 */

async function renderRegularPage() {
  try {
    console.log('🏪 단골매장 페이지 진입');

    // Controller 동적 로드
    const { regularPageController } = await import('./controllers/regularPageController.js');

    // 페이지 초기화
    await regularPageController.init();

  } catch (error) {
    console.error('❌ 단골매장 페이지 렌더링 실패:', error);
    
    const main = document.getElementById('main');
    if (main) {
      main.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; padding: 20px; text-align: center;">
          <h2 style="color: #1f2937;">페이지를 불러올 수 없습니다</h2>
          <p style="color: #9ca3af; margin: 16px 0;">${error.message}</p>
          <button onclick="renderSubMain()" style="padding: 12px 24px; background: #FF8A00; color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer;">
            홈으로 돌아가기
          </button>
        </div>
      `;
    }
  }
}

// 전역 헬퍼 함수들
function goToStore(storeId) {
  console.log('🏪 매장으로 이동:', storeId);
  if (typeof renderStore === 'function') {
    fetch(`/api/stores/${storeId}`)
      .then(response => response.json())
      .then(data => {
        if (data.success && data.store) {
          renderStore(data.store);
        }
      })
      .catch(error => console.error('매장 정보 가져오기 실패:', error));
  }
}

function orderFromStore(storeId) {
  console.log('📱 주문하기:', storeId);
  alert('주문 기능은 곧 구현됩니다!');
}

function writeReview(storeId) {
  console.log('✍️ 리뷰 작성:', storeId);
  alert('리뷰 작성 기능은 곧 구현됩니다!');
}

function viewCoupons(storeId) {
  console.log('🎟️ 쿠폰 보기:', storeId);
  alert('쿠폰 보기 기능은 곧 구현됩니다!');
}

function viewPointHistory() {
  console.log('💳 포인트 내역 보기');
  if (typeof renderAllPoints === 'function') {
    const userInfo = window.cacheManager?.getUserInfo();
    if (userInfo) {
      renderAllPoints(userInfo);
    }
  }
}

function viewAllCoupons() {
  console.log('🎟️ 모든 쿠폰 보기');
  if (typeof renderAllCoupons === 'function') {
    const userInfo = window.cacheManager?.getUserInfo();
    if (userInfo) {
      renderAllCoupons(userInfo);
    }
  }
}

function viewUnwrittenReviews() {
  console.log('✍️ 미작성 리뷰 보기');
  alert('미작성 리뷰 기능은 곧 구현됩니다!');
}

function viewAllRegularStores() {
  console.log('🏪 모든 단골 보기');
  alert('전체 단골 매장 보기는 곧 구현됩니다!');
}

function goToCoupons() {
  console.log('🎟️ 쿠폰함으로 이동');
  viewAllCoupons();
}

// 전역으로 노출
window.renderRegularPage = renderRegularPage;
window.goToStore = goToStore;
window.orderFromStore = orderFromStore;
window.writeReview = writeReview;
window.viewCoupons = viewCoupons;
window.viewPointHistory = viewPointHistory;
window.viewAllCoupons = viewAllCoupons;
window.viewUnwrittenReviews = viewUnwrittenReviews;
window.viewAllRegularStores = viewAllRegularStores;
window.goToCoupons = goToCoupons;

console.log('✅ renderRegularPage 함수 전역 등록 완료');
