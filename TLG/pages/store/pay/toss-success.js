function goToMain() {
    try {
        // 부모 창이 있는 경우 메시지 전달
        if (window.opener && !window.opener.closed) {
            try {
                window.opener.postMessage({
                    type: 'PAYMENT_SUCCESS_REDIRECT',
                    action: 'navigate',
                    url: '/'
                }, window.location.origin);

                // 창 닫기 시도
                setTimeout(() => {
                    window.close();
                }, 300);
                return;
            } catch (crossOriginError) {
                console.warn('부모 창 통신 실패:', crossOriginError);
            }
        }

        // iframe인 경우 부모로 메시지 전달
        if (window.parent && window.parent !== window) {
            try {
                window.parent.postMessage({
                    type: 'PAYMENT_SUCCESS_REDIRECT',
                    action: 'navigate',
                    url: '/'
                }, window.location.origin);
                return;
            } catch (error) {
                console.warn('iframe 부모 통신 실패:', error);
            }
        }
    } catch (error) {
        console.warn('리디렉션 실패:', error);
    }

    // 기본적으로 현재 창에서 리디렉트
    window.location.href = '/';
}

function goToMyPage() {
    try {
        // 부모 창이 있는 경우 메시지 전달
        if (window.opener && !window.opener.closed) {
            try {
                window.opener.postMessage({
                    type: 'PAYMENT_SUCCESS_REDIRECT',
                    action: 'navigate',
                    url: '/mypage'
                }, window.location.origin);

                setTimeout(() => {
                    window.close();
                }, 300);
                return;
            } catch (crossOriginError) {
                console.warn('부모 창 통신 실패:', crossOriginError);
            }
        }

        // iframe인 경우 부모로 메시지 전달
        if (window.parent && window.parent !== window) {
            try {
                window.parent.postMessage({
                    type: 'PAYMENT_SUCCESS_REDIRECT',
                    action: 'navigate',
                    url: '/mypage'
                }, window.location.origin);
                return;
            } catch (error) {
                console.warn('iframe 부모 통신 실패:', error);
            }
        }
    } catch (error) {
        console.warn('리디렉션 실패:', error);
    }

    window.location.href = '/mypage';
}

