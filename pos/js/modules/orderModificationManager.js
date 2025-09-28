/**
 * 주문 수정 관리 모듈 (통합 상태 관리 기반)
 * - OrderStateManager를 통한 중앙 집중식 상태 관리
 * - 일관된 로직과 명확한 책임 분리
 */

const OrderModificationManager = {
    /**
     * 초기화
     */
    initialize() {
        console.log('🔧 OrderModificationManager 초기화 (통합 상태 관리 기반)');

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
            case 'QUANTITY_UPDATED':
            case 'ORDER_SELECTED':
            case 'SELECTION_CLEARED':
            case 'CHANGES_CONFIRMED':
            case 'CHANGES_CANCELLED':
                this.updateOrderDisplay();
                this.updateEditModeUI(event.state.isEditMode);
                break;

            case 'ORIGINAL_ORDERS_LOADED':
                this.updateOrderDisplay();
                break;
        }
    },

    /**
     * 메뉴 추가/수량 증가
     */
    addMenuItem(menuId, menuName, price, quantity = 1) {
        console.log(`📝 메뉴 추가/증가: ${menuName} +${quantity}개`);

        const result = OrderStateManager.updateMenuQuantity(
            menuId,
            menuName,
            price,
            quantity,
            'add'
        );

        // 추가된 메뉴 행을 자동으로 선택
        setTimeout(() => {
            this.autoSelectMenuRow(menuId, menuName, result.newQuantity);
        }, 100);

        console.log(`✅ 메뉴 추가 완료: ${menuName} (${result.originalQuantity} → ${result.newQuantity})`);
    },

    /**
     * 선택된 주문 수량 증가
     */
    addQuantityToSelected() {
        console.log(`📈 수량 증가 요청`);

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

        this.addMenuItem(selected.menuId, selected.menuName, selected.price, 1);
    },

    /**
     * 선택된 주문 수량 감소
     */
    minusQuantityFromSelected() {
        console.log(`📉 수량 감소 요청`);

        const selectedOrder = OrderStateManager.getSelectedOrder();

        if (!selectedOrder) {
            console.warn('⚠️ 선택된 주문이 없음 - 자동 선택 시도');
            if (!this.tryAutoSelectFirst()) {
                alert('수정할 주문을 먼저 선택해주세요.');
                return;
            }
        }

        const selected = OrderStateManager.getSelectedOrder();
        const currentState = OrderStateManager.getState();

        // 현재 수량 확인
        const pendingChange = currentState.pendingChanges.get(selected.menuName);
        const currentQuantity = pendingChange ? pendingChange.newQuantity : selected.originalQuantity;

        if (currentQuantity <= 1) {
            if (!confirm(`${selected.menuName}을(를) 완전히 삭제하시겠습니까?`)) {
                return;
            }
        }

        console.log(`📉 선택된 주문 수량 감소: ${selected.menuName}`);

        OrderStateManager.updateMenuQuantity(
            selected.menuId,
            selected.menuName,
            selected.price,
            -1,
            'minus'
        );
    },

    /**
     * 주문 행 선택 토글
     */
    toggleOrderRowSelection(orderId, menuName, quantity) {
        console.log(`🎯 주문 행 선택 토글: ${menuName} (ID: ${orderId})`);

        // 행 요소 찾기
        const rowElement = this.findOrderRowElement(orderId, menuName);

        if (!rowElement) {
            console.warn(`⚠️ 주문 행을 찾을 수 없음: orderId=${orderId}, menuName=${menuName}`);
            return false;
        }

        // 이미 선택된 행이면 선택 해제
        if (rowElement.classList.contains('selected')) {
            console.log(`🔄 기존 선택 해제: ${menuName}`);
            OrderStateManager.clearSelection();
            return false;
        }

        // 새로운 행 선택
        return OrderStateManager.selectOrder(orderId, menuName, quantity, rowElement);
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
     * 메뉴 행 자동 선택
     */
    autoSelectMenuRow(menuId, menuName, quantity) {
        console.log(`🎯 자동 선택 시도: ${menuName}`);

        const orderId = menuId;
        const selectionResult = this.toggleOrderRowSelection(orderId, menuName, quantity);

        if (!selectionResult) {
            console.warn(`⚠️ 자동 선택 실패: ${menuName}`);
        } else {
            console.log(`✅ 자동 선택 성공: ${menuName}`);
        }
    },

    /**
     * 주문 표시 업데이트
     */
    updateOrderDisplay() {
        const posOrderList = document.getElementById("posOrderList");
        if (!posOrderList) return;

        // 상태 관리자에서 표시용 데이터 가져오기
        const displayOrders = OrderStateManager.generateDisplayOrders();

        // UI 렌더링
        posOrderList.innerHTML = this.renderOrderTable(displayOrders);

        console.log(`🔄 주문 표시 업데이트 완료: ${displayOrders.length}개 항목`);
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

        if (isActive && (state.hasSelection || state.totalPendingChanges > 0)) {
            // 편집 모드 활성화
            if (minusBtn) {
                minusBtn.disabled = false;
                minusBtn.style.opacity = '1';
                minusBtn.classList.add('active');
            }

            if (addBtn) {
                addBtn.disabled = false;
                addBtn.style.opacity = '1';
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
        if (state.totalPendingChanges === 0) return;

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

        const indicator = document.createElement('div');
        indicator.className = 'edit-mode-indicator';
        indicator.innerHTML = `📝 ${state.totalPendingChanges}개 변경사항: ${changesText}`;
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