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

  // UI 렌더링 (리뷰 수 포함)
  const reviewCount = store.reviewCount || 0;
  window.StoreUIManager.renderStoreHTML(store, displayRating, reviewCount);

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

  // 테이블 정보 로드 (항상 최신 정보로 갱신)
  if (window.TableInfoManager) {
    console.log('🔄 테이블 정보 새로고침 시작...');
    setTimeout(() => {
      window.TableInfoManager.loadTableInfo(store);
      // 30초마다 자동 갱신 시작
      window.TableInfoManager.startAutoRefresh(store, 30000);
    }, 500); // 페이지 렌더링 후 테이블 정보 로드
  }

  // 프로모션 및 단골 레벨 정보 로드
  loadPromotionData(store);
  loadLoyaltyData(store);

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
        const reviewCount = ratingData.reviewCount || 0;
        reviewScoreElement.innerHTML = `${updatedRating}&nbsp<span id="reviewLink" class="review-link">리뷰 보기 (${reviewCount})</span>`;
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

    // 캐시 매니저 초기화 확인
    if (!window.cacheManager) {
      console.warn('⚠️ 캐시 매니저가 초기화되지 않음');
      return;
    }

    const response = await fetch(`/api/stores/${storeId}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.success && data.store) {
      window.currentStore = data.store;
      console.log(`📊 매장 ${data.store.name} 운영 상태: ${data.store.isOpen}`);

      // UI 렌더링 (null 체크 포함)
      if (window.StoreUIManager && typeof window.StoreUIManager.renderStoreHTML === 'function') {
        window.StoreUIManager.renderStoreHTML(data.store);
      } else {
        console.error('❌ StoreUIManager를 찾을 수 없습니다');
        return;
      }

      // 이벤트 리스너 설정
      setupEventListeners(data.store);

      // 초기 데이터 로드
      loadInitialData(data.store);

      console.log(`✅ 매장 ${data.store.name} 렌더링 완료`);
    } else {
      throw new Error(data.error || '매장 정보를 불러올 수 없습니다');
    }
  } catch (error) {
    console.error('❌ 매장 정보 로드 실패:', error);

    // DOM 요소가 있을 때만 오류 메시지 표시
    const mainElement = document.getElementById('main');
    if (mainElement) {
      mainElement.innerHTML = `
        <div style="padding: 20px; text-align: center;">
          <h2>🚫 매장 정보를 불러올 수 없습니다</h2>
          <p>오류: ${error.message}</p>
          <button onclick="location.reload()">다시 시도</button>
        </div>
      `;
    }
  }
}

// 프로모션 데이터 로드
function loadPromotionData(store) {
  // 실제로는 API에서 가져올 데이터, 현재는 목업 데이터 사용
  console.log(`🎉 매장 ${store.id} 프로모션 정보 로드`);
  
  // 프로모션 더보기 버튼 이벤트 추가
  setTimeout(() => {
    const promotionMoreBtn = document.querySelector('.promotion-more-btn');
    if (promotionMoreBtn) {
      promotionMoreBtn.addEventListener('click', () => {
        showAllPromotions(store);
      });
    }
  }, 100);
}

// 단골 레벨 데이터 로드
async function loadLoyaltyData(store) {
  try {
    console.log(`⭐ 매장 ${store.id} 단골 레벨 정보 로드`);
    
    // 현재 로그인한 사용자 정보 가져오기
    const userInfo = window.cacheManager ? window.cacheManager.getUserInfo() : null;
    
    if (!userInfo) {
      console.log('👤 로그인하지 않은 사용자 - 기본 단골 레벨 표시');
      updateLoyaltyUI({
        level: '신규 고객',
        visitCount: 0,
        progressPercent: 0,
        nextLevelVisits: 5,
        benefits: ['첫방문 할인', '웰컴 쿠폰', '신규 혜택']
      });
      return;
    }

    // 실제 API 호출 (현재는 목업 데이터)
    // const response = await fetch(`/api/stores/${store.id}/loyalty/${userInfo.id}`);
    
    // 목업 데이터
    const loyaltyData = {
      level: '골드 단골',
      visitCount: 13,
      progressPercent: 65,
      nextLevelVisits: 7,
      benefits: ['5% 적립', '우선 주문', '특별 할인']
    };

    updateLoyaltyUI(loyaltyData);
    
  } catch (error) {
    console.error('❌ 단골 레벨 정보 로드 실패:', error);
  }
}

// 단골 레벨 UI 업데이트
function updateLoyaltyUI(data) {
  const levelElement = document.querySelector('.loyalty-level');
  const progressFill = document.querySelector('.loyalty-progress-fill');
  const progressText = document.querySelector('.loyalty-progress-text');
  
  if (levelElement) {
    levelElement.textContent = data.level;
  }
  
  if (progressFill) {
    progressFill.style.width = `${data.progressPercent}%`;
  }
  
  if (progressText) {
    progressText.innerHTML = `
      <span>현재 ${data.progressPercent}% (${data.visitCount}회 방문)</span>
      <span>다음 레벨까지 ${data.nextLevelVisits}회</span>
    `;
  }
}

// 모든 프로모션 보기
function showAllPromotions(store) {
  alert(`매장 ${store.name}의 모든 프로모션을 확인할 수 있는 페이지로 이동합니다.`);
  // 실제로는 전체 프로모션 페이지로 이동하는 로직 구현
}

// 전역 함수 등록
window.renderStore = renderStore;
window.renderTableLayout = renderTableLayout;
window.loadAndRenderStore = loadAndRenderStore;
window.loadPromotionData = loadPromotionData;
window.loadLoyaltyData = loadLoyaltyData;