/**
 * 주문 수정 관리 모듈
 * - 다중 주문 수정 누적 시스템
 * - 수량 증감, 삭제 기능
 * - 수정사항 확정 처리
 */

const OrderModificationManager = {
    pendingModifications: [], // 누적된 수정사항들
    selectedOrder: null, // 선택된 주문 (수정용)

    /**
     * 주문 행 선택 및 수정 기능 (다중 수정 지원)
     */
    toggleOrderRowSelection(orderId, menuName, quantity) {
        console.log(`🎯 주문 행 선택: Order ID ${orderId}, Menu: ${menuName}, Quantity: ${quantity}`);

        const rowElement = document.querySelector(`.pos-order-table tr[data-order-id="${orderId}"]`);
        if (!rowElement) {
            console.warn(`⚠️ 주문 행을 찾을 수 없음: ${orderId}`);
            return;
        }

        // 현재 행이 이미 선택되어 있으면 선택 해제
        if (rowElement.classList.contains('selected')) {
            rowElement.classList.remove('selected', 'order-row-selected');
            this.selectedOrder = null;
            this.updateEditModeUI(false);
            return;
        }

        // 기존 선택 해제
        document.querySelectorAll('.pos-order-table tr').forEach(row => {
            row.classList.remove('selected', 'order-row-selected');
        });

        // 현재 행 선택
        rowElement.classList.add('order-row', 'selected');

        // 선택된 주문 정보 저장
        this.selectedOrder = {
            orderId: orderId,
            menuId: rowElement.dataset.menuId || orderId,
            menuName: menuName,
            quantity: quantity,
            originalQuantity: this.getOriginalQuantity(rowElement.dataset.menuId || orderId),
            rowElement: rowElement
        };

        console.log(`✅ 주문 선택됨:`, this.selectedOrder);

        // UI 상태 업데이트
        this.updateEditModeUI(true);
    },

    /**
     * 선택된 주문의 수량 감소 (다중 수정 누적)
     */
    minusQuantityFromSelected() {
        if (!this.selectedOrder) {
            alert('수정할 주문을 먼저 선택해주세요.');
            return;
        }

        const currentQuantity = this.selectedOrder.quantity;
        const menuId = this.selectedOrder.menuId;
        const menuName = this.selectedOrder.menuName;

        // 수량이 1 이하인 경우 삭제 확인
        if (currentQuantity <= 1) {
            if (!confirm(`${menuName}을(를) 완전히 삭제하시겠습니까?`)) {
                return;
            }
        }

        const newQuantity = Math.max(0, currentQuantity - 1);

        // 원본 수량 확인 (처음 수정할 때만)
        if (!this.selectedOrder.originalQuantity) {
            this.selectedOrder.originalQuantity = this.getOriginalQuantity(menuId);
        }

        // 수정사항을 누적 배열에 추가/업데이트
        this.addToPendingModifications(menuId, menuName, this.selectedOrder.originalQuantity, newQuantity, 'minus');

        // 화면상 수량 업데이트
        this.updateOrderRowDisplay(this.selectedOrder.rowElement, newQuantity, 'minus');

        // 선택된 주문 정보 업데이트
        this.selectedOrder.quantity = newQuantity;
        this.selectedOrder.modified = true;

        console.log(`📉 수량 감소 누적: ${menuName} (${currentQuantity} → ${newQuantity}), 원본: ${this.selectedOrder.originalQuantity}`);

        // UI 상태 업데이트
        this.updateEditModeUI(true);

        // 수정사항 요약 표시 업데이트
        this.updatePendingModificationsSummary();
    },

    /**
     * 선택된 주문의 수량 증가 (다중 수정 누적)
     */
    addQuantityToSelected() {
        if (!this.selectedOrder) {
            alert('수정할 주문을 먼저 선택해주세요.');
            return;
        }

        const currentQuantity = this.selectedOrder.quantity;
        const menuId = this.selectedOrder.menuId;
        const menuName = this.selectedOrder.menuName;

        const newQuantity = currentQuantity + 1;

        // 원본 수량 확인 (처음 수정할 때만)
        if (!this.selectedOrder.originalQuantity) {
            this.selectedOrder.originalQuantity = this.getOriginalQuantity(menuId);
        }

        // 수정사항을 누적 배열에 추가/업데이트
        this.addToPendingModifications(menuId, menuName, this.selectedOrder.originalQuantity, newQuantity, 'plus');

        // 화면상 수량 업데이트
        this.updateOrderRowDisplay(this.selectedOrder.rowElement, newQuantity, 'plus');

        // 선택된 주문 정보 업데이트
        this.selectedOrder.quantity = newQuantity;
        this.selectedOrder.modified = true;

        console.log(`📈 수량 증가 누적: ${menuName} (${currentQuantity} → ${newQuantity}), 원본: ${this.selectedOrder.originalQuantity}`);

        // UI 상태 업데이트
        this.updateEditModeUI(true);

        // 수정사항 요약 표시 업데이트
        this.updatePendingModificationsSummary();
    },

    /**
     * 수정사항을 누적 배열에 추가/업데이트
     */
    addToPendingModifications(menuId, menuName, originalQuantity, newQuantity, actionType = 'auto') {
        const existingIndex = this.pendingModifications.findIndex(mod => mod.menuId === menuId);

        if (existingIndex >= 0) {
            // 기존 수정사항 업데이트
            this.pendingModifications[existingIndex].newQuantity = newQuantity;
            this.pendingModifications[existingIndex].changeAmount = originalQuantity - newQuantity;
            this.pendingModifications[existingIndex].actionType = actionType;
            console.log(`🔄 기존 수정사항 업데이트: ${menuName} (원본: ${originalQuantity} → 새로운: ${newQuantity})`);
        } else {
            // 새로운 수정사항 추가
            this.pendingModifications.push({
                menuId,
                menuName,
                originalQuantity,
                newQuantity,
                changeAmount: originalQuantity - newQuantity,
                actionType: actionType,
                price: this.getMenuPrice(menuId)
            });
            console.log(`➕ 새로운 수정사항 추가: ${menuName} (${originalQuantity} → ${newQuantity})`);
        }

        console.log(`📋 현재 누적된 수정사항: ${this.pendingModifications.length}개`, this.pendingModifications);
    },

    /**
     * 주문 행 화면 업데이트 (공통 함수)
     */
    updateOrderRowDisplay(rowElement, newQuantity, action) {
        const quantityDisplay = rowElement.querySelector('.quantity-display');
        if (quantityDisplay) {
            quantityDisplay.textContent = newQuantity;
            quantityDisplay.classList.add('modified');

            // 액션에 따른 스타일 적용
            if (action === 'minus') {
                if (newQuantity === 0) {
                    // 수량이 0이면 행을 삭제 예정으로 표시
                    rowElement.classList.add('will-be-removed');
                    quantityDisplay.style.backgroundColor = '#fee2e2';
                    quantityDisplay.style.color = '#dc2626';
                } else {
                    // 수량 감소 스타일
                    quantityDisplay.style.backgroundColor = '#fef2f2';
                    quantityDisplay.style.color = '#dc2626';
                    setTimeout(() => {
                        quantityDisplay.style.backgroundColor = '#f9fafb';
                        quantityDisplay.style.color = '#374151';
                    }, 500);
                }
            } else if (action === 'plus') {
                // 삭제 예정 상태 해제
                rowElement.classList.remove('will-be-removed');
                // 수량 증가 스타일
                quantityDisplay.style.backgroundColor = '#f0fdf4';
                quantityDisplay.style.color = '#059669';
                setTimeout(() => {
                    quantityDisplay.style.backgroundColor = '#f9fafb';
                    quantityDisplay.style.color = '#374151';
                }, 500);
            }
        }
    },

    /**
     * 편집 모드 UI 상태 업데이트
     */
    updateEditModeUI(isEditMode) {
        const minusBtn = document.querySelector('.control-btn.quantity-minus');
        const confirmBtn = document.getElementById('confirmOrder');

        if (isEditMode && (this.selectedOrder || this.pendingModifications.length > 0)) {
            // 수정 모드 활성화
            if (minusBtn) {
                minusBtn.classList.add('active');

                if (this.selectedOrder) {
                    const originalQty = this.selectedOrder.originalQuantity || this.getOriginalQuantity(this.selectedOrder.menuId);
                    const currentQty = this.selectedOrder.quantity;
                    minusBtn.textContent = `- ${this.selectedOrder.menuName} (${originalQty}→${currentQty})`;
                } else {
                    minusBtn.textContent = `수량 감소 (${this.pendingModifications.length}개 수정중)`;
                }
                minusBtn.disabled = false;
            }

            if (confirmBtn) {
                const pendingCount = this.pendingModifications.length;
                if (pendingCount > 0) {
                    confirmBtn.querySelector('.method-name').textContent = `수정확정 (${pendingCount})`;
                } else {
                    confirmBtn.querySelector('.method-name').textContent = '수정확정';
                }
                confirmBtn.classList.add('edit-mode');
            }

            // 편집 모드 표시기 추가
            this.showEditModeIndicator();
        } else {
            // 일반 모드로 복원
            if (minusBtn) {
                minusBtn.classList.remove('active');
                minusBtn.textContent = '-';
                minusBtn.disabled = true;
            }

            if (confirmBtn) {
                confirmBtn.querySelector('.method-name').textContent = '주문';
                confirmBtn.classList.remove('edit-mode');
            }

            // 편집 모드 표시기 제거
            this.hideEditModeIndicator();
        }
    },

    /**
     * 편집 모드 표시기 표시
     */
    showEditModeIndicator() {
        if (!this.selectedOrder) return;

        // 기존 표시기 제거
        this.hideEditModeIndicator();

        const originalQty = this.selectedOrder.originalQuantity || this.getOriginalQuantity(this.selectedOrder.menuId);
        const currentQty = this.selectedOrder.quantity;
        const changeAmount = originalQty - currentQty;

        let statusText;
        let statusIcon;
        if (currentQty === 0) {
            statusText = `삭제 예정`;
            statusIcon = '🗑️';
        } else if (changeAmount > 0) {
            statusText = `${changeAmount}개 감소 (${originalQty}→${currentQty})`;
            statusIcon = '📉';
        } else if (changeAmount < 0) {
            statusText = `${Math.abs(changeAmount)}개 증가 (${originalQty}→${currentQty})`;
            statusIcon = '📈';
        } else {
            statusText = `변경사항 없음 (${currentQty}개)`;
            statusIcon = '📝';
        }

        const indicator = document.createElement('div');
        indicator.className = 'edit-mode-indicator';
        indicator.innerHTML = `${statusIcon} ${this.selectedOrder.menuName}: ${statusText}`;
        document.body.appendChild(indicator);
    },

    /**
     * 편집 모드 표시기 숨김
     */
    hideEditModeIndicator() {
        const existingIndicator = document.querySelector('.edit-mode-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
    },

    /**
     * 수정사항 요약 표시 업데이트
     */
    updatePendingModificationsSummary() {
        // 기존 요약 제거
        const existingSummary = document.querySelector('.pending-modifications-summary');
        if (existingSummary) {
            existingSummary.remove();
        }

        // 수정사항이 없으면 요약 표시 안함
        if (this.pendingModifications.length === 0) {
            return;
        }

        // 수정사항을 증가/감소로 분류
        const { decreaseModifications, increaseModifications } = this.categorizeModifications();

        // 새로운 요약 생성
        const summary = document.createElement('div');
        summary.className = 'pending-modifications-summary';

        const modificationsText = [
            ...decreaseModifications.map(mod => {
                if (mod.newQuantity === 0) {
                    return `🗑️ ${mod.menuName}: 삭제 (${mod.originalQuantity}개 → 0개)`;
                } else {
                    return `📉 ${mod.menuName}: ${mod.changeAmount}개 감소 (${mod.originalQuantity}개 → ${mod.newQuantity}개)`;
                }
            }),
            ...increaseModifications.map(mod => 
                `📈 ${mod.menuName}: ${Math.abs(mod.changeAmount)}개 증가 (${mod.originalQuantity}개 → ${mod.newQuantity}개)`
            )
        ].join('\n');

        const decreaseCount = decreaseModifications.length;
        const increaseCount = increaseModifications.length;
        const totalCount = this.pendingModifications.length;

        summary.innerHTML = `
            <div class="summary-header">📝 수정 예정 사항 (${totalCount}개)</div>
            <div class="summary-stats">
                <span class="decrease-count">📉 감소: ${decreaseCount}개</span>
                <span class="increase-count">📈 증가: ${increaseCount}개</span>
            </div>
            <div class="summary-content">${modificationsText.replace(/\n/g, '<br>')}</div>
            <div class="summary-actions">
                <button class="cancel-all-btn" onclick="OrderModificationManager.cancelAllPendingModifications()">전체 취소</button>
                <button class="confirm-all-btn" onclick="OrderModificationManager.confirmAllPendingModifications()">수정 확정</button>
            </div>
        `;

        document.body.appendChild(summary);
    },

    /**
     * 수정사항을 증가/감소로 분류
     */
    categorizeModifications() {
        const decreaseModifications = [];
        const increaseModifications = [];

        this.pendingModifications.forEach(mod => {
            if (mod.changeAmount > 0) {
                // 양수 = 감소 (원본 - 새로운 > 0)
                decreaseModifications.push(mod);
            } else if (mod.changeAmount < 0) {
                // 음수 = 증가 (원본 - 새로운 < 0)
                increaseModifications.push(mod);
            }
        });

        console.log(`📊 수정사항 분류 완료: 감소 ${decreaseModifications.length}개, 증가 ${increaseModifications.length}개`);

        return { decreaseModifications, increaseModifications };
    },

    /**
     * 모든 누적된 수정사항 취소
     */
    cancelAllPendingModifications() {
        console.log('🚫 모든 수정사항 취소');

        // 화면상 변경사항 복원
        this.pendingModifications.forEach(mod => {
            const rowElement = document.querySelector(`.pos-order-table tr[data-menu-id="${mod.menuId}"]`);
            if (rowElement) {
                const quantityDisplay = rowElement.querySelector('.quantity-display');
                if (quantityDisplay) {
                    const originalQuantity = this.getOriginalQuantity(mod.menuId);
                    quantityDisplay.textContent = originalQuantity;
                    quantityDisplay.classList.remove('modified');
                }
                // 행 스타일 복원
                rowElement.classList.remove('will-be-removed', 'selected', 'order-row-selected');
            }
        });

        // 임시 ID를 가진 새로운 메뉴인 경우 행 자체를 제거
        if (this.selectedOrder && this.selectedOrder.rowElement && 
            String(this.selectedOrder.orderId).startsWith('temp_')) {

            console.log('🗑️ 임시 메뉴 행 제거:', this.selectedOrder.menuName);
            this.selectedOrder.rowElement.remove();

            // currentOrders에서도 해당 항목 제거
            if (window.POSOrderScreen && window.POSOrderScreen.currentOrders) {
                const originalLength = window.POSOrderScreen.currentOrders.length;
                window.POSOrderScreen.currentOrders = window.POSOrderScreen.currentOrders.filter(order => 
                    order.id !== this.selectedOrder.orderId
                );
                const removedCount = originalLength - window.POSOrderScreen.currentOrders.length;
                if (removedCount > 0) {
                    console.log(`🗑️ currentOrders에서 ${removedCount}개 임시 항목 제거`);
                }
            }
        } else {
            // pending-addition과 new-menu-item 클래스를 가진 행들 제거
            const pendingRows = document.querySelectorAll('.pos-order-table tr.pending-addition, .pos-order-table tr.new-menu-item');
            pendingRows.forEach(row => {
                console.log('🗑️ pending/new-menu 행 제거:', row.dataset.menuId);
                row.remove();
            });

            // currentOrders에서도 임시 추가된 항목들 제거
            if (window.POSOrderScreen && window.POSOrderScreen.currentOrders) {
                const originalLength = window.POSOrderScreen.currentOrders.length;
                window.POSOrderScreen.currentOrders = window.POSOrderScreen.currentOrders.filter(order => 
                    !order.isNewMenu && !order.isPendingAddition
                );
                const removedCount = originalLength - window.POSOrderScreen.currentOrders.length;
                if (removedCount > 0) {
                    console.log(`🗑️ currentOrders에서 ${removedCount}개 임시 항목 제거`);
                }
            }
        }


        // 누적된 수정사항 초기화
        this.pendingModifications = [];

        // 편집 모드 해제
        this.selectedOrder = null;
        this.updateEditModeUI(false);

        // 요약 제거
        const summary = document.querySelector('.pending-modifications-summary');
        if (summary) {
            summary.remove();
        }

        // UI 새로고침
        setTimeout(() => {
            if (window.POSOrderScreen && typeof window.POSOrderScreen.refreshOrders === 'function') {
                window.POSOrderScreen.refreshOrders();
            }
        }, 100);
    },

    /**
     * 모든 누적된 수정사항 확정
     */
    async confirmAllPendingModifications() {
        if (this.pendingModifications.length === 0) {
            console.log('ℹ️ 확정할 수정사항이 없습니다.');
            return window.POSOrderScreen?.confirmOrder(); // 일반 주문 확정으로 진행
        }

        try {
            console.log(`🔧 다중 주문 수정 확정 시작: ${this.pendingModifications.length}개 메뉴`);

            // 기본 정보 검증
            const storeId = window.POSOrderScreen?.currentStoreId;
            const tableNumber = window.POSOrderScreen?.currentTableNumber;

            if (!storeId || !tableNumber) {
                throw new Error('매장 정보 또는 테이블 정보가 없습니다.');
            }

            // 수정사항을 증가/감소로 분류하고 통합
            const { decreaseModifications, increaseModifications } = this.categorizeModifications();

            // 확인 메시지 생성
            const modificationsSummary = [
                ...decreaseModifications.map(mod => {
                    if (mod.newQuantity === 0) {
                        return `• ${mod.menuName}: 삭제 (${mod.originalQuantity}개 → 0개)`;
                    } else {
                        return `• ${mod.menuName}: ${mod.changeAmount}개 감소 (${mod.originalQuantity}개 → ${mod.newQuantity}개)`;
                    }
                }),
                ...increaseModifications.map(mod => 
                    `• ${mod.menuName}: ${Math.abs(mod.changeAmount)}개 증가 (${mod.originalQuantity}개 → ${mod.newQuantity}개)`
                )
            ].join('\n');

            const confirmMessage = `다음 수정사항을 확정하시겠습니까?\n\n${modificationsSummary}`;

            if (!confirm(confirmMessage)) {
                console.log('🚫 사용자가 다중 주문 수정을 취소했습니다.');
                return;
            }

            let totalSuccessCount = 0;
            let totalFailureCount = 0;
            const failureDetails = [];

            // 1. 먼저 감소 수정 처리
            for (const modification of decreaseModifications) {
                try {
                    const result = await this.processDecreaseModification(modification);
                    totalSuccessCount += result.successCount;
                    if (result.error) {
                        failureDetails.push(result.error);
                        totalFailureCount++;
                    }
                } catch (error) {
                    console.error(`❌ ${modification.menuName} 감소 처리 실패:`, error);
                    failureDetails.push(`${modification.menuName}: 감소 실패 - ${error.message}`);
                    totalFailureCount++;
                }
            }

            // 2. 그 다음 증가 수정 처리
            if (increaseModifications.length > 0) {
                try {
                    const result = await this.processIncreaseModifications(increaseModifications);
                    if (result.success) {
                        totalSuccessCount += increaseModifications.length;
                        console.log(`✅ 증가 수정 완료: ${increaseModifications.length}개 메뉴`);
                    } else {
                        failureDetails.push(`증가 수정 실패: ${result.error}`);
                        totalFailureCount += increaseModifications.length;
                    }
                } catch (error) {
                    console.error(`❌ 증가 수정 전체 실패:`, error);
                    failureDetails.push(`증가 수정 실패: ${error.message}`);
                    totalFailureCount += increaseModifications.length;
                }
            }

            // 결과 메시지 생성
            let resultMessage = `다중 주문 수정 완료!\n\n✅ 성공: ${totalSuccessCount}개 처리`;

            if (totalFailureCount > 0) {
                resultMessage += `\n❌ 실패: ${totalFailureCount}건\n\n실패 상세:\n${failureDetails.join('\n')}`;
            }

            alert(resultMessage);

            // 성공한 항목이 있으면 초기화 및 새로고침
            if (totalSuccessCount > 0) {
                this.resetAllModifications();
                await window.POSOrderScreen?.refreshOrders();
            }

        } catch (error) {
            console.error('❌ 다중 주문 수정 전체 실패:', error);
            alert(`다중 주문 수정 중 전체 오류가 발생했습니다:\n${error.message}`);
        }
    },

    /**
     * 감소 수정 처리
     */
    async processDecreaseModification(modification) {
        const { menuId, menuName, originalQuantity, newQuantity } = modification;

        console.log(`🔄 ${menuName} 감소 처리 시작: ${originalQuantity} → ${newQuantity}`);

        let remainingQuantity = originalQuantity;
        let menuSuccessCount = 0;

        while (remainingQuantity > newQuantity && remainingQuantity > 0) {
            try {
                const requestData = {
                    storeId: parseInt(window.POSOrderScreen?.currentStoreId),
                    tableNumber: parseInt(window.POSOrderScreen?.currentTableNumber),
                    menuId: parseInt(menuId),
                    menuName: menuName,
                    currentQuantity: remainingQuantity
                };

                console.log(`📤 ${menuName} 수량 감소 API 호출 (${remainingQuantity} → ${remainingQuantity - 1})`);

                const response = await fetch('/api/pos/orders/modify-quantity', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestData),
                });

                if (!response.ok) {
                    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData.error || errorMessage;
                    } catch (parseError) {
                        console.warn('⚠️ 에러 응답 파싱 실패:', parseError);
                    }
                    throw new Error(errorMessage);
                }

                const result = await response.json();
                console.log(`✅ ${menuName} 수량 감소 완료 (${remainingQuantity} → ${remainingQuantity - 1})`);

                remainingQuantity--;
                menuSuccessCount++;

                // API 호출 간 짧은 지연
                if (remainingQuantity > newQuantity) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }

            } catch (stepError) {
                console.error(`❌ ${menuName} 수량 감소 실패 (${remainingQuantity}개 처리 중):`, stepError);
                return {
                    successCount: menuSuccessCount,
                    error: `${menuName}: ${menuSuccessCount}번 성공 후 실패 - ${stepError.message}`
                };
            }
        }

        console.log(`✅ ${menuName} 감소 처리 완료: ${menuSuccessCount}번 성공`);
        return { successCount: menuSuccessCount };
    },

    /**
     * 증가 수정 처리
     */
    async processIncreaseModifications(increaseModifications) {
        console.log(`📈 증가 수정 처리 시작: ${increaseModifications.length}개 메뉴`);

        // 증가하는 메뉴들을 카트 아이템 형태로 변환
        const increaseItems = increaseModifications.map(mod => ({
            id: mod.menuId,
            menuId: mod.menuId,
            name: mod.menuName,
            price: mod.price,
            quantity: Math.abs(mod.changeAmount), // 증가 수량
            store_id: window.POSOrderScreen?.currentStoreId,
            cook_station: this.getMenuCookStation(mod.menuId)
        }));

        console.log(`📋 증가 아이템 생성:`, increaseItems);

        try {
            // TLL 연동 상태 확인
            const hasTLLOrders = window.POSOrderScreen?.tllOrders && window.POSOrderScreen.tllOrders.length > 0;
            const isTLLMixed = window.POSOrderScreen?.checkTLLOrderMixedStatus();

            const total = increaseItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

            // TLL 연동 상태에 따라 다른 API 사용
            let apiEndpoint = "/api/pos/guest-orders/confirm";
            let requestBody = {
                storeId: parseInt(window.POSOrderScreen?.currentStoreId),
                tableNumber: parseInt(window.POSOrderScreen?.currentTableNumber),
                items: increaseItems,
                totalAmount: total,
            };

            if (hasTLLOrders && isTLLMixed) {
                // TLL 연동된 경우: 기존 주문에 추가
                apiEndpoint = "/api/pos/orders/confirm";
                requestBody.mergeWithExisting = true;
                requestBody.existingOrderId = window.POSOrderScreen.tllOrders[0].order_id;
                console.log("🔗 TLL 연동 증가 주문으로 처리: 기존 주문에 추가");
            } else {
                // TLL 미연동 또는 TLL 없는 경우: 새 주문 생성
                console.log("📝 별도 POS 증가 주문으로 처리");
            }

            const response = await fetch(apiEndpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "증가 주문 생성 실패");
            }

            const result = await response.json();
            console.log("✅ 증가 주문 생성 완료:", result);

            return { success: true, result };

        } catch (error) {
            console.error('❌ 증가 수정 처리 실패:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * 모든 수정사항 초기화
     */
    resetAllModifications() {
        this.pendingModifications = [];
        this.selectedOrder = null;
        this.updateEditModeUI(false);

        const summary = document.querySelector('.pending-modifications-summary');
        if (summary) {
            summary.remove();
        }
    },

    /**
     * 헬퍼 함수들
     */
    getOriginalQuantity(menuId) {
        return window.POSOrderScreen?.getOriginalQuantity(menuId);
    },

    getMenuPrice(menuId) {
        return window.POSOrderScreen?.getMenuPrice(menuId) || 0;
    },

    getMenuCookStation(menuId) {
        return window.POSOrderScreen?.getMenuCookStation(menuId) || 'KITCHEN';
    }
};

// 전역으로 등록
window.OrderModificationManager = OrderModificationManager;