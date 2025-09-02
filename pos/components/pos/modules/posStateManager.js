// POS 상태 관리 모듈 - 단순 장바구니 방식
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

    // 단순화된 주문 상태
    cartItems: [],       // 장바구니 (DB 저장 전)
    confirmedItems: [],  // 확정된 주문 (DB에 저장됨)
    selectedItems: [],   // UI 선택용

    // 세션 정보
    currentSession: {
      checkId: null,
      status: null,
      customerName: null,
      totalAmount: 0
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
      cartItems: [],
      confirmedItems: [],
      selectedItems: [],
      currentSession: {
        checkId: null,
        status: null,
        customerName: null,
        totalAmount: 0
      }
    };

    console.log('🚀 상태 초기화 완료 (단순 장바구니 방식)');
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
    this.state.allMenus = menus;
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

  // 🛒 장바구니 관리 (DB 저장 전)
  static getCartItems() {
    if (!this.state.cartItems || !Array.isArray(this.state.cartItems)) {
      this.state.cartItems = [];
    }
    return [...this.state.cartItems];
  }

  static setCartItems(items) {
    if (!Array.isArray(items)) {
      console.error('❌ setCartItems: 배열이 아닌 값 전달됨:', typeof items);
      this.state.cartItems = [];
      return;
    }

    this.state.cartItems = items;
    console.log(`🛒 장바구니 설정: ${this.state.cartItems.length}개`);
  }

  // ✅ 확정된 주문 관리 (DB에 저장됨)
  static setConfirmedItems(items) {
    this.state.confirmedItems = items;
    console.log(`✅ 확정 주문 설정: ${items.length}개`);
  }

  static getConfirmedItems() {
    return this.state.confirmedItems;
  }

  // 🎯 UI용 전체 주문 목록 (장바구니 + 확정)
  static getCurrentOrder() {
    const cartItems = this.getCartItems().map(item => ({
      ...item,
      isCart: true,
      isConfirmed: false
    }));

    const confirmedItems = this.getConfirmedItems().map(item => ({
      ...item,
      isCart: false,
      isConfirmed: true
    }));

    return [...cartItems, ...confirmedItems];
  }

  // 선택된 아이템 관리
  static setSelectedItems(items) {
    this.state.selectedItems = items;
  }

  static getSelectedItems() {
    return this.state.selectedItems;
  }

  static clearSelectedItems() {
    this.state.selectedItems = [];
  }

  // 세션 관리
  static setCurrentSession(sessionData) {
    this.state.currentSession = { ...this.state.currentSession, ...sessionData };
  }

  static getCurrentSession() {
    return this.state.currentSession;
  }

  // 🔄 리셋
  static reset() {
    this.state.currentTable = null;
    this.state.cartItems = [];
    this.state.confirmedItems = [];
    this.state.selectedItems = [];
    this.state.currentSession = {
      checkId: null,
      status: null,
      customerName: null,
      totalAmount: 0
    };

    console.log('🔄 상태 리셋 완료');
  }

  // === 기존 호환성 함수들 ===
  static getPendingItems() {
    return this.getCartItems();
  }

  static setPendingItems(items) {
    this.setCartItems(items);
  }
}