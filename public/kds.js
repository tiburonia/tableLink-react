/**
 * KDS 메인 초기화 스크립트
 * 책임: KDS 시스템 초기화 및 전역 함수 노출
 */

console.log('🚀 TableLink KDS v3.0 시작');

// 전역 KDS 컨트롤러 인스턴스
let kds;

document.addEventListener('DOMContentLoaded', () => {
    const storeId = new URLSearchParams(window.location.search).get('storeId') || '1';

    // KDSController 클래스가 로드되었는지 확인
    if (typeof KDSController === 'undefined') {
        console.error('❌ KDSController 클래스를 찾을 수 없습니다. 모듈 로드를 확인해주세요.');
        return;
    }

    kds = new KDSController(storeId);
    kds.init();
});

// 페이지 언로드시 정리
window.addEventListener('beforeunload', () => {
    if (kds) {
        kds.destroy();
    }
});

// 전역 함수로 노출 (HTML onclick에서 사용)
window.kds = {
    selectStation: (stationId) => kds?.selectStation(stationId),
    quickAction: (ticketId) => kds?.quickAction(ticketId),
    itemQuickAction: (itemId) => kds?.itemQuickAction(itemId),
    itemAction: (itemId, action, notes) => kds?.itemAction(itemId, action, notes),
    ticketAction: (ticketId, action) => kds?.ticketAction(ticketId, action),
    completeOrder: (checkId) => kds?.completeOrder(checkId)
};

console.log('✅ KDS 메인 스크립트 로드 완료');