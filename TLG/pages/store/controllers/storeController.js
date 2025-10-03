// 매장 컨트롤러 - 이벤트 처리 및 흐름 제어
let storeService, storeView;

async function ensureModulesLoaded() {
  if (!storeService || !storeView) {
    try {
      const serviceModule = await import('../services/storeService.js');
      const viewModule = await import('../views/storeView.js');
      storeService = serviceModule.storeService;
      storeView = viewModule.storeView;
      
      if (!storeService || !storeView) {
        throw new Error('모듈 로드 후에도 storeService 또는 storeView가 undefined입니다');
      }
      
      console.log('✅ Store 모듈 로드 완료:', { hasService: !!storeService, hasView: !!storeView });
    } catch (error) {
      console.error('❌ Store 모듈 임포트 실패:', error);
      throw error;
    }
  }
}

export const storeController = {
  // 상태 관리
  state: {
    currentStore: null,
    isInitialized: false,
    activeTab: 'menu'
  },

  /**
   * 매장 렌더링 메인 함수 - API 요청 후 렌더링
   */
  async renderStore(storeData) {
    console.log('🏪 storeController.renderStore 호출:', storeData?.name, 'ID:', storeData?.id);

    try {
      // 모듈 로드 확인
      await ensureModulesLoaded();
      
      let store;

      if (storeData && storeData.store_id) {
        const storeId = storeData.store_id;
        // API 응답이 이미 표준화되어 있으므로 그대로 사용
        store = await this.fetchStoreData(storeId);
      } else {
        throw new Error('매장 ID 또는 매장 데이터가 필요합니다');
      }

      // View를 통한 UI 렌더링
      storeView.renderStoreHTML(store);

      // 매장 추가 정보 로드 (동기적으로 처리)
      await this.loadStoreAdditionalInfo(store);

      // 공지사항 로드 (동기적으로 처리)
      await this.loadStoreNotices(store);

      // 홈 탭 초기 렌더링 (storeTabController 사용)
      const { storeTabController } = await import('./storeTabController.js');
      const storeContent = document.getElementById('storeContent');
      const homeTabBtn = document.querySelector('[data-tab="home"]')
      if (storeContent && storeTabController) {
        await storeTabController.renderHomeTab(store, storeContent);
        homeTabBtn.classList.add('active')
      }

      // 추가 데이터 로드 및 업데이트 (비동기)
      this.loadAdditionalData(store);

      console.log('✅ 매장 렌더링 완료:', store.name);

    } catch (error) {
      console.error('❌ 매장 렌더링 실패:', error);
      
      // storeView가 없는 경우 직접 에러 표시
      if (storeView && typeof storeView.showError === 'function') {
        storeView.showError(error.message);
      } else {
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
  },

  /**
   * API에서 매장 데이터 가져오기
   */
  async fetchStoreData(storeId) {
    console.log(`🔍 매장 ${storeId} API 데이터 요청 시작`);

    try {
      // 사용자 정보 가져오기
      const userInfo = window.getUserInfoSafely ? window.getUserInfoSafely() : null;
      const userId = userInfo?.userId || userInfo?.id;

      // API 요청 URL 구성
      let apiUrl = `/api/stores/${storeId}`;
      if (userId) {
        apiUrl += `?userId=${userId}`;
      }

      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success || !data.store) {
        throw new Error(data.error || '매장 정보를 불러올 수 없습니다');
      }

      console.log(`✅ 매장 ${storeId} API 데이터 로드 완료`);
      return data.store;

    } catch (error) {
      console.error(`❌ 매장 ${storeId} API 요청 실패:`, error);
      throw error;
    }
  },

  /**
   * 이벤트 리스너 설정
   */
  setupEventListeners(store) {
    try {
      console.log('🔧 이벤트 리스너 설정 시작...');

      // 즐겨찾기 버튼
      this.setupFavoriteButton(store);

      // 리뷰 링크
      this.setupReviewEvents(store);

      // TLL 버튼 (QR 주문)
      this.setupTLLButton(store);

      // 탭 네비게이션
      this.setupTabNavigation(store);

      // 패널 핸들링
      this.setupPanelHandling();

      // 테이블 관련 이벤트
      this.setupTableEvents(store);

      console.log('✅ 모든 이벤트 리스너 설정 완료');
    } catch (error) {
      console.error('❌ 이벤트 리스너 설정 실패:', error);
    }
  },

  /**
   * 즐겨찾기 버튼 이벤트
   */
  setupFavoriteButton(store) {
    const favoriteBtn = document.getElementById('favoriteBtn');
    if (favoriteBtn) {
      favoriteBtn.addEventListener('click', () => {
        if (typeof toggleFavorite === 'function') {
          toggleFavorite(store);
        }
      });

      // 즐겨찾기 버튼 초기화
      this.initializeFavoriteButton(store);
    }
  },

  /**
   * 즐겨찾기 버튼 초기화
   */
  async initializeFavoriteButton(store) {
    try {
      const { favoriteController } = await import('./favoriteController.js');
      await favoriteController.initializeFavoriteButton(store);
    } catch (error) {
      console.warn('⚠️ 즐겨찾기 컨트롤러 로드 실패:', error);
    }
  },

  /**
   * 리뷰 관련 이벤트
   */
  setupReviewEvents(store) {
    const reviewLink = document.getElementById('reviewLink');
    if (reviewLink) {
      reviewLink.addEventListener('click', () => {
        if (typeof renderAllReview === 'function') {
          renderAllReview(store);
        }
      });
    }

    const reviewSeeMoreBtns = document.getElementsByClassName('see-more-btn');
    if (reviewSeeMoreBtns && reviewSeeMoreBtns.length > 0) {
      reviewSeeMoreBtns[0].addEventListener('click', () => {
        if (typeof renderAllReview === 'function') {
          renderAllReview(store);
        }
      });
    }
  },

  /**
   * TLL 버튼 이벤트 (QR 주문)
   */
  setupTLLButton(store) {
    const tllButton = document.getElementById('TLL');
    if (tllButton) {
      tllButton.removeAttribute('onclick');
      tllButton.addEventListener('click', async () => {
        try {
          console.log(`🎯 TLL 버튼 클릭 - 매장 ${store.name} 선택`);

          const normalizedStore = {
            id: store.id,
            store_id: store.id,
            name: store.name,
            category: store.category || '기타',
            address: store.address || '주소 정보 없음',
            isOpen: store.isOpen !== false,
            menu: Array.isArray(store.menu) ? store.menu : []
          };

          // 전역 저장
          window.preselectedStoreForTLL = normalizedStore;
          window.selectedStore = normalizedStore;
          window.currentStoreForTLL = normalizedStore;

          if (typeof window.TLL === 'function') {
            await window.TLL(normalizedStore);
          } else if (typeof TLL === 'function') {
            await TLL(normalizedStore);
          } else {
            await this.loadTLLScript(normalizedStore);
          }
        } catch (error) {
          console.error('❌ TLL 실행 실패:', error);
          alert('QR 주문 시스템 실행 중 오류가 발생했습니다.');
        }
      });
    }
  },

  /**
   * TLL 스크립트 동적 로드
   */
  async loadTLLScript(store) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = '/TLG/utils/TLL.js';

      script.onload = async () => {
        setTimeout(async () => {
          try {
            if (typeof window.TLL === 'function') {
              await window.TLL(store);
              resolve();
            } else {
              reject(new Error('TLL 함수를 찾을 수 없습니다'));
            }
          } catch (error) {
            reject(error);
          }
        }, 100);
      };

      script.onerror = () => reject(new Error('TLL.js 스크립트 로드 실패'));
      document.head.appendChild(script);
    });
  },

  /**
   * 탭 네비게이션 설정
   */
  async setupTabNavigation(store) {
    // 동적으로 storeTabController 로드
    const { storeTabController } = await import('./storeTabController.js');
    storeTabController.initializeTabNavigation(store);
  },

  /**
   * 패널 핸들링 설정 (레이어드 아키텍처)
   */
  async setupPanelHandling() {
    console.log('🔧 패널 핸들링 설정 시작 (레이어드 아키텍처)...');

    // DOM이 준비될 때까지 대기
    setTimeout(async () => {
      try {
        // 동적으로 panelController 로드
        const { panelController } = await import('./panelController.js');
        panelController.initializePanelHandling();
      } catch (error) {
        console.error('❌ 패널 컨트롤러 로드 실패:', error);
        // 폴백으로 레거시 매니저 사용
        if (window.StorePanelManager && typeof window.StorePanelManager.initializePanelHandling === 'function') {
          console.log('🔄 폴백: StorePanelManager 사용');
          window.StorePanelManager.initializePanelHandling();
        } else {
          this.setupFallbackScrolling();
        }
      }
    }, 100);
  },

  /**
   * 폴백 스크롤 설정
   */
  setupFallbackScrolling() {
    console.log('🔄 폴백 스크롤 설정 시작...');

    const storePanelContainer = document.getElementById('storePanelContainer');
    if (storePanelContainer) {
      storePanelContainer.style.overflowY = 'auto';
      storePanelContainer.style.overflowX = 'hidden';
      storePanelContainer.style.webkitOverflowScrolling = 'touch';
      storePanelContainer.style.height = 'calc(100% - 24px)';

      console.log('✅ 폴백 스크롤 설정 완료');
    } else {
      console.warn('⚠️ storePanelContainer를 찾을 수 없습니다');
    }
  },

  /**
   * 테이블 관련 이벤트
   */
  setupTableEvents(store) {
    const tlrContainer = document.getElementById('TLR');
    if (tlrContainer) {
      tlrContainer.addEventListener('click', () => {
        if (window.TableInfoManager && typeof window.TableInfoManager.loadTableInfo === 'function') {
          window.TableInfoManager.loadTableInfo(store);
        }
      });
    }

    this.setupTableDetailToggle();
    this.setupTableActions(store);
  },

  /**
   * 테이블 상세 토글 버튼
   */
  setupTableDetailToggle() {
    const tableDetailToggleBtn = document.getElementById('tableDetailToggleBtn');
    const tableDetailContent = document.getElementById('tableDetailContent');

    if (tableDetailToggleBtn && tableDetailContent && !tableDetailToggleBtn.hasAttribute('data-event-set')) {
      tableDetailToggleBtn.setAttribute('data-event-set', 'true');
      tableDetailToggleBtn.addEventListener('click', () => {
        const isExpanded = tableDetailContent.style.display !== 'none';

        if (isExpanded) {
          tableDetailContent.classList.remove('show');
          setTimeout(() => {
            tableDetailContent.style.display = 'none';
          }, 300);
          tableDetailToggleBtn.classList.remove('expanded');
          tableDetailToggleBtn.querySelector('.toggle-text').textContent = '테이블 현황 자세히 보기';
        } else {
          tableDetailContent.style.display = 'block';
          setTimeout(() => {
            tableDetailContent.classList.add('show');
          }, 10);
          tableDetailToggleBtn.classList.add('expanded');
          tableDetailToggleBtn.querySelector('.toggle-text').textContent = '테이블 현황 간단히 보기';
        }
      });
    }
  },

  /**
   * 테이블 액션 버튼들
   */
  setupTableActions(store) {
    const manualRefreshBtn = document.getElementById('manualRefreshBtn');
    if (manualRefreshBtn && !manualRefreshBtn.hasAttribute('data-event-set')) {
      manualRefreshBtn.setAttribute('data-event-set', 'true');
      manualRefreshBtn.addEventListener('click', async () => {
        console.log('🔄 테이블 수동 새로고침 버튼 클릭');
        // forceRefresh=true로 API 강제 호출
        await this.loadTableInfo(this.state.currentStore, true);
      });
    }
  },

  /**
   * 추가 데이터 로드 (비동기)
   */
  loadAdditionalData(store) {
    console.log('📊 추가 데이터 로드 시작...');

    // 상태 저장
    this.state.currentStore = store;

    // 이벤트 리스너 설정
    this.setupEventListeners(store);

    // 리뷰 데이터 로드
    this.loadReviewData(store).catch(error => console.warn('⚠️ 리뷰 데이터 로드 실패:', error));

    // 프로모션 데이터 로드
    this.loadPromotionData(store).catch(error => console.warn('⚠️ 프로모션 데이터 로드 실패:', error));

    // 단골 레벨 데이터 로드
    this.loadLoyaltyData(store).catch(error => console.warn('⚠️ 단골 레벨 데이터 로드 실패:', error));

    // 상위 사용자 데이터 로드
    this.loadTopUsersData(store).catch(error => console.warn('⚠️ 상위 사용자 데이터 로드 실패:', error));

    // 테이블 정보 로드
    this.loadTableInfo(store);

    // 첫 화면(메뉴 탭) 설정
    this.setInitialTab(store);

    console.log('✅ 추가 데이터 로드 완료');
  },


  /**
   * 리뷰 데이터 로드
   */
  async loadReviewData(store) {
    try {
      // 실시간 별점 정보 업데이트
      const ratingData = await storeService.getStoreRating(store.id);
      if (ratingData) {
        store.ratingAverage = ratingData.ratingAverage;
        store.reviewCount = ratingData.reviewCount;
        storeView.updateRatingDisplay(ratingData.ratingAverage);
      }

      // 리뷰 미리보기 설정
      await this.setupReviewPreview(store);
    } catch (error) {
      console.warn('⚠️ 리뷰 데이터 로드 실패:', error);
    }
  },

  /**
   * 프로모션 데이터 로드
   */
  async loadPromotionData(store) {
    try {
      const promotions = await storeService.getPromotions(store.id);
      storeView.updatePromotionUI(promotions);
    } catch (error) {
      console.warn('⚠️ 프로모션 데이터 로드 실패:', error);
    }
  },

  /**
   * 단골 레벨 데이터 로드
   */
  async loadLoyaltyData(store) {
    try {
      const userInfo = window.cacheManager ? window.cacheManager.getUserInfo() : window.userInfo;

      if (userInfo && window.RegularLevelManager) {
        const levelData = await window.RegularLevelManager.getUserRegularLevel(userInfo.id, store.id);
        storeView.updateLoyaltyUI(levelData, store);
      } else {
        storeView.updateLoyaltyUI(null, store);
      }
    } catch (error) {
      console.warn('⚠️ 단골 레벨 데이터 로드 실패:', error);
    }
  },

  /**
   * 상위 사용자 데이터 로드
   */
  async loadTopUsersData(store) {
    try {
      const topUsers = await storeService.getTopUsers(store.id);
      storeView.updateTopUsersUI(topUsers);
    } catch (error) {
      console.warn('⚠️ 상위 사용자 데이터 로드 실패:', error);
    }
  },

  /**
   * 테이블 정보 로드 (레이어드 아키텍처)
   * @param {Object} store - 매장 객체
   * @param {boolean} forceRefresh - 강제 새로고침 여부
   */
  async loadTableInfo(store, forceRefresh = false) {
    try {
      // Service Layer를 통한 데이터 로딩 및 계산
      const tableService = await import('../services/tableService.js').then(m => m.tableService);
      const tableStatusView = await import('../views/tableStatusView.js').then(m => m.tableStatusView);

      setTimeout(async () => {
        const tableInfo = await tableService.loadTableInfo(store, forceRefresh);
        tableStatusView.updateTableInfoUI(tableInfo);
      }, 500);
    } catch (error) {
      console.error('❌ 테이블 정보 로드 실패:', error);
      throw error;
    }
  },

  /**
   * 초기 탭 설정
   */
  setInitialTab(store) {
    setTimeout(() => {
      if (window.StoreTabManager && typeof window.StoreTabManager.renderStoreTab === 'function') {
        window.StoreTabManager.renderStoreTab('menu', store);

        const menuBtn = document.querySelector('[data-tab="menu"]');
        if (menuBtn) {
          menuBtn.classList.add('active');
        }
      }
    }, 200);
  },

  /**
   * 상태 초기화
   */
  reset() {
    console.log('🔄 Store Controller 상태 초기화');
    this.state.currentStore = null;
    this.state.isInitialized = false;
    this.state.activeTab = 'menu';
  },

  /**
   * 리뷰 미리보기 설정
   */
  async setupReviewPreview(store) {
    // 동적으로 reviewPreviewController 로드
    const { reviewPreviewController } = await import('./reviewPreviewController.js');
    await reviewPreviewController.renderTopReviews(store);
  },

  /**
   * 매장 추가 정보 로드
   */
  async loadStoreAdditionalInfo(store) {
    try {
      const { storeInfoService } = await import('../services/storeInfoService.js');
      const { storeAdditionalInfoHTML } = await import('../views/modules/storeAdditionalInfoHTML.js');

      const additionalInfo = await storeInfoService.getStoreAdditionalInfo(store);
      
      const container = document.querySelector('.store-additional-info-section');
      if (container) {
        container.innerHTML = storeAdditionalInfoHTML.render(additionalInfo);
        console.log('✅ 매장 추가 정보 렌더링 완료');
      }
    } catch (error) {
      console.error('❌ 매장 추가 정보 로드 실패:', error);
    }
  },

  /**
   * 공지사항 로드
   */
  async loadStoreNotices(store) {
    try {
      const { storeInfoService } = await import('../services/storeInfoService.js');
      const { storeNoticeHTML } = await import('../views/modules/storeNoticeHTML.js');

      const notices = await storeInfoService.getStoreNotices(store);
      
      const container = document.getElementById('storeNoticeContainer');
      if (container) {
        container.innerHTML = storeNoticeHTML.render(notices);
        console.log('✅ 공지사항 렌더링 완료');
      }
    } catch (error) {
      console.error('❌ 공지사항 로드 실패:', error);
    }
  },
};

// 전역 등록
window.storeController = storeController;