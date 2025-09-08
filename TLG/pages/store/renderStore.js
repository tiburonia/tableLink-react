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

    // 필수 데이터 검증 및 정규화
    if (!store) {
      console.error('❌ 매장 데이터가 없습니다');
      throw new Error('매장 데이터가 없습니다');
    }

    // ID 정규화 (store_id 또는 id 사용)
    if (!store.id && store.store_id) {
      store.id = store.store_id;
    }

    if (!store.id || !store.name) {
      console.error('❌ 유효하지 않은 매장 데이터:', { 
        hasId: !!store.id, 
        hasStoreId: !!store.store_id,
        hasName: !!store.name,
        keys: Object.keys(store)
      });
      throw new Error('매장 ID 또는 이름이 누락되었습니다');
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

        // DOM에서 별점 표시 업데이트 (리뷰 링크는 유지)
        const reviewScoreElement = document.getElementById('reviewScore');
        if (reviewScoreElement) {
          // 기존 리뷰 링크가 있는지 확인
          const existingReviewLink = document.getElementById('reviewLink');
          if (existingReviewLink) {
            // 기존 링크가 있으면 별점만 업데이트
            const textNode = reviewScoreElement.firstChild;
            if (textNode && textNode.nodeType === Node.TEXT_NODE) {
              textNode.textContent = displayRating + '\u00A0'; // &nbsp;
            }
          } else {
            // 기존 링크가 없으면 전체 내용 업데이트
            reviewScoreElement.innerHTML = `${displayRating}&nbsp<span id="reviewLink" class="review-link">리뷰 보기</span>`;

            // 새로 생성된 리뷰 링크에 이벤트 리스너 설정
            const newReviewLink = document.getElementById('reviewLink');
            if (newReviewLink) {
              newReviewLink.addEventListener('click', () => {
                if (typeof renderAllReview === 'function') {
                  renderAllReview(store);
                }
              });
            }
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
          if (typeof toggleFavorite === 'function') {
            toggleFavorite(store); // 매장 객체 전체를 전달
          } else {
            console.warn('⚠️ 즐겨찾기 함수를 찾을 수 없음');
          }
        } catch (favoriteError) {
          console.error('❌ 즐겨찾기 처리 중 오류:', favoriteError);
        }
      });

      // 초기 즐겨찾기 상태 설정
      if (typeof initializeFavoriteButton === 'function') {
        initializeFavoriteButton(store); // 매장 객체 전체를 전달
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

    // TLL 버튼 이벤트 설정 (매장 미리 선택)
    const tllButton = document.getElementById('TLL');
    if (tllButton) {
      // 기존 onclick 속성 제거
      tllButton.removeAttribute('onclick');

      tllButton.addEventListener('click', () => {
        try {
          console.log(`🎯 TLL 버튼 클릭 - 매장 ${store.name} 미리 선택하여 실행`);
          if (typeof TLL === 'function') {
            TLL(store); // 현재 매장 정보를 전달
          } else {
            console.warn('⚠️ TLL 함수를 찾을 수 없음');
          }
        } catch (tllError) {
          console.error('❌ TLL 실행 중 오류:', tllError);
        }
      });
      console.log('✅ TLL 버튼 이벤트 설정 완료 (매장 미리 선택)');
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

    // 수동 새로고침 버튼 이벤트 설정
    const manualRefreshBtn = document.getElementById('manualRefreshBtn');
    if (manualRefreshBtn && !manualRefreshBtn.hasAttribute('data-event-set')) {
      manualRefreshBtn.setAttribute('data-event-set', 'true');
      manualRefreshBtn.addEventListener('click', () => {
        if (window.currentStore) {
          this.loadTableInfo(window.currentStore);
        }
      });
    }

    // 테이블 상세 토글 버튼 이벤트 설정
    const tableDetailToggleBtn = document.getElementById('tableDetailToggleBtn');
    const tableDetailContent = document.getElementById('tableDetailContent');

    if (tableDetailToggleBtn && tableDetailContent && !tableDetailToggleBtn.hasAttribute('data-event-set')) {
      tableDetailToggleBtn.setAttribute('data-event-set', 'true');
      tableDetailToggleBtn.addEventListener('click', () => {
        const isExpanded = tableDetailContent.style.display !== 'none';

        if (isExpanded) {
          // 접기
          tableDetailContent.classList.remove('show');
          setTimeout(() => {
            tableDetailContent.style.display = 'none';
          }, 300);
          tableDetailToggleBtn.classList.remove('expanded');
          tableDetailToggleBtn.querySelector('.toggle-text').textContent = '테이블 현황 자세히 보기';
        } else {
          // 펼치기
          tableDetailContent.style.display = 'block';
          setTimeout(() => {
            tableDetailContent.classList.add('show');
          }, 10);
          tableDetailToggleBtn.classList.add('expanded');
          tableDetailToggleBtn.querySelector('.toggle-text').textContent = '테이블 현황 간단히 보기';
        }
      });
    }

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

    // 프로모션, 단골 레벨, 상위 사용자 정보 로드
    try {
      loadPromotionData(store);
      loadTopUsersData(store);
      loadLoyaltyData(store);
      console.log('✅ 프로모션/단골/상위사용자 데이터 로드 완료');
    } catch (promoError) {
      console.error('❌ 프로모션/단골/상위사용자 데이터 로드 중 오류:', promoError);
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
        reviewScoreElement.textContent = displayRating;
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
async function loadPromotionData(store) {
  try {
    console.log(`🎉 매장 ${store.id} 프로모션 정보 로드`);

    // 실제 프로모션 데이터 조회
    const response = await fetch(`/api/stores/${store.id}/promotions`);
    if (response.ok) {
      const promotionData = await response.json();

      if (promotionData.success && promotionData.promotions) {
        console.log(`✅ 매장 ${store.id} 프로모션 ${promotionData.promotions.length}개 로드 완료`);

        // 프로모션 카드 UI 업데이트
        updatePromotionUI(promotionData.promotions);
      } else {
        console.log(`⚠️ 매장 ${store.id} 진행중인 프로모션 없음`);
        updatePromotionUI([]);
      }
    } else {
      console.error('❌ 프로모션 데이터 조회 실패');
      updatePromotionUI([]);
    }

  } catch (error) {
    console.error('❌ 프로모션 데이터 로드 중 오류:', error);
    // 프로모션 로드 실패시 기본 안내 메시지 표시
    const promotionContainer = document.querySelector('.promotion-content');
    if (promotionContainer) {
      promotionContainer.innerHTML = `
        <div class="no-promotion">
          <span class="no-promotion-icon">🎁</span>
          <div class="no-promotion-text">혜택 정보를 불러올 수 없습니다</div>
        </div>
      `;
    }
  }

  // 프로모션 더보기 버튼에 이벤트 리스너 추가 (여러 클래스 확인)
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

// 프로모션 UI 업데이트 (regular_level 테이블의 benefit 컬럼 기반)
function updatePromotionUI(promotions) {
  const promotionContainer = document.querySelector('.promotion-content');
  if (!promotionContainer) return;

  // 프로모션 카드의 HTML 구조를 업데이트
  const promotionCardHTML = renderPromotionCardHTML(window.currentStore);
  const promotionCardElement = document.createElement('div');
  promotionCardElement.innerHTML = promotionCardHTML;
  const targetContainer = promotionCardElement.querySelector('.promotion-content');

  if (targetContainer) {
    // 프로모션 데이터 로드 후 실제 혜택 내용으로 스켈레톤 대체
    if (promotions && promotions.length > 0) {
      // 실제 혜택 데이터를 표시하는 함수 호출
      displayPromotions(targetContainer, promotions);
    } else {
      // 혜택이 없을 경우 표시
      targetContainer.innerHTML = `
        <div class="no-promotion-message">
          <span class="no-promotion-icon">📭</span>
          <div class="no-promotion-text">현재 진행중인 혜택이 없습니다</div>
        </div>
      `;
    }
  }

  // 기존 프로모션 카드 대신 새로 생성된 카드로 교체
  const existingCard = document.querySelector('.promotion-card');
  if (existingCard) {
    existingCard.replaceWith(promotionCardElement.firstElementChild);
  } else {
    // 카드가 없으면 그대로 추가
    document.querySelector('.promotion-area').appendChild(promotionCardElement.firstElementChild);
  }

  // 프로모션 더보기 버튼에 이벤트 리스너 추가
  const detailButton = document.querySelector('.promotion-detail-btn');
  if (detailButton) {
    detailButton.addEventListener('click', () => {
      showAllPromotions(window.currentStore);
    });
  }

  // 프로모션 데이터 로드 후, regular_level의 benefit 데이터를 로드하여 표시
  loadRegularLevelBenefits(targetContainer, promotions);
}


// 실제 프로모션 카드 HTML 생성 함수
function renderPromotionCardHTML(store) {
  return `
    <div class="promotion-card modern-benefits-card">
      <div class="promotion-header">
        <div class="promotion-title-section">
          <div class="promotion-icon-wrapper">
            <span class="promotion-main-icon">🎁</span>
          </div>
          <div class="promotion-title-info">
            <h3 class="promotion-title">진행중인 혜택</h3>
            <div class="promotion-subtitle">특별 혜택을 확인하세요</div>
          </div>
        </div>
        <div class="promotion-status-indicator">
          <span class="live-dot"></span>
          <span class="live-text">LIVE</span>
        </div>
      </div>

      <div class="promotion-content">
        <!-- 로딩 스켈레톤 -->
        <div class="benefits-loading-skeleton">
          <div class="skeleton-benefit-item">
            <div class="skeleton-icon"></div>
            <div class="skeleton-content">
              <div class="skeleton-title"></div>
              <div class="skeleton-desc"></div>
            </div>
            <div class="skeleton-badge"></div>
          </div>
          <div class="skeleton-benefit-item">
            <div class="skeleton-icon"></div>
            <div class="skeleton-content">
              <div class="skeleton-title"></div>
              <div class="skeleton-desc"></div>
            </div>
            <div class="skeleton-badge"></div>
          </div>
        </div>
      </div>

      <div class="promotion-footer">
        <button class="promotion-detail-btn modern-outline-btn">
          <span class="btn-icon">📋</span>
          <span class="btn-text">전체 혜택 보기</span>
          <span class="btn-arrow">→</span>
        </button>
      </div>
    </div>
  `;
}


// regular_level 테이블의 benefit 데이터 로드 및 표시
async function loadRegularLevelBenefits(container, promotions = []) {
  try {
    // 현재 로그인한 사용자 정보 가져오기
    const userInfo = window.cacheManager ? window.cacheManager.getUserInfo() : window.userInfo;

    if (!userInfo || !window.currentStore) {
      // 로그인하지 않은 경우 기본 혜택 표시
      displayDefaultBenefits(container, promotions);
      return;
    }

    // 실제 단골 레벨 정보 가져오기
    if (window.RegularLevelManager) {
      const regularLevelData = await window.RegularLevelManager.getUserRegularLevel(userInfo.id, window.currentStore.id);

      if (regularLevelData && regularLevelData.level && regularLevelData.level.benefits) {
        displayRegularLevelBenefits(container, regularLevelData.level.benefits, promotions);
        return;
      }
    }

    // 폴백: 기본 혜택 표시
    displayDefaultBenefits(container, promotions);

  } catch (error) {
    console.error('❌ regular_level benefit 로드 실패:', error);
    displayDefaultBenefits(container, promotions);
  }
}

// 실제 혜택 데이터 표시 (단골 레벨 혜택)
function displayPromotions(container, promotions = []) {
  if (!promotions || promotions.length === 0) {
    container.innerHTML = `
      <div class="no-promotion-message">
        <span class="no-promotion-icon">📭</span>
        <div class="no-promotion-text">현재 진행중인 혜택이 없습니다</div>
      </div>
    `;
    return;
  }

  // 최대 2개의 혜택만 먼저 표시
  const displayPromotions = promotions.slice(0, 2);

  container.innerHTML = `
    ${displayPromotions.map((promotion, index) => `
      <div class="benefit-item-modern ${index === 0 ? 'featured' : ''}">
        <div class="benefit-icon-modern">${getBenefitIcon(promotion.type)}</div>
        <div class="benefit-content-modern">
          <div class="benefit-name-modern">${promotion.name}</div>
          <div class="benefit-desc-modern">${promotion.description}</div>
        </div>
        <div class="benefit-value-modern">${formatDiscountValue(promotion)}</div>
      </div>
    `).join('')}
    ${promotions.length > 2 ? `
      <div class="benefits-expand-modern">
        <button class="promotion-detail-btn modern-outline-btn">
          <span class="btn-icon">➕</span>
          <span class="btn-text">더 보기 (${promotions.length - 2}개)</span>
        </button>
      </div>
    ` : ''}
  `;

  // "더 보기" 버튼에 이벤트 리스너 추가
  const expandButtons = container.querySelectorAll('.benefits-expand-modern .promotion-detail-btn');
  expandButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      showAllBenefits(promotions);
    });
  });
}


