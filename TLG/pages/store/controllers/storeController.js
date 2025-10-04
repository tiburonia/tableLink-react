import { storeTabService } from '../services/storeTabService.js';
import { storeTabController } from './storeTabController.js';

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
    activeTab: 'menu',
    globalDelegationInitialized: false
  },

  /**
   * 매장 렌더링 메인 함수 - 오케스트레이션만 담당
   */
  async renderStore(storeData) {
    console.log('🏪 storeController.renderStore 호출:', storeData?.name, 'ID:', storeData?.id);

    try {
      await ensureModulesLoaded();

      const storeId = storeData.store_id || storeData.id;
      if (!storeId) {
        throw new Error('매장 ID가 없습니다');
      }

      // Service Layer를 통한 데이터 페칭
      const { storeLifecycleService } = await import('../services/storeLifecycleService.js');
      const { storeAdditionalInfoHTML } = await import('../views/modules/storeAdditionalInfoHTML.js');
      const { storeNoticeHTML } = await import('../views/modules/storeNoticeHTML.js');
      const { storeTabController } = await import('./storeTabController.js');

      const userInfo = window.AuthManager?.getUserInfo?.() || null;
      const userId = userInfo?.userId || userInfo?.id;

      console.log(`🔍 매장 ${storeId} 통합 API 호출 중...`);
      const store = await storeLifecycleService.fetchStoreData(storeId, userId);

      if (!store || !store.id) {
        throw new Error('매장 데이터를 찾을 수 없습니다');
      }

      // View 렌더링
      storeView.renderStoreHTML(store);

      // 초기화 데이터 병렬 로드
      const { additionalInfo, notices } = await storeLifecycleService.initializeStoreData(store);

      //store additional info section UI 업데이트 (공지사항 포함)
      const additionalInfoContainer = document.querySelector('.store-additional-info-section');
      if (additionalInfoContainer) {
        additionalInfoContainer.innerHTML = storeAdditionalInfoHTML.render(additionalInfo, notices);
      }

      // 홈 탭 렌더링
      const storeContent = document.getElementById('storeContent');
      const homeTabBtn = document.querySelector('[data-tab="home"]');
      if (storeContent && storeTabController) {
        await storeTabController.renderHomeTab(store, storeContent);
        homeTabBtn?.classList.add('active');
      }

      // 상태 저장 및 이벤트 설정
      this.state.currentStore = store;
      this.setupEventListeners(store);

      console.log('✅ 매장 렌더링 완료:', store.name);

    } catch (error) {
      console.error('❌ 매장 렌더링 실패:', error);
      this.showError(error.message);
    }
  },

  /**
   * 에러 표시 (View Layer)
   */
  showError(message) {
    if (storeView && typeof storeView.showError === 'function') {
      storeView.showError(message);
    } else {
      const main = document.getElementById('main');
      if (main) {
        main.innerHTML = `
          <div style="padding: 20px; text-align: center; color: #666;">
            <h2>🚫 매장을 불러올 수 없습니다</h2>
            <p style="color: #999; margin: 10px 0;">${message}</p>
            <button data-action="back-to-map" style="
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
  },


  /**
   * 이벤트 리스너 설정
   */
  async setupEventListeners(store) {
    try {
      console.log('🔧 이벤트 리스너 설정 시작...');

      // Service Layer 로드
      const { storeEventService } = await import('../services/storeEventService.js');

      // 전역 이벤트 위임 (보안을 위해 data-action 사용)
      this.setupGlobalEventDelegation(store);

      // 뒤로가기 버튼
      this.setupBackButton();

      // 즐겨찾기 버튼 (favoriteController로 위임)
      this.setupFavoriteButton(store);

      // 리뷰 링크
      this.setupReviewEvents(store, storeEventService);

      // TLL 버튼 (tllController로 위임)
      this.setupTLLButton(store);

      // 탭 네비게이션
      this.setupTabNavigation(store);

      // 패널 핸들링
      this.setupPanelHandling(storeEventService);

      // 테이블 관련 이벤트
      this.setupTableEvents(store, storeEventService);

      console.log('✅ 모든 이벤트 리스너 설정 완료');
    } catch (error) {
      console.error('❌ 이벤트 리스너 설정 실패:', error);
    }
  },

  /**
   * 전역 이벤트 위임 (data-action 기반)
   * Idempotent: 한 번만 등록되도록 보장
   */
  setupGlobalEventDelegation(store) {
    // 이미 초기화되었다면 스킵
    if (this.state.globalDelegationInitialized) {
      console.log('✅ 전역 이벤트 위임이 이미 초기화되어 있습니다');
      return;
    }

    document.addEventListener('click', async (e) => {
      const target = e.target.closest('[data-action]');
      if (!target) return;

      const action = target.dataset.action;

      // 현재 매장 정보 가져오기 (최신 상태 사용)
      const currentStore = this.state.currentStore || window.currentStore || store;

      switch (action) {
        case 'back-to-map':
          e.preventDefault();
          if (typeof window.renderMap === 'function') {
            await window.renderMap();
          }
          break;

        case 'show-all-reviews':
          e.preventDefault();
          if (typeof window.renderAllReview === 'function') {
            window.renderAllReview(currentStore);
          } else {
            console.error('❌ renderAllReview 함수를 찾을 수 없습니다');
          }
          break;

        case 'write-review':
          e.preventDefault();
          if (typeof window.renderReviewWrite === 'function') {
            window.renderReviewWrite(currentStore);
          } else {
            console.warn('⚠️ 리뷰 작성 기능은 준비 중입니다');
          }
          break;

        case 'filter-menu-category':
          e.preventDefault();
          const category = target.dataset.category;
          const storeId = target.dataset.storeId;
          if (window.menuTabView && typeof window.menuTabView.filterByCategory === 'function') {
            window.menuTabView.filterByCategory(category, storeId);
          }
          break;

        case 'show-table-layout':
          e.preventDefault();
          if (typeof window.renderTableLayout === 'function') {
            window.renderTableLayout(currentStore);
          } else {
            console.warn('⚠️ 테이블 배치도 기능은 준비 중입니다');
          }
          break;

        case 'show-reservation':
          e.preventDefault();
          if (typeof window.renderReservationScreen === 'function') {
            window.renderReservationScreen(currentStore);
          } else {
            console.warn('⚠️ 예약 기능은 준비 중입니다');
          }
          break;

        case 'go-back-from-review':
          e.preventDefault();
          if (typeof window.goBackFromReview === 'function') {
            window.goBackFromReview();
          } else if (typeof window.renderStore === 'function' && window.currentStore) {
            window.renderStore(window.currentStore);
          }
          break;

        case 'back-to-mypage':
          e.preventDefault();
          if (typeof window.renderMyPage === 'function') {
            window.renderMyPage();
          }
          break;

        case 'show-promotion-detail':
          e.preventDefault();
          if (typeof window.loadPromotionDetails === 'function') {
            window.loadPromotionDetails(currentStore);
          }
          break;

        case 'handle-reorder':
          e.preventDefault();
          const orderId = target.dataset.orderId;
          if (typeof window.handleReorder === 'function') {
            window.handleReorder(orderId);
          }
          break;

        case 'view-payment-receipt':
          e.preventDefault();
          const paymentId = target.dataset.paymentId;
          if (typeof window.viewPaymentReceipt === 'function') {
            window.viewPaymentReceipt(paymentId);
          }
          break;

        case 'request-refund':
          e.preventDefault();
          const refundPaymentId = target.dataset.paymentId;
          if (typeof window.requestRefund === 'function') {
            window.requestRefund(refundPaymentId);
          }
          break;

        case 'end-session':
          e.preventDefault();
          const sessionOrderId = target.dataset.orderId;
          if (typeof window.endSession === 'function') {
            window.endSession(sessionOrderId);
          }
          break;

        case 'print-receipt':
          e.preventDefault();
          const receiptPaymentId = target.dataset.paymentId;
          if (typeof window.printReceipt === 'function') {
            window.printReceipt(receiptPaymentId);
          }
          break;

        case 'close-modal':
          e.preventDefault();
          const modal = target.closest('.modal-overlay');
          if (modal) {
            modal.remove();
          }
          break;

        case 'edit-review':
          e.preventDefault();
          const reviewId = target.dataset.reviewId;
          const reviewContent = target.dataset.reviewContent;
          const reviewScore = target.dataset.reviewScore;
          if (typeof window.editMyReview === 'function') {
            window.editMyReview(reviewId, reviewContent, reviewScore);
          }
          break;

        case 'delete-review':
          e.preventDefault();
          const deleteReviewId = target.dataset.reviewId;
          if (typeof window.deleteMyReview === 'function') {
            window.deleteMyReview(deleteReviewId);
          }
          break;

        case 'back-to-store':
          e.preventDefault();
          if (typeof window.renderStore === 'function' && window.currentStore) {
            window.renderStore(window.currentStore);
          }
          break;
      }
    });

    // 초기화 완료 플래그 설정
    this.state.globalDelegationInitialized = true;
    console.log('✅ 전역 이벤트 위임 초기화 완료 (Idempotent)');
  },

  /**
   * 뒤로가기 버튼
   */
  setupBackButton() {
    const backBtn = document.getElementById('backBtn');
    if (backBtn && !backBtn.hasAttribute('data-event-set')) {
      backBtn.setAttribute('data-event-set', 'true');
      backBtn.addEventListener('click', async () => {
        if (typeof window.renderMap === 'function') {
          await window.renderMap();
        }
      });
    }
  },

  /**
   * 즐겨찾기 버튼 이벤트 (favoriteController로 위임)
   */
  async setupFavoriteButton(store) {
    try {
      const { favoriteController } = await import('./favoriteController.js');
      const favoriteBtn = document.getElementById('favoriteBtn');

      if (favoriteBtn) {
        favoriteBtn.addEventListener('click', () => {
          favoriteController.toggleFavorite(store);
        });

        // 즐겨찾기 버튼 초기화
        await favoriteController.initializeFavoriteButton(store);
      }
    } catch (error) {
      console.warn('⚠️ 즐겨찾기 컨트롤러 로드 실패:', error);
    }
  },

  /**
   * 리뷰 관련 이벤트 (Service Layer 사용)
   */
  setupReviewEvents(store, storeEventService) {
    const reviewLink = document.getElementById('reviewLink');
    if (reviewLink) {
      reviewLink.addEventListener('click', () => {
        storeEventService.showAllReviews(store);
      });
    }

    const reviewSeeMoreBtns = document.getElementsByClassName('see-more-btn');
    if (reviewSeeMoreBtns && reviewSeeMoreBtns.length > 0) {
      reviewSeeMoreBtns[0].addEventListener('click', () => {
        storeEventService.showAllReviews(store);
      });
    }
  },

  /**
   * TLL 버튼 이벤트 (tllController로 위임)
   */
  async setupTLLButton(store) {
    try {
      const { tllController } = await import('./tllController.js');
      const tllButton = document.getElementById('TLL');

      if (tllButton) {
        tllButton.removeAttribute('onclick');
        tllButton.addEventListener('click', async () => {
          await tllController.startTLLOrder(store);
        });
      }
    } catch (error) {
      console.warn('⚠️ TLL 컨트롤러 로드 실패:', error);
    }
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
  async setupPanelHandling(storeEventService) {
    console.log('🔧 패널 핸들링 설정 시작 (레이어드 아키텍처)...');

    // DOM이 준비될 때까지 대기
    setTimeout(async () => {
      try {
        // 동적으로 panelController 로드
        const { panelController } = await import('./panelController.js');
        panelController.initializePanelHandling();
      } catch (error) {
        console.error('❌ 패널 컨트롤러 로드 실패:', error);
        // 폴백으로 Service Layer 사용
        const fallbackSuccess = storeEventService.initializeFallbackPanelHandling();

        if (!fallbackSuccess) {
          const storePanelContainer = document.getElementById('storePanelContainer');
          storeEventService.applyFallbackScrolling(storePanelContainer);
        }
      }
    }, 100);
  },

  /**
   * 테이블 관련 이벤트 (Service Layer 사용)
   */
  setupTableEvents(store, storeEventService) {
    const tlrContainer = document.getElementById('TLR');
    if (tlrContainer) {
      tlrContainer.addEventListener('click', () => {
        storeEventService.handleTLRClick(store);
      });
    }

    // 테이블 상세 토글 버튼 이벤트 설정
    this.setupTableDetailToggle(storeEventService);
    this.setupTableActions(store);
  },

  /**
   * 테이블 상세 토글 버튼 (Service Layer 사용)
   */
  setupTableDetailToggle(storeEventService) {
    const tableDetailToggleBtn = document.getElementById('tableDetailToggleBtn');
    const tableDetailContent = document.getElementById('tableDetailContent');

    if (tableDetailToggleBtn && tableDetailContent && !tableDetailToggleBtn.hasAttribute('data-event-set')) {
      tableDetailToggleBtn.setAttribute('data-event-set', 'true');
      tableDetailToggleBtn.addEventListener('click', () => {
        // Service에서 상태 계산
        const toggleState = storeEventService.calculateTableDetailToggleState(
          tableDetailContent,
          tableDetailToggleBtn
        );

        // Service에서 애니메이션 적용
        storeEventService.applyTableDetailToggle(
          tableDetailContent,
          tableDetailToggleBtn,
          toggleState
        );
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
   * 테이블 정보 로드 (이벤트 전용 - 수동 새로고침 버튼에서만 사용)
   */
  async loadTableInfo(store, forceRefresh = false) {
    try {
      const { tableService } = await import('../services/tableService.js');
      const { tableStatusView } = await import('../views/tableStatusView.js');

      // tableService를 통해 테이블 정보 로드 (store.tables 존재 여부에 따라 API 호출 결정)
      const tableInfo = await tableService.loadTableInfo(store, forceRefresh);

      // UI 업데이트
      tableStatusView.updateTableInfoUI(tableInfo);
    } catch (error) {
      console.error('❌ 테이블 정보 로드 실패:', error);
      throw error;
    }
  },



  /**
   * 상태 초기화
   */
  reset() {
    console.log('🔄 Store Controller 상태 초기화');
    this.state.currentStore = null;
    this.state.isInitialized = false;
    this.state.activeTab = 'home';
  },

};

// 전역 등록
window.storeController = storeController;