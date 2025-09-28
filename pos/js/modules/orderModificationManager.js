
/**
 * 주문 수정 관리 모듈 (v2.0)
 * - OrderStateManager v2.0 기반
 * - addToOrder와 toggleOrderRowSelection 통합 지원
 */

const OrderModificationManager = {
    // pendingChanges 속성 명시적 정의 (하위 호환성)
    get pendingChanges() {
        return OrderStateManager?.getPendingChanges() || new Map();
    },

    /**
     * 초기화
     */
    initialize() {
        console.log('🔧 OrderModificationManager v2.0 초기화');

        // 상태 관리자 초기화
        OrderStateManager.initialize();

        // 상태 변경 리스너 등록
        OrderStateManager.addStateListener(this.handleStateChange.bind(this));

        // UI 업데이트
        this.updateEditModeUI(false);
    },

    /**
     * 상태 변경 이벤트 핸들러
     */
    handleStateChange(event) {
        console.log(`🔄 상태 변경 감지: ${event.type}`, event.data);

        switch (event.type) {
            case 'MENU_ADDED_WITH_SELECTION':
            case 'ROW_SELECTION_TOGGLED':
            case 'ROW_SELECTION_MAINTAINED':
            case 'QUANTITY_UPDATED':
            case 'SELECTION_CLEARED':
            case 'CHANGES_CONFIRMED':
            case 'CHANGES_CANCELLED':
            case 'EDIT_MODE_EXITED':
                this.updateOrderDisplay();
                this.updateEditModeUI(event.state.isEditMode);
                break;

            case 'ORIGINAL_ORDERS_LOADED':
                this.updateOrderDisplay();
                break;
        }
    },

    /**
     * 메뉴 추가 (addToOrder용)
     * - 편집모드 전환 + 자동 선택
     */
    addMenuItem(menuId, menuName, price, quantity = 1) {
        console.log(`📝 메뉴 추가 (편집모드+선택): ${menuName} +${quantity}개`);

        const result = OrderStateManager.addMenuWithSelection(menuId, menuName, price, quantity);

        console.log(`✅ 메뉴 추가 완료: ${menuName} (${result.originalQuantity} → ${result.newQuantity})`);
        return result;
    },

    /**
     * 주문 행 선택 토글 (toggleOrderRowSelection용)
     * - 편집모드 전환 + 선택 토글
     */
    toggleOrderRowSelection(orderId, menuName, quantity) {
        console.log(`🎯 주문 행 선택 토글 (편집모드): ${menuName} (ID: ${orderId})`);

        // 행 요소 찾기
        const rowElement = this.findOrderRowElement(orderId, menuName);

        if (!rowElement) {
            console.warn(`⚠️ 주문 행을 찾을 수 없음: orderId=${orderId}, menuName=${menuName}`);
            return false;
        }

        return OrderStateManager.toggleRowSelection(orderId, menuName, quantity, rowElement);
    },

    /**
     * 선택된 주문 수량 증가
     */
    addQuantityToSelected() {
        console.log(`📈 선택된 주문 수량 증가`);

        const selectedOrder = OrderStateManager.getSelectedOrder();

        if (!selectedOrder) {
            console.warn('⚠️ 선택된 주문이 없음 - 자동 선택 시도');
            if (!this.tryAutoSelectFirst()) {
                alert('수정할 주문을 먼저 선택해주세요.');
                return;
            }
        }

        const selected = OrderStateManager.getSelectedOrder();
        console.log(`📈 선택된 주문 수량 증가: ${selected.menuName}`);

        // 기존 메뉴에 수량만 추가 (편집모드는 이미 활성화됨)
        const result = OrderStateManager.updateMenuQuantity(
            selected.menuId,
            selected.menuName,
            selected.price,
            1,
            'add'
        );

        // 상태 변경 알림
        OrderStateManager.notifyStateChange('QUANTITY_UPDATED', {
            menuName: selected.menuName,
            originalQuantity: result.originalQuantity,
            newQuantity: result.newQuantity,
            changeType: 'add'
        });
    },

    /**
     * 선택된 주문 수량 감소
     */
    minusQuantityFromSelected() {
        console.log(`📉 선택된 주문 수량 감소`);

        const selectedOrder = OrderStateManager.getSelectedOrder();

        if (!selectedOrder) {
            console.warn('⚠️ 선택된 주문이 없음 - 자동 선택 시도');
            if (!this.tryAutoSelectFirst()) {
                alert('수정할 주문을 먼저 선택해주세요.');
                return;
            }
        }

        const selected = OrderStateManager.getSelectedOrder();
        const state = OrderStateManager.getState();

        // 현재 수량 확인
        const pendingChange = state.pendingChanges.get(selected.menuName);
        const currentQuantity = pendingChange ? pendingChange.newQuantity : selected.originalQuantity;

        if (currentQuantity <= 1) {
            if (!confirm(`${selected.menuName}을(를) 0개로 만들어 주문에서 제외하시겠습니까?`)) {
                return;
            }
        }

        console.log(`📉 선택된 주문 수량 감소: ${selected.menuName}`);

        // 수량 감소 (0까지 허용)
        const result = OrderStateManager.updateMenuQuantity(
            selected.menuId,
            selected.menuName,
            selected.price,
            -1,
            'minus'
        );

        // 상태 변경 알림
        OrderStateManager.notifyStateChange('QUANTITY_UPDATED', {
            menuName: selected.menuName,
            originalQuantity: result.originalQuantity,
            newQuantity: result.newQuantity,
            changeType: 'minus'
        });
    },

    /**
     * 주문 행 요소 찾기
     */
    findOrderRowElement(orderId, menuName) {
        // 1차: data-order-id로 찾기
        let rowElement = document.querySelector(`.pos-order-table tr.order-row[data-order-id="${orderId}"]`);

        // 2차: 메뉴명으로 찾기
        if (!rowElement) {
            const allRows = document.querySelectorAll('.pos-order-table tr.order-row');
            for (const row of allRows) {
                const menuText = row.querySelector('.menu-info strong')?.textContent?.trim();
                if (menuText === menuName) {
                    rowElement = row;
                    console.log(`🎯 메뉴명으로 행 발견: ${menuName}`);
                    break;
                }
            }
        }

        return rowElement;
    },

    /**
     * 첫 번째 주문 자동 선택 시도
     */
    tryAutoSelectFirst() {
        const firstOrderRow = document.querySelector('.pos-order-table tr.order-row');
        if (firstOrderRow) {
            const orderId = firstOrderRow.dataset.orderId;
            const menuName = firstOrderRow.querySelector('.menu-info strong')?.textContent?.trim();
            const quantity = parseInt(firstOrderRow.querySelector('.quantity-display')?.textContent) || 1;

            console.log(`🔄 첫 번째 주문 자동 선택: ${menuName}`);
            return this.toggleOrderRowSelection(orderId, menuName, quantity);
        }
        return false;
    },

    /**
     * 주문 표시 업데이트
     */
    updateOrderDisplay() {
        const posOrderList = document.getElementById("posOrderList");
        if (!posOrderList) {
            console.warn('⚠️ posOrderList 요소를 찾을 수 없음');
            return;
        }

        try {
            // 상태 관리자에서 표시용 데이터 가져오기
            const displayOrders = OrderStateManager?.generateDisplayOrders() || [];

            // UI 렌더링
            posOrderList.innerHTML = this.renderOrderTable(displayOrders);

            // 선택 상태 복원 (약간의 지연 후)
            setTimeout(() => {
                this.restoreSelectionUI();
            }, 10);

            console.log(`🔄 주문 표시 업데이트 완료: ${displayOrders.length}개 항목`);

            // POSOrderScreen의 currentOrders도 동기화
            if (window.POSOrderScreen && displayOrders.length > 0) {
                // 기존 currentOrders에서 카트가 아닌 항목들을 표시 주문으로 교체
                const nonCartOrders = window.POSOrderScreen.currentOrders?.filter(order => order.isCart || order.sessionId) || [];
                window.POSOrderScreen.currentOrders = [...displayOrders, ...nonCartOrders];
            }

        } catch (error) {
            console.error('❌ 주문 표시 업데이트 실패:', error);
        }
    },

    /**
     * 선택 상태 UI 복원
     */
    restoreSelectionUI() {
        const selectedOrder = OrderStateManager.getSelectedOrder();
        if (selectedOrder) {
            const rowElement = this.findOrderRowElement(selectedOrder.orderId, selectedOrder.menuName);
            if (rowElement) {
                OrderStateManager.applySelectionUI(rowElement);
                // 상태 매니저의 rowElement 참조 업데이트
                OrderStateManager.state.selectedRowElement = rowElement;
            }
        }
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
                const willBeDeleted = order.willBeDeleted || (isModified && order.quantity === 0);
                const isZeroQuantity = order.quantity === 0;

                return `
                    <tr class="order-row ${willBeDeleted ? 'will-be-removed' : ''} ${isZeroQuantity ? 'zero-quantity' : ''}"
                        data-order-id="${order.id}"
                        data-menu-id="${order.menuId}"
                        data-menu-name="${order.menuName}"
                        onclick="OrderModificationManager.toggleOrderRowSelection('${order.id}', '${order.menuName}', ${order.quantity})"
                        style="cursor: pointer;">
                        <td class="col-menu">
                            <div class="menu-info">
                                <strong>${order.menuName}</strong>
                                ${isZeroQuantity ? '<span class="zero-indicator">(삭제 예정)</span>' : ''}
                            </div>
                        </td>
                        <td class="col-price">
                            ${order.price.toLocaleString()}원
                        </td>
                        <td class="col-quantity">
                            <div class="quantity-control-table">
                                <span class="quantity-display ${isZeroQuantity ? 'zero' : ''}">${order.quantity}</span>
                            </div>
                        </td>
                        <td class="col-total">
                            <strong class="${isZeroQuantity ? 'zero' : ''}">${(order.price * order.quantity).toLocaleString()}원</strong>
                        </td>
                        <td class="col-status">
                            <span class="status-badge status-${order.cookingStatus?.toLowerCase() || 'pending'} ${isZeroQuantity ? 'status-cancelled' : ''}">
                                ${isZeroQuantity ? '삭제예정' : this.getStatusText(order.cookingStatus)}
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
     * 편집 모드 UI 업데이트
     */
    updateEditModeUI(isActive) {
        const minusBtn = document.querySelector('.control-btn.quantity-minus');
        const confirmBtn = document.getElementById('confirmOrder');
        const addBtn = document.querySelector('.control-btn.quantity-add');
        const state = OrderStateManager.getState();

        console.log(`🎛️ 편집 모드 UI 업데이트: ${isActive ? '활성화' : '비활성화'}`, {
            hasSelection: state.hasSelection,
            pendingChanges: state.totalPendingChanges,
            isEditMode: state.isEditMode
        });

        if (isActive) {
            // 편집 모드 활성화
            if (minusBtn) {
                minusBtn.disabled = !state.hasSelection; // 선택이 있을 때만 활성화
                minusBtn.style.opacity = state.hasSelection ? '1' : '0.5';
                if (state.hasSelection) {
                    minusBtn.classList.add('active');
                }
            }

            if (addBtn) {
                addBtn.disabled = !state.hasSelection; // 선택이 있을 때만 활성화
                addBtn.style.opacity = state.hasSelection ? '1' : '0.5';
            }

            if (confirmBtn) {
                const methodName = confirmBtn.querySelector('.method-name');
                if (methodName) {
                    methodName.textContent = state.totalPendingChanges > 0 ? '확정' : '주문';
                }
                confirmBtn.classList.add('edit-mode');
            }

            this.showEditModeIndicator();
        } else {
            // 편집 모드 비활성화
            if (minusBtn) {
                minusBtn.disabled = true;
                minusBtn.style.opacity = '0.5';
                minusBtn.classList.remove('active');
            }

            if (addBtn) {
                addBtn.disabled = false;
                addBtn.style.opacity = '1';
            }

            if (confirmBtn) {
                const methodName = confirmBtn.querySelector('.method-name');
                if (methodName) {
                    methodName.textContent = '주문';
                }
                confirmBtn.classList.remove('edit-mode');
            }

            this.hideEditModeIndicator();
        }
    },

    /**
     * 편집 모드 표시기
     */
    showEditModeIndicator() {
        this.hideEditModeIndicator();

        const state = OrderStateManager.getState();
        if (state.totalPendingChanges === 0 && !state.hasSelection) return;

        let indicatorText = "📝 편집모드";

        if (state.hasSelection) {
            indicatorText += ` | 선택: ${state.selectedOrder.menuName}`;
        }

        if (state.totalPendingChanges > 0) {
            const pendingChanges = OrderStateManager.getPendingChanges();
            const changesText = Array.from(pendingChanges.values())
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

            indicatorText += ` | 변경: ${changesText}`;
        }

        const indicator = document.createElement('div');
        indicator.className = 'edit-mode-indicator';
        indicator.innerHTML = indicatorText;
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
     * 모든 변경사항 취소
     */
    cancelAllChanges() {
        console.log('🚫 모든 변경사항 취소');

        OrderStateManager.cancelChanges();

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
        const state = OrderStateManager.getState();

        if (state.totalPendingChanges === 0) {
            console.log('ℹ️ 확정할 변경사항이 없습니다.');
            window.POSOrderScreen?.showToast("변경사항이 없습니다");
            return;
        }

        try {
            console.log(`🔧 주문 수정 확정 시작: ${state.totalPendingChanges}개 변경사항`);

            const storeId = window.POSOrderScreen?.currentStoreId;
            const tableNumber = window.POSOrderScreen?.currentTableNumber;

            if (!storeId || !tableNumber) {
                throw new Error('매장 정보 또는 테이블 정보가 없습니다.');
            }

            // API 데이터 생성
            const apiData = OrderStateManager.generateAPIChanges();

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
            window.POSOrderScreen?.showToast(`주문 수정 완료! (${state.totalPendingChanges}개 처리)`);

            OrderStateManager.confirmChanges();
            await window.POSOrderScreen?.refreshOrders();

        } catch (error) {
            console.error('❌ 주문 수정 확정 실패:', error);
            alert(`주문 수정 중 오류가 발생했습니다:\n${error.message}`);
        }
    },

    /**
     * 확인 메시지 생성
     */
    generateConfirmationText() {
        const pendingChanges = OrderStateManager.getPendingChanges();
        const changes = Array.from(pendingChanges.values()).map(change => {
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
     * 원본 주문 데이터 설정 (외부에서 호출)
     */
    setOriginalOrders(orders) {
        OrderStateManager.loadOriginalOrders(orders);
    },

    /**
     * 유틸리티 함수들
     */
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