// regular_level의 실제 benefit 데이터 표시
function displayRegularLevelBenefits(container, benefits, promotions = []) {
  if (!benefits || benefits.length === 0) {
    displayDefaultBenefits(container, promotions);
    return;
  }

  // 최대 3개의 혜택만 표시
  const displayBenefits = benefits.slice(0, 3);

  container.innerHTML = `
    <div class="benefits-grid premium-benefits-grid">
      ${displayBenefits.map((benefit, index) => `
        <div class="benefit-card premium-benefit-card ${index === 0 ? 'featured-benefit' : ''}"
             style="animation-delay: ${index * 0.1}s;">
          <div class="benefit-header">
            <div class="benefit-icon-container">
              <span class="benefit-icon">${getBenefitIcon(benefit.type)}</span>
              ${benefit.expires_days ? `
                <div class="benefit-expiry">
                  <span class="expiry-icon">⏰</span>
                  <span class="expiry-text">${benefit.expires_days}일</span>
                </div>
              ` : ''}
            </div>
            <div class="benefit-status ${getBenefitStatus(benefit.type)}"></div>
          </div>

          <div class="benefit-content">
            <div class="benefit-name">${benefit.name || formatBenefitName(benefit.type)}</div>
            <div class="benefit-description">${getBenefitDescription(benefit)}</div>
            <div class="benefit-value">
              ${formatBenefitValue(benefit)}
            </div>
          </div>

          <div class="benefit-actions">
            <button class="benefit-use-btn" onclick="useBenefit('${benefit.type}', ${JSON.stringify(benefit).replace(/"/g, '&quot;')})">
              <span class="btn-icon">✨</span>
              <span class="btn-text">혜택 사용</span>
            </button>
          </div>
        </div>
      `).join('')}
    </div>

    ${benefits.length > 3 ? `
      <div class="benefits-expand">
        <button class="promotion-detail-btn" onclick="showAllBenefits(${JSON.stringify(benefits).replace(/"/g, '&quot;')})">
          더 보기 (+${benefits.length - 3}개 혜택)
        </button>
      </div>
    ` : ''}

    <style>
      .benefits-grid.premium-benefits-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 8px;
        margin-bottom: 8px;
      }

      .benefit-card.premium-benefit-card {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 12px;
        padding: 12px;
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.1);
        transition: all 0.3s ease;
        animation: benefitSlideIn 0.5s ease forwards;
        opacity: 0;
        transform: translateY(10px);
      }

      .benefit-card.featured-benefit {
        border: 1px solid rgba(255, 215, 0, 0.3);
        box-shadow: 0 0 15px rgba(255, 215, 0, 0.2);
      }

      .benefit-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
      }

      @keyframes benefitSlideIn {
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .benefit-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 8px;
      }

      .benefit-icon-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
      }

      .benefit-icon {
        font-size: 18px;
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
      }

      .benefit-expiry {
        display: flex;
        align-items: center;
        gap: 2px;
        background: rgba(255, 255, 255, 0.2);
        padding: 2px 4px;
        border-radius: 4px;
      }

      .expiry-icon {
        font-size: 8px;
      }

      .expiry-text {
        font-size: 7px;
        font-weight: 600;
      }

      .benefit-status {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
      }

      .benefit-status.vip {
        background: linear-gradient(45deg, #ffd700, #ffed4e);
        box-shadow: 0 0 8px rgba(255, 215, 0, 0.4);
      }

      .benefit-status.premium {
        background: linear-gradient(45deg, #e5e4e2, #ffffff);
        box-shadow: 0 0 8px rgba(229, 228, 226, 0.4);
      }

      .benefit-status.loyalty {
        background: linear-gradient(45deg, #3b82f6, #60a5fa);
        box-shadow: 0 0 8px rgba(59, 130, 246, 0.4);
      }

      .benefit-status.discount {
        background: linear-gradient(45deg, #ef4444, #f87171);
        box-shadow: 0 0 8px rgba(239, 68, 68, 0.4);
      }

      .benefit-status.free {
        background: linear-gradient(45deg, #10b981, #34d399);
        box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
      }

      .benefit-status.priority {
        background: linear-gradient(45deg, #f59e0b, #fbbf24);
        box-shadow: 0 0 8px rgba(245, 158, 11, 0.4);
      }

      .benefit-content {
        margin-bottom: 8px;
      }

      .benefit-name {
        font-size: 12px;
        font-weight: 700;
        margin-bottom: 2px;
        line-height: 1.2;
      }

      .benefit-description {
        font-size: 9px;
        opacity: 0.8;
        margin-bottom: 4px;
        line-height: 1.3;
      }

      .benefit-value {
        margin-bottom: 8px;
      }

      .benefit-value .value-highlight {
        font-size: 10px;
        font-weight: 600;
        padding: 2px 6px;
        border-radius: 4px;
        background: rgba(255, 255, 255, 0.2);
      }

      .benefit-actions {
        display: flex;
        justify-content: center;
      }

      .benefit-use-btn {
        background: rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.3);
        color: white;
        padding: 6px 12px;
        border-radius: 8px;
        font-size: 9px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .benefit-use-btn:hover {
        background: rgba(255, 255, 255, 0.3);
        border-color: rgba(255, 255, 255, 0.5);
        transform: translateY(-1px);
      }

      .btn-icon {
        font-size: 8px;
      }

      .benefits-expand {
        text-align: center;
        margin-top: 8px;
      }

      .benefits-expand .promotion-detail-btn {
        width: 100%;
        background: rgba(102, 126, 234, 0.1);
        border: 1px solid rgba(102, 126, 234, 0.3);
        color: #667eea;
        padding: 8px 12px;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .benefits-expand .promotion-detail-btn:hover {
        background: rgba(102, 126, 234, 0.2);
        border-color: rgba(102, 126, 234, 0.5);
      }
    </style>
  `;
}

