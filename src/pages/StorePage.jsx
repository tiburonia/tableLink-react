
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './StorePage.css';

export default function StorePage() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [isFavorite, setIsFavorite] = useState(false);

  // 매장 데이터 로드
  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        setLoading(true);
        const userId = user?.id || user?.userId;
        const apiUrl = userId 
          ? `/api/stores/${storeId}?userId=${userId}`
          : `/api/stores/${storeId}`;
        
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        if (data.success && data.store) {
          setStore(data.store);
          // 즐겨찾기 상태는 별도 API로 확인 (추후 구현)
        } else {
          throw new Error(data.error || '매장 정보를 불러올 수 없습니다');
        }
      } catch (err) {
        console.error('매장 데이터 로드 실패:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (storeId) {
      fetchStoreData();
    }
  }, [storeId, user]);

  // 즐겨찾기 토글
  const toggleFavorite = async () => {
    if (!user) {
      alert('로그인이 필요합니다');
      return;
    }
    
    try {
      // TODO: 즐겨찾기 API 호출
      setIsFavorite(!isFavorite);
    } catch (err) {
      console.error('즐겨찾기 토글 실패:', err);
    }
  };

  // TLL 주문 시작
  const startTLLOrder = () => {
    if (!user) {
      alert('로그인이 필요합니다');
      return;
    }
    // TODO: TLL 주문 페이지로 이동
    alert('TLL 주문 기능은 준비 중입니다');
  };

  if (loading) {
    return <StorePageSkeleton />;
  }

  if (error) {
    return (
      <div className="store-error">
        <h2>🚫 매장을 불러올 수 없습니다</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/map')} className="back-btn">
          지도로 돌아가기
        </button>
      </div>
    );
  }

  if (!store) {
    return null;
  }

  return (
    <div className="store-page">
      {/* 상단 고정 헤더 */}
      <header className="store-fixed-header">
        <button onClick={() => navigate('/map')} className="header-btn">
          <span>⬅️</span>
        </button>
        <button onClick={startTLLOrder} className="header-btn">
          <span>📱</span>
        </button>
      </header>

      {/* 매장 이미지 헤더 */}
      <section className="store-header">
        <div className="img-wrapper">
          <img src="/TableLink.png" alt={store.name} />
          <div className="header-overlay"></div>
        </div>
      </section>

      {/* 매장 정보 패널 */}
      <div className="store-panel">
        <div className="store-title-section">
          <h1 className="store-name">{store.name}</h1>
          <button 
            onClick={toggleFavorite}
            className={`favorite-btn ${isFavorite ? 'active' : ''}`}
          >
            {isFavorite ? '❤️' : '🤍'}
          </button>
        </div>

        <div className="store-meta">
          <span className="store-category">{store.category || '일반 음식점'}</span>
          <span className="store-rating">
            ⭐ {parseFloat(store.rating_average || 0).toFixed(1)}
          </span>
          <span className="store-reviews">
            리뷰 {store.review_count || 0}개
          </span>
        </div>

        {/* 탭 네비게이션 */}
        <nav className="store-tabs">
          {['home', 'menu', 'review', 'info', 'regular'].map(tab => (
            <button
              key={tab}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {getTabLabel(tab)}
            </button>
          ))}
        </nav>

        {/* 탭 컨텐츠 */}
        <div className="store-content">
          {activeTab === 'home' && <HomeTab store={store} />}
          {activeTab === 'menu' && <MenuTab store={store} />}
          {activeTab === 'review' && <ReviewTab store={store} />}
          {activeTab === 'info' && <InfoTab store={store} />}
          {activeTab === 'regular' && <RegularTab store={store} />}
        </div>
      </div>

      {/* 하단 액션 바 */}
      <footer className="store-bottom-bar">
        <button className="action-btn phone-btn">
          📞 전화
        </button>
        <button className="action-btn order-btn">
          포장·예약하기
        </button>
      </footer>
    </div>
  );
}

