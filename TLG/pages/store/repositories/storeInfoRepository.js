
/**
 * 매장 추가 정보 레포지토리 - 데이터 접근
 */
export const storeInfoRepository = {
  /**
   * 매장 상세 정보 조회
   */
  async fetchStoreDetailInfo(storeId) {
    
      //추후 API 호출로 변경 ()
      //  const response = await fetch(`/api/stores/${storeId}/detail`);
        return this.getDummyStoreInfo();
  },

  /**
   * 매장 공지사항 조회 (API 호출 제거 - 더미 데이터 사용)
   */
  async fetchStoreNotices(storeId) {
    console.log('📢 공지사항 로드 (더미 데이터 사용 - API 호출 없음)');
    return this.getDummyNotices();
  },

  /**
   * 더미 매장 정보
   */
  getDummyStoreInfo() {
    return {
      description: '신선한 재료로 정성껏 만든 음식을 제공하는 맛집입니다. 가족 단위 고객과 회식 모임에 최적화된 공간을 제공합니다.',
      operatingHours: {
        weekday: '10:00 - 22:00',
        weekend: '10:00 - 23:00',
        holiday: '11:00 - 21:00'
      },
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
