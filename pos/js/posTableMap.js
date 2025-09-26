/**
 * POS 테이블맵 화면 (OK POS 스타일) - 모듈화 버전
 * 모든 기능이 개별 모듈로 분리되었습니다.
 */

const POSTableMap = {
    /**
     * 테이블맵 화면 렌더링
     */
    async render(storeId, storeInfo) {
        try {
            console.log("🗺️ 테이블맵 화면 렌더링");

            // 테이블 정보 로드
            const tables = await TableMapDataProcessor.loadTables(storeId);

            const main = document.getElementById("posMain");
            main.innerHTML = `
                ${TableMapRenderer.renderTopBar(storeInfo)}
                ${TableMapRenderer.renderMainContent(tables)}
            `;

            // 실시간 업데이트 시작
            TableMapManager.startRealtimeUpdates(storeId);

            // 시간 업데이트 시작
            TableMapManager.startTimeUpdate();
        } catch (error) {
            console.error("❌ 테이블맵 렌더링 실패:", error);
            POSCore.showError("테이블맵을 불러올 수 없습니다.");
        }
    },

    /**
     * 테이블 선택 (매니저 모듈로 위임)
     */
    async selectTable(tableNumber) {
        return TableMapManager.selectTable(tableNumber);
    },

    /**
     * 테이블 그리드 업데이트 (매니저 모듈로 위임)
     */
    updateTableGrid(tables) {
        return TableMapManager.updateTableGrid(tables);
    },

    // 기타 기능들 (추후 구현)
    showOrderStatus() {
        alert("주문현황 기능 (추후 구현)");
    },

    showSalesStatus() {
        alert("판매현황 기능 (추후 구현)");
    },

    showNotifications() {
        alert("알림 기능 (추후 구현)");
    },

    moveTable() {
        alert("테이블 이동 기능 (추후 구현)");
    },

    splitTable() {
        alert("테이블 분할 기능 (추후 구현)");
    },

    groupTable() {
        alert("단체 테이블 기능 (추후 구현)");
    },

    receiptManagement() {
        alert("영수증 관리 기능 (추후 구현)");
    },

    reprintReceipt() {
        alert("재출력 기능 (추후 구현)");
    },

    showSettings() {
        alert("설정 기능 (추후 구현)");
    },

    logout() {
        if (confirm("POS를 종료하시겠습니까?")) {
            TableMapManager.closeSSE();
            window.location.href = "/";
        }
    },
};

// 전역 함수로 등록
window.POSTableMap = POSTableMap;