
import React from 'react';
import { useQuery } from '@tanstack/react-query';

export default function ReviewTab({ storeId }) {
  const { data: reviews, isLoading } = useQuery({
    queryKey: ['reviews', storeId],
    queryFn: async () => {
      const response = await fetch(`/api/stores/${storeId}/reviews`);
      if (!response.ok) throw new Error('리뷰를 불러올 수 없습니다');
      return response.json();
    },
  });

  if (isLoading) {
    return <div className="tab-loading">리뷰를 불러오는 중...</div>;
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">⭐</div>
        <p>아직 작성된 리뷰가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="review-tab">
      {reviews.map((review) => (
        <div key={review.id} className="review-card">
          <div className="review-header">
            <div className="user-info">
              <span className="user-name">{review.user_name || '익명'}</span>
              <div className="rating">
                {'⭐'.repeat(review.rating)}
              </div>
            </div>
            <span className="review-date">
              {new Date(review.created_at).toLocaleDateString()}
            </span>
          </div>
          <p className="review-content">{review.content}</p>
          {review.images && review.images.length > 0 && (
            <div className="review-images">
              {review.images.map((img, idx) => (
                <img key={idx} src={img} alt="리뷰 이미지" />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
