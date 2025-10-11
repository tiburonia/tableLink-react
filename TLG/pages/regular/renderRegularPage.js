/**
 * 단골매장 페이지 진입점
 */

async function renderRegularPage() {
  try {
    console.log('❤️ 단골매장 페이지 진입');

    // renderFeed 함수 먼저 전역 등록 (HTML에서 사용하므로)
    if (!window.renderFeed) {
      const feedModule = await import('/TLG/pages/feed/renderFeed.js');
      // renderFeed는 이미 모듈에서 window에 등록되지만, 확실하게 하기 위해 체크
      console.log('✅ renderFeed 함수 사전 로드 완료');
    }

    // Controller 동적 로드
    const { regularPageController } = await import('/TLG/pages/regular/controllers/regularPageController.js');

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

// Content Carousel 탭 전환 함수 (양방향)
async function switchRegularTab(tab) {
  console.log('🔄 Content Carousel 탭 전환:', tab);

  const regularContainer = document.querySelector('.regular-page-container');
  if (!regularContainer) return;

  // 현재 활성 탭 확인
  const currentActiveBtn = document.querySelector('.tab-nav-btn.active');
  const currentTab = currentActiveBtn ? currentActiveBtn.dataset.tab : 'regular';

  // 같은 탭 클릭 시 무시
  if (currentTab === tab) return;

  // 탭 버튼 활성화 상태 변경
  document.querySelectorAll('.tab-nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });

  // 슬라이드 방향 결정 (regular -> favorite: 왼쪽으로, favorite -> regular: 오른쪽으로)
  const isMovingRight = (currentTab === 'regular' && tab === 'favorite');

  if (tab === 'favorite') {
    // 즐겨찾기 페이지로 전환
    const userInfo = window.getUserInfoSafely ? window.getUserInfoSafely() : window.userInfo;
    if (!userInfo) return;

    const { regularPageService } = await import('/TLG/pages/regular/services/regularPageService.js');
    const result = await regularPageService.getRegularStoresData(userInfo.userId);

    const { regularPageView } = await import('/TLG/pages/regular/views/regularPageView.js');

    // Carousel 애니메이션 적용
    regularContainer.style.transform = isMovingRight ? 'translateX(-100%)' : 'translateX(100%)';
    regularContainer.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';

    setTimeout(() => {
      regularContainer.innerHTML = regularPageView.renderFavoriteListPage(result.favoriteStores);
      regularContainer.style.transform = 'translateX(0)';

      setTimeout(() => {
        regularContainer.style.transition = '';
      }, 300);
    }, 300);
  } else {
    // 단골 매장 페이지로 전환
    regularContainer.style.transform = isMovingRight ? 'translateX(-100%)' : 'translateX(100%)';
    regularContainer.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';

    setTimeout(async () => {
      await renderRegularPage();
      regularContainer.style.transform = 'translateX(0)';

      setTimeout(() => {
        regularContainer.style.transition = '';
      }, 300);
    }, 300);
  }
}

// 즐겨찾기 제거 함수
function removeFavorite(storeId) {
  console.log('💔 즐겨찾기 제거:', storeId);
  if (confirm('즐겨찾기에서 삭제하시겠습니까?')) {
    // TODO: API 호출하여 즐겨찾기 제거
    alert('즐겨찾기에서 삭제되었습니다!');
    switchRegularTab('favorite'); // 페이지 새로고침
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

// 피드 인터랙션 함수들
function toggleLike(postId) {
  console.log('❤️ 좋아요 토글:', postId);
  alert('좋아요 기능은 곧 구현됩니다!');
}

function viewComments(postId) {
  console.log('💬 댓글 보기:', postId);
  alert('댓글 기능은 곧 구현됩니다!');
}

function sharePost(postId) {
  console.log('🔁 공유하기:', postId);
  alert('공유 기능은 곧 구현됩니다!');
}

function receiveCoupon(postId, storeId) {
  console.log('🎟️ 쿠폰 받기:', postId, storeId);
  alert('쿠폰이 발급되었습니다!');
  // UI 업데이트 (실제로는 재렌더링 필요)
  const btn = event.target;
  btn.innerHTML = '✅ 쿠폰받음';
  btn.classList.add('received');
  btn.disabled = true;
}

// 탭 전환 이벤트 핸들러 (단골/즐겨찾기)
document.addEventListener('click', (e) => {
  const tabBtn = e.target.closest('.toggle-btn, .view-all-btn[data-tab]');
  if (!tabBtn) return;

  const tab = tabBtn.dataset.tab;
  if (!tab) return;

  // 토글 버튼 활성화
  document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
  const targetToggle = document.querySelector(`.toggle-btn[data-tab="${tab}"]`);
  if (targetToggle) targetToggle.classList.add('active');

  // Pane 전환 (페이드 효과)
  const regularPane = document.querySelector('.regular-pane');
  const favoritePane = document.querySelector('.favorite-pane');

  if (regularPane && favoritePane) {
    if (tab === 'regular') {
      favoritePane.style.opacity = '0';
      setTimeout(() => {
        favoritePane.style.display = 'none';
        regularPane.style.display = 'block';
        setTimeout(() => { regularPane.style.opacity = '1'; }, 10);
      }, 250);
    } else {
      regularPane.style.opacity = '0';
      setTimeout(() => {
        regularPane.style.display = 'none';
        favoritePane.style.display = 'block';
        setTimeout(() => { favoritePane.style.opacity = '1'; }, 10);
      }, 250);
    }
  }
});

// 전역으로 노출
window.toggleLike = toggleLike;
window.viewComments = viewComments;
window.sharePost = sharePost;
window.receiveCoupon = receiveCoupon;
window.switchRegularTab = switchRegularTab;
window.removeFavorite = removeFavorite;

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