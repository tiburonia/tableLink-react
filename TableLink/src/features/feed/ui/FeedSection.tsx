/**
 * 단골 소식 피드 섹션 컴포넌트
 * FSD: features/feed/ui
 */

import { useState, useEffect } from 'react';
import type { Post } from '../model/feedService';
import { getPersonalizedFeed } from '../model/feedService';
import { PostCard } from './PostCard';
import styles from './FeedSection.module.css';

interface FeedSectionProps {
  userId: number;
}

type FeedTab = 'all' | 'following' | 'event' | 'menu';

export const FeedSection: React.FC<FeedSectionProps> = ({ userId }) => {
  const [currentTab, setCurrentTab] = useState<FeedTab>('following');
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tabs = [
    { id: 'all' as FeedTab, label: '전체', icon: '📢' },
    { id: 'following' as FeedTab, label: '내 단골', icon: '❤️' },
    { id: 'event' as FeedTab, label: '이벤트', icon: '🎉' },
    { id: 'menu' as FeedTab, label: '신메뉴', icon: '🍽️' }
  ];

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      const data = await getPersonalizedFeed(userId, currentTab);
      
      if (data.error) {
        setError(data.error);
      } else {
        setPosts(data.posts);
      }
      
      setIsLoading(false);
    };

    loadData();
  }, [currentTab, userId]);

  const loadFeed = async () => {
    setIsLoading(true);
    setError(null);
    
    const data = await getPersonalizedFeed(userId, currentTab);
    
    if (data.error) {
      setError(data.error);
    } else {
      setPosts(data.posts);
    }
    
    setIsLoading(false);
  };

  const handleTabChange = (tabId: FeedTab) => {
    setCurrentTab(tabId);
  };

  if (isLoading) {
    return (
      <div className={styles.feedSection}>
        <div className={styles.feedTabs}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`${styles.feedTab} ${currentTab === tab.id ? styles.active : ''}`}
              onClick={() => handleTabChange(tab.id)}
            >
              <span className={styles.tabIcon}>{tab.icon}</span>
              <span className={styles.tabLabel}>{tab.label}</span>
            </button>
          ))}
        </div>
        <div className={styles.feedLoading}>
          <div className={styles.loadingSpinner}></div>
          <p>피드를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.feedSection}>
        <div className={styles.feedTabs}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`${styles.feedTab} ${currentTab === tab.id ? styles.active : ''}`}
              onClick={() => handleTabChange(tab.id)}
            >
              <span className={styles.tabIcon}>{tab.icon}</span>
              <span className={styles.tabLabel}>{tab.label}</span>
            </button>
          ))}
        </div>
        <div className={styles.feedError}>
          <div className={styles.errorIcon}>⚠️</div>
          <h3>피드를 불러올 수 없습니다</h3>
          <p>{error}</p>
          <button onClick={loadFeed} className={styles.retryBtn}>다시 시도</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.feedSection}>
      <div className={styles.feedTabs}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`${styles.feedTab} ${currentTab === tab.id ? styles.active : ''}`}
            onClick={() => handleTabChange(tab.id)}
          >
            <span className={styles.tabIcon}>{tab.icon}</span>
            <span className={styles.tabLabel}>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className={styles.feedContent}>
        {posts.length === 0 ? (
          <div className={styles.feedEmpty}>
            <div className={styles.emptyIcon}>📭</div>
            <h3>소식이 없어요</h3>
            <p>단골 매장의 새로운 소식을 기다려주세요!</p>
          </div>
        ) : (
          <div className={styles.feedList}>
            {posts.map(post => (
              <PostCard 
                key={post.id} 
                post={post} 
                onUpdate={loadFeed}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
