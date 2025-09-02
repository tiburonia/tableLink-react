// POS 상태 관리 모듈 - 새 시스템 전용
export class POSStateManager {
  static state = {
    // 기본 정보
    currentStore: null,
    currentTable: null,
    allMenus: [],
    categories: [],
    selectedCategory: 'all',
    allTables: [],
    currentView: 'table-map',

    // 새 시스템: 임시/확정 분리
    pendingItems: [],    // 임시 주문 (미확정)
    confirmedItems: [],  // 확정된 주문
    selectedItems: [],   // UI에서 선택된 아이템들

    // 세션 관리
    currentSession: {
      checkId: null,
      status: null,
      openedAt: null,
      customerName: null,
      totalAmount: 0,
      paidAmount: 0,
      remainingAmount: 0
    }
  };

  // 🚀 초기화
  static initialize() {
    this.state = {
      currentStore: null,
      currentTable: null,
      allMenus: [],
      categories: [],
      selectedCategory: 'all',
      allTables: [],
      currentView: 'table-map',
      pendingItems: [],
      confirmedItems: [],
      selectedItems: [],
      currentSession: {
        checkId: null,
        status: null,
        openedAt: null,
        customerName: null,
        totalAmount: 0,
        paidAmount: 0,
        remainingAmount: 0
      }
    };

    console.log('🚀 새 시스템: 상태 초기화 완료');
  }

  // 매장 관리
  static setCurrentStore(store) {
    this.state.currentStore = store;
  }

  static getCurrentStore() {
    return this.state.currentStore;
  }

  // 테이블 관리
  static setCurrentTable(table) {
    this.state.currentTable = table;
  }

  static getCurrentTable() {
    return this.state.currentTable;
  }

  // 메뉴 관리
  static setAllMenus(menus) {
    this.state.allMenus = Array.isArray(menus) ? menus : [];
    console.log(`📋 전체 메뉴 설정: ${this.state.allMenus.length}개`);
  }

  static getAllMenus() {
    return this.state.allMenus;
  }

  static setCategories(categories) {
    this.state.categories = categories;
  }

  static getCategories() {
    return this.state.categories;
  }

  static setSelectedCategory(category) {
    this.state.selectedCategory = category;
  }

  static getSelectedCategory() {
    return this.state.selectedCategory;
  }

  // 테이블 관리
  static setAllTables(tables) {
    this.state.allTables = tables;
  }

  static getAllTables() {
    return this.state.allTables;
  }

  // 뷰 관리
  static setCurrentView(view) {
    this.state.currentView = view;
  }

  static getCurrentView() {
    return this.state.currentView;
  }

  // 📦 임시 주문 아이템 관리
  static getPendingItems() {
    if (!this.state.pendingItems || !Array.isArray(this.state.pendingItems)) {
      this.state.pendingItems = [];
      console.log('🔧 임시 아이템 배열 초기화됨');
    }
    return [...this.state.pendingItems]; // 배열 복사 반환
  }

  static setPendingItems(items) {
    if (!Array.isArray(items)) {
      console.error('❌ setPendingItems: 배열이 아닌 값 전달됨:', typeof items);
      this.state.pendingItems = [];
      return;
    }

    // 유효성 검사
    const validItems = items.filter(item => {
      return item &&
             typeof item === 'object' &&
             item.id &&
             item.name &&
             typeof item.price === 'number' &&
             typeof item.quantity === 'number';
    });

    if (validItems.length !== items.length) {
      console.warn(`⚠️ ${items.length - validItems.length}개의 잘못된 아이템 제거됨`);
    }

    this.state.pendingItems = validItems;
    console.log(`📦 새 시스템: 임시 아이템 설정 - ${this.state.pendingItems.length}개`);
  }

  // 🆕 새 시스템: 확정 주문 관리
  static setConfirmedItems(items) {
    this.state.confirmedItems = items;
    console.log(`✅ 새 시스템: 확정 주문 설정 - ${items.length}개`);
  }

  static getConfirmedItems() {
    return this.state.confirmedItems;
  }

  // 🆕 새 시스템: 통합 주문 관리 (UI 표시용)
  static setCurrentOrder(order) {
    this.state.currentOrder = order;
  }

  static getCurrentOrder() {
    return this.state.currentOrder || [];
  }

  // 🆕 새 시스템: 선택된 아이템 관리
  static setSelectedItems(items) {
    this.state.selectedItems = items;
  }

  static getSelectedItems() {
    return this.state.selectedItems;
  }

  static clearSelectedItems() {
    this.state.selectedItems = [];
  }

  // 🆕 새 시스템: 세션 관리
  static setCurrentSession(sessionData) {
    this.state.currentSession = { ...this.state.currentSession, ...sessionData };
  }

  static getCurrentSession() {
    return this.state.currentSession;
  }

  // 🆕 새 시스템: 수량 변경 (임시 주문만)
  static changeItemQuantity(itemId, change) {
    const pendingItems = this.state.pendingItems;
    const item = pendingItems.find(item => item.id === itemId);

    if (!item) {
      console.warn('⚠️ 새 시스템: 임시 주문에서만 수량 변경 가능');
      return false;
    }

    const oldQuantity = item.quantity;
    item.quantity += change;

    if (item.quantity <= 0) {
      const index = pendingItems.indexOf(item);
      pendingItems.splice(index, 1);
      console.log(`🗑️ 새 시스템: 수량 0으로 아이템 제거 - ${item.name}`);
    }

    console.log(`📝 새 시스템: 수량 변경 - ${item.name} ${oldQuantity} → ${item.quantity}`);
    return true;
  }

  // 🔄 완전 리셋
  static reset() {
    this.state.currentTable = null;
    this.state.pendingItems = [];
    this.state.confirmedItems = [];
    this.state.selectedItems = [];
    this.state.currentSession = {
      checkId: null,
      status: null,
      openedAt: null,
      customerName: null,
      totalAmount: 0,
      paidAmount: 0,
      remainingAmount: 0
    };

    console.log('🔄 새 시스템: 상태 완전 리셋');
  }
}