// 기본 혜택 표시 (로그인하지 않은 경우 또는 regular_level 데이터가 없는 경우)
function displayDefaultBenefits(container, promotions = []) {
  container.innerHTML = `
    <div class="benefit-item-modern featured">
      <div class="benefit-icon-modern">🎁</div>
      <div class="benefit-content-modern">
        <div class="benefit-name-modern">신규 방문 혜택</div>
        <div class="benefit-desc-modern">첫 방문 시 특별 할인 제공</div>
      </div>
      <div class="benefit-value-modern">10%</div>
    </div>
    <div class="benefit-item-modern">
      <div class="benefit-icon-modern">⭐</div>
      <div class="benefit-content-modern">
        <div class="benefit-name-modern">단골 고객 혜택</div>
        <div class="benefit-desc-modern">레벨업 시 추가 할인 혜택</div>
      </div>
      <div class="benefit-value-modern vip">VIP</div>
    </div>
  `;
}

// 프로모션 타입에 따른 아이콘 반환
function getPromotionIcon(type) {
  const iconMap = {
    'discount': '🏷️',
    'point': '⭐',
    'free_delivery': '🚚',
    'new_customer': '🎁',
    'loyalty': '👑'
  };
  return iconMap[type] || '🎉';
}

// 할인 값 포맷팅
function formatDiscountValue(promotion) {
  if (promotion.discount_percent) {
    return `${promotion.discount_percent}%`;
  } else if (promotion.discount_amount) {
    return `${promotion.discount_amount.toLocaleString()}원`;
  } else if (promotion.type === 'point') {
    return `${promotion.point_rate}% 적립`;
  }
  return '혜택';
}

