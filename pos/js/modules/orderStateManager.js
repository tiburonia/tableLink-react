
/**
 * 통합 주문 상태 관리자 (v2.0)
 * - addToOrder와 toggleOrderRowSelection 중심의 편집모드 관리
 * - 명확한 선택 상태와 편집모드 전환 로직
 * - 일관된 UI 동기화
 */

const OrderStateManager = {
    // 중앙 상태 저장소
    state: {
        // 기본 주문 데이터
        originalOrders: new Map(), // menuName -> 원본 주문 정보
        pendingChanges: new Map(), // menuName -> 변경사항
        
        // 선택 및 편집 상태
        selectedOrder: null,        // 현재 선택된 주문
        selectedRowElement: null,   // 선택된 DOM 요소
        isEditMode: false,          // 편집 모드 여부
        hasUnsavedChanges: false,   // 저장되지 않은 변경사항 여부
        
        // UI 상태
        isLoading: false,
        lastUpdateTime: null
    },

    // 상태 변경 이벤트 리스너들
    listeners: new Set(),

    /**
     * 초기화
     */
    initialize() {
        console.log('🔄 OrderStateManager v2.0 초기화');
        this.resetState();
        this.notifyStateChange('INITIALIZED');
    },

    /**
     * 상태 완전 초기화
     */
    resetState() {
        this.state.originalOrders.clear();
        this.state.pendingChanges.clear();
        this.state.selectedOrder = null;
        this.state.selectedRowElement = null;
        this.state.isEditMode = false;
        this.state.hasUnsavedChanges = false;
        this.state.isLoading = false;
        this.state.lastUpdateTime = Date.now();
        
        // UI 선택 상태 해제
        this.clearUISelection();
        
        console.log('🧹 OrderStateManager 상태 초기화 완료');
    },

    /**
     * 원본 주문 데이터 로드
     */
    loadOriginalOrders(orders) {
        console.log(`📥 원본 주문 데이터 로드: ${orders.length}개`);
        
        this.state.originalOrders.clear();
        
        orders.forEach(order => {
            if (!order.isCart && !order.isNewMenu) {
                this.state.originalOrders.set(order.menuName, {
                    id: order.id,
                    menuId: order.menuId || order.id,
                    menuName: order.menuName,
                    price: order.price,
                    quantity: order.quantity,
                    cookingStatus: order.cookingStatus || 'PENDING',
                    ticketIds: order.ticketIds || []
                });
            }
        });

        this.state.lastUpdateTime = Date.now();
        this.notifyStateChange('ORIGINAL_ORDERS_LOADED');
        
        console.log(`✅ 원본 주문 로드 완료: ${this.state.originalOrders.size}개`);
    },

    /**
     * 메뉴 추가/수량 변경 (addToOrder용)
     * - 편집모드로 전환
     * - 자동으로 해당 메뉴 선택
     */
    addMenuWithSelection(menuId, menuName, price, quantityDelta = 1) {
        console.log(`🎯 메뉴 추가 with 자동선택: ${menuName} (+${quantityDelta})`);

        // 1. 수량 업데이트
        const result = this.updateMenuQuantity(menuId, menuName, price, quantityDelta, 'add');

        // 2. 편집모드 전환
        this.state.isEditMode = true;

        // 3. 해당 메뉴 자동 선택 (비동기)
        setTimeout(() => {
            this.selectOrderByMenuName(menuName, result.newQuantity);
        }, 50);

        this.state.lastUpdateTime = Date.now();
        this.notifyStateChange('MENU_ADDED_WITH_SELECTION', {
            menuName,
            newQuantity: result.newQuantity,
            originalQuantity: result.originalQuantity
        });

        return result;
    },

    /**
     * 주문 행 선택 토글 (toggleOrderRowSelection용)
     * - 편집모드로 전환
     * - 선택 상태 토글
     */
    toggleRowSelection(orderId, menuName, quantity, rowElement = null) {
        console.log(`🎯 행 선택 토글: ${menuName} (편집모드 전환)`);

        // 1. 편집모드 전환
        this.state.isEditMode = true;

        // 2. 이미 선택된 행이면 선택 해제
        if (this.state.selectedOrder && this.state.selectedOrder.menuName === menuName) {
            console.log(`🔄 기존 선택 해제: ${menuName}`);
            this.clearSelection();
            // 편집모드는 변경사항이 있으면 유지
            this.state.isEditMode = this.state.hasUnsavedChanges;
            this.notifyStateChange('SELECTION_CLEARED');
            return false;
        }

        // 3. 새로운 행 선택
        const success = this.selectOrder(orderId, menuName, quantity, rowElement);
        
        if (success) {
            this.notifyStateChange('ROW_SELECTION_TOGGLED', {
                orderId,
                menuName,
                quantity
            });
        }

        return success;
    },

    /**
     * 메뉴명으로 주문 선택 (자동 선택용)
     */
    selectOrderByMenuName(menuName, quantity) {
        console.log(`🎯 메뉴명으로 자동 선택: ${menuName}`);

        // DOM에서 해당 메뉴 행 찾기
        const rowElement = this.findRowByMenuName(menuName);
        
        if (rowElement) {
            const orderId = rowElement.dataset.orderId || rowElement.dataset.menuId;
            return this.selectOrder(orderId, menuName, quantity, rowElement);
        } else {
            console.warn(`⚠️ 메뉴 행을 찾을 수 없음: ${menuName}`);
            return false;
        }
    },

    /**
     * 주문 선택 (내부 로직)
     */
    selectOrder(orderId, menuName, quantity, rowElement) {
        console.log(`🎯 주문 선택: ${menuName} (ID: ${orderId})`);

        // 기존 선택 해제
        this.clearSelection();

        // 메뉴 정보 찾기
        const originalOrder = this.state.originalOrders.get(menuName);
        const menuId = originalOrder ? originalOrder.menuId : parseInt(orderId);
        const price = originalOrder ? originalOrder.price : 0;

        // 선택 상태 설정
        this.state.selectedOrder = {
            orderId: orderId,
            menuId: menuId,
            menuName: menuName,
            quantity: quantity,
            price: price,
            originalQuantity: originalOrder ? originalOrder.quantity : 0
        };

        this.state.selectedRowElement = rowElement;
        this.state.isEditMode = true;
        this.state.lastUpdateTime = Date.now();

        // UI 업데이트
        if (rowElement) {
            this.applySelectionUI(rowElement);
        }

        console.log(`✅ 주문 선택 완료:`, this.state.selectedOrder);
        return true;
    },

    /**
     * 수량 업데이트 (내부 로직)
     */
    updateMenuQuantity(menuId, menuName, price, quantityDelta, changeType = 'modify') {
        console.log(`🔧 메뉴 수량 업데이트: ${menuName} (${quantityDelta > 0 ? '+' : ''}${quantityDelta})`);

        // 원본 수량 가져오기
        const originalOrder = this.state.originalOrders.get(menuName);
        const originalQuantity = originalOrder ? originalOrder.quantity : 0;

        // 현재 변경사항에서 현재 수량 가져오기
        const currentChange = this.state.pendingChanges.get(menuName);
        const currentQuantity = currentChange ? currentChange.newQuantity : originalQuantity;

        // 새 수량 계산
        const newQuantity = Math.max(0, currentQuantity + quantityDelta);

        // 변경사항 저장
        if (newQuantity === originalQuantity) {
            // 원본과 같으면 변경사항에서 제거
            this.state.pendingChanges.delete(menuName);
            console.log(`🗑️ 변경사항 제거: ${menuName} (원본과 동일)`);
        } else {
            // 변경사항 저장
            this.state.pendingChanges.set(menuName, {
                menuId: parseInt(menuId),
                menuName: menuName,
                price: price,
                originalQuantity: originalQuantity,
                newQuantity: newQuantity,
                changeType: changeType,
                lastModified: Date.now()
            });
            console.log(`💾 변경사항 저장: ${menuName} (${originalQuantity} → ${newQuantity})`);
        }

        // 상태 업데이트
        this.state.hasUnsavedChanges = this.state.pendingChanges.size > 0;
        this.state.lastUpdateTime = Date.now();

        return {
            originalQuantity,
            newQuantity,
            hasChanges: this.state.hasUnsavedChanges
        };
    },

    /**
     * 선택 해제
     */
    clearSelection() {
        if (this.state.selectedOrder) {
            console.log(`🔄 선택 해제: ${this.state.selectedOrder.menuName}`);
        }

        this.state.selectedOrder = null;
        this.state.selectedRowElement = null;
        // 편집모드는 변경사항이 있으면 유지
        this.state.isEditMode = this.state.hasUnsavedChanges;

        // UI 선택 상태 해제
        this.clearUISelection();
    },

    /**
     * DOM에서 메뉴명으로 행 찾기
     */
    findRowByMenuName(menuName) {
        const allRows = document.querySelectorAll('.pos-order-table tr.order-row');
        for (const row of allRows) {
            const menuText = row.querySelector('.menu-info strong')?.textContent?.trim();
            if (menuText === menuName) {
                console.log(`🎯 메뉴명으로 행 발견: ${menuName}`);
                return row;
            }
        }
        return null;
    },

    /**
     * UI 선택 상태 적용
     */
    applySelectionUI(rowElement) {
        if (!rowElement) return;

        // 기존 선택 해제
        this.clearUISelection();

        // 새 선택 적용
        rowElement.classList.add('selected');
        rowElement.style.background = '#dbeafe';
        rowElement.style.borderLeft = '4px solid #3b82f6';
        rowElement.style.boxShadow = 'inset 0 0 0 1px rgba(59, 130, 246, 0.2)';

        console.log(`🎨 선택 UI 적용: ${rowElement.dataset.menuName || '알 수 없음'}`);
    },

    /**
     * UI 선택 상태 해제
     */
    clearUISelection() {
        document.querySelectorAll('.pos-order-table tr.order-row').forEach(row => {
            row.classList.remove('selected');
            row.style.background = '';
            row.style.borderLeft = '';
            row.style.boxShadow = '';
        });
    },

    /**
     * 표시용 주문 데이터 생성
     */
    generateDisplayOrders() {
        const displayOrders = new Map();

        // 1. 원본 주문 추가
        this.state.originalOrders.forEach((order, menuName) => {
            displayOrders.set(menuName, {
                ...order,
                isOriginal: true,
                isModified: false
            });
        });

        // 2. 변경사항 적용
        this.state.pendingChanges.forEach((change, menuName) => {
            if (change.newQuantity > 0) {
                displayOrders.set(menuName, {
                    id: change.menuId,
                    menuId: change.menuId,
                    menuName: change.menuName,
                    price: change.price,
                    quantity: change.newQuantity,
                    cookingStatus: 'PENDING',
                    isOriginal: change.originalQuantity > 0,
                    isModified: true,
                    originalQuantity: change.originalQuantity
                });
            } else {
                // 수량이 0이면 삭제
                displayOrders.delete(menuName);
            }
        });

        return Array.from(displayOrders.values());
    },

    /**
     * 변경사항 확정용 API 데이터 생성
     */
    generateAPIChanges() {
        const addModifications = {};
        const removeModifications = {};

        this.state.pendingChanges.forEach((change) => {
            const diff = change.newQuantity - change.originalQuantity;
            
            if (diff > 0) {
                addModifications[change.menuName] = diff;
            } else if (diff < 0) {
                removeModifications[change.menuName] = Math.abs(diff);
            }
        });

        return {
            add: addModifications,
            remove: removeModifications,
            totalChanges: this.state.pendingChanges.size
        };
    },

    /**
     * 변경사항 확정 후 정리
     */
    confirmChanges() {
        console.log(`✅ 변경사항 확정: ${this.state.pendingChanges.size}개`);
        
        // 변경사항을 원본 데이터에 병합
        this.state.pendingChanges.forEach((change, menuName) => {
            if (change.newQuantity > 0) {
                this.state.originalOrders.set(menuName, {
                    id: change.menuId,
                    menuId: change.menuId,
                    menuName: change.menuName,
                    price: change.price,
                    quantity: change.newQuantity,
                    cookingStatus: 'PENDING',
                    ticketIds: []
                });
            } else {
                this.state.originalOrders.delete(menuName);
            }
        });

        // 상태 초기화
        this.state.pendingChanges.clear();
        this.clearSelection();
        this.state.hasUnsavedChanges = false;
        this.state.isEditMode = false;
        this.state.lastUpdateTime = Date.now();

        this.notifyStateChange('CHANGES_CONFIRMED');
    },

    /**
     * 변경사항 취소
     */
    cancelChanges() {
        console.log(`🚫 변경사항 취소: ${this.state.pendingChanges.size}개`);
        
        this.state.pendingChanges.clear();
        this.clearSelection();
        this.state.hasUnsavedChanges = false;
        this.state.isEditMode = false;
        this.state.lastUpdateTime = Date.now();

        this.notifyStateChange('CHANGES_CANCELLED');
    },

    /**
     * 현재 상태 정보 가져오기
     */
    getState() {
        return {
            ...this.state,
            // 컴퓨트된 값들
            totalOriginalOrders: this.state.originalOrders.size,
            totalPendingChanges: this.state.pendingChanges.size,
            hasSelection: this.state.selectedOrder !== null,
            displayOrders: this.generateDisplayOrders()
        };
    },

    /**
     * 상태 변경 리스너 등록
     */
    addStateListener(listener) {
        this.listeners.add(listener);
    },

    /**
     * 상태 변경 리스너 제거
     */
    removeStateListener(listener) {
        this.listeners.delete(listener);
    },

    /**
     * 상태 변경 알림
     */
    notifyStateChange(eventType, data = null) {
        const eventData = {
            type: eventType,
            timestamp: Date.now(),
            state: this.getState(),
            data: data
        };

        console.log(`📢 상태 변경 이벤트: ${eventType}`, data);

        this.listeners.forEach(listener => {
            try {
                listener(eventData);
            } catch (error) {
                console.error('❌ 상태 리스너 실행 오류:', error);
            }
        });
    },

    /**
     * 헬퍼 메서드들
     */
    hasUnsavedChanges() {
        return this.state.hasUnsavedChanges;
    },

    isInEditMode() {
        return this.state.isEditMode;
    },

    getSelectedOrder() {
        return this.state.selectedOrder;
    },

    getPendingChanges() {
        return new Map(this.state.pendingChanges);
    },

    getOriginalOrders() {
        return new Map(this.state.originalOrders);
    },

    /**
     * 편집모드 강제 해제 (외부 호출용)
     */
    exitEditMode() {
        console.log('🚪 편집모드 강제 해제');
        this.clearSelection();
        this.state.isEditMode = false;
        this.notifyStateChange('EDIT_MODE_EXITED');
    }
};

// 전역으로 등록
window.OrderStateManager = OrderStateManager;
