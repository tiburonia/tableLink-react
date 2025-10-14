/**
 * 결제 페이지 View (비회원 TLL)
 * - 주문 내역 확인
 * - 결제 방법 선택
 * - 네이티브 앱 스타일 UI
 */

export const paymentView = {
    /**
     * 결제 페이지 렌더링
     */
    render(storeInfo, tableNumber, cart) {
        const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        return `
            ${this.renderHeader(storeInfo, tableNumber)}
            ${this.renderOrderSummary(cart, totalPrice)}
            ${this.renderPaymentSection(totalPrice)}
        `;
    },

    /**
     * 헤더 렌더링
     */
    renderHeader(storeInfo, tableNumber) {
        return `
            <div style="
                position: sticky;
                top: 0;
                background: white;
                z-index: 100;
                border-bottom: 1px solid #e5e5ea;
            ">
                <div style="
                    padding: 16px 20px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                ">
                    <button
                        onclick="window.history.back()"
                        style="
                            background: none;
                            border: none;
                            font-size: 24px;
                            cursor: pointer;
                            padding: 0;
                            color: #1d1d1f;
                        "
                    >←</button>
                    <div style="flex: 1;">
                        <h1 style="
                            font-size: 22px;
                            font-weight: 700;
                            color: #1d1d1f;
                            margin: 0 0 4px 0;
                        ">주문 확인</h1>
                        <p style="
                            font-size: 13px;
                            color: #86868b;
                            margin: 0;
                        ">${storeInfo.name} · 테이블 ${tableNumber}번</p>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * 주문 요약 렌더링
     */
    renderOrderSummary(cart, totalPrice) {
        return `
            <div style="padding: 20px; background: #f5f5f7;">
                <!-- 주문 내역 -->
                <div style="
                    background: white;
                    border-radius: 16px;
                    padding: 20px;
                    margin-bottom: 16px;
                ">
                    <h2 style="
                        font-size: 18px;
                        font-weight: 700;
                        color: #1d1d1f;
                        margin: 0 0 16px 0;
                    ">주문 내역</h2>

                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        ${cart.map(item => this.renderCartItem(item)).join('')}
                    </div>
                </div>

                <!-- 금액 요약 -->
                <div style="
                    background: white;
                    border-radius: 16px;
                    padding: 20px;
                    margin-bottom: 16px;
                ">
                    <h2 style="
                        font-size: 18px;
                        font-weight: 700;
                        color: #1d1d1f;
                        margin: 0 0 16px 0;
                    ">결제 금액</h2>

                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <div style="
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                        ">
                            <span style="font-size: 15px; color: #86868b;">주문 금액</span>
                            <span style="font-size: 15px; color: #1d1d1f;">${totalPrice.toLocaleString()}원</span>
                        </div>

                        <div style="
                            height: 1px;
                            background: #e5e5ea;
                            margin: 4px 0;
                        "></div>

                        <div style="
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                        ">
                            <span style="font-size: 17px; font-weight: 700; color: #1d1d1f;">총 결제금액</span>
                            <span style="font-size: 22px; font-weight: 700; color: #667eea;">${totalPrice.toLocaleString()}원</span>
                        </div>
                    </div>
                </div>

                <!-- 안내 사항 -->
                <div style="
                    background: #fff3cd;
                    border-radius: 12px;
                    padding: 16px;
                    margin-bottom: 100px;
                ">
                    <div style="
                        font-size: 14px;
                        color: #856404;
                        line-height: 1.5;
                    ">
                        ℹ️ 주문 후 음식 준비가 시작됩니다<br>
                        💳 결제는 안전하게 처리됩니다<br>
                        🍽️ 준비 완료 시 알림을 보내드립니다
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * 장바구니 아이템 렌더링
     */
    renderCartItem(item) {
        return `
            <div style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px;
                background: #f5f5f7;
                border-radius: 12px;
            ">
                <div style="flex: 1;">
                    <div style="
                        font-size: 15px;
                        font-weight: 600;
                        color: #1d1d1f;
                        margin-bottom: 4px;
                    ">${item.name}</div>
                    <div style="
                        font-size: 13px;
                        color: #86868b;
                    ">${item.price.toLocaleString()}원 × ${item.quantity}</div>
                </div>
                <div style="
                    font-size: 16px;
                    font-weight: 700;
                    color: #667eea;
                ">${(item.price * item.quantity).toLocaleString()}원</div>
            </div>
        `;
    },

    /**
     * 결제 섹션 렌더링
     */
    renderPaymentSection(totalPrice) {
        return `
            <div style="
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: white;
                border-top: 1px solid #e5e5ea;
                padding: 20px;
                z-index: 1000;
            ">
                <button
                    onclick="window.guestPaymentController.processPayment()"
                    style="
                        width: 100%;
                        height: 56px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border: none;
                        border-radius: 16px;
                        font-size: 17px;
                        font-weight: 600;
                        cursor: pointer;
                        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                    "
                >
                    <span>${totalPrice.toLocaleString()}원</span>
                    <span>결제하기</span>
                </button>
            </div>
        `;
    },

    /**
     * 로딩 오버레이 렌더링
     */
    renderLoading() {
        return `
            <div id="loadingOverlay" style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            ">
                <div style="
                    background: white;
                    border-radius: 20px;
                    padding: 32px 24px;
                    text-align: center;
                ">
                    <div style="
                        width: 48px;
                        height: 48px;
                        border: 4px solid #e5e5ea;
                        border-top-color: #667eea;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                        margin: 0 auto 16px auto;
                    "></div>
                    <p style="
                        font-size: 16px;
                        font-weight: 600;
                        color: #1d1d1f;
                        margin: 0;
                    ">주문 처리 중...</p>
                </div>
            </div>

            <style>
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            </style>
        `;
    }
};
