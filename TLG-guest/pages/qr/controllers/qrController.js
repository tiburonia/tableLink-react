/**
 * QR 페이지 Controller (비회원 TLL)
 * - 페이지 초기화 및 이벤트 처리
 */

import { qrView } from '../views/qrView.js';
import { qrService } from '../services/qrService.js';

export const qrController = {
    storeId: null,
    tableNumber: null,
    storeName: null,

    /**
     * 페이지 초기화
     */
    async init(storeId, tableNumber) {
        console.log('🚀 비회원 QR 페이지 초기화:', { storeId, tableNumber });

        this.storeId = storeId;
        this.tableNumber = tableNumber;

        // 테이블 정보 조회
        const result = await qrService.getTableInfo(storeId, tableNumber);

        if (!result.success) {
            this.renderError(result.message);
            return;
        }

        this.storeName = result.store.name;

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

        app.innerHTML = qrView.render(this.tableNumber, this.storeName);
        console.log('✅ QR 페이지 렌더링 완료');
    },

    /**
     * 주문 시작
     */
    async startOrder() {
        console.log('🛒 주문 시작');

        // 세션 생성
        const result = await qrService.createGuestSession(
            this.storeId,
            this.tableNumber
        );

        if (!result.success) {
            alert(result.message);
            return;
        }

        console.log('✅ 세션 생성 완료:', result.sessionId);

        // 메뉴 주문 페이지로 이동
        window.location.href = `/guest/order.html?storeId=${this.storeId}&tableNumber=${this.tableNumber}`;
    },

    /**
     * 에러 렌더링
     */
    renderError(message) {
        const app = document.getElementById('app');
        if (!app) return;

        app.innerHTML = qrView.renderError(message);
        console.error('❌ QR 페이지 에러:', message);
    }
};

// 전역 객체 등록
window.guestQrController = qrController;
