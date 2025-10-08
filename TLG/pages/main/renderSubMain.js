/**
 * SubMain 렌더링 함수
 * 레이어드 아키텍처 기반으로 리팩토링
 */

import { subMainController } from './controllers/subMainController.js';

// TableLink 서브메인 화면 렌더링
async function renderSubMain() {
  try {
    console.log('🏠 서브메인 화면 렌더링 시작');

    // 사용자 정보 확인
    if (!window.userInfo || !window.userInfo.id) {
      console.error('❌ 사용자 정보가 없습니다');
      // 전역 에러 메시지 표시
      showGlobalError('사용자 정보를 불러올 수 없습니다. 다시 로그인해주세요.');
      return;
    }

    // 컨트롤러 초기화
    await subMainController.initialize(window.userInfo);

    console.log('✅ 서브메인 화면 렌더링 완료');
  } catch (error) {
    console.error('❌ 서브메인 렌더링 실패:', error);
    // 에러 발생 시 전역 에러 메시지 표시
    showGlobalError('서브메인 화면을 불러오는데 실패했습니다. 다시 시도해주세요.');
  }
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
    // subContent의 첫 번째 자식(subHeader) 다음에 삽입
    const firstChild = subContent.firstChild;
    if (firstChild) {
      subContent.insertBefore(errorDiv, firstChild.nextSibling);
    } else {
      subContent.appendChild(errorDiv);
    }
  }
}

