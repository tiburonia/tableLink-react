
// TableLink 서브메인 화면 렌더링
async function renderSubMain() {
  const main = document.getElementById('main');

  // 스켈레톤 UI 먼저 렌더링
  main.innerHTML = `
    <main id="subContent">
      <!-- 헤더 -->
      <header id="subHeader">
        <div class="header-left">
          <img src="/TableLink.png" alt="TableLink" class="logo" />
          <span class="logo-text">TableLink</span>
        </div>
        <div class="header-right">
          <button id="weatherBtn" class="header-btn" title="날씨">🌤️</button>
          <button id="qrBtn" class="header-btn" onclick="TLL().catch(console.error)" title="QR주문">📱</button>
          <button id="notificationBtn" class="header-btn" onclick="renderNotification()" title="알림">🔔</button>
        </div>
      </header>

      <!-- 사용자 인사말 섹션 -->
      <section id="greetingSection">
        <div class="greeting-card">
          <div class="greeting-content">
            <h2 id="greetingText">안녕하세요! 오늘도 맛있는 하루 되세요 😊</h2>
            <p id="greetingSubtext">현재 시간: <span id="currentTime"></span></p>
          </div>
          <div class="greeting-weather">
            <div id="weatherWidget" class="weather-widget">
              <span class="weather-icon">🌤️</span>
              <span class="weather-temp">--°C</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 이벤트 배너 섹션 -->
      <section id="eventBannerSection">
        <div id="eventBannerContainer">
          <!-- 이벤트 배너가 여기에 렌더링됩니다 -->
        </div>
      </section>

      <!-- 퀵 액션 섹션 -->
      <section id="quickActionsSection">
        <h2 class="section-title">빠른 실행</h2>
        <div id="quickActionsContainer">
          <!-- 스켈레톤 렌더링 -->
        </div>
      </section>

      <!-- 단골 & 최근 섹션 -->
      <section id="favRecentSection">
        <h2 class="section-title">단골 & 최근 방문</h2>
        <div id="favRecentContainer">
          <!-- 스켈레톤 렌더링 -->
        </div>
      </section>

      <!-- 내 주변 추천 섹션 -->
      <section id="nearbySection">
        <h2 class="section-title">내 주변 추천</h2>
        <div id="nearbyContainer">
          <!-- 스켈레톤 렌더링 -->
        </div>
        <div id="nearbyLoadMore" style="display: none;">
          <button id="loadMoreBtn" class="load-more-btn">더보기</button>
        </div>
      </section>

      <!-- 혜택 섹션 -->
      <section id="promoSection">
        <h2 class="section-title">진행중인 혜택</h2>
        <div id="promoContainer">
          <!-- 스켈레톤 렌더링 -->
        </div>
      </section>

      <!-- 통계 섹션 -->
      <section id="statsSection">
        <h2 class="section-title">나의 이용 현황</h2>
        <div id="statsContainer">
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">📦</div>
              <div class="stat-value" id="totalOrdersCount">-</div>
              <div class="stat-label">총 주문</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">⭐</div>
              <div class="stat-value" id="totalReviewsCount">-</div>
              <div class="stat-label">작성 리뷰</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">💖</div>
              <div class="stat-value" id="favoritesCount">-</div>
              <div class="stat-label">즐겨찾기</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">💰</div>
              <div class="stat-value" id="totalPointsCount">-</div>
              <div class="stat-label">보유 포인트</div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <nav id="bottomBar">
      <button id="homeBtn" class="active" title="홈" onclick="renderSubMain()">
        <span style="font-size: 22px;">🏠</span>
      </button>
      <button id="tllBtn" title="QR주문" onclick="TLL().catch(console.error)">
        <span style="font-size: 22px;">📱</span>
      </button>
      <button id="renderMapBtn" title="지도" onclick="renderMap().catch(console.error)">
        <span style="font-size: 22px;">📍</span>
      </button>
      <button id="searchBtn" title="검색" onclick="renderSearch('')">
        <span style="font-size: 22px;">🔍</span>
      </button>
      <button onclick="renderMyPage()" title="마이페이지">
        <span style="font-size: 22px;">👤</span>
      </button>
    </nav>
  `;

  console.log('🏠 서브메인 화면 렌더링 시작');

  // 즉시 실행되는 초기화 함수들
  initializeGreeting();
  initializeEventBanner();
  initializeWeatherWidget();

  // 즉시 스켈레톤 렌더링
  renderQuickActionsSkeleton();
  renderFavSkeleton();
  renderNearbySkeleton();
  renderPromoSkeleton();

  // 병렬로 데이터 로드 및 에러 처리 개선
  try {
    const [favorites, recent, nearby, promotions, userStats] = await Promise.allSettled([
      apiFetchFavorites(),
      apiFetchRecentStores(),
      apiFetchNearby({ offset: 0, limit: 10 }),
      apiFetchPromotions(),
      apiFetchUserStats()
    ]);

    // 각 섹션 교체 (에러 처리 포함)
    replaceQuickActions();
    await replaceFavSection(
      favorites.status === 'fulfilled' ? favorites.value : [],
      recent.status === 'fulfilled' ? recent.value : []
    );
    await replaceNearbySection(
      nearby.status === 'fulfilled' ? nearby.value : { stores: [], hasMore: false }
    );
    replacePromoSection(
      promotions.status === 'fulfilled' ? promotions.value : []
    );
    updateUserStats(
      userStats.status === 'fulfilled' ? userStats.value : null
    );

    // 실패한 항목들 로깅
    [favorites, recent, nearby, promotions, userStats].forEach((result, index) => {
      if (result.status === 'rejected') {
        const sections = ['favorites', 'recent', 'nearby', 'promotions', 'userStats'];
        console.error(`❌ ${sections[index]} 로드 실패:`, result.reason);
      }
    });

  } catch (error) {
    console.error('❌ 서브메인 데이터 로드 중 오류:', error);
    showGlobalError('일부 데이터를 불러오는데 실패했습니다. 새로고침해주세요.');
  }

  console.log('✅ 서브메인 화면 렌더링 완료');
}