// 단골 레벨 데이터 로드
async function loadLoyaltyData(store) {
  try {
    console.log(`⭐ 매장 ${store.id} 단골 레벨 정보 로드`);

    // 현재 로그인한 사용자 정보 가져오기
    const userInfo = window.cacheManager ? window.cacheManager.getUserInfo() : window.userInfo;

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

    // 실제 단골 레벨 정보 가져오기
    if (window.RegularLevelManager) {
      const regularLevelData = await window.RegularLevelManager.getUserRegularLevel(userInfo.id, store.id);

      if (regularLevelData) {
        console.log('✅ 실제 단골 레벨 데이터 로드:', regularLevelData);

        // 기존 loyalty-info 컨테이너 대신 실제 단골 레벨 카드 영역 업데이트
        updateLoyaltyCardUI(regularLevelData, store);
        return;
      }
    }

    // 폴백: 기본 데이터 (신규 고객)
    updateLoyaltyCardUI({
      level: null,
      stats: { points: 0, visitCount: 0, totalSpent: 0 },
      nextLevel: { name: '단골 고객', requiredVisitCount: 5 },
      progress: { percentage: 0, visits_needed: 5 }
    }, store);

  } catch (error) {
    console.error('❌ 단골 레벨 정보 로드 실패:', error);
    updateLoyaltyCardUI({
      level: null,
      stats: { points: 0, visitCount: 0, totalSpent: 0 },
      nextLevel: { name: '단골 고객', requiredVisitCount: 5 },
      progress: { percentage: 0, visits_needed: 5 }
    }, store);
  }
}

// 단골 레벨 카드 UI 업데이트 (단순화된 버전)
function updateLoyaltyCardUI(levelData, store) {
  const loyaltyContainer = document.querySelector('.loyalty-levels-grid');
  if (!loyaltyContainer) {
    console.warn('⚠️ .loyalty-levels-grid 요소를 찾을 수 없음. 다른 선택자 시도...');

    // 대안 선택자들 시도
    const alternatives = [
      '.loyalty-card',
      '.modern-gradient-card.loyalty-theme',
      '[class*="loyalty"]'
    ];

    let foundContainer = null;
    for (const selector of alternatives) {
      foundContainer = document.querySelector(selector);
      if (foundContainer) {
        console.log(`✅ 대안 선택자로 요소 발견: ${selector}`);
        break;
      }
    }

    if (!foundContainer) {
      console.error('❌ 단골 레벨 컨테이너를 찾을 수 없습니다');
      return;
    }

    // 발견된 요소의 부모나 형제 요소에서 업데이트 가능한 컨테이너 찾기
    const parentContainer = foundContainer.parentElement;
    if (parentContainer) {
      // 부모 요소에 직접 삽입
      parentContainer.innerHTML = createSimpleLoyaltyCardHTML(levelData, store);
      return;
    }
  }

  loyaltyContainer.innerHTML = createSimpleLoyaltyCardHTML(levelData, store);
}

