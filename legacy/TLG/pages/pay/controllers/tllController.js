import { tllService } from '../services/tllService.js';
import { tllView } from '../views/tllView.js';
import { getUserInfoSafely } from '../../../utils/authManager.js';

export class TLLController {
  constructor() {
    this.selectedStore = null;
    this.searchTimeout = null;
    this.isInitialized = false;
  }

  async initialize(preselectedStore = null) {
    tllView.renderTLLScreen();
    if (!this.isInitialized) {
      this.setupGlobalDelegation();
      this.isInitialized = true;
    }
    this.setupLocalListeners();
    if (preselectedStore) await this.handlePreselectedStore(preselectedStore);
  }

  setupGlobalDelegation() {
    document.addEventListener('click', async (e) => {
      const target = e.target.closest('[data-action]');
      if (!target) return;

      const action = target.dataset.action;
      if (action === 'back-to-map') {
        e.preventDefault();
        if (typeof window.renderMap === 'function') await window.renderMap();
      } else if (action === 'select-store') {
        e.preventDefault();
        await this.handleStoreSelect(target.dataset.storeId, target.dataset.storeName);
      }
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#storeSearchInput') && !e.target.closest('#storeSearchResults')) {
        const results = document.getElementById('storeSearchResults');
        if (results) results.style.display = 'none';
      }
    });
  }

  setupLocalListeners() {
    const searchInput = document.getElementById('storeSearchInput');
    if (searchInput) searchInput.addEventListener('input', (e) => this.handleSearchInput(e));

    const tableSelect = document.getElementById('tableSelect');
    if (tableSelect) tableSelect.addEventListener('change', () => this.handleTableChange());

    const startBtn = document.getElementById('startOrderBtn');
    if (startBtn) startBtn.addEventListener('click', () => this.handleOrderStart());
  }

  handleSearchInput(e) {
    const query = e.target.value.trim();
    if (this.searchTimeout) clearTimeout(this.searchTimeout);

    if (query.length < 2) {
      const results = document.getElementById('storeSearchResults');
      if (results) results.style.display = 'none';
      return;
    }

    this.searchTimeout = setTimeout(async () => {
      const stores = await tllService.searchStores(query);
      tllView.displaySearchResults(stores);
    }, 200);
  }

  async handleStoreSelect(storeId, storeName) {
    try {
      this.selectedStore = await tllService.getStoreInfo(storeId, storeName);
      window.selectedStore = this.selectedStore;
      window.preselectedStoreForTLL = this.selectedStore;
      window.currentStoreForTLL = this.selectedStore;

      tllView.updateSelectedStore(storeName);
      await this.loadTables(storeId, storeName);
    } catch (error) {
      console.error('❌ 매장 선택 처리 실패:', error);
      alert('매장 정보를 불러올 수 없습니다.');
    }
  }

  async loadTables(storeId, storeName) {
    try {
      const tables = await tllService.getTables(storeId);
      const optionsHTML = tllService.generateTableOptions(tables);
      tllView.updateTableOptions(optionsHTML);
      tllView.updateStartButton(false);
    } catch (error) {
      console.error('❌ 테이블 로드 실패:', error);
      const defaultTables = tllService.getDefaultTables();
      const optionsHTML = tllService.generateTableOptions(defaultTables);
      tllView.updateTableOptions(optionsHTML);
    }
  }

  handleTableChange() {
    const tableSelect = document.getElementById('tableSelect');
    if (tableSelect) tllView.updateStartButton(!!tableSelect.value);
  }

  async handleOrderStart() {
    try {
      const tableSelect = document.getElementById('tableSelect');
      const validation = tllService.validateOrderStart(this.selectedStore, tableSelect?.value);
      if (!validation.valid) {
        alert(validation.message);
        return;
      }

      const userInfo = getUserInfoSafely();
      if (!userInfo || !userInfo.id) {
        alert('로그인이 필요합니다.');
        if (typeof window.renderLogin === 'function') window.renderLogin();
        return;
      }

      tllView.showLoading();
      const tableNumber = parseInt(tableSelect.value);
      const tableName = `${tableNumber}번 테이블`;

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

  async handlePreselectedStore(preselectedStore) {
    window.preselectedStoreForTLL = preselectedStore;
    try {
      await tllService.waitForDOMReady(['storeSearchInput', 'selectedStore', 'selectedStoreName']);
      await this.handleStoreSelect(preselectedStore.id, preselectedStore.name);
    } catch (error) {
      console.error('❌ 미리 선택된 매장 처리 실패:', error);
    }
  }
}

// 전역 인스턴스 생성
export const tllController = new TLLController();

console.log('✅ tllController 모듈 로드 완료');
