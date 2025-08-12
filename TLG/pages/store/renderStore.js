// 모듈 import (전역으로 로드될 것들)
// renderStoreUI.js, storeTabManager.js, tablePanelManager.js, reviewManager.js가 먼저 로드되어야 함

async function renderStore(store) {
  try {
    console.log('🏪 매장 렌더링:', store.name, 'ID:', store.id);
    
    // 메뉴 데이터 정규화
    if (store.menu && typeof store.menu === 'string') {
      try {
        store.menu = JSON.parse(store.menu);
        console.log('🔧 메뉴 JSON 파싱 완료');
      } catch (error) {
        console.error('❌ 메뉴 JSON 파싱 실패:', error);
        store.menu = [];
      }
    }
    
    // 메뉴가 없거나 배열이 아닌 곳에서 빈 배열로 초기화
    if (!store.menu || !Array.isArray(store.menu)) {
      store.menu = [];
    }
    
    console.log('📋 매장 메뉴 데이터 상세:', {
      hasMenu: !!store.menu,
      menuType: typeof store.menu,
      menuLength: Array.isArray(store.menu) ? store.menu.length : 'Not array',
      menuSample: store.menu.slice(0, 2) // 처음 2개만 샘플로 표시
    });

    // 필수 데이터 검증
    if (!store || !store.id || !store.name) {
      console.error('❌ 유효하지 않은 매장 데이터:', store);
      throw new Error('매장 데이터가 유효하지 않습니다');
    }

    // 필수 모듈 로딩 확인
    if (!window.StoreUIManager || typeof window.StoreUIManager.renderStoreHTML !== 'function') {
      console.error('❌ StoreUIManager가 로드되지 않았습니다');
      throw new Error('필수 UI 모듈을 찾을 수 없습니다');
    }

    // 초기값으로 UI를 먼저 렌더링 (빠른 UI 표시)
    let displayRating = '0.0';
    window.StoreUIManager.renderStoreHTML(store, displayRating);

    // UI 렌더링 후 실제 리뷰 데이터 비동기 로드
    updateStoreRatingAsync(store).then(() => {
      // 업데이트된 정보가 있으면 UI 재업데이트
      if (store.ratingAverage !== undefined && store.ratingAverage !== null && store.ratingAverage > 0) {
        displayRating = parseFloat(store.ratingAverage).toFixed(1);
        console.log('⭐ 실제 리뷰 기반 별점 업데이트:', displayRating);
        
        // DOM에서 별점 표시 업데이트
        const reviewScoreElement = document.getElementById('reviewScore');
        if (reviewScoreElement) {
          reviewScoreElement.innerHTML = `${displayRating}&nbsp<span id="reviewLink" class="review-link">리뷰 보기</span>`;
          
          // reviewLink 이벤트 리스너 재설정
          const newReviewLink = document.getElementById('reviewLink');
          if (newReviewLink) {
            newReviewLink.addEventListener('click', () => {
              if (typeof renderAllReview === 'function') {
                renderAllReview(store);
              }
            });
          }
        }
      } else {
        console.log('⚠️ 리뷰가 없어서 0.0점 유지');
      }
    }).catch(error => {
      console.warn('⚠️ 별점 정보 비동기 로드 실패, 기본값 유지:', error);
    });

    // DOM 렌더링 완료 후 이벤트 설정
    setTimeout(() => {
      try {
        setupEventListeners(store);
        loadInitialData(store);
        console.log('✅ 매장 렌더링 완료:', store.name);
      } catch (setupError) {
        console.error('❌ 이벤트 설정 중 오류:', setupError);
      }
    }, 100);

    // 전역에서 접근 가능하도록 store 정보 저장
    window.currentStore = store;

  } catch (error) {
    console.error('❌ renderStore 실행 중 오류:', error);
    
    // 오류 발생 시 기본 오류 화면 표시
    const main = document.getElementById('main');
    if (main) {
      main.innerHTML = `
        <div style="padding: 20px; text-align: center; color: #666;">
          <h2>🚫 매장을 불러올 수 없습니다</h2>
          <p style="color: #999; margin: 10px 0;">${error.message}</p>
          <button onclick="renderMap()" style="
            padding: 10px 20px; 
            background: #297efc; 
            color: white; 
            border: none; 
            border-radius: 8px; 
            cursor: pointer;
            font-size: 16px;
          ">지도로 돌아가기</button>
        </div>
      `;
    }
  }
}