// 인사말 초기화
function initializeGreeting() {
  const currentTime = new Date();
  const timeString = currentTime.toLocaleTimeString('ko-KR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  const hour = currentTime.getHours();
  let greeting = '안녕하세요!';
  
  if (hour < 12) {
    greeting = '좋은 아침이에요!';
  } else if (hour < 18) {
    greeting = '점심 맛있게 드세요!';
  } else {
    greeting = '저녁 시간이네요!';
  }
  
  const greetingText = document.getElementById('greetingText');
  const currentTimeEl = document.getElementById('currentTime');
  
  if (greetingText) greetingText.textContent = greeting + ' 오늘도 맛있는 하루 되세요 😊';
  if (currentTimeEl) currentTimeEl.textContent = timeString;

  // 1분마다 시간 업데이트
  setInterval(() => {
    const now = new Date();
    const newTimeString = now.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    if (currentTimeEl) currentTimeEl.textContent = newTimeString;
  }, 60000);
}

// 이벤트 배너 초기화
function initializeEventBanner() {
  const bannerContainer = document.getElementById('eventBannerContainer');
  if (!bannerContainer) return;

  const banners = [
    {
      title: '🎉 신규 매장 오픈 이벤트',
      subtitle: '새로 오픈한 맛집들을 확인해보세요!',
      color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      action: () => renderSearch('신규')
    },
    {
      title: '💝 첫 주문 할인 쿠폰',
      subtitle: '첫 주문시 20% 할인 혜택!',
      color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      action: () => renderSearch('')
    },
    {
      title: '⭐ 리뷰 이벤트',
      subtitle: '리뷰 작성하고 포인트 받아가세요',
      color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      action: () => renderMyPage()
    }
  ];

  const randomBanner = banners[Math.floor(Math.random() * banners.length)];
  
  bannerContainer.innerHTML = `
    <div class="event-banner" style="background: ${randomBanner.color};" onclick="handleBannerClick()">
      <div class="banner-content">
        <h3 class="banner-title">${randomBanner.title}</h3>
        <p class="banner-subtitle">${randomBanner.subtitle}</p>
      </div>
      <div class="banner-arrow">→</div>
    </div>
  `;

  // 전역 함수로 이벤트 핸들러 등록
  window.handleBannerClick = randomBanner.action;
}

// 날씨 위젯 초기화
function initializeWeatherWidget() {
  const weatherWidget = document.getElementById('weatherWidget');
  if (!weatherWidget) return;

  // 실제 날씨 API 대신 가상 데이터 사용
  const weatherData = {
    temp: Math.floor(Math.random() * 20) + 10, // 10-30도
    icon: ['☀️', '⛅', '🌤️', '🌧️'][Math.floor(Math.random() * 4)]
  };

  weatherWidget.innerHTML = `
    <span class="weather-icon">${weatherData.icon}</span>
    <span class="weather-temp">${weatherData.temp}°C</span>
  `;

  // 날씨 버튼 클릭 이벤트
  const weatherBtn = document.getElementById('weatherBtn');
  if (weatherBtn) {
    weatherBtn.addEventListener('click', () => {
      alert(`현재 날씨: ${weatherData.temp}°C ${weatherData.icon}\n\n좋은 하루 보내세요!`);
    });
  }
}

// 사용자 통계 업데이트
function updateUserStats(statsData) {
  if (!statsData) {
    console.warn('⚠️ 사용자 통계 데이터가 없습니다');
    return;
  }

  const elements = {
    totalOrdersCount: document.getElementById('totalOrdersCount'),
    totalReviewsCount: document.getElementById('totalReviewsCount'),
    favoritesCount: document.getElementById('favoritesCount'),
    totalPointsCount: document.getElementById('totalPointsCount')
  };

  if (elements.totalOrdersCount) {
    elements.totalOrdersCount.textContent = (statsData.totalOrders || 0).toLocaleString();
  }
  if (elements.totalReviewsCount) {
    elements.totalReviewsCount.textContent = (statsData.totalReviews || 0).toLocaleString();
  }
  if (elements.favoritesCount) {
    elements.favoritesCount.textContent = (statsData.favorites || 0).toLocaleString();
  }
  if (elements.totalPointsCount) {
    elements.totalPointsCount.textContent = (statsData.totalPoints || 0).toLocaleString();
  }
}

// 전역 에러 표시
function showGlobalError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'global-error-banner';
  errorDiv.innerHTML = `
    <div class="error-content">
      <span class="error-icon">⚠️</span>
      <span class="error-text">${message}</span>
      <button class="error-dismiss" onclick="this.parentElement.parentElement.remove()">✕</button>
    </div>
  `;
  
  const subContent = document.getElementById('subContent');
  if (subContent) {
    subContent.insertBefore(errorDiv, subContent.firstChild.nextSibling);
  }
}

