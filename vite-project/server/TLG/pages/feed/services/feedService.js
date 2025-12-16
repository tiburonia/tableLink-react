
/**
 * 단골 소식 피드 Service
 * 비즈니스 로직 처리
 */

import { feedRepository } from '/TLG/pages/feed/repositories/feedRepository.js';

export const feedService = {
  /**
   * 피드 데이터 가져오기
   */
  async getFeedData(userId, filter = 'all') {
    try {
      const posts = await feedRepository.getAllPosts(userId, filter);

      return {
        success: true,
        posts,
        totalCount: posts.length
      };
    } catch (error) {
      console.error('❌ 피드 데이터 조회 실패:', error);
      return {
        success: false,
        posts: [],
        totalCount: 0,
        error: error.message
      };
    }
  },

  /**
   * 상대 시간 포맷
   */
  getRelativeTime(date) {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days === 1) return '어제';
    if (days < 7) return `${days}일 전`;
    return new Date(date).toLocaleDateString();
  },

  /**
   * 등급별 색상 반환
   */
  getLevelColor(level) {
    const colors = {
      'PLATINUM': 'linear-gradient(135deg, #e5e4e2 0%, #c0c0c0 100%)',
      'GOLD': 'linear-gradient(135deg, #ffd700 0%, #ffb700 100%)',
      'SILVER': 'linear-gradient(135deg, #c0c0c0 0%, #a8a8a8 100%)',
      'BRONZE': 'linear-gradient(135deg, #cd7f32 0%, #b87333 100%)'
    };
    return colors[level] || 'linear-gradient(135deg, #64748b 0%, #475569 100%)';
  },

  /**
   * 태그 색상 반환
   */
  getTagColor(postType) {
    const colors = {
      'event': '#FF8A00',
      'new_menu': '#10b981',
      'promotion': '#f59e0b',
      'notice': '#6366f1'
    };
    return colors[postType] || '#64748b';
  }
};

window.feedService = feedService;
console.log('✅ feedService 모듈 로드 완료');