// 이벤트 리스너 설정
function setupEventListeners(store) {
  try {
    console.log('🔧 이벤트 리스너 설정 시작...');

    // 패널 핸들링 (안전하게)
    if (window.StorePanelManager && typeof window.StorePanelManager.initializePanelHandling === 'function') {
      window.StorePanelManager.initializePanelHandling();
      console.log('✅ 패널 핸들링 초기화 완료');
    } else {
      console.warn('⚠️ StorePanelManager를 찾을 수 없음');
    }

    // 탭 네비게이션 (안전하게)
    if (window.StoreTabManager && typeof window.StoreTabManager.initializeTabNavigation === 'function') {
      window.StoreTabManager.initializeTabNavigation(store);
      console.log('✅ 탭 네비게이션 초기화 완료');
    } else {
      console.warn('⚠️ StoreTabManager를 찾을 수 없음');
    }

    // 즐겨찾기 버튼
    const favoriteBtn = document.getElementById('favoriteBtn');
    if (favoriteBtn) {
      favoriteBtn.addEventListener('click', () => {
        try {
          if (typeof toggleFavorite === 'function' && typeof updateFavoriteBtn === 'function') {
            toggleFavorite(store.name);
            updateFavoriteBtn(store.name);
          } else {
            console.warn('⚠️ 즐겨찾기 함수를 찾을 수 없음');
          }
        } catch (favoriteError) {
          console.error('❌ 즐겨찾기 처리 중 오류:', favoriteError);
        }
      });
      
      // 초기 즐겨찾기 상태 설정
      if (typeof updateFavoriteBtn === 'function') {
        updateFavoriteBtn(store.name);
      }
      console.log('✅ 즐겨찾기 버튼 이벤트 설정 완료');
    } else {
      console.warn('⚠️ favoriteBtn 요소를 찾을 수 없음');
    }

    // 리뷰 링크 이벤트 (null 체크 강화)
    const reviewLink = document.getElementById('reviewLink');
    if (reviewLink) {
      reviewLink.addEventListener('click', () => {
        try {
          if (typeof renderAllReview === 'function') {
            renderAllReview(store);
          } else {
            console.warn('⚠️ renderAllReview 함수를 찾을 수 없음');
          }
        } catch (reviewError) {
          console.error('❌ 리뷰 링크 처리 중 오류:', reviewError);
        }
      });
      console.log('✅ 리뷰 링크 이벤트 설정 완료');
    }

    // 리뷰 더보기 버튼들
    const reviewSeeMoreBtns = document.getElementsByClassName('see-more-btn');
    if (reviewSeeMoreBtns && reviewSeeMoreBtns.length > 0 && reviewSeeMoreBtns[0]) {
      reviewSeeMoreBtns[0].addEventListener('click', () => {
        try {
          if (typeof renderAllReview === 'function') {
            renderAllReview(store);
          } else {
            console.warn('⚠️ renderAllReview 함수를 찾을 수 없음');
          }
        } catch (reviewError) {
          console.error('❌ 리뷰 더보기 처리 중 오류:', reviewError);
        }
      });
      console.log('✅ 리뷰 더보기 버튼 이벤트 설정 완료');
    }

    // TLR 영역 클릭 시 테이블 정보 새로고침
    const tlrContainer = document.getElementById('TLR');
    if (tlrContainer) {
      tlrContainer.addEventListener('click', () => {
        try {
          if (window.TableInfoManager && typeof window.TableInfoManager.loadTableInfo === 'function') {
            window.TableInfoManager.loadTableInfo(store);
          } else {
            console.warn('⚠️ TableInfoManager를 찾을 수 없음');
          }
        } catch (tableError) {
          console.error('❌ 테이블 정보 로드 중 오류:', tableError);
        }
      });
      console.log('✅ TLR 영역 이벤트 설정 완료');
    }

    // 프로모션 관련 버튼들 이벤트 설정 (추가 안전장치)
    setTimeout(() => {
      const allPromotionBtns = document.querySelectorAll('.promotion-detail-btn, .promotion-more-btn, [onclick*="showAllPromotions"]');
      allPromotionBtns.forEach((btn, index) => {
        if (btn && !btn.hasAttribute('data-event-set')) {
          btn.setAttribute('data-event-set', 'true');
          btn.removeAttribute('onclick');
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log(`🎯 프로모션 버튼 ${index + 1} 클릭됨`);
            showAllPromotions(store);
          });
          console.log(`✅ 프로모션 버튼 ${index + 1} 이벤트 설정 완료`);
        }
      });
    }, 300);

    console.log('✅ 모든 이벤트 리스너 설정 완료');
  } catch (error) {
    console.error('❌ 이벤트 리스너 설정 중 오류:', error);
  }
}