// 사용자 통계 API 호출
async function apiFetchUserStats() {
  try {
    // userInfo가 전역 변수로 존재한다고 가정
    if (!window.userInfo || !window.userInfo.id) {
      throw new Error('사용자 정보가 없습니다');
    }

    const [ordersRes, reviewsRes, favoritesRes, pointsRes] = await Promise.allSettled([
      fetch(`/api/orders/users/${window.userInfo.id}?limit=1000`),
      fetch(`/api/reviews/users/${window.userInfo.id}`),
      fetch(`/api/auth/users/favorites/${window.userInfo.id}`),
      fetch(`/api/regular-levels/user/${window.userInfo.id}/all-points`)
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
    // 최근 방문은 최대 3개만 보여줌
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
    // 더보기 버튼 숨김
    if (loadMoreContainer) loadMoreContainer.style.display = 'none';
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

  // 첫 번째 프로모션만 표시
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
  // 현재는 스켈레톤만 렌더링하고 실제 로직은 비어있음
  const container = document.getElementById('nearbyContainer');
  if (!container) return;

  const existingHtml = container.innerHTML;
  container.innerHTML = `
    <div class="nearby-list">
      ${existingHtml}
      ${Array.from({ length: 3 }, () => `
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
  // 실제 API 호출 및 데이터 렌더링 로직이 필요
}

function goToStore(storeId) {
  if (typeof renderStore === 'function') {
    fetch(`/api/stores/${storeId}`)
      .then(response => response.json())
      .then(storeData => {
        if (storeData.success && storeData.store) {
          renderStore(storeData.store);
        } else {
          console.error('매장 정보를 가져오지 못했습니다:', storeData.message);
          showGlobalError('매장 정보를 불러오는 데 실패했습니다.');
        }
      })
      .catch(error => {
        console.error('매장 정보 가져오기 API 호출 중 오류:', error);
        showGlobalError('매장 정보를 불러오는 데 실패했습니다.');
      });
  } else {
    console.warn('renderStore 함수가 정의되지 않았습니다.');
  }
}

function selectStoreAndTLL(storeId) {
  console.log(`🏪 매장 ${storeId} 선택 후 TLL 실행`);
  // TODO: 실제 TLL 실행 로직 구현
  TLL().catch(console.error);
}

function handlePromoClick(promoId) {
  console.log(`🎉 프로모션 ${promoId} 클릭`);
  // TODO: 프로모션 상세 페이지로 이동 로직 구현
  // 예: fetch(`/api/promotions/${promoId}`).then(res => res.json()).then(data => { ... });
}

// API 함수들 (기존 유지하되 에러 처리 개선)
async function apiFetchFavorites() {
  try {
    if (!window.userInfo?.id) return [];

    const response = await fetch(`/api/auth/users/favorites/${window.userInfo.id}`);
    if (!response.ok) {
      throw new Error(`즐겨찾기 조회 실패: ${response.status}`);
    }

    const data = await response.json();
    return data.stores || [];
  } catch (error) {
    console.error('❌ 즐겨찾기 로드 실패:', error);
    // 에러 발생 시 빈 배열 반환하여 UI가 깨지지 않도록 함
    return [];
  }
}

async function apiFetchRecentStores() {
  try {
    if (!window.userInfo?.id) return [];

    // 최근 방문은 주문 API를 재활용, limit=5로 최근 5개 주문 조회
    const response = await fetch(`/api/orders/users/${window.userInfo.id}?limit=5`);
    if (!response.ok) {
      throw new Error(`최근 방문 조회 실패: ${response.status}`);
    }

    const data = await response.json();
    // 주문 데이터에서 필요한 정보 추출하여 반환
    return data.orders?.map(order => ({
      id: order.store_id,
      name: order.store_name || '매장명 없음',
      category: order.category || '기타', // 카테고리 정보가 있다면 사용
      ratingAverage: order.ratingAverage || '0.0' // 평균 별점 정보가 있다면 사용
    })) || [];
  } catch (error) {
    console.error('❌ 최근 방문 로드 실패:', error);
    return [];
  }
}

async function apiFetchNearby(options = {}) {
  try {
    const { offset = 0, limit = 10 } = options;

    // TODO: 실제 사용자 위치 정보를 가져와서 params에 적용해야 함
    // 현재는 임의의 서울 중심 좌표 사용
    const params = new URLSearchParams({
      swLat: 37.5665, // 남서쪽 위도
      swLng: 126.9780, // 남서쪽 경도
      neLat: 37.5675, // 북동쪽 위도
      neLng: 126.9790, // 북동쪽 경도
      level: 5 // 지도 레벨 (확대/축소 수준)
      // offset: offset, // 페이지네이션을 위한 오프셋
      // limit: limit // 페이지네이션을 위한 제한
    });

    const response = await fetch(`/api/stores/viewport?${params}`);
    if (!response.ok) {
      throw new Error(`주변 매장 조회 실패: ${response.status}`);
    }

    const data = await response.json();
    // API 응답 구조에 따라 stores 배열과 hasMore 플래그 조정 필요
    return {
      stores: data.stores || [],
      // hasMore 플래그는 API에서 제공하는 정보나, 현재 불러온 데이터 수와 limit를 비교하여 결정
      hasMore: (data.stores?.length || 0) >= limit
    };
  } catch (error) {
    console.error('❌ 주변 매장 로드 실패:', error);
    return { stores: [], hasMore: false };
  }
}

async function apiFetchPromotions() {
  try {
    // 실제 프로모션 API 엔드포인트 호출 필요
    // const response = await fetch('/api/promotions');
    // if (!response.ok) throw new Error('프로모션 조회 실패');
    // const data = await response.json();
    // return data.promotions || [];

    // 임시 프로모션 데이터 (실제 API 구현 시 교체)
    return [
      {
        id: 1,
        title: '🎉 신규 회원 특별 혜택',
        description: '첫 주문 시 20% 할인 + 무료 배송',
        image: '/api/placeholder/300/120' // Placeholder 이미지 URL
      },
      {
        id: 2,
        title: '🔥 인기 매장 특별 할인',
        description: '지금 가장 인기있는 매장들을 만나보세요!',
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
window.initializeGreeting = initializeGreeting;
window.initializeEventBanner = initializeEventBanner;
window.initializeWeatherWidget = initializeWeatherWidget;
window.updateUserStats = updateUserStats;
window.showGlobalError = showGlobalError;
window.apiFetchUserStats = apiFetchUserStats;
window.renderQuickActionsSkeleton = renderQuickActionsSkeleton;
window.replaceQuickActions = replaceQuickActions;
window.renderFavSkeleton = renderFavSkeleton;
window.replaceFavSection = replaceFavSection;
window.renderNearbySkeleton = renderNearbySkeleton;
window.replaceNearbySection = replaceNearbySection;
window.renderPromoSkeleton = renderPromoSkeleton;
window.replacePromoSection = replacePromoSection;
window.loadMoreNearbyStores = loadMoreNearbyStores;
window.goToStore = goToStore;
window.selectStoreAndTLL = selectStoreAndTLL;
window.handlePromoClick = handlePromoClick;
window.apiFetchFavorites = apiFetchFavorites;
window.apiFetchRecentStores = apiFetchRecentStores;
window.apiFetchNearby = apiFetchNearby;
window.apiFetchPromotions = apiFetchPromotions;