// 단순화된 단골 레벨 카드 HTML 생성 함수
function createSimpleLoyaltyCardHTML(levelData, store) {
  const level = levelData.level;
  const stats = levelData.stats || {};
  const nextLevel = levelData.nextLevel;
  const progress = levelData.progress || {};

  // 현재 레벨 정보
  const currentLevelName = level?.name || '신규 고객';
  const currentLevelRank = level?.rank || 0;
  const visitCount = stats.visitCount || 0;
  const points = stats.points || 0;
  const totalSpent = stats.totalSpent || 0;

  // 다음 레벨 정보 및 진행률 계산
  let progressPercent = 0;
  let requirementDetails = [];
  let nextLevelName = '단골 고객';

  if (nextLevel) {
    nextLevelName = nextLevel.name;

    // 실제 진행률 계산
    const requiredPoints = nextLevel.requiredPoints || 0;
    const requiredSpent = nextLevel.requiredTotalSpent || 0;
    const requiredVisits = nextLevel.requiredVisitCount || 0;

    if (nextLevel.evalPolicy === 'OR') {
      // OR 조건: 가장 높은 진행률 사용
      const pointsProgress = requiredPoints > 0 ? Math.min(100, (points / requiredPoints) * 100) : 100;
      const spentProgress = requiredSpent > 0 ? Math.min(100, (totalSpent / requiredSpent) * 100) : 100;
      const visitsProgress = requiredVisits > 0 ? Math.min(100, (visitCount / requiredVisits) * 100) : 100;

      progressPercent = Math.max(pointsProgress, spentProgress, visitsProgress);

      // 필요한 조건들 표시
      if (requiredPoints > 0 && points < requiredPoints) {
        requirementDetails.push(`포인트 ${(requiredPoints - points).toLocaleString()}P`);
      }
      if (requiredSpent > 0 && totalSpent < requiredSpent) {
        requirementDetails.push(`결제 ${(requiredSpent - totalSpent).toLocaleString()}원`);
      }
      if (requiredVisits > 0 && visitCount < requiredVisits) {
        requirementDetails.push(`방문 ${requiredVisits - visitCount}회`);
      }
    } else {
      // AND 조건: 모든 조건의 평균 진행률
      const pointsProgress = requiredPoints > 0 ? Math.min(100, (points / requiredPoints) * 100) : 100;
      const spentProgress = requiredSpent > 0 ? Math.min(100, (totalSpent / requiredSpent) * 100) : 100;
      const visitsProgress = requiredVisits > 0 ? Math.min(100, (visitCount / requiredVisits) * 100) : 100;

      progressPercent = (pointsProgress + spentProgress + visitsProgress) / 3;

      // 모든 조건 표시
      if (requiredPoints > 0) {
        requirementDetails.push(`포인트 ${Math.max(0, requiredPoints - points).toLocaleString()}P`);
      }
      if (requiredSpent > 0) {
        requirementDetails.push(`결제 ${Math.max(0, requiredSpent - totalSpent).toLocaleString()}원`);
      }
      if (requiredVisits > 0) {
        requirementDetails.push(`방문 ${Math.max(0, requiredVisits - visitCount)}회`);
      }
    }
  }

  // 레벨별 색상 및 테마 설정
  const levelThemes = {
    0: {
      gradient: 'linear-gradient(135deg, #6c757d, #495057)',
      glow: 'rgba(108, 117, 125, 0.15)',
      icon: '🆕',
      bgPattern: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)'
    },
    1: {
      gradient: 'linear-gradient(135deg, #d2691e, #8b4513)',
      glow: 'rgba(210, 105, 30, 0.2)',
      icon: '🥉',
      bgPattern: 'radial-gradient(circle at 20% 80%, rgba(255,215,0,0.1) 0%, transparent 50%)'
    },
    2: {
      gradient: 'linear-gradient(135deg, #c0c0c0, #708090)',
      glow: 'rgba(192, 192, 192, 0.2)',
      icon: '🥈',
      bgPattern: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.15) 0%, transparent 50%)'
    },
    3: {
      gradient: 'linear-gradient(135deg, #ffd700, #b8860b)',
      glow: 'rgba(255, 215, 0, 0.25)',
      icon: '🥇',
      bgPattern: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.2) 0%, transparent 50%)'
    },
    4: {
      gradient: 'linear-gradient(135deg, #e5e4e2, #c0c0c0)',
      glow: 'rgba(229, 228, 226, 0.25)',
      icon: '💎',
      bgPattern: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.25) 0%, transparent 50%)'
    }
  };

  const theme = levelThemes[currentLevelRank] || levelThemes[0];

  return `
    <div class="loyalty-level-card compact-card"
         style="background: ${theme.gradient}; box-shadow: 0 4px 16px ${theme.glow};">
      <div class="card-background" style="background: ${theme.bgPattern}"></div>

      <div class="level-header">
        <div class="level-icon-container">
          <div class="level-icon">${theme.icon}</div>
          <div class="level-rank">LV.${currentLevelRank}</div>
        </div>
        <div class="level-info">
          <div class="level-name">${currentLevelName}</div>
          <div class="level-subtitle">${store.name} 단골</div>
        </div>
      </div>

      <div class="level-stats">
        <div class="stat-item">
          <span class="stat-value">${visitCount}</span>
          <span class="stat-label">방문</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${points.toLocaleString()}</span>
          <span class="stat-label">포인트</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${Math.floor(totalSpent / 1000)}K</span>
          <span class="stat-label">누적결제</span>
        </div>
      </div>

      ${nextLevel ? `
        <div class="level-progress-section">
          <div class="progress-header">
            <span class="next-level-info">다음: ${nextLevelName}</span>
            <span class="progress-percentage">${Math.round(progressPercent)}%</span>
          </div>

          <div class="requirements-gauges">
            ${nextLevel.requiredPoints > 0 ? `
              <div class="gauge-container">
                <div class="gauge-header">
                  <span class="gauge-label">포인트</span>
                  <span class="gauge-value">${points.toLocaleString()}/${nextLevel.requiredPoints.toLocaleString()}</span>
                </div>
                <div class="gauge-track">
                  <div class="gauge-fill points" style="width: ${Math.min(150, (points / nextLevel.requiredPoints) * 100)}%;"></div>
                </div>
                <div class="gauge-percent">${Math.round((points / nextLevel.requiredPoints) * 100)}%</div>
              </div>
            ` : ''}

            ${nextLevel.requiredTotalSpent > 0 ? `
              <div class="gauge-container">
                <div class="gauge-header">
                  <span class="gauge-label">누적결제</span>
                  <span class="gauge-value">${Math.floor(totalSpent / 1000)}K/${Math.floor(nextLevel.requiredTotalSpent / 1000)}K</span>
                </div>
                <div class="gauge-track">
                  <div class="gauge-fill spending" style="width: ${Math.min(150, (totalSpent / nextLevel.requiredTotalSpent) * 100)}%;"></div>
                </div>
                <div class="gauge-percent">${Math.round((totalSpent / nextLevel.requiredTotalSpent) * 100)}%</div>
              </div>
            ` : ''}

            ${nextLevel.requiredVisitCount > 0 ? `
              <div class="gauge-container">
                <div class="gauge-header">
                  <span class="gauge-label">방문횟수</span>
                  <span class="gauge-value">${visitCount}/${nextLevel.requiredVisitCount}</span>
                </div>
                <div class="gauge-track">
                  <div class="gauge-fill visits" style="width: ${Math.min(150, (visitCount / nextLevel.requiredVisitCount) * 100)}%;"></div>
                </div>
                <div class="gauge-percent">${Math.round((visitCount / nextLevel.requiredVisitCount) * 100)}%</div>
              </div>
            ` : ''}
          </div>

          <div class="evaluation-policy">
            <span class="policy-label">
              ${nextLevel.evalPolicy === 'OR' ? '🎯 조건 중 하나만 달성하면 승급' : '🎯 모든 조건을 달성해야 승급'}
            </span>
          </div>

          ${progressPercent >= 100 ? `
            <div class="level-ready-badge">🎉 승급 가능!</div>
          ` : ''}
        </div>
      ` : `
        <div class="level-complete-section">
          <div class="complete-badge">🏆 최고 등급</div>
        </div>
      `}

      <div class="level-summary-section">
        <div class="summary-header">
          <span class="summary-icon">📊</span>
          <span class="summary-title">단골 현황</span>
        </div>
        <div class="summary-content">
          <span class="summary-text">${currentLevelName} 등급으로 ${store.name}를 이용 중입니다</span>
        </div>
      </div>
    </div>

    <style>
      .loyalty-level-card.compact-card {
        border-radius: 16px;
        padding: 16px;
        margin: 12px 0;
        color: white;
        position: relative;
        overflow: hidden;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.15);
        transition: all 0.3s ease;
        max-width: 100%;
      }

      .loyalty-level-card.compact-card:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15) !important;
      }

      .card-background {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        opacity: 0.4;
        z-index: -1;
      }

      .level-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
      }

      .level-icon-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        flex-shrink: 0;
      }

      .level-icon {
        font-size: 28px;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
      }

      .level-rank {
        background: rgba(255, 255, 255, 0.2);
        padding: 2px 6px;
        border-radius: 8px;
        font-size: 9px;
        font-weight: 600;
        backdrop-filter: blur(5px);
      }

      .level-info {
        flex: 1;
        min-width: 0;
      }

      .level-name {
        font-size: 18px;
        font-weight: 700;
        margin-bottom: 2px;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        line-height: 1.2;
      }

      .level-subtitle {
        font-size: 12px;
        opacity: 0.8;
        font-weight: 500;
      }

      .level-stats {
        display: flex;
        gap: 8px;
        margin-bottom: 12px;
        justify-content: space-between;
      }

      .stat-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        background: rgba(255, 255, 255, 0.15);
        padding: 8px 6px;
        border-radius: 8px;
        backdrop-filter: blur(5px);
        flex: 1;
        min-width: 0;
      }

      .stat-value {
        font-size: 14px;
        font-weight: 700;
        line-height: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        width: 100%;
        text-align: center;
      }

      .stat-label {
        font-size: 9px;
        opacity: 0.8;
        margin-top: 2px;
      }

      .level-progress-section {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 12px;
        margin-bottom: 12px;
        backdrop-filter: blur(5px);
      }

      .progress-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }

      .next-level-info {
        font-size: 12px;
        font-weight: 600;
      }

      .progress-percentage {
        font-size: 12px;
        font-weight: 700;
      }

      .requirements-gauges {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 8px;
      }

      .gauge-container {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 8px;
        backdrop-filter: blur(3px);
      }

      .gauge-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;
      }

      .gauge-label {
        font-size: 10px;
        font-weight: 600;
        opacity: 0.9;
      }

      .gauge-value {
        font-size: 9px;
        font-weight: 600;
        opacity: 0.8;
      }

      .gauge-track {
        height: 4px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 2px;
        overflow: hidden;
        margin-bottom: 2px;
        position: relative;
      }

      .gauge-fill {
        height: 100%;
        border-radius: 2px;
        transition: width 0.3s ease;
        position: relative;
      }

      .gauge-fill.points {
        background: linear-gradient(90deg, #10b981, #34d399);
        box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
      }

      .gauge-fill.spending {
        background: linear-gradient(90deg, #3b82f6, #60a5fa);
        box-shadow: 0 0 8px rgba(59, 130, 246, 0.4);
      }

      .gauge-fill.visits {
        background: linear-gradient(90deg, #f59e0b, #fbbf24);
        box-shadow: 0 0 8px rgba(245, 158, 11, 0.4);
      }

      .gauge-percent {
        text-align: right;
        font-size: 8px;
        font-weight: 600;
        opacity: 0.8;
      }

      .evaluation-policy {
        text-align: center;
        margin-bottom: 8px;
      }

      .policy-label {
        font-size: 9px;
        font-weight: 500;
        opacity: 0.8;
        background: rgba(255, 255, 255, 0.1);
        padding: 4px 8px;
        border-radius: 6px;
        backdrop-filter: blur(3px);
      }

      .level-ready-badge {
        text-align: center;
        background: rgba(16, 185, 129, 0.2);
        color: rgba(255, 255, 255, 0.95);
        padding: 6px 12px;
        border-radius: 8px;
        font-size: 10px;
        font-weight: 600;
        backdrop-filter: blur(5px);
        border: 1px solid rgba(16, 185, 129, 0.3);
      }

      .level-ready-section,
      .level-complete-section {
        background: rgba(255, 255, 255, 0.15);
        border-radius: 12px;
        padding: 8px;
        text-align: center;
        margin-bottom: 12px;
        backdrop-filter: blur(5px);
      }

      .ready-badge,
      .complete-badge {
        font-size: 12px;
        font-weight: 600;
      }

      .level-benefits-section {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 12px;
        backdrop-filter: blur(5px);
      }

      .benefits-header {
        margin-bottom: 8px;
      }

      .benefits-title {
        font-size: 12px;
        font-weight: 600;
      }

      .benefits-showcase {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .benefit-card {
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(255, 255, 255, 0.1);
        padding: 8px;
        border-radius: 8px;
        backdrop-filter: blur(3px);
      }

      .benefit-icon {
        font-size: 16px;
        flex-shrink: 0;
      }

      .benefit-details {
        flex: 1;
        min-width: 0;
      }

      .benefit-name {
        font-weight: 600;
        font-size: 11px;
        margin-bottom: 1px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .benefit-value {
        font-size: 10px;
        opacity: 0.8;
        font-weight: 500;
      }

      .more-benefits {
        text-align: center;
        padding: 6px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        font-size: 10px;
        opacity: 0.8;
      }

      /* 단골 현황 요약 스타일 */
      .level-summary-section {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 12px;
        margin-top: 12px;
        backdrop-filter: blur(5px);
        border: 1px solid rgba(255, 255, 255, 0.15);
      }

      .summary-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 6px;
      }

      .summary-icon {
        font-size: 16px;
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
      }

      .summary-title {
        font-size: 12px;
        font-weight: 600;
        color: white;
      }

      .summary-content {
        text-align: center;
      }

      .summary-text {
        font-size: 11px;
        opacity: 0.9;
        font-weight: 500;
        line-height: 1.3;
      }

      @media (max-width: 400px) {
        .loyalty-level-card.compact-card {
          padding: 12px;
          margin: 8px 0;
        }

        .level-name {
          font-size: 16px;
        }

        .level-stats {
          gap: 6px;
        }

        .stat-item {
          padding: 6px 4px;
        }

        .stat-value {
          font-size: 12px;
        }

        .level-icon {
          font-size: 24px;
        }

        .benefits-showcase.welcome-grid {
          grid-template-columns: 1fr;
        }

        .benefit-card.premium-card,
        .benefit-card.welcome-card {
          padding: 10px;
        }

        .benefit-name {
          font-size: 11px;
        }

        .benefit-description {
          font-size: 8px;
        }
      }
    </style>
  `;
}