// 사용자 통계 API 호출
async function apiFetchUserStats() {
  try {
    if (!userInfo || !userInfo.id) {
      throw new Error('사용자 정보가 없습니다');
    }

    const [ordersRes, reviewsRes, favoritesRes, pointsRes] = await Promise.allSettled([
      fetch(`/api/orders/mypage/${userInfo.id}?limit=1000`),
      fetch(`/api/reviews/users/${userInfo.id}`),
      fetch(`/api/users/favorites/${userInfo.id}`),
      fetch(`/api/regular-levels/user/${userInfo.id}/all-points`)
    ]);

    const results = {};

    // 주문 수
    if (ordersRes.status === 'fulfilled' && ordersRes.value.ok) {
      const ordersData = await ordersRes.value.json();
      results.totalOrders = ordersData.orders?.length || 0;
    }

    // 리뷰 수
    if (reviewsRes.status === 'fulfilled' && reviewsRes.value.ok) {
      const reviewsData = await reviewsRes.value.json();
      results.totalReviews = reviewsData.total || 0;
    }

    // 즐겨찾기 수
    if (favoritesRes.status === 'fulfilled' && favoritesRes.value.ok) {
      const favoritesData = await favoritesRes.value.json();
      results.favorites = favoritesData.stores?.length || 0;
    }

    // 총 포인트
    if (pointsRes.status === 'fulfilled' && pointsRes.value.ok) {
      const pointsData = await pointsRes.value.json();
      if (pointsData.success && pointsData.storePoints) {
        results.totalPoints = pointsData.storePoints.reduce((sum, store) => sum + (store.points || 0), 0);
      }
    }

    return results;
  } catch (error) {
    console.error('❌ 사용자 통계 조회 실패:', error);
    throw error;
  }
}

