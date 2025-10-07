import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import './StorePage.css';

// 탭 컴포넌트들
import HomeTab from '../components/store/HomeTab';
import MenuTab from '../components/store/MenuTab';
import ReviewTab from '../components/store/ReviewTab';
import InfoTab from '../components/store/InfoTab';

export default function StorePage() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');

  // 매장 데이터 조회
  const { data: store, isLoading, error } = useQuery({
    queryKey: ['store', storeId],
    queryFn: async () => {
      const response = await fetch(`/api/stores/${storeId}`);
      if (!response.ok) throw new Error('매장 정보를 불러올 수 없습니다');
      const data = await response.json();
      // Assuming the API returns an object with a 'store' property containing the store details
      return data.store; 
    },
  });

  if (isLoading) {
    return (
      <div className="store-page-loading">
        <div className="loading-spinner"></div>
        <p>매장 정보를 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="store-page-error">
        <h2>오류가 발생했습니다</h2>
        <p>{error.message}</p>
        <button onClick={() => navigate('/map')}>지도로 돌아가기</button>
      </div>
    );
  }

  // Ensure store data is available before proceeding
  if (!store) {
    return null; // Or a loading state if preferred, though isLoading should handle this
  }

  const tabs = [
    { id: 'home', label: '홈', icon: '🏠' },
    { id: 'menu', label: '메뉴', icon: '🍽️' },
    { id: 'review', label: '리뷰', icon: '⭐' },
    { id: 'info', label: '정보', icon: 'ℹ️' },
  ];

  return (
    <div className="store-page">
      {/* 헤더 */}
      <header className="store-header">
        <button className="back-btn" onClick={() => navigate('/map')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="store-title-area">
          <h1>{store.name}</h1>
          <p>{store.category || '일반 음식점'}</p>
        </div>
        <button className="favorite-btn">
          ♡
        </button>
      </header>

      {/* 탭 네비게이션 */}
      <nav className="store-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* 탭 컨텐츠 */}
      <div className="store-content">
        {activeTab === 'home' && <HomeTab store={store} />}
        {activeTab === 'menu' && <MenuTab storeId={storeId} />}
        {activeTab === 'review' && <ReviewTab storeId={storeId} />}
        {activeTab === 'info' && <InfoTab store={store} />}
      </div>

      {/* 하단 주문 버튼 */}
      <div className="store-footer">
        <button 
          className="order-btn"
          onClick={() => navigate(`/order/${storeId}`)}
        >
          <span>주문하기</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      </div>
    </div>
  );
}