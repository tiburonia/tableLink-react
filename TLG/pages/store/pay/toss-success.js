
function goToMain() {
    try {
        if (window.opener && !window.opener.closed) {
            try {
                window.opener.location.href;
                window.opener.location.href = '/';
                window.close();
                return;
            } catch (e) {
                window.opener.postMessage({ action: 'navigate', url: '/' }, '*');
                window.close();
                return;
            }
        }
    } catch (error) {
        console.warn('부모 창 통신 실패:', error);
    }
    window.location.href = '/';
}

function goToMyPage() {
    try {
        if (window.opener && !window.opener.closed) {
            try {
                window.opener.location.href;
                window.opener.location.href = '/mypage';
                window.close();
                return;
            } catch (e) {
                window.opener.postMessage({ action: 'navigate', url: '/mypage' }, '*');
                window.close();
                return;
            }
        }
    } catch (error) {
        console.warn('부모 창 통신 실패:', error);
    }
    window.location.href = '/mypage';
}

function displaySuccess(result, orderData) {
    document.getElementById('content').innerHTML = `
        <div class="success-container">
            <div class="success-icon">✅</div>
            <h1>결제 및 주문 완료!</h1>
            <p>토스페이먼츠를 통한 결제가 완료되고 주문이 접수되었습니다.</p>

            <div class="order-summary">
                <h3>주문 정보</h3>
                <div class="order-details">
                    <p><span class="label">결제 금액:</span> <span class="value">${parseInt(orderData.totalAmount || result.amount).toLocaleString()}원</span></p>
                    <p><span class="label">주문 번호:</span> <span class="value">${orderData.orderId || 'N/A'}</span></p>
                    <p><span class="label">매장:</span> <span class="value">${orderData.storeName || 'N/A'}</span></p>
                    <p><span class="label">결제 키:</span> <span class="value">${result.paymentKey}</span></p>
                    <p><span class="label">결제 일시:</span> <span class="value">${new Date(result.paidAt).toLocaleString()}</span></p>
                </div>

                ${orderData.items ? `
                    <div class="items-list">
                        <h4>주문 메뉴</h4>
                        ${orderData.items.map(item => 
                            `<div class="item-row">
                                <span>${item.name} × ${item.quantity || item.qty || 1}</span>
                                <span>${(item.price * (item.quantity || item.qty || 1)).toLocaleString()}원</span>
                            </div>`
                        ).join('')}
                    </div>
                ` : ''}
            </div>

            <div class="actions">
                <button onclick="goToMain()" class="btn primary">메인으로</button>
                <button onclick="goToMyPage()" class="btn secondary">주문내역 보기</button>
            </div>
        </div>
    `;
}

function displayExistingOrderSuccess(existingOrder, paymentKey, orderId) {
    const orderData = existingOrder.orderData;

    document.getElementById('content').innerHTML = `
        <div class="success-container">
            <div class="success-icon">✅</div>
            <h1>결제 완료!</h1>
            <p>이미 처리된 주문입니다.</p>

            <div class="order-summary">
                <h3>주문 정보</h3>
                <div class="order-details">
                    <p><span class="label">매장:</span> <span class="value">${existingOrder.storeName || 'N/A'}</span></p>
                    <p><span class="label">결제 금액:</span> <span class="value">${existingOrder.finalAmount.toLocaleString()}원</span></p>
                    <p><span class="label">결제 키:</span> <span class="value">${paymentKey}</span></p>
                    <p><span class="label">주문 ID:</span> <span class="value">${orderId}</span></p>
                    <p><span class="label">결제 일시:</span> <span class="value">${new Date(existingOrder.paymentDate).toLocaleString()}</span></p>
                </div>

                ${orderData?.items ? `
                    <div class="items-list">
                        <h4>주문 메뉴</h4>
                        ${orderData.items.map(item => 
                            `<div class="item-row">
                                <span>${item.name} × ${item.quantity || item.qty || 1}</span>
                                <span>${(item.price * (item.quantity || item.qty || 1)).toLocaleString()}원</span>
                            </div>`
                        ).join('')}
                    </div>
                ` : ''}
            </div>

            <div class="action-buttons">
                <button onclick="goBack()" class="btn primary">메인으로 돌아가기</button>
            </div>
        </div>
    `;
}

