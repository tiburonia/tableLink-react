
// TableLink 서브메인 화면 렌더링
async function renderSubMain() {
  const main = document.getElementById('main');

  // 스켈레톤 UI 먼저 렌더링
  main.innerHTML = `
    <main id="subContent">
      <!-- 헤더 -->
      <header id="subHeader">
        <div class="header-left">
          <img src="TableLink.png" alt="TableLink" class="logo" />
          <span class="logo-text">TableLink</span>
        </div>
        <div class="header-right">
          <button id="qrBtn" class="header-btn" onclick="TLL().catch(console.error)">📱</button>
          <button id="notificationBtn" class="header-btn" onclick="renderNotification()">🔔</button>
        </div>
      </header>

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
    </main>

    <nav id="bottomBar">
      <button id="homeBtn" class="active" title="홈" onclick="renderSubMain()">
        <span style="font-size: 22px;">🏠</span>
      </button>
      <button id="tllBtn" title="QR주문" onclick="TLL().catch(console.error)">
        <span style="font-size: 22px;">📱</span>
      </button>
      <button id="searchBtn" title="검색" onclick="renderSearch('')">
        <span style="font-size: 22px;">🔍</span>
      </button>
      <button id="renderMapBtn" title="지도" onclick="renderMap().catch(console.error)">
        <span style="font-size: 22px;">📍</span>
      </button>
      <button onclick="renderMyPage()" title="마이페이지">
        <span style="font-size: 22px;">👤</span>
      </button>
    </nav>
  `;

  console.log('🏠 서브메인 화면 렌더링 시작');

  // 즉시 스켈레톤 렌더링
  renderQuickActionsSkeleton();
  renderFavSkeleton();
  renderNearbySkeleton();
  renderPromoSkeleton();

  // 병렬로 데이터 로드
  try {
    const [favorites, recent, nearby, promotions] = await Promise.all([
      apiFetchFavorites(),
      apiFetchRecentStores(),
      apiFetchNearby({ offset: 0, limit: 10 }),
      apiFetchPromotions()
    ]);

    // 각 섹션 교체
    replaceQuickActions();
    replaceFavSection(favorites, recent);
    replaceNearbySection(nearby);
    replacePromoSection(promotions);

    // 무한 스크롤 초기화
    initNearbyInfiniteScroll();

    console.log('✅ 서브메인 데이터 로딩 완료');
  } catch (error) {
    console.error('❌ 서브메인 데이터 로딩 실패:', error);
    showInlineError('#subContent', '데이터를 불러오는 중 오류가 발생했습니다.');
  }
}

