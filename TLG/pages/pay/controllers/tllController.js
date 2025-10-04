/**
 * TLL Controller - 이벤트 처리 및 흐름 제어
 */

import { tllService } from '../services/tllService.js';
import { tllView } from '../views/tllView.js';
import { getUserInfoSafely } from '../../../utils/authManager.js';

export class TLLController {
  constructor() {
    this.selectedStore = null;
    this.searchTimeout = null;
  }

  /**
   * TLL 화면 초기화
   */
  async initialize(preselectedStore = null) {
    console.log('🚀 TLL 초기화 시작');

    // View 렌더링
    tllView.renderTLLScreen();

    // 이벤트 리스너 설정
    this.setupEventListeners();

    // 미리 선택된 매장 처리
    if (preselectedStore) {
      await this.handlePreselectedStore(preselectedStore);
    }

    console.log('✅ TLL 초기화 완료');
  }

  /**
   * 이벤트 리스너 설정
   */
  setupEventListeners() {
    // 검색 입력
    const searchInput = document.getElementById('storeSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => this.handleSearchInput(e));
    }

    // 테이블 선택
    const tableSelect = document.getElementById('tableSelect');
    if (tableSelect) {
      tableSelect.addEventListener('change', () => this.handleTableChange());
    }

    // 주문 시작 버튼
    const startBtn = document.getElementById('startOrderBtn');
    if (startBtn) {
      startBtn.addEventListener('click', () => this.handleOrderStart());
    }

    // 검색 결과 외부 클릭
    document.addEventListener('click', (e) => this.handleOutsideClick(e));

    // 전역 이벤트 위임
    this.setupGlobalDelegation();
  }

  /**
   * 전역 이벤트 위임 (data-action 기반)
   */
  setupGlobalDelegation() {
    document.addEventListener('click', async (e) => {
      const target = e.target.closest('[data-action]');
      if (!target) return;

      const action = target.dataset.action;

      switch (action) {
        case 'back-to-map':
          e.preventDefault();
          if (typeof window.renderMap === 'function') {
            await window.renderMap();
          }
          break;

        case 'select-store':
          e.preventDefault();
          const storeId = target.dataset.storeId;
          const storeName = target.dataset.storeName;
          await this.handleStoreSelect(storeId, storeName);
          break;
      }
    });
  }

  /**
   * 검색 입력 처리
   */
  handleSearchInput(e) {
    const query = e.target.value.trim();

    // 이전 타이머 취소
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    if (query.length < 2) {
      const resultsContainer = document.getElementById('storeSearchResults');
      if (resultsContainer) resultsContainer.style.display = 'none';
      return;
    }

    // 200ms 딜레이 후 검색 실행
    this.searchTimeout = setTimeout(async () => {
      await this.searchStores(query);
    }, 200);
  }

  /**
   * 매장 검색
   */
  async searchStores(query) {
    try {
      console.log(`🔍 TLL - 매장 검색: "${query}"`);
      const stores = await tllService.searchStores(query);
      tllView.displaySearchResults(stores);
    } catch (error) {
      console.error('❌ 매장 검색 실패:', error);
      tllView.displaySearchResults([]);
    }
  }

  /**
   * 매장 선택 처리
   */
  async handleStoreSelect(storeId, storeName) {
    try {
      console.log(`🏪 TLL - 매장 선택: ${storeName} (ID: ${storeId})`);

      // 매장 정보 조회
      this.selectedStore = await tllService.getStoreInfo(storeId, storeName);

      // 전역 저장
      window.selectedStore = this.selectedStore;
      window.preselectedStoreForTLL = this.selectedStore;
      window.currentStoreForTLL = this.selectedStore;

      // UI 업데이트
      tllView.updateSelectedStore(storeName);

      // 테이블 정보 조회
      await this.loadTables(storeId, storeName);

      console.log(`✅ TLL - 매장 ${storeName} 선택 완료`);
    } catch (error) {
      console.error('❌ 매장 선택 처리 실패:', error);
      alert('매장 정보를 불러올 수 없습니다.');
    }
  }