// 혜택 타입별 아이콘 반환
function getBenefitIcon(type) {
  const iconMap = {
    'discount_coupon': '🏷️',
    'loyalty_coupon': '💳',
    'vip_coupon': '👑',
    'premium_coupon': '💎',
    'free_drink': '🥤',
    'free_side': '🍟',
    'free_upgrade': '⬆️',
    'birthday_gift': '🎂',
    'monthly_free': '📅',
    'priority_service': '⚡',
    'early_access': '🔓',
    'point_multiplier': '⭐',
    'discount_percent': '🔥',
    'free_delivery': '🚚'
  };
  return iconMap[type] || '🎁';
}

// 혜택 상태 표시용 클래스 반환
function getBenefitStatus(type) {
  const statusMap = {
    'vip_coupon': 'vip',
    'premium_coupon': 'premium',
    'loyalty_coupon': 'loyalty',
    'discount_coupon': 'discount',
    'free_drink': 'free',
    'free_side': 'free',
    'free_upgrade': 'upgrade',
    'priority_service': 'priority',
    'birthday_gift': 'special',
    'monthly_free': 'monthly'
  };
  return statusMap[type] || 'standard';
}

// 혜택 이름 포맷팅
function formatBenefitName(type) {
  const nameMap = {
    'discount_coupon': '할인 쿠폰',
    'loyalty_coupon': '단골 할인',
    'vip_coupon': 'VIP 할인',
    'premium_coupon': '프리미엄 할인',
    'free_drink': '무료 음료',
    'free_side': '사이드 메뉴 무료',
    'free_upgrade': '메뉴 업그레이드 무료',
    'priority_service': '우선 서비스',
    'birthday_gift': '생일 특별 선물',
    'monthly_free': '매월 무료 혜택',
    'early_access': '신메뉴 우선 체험',
    'point_multiplier': '추가 포인트 적립',
    'discount_percent': '할인 혜택',
    'free_delivery': '무료 배송'
  };
  return nameMap[type] || '특별 혜택';
}