// 스켈레톤 렌더링 함수들
function renderQuickActionsSkeleton() {
  const container = document.getElementById('quickActionsContainer');
  container.innerHTML = `
    <div class="quick-actions-grid">
      ${Array(4).fill(0).map(() => `
        <div class="quick-action-card skeleton">
          <div class="quick-action-icon skeleton-shimmer"></div>
          <div class="quick-action-text skeleton-shimmer"></div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderFavSkeleton() {
  const container = document.getElementById('favRecentContainer');
  container.innerHTML = `
    <div class="horizontal-scroll">
      ${Array(3).fill(0).map(() => `
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

function renderNearbySkeleton() {
  const container = document.getElementById('nearbyContainer');
  container.innerHTML = `
    <div class="nearby-list">
      ${Array(5).fill(0).map(() => `
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

function renderPromoSkeleton() {
  const container = document.getElementById('promoContainer');
  container.innerHTML = `
    <div class="promo-banner skeleton">
      <div class="promo-content skeleton-shimmer"></div>
    </div>
  `;
}

// 실제 데이터로 교체하는 함수들
function replaceQuickActions() {
  const container = document.getElementById('quickActionsContainer');
  container.innerHTML = `
    <div class="quick-actions-grid">
      <button class="quick-action-card" onclick="TLL().catch(console.error)">
        <div class="quick-action-icon">📱</div>
        <div class="quick-action-text">QR주문</div>
      </button>
      <button class="quick-action-card" onclick="renderReservation()">
        <div class="quick-action-icon">📅</div>
        <div class="quick-action-text">예약</div>
      </button>
      <button class="quick-action-card" onclick="renderTakeoutHub()">
        <div class="quick-action-icon">🥡</div>
        <div class="quick-action-text">포장</div>
      </button>
      <button class="quick-action-card" onclick="renderBenefits()">
        <div class="quick-action-icon">🎁</div>
        <div class="quick-action-text">쿠폰/포인트</div>
      </button>
    </div>
  `;
}

function replaceFavSection(favorites, recent) {
  const container = document.getElementById('favRecentContainer');
  
  // 단골과 최근 방문 데이터 합치기 (중복 제거)
  const combined = [];
  const seenIds = new Set();
  
  favorites.forEach(store => {
    if (!seenIds.has(store.id)) {
      combined.push({ ...store, type: 'favorite' });
      seenIds.add(store.id);
    }
  });
  
  recent.forEach(store => {
    if (!seenIds.has(store.id)) {
      combined.push({ ...store, type: 'recent' });
      seenIds.add(store.id);
    }
  });

  if (combined.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🏪</div>
        <div class="empty-text">아직 기록이 없어요</div>
        <div class="empty-subtitle">매장을 방문해보세요!</div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="horizontal-scroll">
      ${combined.map(store => `
        <div class="fav-card" onclick="renderStoreById(${store.id})">
          <div class="fav-thumb">
            <img src="${store.thumb || 'TableLink.png'}" alt="${store.name}" />
            <div class="fav-badge ${store.type}">${store.type === 'favorite' ? '💖' : '🕒'}</div>
          </div>
          <div class="fav-info">
            <div class="fav-name">${store.name}</div>
            <div class="fav-rating">
              <span class="rating-star">★</span>
              <span class="rating-value">${store.rating || '0.0'}</span>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function replaceNearbySection(stores) {
  const container = document.getElementById('nearbyContainer');
  
  if (stores.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📍</div>
        <div class="empty-text">주변에 추천 매장이 없어요</div>
        <div class="empty-subtitle">다른 지역을 확인해보세요</div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="nearby-list">
      ${stores.map(store => `
        <div class="nearby-card" onclick="renderStoreById(${store.id})">
          <div class="nearby-thumb">
            <img src="${store.thumb || 'TableLink.png'}" alt="${store.name}" />
          </div>
          <div class="nearby-info">
            <div class="nearby-name">${store.name}</div>
            <div class="nearby-details">
              <span class="rating">★ ${store.rating || '0.0'}</span>
              <span class="category">${store.category || '기타'}</span>
            </div>
            <div class="nearby-distance">${store.distanceText || '위치 정보 없음'}</div>
          </div>
          <button class="nearby-qr" onclick="event.stopPropagation(); TLLForStore(${store.id})">
            📱
          </button>
        </div>
      `).join('')}
    </div>
  `;

  // 더보기 버튼 표시
  if (stores.length >= 10) {
    document.getElementById('nearbyLoadMore').style.display = 'block';
  }
}

function replacePromoSection(promotions) {
  const container = document.getElementById('promoContainer');
  
  if (promotions.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🎉</div>
        <div class="empty-text">진행 중인 혜택이 없어요</div>
        <div class="empty-subtitle">곧 새로운 혜택을 준비할게요!</div>
      </div>
    `;
    return;
  }

  const promo = promotions[0]; // 첫 번째 프로모션만 표시
  container.innerHTML = `
    <div class="promo-banner" onclick="window.open('${promo.deeplink || '#'}', '_blank')">
      <div class="promo-content">
        <div class="promo-title">${promo.title}</div>
        <div class="promo-image">
          <img src="${promo.banner || 'TableLink.png'}" alt="${promo.title}" />
        </div>
      </div>
    </div>
  `;
}

// 무한 스크롤 관련 함수들
let nearbyOffset = 10;
let isLoadingMore = false;
let hasMoreNearby = true;

function initNearbyInfiniteScroll() {
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', loadMoreNearby);
  }
}

async function loadMoreNearby() {
  if (isLoadingMore || !hasMoreNearby) return;
  
  isLoadingMore = true;
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  loadMoreBtn.textContent = '로딩중...';
  loadMoreBtn.disabled = true;

  try {
    const moreStores = await apiFetchNearby({ offset: nearbyOffset, limit: 10 });
    
    if (moreStores.length === 0) {
      hasMoreNearby = false;
      document.getElementById('nearbyLoadMore').style.display = 'none';
      return;
    }

    // 기존 리스트에 추가
    const nearbyList = document.querySelector('.nearby-list');
    const newItems = moreStores.map(store => `
      <div class="nearby-card" onclick="renderStoreById(${store.id})">
        <div class="nearby-thumb">
          <img src="${store.thumb || 'TableLink.png'}" alt="${store.name}" />
        </div>
        <div class="nearby-info">
          <div class="nearby-name">${store.name}</div>
          <div class="nearby-details">
            <span class="rating">★ ${store.rating || '0.0'}</span>
            <span class="category">${store.category || '기타'}</span>
          </div>
          <div class="nearby-distance">${store.distanceText || '위치 정보 없음'}</div>
        </div>
        <button class="nearby-qr" onclick="event.stopPropagation(); TLLForStore(${store.id})">
          📱
        </button>
      </div>
    `).join('');

    nearbyList.insertAdjacentHTML('beforeend', newItems);
    nearbyOffset += moreStores.length;

    if (moreStores.length < 10) {
      hasMoreNearby = false;
      document.getElementById('nearbyLoadMore').style.display = 'none';
    }

  } catch (error) {
    console.error('❌ 추가 매장 로딩 실패:', error);
    showInlineError('#nearbyContainer', '추가 매장을 불러오는 중 오류가 발생했습니다.');
  } finally {
    isLoadingMore = false;
    loadMoreBtn.textContent = '더보기';
    loadMoreBtn.disabled = false;
  }
}

// API 함수들 (임시 스텁)
async function apiFetchFavorites() {
  // 실제 API로 교체될 부분
  return window.DEMO_FAV || [
    { id: 1, name: '치킨천국', rating: 4.5, thumb: 'TableLink.png' },
    { id: 2, name: '분식왕국', rating: 4.2, thumb: 'TableLink.png' },
    { id: 3, name: '한솥도시락', rating: 4.0, thumb: 'TableLink.png' }
  ];
}

async function apiFetchRecentStores() {
  return window.DEMO_RECENT || [
    { id: 4549, name: '시청역 아웃백', rating: 4.3, thumb: 'TableLink.png' },
    { id: 5, name: '맘스터치', rating: 4.1, thumb: 'TableLink.png' }
  ];
}

async function apiFetchNearby({ offset = 0, limit = 10 }) {
  const src = window.DEMO_NEARBY || [
    { id: 10, name: '시청앞 카페베네', rating: 4.0, category: '카페', distanceText: '50m', thumb: 'TableLink.png' },
    { id: 11, name: '광화문 스타벅스', rating: 4.4, category: '카페', distanceText: '100m', thumb: 'TableLink.png' },
    { id: 12, name: '롯데리아 시청점', rating: 3.8, category: '패스트푸드', distanceText: '150m', thumb: 'TableLink.png' },
    { id: 13, name: '교보빌딩 던킨', rating: 4.1, category: '카페', distanceText: '200m', thumb: 'TableLink.png' },
    { id: 14, name: '시청역 파리바게뜨', rating: 4.2, category: '베이커리', distanceText: '250m', thumb: 'TableLink.png' }
  ];
  return src.slice(offset, offset + limit);
}

async function apiFetchPromotions() {
  return window.DEMO_PROMOS || [
    { 
      title: '신규 가입 혜택! 첫 주문 20% 할인', 
      banner: 'TableLink.png',
      deeplink: '#'
    }
  ];
}

// 헬퍼 함수들
function showInlineError(containerSelector, message) {
  const container = document.querySelector(containerSelector);
  if (container) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'inline-error';
    errorDiv.innerHTML = `
      <div class="error-icon">⚠️</div>
      <div class="error-message">${message}</div>
    `;
    container.appendChild(errorDiv);
  }
}

// 스텁 함수들 (존재하지 않을 경우 대비)
function renderReservation() {
  console.log('🏪 예약 화면으로 이동 (스텁)');
  alert('예약 기능은 준비 중입니다.');
}

function renderTakeoutHub() {
  console.log('🥡 포장 화면으로 이동 (스텁)');
  alert('포장 기능은 준비 중입니다.');
}

function renderBenefits() {
  console.log('🎁 혜택 화면으로 이동 (스텁)');
  alert('혜택 화면은 준비 중입니다.');
}

async function renderStoreById(storeId) {
  console.log('🏪 매장 상세 화면으로 이동:', storeId);
  
  try {
    // 실제 매장 데이터 조회
    const response = await fetch(`/api/stores/${storeId}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.success && data.store) {
      console.log('✅ 매장 데이터 로드 완료:', data.store.name);
      
      // renderStore 함수 호출
      if (typeof renderStore === 'function') {
        renderStore(data.store);
      } else if (typeof window.renderStore === 'function') {
        window.renderStore(data.store);
      } else {
        console.error('❌ renderStore 함수를 찾을 수 없습니다');
        alert('매장 상세 화면을 불러올 수 없습니다.');
      }
    } else {
      throw new Error(data.error || '매장 정보를 불러올 수 없습니다');
    }
  } catch (error) {
    console.error('❌ 매장 데이터 로드 실패:', error);
    alert(`매장 ${storeId} 정보를 불러오는 중 오류가 발생했습니다: ${error.message}`);
  }
}

async function TLLForStore(storeId) {
  console.log('📱 매장별 QR 주문:', storeId);
  
  try {
    // 실제 매장 데이터 조회
    const response = await fetch(`/api/stores/${storeId}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.success && data.store) {
      console.log('✅ QR 주문용 매장 데이터 로드:', data.store.name);
      
      // TLL 함수 호출
      if (typeof TLL === 'function') {
        TLL(data.store);
      } else if (typeof window.TLL === 'function') {
        window.TLL(data.store);
      } else {
        console.error('❌ TLL 함수를 찾을 수 없습니다');
        alert('QR 주문 기능을 사용할 수 없습니다.');
      }
    } else {
      throw new Error(data.error || '매장 정보를 불러올 수 없습니다');
    }
  } catch (error) {
    console.error('❌ QR 주문용 매장 데이터 로드 실패:', error);
    alert(`매장 ${storeId} QR 주문 중 오류가 발생했습니다: ${error.message}`);
  }
}

// 전역 함수로 등록
window.renderSubMain = renderSubMain;