  /**
   * 테이블 정보 로드
   */
  async loadTables(storeId, storeName) {
    try {
      const tables = await tllService.getTables(storeId);
      const optionsHTML = tllService.generateTableOptions(tables);

      tllView.updateTableOptions(optionsHTML);
      tllView.updateStartButton(false);

      console.log(`✅ ${storeName}: 테이블 로드 완료`);
    } catch (error) {
      console.error('❌ 테이블 로드 실패:', error);
      
      // 기본 테이블 옵션 설정
      const defaultTables = tllService.getDefaultTables();
      const optionsHTML = tllService.generateTableOptions(defaultTables);
      tllView.updateTableOptions(optionsHTML);
    }
  }

  /**
   * 테이블 변경 처리
   */
  handleTableChange() {
    const tableSelect = document.getElementById('tableSelect');
    if (tableSelect) {
      tllView.updateStartButton(!!tableSelect.value);
    }
  }

  /**
   * 주문 시작 처리
   */
  async handleOrderStart() {
    try {
      const tableSelect = document.getElementById('tableSelect');
      
      // 검증
      const validation = tllService.validateOrderStart(this.selectedStore, tableSelect?.value);
      if (!validation.valid) {
        alert(validation.message);
        return;
      }

      // 사용자 정보 확인
      const userInfo = getUserInfoSafely();
      if (!userInfo || !userInfo.id) {
        alert('로그인이 필요합니다.');
        if (typeof window.renderLogin === 'function') {
          window.renderLogin();
        }
        return;
      }

      // 로딩 표시
      tllView.showLoading();

      const tableNumber = parseInt(tableSelect.value);
      const tableName = `${tableNumber}번 테이블`;

      console.log(`🚀 TLL - 주문 시작: 매장 ${this.selectedStore.name}, 테이블 ${tableName}`);

      // 주문 화면으로 이동
      if (typeof window.renderOrderScreen === 'function') {
        window.renderOrderScreen(this.selectedStore, tableName, tableNumber);
      } else {
        throw new Error('renderOrderScreen 함수를 찾을 수 없습니다');
      }
    } catch (error) {
      console.error('❌ 주문 시작 실패:', error);
      alert('주문 시작 중 오류가 발생했습니다: ' + error.message);
      tllView.hideLoading();
    }
  }

  /**
   * 외부 클릭 처리 (검색 결과 숨김)
   */
  handleOutsideClick(e) {
    const searchInput = document.getElementById('storeSearchInput');
    const searchResults = document.getElementById('storeSearchResults');

    if (!e.target.closest('#storeSearchInput') && !e.target.closest('#storeSearchResults')) {
      if (searchResults) {
        searchResults.style.display = 'none';
      }
    }
  }

  /**
   * 미리 선택된 매장 처리
   */
  async handlePreselectedStore(preselectedStore) {
    console.log(`🏪 TLL - 매장 미리 선택됨: ${preselectedStore.name} (ID: ${preselectedStore.id})`);
    
    window.preselectedStoreForTLL = preselectedStore;

    // DOM 준비 대기 후 자동 선택
    const autoSelectStore = async (retryCount = 0) => {
      if (retryCount >= 50) {
        console.error('❌ DOM 로딩 시간 초과');
        return;
      }

      const searchInput = document.getElementById('storeSearchInput');
      const selectedDiv = document.getElementById('selectedStore');
      const selectedName = document.getElementById('selectedStoreName');

      if (!searchInput || !selectedDiv || !selectedName) {
        setTimeout(() => autoSelectStore(retryCount + 1), 100);
        return;
      }

      await this.handleStoreSelect(preselectedStore.id, preselectedStore.name);
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', autoSelectStore);
    } else {
      autoSelectStore();
    }
  }
}

// 전역 인스턴스 생성
export const tllController = new TLLController();

console.log('✅ tllController 모듈 로드 완료');