// 혜택 설명 반환
function getBenefitDescription(benefit) {
  if (benefit.description) return benefit.description;

  const descMap = {
    'vip_coupon': 'VIP 전용 할인 쿠폰',
    'premium_coupon': '프리미엄 할인 쿠폰',
    'loyalty_coupon': '단골 고객 전용 할인',
    'discount_coupon': '매장에서 사용 가능한 할인',
    'free_drink': '음료 1잔 무료 제공',
    'free_side': '사이드 메뉴 무료 제공',
    'free_upgrade': '메뉴 업그레이드 무료',
    'priority_service': '주문 우선 처리',
    'birthday_gift': '생일 특별 선물',
    'monthly_free': '매월 무료 혜택',
    'early_access': '신메뉴 우선 체험',
    'point_multiplier': '추가 포인트 적립',
    'discount_percent': '결제시 할인 적용',
    'free_delivery': '배달비 무료'
  };

  return descMap[benefit.type] || '특별한 혜택을 제공합니다';
}

// 혜택 값 포맷팅
function formatBenefitValue(benefit) {
  if (benefit.discount) {
    return `<span class="value-highlight discount">${benefit.discount}% 할인</span>`;
  }

  if (benefit.point_rate) {
    return `<span class="value-highlight points">+${benefit.point_rate}% 적립</span>`;
  }

  if (benefit.amount) {
    return `<span class="value-highlight amount">${benefit.amount.toLocaleString()}원</span>`;
  }

  if (benefit.type === 'free_drink' || benefit.type === 'free_side') {
    return `<span class="value-highlight free">무료 제공</span>`;
  }

  if (benefit.type === 'priority_service') {
    return `<span class="value-highlight priority">우선 처리</span>`;
  }

  return `<span class="value-highlight standard">특별 혜택</span>`;
}

// 혜택 사용 함수
function useBenefit(benefitType, benefitData) {
  console.log('🎁 혜택 사용:', benefitType, benefitData);

  // 혜택 타입별 처리
  switch(benefitType) {
    case 'vip_coupon':
    case 'premium_coupon':
    case 'loyalty_coupon':
    case 'discount_coupon':
      alert(`${benefitData.name || '할인 쿠폰'}을 장바구니에 적용했습니다!`);
      break;
    case 'free_drink':
    case 'free_side':
      alert(`${benefitData.name || '무료 혜택'}을 주문에 추가했습니다!`);
      break;
    case 'priority_service':
      alert('우선 서비스가 적용되었습니다!');
      break;
    default:
      alert(`${benefitData.name || '혜택'}이 적용되었습니다!`);
  }
}

