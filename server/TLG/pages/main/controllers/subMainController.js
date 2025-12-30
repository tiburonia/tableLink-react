
/**
 * SubMain Controller
 * 서브메인 사용자 인터랙션 처리
 */

import { subMainService } from '../services/subMainService.js';
import { subMainView } from '../views/subMainView.js';

export const subMainController = {
  currentUser: null,

  /**
   * 초기화
   */
  async initialize(userInfo) {
    try {
      console.log('🏠 서브메인 컨트롤러 초기화 시작');
      this.currentUser = userInfo;

      // 레이아웃 렌더링
      const main = document.getElementById('main');
      if (!main) {
        console.error('❌ main 요소를 찾을 수 없습니다');
        return;
      }

      main.innerHTML = subMainView.renderLayout();

      // 즉시 표시 가능한 UI 초기화
      this.initializeGreeting();
      this.initializeEventBanner();
      this.initializeWeatherWidget();
      this.renderQuickActions();

      // 데이터 병렬 로딩
      await this.loadAllData();

      console.log('✅ 서브메인 컨트롤러 초기화 완료');
    } catch (error) {
      console.error('❌ 서브메인 초기화 실패:', error);
      this.showError('페이지를 불러오는데 실패했습니다.');
    }
  },

  /**
   * 모든 데이터 로드
   */
  async loadAllData() {
    try {
      if (!this.currentUser || !this.currentUser.id) {
        console.warn('⚠️ 사용자 정보가 없습니다');
        return;
      }

      const [favAndRecent, nearby, promotions, stats] = await Promise.allSettled([
        subMainService.getFavoriteAndRecentStores(this.currentUser.id),
        subMainService.getNearbyStores({ offset: 0, limit: 10 }),
        subMainService.getPromotions(),
        subMainService.getUserStatistics(this.currentUser.id)
      ]);

      // 각 섹션 업데이트
      if (favAndRecent.status === 'fulfilled') {
        this.updateFavoriteSection(favAndRecent.value.combined);
      }

      if (nearby.status === 'fulfilled') {
        this.updateNearbySection(nearby.value.stores, nearby.value.hasMore);
      }

      if (promotions.status === 'fulfilled') {
        this.updatePromoSection(promotions.value);
      }

      if (stats.status === 'fulfilled') {
        this.updateStatsSection(stats.value);
      }

      // 실패한 항목 로깅
      [favAndRecent, nearby, promotions, stats].forEach((result, index) => {
        if (result.status === 'rejected') {
          const sections = ['favorites', 'nearby', 'promotions', 'stats'];
          console.error(`❌ ${sections[index]} 로드 실패:`, result.reason);
        }
      });

    } catch (error) {
      console.error('❌ 데이터 로드 중 오류:', error);
      this.showError('일부 데이터를 불러오는데 실패했습니다.');
    }
  },

  /**
   * 인사말 초기화
   */
  initializeGreeting() {
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
  },

  /**
   * 이벤트 배너 초기화
   */
  initializeEventBanner() {
    const bannerContainer = document.getElementById('eventBannerContainer');
    if (!bannerContainer) return;

    const banners = [
      {
        title: '🎉 신규 매장 오픈 이벤트',
        subtitle: '새로 오픈한 맛집들을 확인해보세요!',
        color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        action: () => window.renderSearch('신규')
      },
      {
        title: '💝 첫 주문 할인 쿠폰',
        subtitle: '첫 주문시 20% 할인 혜택!',
        color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        action: () => window.renderSearch('')
      },
      {
        title: '⭐ 리뷰 이벤트',
        subtitle: '리뷰 작성하고 포인트 받아가세요',
        color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        action: () => window.renderMyPage()
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

    window.handleBannerClick = randomBanner.action;
  },

  /**
   * 날씨 위젯 초기화
   */
  initializeWeatherWidget() {
    const weatherWidget = document.getElementById('weatherWidget');
    if (!weatherWidget) return;

    const weatherData = {
      temp: Math.floor(Math.random() * 20) + 10,
      icon: ['☀️', '⛅', '🌤️', '🌧️'][Math.floor(Math.random() * 4)]
    };

    weatherWidget.innerHTML = `
      <span class="weather-icon">${weatherData.icon}</span>
      <span class="weather-temp">${weatherData.temp}°C</span>
    `;

    const weatherBtn = document.getElementById('weatherBtn');
    if (weatherBtn) {
      weatherBtn.addEventListener('click', () => {
        alert(`현재 날씨: ${weatherData.temp}°C ${weatherData.icon}\n\n좋은 하루 보내세요!`);
      });
    }
  },

  /**
   * 퀵 액션 렌더링
   */
  renderQuickActions() {
    const container = document.getElementById('quickActionsContainer');
    if (container) {
      container.innerHTML = subMainView.renderQuickActionCards();
    }
  },

  /**
   * 즐겨찾기 섹션 업데이트
   */
  updateFavoriteSection(stores) {
    const container = document.getElementById('favRecentContainer');
    if (container) {
      container.innerHTML = subMainView.renderFavoriteCards(stores);
    }
  },

  /**
   * 주변 섹션 업데이트
   */
  updateNearbySection(stores, hasMore) {
    const container = document.getElementById('nearbyContainer');
    const loadMoreContainer = document.getElementById('nearbyLoadMore');
    
    if (container) {
      container.innerHTML = subMainView.renderNearbyCards(stores);
    }

    if (loadMoreContainer) {
      loadMoreContainer.style.display = hasMore ? 'block' : 'none';
      const loadMoreBtn = document.getElementById('loadMoreBtn');
      if (loadMoreBtn) {
        loadMoreBtn.onclick = () => this.loadMoreNearby();
      }
    }
  },

  /**
   * 프로모션 섹션 업데이트
   */
  updatePromoSection(promotions) {
    const container = document.getElementById('promoContainer');
    if (container) {
      container.innerHTML = subMainView.renderPromoBanner(promotions);
    }
  },

  /**
   * 통계 섹션 업데이트
   */
  updateStatsSection(stats) {
    const elements = {
      totalOrdersCount: document.getElementById('totalOrdersCount'),
      totalReviewsCount: document.getElementById('totalReviewsCount'),
      favoritesCount: document.getElementById('favoritesCount'),
      totalPointsCount: document.getElementById('totalPointsCount')
    };

    if (elements.totalOrdersCount) {
      elements.totalOrdersCount.textContent = (stats.totalOrders || 0).toLocaleString();
    }
    if (elements.totalReviewsCount) {
      elements.totalReviewsCount.textContent = (stats.totalReviews || 0).toLocaleString();
    }
    if (elements.favoritesCount) {
      elements.favoritesCount.textContent = (stats.favorites || 0).toLocaleString();
    }
    if (elements.totalPointsCount) {
      elements.totalPointsCount.textContent = (stats.totalPoints || 0).toLocaleString();
    }
  },

  /**
   * 더보기 로드
   */
  async loadMoreNearby() {
    console.log('🔄 더 많은 주변 매장 로드');
    // TODO: 페이지네이션 구현
  },

  /**
   * 에러 표시
   */
  showError(message) {
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
    if (subContent && subContent.firstChild) {
      subContent.insertBefore(errorDiv, subContent.firstChild.nextSibling);
    }
  }
};