function showErrorPage(error) {
    document.getElementById('content').innerHTML = `
        <div style="font-size: 64px; margin-bottom: 20px;">❌</div>
        <h1>결제 실패</h1>
        <div class="error-container">
            <h2>오류 발생</h2>
            <p>${error.message || '결제 처리 중 오류가 발생했습니다.'}</p>
        </div>
        <button class="btn" onclick="goBack()">TableLink로 돌아가기</button>
    `;
}

function displayStatus(message) {
    document.querySelector('.container').innerHTML = `
        <div class="success-icon">⏳</div>
        <h1>${message}</h1>
        <p class="loading">잠시만 기다려 주세요<span class="spinner"></span></p>
        <button class="btn" id="backBtn" style="display: none;" onclick="goBack()">TableLink로 돌아가기</button>
    `;
}

function displayError(message) {
    document.querySelector('.container').innerHTML = `
        <div class="success-icon">❌</div>
        <h1>결제 실패</h1>
        <p class="loading">${message}</p>
        <button class="btn" onclick="goBack()">TableLink로 돌아가기</button>
    `;
}

async function confirmPaymentResult(paymentKey, orderId, amount) {
    try {
        displayStatus('결제 승인 처리 중...');

        // 1. 토스페이먼츠 결제 승인
        const confirmResult = await window.tossPaymentUtils.confirmPayment(paymentKey, orderId, amount);

        if (!confirmResult.success) {
            throw new Error(confirmResult.error || '결제 승인에 실패했습니다.');
        }

        displayStatus('주문 정보 조회 중...');

        // 2. 토스페이먼츠 키로 기존 결제 내역 조회 시도
        let existingOrder = null;
        try {
            const orderLookupResponse = await fetch('/api/orders/user-paid-orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    paymentKey,
                    orderId,
                    amount: parseInt(amount)
                })
            });

            if (orderLookupResponse.ok) {
                const orderLookupResult = await orderLookupResponse.json();
                if (orderLookupResult.success) {
                    existingOrder = orderLookupResult.order;
                    console.log('✅ 기존 주문 정보 발견:', existingOrder.id);
                }
            }
        } catch (lookupError) {
            console.warn('⚠️ 기존 주문 조회 실패 (새 주문으로 처리):', lookupError);
        }

        // 3. 기존 주문이 있으면 표시, 없으면 새 주문 처리
        if (existingOrder) {
            displayExistingOrderSuccess(existingOrder, paymentKey, orderId);
        } else {
            // sessionStorage에서 주문 데이터 가져오기
            const pendingOrderData = sessionStorage.getItem('pendingOrderData');
            if (!pendingOrderData) {
                throw new Error('주문 데이터를 찾을 수 없습니다.');
            }

            const orderData = JSON.parse(pendingOrderData);

            // 새 주문 처리 API 호출
            const response = await fetch('/api/orders/pay', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...orderData,
                    pgPaymentKey: paymentKey,
                    pgOrderId: orderId,
                    pgPaymentMethod: sessionStorage.getItem('paymentMethod') || 'CARD'
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '주문 처리에 실패했습니다.');
            }

            const result = await response.json();

            // sessionStorage 정리
            sessionStorage.removeItem('pendingOrderData');
            sessionStorage.removeItem('paymentMethod');

            displaySuccess(result, orderData);
        }

    } catch (error) {
        console.error('❌ 결제 처리 실패:', error);
        displayError(error.message);
    }
}

async function processPayment() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const paymentKey = urlParams.get('paymentKey');
        const orderId = urlParams.get('orderId');
        const amount = urlParams.get('amount');

        console.log('📋 URL 파라미터:', { paymentKey, orderId, amount });
        console.log('🔗 전체 URL:', window.location.href);

        if (!paymentKey || !orderId || !amount) {
            console.error('❌ 누락된 파라미터:', { paymentKey, orderId, amount });
            throw new Error('결제 정보가 올바르지 않습니다.');
        }

        await confirmPaymentResult(paymentKey, orderId, amount);

    } catch (error) {
        console.error('❌ 결제 처리 실패:', error);
        showErrorPage(error);
    }
}

function goBack() {
    try {
        if (window.opener && !window.opener.closed) {
            try {
                window.opener.location.href;
                window.opener.location.href = '/';
                window.close();
                return;
            } catch (e) {
                window.opener.postMessage({ action: 'navigate', url: '/' }, '*');
                window.close();
                return;
            }
        }
    } catch (error) {
        console.warn('부모 창 통신 실패:', error);
    }
    window.location.href = '/';
}

window.addEventListener('load', () => {
    setTimeout(processPayment, 500);
});