// 탭 라벨
function getTabLabel(tab) {
  const labels = {
    home: '홈',
    menu: '메뉴',
    review: '리뷰',
    info: '정보',
    regular: '단골혜택'
  };
  return labels[tab] || tab;
}

// 홈 탭
function HomeTab({ store }) {
  return (
    <div className="home-tab">
      <section className="info-section">
        <h3>📍 매장 정보</h3>
        <p className="address">{store.full_address || '주소 정보 없음'}</p>
        {store.store_tel_number && (
          <a href={`tel:${store.store_tel_number}`} className="tel-link">
            📞 {store.store_tel_number}
          </a>
        )}
      </section>

      {store.amenities && (
        <section className="amenities-section">
          <h3>🏪 편의시설</h3>
          <div className="amenities-grid">
            {store.amenities.wifi && <div className="amenity-badge">📶 WiFi</div>}
            {store.amenities.parking && <div className="amenity-badge">🅿️ 주차</div>}
            {store.amenities.pet_friendly && <div className="amenity-badge">🐾 반려동물</div>}
            {store.amenities.power_outlet && <div className="amenity-badge">🔌 콘센트</div>}
            {store.amenities.smoking_area && <div className="amenity-badge">🚬 흡연구역</div>}
          </div>
        </section>
      )}
    </div>
  );
}

// 메뉴 탭
function MenuTab({ store }) {
  const menu = store.menu || [];

  if (menu.length === 0) {
    return (
      <div className="empty-state">
        <p>🍽️ 등록된 메뉴가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="menu-tab">
      <div className="menu-grid">
        {menu.map(item => (
          <div key={item.id} className="menu-item">
            <div className="menu-image">
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} />
              ) : (
                <div className="menu-no-image">🍽️</div>
              )}
            </div>
            <div className="menu-info">
              <h4>{item.name}</h4>
              {item.description && <p>{item.description}</p>}
              <span className="menu-price">{item.price?.toLocaleString()}원</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 리뷰 탭
function ReviewTab({ store }) {
  const reviews = store.reviews || [];

  if (reviews.length === 0) {
    return (
      <div className="empty-state">
        <p>💬 아직 리뷰가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="review-tab">
      {reviews.slice(0, 3).map((review, idx) => (
        <div key={idx} className="review-card">
          <div className="review-header">
            <div className="user-info">
              <div className="user-avatar">
                {review.user_name?.charAt(0) || '👤'}
              </div>
              <span className="user-name">{review.user_name || '익명'}</span>
            </div>
            <div className="review-rating">
              {'⭐'.repeat(review.score || 0)}
            </div>
          </div>
          <p className="review-content">{review.content}</p>
        </div>
      ))}
    </div>
  );
}

// 정보 탭
function InfoTab({ store }) {
  return (
    <div className="info-tab">
      <section className="info-section">
        <h3>📍 위치</h3>
        <p>{store.full_address || '주소 정보 없음'}</p>
      </section>
      
      <section className="info-section">
        <h3>⭐ 평점</h3>
        <p>{parseFloat(store.rating_average || 0).toFixed(1)} / 5.0</p>
        <p className="small">리뷰 {store.review_count || 0}개</p>
      </section>
    </div>
  );
}

// 단골혜택 탭
function RegularTab({ store }) {
  const promotions = store.promotions || [];

  if (promotions.length === 0) {
    return (
      <div className="empty-state">
        <p>👑 단골 혜택이 준비 중입니다</p>
      </div>
    );
  }

  return (
    <div className="regular-tab">
      {promotions.map((promo, idx) => (
        <div key={idx} className="promo-card">
          <h4>{promo.level} 등급</h4>
          <p>최소 주문: {promo.min_orders}회</p>
          <p>혜택: {promo.benefits}</p>
        </div>
      ))}
    </div>
  );
}

// 스켈레톤 로딩
function StorePageSkeleton() {
  return (
    <div className="store-page skeleton">
      <div className="skeleton-header"></div>
      <div className="skeleton-panel">
        <div className="skeleton-title"></div>
        <div className="skeleton-tabs"></div>
        <div className="skeleton-content"></div>
      </div>
    </div>
  );
}