// 초기 데이터 로드
function loadInitialData(store) {
  try {
    console.log('📊 초기 데이터 로드 시작...');

    // 리뷰 미리보기 로드 (안전하게)
    if (window.ReviewManager && typeof window.ReviewManager.renderTopReviews === 'function') {
      window.ReviewManager.renderTopReviews(store);
      console.log('✅ 리뷰 미리보기 로드 완료');
    } else {
      console.warn('⚠️ ReviewManager를 찾을 수 없음');
    }

    // 테이블 정보 로드 (초기 로드만, 자동 갱신 없음)
    if (window.TableInfoManager && typeof window.TableInfoManager.loadTableInfo === 'function') {
      console.log('🔄 테이블 정보 초기 로드 시작...');
      setTimeout(() => {
        try {
          window.TableInfoManager.loadTableInfo(store);
          console.log('✅ 테이블 정보 초기 로드 완료');
        } catch (tableError) {
          console.error('❌ 테이블 정보 로드 중 오류:', tableError);
        }
      }, 500); // 페이지 렌더링 후 테이블 정보 로드
    } else {
      console.warn('⚠️ TableInfoManager를 찾을 수 없음');
    }

    // 프로모션 및 단골 레벨 정보 로드
    try {
      loadPromotionData(store);
      loadLoyaltyData(store);
      console.log('✅ 프로모션/단골 데이터 로드 완료');
    } catch (promoError) {
      console.error('❌ 프로모션/단골 데이터 로드 중 오류:', promoError);
    }

    // 첫 화면(메뉴 탭) 설정
    setTimeout(() => {
      try {
        if (window.StoreTabManager && typeof window.StoreTabManager.renderStoreTab === 'function') {
          window.StoreTabManager.renderStoreTab('menu', store);
          
          const menuBtn = document.querySelector('[data-tab="menu"]');
          if (menuBtn) {
            menuBtn.classList.add('active');
            console.log('✅ 메뉴 탭 활성화 완료');
          } else {
            console.warn('⚠️ 메뉴 탭 버튼을 찾을 수 없음');
          }
        } else {
          console.warn('⚠️ StoreTabManager를 찾을 수 없음');
        }
      } catch (tabError) {
        console.error('❌ 탭 설정 중 오류:', tabError);
      }
    }, 200);

    console.log('✅ 초기 데이터 로드 완료');
  } catch (error) {
    console.error('❌ 초기 데이터 로드 중 오류:', error);
  }
}

