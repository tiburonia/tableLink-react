
/**
 * KDS 메인 초기화 스크립트
 * 책임: KDS 시스템 초기화 및 전역 함수 노출
 */

console.log('🚀 TableLink KDS v3.0 시작');

// 전역 KDS 컨트롤러 인스턴스 (중복 선언 방지)
if (!window.kdsInstance) {
    window.kdsInstance = null;
}

document.addEventListener('DOMContentLoaded', () => {
    // 기존 인스턴스가 있으면 정리
    if (window.kdsInstance) {
        console.log('🧹 기존 KDS 인스턴스 정리 중...');
        try {
            window.kdsInstance.destroy();
        } catch (error) {
            console.warn('⚠️ 기존 인스턴스 정리 중 오류:', error);
        }
    }
    
    const storeId = new URLSearchParams(window.location.search).get('storeId') || '1';

    // KDSController 클래스가 로드되었는지 확인
    if (typeof KDSController === 'undefined') {
        console.error('❌ KDSController 클래스를 찾을 수 없습니다. 모듈 로드를 확인해주세요.');
        return;
    }

    try {
        window.kdsInstance = new KDSController(storeId);
        window.kdsInstance.init();
    } catch (error) {
        console.error('❌ KDS 인스턴스 생성 실패:', error);
        document.getElementById('kdsMain').innerHTML = `
            <div class="error-message">
                <h2>KDS 시스템 오류</h2>
                <p>KDS를 초기화할 수 없습니다: ${error.message}</p>
                <button onclick="location.reload()">새로고침</button>
            </div>
        `;
    }
});

// 페이지 언로드시 정리
window.addEventListener('beforeunload', () => {
    if (window.kdsInstance) {
        try {
            window.kdsInstance.destroy();
        } catch (error) {
            console.warn('⚠️ KDS 인스턴스 정리 중 오류:', error);
        }
    }
});

// 전역 함수로 노출 (HTML onclick에서 사용) - 중복 방지
if (!window.kds) {
    window.kds = {
        selectStation: (stationId) => window.kdsInstance?.selectStation(stationId),
        quickAction: (ticketId) => window.kdsInstance?.quickAction(ticketId),
        itemQuickAction: (itemId) => window.kdsInstance?.itemQuickAction(itemId),
        itemAction: (itemId, action, notes) => window.kdsInstance?.itemAction(itemId, action, notes),
        ticketAction: (ticketId, action) => window.kdsInstance?.ticketAction(ticketId, action),
        completeOrder: (checkId) => window.kdsInstance?.completeOrder(checkId)
    };
}

console.log('✅ KDS 메인 스크립트 로드 완료');
