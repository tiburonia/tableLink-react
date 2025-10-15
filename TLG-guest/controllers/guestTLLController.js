
/**
 * 비회원 TLL Controller
 */
import { guestTLLService } from '../services/guestTLLService.js';
import { guestTLLView } from '../views/guestTLLView.js';

export const guestTLLController = {
  selectedStoreId: null,
  selectedStoreName: null,
  selectedTableNumber: null,

  /**
   * 초기화
   */
  init() {
    this.render();
    this.attachEventListeners();
  },

  /**
   * 화면 렌더링
   */
  render() {
    const app = document.getElementById('app');
    if (!app) return;
    
    app.innerHTML = guestTLLView.render();
  },

  /**
   * 이벤트 리스너 등록
   */
  attachEventListeners() {
    // 매장 검색
    const searchInput = document.getElementById('storeSearchInput');
    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.handleStoreSearch(e.target.value);
        }, 300);
      });
    }

    // 검색 결과 클릭 (이벤트 위임)
    const searchResults = document.getElementById('searchResults');
    if (searchResults) {
      searchResults.addEventListener('click', (e) => {
        const item = e.target.closest('.search-item');
        if (item) {
          const storeId = item.dataset.storeId;
          const storeName = item.dataset.storeName;
          this.handleStoreSelect(storeId, storeName);
        }
      });
    }

    // 테이블 선택
    const tableSelect = document.getElementById('tableSelect');
    if (tableSelect) {
      tableSelect.addEventListener('change', (e) => {
        this.handleTableSelect(e.target.value);
      });
    }

    // 전화번호 입력 (숫자만)
    const phoneInput = document.getElementById('guestPhoneInput');
    if (phoneInput) {
      phoneInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
        this.validateForm();
      });
    }

    // 주문 시작
    const startBtn = document.getElementById('startOrderBtn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        this.handleStartOrder();
      });
    }
  },

  /**
   * 매장 검색 처리
   */
  async handleStoreSearch(keyword) {
    try {
      const stores = await guestTLLService.searchStores(keyword);
      guestTLLView.renderSearchResults(stores);
    } catch (error) {
      console.error('매장 검색 실패:', error);
      guestTLLView.showError('매장 검색에 실패했습니다');
    }
  },

  /**
   * 매장 선택 처리
   */
  async handleStoreSelect(storeId, storeName) {
    try {
      this.selectedStoreId = storeId;
      this.selectedStoreName = storeName;

      guestTLLView.showSelectedStore(storeName);

      const tables = await guestTLLService.getAvailableTables(storeId);
      guestTLLView.renderTableOptions(tables);

      this.validateForm();
    } catch (error) {
      console.error('매장 정보 로드 실패:', error);
      guestTLLView.showError('매장 정보를 불러올 수 없습니다');
    }
  },

  /**
   * 테이블 선택 처리
   */
  handleTableSelect(tableNumber) {
    this.selectedTableNumber = tableNumber;
    
    if (tableNumber) {
      guestTLLView.enablePhoneInput();
    }
    
    this.validateForm();
  },

  /**
   * 폼 유효성 검사
   */
  validateForm() {
    const phoneInput = document.getElementById('guestPhoneInput');
    const phone = phoneInput ? phoneInput.value : '';

    const isValid = 
      this.selectedStoreId && 
      this.selectedTableNumber && 
      /^010[0-9]{8}$/.test(phone);

    if (isValid) {
      guestTLLView.enableStartButton();
    } else {
      guestTLLView.disableStartButton();
    }
  },

  /**
   * 주문 시작 처리
   */
  async handleStartOrder() {
    const phoneInput = document.getElementById('guestPhoneInput');
    const guestPhone = phoneInput ? phoneInput.value : '';

    try {
      guestTLLView.showLoading();

      const session = await guestTLLService.startGuestOrder(
        this.selectedStoreId,
        this.selectedTableNumber,
        guestPhone
      );

      console.log('✅ 비회원 주문 세션 생성:', session);

      // QR 주문 화면으로 이동 (추후 구현)
      alert(`주문 세션이 생성되었습니다!\n주문 ID: ${session.orderId}\n테이블: ${session.tableNumber}번`);
      
      // TODO: QR 주문 화면으로 리다이렉트
      // window.location.href = `/tll-guest/qr.html?orderId=${session.orderId}`;

    } catch (error) {
      console.error('주문 시작 실패:', error);
      guestTLLView.showError(error.message || '주문을 시작할 수 없습니다');
      this.render();
      this.attachEventListeners();
    }
  }
};