// 퀵 액션 스켈레톤 렌더링
function renderQuickActionsSkeleton() {
  const container = document.getElementById('quickActionsContainer');
  if (!container) return;

  container.innerHTML = `
    <div class="quick-actions-grid">
      ${Array.from({ length: 4 }, () => `
        <div class="quick-action-card skeleton">
          <div class="quick-action-icon skeleton-shimmer"></div>
          <div class="quick-action-text skeleton-shimmer"></div>
        </div>
      `).join('')}
    </div>
  `;
}

// 퀵 액션 교체
function replaceQuickActions() {
  const container = document.getElementById('quickActionsContainer');
  if (!container) return;

  const quickActions = [
    {
      icon: '📱',
      text: 'QR 주문',
      action: () => TLL().catch(console.error),
      color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      icon: '🗺️',
      text: '매장 찾기',
      action: () => renderMap().catch(console.error),
      color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
      icon: '🔍',
      text: '검색',
      action: () => renderSearch(''),
      color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    },
    {
      icon: '👤',
      text: '마이페이지',
      action: () => renderMyPage(),
      color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
    }
  ];

  container.innerHTML = `
    <div class="quick-actions-grid">
      ${quickActions.map((action, index) => `
        <button class="quick-action-card enhanced" onclick="quickActionHandlers[${index}]()" style="background: ${action.color};">
          <div class="quick-action-icon">${action.icon}</div>
          <div class="quick-action-text">${action.text}</div>
        </button>
      `).join('')}
    </div>
  `;

  // 전역 핸들러 등록
  window.quickActionHandlers = quickActions.map(action => action.action);
}

