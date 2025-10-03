
/**
 * 매장 추가 정보 서비스 - 비즈니스 로직
 */
let storeInfoRepository;

try {
  const repoModule = await import('../repositories/storeInfoRepository.js');
  storeInfoRepository = repoModule.storeInfoRepository;
} catch (error) {
  console.warn('⚠️ storeInfoRepository 모듈 임포트 실패:', error);
}

export const storeInfoService = {
  /**
   * 매장 추가 정보 데이터 가져오기 및 가공
   */
  async getStoreAdditionalInfo(store) {
    try {
      const detailInfo = await storeInfoRepository.fetchStoreDetailInfo(store.id);
      
      return {
        address: store.full_address || store.address || '주소 정보 없음',
        rating: {
          average: parseFloat(store.ratingAverage || 0).toFixed(1),
          count: parseInt(store.reviewCount || store.review_count || 0)
        },
        description: detailInfo.description,
        operatingHours: detailInfo.operatingHours,
        facilities: detailInfo.facilities,
        payment: detailInfo.payment,
        specialties: detailInfo.specialties,
        contact: store.phone || store.contact || '연락처 정보 없음',
        category: store.category || '일반 음식점'
      };
    } catch (error) {
      console.error('❌ 매장 추가 정보 가져오기 실패:', error);
      return this.getDefaultAdditionalInfo(store);
    }
  },

  /**
   * 공지사항 데이터 가져오기 및 가공
   */
  async getStoreNotices(store) {
    try {
      const notices = await storeInfoRepository.fetchStoreNotices(store.id);
      
      return notices.map(notice => ({
        ...notice,
        formattedDate: this.formatNoticeDate(notice.date),
        isNew: this.isNewNotice(notice.date)
      }));
    } catch (error) {
      console.error('❌ 공지사항 가져오기 실패:', error);
      return [];
    }
  },

  /**
   * 기본 추가 정보 반환
   */
  getDefaultAdditionalInfo(store) {
    return {
      address: store.full_address || store.address || '주소 정보 없음',
      rating: {
        average: '0.0',
        count: 0
      },
      description: '매장 정보를 준비 중입니다.',
      operatingHours: {
        weekday: '정보 없음',
        weekend: '정보 없음',
        holiday: '정보 없음'
      },
      facilities: [],
      payment: [],
      specialties: [],
      contact: '연락처 정보 없음',
      category: store.category || '일반 음식점'
    };
  },

  /**
   * 공지사항 날짜 포맷팅
   */
  formatNoticeDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '오늘';
    if (diffDays === 1) return '어제';
    if (diffDays < 7) return `${diffDays}일 전`;
    
    return date.toLocaleDateString('ko-KR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  },

  /**
   * 새 공지사항 여부 확인 (7일 이내)
   */
  isNewNotice(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    return diffDays < 7;
  }
};

// 전역 등록
window.storeInfoService = storeInfoService;

console.log('✅ storeInfoService 로드 완료');
