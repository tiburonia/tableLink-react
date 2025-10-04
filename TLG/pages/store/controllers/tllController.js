
/**
 * TLL (TableLink Live) 컨트롤러
 * QR 주문 시스템 관련 로직 처리
 */
export const tllController = {
  /**
   * TLL 주문 시작
   * @param {Object} store - 매장 객체
   */
  async startTLLOrder(store) {
    try {
      console.log(`🎯 TLL 버튼 클릭 - 매장 ${store.name} 선택`);

      // 매장 데이터 정규화
      const normalizedStore = this.normalizeStoreData(store);

      // 전역 저장 (TLL.js에서 참조)
      this.saveToGlobal(normalizedStore);

      // TLL 함수 실행
      await this.executeTLL(normalizedStore);

    } catch (error) {
      console.error('❌ TLL 실행 실패:', error);
      alert('QR 주문 시스템 실행 중 오류가 발생했습니다.');
    }
  },

  /**
   * 매장 데이터 정규화
   */
  normalizeStoreData(store) {
    return {
      id: store.id,
      store_id: store.id,
      name: store.name,
      category: store.category || '기타',
      address: store.address || '주소 정보 없음',
      isOpen: store.isOpen !== false,
      menu: Array.isArray(store.menu) ? store.menu : []
    };
  },

  /**
   * 전역 변수에 저장
   */
  saveToGlobal(store) {
    window.preselectedStoreForTLL = store;
    window.selectedStore = store;
    window.currentStoreForTLL = store;
  },

  /**
   * TLL 함수 실행
   */
  async executeTLL(store) {
    if (typeof window.TLL === 'function') {
      await window.TLL(store);
    } else if (typeof TLL === 'function') {
      await TLL(store);
    } else {
      await this.loadTLLScript(store);
    }
  },

  /**
   * TLL 스크립트 동적 로드
   */
  async loadTLLScript(store) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = '/TLG/utils/TLL.js';

      script.onload = async () => {
        setTimeout(async () => {
          try {
            if (typeof window.TLL === 'function') {
              await window.TLL(store);
              resolve();
            } else {
              reject(new Error('TLL 함수를 찾을 수 없습니다'));
            }
          } catch (error) {
            reject(error);
          }
        }, 100);
      };

      script.onerror = () => reject(new Error('TLL.js 스크립트 로드 실패'));
      document.head.appendChild(script);
    });
  }
};

// 전역 등록
window.tllController = tllController;
