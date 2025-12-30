/**
 * 단골 소식 피드 서비스
 * FSD: features/feed/model
 */

export interface Post {
  id: number;
  storeId: number;
  storeName: string;
  storeLogo: string;
  postType: 'story' | 'promotion' | 'notice';
  title: string;
  content: string;
  hasImage: boolean;
  imageUrl?: string;
  likes: number;
  comments: number;
  hasLiked: boolean;
  hasCoupon: boolean;
  couponReceived: boolean;
  createdAt: string;
}

export interface FeedData {
  posts: Post[];
  totalCount: number;
  error?: string;
}

/**
 * 사용자 맞춤 피드 조회
 */
export const getPersonalizedFeed = async (
  userId: number,
  type: 'all' | 'following' | 'event' | 'menu' = 'all'
): Promise<FeedData> => {
  try {
    const response = await fetch(
      `/api/users/${userId}/personalized-feed?type=${type}`
    );
    
    if (!response.ok) {
      throw new Error('피드를 불러오는데 실패했습니다.');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Feed fetch error:', error);
    return {
      posts: [],
      totalCount: 0,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    };
  }
};

/**
 * 게시물 좋아요 토글
 */
export const toggleLike = async (postId: number, userId: number): Promise<boolean> => {
  try {
    const response = await fetch(`/api/feed/posts/${postId}/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error('좋아요 처리에 실패했습니다.');
    }

    const data = await response.json();
    return data.liked;
  } catch (error) {
    console.error('Like toggle error:', error);
    return false;
  }
};

/**
 * 쿠폰 받기
 */
export const receiveCoupon = async (postId: number, storeId: number, userId: number): Promise<boolean> => {
  try {
    const response = await fetch(`/api/feed/posts/${postId}/coupon`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, storeId }),
    });

    if (!response.ok) {
      throw new Error('쿠폰 받기에 실패했습니다.');
    }

    return true;
  } catch (error) {
    console.error('Coupon receive error:', error);
    return false;
  }
};

/**
 * 상대 시간 계산
 */
export const getRelativeTime = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return '방금 전';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}일 전`;
  
  return date.toLocaleDateString('ko-KR', { 
    month: 'long', 
    day: 'numeric' 
  });
};
