
/**
 * StoreFeed Service
 * 비즈니스 로직 계층
 */

import { storeFeedRepository } from '../repositories/storeFeedRepository.js';

export const storeFeedService = {
  /**
   * 매장 피드 데이터 가져오기
   */
  async loadStoreFeed(storeId) {
    console.log(`🔄 [StoreFeedService] 매장 ${storeId} 피드 로딩 시작`);

    try {
      const feedData = await storeFeedRepository.fetchStoreFeed(storeId);
      
      console.log(`✅ [StoreFeedService] 피드 데이터 로드 완료: ${feedData.posts.length}개 게시물`);
      
      return feedData;
    } catch (error) {
      console.error('❌ [StoreFeedService] 피드 로드 실패:', error);
      throw error;
    }
  },

  /**
   * 좋아요 토글
   */
  async toggleLike(postId, currentLikeState) {
    console.log(`❤️ [StoreFeedService] 게시물 ${postId} 좋아요 토글`);
    
    // 더미 구현 (추후 API 연동)
    return {
      isLiked: !currentLikeState,
      likes: currentLikeState ? -1 : 1 // 증감값
    };
  },

  /**
   * 단골 등록/해제
   */
  async toggleFollow(storeId, currentFollowState) {
    console.log(`⭐ [StoreFeedService] 매장 ${storeId} 단골 ${currentFollowState ? '해제' : '등록'}`);
    
    // 더미 구현
    return {
      isFollowing: !currentFollowState,
      followers: currentFollowState ? -1 : 1
    };
  }
};
