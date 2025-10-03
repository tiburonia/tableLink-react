
/**
 * 매장 추가 정보 레포지토리 - 데이터 접근
 */
export const storeInfoRepository = {
  /**
   * 매장 상세 정보 조회
   */
  async fetchStoreDetailInfo(storeId) {
    try {
      const response = await fetch(`/api/stores/${storeId}/detail`);
      
      if (!response.ok) {
        console.warn('⚠️ 매장 상세 정보 조회 실패, 더미 데이터 사용');
        return this.getDummyStoreInfo();
      }

      const data = await response.json();
      return data.success ? data.info : this.getDummyStoreInfo();
    } catch (error) {
      console.warn('⚠️ 매장 상세 정보 조회 오류:', error);
      return this.getDummyStoreInfo();
    }
  },

  /**
   * 매장 공지사항 조회
   */
  async fetchStoreNotices(storeId) {
    try {
      const response = await fetch(`/api/stores/${storeId}/notices`);
      
      if (!response.ok) {
        console.warn('⚠️ 공지사항 조회 실패, 더미 데이터 사용');
        return this.getDummyNotices();
      }

      const data = await response.json();
      return data.success ? data.notices : this.getDummyNotices();
    } catch (error) {
      console.warn('⚠️ 공지사항 조회 오류:', error);
      return this.getDummyNotices();
    }
  },

  /**
   * 더미 매장 정보
   */
  getDummyStoreInfo() {
    return {
      description: '신선한 재료로 정성껏 만든 음식을 제공하는 맛집입니다. 가족 단위 고객과 회식 모임에 최적화된 공간을 제공합니다.',
      facilities: [
        { name: '주차', available: true, icon: '🅿️' },
        { name: 'WiFi', available: true, icon: '📶' },
        { name: '단체석', available: true, icon: '👥' },
        { name: '배달', available: true, icon: '🚚' }
      ],
      payment: ['현금', '카드', '간편결제'],
      specialties: ['시그니처 메뉴', '계절 한정 메뉴', '단체 메뉴']
    };
  },

  /**
   * 더미 공지사항
   */
  getDummyNotices() {
    return [
      {
        id: 1,
        type: 'event',
        title: '신메뉴 출시',
        content: '봄맞이 신메뉴가 출시되었습니다. 많은 관심 부탁드립니다!',
        date: '2025-02-05',
        icon: '🎉'
      }
    ];
  }
};

// 전역 등록
window.storeInfoRepository = storeInfoRepository;

console.log('✅ storeInfoRepository 로드 완료');
