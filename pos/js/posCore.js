
/**
 * TableLink POS 핵심 시스템
 * OK POS 스타일 + TL 특화 기능
 */

const POSCore = {
    storeId: null,
    storeInfo: null,
    currentTable: null,
    currentView: 'tablemap', // tablemap, order, payment
    
    /**
     * POS 시스템 초기화
     */
    async initialize(storeId) {
        try {
            console.log(`🍴 POS 시스템 초기화 - 매장 ${storeId}`);
            
            this.storeId = storeId;
            
            // 매장 정보 로드
            await this.loadStoreInfo();
            
            // 테이블맵 화면 렌더링
            await this.showTableMap();
            
            console.log('✅ POS 시스템 초기화 완료');
            
        } catch (error) {
            console.error('❌ POS 초기화 실패:', error);
            this.showError('POS 시스템 초기화에 실패했습니다.');
        }
    },
    
    /**
     * 매장 정보 로드
     */
    async loadStoreInfo() {
        const response = await fetch(`/api/pos/store/${this.storeId}`);
        if (!response.ok) {
            throw new Error('매장 정보 조회 실패');
        }
        
        const data = await response.json();
        this.storeInfo = data.store;
        
        console.log('✅ 매장 정보 로드:', this.storeInfo.name);
    },
    
    /**
     * 테이블맵 화면 표시
     */
    async showTableMap() {
        this.currentView = 'tablemap';
        await POSTableMap.render(this.storeId, this.storeInfo);
    },
    
    /**
     * 주문 화면 표시
     */
    async showOrderScreen(tableNumber) {
        this.currentView = 'order';
        this.currentTable = tableNumber;
        await POSOrderScreen.render(this.storeId, this.storeInfo, tableNumber);
    },
    
    /**
     * 결제 화면 표시
     */
    async showPaymentScreen(tableNumber, orderData) {
        this.currentView = 'payment';
        this.currentTable = tableNumber;
        await POSPaymentScreen.render(this.storeId, this.storeInfo, tableNumber, orderData);
    },
    
    /**
     * 에러 화면 표시
     */
    showError(message) {
        const main = document.getElementById('posMain');
        main.innerHTML = `
            <div class="pos-error">
                <div class="error-icon">❌</div>
                <h2>시스템 오류</h2>
                <p>${message}</p>
                <button onclick="location.reload()" class="retry-btn">다시 시도</button>
                <button onclick="window.history.back()" class="back-btn">돌아가기</button>
            </div>
        `;
    }
};

// 전역 함수로 등록
window.POSCore = POSCore;
