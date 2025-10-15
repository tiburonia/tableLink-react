/**
 * 결제 페이지 Controller (비회원 TLL)
 * - 결제 페이지 초기화
 * - 주문 및 결제 처리
 */

import { paymentView } from '../views/paymentView.js';
import { paymentService } from '../services/paymentService.js';
import { orderService } from '../../order/services/orderService.js';

export const paymentController = {
    storeId: null,
    tableNumber: null,
    storeInfo: null,
    cart: [],

    /**
     * 페이지 초기화
     */
    async init(storeId, tableNumber) {
        console.log('🚀 비회원 결제 페이지 초기화:', { storeId, tableNumber });

        this.storeId = storeId;
        this.tableNumber = tableNumber;

        // 세션 확인
        const sessionId = localStorage.getItem('guestSessionId');
        if (!sessionId) {
            alert('세션이 만료되었습니다. QR 코드를 다시 스캔해주세요.');
            window.location.href = `/guest/qr.html?storeId=${storeId}&tableNumber=${tableNumber}`;
            return;
        }

        // 장바구니 불러오기
        this.cart = orderService.loadCart();

        if (this.cart.length === 0) {
            alert('장바구니가 비어있습니다');
            window.history.back();
            return;
        }

        // 매장 정보 조회
        const storeResult = await orderService.getStoreInfo(storeId);
        if (!storeResult.success) {
            alert(storeResult.message);
            return;
        }
        this.storeInfo = storeResult.store;

        // 화면 렌더링
        this.render();
    },

    /**
     * 화면 렌더링
     */
    render() {
        const app = document.getElementById('app');
        if (!app) {
            console.error('❌ app 엘리먼트를 찾을 수 없습니다');
            return;
        }

        app.innerHTML = paymentView.render(
            this.storeInfo,
            this.tableNumber,
            this.cart
        );

        console.log('✅ 결제 페이지 렌더링 완료');
    },

    /**
     * 결제 처리
     */
    async processPayment() {
        console.log('💳 결제 처리 시작');

        // 로딩 표시
        this.showLoading();

        try {
            // 1. 주문 생성
            const orderResult = await paymentService.createGuestOrder(
                this.storeId,
                this.tableNumber,
                this.cart
            );

            if (!orderResult.success) {
                throw new Error(orderResult.message);
            }

            console.log('✅ 주문 생성 완료:', orderResult.orderId);

            // 2. 결제 처리
            const paymentResult = await paymentService.processPayment(
                orderResult.orderId,
                orderResult.totalAmount
            );

            if (!paymentResult.success) {
                throw new Error(paymentResult.message);
            }

            console.log('✅ 결제 완료:', paymentResult.paymentId);

            // 3. 주문 완료 처리
            paymentService.completeOrder();

            // 4. 완료 페이지로 이동
            window.location.href = `/guest/complete.html?orderId=${orderResult.orderId}`;

        } catch (error) {
            console.error('❌ 결제 처리 실패:', error);
            this.hideLoading();
            alert(error.message || '결제 처리에 실패했습니다. 다시 시도해주세요.');
        }
    },

    /**
     * 로딩 표시
     */
    showLoading() {
        document.body.insertAdjacentHTML('beforeend', paymentView.renderLoading());
    },

    /**
     * 로딩 숨김
     */
    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.remove();
        }
    }
};

// 전역 객체 등록
window.guestPaymentController = paymentController;
