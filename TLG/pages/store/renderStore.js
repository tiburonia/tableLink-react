// 모듈 import (전역으로 로드될 것들)
// renderStoreUI.js, storeTabManager.js, tablePanelManager.js, reviewManager.js가 먼저 로드되어야 함

async function renderStore(store) {
  try {
    console.log('🏪 매장 렌더링:', store.name, 'ID:', store.id);

    // CSS 먼저 로드
    if (window.CSSLoader) {
      await window.CSSLoader.loadModuleCSS('store');
      console.log('✅ 매장 관련 CSS 로드 완료');
    }

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

    // CSS 로딩 확인
    if (window.StoreUIManager && typeof window.StoreUIManager.loadStoreStyles === 'function') {
      window.StoreUIManager.loadStoreStyles();
    }

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
    updatePromotionUI([]);
  }

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

// 프로모션 UI 업데이트
function updatePromotionUI(promotions) {
  const promotionContainer = document.querySelector('.promotion-content');
  if (!promotionContainer) return;

  if (!promotions || promotions.length === 0) {
    promotionContainer.innerHTML = `
      <div class="no-promotion">
        <span class="no-promotion-icon">📭</span>
        <div class="no-promotion-text">현재 진행중인 혜택이 없습니다</div>
      </div>
    `;
    return;
  }

  // 최대 2개의 프로모션만 표시
  const displayPromotions = promotions.slice(0, 2);
  
  promotionContainer.innerHTML = displayPromotions.map((promotion, index) => `
    <div class="promotion-item ${index === 0 ? 'featured' : ''}">
      <div class="promotion-left">
        <span class="promotion-icon">${getPromotionIcon(promotion.type)}</span>
        <div class="promotion-info">
          <div class="promotion-name">${promotion.name}</div>
          <div class="promotion-desc">${promotion.description}</div>
        </div>
      </div>
      <div class="promotion-discount">${formatDiscountValue(promotion)}</div>
    </div>
  `).join('') + (promotions.length > 2 ? `
    <div class="promotion-more">
      <button class="promotion-detail-btn">더 보기 (+${promotions.length - 2})</button>
    </div>
  ` : '');
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

// 단골 레벨 카드 UI 업데이트 (실제 매장 화면의 카드 형태로)
function updateLoyaltyCardUI(levelData, store) {
  const loyaltyContainer = document.querySelector('.loyalty-levels-grid');
  if (!loyaltyContainer) return;

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
  
  // 다음 레벨 정보
  const nextLevelName = nextLevel?.name || '단골 고객';
  const progressPercent = progress.percentage || 0;
  const visitsNeeded = progress.visits_needed || (nextLevel?.requiredVisitCount || 5);
  const spendingNeeded = progress.spending_needed || 0;

  // 레벨별 색상 설정
  const levelColors = {
    0: 'linear-gradient(135deg, #95a5a6, #7f8c8d)', // 신규 - 그레이
    1: 'linear-gradient(135deg, #cd7f32, #8b4513)', // 브론즈
    2: 'linear-gradient(135deg, #c0c0c0, #a8a8a8)', // 실버
    3: 'linear-gradient(135deg, #ffd700, #daa520)', // 골드
    4: 'linear-gradient(135deg, #e5e4e2, #b8860b)', // 플래티넘
  };

  loyaltyContainer.innerHTML = `
    <div class="loyalty-level-card ${currentLevelRank > 0 ? 'active' : 'inactive'}" 
         style="background: ${levelColors[currentLevelRank] || levelColors[0]}">
      <div class="level-header">
        <div class="level-icon">${getLevelIcon(currentLevelRank)}</div>
        <div class="level-info">
          <div class="level-name">${currentLevelName}</div>
          <div class="level-stats">
            <span>${visitCount}회 방문</span>
            <span>⭐ ${points.toLocaleString()}P</span>
            <span>💰 ${totalSpent.toLocaleString()}원</span>
          </div>
        </div>
      </div>
      
      ${nextLevel ? `
        <div class="level-progress">
          <div class="progress-info">
            <span>다음: ${nextLevelName}</span>
            <span>${progressPercent}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progressPercent}%"></div>
          </div>
          <div class="progress-requirements">
            ${visitsNeeded > 0 ? `<span>방문 ${visitsNeeded}회 더</span>` : ''}
            ${spendingNeeded > 0 ? `<span>결제 ${spendingNeeded.toLocaleString()}원 더</span>` : ''}
          </div>
        </div>
      ` : `
        <div class="level-complete">
          <span class="complete-badge">🏆 최고 등급 달성!</span>
        </div>
      `}
      
      ${level?.benefits && level.benefits.length > 0 ? `
        <div class="level-benefits">
          <div class="benefits-title">🎁 현재 혜택</div>
          <div class="benefits-grid">
            ${level.benefits.map(benefit => `
              <div class="benefit-item">
                <span class="benefit-icon">${getBenefitIcon(benefit.type)}</span>
                <div class="benefit-content">
                  <div class="benefit-name">${benefit.name}</div>
                  ${benefit.discount ? `<div class="benefit-value">${benefit.discount}% 할인</div>` : ''}
                  ${benefit.expires_days ? `<div class="benefit-expire">${benefit.expires_days}일간 유효</div>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : `
        <div class="level-benefits">
          <div class="benefits-title">🎁 신규 고객 혜택</div>
          <div class="benefits-grid">
            <div class="benefit-item">
              <span class="benefit-icon">🎉</span>
              <div class="benefit-content">
                <div class="benefit-name">첫방문 환영 혜택</div>
                <div class="benefit-value">특별 서비스</div>
              </div>
            </div>
            <div class="benefit-item">
              <span class="benefit-icon">💝</span>
              <div class="benefit-content">
                <div class="benefit-name">신규 고객 할인</div>
                <div class="benefit-value">첫 주문 혜택</div>
              </div>
            </div>
          </div>
        </div>
      `}
    </div>
    
    <style>
      .loyalty-level-card {
        border-radius: 20px;
        padding: 24px;
        margin: 20px 0;
        color: white;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
        position: relative;
        overflow: hidden;
      }
      
      .loyalty-level-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        z-index: -1;
      }
      
      .level-header {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 20px;
      }
      
      .level-icon {
        font-size: 32px;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
      }
      
      .level-info {
        flex: 1;
      }
      
      .level-name {
        font-size: 22px;
        font-weight: 700;
        margin-bottom: 8px;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      }
      
      .level-stats {
        display: flex;
        gap: 12px;
        font-size: 13px;
        opacity: 0.9;
        flex-wrap: wrap;
      }
      
      .level-stats span {
        background: rgba(255, 255, 255, 0.2);
        padding: 4px 8px;
        border-radius: 12px;
        backdrop-filter: blur(5px);
      }
      
      .level-progress {
        margin-bottom: 20px;
      }
      
      .progress-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        font-weight: 600;
      }
      
      .progress-bar {
        height: 8px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 8px;
      }
      
      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #fff, #f0f8ff);
        border-radius: 4px;
        transition: width 0.3s ease;
      }
      
      .progress-requirements {
        display: flex;
        gap: 12px;
        font-size: 12px;
        opacity: 0.9;
        flex-wrap: wrap;
      }
      
      .progress-requirements span {
        background: rgba(255, 255, 255, 0.2);
        padding: 2px 8px;
        border-radius: 10px;
      }
      
      .level-complete {
        text-align: center;
        margin: 20px 0;
      }
      
      .complete-badge {
        background: rgba(255, 255, 255, 0.2);
        padding: 8px 16px;
        border-radius: 20px;
        font-weight: 600;
        backdrop-filter: blur(10px);
      }
      
      .benefits-title {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 12px;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      }
      
      .benefits-grid {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .benefit-item {
        display: flex;
        align-items: center;
        gap: 12px;
        background: rgba(255, 255, 255, 0.15);
        padding: 12px;
        border-radius: 12px;
        backdrop-filter: blur(5px);
      }
      
      .benefit-icon {
        font-size: 20px;
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
      }
      
      .benefit-content {
        flex: 1;
      }
      
      .benefit-name {
        font-weight: 600;
        font-size: 14px;
        margin-bottom: 2px;
      }
      
      .benefit-value {
        font-size: 12px;
        opacity: 0.9;
        font-weight: 500;
      }
      
      .benefit-expire {
        font-size: 11px;
        opacity: 0.7;
        margin-top: 2px;
      }
      
      @media (max-width: 400px) {
        .loyalty-level-card {
          padding: 18px;
          margin: 16px 0;
        }
        
        .level-name {
          font-size: 18px;
        }
        
        .level-stats {
          font-size: 12px;
          gap: 8px;
        }
        
        .benefit-item {
          padding: 10px;
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
    'early_access': '🔓'
  };
  return iconMap[type] || '🎁';
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