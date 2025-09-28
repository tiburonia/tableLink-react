
/**
 * 주문 수정 관리 모듈 (리팩토링 버전)
 * - 단순화된 상태 관리
 * - 명확한 누적 로직
 * - 안정적인 UI 동기화
 */

const OrderModificationManager = {
    // 상태 관리
    pendingChanges: new Map(), // menuName을 키로 하는 변경사항 맵
    selectedOrder: null,
    isEditMode: false,

    /**
     * 초기화
     */
    initialize() {
        this.pendingChanges.clear();
        this.selectedOrder = null;
        this.isEditMode = false;
        this.updateEditModeUI(false);
    },

    /**
     * 메뉴 추가/수량 증가 (통합 로직)
     */
    addMenuItem(menuId, menuName, price, quantity = 1) {
        console.log(`📝 메뉴 추가/증가: ${menuName} +${quantity}개`);

        // 기존 주문에서 찾기
        const existingOrder = this.findExistingOrder(menuId, menuName);
        const originalQuantity = existingOrder ? existingOrder.quantity : 0;

        // 현재 변경사항에서 찾기
        const currentChange = this.pendingChanges.get(menuName);
        const currentQuantity = currentChange ? currentChange.newQuantity : originalQuantity;

        const newQuantity = currentQuantity + quantity;

        // 변경사항 저장
        this.setPendingChange(menuName, {
            menuId: parseInt(menuId),
            menuName: menuName,
            price: price,
            originalQuantity: originalQuantity,
            newQuantity: newQuantity,
            changeType: 'add'
        });

        // UI 업데이트
        this.updateOrderDisplay();
        this.activateEditMode();

        console.log(`✅ 메뉴 추가 완료: ${menuName} (${originalQuantity} → ${newQuantity})`);
    },

    /**
     * 선택된 주문 수량 증가
     */
    addQuantityToSelected() {
        if (!this.selectedOrder) {
            alert('수정할 주문을 먼저 선택해주세요.');
            return;
        }

        console.log(`📈 선택된 주문 수량 증가: ${this.selectedOrder.menuName}`);
        
        // addMenuItem 메서드를 직접 호출하여 일관성 유지
        this.addMenuItem(
            this.selectedOrder.menuId, 
            this.selectedOrder.menuName, 
            this.selectedOrder.price || this.getMenuPrice(this.selectedOrder.menuId), 
            1
        );
    },

    /**
     * 선택된 주문 수량 감소
     */
    minusQuantityFromSelected() {
        if (!this.selectedOrder) {
            alert('수정할 주문을 먼저 선택해주세요.');
            return;
        }

        console.log(`📉 선택된 주문 수량 감소: ${this.selectedOrder.menuName}`);

        const menuName = this.selectedOrder.menuName;
        const menuId = this.selectedOrder.menuId;
        const price = this.selectedOrder.price || this.getMenuPrice(menuId);

        // 기존 주문에서 원본 수량 찾기
        const existingOrder = this.findExistingOrder(menuId, menuName);
        const originalQuantity = existingOrder ? existingOrder.quantity : 0;

        // 현재 변경사항에서 현재 수량 가져오기
        const currentChange = this.pendingChanges.get(menuName);
        const currentQuantity = currentChange ? currentChange.newQuantity : originalQuantity;

        if (currentQuantity <= 1) {
            if (!confirm(`${menuName}을(를) 완전히 삭제하시겠습니까?`)) {
                return;
            }
        }

        const newQuantity = Math.max(0, currentQuantity - 1);

        // 변경사항 저장 (addMenuItem과 동일한 로직)
        this.setPendingChange(menuName, {
            menuId: parseInt(menuId),
            menuName: menuName,
            price: price,
            originalQuantity: originalQuantity,
            newQuantity: newQuantity,
            changeType: 'minus'
        });

        // UI 업데이트
        this.updateOrderDisplay();
        this.activateEditMode();

        console.log(`✅ 수량 감소 완료: ${menuName} (${originalQuantity} → ${newQuantity})`);
    },

    /**
     * 변경사항 설정
     */
    setPendingChange(menuName, change) {
        this.pendingChanges.set(menuName, change);
        console.log(`💾 변경사항 저장: ${menuName}`, change);
    },

    /**
     * 주문 행 선택
     */
    toggleOrderRowSelection(orderId, menuName, quantity) {
        console.log(`🎯 주문 행 선택: ${menuName}`);

        const rowElement = document.querySelector(`.pos-order-table tr[data-order-id="${orderId}"]`);
        if (!rowElement) {
            console.warn(`⚠️ 주문 행을 찾을 수 없음: ${orderId}`);
            return;
        }

        // 이미 선택된 행이면 선택 해제
        if (rowElement.classList.contains('selected')) {
            this.clearSelection();
            return;
        }

        // 기존 선택 해제
        this.clearSelection();

        // 새로운 행 선택
        rowElement.classList.add('selected');

        // 선택된 주문 정보 설정
        this.selectedOrder = {
            orderId: orderId,
            menuId: rowElement.dataset.menuId || orderId,
            menuName: menuName,
            quantity: quantity,
            originalQuantity: this.getOriginalQuantity(rowElement.dataset.menuId || orderId, menuName),
            rowElement: rowElement,
            price: this.getMenuPrice(rowElement.dataset.menuId || orderId)
        };

        this.activateEditMode();
        console.log(`✅ 주문 선택됨:`, this.selectedOrder);
    },

    /**
     * 선택 해제
     */
    clearSelection() {
        document.querySelectorAll('.pos-order-table tr').forEach(row => {
            row.classList.remove('selected');
        });
        this.selectedOrder = null;
    },

    /**
     * 편집 모드 활성화
     */
    activateEditMode() {
        this.isEditMode = true;
        this.updateEditModeUI(true);
    },

    /**
     * 편집 모드 UI 업데이트
     */
    updateEditModeUI(isActive) {
        const minusBtn = document.querySelector('.control-btn.quantity-minus');
        const confirmBtn = document.getElementById('confirmOrder');

        if (isActive && (this.selectedOrder || this.pendingChanges.size > 0)) {
            // 편집 모드 활성화
            if (minusBtn) {
                minusBtn.disabled = false;
                minusBtn.style.opacity = '1';
            }

            if (confirmBtn) {
                const methodName = confirmBtn.querySelector('.method-name');
                if (methodName) {
                    methodName.textContent = this.pendingChanges.size > 0 ? '확정' : '주문';
                }
                confirmBtn.classList.add('edit-mode');
            }

            // 편집 상태 표시
            this.showEditModeIndicator();
        } else {
            // 편집 모드 비활성화
            if (minusBtn) {
                minusBtn.disabled = true;
                minusBtn.style.opacity = '0.5';
            }

            if (confirmBtn) {
                const methodName = confirmBtn.querySelector('.method-name');
                if (methodName) {
                    methodName.textContent = '주문';
                }
                confirmBtn.classList.remove('edit-mode');
            }

            // 편집 상태 표시 제거
            this.hideEditModeIndicator();
        }
    },

    /**
     * 편집 모드 표시기
     */
    showEditModeIndicator() {
        this.hideEditModeIndicator(); // 기존 제거

        if (this.pendingChanges.size === 0) return;

        const changesText = Array.from(this.pendingChanges.values())
            .map(change => {
                const diff = change.newQuantity - change.originalQuantity;
                if (change.newQuantity === 0) {
                    return `${change.menuName}: 삭제`;
                } else if (diff > 0) {
                    return `${change.menuName}: +${diff}개`;
                } else if (diff < 0) {
                    return `${change.menuName}: ${diff}개`;
                }
                return `${change.menuName}: 변경없음`;
            })
            .join(', ');

        const indicator = document.createElement('div');
        indicator.className = 'edit-mode-indicator';
        indicator.innerHTML = `📝 ${this.pendingChanges.size}개 변경사항: ${changesText}`;
        document.body.appendChild(indicator);
    },

    /**
     * 편집 모드 표시기 제거
     */
    hideEditModeIndicator() {
        const indicator = document.querySelector('.edit-mode-indicator');
        if (indicator) {
            indicator.remove();
        }
    },

    /**
     * 주문 표시 업데이트 (전체 재렌더링)
     */
    updateOrderDisplay() {
        const posOrderList = document.getElementById("posOrderList");
        if (!posOrderList) return;

        // 통합된 주문 데이터 생성
        const displayOrders = this.generateDisplayOrders();

        // UI 렌더링
        posOrderList.innerHTML = this.renderOrderTable(displayOrders);

        // 선택 상태 복원
        if (this.selectedOrder) {
            setTimeout(() => {
                const selectedRow = document.querySelector(`.pos-order-table tr[data-menu-name="${this.selectedOrder.menuName}"]`);
                if (selectedRow) {
                    selectedRow.classList.add('selected');
                }
            }, 50);
        }

        console.log(`🔄 주문 표시 업데이트 완료: ${displayOrders.length}개 항목`);
    },

    /**
     * 표시용 주문 데이터 생성
     */
    generateDisplayOrders() {
        const displayOrders = new Map();

        // 1. 기존 주문 추가
        if (window.POSOrderScreen && window.POSOrderScreen.currentOrders) {
            window.POSOrderScreen.currentOrders.forEach(order => {
                if (!order.isCart && !order.isNewMenu) {
                    displayOrders.set(order.menuName, {
                        id: order.id,
                        menuId: order.menuId || order.id,
                        menuName: order.menuName,
                        price: order.price,
                        quantity: order.quantity,
                        cookingStatus: order.cookingStatus || 'PENDING',
                        isOriginal: true
                    });
                }
            });
        }

        // 2. 변경사항 적용
        this.pendingChanges.forEach((change, menuName) => {
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
     * 주문 테이블 렌더링
     */
    renderOrderTable(orders) {
        const tableHeader = `
            <table class="pos-order-table">
                <thead>
                    <tr>
                        <th class="col-menu">메뉴명</th>
                        <th class="col-price">단가</th>
                        <th class="col-quantity">수량</th>
                        <th class="col-total">합계</th>
                        <th class="col-status">상태</th>
                    </tr>
                </thead>
                <tbody>
        `;

        let tableBody = "";

        if (orders.length > 0) {
            tableBody = orders.map(order => {
                const isModified = order.isModified;
                const willBeDeleted = isModified && order.quantity === 0;

                return `
                    <tr class="order-row ${willBeDeleted ? 'will-be-removed' : ''}" 
                        data-order-id="${order.id}" 
                        data-menu-id="${order.menuId}"
                        data-menu-name="${order.menuName}"
                        onclick="OrderModificationManager.toggleOrderRowSelection('${order.id}', '${order.menuName}', ${order.quantity})"
                        style="cursor: pointer;">
                        <td class="col-menu">
                            <div class="menu-info">
                                <strong>${order.menuName}</strong>
                                ${isModified ? '<span class="modified-badge">수정됨</span>' : ''}
                            </div>
                        </td>
                        <td class="col-price">
                            ${order.price.toLocaleString()}원
                        </td>
                        <td class="col-quantity">
                            <div class="quantity-control-table">
                                <span class="quantity-display">${order.quantity}</span>
                            </div>
                        </td>
                        <td class="col-total">
                            <strong>${(order.price * order.quantity).toLocaleString()}원</strong>
                        </td>
                        <td class="col-status">
                            <span class="status-badge status-${order.cookingStatus?.toLowerCase() || 'pending'}">
                                ${this.getStatusText(order.cookingStatus)}
                            </span>
                        </td>
                    </tr>
                `;
            }).join("");
        } else {
            // 빈 행들로 기본 프레임 유지
            for (let i = 0; i < 10; i++) {
                tableBody += `
                    <tr class="empty-row">
                        <td class="col-menu"></td>
                        <td class="col-price"></td>
                        <td class="col-quantity"></td>
                        <td class="col-total"></td>
                        <td class="col-status"></td>
                    </tr>
                `;
            }
        }

        const tableFooter = `
                </tbody>
            </table>
        `;

        return tableHeader + tableBody + tableFooter;
    },

    /**
     * 모든 변경사항 취소
     */
    cancelAllChanges() {
        console.log('🚫 모든 변경사항 취소');

        // 변경사항 초기화
        this.pendingChanges.clear();
        this.clearSelection();
        this.isEditMode = false;

        // UI 업데이트
        this.updateOrderDisplay();
        this.updateEditModeUI(false);

        // currentOrders에서 임시 아이템 제거
        if (window.POSOrderScreen && window.POSOrderScreen.currentOrders) {
            const originalLength = window.POSOrderScreen.currentOrders.length;
            window.POSOrderScreen.currentOrders = window.POSOrderScreen.currentOrders.filter(order =>
                !order.isNewMenu && !order.isPendingAddition && !String(order.id).startsWith('temp_')
            );
            const removedCount = originalLength - window.POSOrderScreen.currentOrders.length;
            if (removedCount > 0) {
                console.log(`🗑️ ${removedCount}개 임시 항목 제거`);
            }
        }

        window.POSOrderScreen?.showToast("모든 변경사항이 취소되었습니다");
    },

    /**
     * 모든 변경사항 확정
     */
    async confirmAllChanges() {
        if (this.pendingChanges.size === 0) {
            console.log('ℹ️ 확정할 변경사항이 없습니다.');
            window.POSOrderScreen?.showToast("변경사항이 없습니다");
            return;
        }

        try {
            console.log(`🔧 주문 수정 확정 시작: ${this.pendingChanges.size}개 변경사항`);

            const storeId = window.POSOrderScreen?.currentStoreId;
            const tableNumber = window.POSOrderScreen?.currentTableNumber;

            if (!storeId || !tableNumber) {
                throw new Error('매장 정보 또는 테이블 정보가 없습니다.');
            }

            // 변경사항을 API 형태로 변환
            const apiData = this.convertChangesToAPIFormat();

            // 확인 메시지
            const confirmationText = this.generateConfirmationText();
            if (!confirm(`다음 변경사항을 확정하시겠습니까?\n\n${confirmationText}`)) {
                console.log('🚫 사용자가 변경사항 확정을 취소했습니다.');
                return;
            }

            // API 호출
            const response = await fetch('/api/pos/orders/modify-batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    storeId: parseInt(storeId),
                    tableNumber: parseInt(tableNumber),
                    modifications: apiData
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'batch 수정 처리 실패');
            }

            const result = await response.json();
            console.log(`✅ 주문 수정 확정 완료:`, result);

            // 성공 처리
            window.POSOrderScreen?.showToast(`주문 수정 완료! (${this.pendingChanges.size}개 처리)`);
            this.resetAfterConfirm();
            await window.POSOrderScreen?.refreshOrders();

        } catch (error) {
            console.error('❌ 주문 수정 확정 실패:', error);
            alert(`주문 수정 중 오류가 발생했습니다:\n${error.message}`);
        }
    },

    /**
     * 변경사항을 API 형태로 변환
     */
    convertChangesToAPIFormat() {
        const addModifications = {};
        const removeModifications = {};

        this.pendingChanges.forEach((change) => {
            const diff = change.newQuantity - change.originalQuantity;
            
            if (diff > 0) {
                // 증가
                addModifications[change.menuName] = diff;
            } else if (diff < 0) {
                // 감소
                removeModifications[change.menuName] = Math.abs(diff);
            }
        });

        return {
            add: addModifications,
            remove: removeModifications
        };
    },

    /**
     * 확인 메시지 생성
     */
    generateConfirmationText() {
        const changes = Array.from(this.pendingChanges.values()).map(change => {
            const diff = change.newQuantity - change.originalQuantity;
            if (change.newQuantity === 0) {
                return `• ${change.menuName}: 삭제 (${change.originalQuantity}개 → 0개)`;
            } else if (diff > 0) {
                return `• ${change.menuName}: ${diff}개 증가 (${change.originalQuantity}개 → ${change.newQuantity}개)`;
            } else if (diff < 0) {
                return `• ${change.menuName}: ${Math.abs(diff)}개 감소 (${change.originalQuantity}개 → ${change.newQuantity}개)`;
            }
            return `• ${change.menuName}: 변경없음`;
        });

        return changes.join('\n');
    },

    /**
     * 확정 후 초기화
     */
    resetAfterConfirm() {
        this.pendingChanges.clear();
        this.clearSelection();
        this.isEditMode = false;
        this.updateEditModeUI(false);
    },

    /**
     * 헬퍼 함수들
     */
    findExistingOrder(menuId, menuName) {
        if (!window.POSOrderScreen || !window.POSOrderScreen.currentOrders) return null;

        return window.POSOrderScreen.currentOrders.find(order => 
            (order.menuName === menuName || order.menuId === parseInt(menuId)) && 
            !order.isCart && !order.isNewMenu
        );
    },

    getOriginalQuantity(menuId, menuName) {
        const existingOrder = this.findExistingOrder(menuId, menuName);
        return existingOrder ? existingOrder.quantity : 0;
    },

    getMenuPrice(menuId) {
        return window.POSOrderScreen?.getMenuPrice(menuId) || 0;
    },

    getStatusText(status) {
        const statusMap = {
            PENDING: "대기",
            COOKING: "조리중",
            READY: "완료",
            SERVED: "서빙완료",
            COMPLETED: "완료",
            CANCELLED: "취소됨"
        };
        return statusMap[status] || "대기";
    }
};

// 전역으로 등록
window.OrderModificationManager = OrderModificationManager;
