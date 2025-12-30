/**
 * 단골 소식 피드 섹션 컴포넌트
 * FSD: features/feed/ui
 */

import { useState, useEffect } from 'react';
import type { Post } from '../model/feedService';
import { getPersonalizedFeed } from '../model/feedService';
import { feedTabs, type FeedTab } from '../model/feedTabs';
import { PostCard } from './PostCard';
import styles from './FeedSection.module.css';

export type { FeedTab } from '../model/feedTabs';

interface FeedSectionProps {
  userId: number;
  currentTab?: FeedTab;
}

// FeedTabs 컴포넌트
interface FeedTabsProps {
  currentTab: FeedTab;
  onTabChange: (tab: FeedTab) => void;
}

export const FeedTabs: React.FC<FeedTabsProps> = ({ currentTab, onTabChange }) => {
  return (
    <div className={styles.feedTabs}>
      {feedTabs.map(tab => (
        <button
          key={tab.id}
          className={`${styles.feedTab} ${currentTab === tab.id ? styles.active : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          <span className={styles.tabIcon}>{tab.icon}</span>
          <span className={styles.tabLabel}>{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

export const FeedSection: React.FC<FeedSectionProps> = ({ userId, currentTab: externalTab }) => {
  const [internalTab] = useState<FeedTab>('following');
  const currentTab = externalTab ?? internalTab;
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (isLoading) {
    return (
      <div className={styles.feedSection}>
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
