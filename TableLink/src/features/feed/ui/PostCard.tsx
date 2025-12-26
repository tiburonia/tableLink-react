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
    <article className={styles.feedPost} data-post-id={post.id} data-type={post.postType}>
      <div className={styles.postHeader}>
        <div className={styles.postStoreLogo}>{post.storeLogo}</div>
        <div className={styles.postMeta}>
          <span className={styles.postAuthor}>{post.storeName}</span>
          <span className={styles.postDate}>{relativeTime}</span>
        </div>
        <span 
          className={styles.postTypeBadge} 
          style={{ 
            background: `${typeInfo.color}20`, 
            color: typeInfo.color 
          }}
        >
          {typeInfo.icon} {typeInfo.text}
        </span>
      </div>

      {post.hasImage && post.imageUrl && (
        <img src={post.imageUrl} className={styles.postImage} alt={post.title} />
      )}

      <div className={styles.postBody}>
        <h3 className={styles.postTitle}>{post.title}</h3>
        <p className={styles.postCaption}>{post.content}</p>
        
        <div className={styles.postActions}>
          <button 
            className={`${styles.likeBtn} ${isLiked ? styles.liked : ''}`}
            onClick={handleLikeClick}
            disabled={isProcessing}
          >
            <span className={styles.likeIcon}>{isLiked ? '❤️' : '🤍'}</span>
            <span className={styles.likeCount}>{likeCount}</span>
          </button>
          
          <button className={styles.commentBtn} onClick={handleCommentClick}>
            <span className={styles.commentIcon}>💬</span>
            <span className={styles.commentText}>댓글 {post.comments}</span>
          </button>
          
          {post.hasCoupon && (
            <button 
              className={`${styles.couponBtn} ${isCouponReceived ? styles.received : ''}`}
              onClick={handleCouponClick}
              disabled={isProcessing || isCouponReceived}
            >
              <span className={styles.couponIcon}>{isCouponReceived ? '✅' : '🎁'}</span>
              <span className={styles.couponText}>{isCouponReceived ? '받음' : '쿠폰'}</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
