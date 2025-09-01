
// POS 상태 관리 모듈
export class POSStateManager {
  static state = {
    currentStore: null,
    currentTable: null,
    allMenus: [],
    categories: [],
    selectedCategory: 'all',
    allTables: [],
    currentOrder: [],
    selectedItems: [],
    isOrderProcessing: false,
    currentView: 'table-map',
    // 세션 관리 개선
    currentSession: {
      checkId: null,
      status: null, // 'open', 'ordering', 'kitchen_processing', 'payment_processing', 'closed'
      openedAt: null,
      customerName: null,
      totalAmount: 0,
      paidAmount: 0,
      remainingAmount: 0
    },
    // 임시/확정 분리
    pendingItems: [], // 임시 (미확정) 주문
    confirmedItems: [], // 확정된 주문 (DB 반영됨)
    sessionLock: {
      isLocked: false,
      lockedBy: null,
      lockedAt: null,
      lockExpires: null
    }
  };

  static initialize() {
    this.state = {
      currentStore: null,
      currentTable: null,
      allMenus: [],
      categories: [],
      selectedCategory: 'all',
      allTables: [],
      currentOrder: [],
      selectedItems: [],
      isOrderProcessing: false,
      currentView: 'table-map'
    };

    // 전역 변수로도 노출 (하위 호환성)
    window.currentStore = null;
    window.currentTable = null;
    window.allMenus = [];
    window.allTables = [];
    window.currentOrder = [];
    window.selectedItems = [];
    window.currentView = 'table-map';
    window.categories = [];
  }

  static setCurrentStore(store) {
    this.state.currentStore = store;
    window.currentStore = store;
  }

  static getCurrentStore() {
    return this.state.currentStore;
  }

  static setCurrentTable(table) {
    this.state.currentTable = table;
    window.currentTable = table;
  }

  static getCurrentTable() {
    return this.state.currentTable;
  }

  static setAllMenus(menus) {
    this.state.allMenus = menus;
    window.allMenus = menus;
  }

  static getAllMenus() {
    return this.state.allMenus;
  }

  static setCategories(categories) {
    this.state.categories = categories;
    window.categories = categories;
  }

  static getCategories() {
    return this.state.categories;
  }

  static setSelectedCategory(category) {
    this.state.selectedCategory = category;
    window.selectedCategory = category;
  }

  static getSelectedCategory() {
    return this.state.selectedCategory;
  }

  static setAllTables(tables) {
    this.state.allTables = tables;
    window.allTables = tables;
  }

  static getAllTables() {
    return this.state.allTables;
  }

  static setCurrentOrder(order) {
    this.state.currentOrder = order;
    window.currentOrder = order;
  }

  static getCurrentOrder() {
    return this.state.currentOrder;
  }

  static setSelectedItems(items) {
    this.state.selectedItems = items;
    window.selectedItems = items;
  }

  static getSelectedItems() {
    return this.state.selectedItems;
  }

  static setCurrentView(view) {
    this.state.currentView = view;
    window.currentView = view;
  }

  static getCurrentView() {
    return this.state.currentView;
  }

  static setOrderProcessing(processing) {
    this.state.isOrderProcessing = processing;
    window.isOrderProcessing = processing;
  }

  static isOrderProcessing() {
    return this.state.isOrderProcessing;
  }

  static resetCurrentSession() {
    this.state.currentTable = null;
    this.state.currentOrder = [];
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
    this.state.pendingItems = [];
    this.state.confirmedItems = [];
    this.state.sessionLock = {
      isLocked: false,
      lockedBy: null,
      lockedAt: null,
      lockExpires: null
    };
    
    window.currentTable = null;
    window.currentOrder = [];
    window.selectedItems = [];
  }

  // 세션 관련 getter/setter
  static setCurrentSession(sessionData) {
    this.state.currentSession = { ...this.state.currentSession, ...sessionData };
  }

  static getCurrentSession() {
    return this.state.currentSession;
  }

  static setPendingItems(items) {
    this.state.pendingItems = items;
  }

  static getPendingItems() {
    return this.state.pendingItems;
  }

  static setConfirmedItems(items) {
    this.state.confirmedItems = items;
  }

  static getConfirmedItems() {
    return this.state.confirmedItems;
  }

  static setSessionLock(lockData) {
    this.state.sessionLock = { ...this.state.sessionLock, ...lockData };
  }

  static getSessionLock() {
    return this.state.sessionLock;
  }

  static isSessionLocked() {
    const lock = this.state.sessionLock;
    if (!lock.isLocked) return false;
    
    // 락 만료 확인
    if (lock.lockExpires && new Date() > new Date(lock.lockExpires)) {
      this.setSessionLock({ isLocked: false, lockedBy: null, lockedAt: null, lockExpires: null });
      return false;
    }
    
    return true;
  }
}