// 즐겨찾기 스켈레톤 렌더링
function renderFavSkeleton() {
  const container = document.getElementById('favRecentContainer');
  if (!container) return;

  container.innerHTML = `
    <div class="horizontal-scroll">
      ${Array.from({ length: 3 }, () => `
        <div class="fav-card skeleton">
          <div class="fav-thumb skeleton-shimmer"></div>
          <div class="fav-info">
            <div class="fav-name skeleton-shimmer"></div>
            <div class="fav-rating skeleton-shimmer"></div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// 즐겨찾기 섹션 교체
async function replaceFavSection(favorites, recent) {
  const container = document.getElementById('favRecentContainer');
  if (!container) return;

  const allStores = [];
  
  // 즐겨찾기 매장 추가
  if (Array.isArray(favorites) && favorites.length > 0) {
    allStores.push(...favorites.map(store => ({ ...store, type: 'favorite' })));
  }
  
  // 최근 방문 매장 추가 (즐겨찾기와 중복 제거)
  if (Array.isArray(recent) && recent.length > 0) {
    const favoriteIds = new Set(favorites.map(f => f.id));
    const uniqueRecent = recent.filter(store => !favoriteIds.has(store.id));
    allStores.push(...uniqueRecent.slice(0, 3).map(store => ({ ...store, type: 'recent' })));
  }

  if (allStores.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🏪</div>
        <div class="empty-text">아직 방문한 매장이 없어요</div>
        <div class="empty-subtitle">새로운 맛집을 발견해보세요!</div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="horizontal-scroll">
      ${allStores.slice(0, 6).map(store => `
        <div class="fav-card enhanced" onclick="goToStore(${store.id})">
          <div class="fav-thumb">
            <img src="/api/placeholder/96/72" alt="${store.name}" onerror="this.style.display='none'">
            <div class="fav-badge">${store.type === 'favorite' ? '💖' : '🕒'}</div>
          </div>
          <div class="fav-info">
            <div class="fav-name">${store.name}</div>
            <div class="fav-rating">
              <span class="rating-star">★</span>
              <span class="rating-value">${store.ratingAverage || '0.0'}</span>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// 내 주변 스켈레톤 렌더링
function renderNearbySkeleton() {
  const container = document.getElementById('nearbyContainer');
  if (!container) return;

  container.innerHTML = `
    <div class="nearby-list">
      ${Array.from({ length: 5 }, () => `
        <div class="nearby-card skeleton">
          <div class="nearby-thumb skeleton-shimmer"></div>
          <div class="nearby-info">
            <div class="nearby-name skeleton-shimmer"></div>
            <div class="nearby-details skeleton-shimmer"></div>
            <div class="nearby-distance skeleton-shimmer"></div>
          </div>
          <div class="nearby-qr skeleton-shimmer"></div>
        </div>
      `).join('')}
    </div>
  `;
}

// 내 주변 섹션 교체
async function replaceNearbySection(nearbyData) {
  const container = document.getElementById('nearbyContainer');
  const loadMoreContainer = document.getElementById('nearbyLoadMore');
  
  if (!container) return;

  const stores = nearbyData?.stores || [];

  if (stores.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📍</div>
        <div class="empty-text">주변 매장을 찾을 수 없어요</div>
        <div class="empty-subtitle">위치 권한을 확인하거나 다른 지역을 검색해보세요</div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="nearby-list">
      ${stores.map(store => `
        <div class="nearby-card enhanced" onclick="goToStore(${store.id})">
          <div class="nearby-thumb">
            <img src="/api/placeholder/60/60" alt="${store.name}" onerror="this.style.display='none'">
          </div>
          <div class="nearby-info">
            <div class="nearby-name">${store.name}</div>
            <div class="nearby-details">
              <span class="rating">★ ${store.ratingAverage || '0.0'}</span>
              <span class="category">${store.category || '기타'}</span>
            </div>
            <div class="nearby-distance">${store.distance || '거리 정보 없음'}</div>
          </div>
          <button class="nearby-qr" onclick="event.stopPropagation(); selectStoreAndTLL(${store.id})" title="QR 주문">
            📱
          </button>
        </div>
      `).join('')}
    </div>
  `;

  // 더보기 버튼 처리
  if (loadMoreContainer) {
    if (nearbyData?.hasMore) {
      loadMoreContainer.style.display = 'block';
      const loadMoreBtn = document.getElementById('loadMoreBtn');
      if (loadMoreBtn) {
        loadMoreBtn.onclick = () => loadMoreNearbyStores();
      }
    } else {
      loadMoreContainer.style.display = 'none';
    }
  }
}

// 프로모션 스켈레톤 렌더링
function renderPromoSkeleton() {
  const container = document.getElementById('promoContainer');
  if (!container) return;

  container.innerHTML = `
    <div class="promo-banner skeleton">
      <div class="promo-content skeleton-shimmer"></div>
    </div>
  `;
}

// 프로모션 섹션 교체
function replacePromoSection(promotions) {
  const container = document.getElementById('promoContainer');
  if (!container) return;

  if (!Array.isArray(promotions) || promotions.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🎉</div>
        <div class="empty-text">진행중인 혜택이 없어요</div>
        <div class="empty-subtitle">새로운 혜택이 곧 업데이트될 예정입니다</div>
      </div>
    `;
    return;
  }

  const promo = promotions[0];
  container.innerHTML = `
    <div class="promo-banner enhanced" onclick="handlePromoClick(${promo.id})">
      <div class="promo-content">
        <div class="promo-title">${promo.title || '특별 혜택'}</div>
        <div class="promo-description">${promo.description || '자세한 내용을 확인해보세요!'}</div>
      </div>
      <div class="promo-image">
        <img src="/api/placeholder/300/120" alt="프로모션" onerror="this.style.display='none'">
      </div>
    </div>
  `;
}

// 유틸리티 함수들
async function loadMoreNearbyStores() {
  console.log('🔄 더 많은 주변 매장 로드');
  // TODO: 추가 매장 로드 로직 구현
}

function selectStoreAndTLL(storeId) {
  console.log(`🏪 매장 ${storeId} 선택 후 TLL 실행`);
  // TODO: 매장 선택 후 TLL 실행 로직 구현
  TLL().catch(console.error);
}

function handlePromoClick(promoId) {
  console.log(`🎉 프로모션 ${promoId} 클릭`);
  // TODO: 프로모션 상세 페이지로 이동
}

function goToStore(storeId) {
  if (typeof renderStore === 'function') {
    fetch(`/api/stores/${storeId}`)
      .then(response => response.json())
      .then(storeData => {
        if (storeData.success && storeData.store) {
          renderStore(storeData.store);
        }
      })
      .catch(error => {
        console.error('매장 정보 가져오기 실패:', error);
      });
  }
}

// API 함수들 (기존 유지하되 에러 처리 개선)
async function apiFetchFavorites() {
  try {
    if (!userInfo?.id) return [];
    
    const response = await fetch(`/api/users/favorites/${userInfo.id}`);
    if (!response.ok) throw new Error('즐겨찾기 조회 실패');
    
    const data = await response.json();
    return data.stores || [];
  } catch (error) {
    console.error('❌ 즐겨찾기 로드 실패:', error);
    return [];
  }
}

async function apiFetchRecentStores() {
  try {
    if (!userInfo?.id) return [];
    
    const response = await fetch(`/api/orders/mypage/${userInfo.id}?limit=5`);
    if (!response.ok) throw new Error('최근 방문 조회 실패');
    
    const data = await response.json();
    return data.orders?.map(order => ({
      id: order.store_id,
      name: order.store_name || '매장명 없음',
      category: '기타',
      ratingAverage: '0.0'
    })) || [];
  } catch (error) {
    console.error('❌ 최근 방문 로드 실패:', error);
    return [];
  }
}

async function apiFetchNearby(options = {}) {
  try {
    const { offset = 0, limit = 10 } = options;
    
    // 현재 위치 기반 또는 기본 위치 사용
    const params = new URLSearchParams({
      swLat: 37.5665,
      swLng: 126.9780,
      neLat: 37.5675,
      neLng: 126.9790,
      level: 5
    });
    
    const response = await fetch(`/api/stores/viewport?${params}`);
    if (!response.ok) throw new Error('주변 매장 조회 실패');
    
    const data = await response.json();
    return {
      stores: data.stores || [],
      hasMore: (data.stores?.length || 0) >= limit
    };
  } catch (error) {
    console.error('❌ 주변 매장 로드 실패:', error);
    return { stores: [], hasMore: false };
  }
}

async function apiFetchPromotions() {
  try {
    // 임시 프로모션 데이터 (실제 API 구현 시 교체)
    return [
      {
        id: 1,
        title: '🎉 신규 회원 특별 혜택',
        description: '첫 주문 시 20% 할인 + 무료 배송',
        image: '/api/placeholder/300/120'
      }
    ];
  } catch (error) {
    console.error('❌ 프로모션 로드 실패:', error);
    return [];
  }
}

// 전역 함수 등록
window.renderSubMain = renderSubMain;