// 모든 혜택 보기
function showAllBenefits(benefits) {
  console.log('📋 모든 혜택 보기:', benefits);

  const modal = document.createElement('div');
  modal.className = 'benefits-modal-overlay';
  modal.innerHTML = `
    <div class="benefits-modal">
      <div class="modal-header">
        <h3>🎁 모든 혜택</h3>
        <button class="modal-close" onclick="this.closest('.benefits-modal-overlay').remove()">×</button>
      </div>
      <div class="modal-content">
        ${benefits.map(benefit => `
          <div class="modal-benefit-item">
            <span class="modal-benefit-icon">${getBenefitIcon(benefit.type)}</span>
            <div class="modal-benefit-info">
              <div class="modal-benefit-name">${benefit.name || formatBenefitName(benefit.type)}</div>
              <div class="modal-benefit-desc">${getBenefitDescription(benefit)}</div>
              ${benefit.expires_days ? `<div class="modal-benefit-expiry">유효기간: ${benefit.expires_days}일</div>` : ''}
            </div>
            <div class="modal-benefit-value">${formatBenefitValue(benefit)}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

// 레벨에 따른 아이콘 반환
function getLevelIcon(levelRank) {
  const icons = {
    0: '🆕', // 신규
    1: '🥉', // 브론즈
    2: '🥈', // 실버
    3: '🥇', // 골드
    4: '💎', // 플래티넘
    5: '👑'  // 다이아몬드
  };
  return icons[levelRank] || '🆕';
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

// 상위 사용자 데이터 로드
async function loadTopUsersData(store) {
  try {
    console.log(`🏆 매장 ${store.id} 상위 사용자 정보 로드`);

    // 실제 상위 사용자 데이터 조회
    const response = await fetch(`/api/stores/${store.id}/top-users`);
    if (response.ok) {
      const topUsersData = await response.json();

      if (topUsersData.success && topUsersData.users) {
        console.log(`✅ 매장 ${store.id} 상위 사용자 ${topUsersData.users.length}명 로드 완료`);

        // 상위 사용자 카드 UI 업데이트
        updateTopUsersUI(topUsersData.users);
      } else {
        console.log(`⚠️ 매장 ${store.id} 상위 사용자 데이터 없음`);
        updateTopUsersUI([]);
      }
    } else {
      console.error('❌ 상위 사용자 데이터 조회 실패');
      updateTopUsersUI([]);
    }

  } catch (error) {
    console.error('❌ 상위 사용자 데이터 로드 중 오류:', error);
    // 상위 사용자 로드 실패시 기본 안내 메시지 표시
    const topUsersContainer = document.querySelector('.top-users-content');
    if (topUsersContainer) {
      topUsersContainer.innerHTML = `
        <div class="no-top-users">
          <span class="no-users-icon">👤</span>
          <div class="no-users-text">단골 고객 정보를 불러올 수 없습니다</div>
        </div>
      `;
    }
  }

  // 상위 사용자 더보기 버튼에 이벤트 리스너 추가
  setTimeout(() => {
    const topUsersBtn = document.querySelector('.top-users-detail-btn');
    if (topUsersBtn) {
      console.log('🎯 상위 사용자 버튼 이벤트 설정');
      topUsersBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('🏆 상위 사용자 전체 보기 클릭됨');
        showAllTopUsers(store);
      });
    }
  }, 200);
}

// 상위 사용자 UI 업데이트
function updateTopUsersUI(users) {
  const topUsersContainer = document.querySelector('.top-users-content');
  if (!topUsersContainer) return;

  if (!users || users.length === 0) {
    topUsersContainer.innerHTML = `
      <div class="no-top-users-message">
        <span class="no-users-icon">👑</span>
        <div class="no-users-text">아직 단골 고객이 없습니다</div>
      </div>
    `;
    return;
  }

  // 최대 3명의 상위 사용자만 표시
  const displayUsers = users.slice(0, 3);

  topUsersContainer.innerHTML = `
    ${displayUsers.map((user, index) => {
      const rank = index + 1;
      const avatarColor = getAvatarColor(user.name || user.user_name);
      const initial = (user.name || user.user_name || '?').charAt(0).toUpperCase();
      
      return `
        <div class="top-user-item rank-${rank}">
          <div class="rank-badge rank-${rank}">${rank}</div>
          <div class="user-avatar" style="background: ${avatarColor};">
            ${initial}
          </div>
          <div class="user-info">
            <div class="user-name">${user.name || user.user_name || '익명'}</div>
            <div class="user-level">${user.level_name || '브론즈'} 등급</div>
          </div>
          <div class="user-stats">
            <div class="user-stat">
              <span class="stat-icon">🏪</span>
              <span>${user.visit_count || 0}회</span>
            </div>
            <div class="user-stat">
              <span class="stat-icon">💰</span>
              <span>${formatCurrency(user.total_spent || 0)}</span>
            </div>
          </div>
        </div>
      `;
    }).join('')}
    ${users.length > 3 ? `
      <div class="users-expand">
        <button class="top-users-detail-btn" onclick="showAllTopUsers(${JSON.stringify(window.currentStore).replace(/"/g, '&quot;')})">
          더 보기 (+${users.length - 3}명)
        </button>
      </div>
    ` : ''}
  `;
}

// 사용자 아바타 색상 생성
function getAvatarColor(name) {
  const colors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
  ];
  
  const hash = name.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  return colors[Math.abs(hash) % colors.length];
}

// 금액 포맷팅
function formatCurrency(amount) {
  const num = parseFloat(amount) || 0;
  if (num >= 1000000) {
    return `${Math.floor(num / 1000000)}M원`;
  } else if (num >= 1000) {
    return `${Math.floor(num / 1000)}K원`;
  } else {
    return `${num.toLocaleString()}원`;
  }
}

// 모든 상위 사용자 보기
function showAllTopUsers(store) {
  console.log('🏆 상위 사용자 전체 보기:', store.name);
  
  // 여기서 상위 사용자 전체 목록 모달이나 페이지를 표시할 수 있습니다
  alert(`${store.name}의 모든 단골 고객 목록을 보여줍니다. (개발 예정)`);
}

// 전역 함수 등록 (즉시 실행)
(function() {
  console.log('🔧 renderStore 전역 함수 등록 중...');

  window.renderStore = renderStore;
  window.renderTableLayout = renderTableLayout;
  window.loadAndRenderStore = loadAndRenderStore;
  window.loadPromotionData = loadPromotionData;
  window.loadTopUsersData = loadTopUsersData;
  window.loadLoyaltyData = loadLoyaltyData;

  // 혜택 관련 함수들
  window.getBenefitIcon = getBenefitIcon;
  window.getBenefitStatus = getBenefitStatus;
  window.formatBenefitName = formatBenefitName;
  window.getBenefitDescription = getBenefitDescription;
  window.formatBenefitValue = formatBenefitValue;
  window.useBenefit = useBenefit;
  window.showAllBenefits = showAllBenefits;

  // 상위 사용자 관련 함수들
  window.updateTopUsersUI = updateTopUsersUI;
  window.getAvatarColor = getAvatarColor;
  window.formatCurrency = formatCurrency;
  window.showAllTopUsers = showAllTopUsers;

  // 함수 등록 확인
  console.log('✅ renderStore 전역 함수 등록 완료:', typeof window.renderStore);
  console.log('🔍 전역 renderStore 존재 여부:', !!window.renderStore);
  console.log('🎁 전역 혜택 함수들 등록 완료');
})();