// 실제 리뷰 데이터 기반 별점 정보 업데이트
async function updateStoreRatingAsync(store) {
  try {
    console.log(`🔄 매장 ${store.id} 실제 리뷰 기반 별점 정보 업데이트 중...`);

    // 서버에서 실시간 별점 정보 가져오기 (레거시 더미데이터 무시)
    const response = await fetch(`/api/stores/${store.id}/rating`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const ratingData = await response.json();

    if (ratingData && ratingData.success) {
      const actualRating = ratingData.ratingAverage || 0;
      const reviewCount = ratingData.reviewCount || 0;
      
      console.log(`📊 매장 ${store.id} 실제 리뷰 통계: ${actualRating}점 (${reviewCount}개 리뷰)`);

      // store 객체에 실제 데이터 반영
      store.ratingAverage = actualRating;
      store.reviewCount = reviewCount;

      // DOM에서 별점 표시 업데이트
      const reviewScoreElement = document.getElementById('reviewScore');
      if (reviewScoreElement) {
        const displayRating = parseFloat(actualRating).toFixed(1);
        reviewScoreElement.innerHTML = `${displayRating}&nbsp<span id="reviewLink">></span>`;
        console.log('✅ 실제 리뷰 기반 별점 UI 업데이트 완료:', displayRating);

        // reviewLink 이벤트 리스너 추가
        const newReviewLink = document.getElementById('reviewLink');
        if (newReviewLink) {
          newReviewLink.addEventListener('click', () => {
            renderAllReview(store);
          });
        }
      }

      // 전역 store 객체도 업데이트
      if (window.currentStore && window.currentStore.id === store.id) {
        window.currentStore.ratingAverage = actualRating;
        window.currentStore.reviewCount = reviewCount;
      }

      return { ratingAverage: actualRating, reviewCount: reviewCount };
    } else {
      console.warn('⚠️ 서버에서 유효하지 않은 별점 데이터 응답');
      return { ratingAverage: 0, reviewCount: 0 };
    }
  } catch (error) {
    console.error(`❌ 매장 ${store.id} 실제 리뷰 기반 별점 정보 업데이트 실패:`, error);
    return { ratingAverage: 0, reviewCount: 0 };
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
  
  // 프로모션 더보기 버튼 이벤트 추가 (여러 클래스 확인)
  setTimeout(() => {
    const promotionBtns = [
      document.querySelector('.promotion-more-btn'),
      document.querySelector('.promotion-detail-btn'),
      document.querySelector('[onclick="showAllPromotions()"]')
    ];
    
    promotionBtns.forEach(btn => {
      if (btn) {
        console.log('🎯 프로모션 버튼 이벤트 설정:', btn.className);
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          console.log('🎉 프로모션 자세히 보기 클릭됨');
          showAllPromotions(store);
        });
      }
    });

    // onclick 속성으로 설정된 버튼들도 처리
    const onclickBtns = document.querySelectorAll('[onclick*="showAllPromotions"]');
    onclickBtns.forEach(btn => {
      btn.removeAttribute('onclick');
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('🎉 onclick 프로모션 버튼 클릭됨');
        showAllPromotions(store);
      });
    });
  }, 200);
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
  console.log('🎯 showAllPromotions 호출됨:', store.name);
  
  try {
    if (typeof renderPromotionDetail === 'function') {
      console.log('✅ renderPromotionDetail 함수 발견, 실행 중...');
      renderPromotionDetail(store);
    } else {
      console.error('❌ renderPromotionDetail 함수를 찾을 수 없습니다.');
      
      // 전역에서 함수 찾기 시도
      if (window.renderPromotionDetail && typeof window.renderPromotionDetail === 'function') {
        console.log('✅ window.renderPromotionDetail 발견, 실행 중...');
        window.renderPromotionDetail(store);
      } else {
        console.error('❌ 전역에서도 renderPromotionDetail 함수를 찾을 수 없습니다.');
        alert(`매장 ${store.name}의 프로모션 상세 페이지를 불러올 수 없습니다. 페이지를 새로고침 후 다시 시도해주세요.`);
      }
    }
  } catch (error) {
    console.error('❌ showAllPromotions 실행 중 오류:', error);
    alert('프로모션 상세 페이지를 불러오는 중 오류가 발생했습니다.');
  }
}

// 전역 함수로도 등록
window.showAllPromotions = showAllPromotions;

// 전역 함수 등록 (즉시 실행)
(function() {
  console.log('🔧 renderStore 전역 함수 등록 중...');
  
  window.renderStore = renderStore;
  window.renderTableLayout = renderTableLayout;
  window.loadAndRenderStore = loadAndRenderStore;
  window.loadPromotionData = loadPromotionData;
  window.loadLoyaltyData = loadLoyaltyData;
  
  // 함수 등록 확인
  console.log('✅ renderStore 전역 함수 등록 완료:', typeof window.renderStore);
  console.log('🔍 전역 renderStore 존재 여부:', !!window.renderStore);
})();