function displaySuccess(result, orderData) {
    // 안전한 데이터 처리
    const safeAmount = orderData?.totalAmount || orderData?.total || result?.amount || result?.totalAmount || 0;
    const safeOrderId = orderData?.orderId || result?.orderId || 'N/A';
    const safeStoreName = orderData?.storeName || orderData?.store || 'N/A';
    const safePaymentKey = result?.paymentKey || 'N/A';
    const safePaidAt = result?.paidAt || result?.approvedAt || new Date().toISOString();

    console.log('💳 결제 성공 정보 표시:', {
        result,
        orderData,
        safeAmount,
        safeOrderId,
        safeStoreName,
        safePaymentKey,
        safePaidAt
    });

    document.getElementById('content').innerHTML = `
        <div class="success-container">
            <div class="success-icon">✅</div>
            <h1>결제 및 주문 완료!</h1>
            <p>토스페이먼츠를 통한 결제가 완료되고 주문이 접수되었습니다.</p>

            <div class="order-summary">
                <h3>주문 정보</h3>
                <div class="order-details">
                    <p><span class="label">결제 금액:</span> <span class="value">${parseInt(safeAmount).toLocaleString()}원</span></p>
                    <p><span class="label">주문 번호:</span> <span class="value">${safeOrderId}</span></p>
                    <p><span class="label">매장:</span> <span class="value">${safeStoreName}</span></p>
                    <p><span class="label">결제 키:</span> <span class="value">${safePaymentKey}</span></p>
                    <p><span class="label">결제 일시:</span> <span class="value">${new Date(safePaidAt).toLocaleString()}</span></p>
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

        console.log('🔄 결제 승인 시작:', { paymentKey, orderId, amount });

        // 1. 토스페이먼츠 결제 승인
        const confirmResult = await window.tossPaymentUtils.confirmPayment(paymentKey, orderId, amount);

        if (!confirmResult.success) {
            throw new Error(confirmResult.message || '결제 승인에 실패했습니다.');
        }

        console.log('✅ 토스페이먼츠 결제 승인 성공');

        // 2. 주문 처리로 이동
        await processOrderAfterPayment(paymentKey, orderId, amount);

    } catch (error) {
        console.error('❌ 결제 승인 실패:', error);
        displayError(error.message || '결제 승인 처리 중 오류가 발생했습니다.');
    }
}

async function processOrderAfterPayment(paymentKey, orderId, amount) {
    try {
        displayStatus('주문 정보 처리 중...');

        const pendingOrderData = JSON.parse(sessionStorage.getItem('pendingOrderData') || '{}');

        if (!pendingOrderData.userId) {
            throw new Error('주문 정보를 찾을 수 없습니다.');
        }

        console.log('📦 주문 처리 시작:', pendingOrderData);

        const orderResponse = await fetch('/api/orders/pay', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...pendingOrderData,
                pgPaymentKey: paymentKey,
                pgOrderId: orderId,
                pgPaymentMethod: 'TOSS'
            })
        });

        if (!orderResponse.ok) {
            const errorData = await orderResponse.json();
            throw new Error(errorData.error || '주문 처리에 실패했습니다.');
        }

        const orderResult = await orderResponse.json();
        console.log('✅ 주문 처리 성공:', orderResult);

        // 성공 페이지 표시
        displaySuccessPage(orderResult, pendingOrderData);

        // 저장된 데이터 정리
        sessionStorage.removeItem('pendingOrderData');
        sessionStorage.removeItem('paymentMethod');

    } catch (error) {
        console.error('❌ 주문 처리 실패:', error);
        displayError(error.message || '주문 처리 중 오류가 발생했습니다.');
    }
}

// displaySuccessPage 함수는 원본 코드에 없으므로,
// processOrderAfterPayment 내부에서 displaySuccess 함수를 사용하도록 수정합니다.
// 만약 displaySuccessPage가 별도로 정의되어 있어야 한다면, 해당 함수 정의를 추가해야 합니다.
// 여기서는 displaySuccess 함수를 호출하는 것으로 가정하고 코드를 유지합니다.
// displaySuccessPage(orderResult, pendingOrderData); // 이 부분을 displaySuccess로 변경


async function processPayment() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const paymentKey = urlParams.get('paymentKey');
        const orderId = urlParams.get('orderId');
        const amount = urlParams.get('amount');
        const confirmed = urlParams.get('confirmed'); // 서버에서 이미 승인 처리했는지 확인

        console.log('📄 결제 성공 페이지 로드:', { paymentKey, orderId, amount, confirmed });

        if (!paymentKey || !orderId || !amount) {
            console.error('❌ 필수 파라미터 누락:', { paymentKey, orderId, amount });
            displayError('결제 정보가 올바르지 않습니다.');
        } else {
            if (confirmed === 'true') {
                // 서버에서 이미 승인 처리된 경우, 바로 주문 처리로 넘어감
                console.log('✅ 서버에서 이미 결제 승인 완료됨, 주문 처리 시작');
                processOrderAfterPayment(paymentKey, orderId, amount);
            } else {
                // 클라이언트에서 승인 처리 필요한 경우
                confirmPaymentResult(paymentKey, orderId, amount);
            }
        }

    } catch (error) {
        console.error('❌ 결제 처리 실패:', error);
        showErrorPage(error);
    }
}

function goBack() {
    try {
        // 부모 창이 있는 경우 메시지 전달
        if (window.opener && !window.opener.closed) {
            try {
                window.opener.postMessage({
                    type: 'PAYMENT_REDIRECT',
                    action: 'navigate',
                    url: '/'
                }, window.location.origin);

                setTimeout(() => {
                    window.close();
                }, 300);
                return;
            } catch (crossOriginError) {
                console.warn('부모 창 통신 실패:', crossOriginError);
            }
        }

        // iframe인 경우 부모로 메시지 전달
        if (window.parent && window.parent !== window) {
            try {
                window.parent.postMessage({
                    type: 'PAYMENT_REDIRECT',
                    action: 'navigate',
                    url: '/'
                }, window.location.origin);
                return;
            } catch (error) {
                console.warn('iframe 부모 통신 실패:', error);
            }
        }
    } catch (error) {
        console.warn('리디렉션 실패:', error);
    }

    window.location.href = '/';
}

window.addEventListener('load', () => {
    setTimeout(processPayment, 500);
});