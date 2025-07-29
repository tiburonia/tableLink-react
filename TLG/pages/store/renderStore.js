// 모듈 import (전역으로 로드될 것들)
// renderStoreUI.js, storeTabManager.js, tablePanelManager.js, reviewManager.js가 먼저 로드되어야 함

function renderStore(store) {
  console.log('🏪 매장 렌더링:', store.name, 'ID:', store.id);

  // 초기 별점 값 설정
  let displayRating = '0.0';

  // localStorage에서 캐시된 별점 정보 확인
  const cachedRating = window.cacheManager.getStoreRating(store.id);
  if (cachedRating) {
    displayRating = parseFloat(cachedRating.ratingAverage).toFixed(1);
    console.log('⭐ 캐시된 별점 사용:', displayRating);
  } else {
    // 캐시에 없으면 비동기로 가져오기
    console.log('⚠️ 별점 정보 캐시 없음, 서버에서 가져오는 중...');
    updateStoreRatingAsync(store);
  }

  // UI 렌더링
  window.StoreUIManager.renderStoreHTML(store, displayRating);

  // 이벤트 리스너 설정
  setupEventListeners(store);

  // 초기 데이터 로드
  loadInitialData(store);

  // 전역에서 접근 가능하도록 store 정보 저장
  window.currentStore = store;
}

// 이벤트 리스너 설정
function setupEventListeners(store) {
  // 패널 핸들링
  window.StorePanelManager.initializePanelHandling();

  // 탭 네비게이션
  window.StoreTabManager.initializeTabNavigation(store);

  // 즐겨찾기 버튼
  const favoriteBtn = document.getElementById('favoriteBtn');
  if (favoriteBtn) {
    favoriteBtn.addEventListener('click', () => {
      toggleFavorite(store.name);
      updateFavoriteBtn(store.name);
    });
    updateFavoriteBtn(store.name);
  }

  // 리뷰 링크 이벤트 (null 체크 강화)
  const reviewLink = document.getElementById('reviewLink');
  if (reviewLink) {
    reviewLink.addEventListener('click', () => {
      renderAllReview(store);
    });
  }

  const reviewSeeMoreBtns = document.getElementsByClassName('see-more-btn');
  if (reviewSeeMoreBtns && reviewSeeMoreBtns.length > 0 && reviewSeeMoreBtns[0]) {
    reviewSeeMoreBtns[0].addEventListener('click', () => {
      renderAllReview(store);
    });
  }

  // TLR 영역 클릭 시 테이블 정보 새로고침
  const tlrContainer = document.getElementById('TLR');
  if (tlrContainer) {
    tlrContainer.addEventListener('click', () => {
      window.TableInfoManager.loadTableInfo(store);
    });
  }
}

// 초기 데이터 로드
function loadInitialData(store) {
  // 리뷰 미리보기 로드
  window.ReviewManager.renderTopReviews(store);

  // 테이블 정보 로드
  window.TableInfoManager.loadTableInfo(store);

  // 첫 화면(메뉴 탭) 설정
  window.StoreTabManager.renderStoreTab('menu', store);
  const menuBtn = document.querySelector('[data-tab="menu"]');
  if (menuBtn) menuBtn.classList.add('active');
}

// 비동기로 별점 정보 업데이트
async function updateStoreRatingAsync(store) {
  try {
    console.log(`🔄 매장 ${store.id} 별점 정보 비동기 업데이트 중...`);

    // 해당 매장의 별점 정보만 서버에서 가져오기
    const ratingData = await window.cacheManager.refreshStoreRating(store.id);

    if (ratingData && ratingData.ratingAverage !== null && ratingData.ratingAverage !== undefined) {
      console.log(`✅ 매장 ${store.id} 별점 정보 업데이트 완료:`, ratingData.ratingAverage);

      // DOM에서 별점 표시 업데이트 (null 체크 강화)
      const reviewScoreElement = document.getElementById('reviewScore');
      if (reviewScoreElement) {
        const updatedRating = parseFloat(ratingData.ratingAverage).toFixed(1);
        reviewScoreElement.innerHTML = `${updatedRating}&nbsp<span id="reviewLink">></span>`;
        console.log('🎯 별점 UI 업데이트 완료:', updatedRating);
        
        // 새로 생성된 reviewLink에 이벤트 리스너 추가
        const newReviewLink = document.getElementById('reviewLink');
        if (newReviewLink) {
          newReviewLink.addEventListener('click', () => {
            renderAllReview(store);
          });
        }
      } else {
        console.warn('⚠️ reviewScore 요소를 찾을 수 없어서 별점 업데이트를 건너뜁니다');
      }

      // 전역 store 객체도 업데이트
      if (window.currentStore && window.currentStore.id === store.id) {
        window.currentStore.ratingAverage = ratingData.ratingAverage;
        window.currentStore.reviewCount = ratingData.reviewCount;
      }
    }
  } catch (error) {
    console.error(`❌ 매장 ${store.id} 별점 정보 비동기 업데이트 실패:`, error);
  }
}

// 테이블 배치도 렌더링 함수
async function renderTableLayout(store) {
  await window.TableInfoManager.renderTableLayout(store);
}

// 매장 정보 로드 및 렌더링
  async function loadAndRenderStore(storeId) {
    try {
      console.log(`🏪 매장 ${storeId} 정보 로드 시작`);
      const response = await fetch(`/api/stores/${storeId}`);
      const data = await response.json();

      if (data.success) {
        window.currentStore = data.store;
        console.log(`📊 매장 ${data.store.name} 운영 상태: ${data.store.isOpen}`);

        StoreUI.renderStoreHTML(data.store);

        // 테이블 정보 로드 (실시간 상태 동기화 포함)
        if (typeof TableInfoManager !== 'undefined') {
          TableInfoManager.loadTableInfo(data.store);
        }

        // 주기적으로 매장 상태 확인 (30초마다)
        setInterval(() => {
          if (window.currentStore && window.currentStore.id === storeId) {
            TableInfoManager.loadTableInfo(window.currentStore);
          }
        }, 30000);

        console.log(`✅ 매장 ${data.store.name} 렌더링 완료`);
      } else {
        throw new Error(data.error || '매장 정보를 불러올 수 없습니다');
      }
    } catch (error) {
      console.error('매장 정보 로드 실패:', error);
      alert('매장 정보를 불러올 수 없습니다.');
    }
  }

// 전역 함수 등록
window.renderStore = renderStore;
window.renderTableLayout = renderTableLayout;