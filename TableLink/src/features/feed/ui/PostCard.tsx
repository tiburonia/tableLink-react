/**
 * 단골 소식 게시물 카드 컴포넌트
 * FSD: features/feed/ui
 */

import { useState } from 'react';
import type { Post } from '../model/feedService';
import { toggleLike, receiveCoupon, getRelativeTime } from '../model/feedService';
import styles from './PostCard.module.css';

interface PostCardProps {
  post: Post;
  onUpdate: () => void;
}

const getTypeInfo = (type: string) => {
  const typeMap = {
    story: { icon: '📖', text: '스토리', color: '#667eea' },
    promotion: { icon: '🎁', text: '이벤트', color: '#f59e0b' },
    notice: { icon: '📢', text: '공지', color: '#ef4444' }
  };
  return typeMap[type as keyof typeof typeMap] || typeMap.story;
};

export const PostCard: React.FC<PostCardProps> = ({ post, onUpdate }) => {
  const [isLiked, setIsLiked] = useState(post.hasLiked);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [isCouponReceived, setIsCouponReceived] = useState(post.couponReceived);
  const [isProcessing, setIsProcessing] = useState(false);

  const typeInfo = getTypeInfo(post.postType);
  const relativeTime = getRelativeTime(post.createdAt);

  const handleLikeClick = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    const userId = parseInt(localStorage.getItem('userId') || '0');
    const liked = await toggleLike(post.id, userId);
    
    setIsLiked(liked);
    setLikeCount(prev => liked ? prev + 1 : prev - 1);
    setIsProcessing(false);
  };

  const handleCouponClick = async () => {
    if (isProcessing || isCouponReceived) return;
    
    setIsProcessing(true);
    const userId = parseInt(localStorage.getItem('userId') || '0');
    const success = await receiveCoupon(post.id, post.storeId, userId);
    
    if (success) {
      setIsCouponReceived(true);
      alert('쿠폰이 발급되었습니다! 🎉');
      onUpdate();
    } else {
      alert('쿠폰 받기에 실패했습니다.');
    }
    setIsProcessing(false);
  };

  const handleCommentClick = () => {
    alert('댓글 기능은 준비 중입니다.');
  };

  return (
    <article className="feed-post" data-post-id={post.id} data-type={post.postType}>
      <div className="post-header">
        <div className="post-store-logo">{post.storeLogo}</div>
        <div className="post-meta">
          <span className="post-author">{post.storeName}</span>
          <span className="post-date">{relativeTime}</span>
        </div>
        <span 
          className="post-type-badge" 
          style={{ 
            background: `${typeInfo.color}20`, 
            color: typeInfo.color 
          }}
        >
          {typeInfo.icon} {typeInfo.text}
        </span>
      </div>

      {post.hasImage && post.imageUrl && (
        <img src={post.imageUrl} className="post-image" alt={post.title} />
      )}

      <div className="post-body">
        <h3 className="post-title">{post.title}</h3>
        <p className="post-caption">{post.content}</p>
        
        <div className="post-actions">
          <button 
            className={`like-btn ${isLiked ? 'liked' : ''}`}
            onClick={handleLikeClick}
            disabled={isProcessing}
          >
            <span className="like-icon">{isLiked ? '❤️' : '🤍'}</span>
            <span className="like-count">{likeCount}</span>
          </button>
          
          <button className="comment-btn" onClick={handleCommentClick}>
            <span className="comment-icon">💬</span>
            <span className="comment-text">댓글 {post.comments}</span>
          </button>
          
          {post.hasCoupon && (
            <button 
              className={`coupon-btn ${isCouponReceived ? 'received' : ''}`}
              onClick={handleCouponClick}
              disabled={isProcessing || isCouponReceived}
            >
              <span className="coupon-icon">{isCouponReceived ? '✅' : '🎁'}</span>
              <span className="coupon-text">{isCouponReceived ? '받음' : '쿠폰'}</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
