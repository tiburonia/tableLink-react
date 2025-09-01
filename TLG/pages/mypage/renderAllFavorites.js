// 즐겨찾기 매장 전체보기 렌더링 함수
async function renderAllFavorites(userInfo) {
  try {
    console.log('💖 즐겨찾기 매장 전체보기 화면 렌더링');

    const main = document.getElementById('main');

    // 스켈레톤 UI 먼저 표시
    main.innerHTML = `
      <div class="favorites-container">
        <div class="favorites-header">
          <button id="backBtn" class="header-back-btn" onclick="renderMyPage()">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M19 12H5m7-7l-7 7 7 7"/>
            </svg>
          </button>
          <div class="header-info">
            <h1>💖 즐겨찾기 매장</h1>
            <p class="header-subtitle">자주 가는 매장들을 확인하세요</p>
          </div>
        </div>

        <div class="favorites-content">
          <div class="favorites-stats-card">
            <div class="stat-item">
              <div class="stat-number skeleton-text">-</div>
              <div class="stat-label">총 매장</div>
            </div>
            <div class="stat-item">
              <div class="stat-number skeleton-text">-</div>
              <div class="stat-label">이번 달 방문</div>
            </div>
            <div class="stat-item">
              <div class="stat-number skeleton-text">-</div>
              <div class="stat-label">평균 별점</div>
            </div>
          </div>

          <div class="favorites-section">
            <div class="section-header">
              <h2>즐겨찾기 목록</h2>
              <div class="favorites-count skeleton-badge">로딩중...</div>
            </div>

            <div id="favoritesList" class="favorites-list">
              ${generateFavoritesSkeletonCards(5)}
            </div>
          </div>
        </div>
      </div>

      ${getFavoritesStyles()}
    `;

    // 실제 데이터 로드
    await loadFavoritesData(userInfo);

  } catch (error) {
    console.error('❌ 즐겨찾기 매장 전체보기 로드 실패:', error);
    showFavoritesErrorState();
  }
}

// 즐겨찾기 스켈레톤 카드 생성
function generateFavoritesSkeletonCards(count) {
  return Array.from({ length: count }, (_, i) => `
    <div class="favorite-card skeleton-card">
      <div class="favorite-card-header">
        <div class="skeleton-store-name"></div>
        <div class="skeleton-category"></div>
      </div>
      <div class="favorite-card-body">
        <div class="skeleton-address"></div>
        <div class="favorite-card-footer">
          <div class="skeleton-rating"></div>
          <div class="skeleton-button"></div>
        </div>
      </div>
    </div>
  `).join('');
}

// 실제 즐겨찾기 데이터 로드
async function loadFavoritesData(userInfo) {
  try {
    const userId = userInfo.id;
    const response = await fetch(`/api/auth/users/favorites/${userId}`);
    if (!response.ok) throw new Error('즐겨찾기 매장 조회 실패');

    const data = await response.json();
    const favoritesData = data.stores || [];

    // 통계 데이터 계산
    const totalStores = favoritesData.length;
    const thisMonthVisits = 0; // 실제로는 방문 기록에서 계산해야 함
    const averageRating = favoritesData.length > 0 ? 
      (favoritesData.reduce((sum, store) => sum + (store.ratingAverage || 0), 0) / favoritesData.length).toFixed(1) : 0;

    // 통계 업데이트
    updateFavoritesStats(totalStores, thisMonthVisits, averageRating);

    // 즐겨찾기 목록 업데이트
    updateFavoritesList(favoritesData);

  } catch (error) {
    console.error('❌ 즐겨찾기 데이터 로드 실패:', error);
    showFavoritesErrorState();
  }
}

// 통계 업데이트
function updateFavoritesStats(totalStores, thisMonthVisits, averageRating) {
  const statNumbers = document.querySelectorAll('.stat-number');
  if (statNumbers[0]) statNumbers[0].textContent = totalStores + '개';
  if (statNumbers[1]) statNumbers[1].textContent = thisMonthVisits + '회';
  if (statNumbers[2]) statNumbers[2].textContent = averageRating + '점';

  // 스켈레톤 클래스 제거
  statNumbers.forEach(el => el.classList.remove('skeleton-text'));
}

// 즐겨찾기 목록 업데이트
function updateFavoritesList(favoritesData) {
  const favoritesList = document.getElementById('favoritesList');
  const favoritesCount = document.querySelector('.favorites-count');

  if (favoritesCount) {
    favoritesCount.textContent = `${favoritesData.length}개`;
    favoritesCount.classList.remove('skeleton-badge');
  }

  if (favoritesData.length === 0) {
    favoritesList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">💖</div>
        <h3>아직 즐겨찾기한 매장이 없어요</h3>
        <p>마음에 드는 매장을 즐겨찾기에 추가해보세요!</p>
        <button class="primary-btn" onclick="renderMap()">
          <span class="btn-icon">🗺️</span>
          매장 찾기
        </button>
      </div>
    `;
    return;
  }

  const favoritesHTML = favoritesData.map((store, index) => {
    return `
      <div class="favorite-card" onclick="goToStore(${store.id})">
        <div class="favorite-card-header">
          <div class="store-info">
            <h3 class="store-name">${store.name}</h3>
            <div class="store-meta">
              <span class="store-category">${store.category || '기타'}</span>
            </div>
          </div>
          <div class="favorite-badge">
            <span class="heart-icon">💖</span>
          </div>
        </div>

        <div class="favorite-card-body">
          <div class="store-details">
            <p class="store-address">${store.address || '주소 정보 없음'}</p>
            <div class="store-rating">
              <span class="rating-stars">${'★'.repeat(Math.floor(store.ratingAverage || 0))}</span>
              <span class="rating-number">${(store.ratingAverage || 0).toFixed(1)}점</span>
              <span class="review-count">(${store.reviewCount || 0}개)</span>
            </div>
          </div>

          <div class="favorite-card-footer">
            <div class="store-status ${store.isOpen ? 'open' : 'closed'}">
              ${store.isOpen ? '영업중' : '영업종료'}
            </div>
            <button class="visit-btn" onclick="event.stopPropagation(); visitStore(${store.id})">
              <span class="btn-icon">🚶</span>
              방문하기
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  favoritesList.innerHTML = favoritesHTML;
}

// 에러 상태 표시
function showFavoritesErrorState() {
  const main = document.getElementById('main');
  if (main) {
    main.innerHTML = `
      <div class="favorites-container">
        <div class="favorites-header">
          <button id="backBtn" class="header-back-btn" onclick="renderMyPage()">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M19 12H5m7-7l-7 7 7 7"/>
            </svg>
          </button>
          <div class="header-info">
            <h1>💖 즐겨찾기 매장</h1>
          </div>
        </div>

        <div class="favorites-content">
          <div class="error-state">
            <div class="error-icon">⚠️</div>
            <h3>즐겨찾기 매장을 불러올 수 없어요</h3>
            <p>잠시 후 다시 시도해주세요</p>
            <button class="primary-btn" onclick="renderAllFavorites(userInfo)">
              <span class="btn-icon">🔄</span>
              다시 시도
            </button>
          </div>
        </div>
      </div>

      ${getFavoritesStyles()}
    `;
  }
}

// 매장 방문하기
function visitStore(storeId) {
  console.log('🚶 매장 방문:', storeId);
  goToStore(storeId);
}

// 매장으로 이동
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

// 스타일 정의
function getFavoritesStyles() {
  return `
    <style>
      .favorites-container {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        width: 100%;
        max-width: 430px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        overflow: hidden;
      }

      .favorites-header {
        height: 80px;
        background: white;
        padding: 20px 16px;
        display: flex;
        align-items: center;
        gap: 16px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
        flex-shrink: 0;
        z-index: 100;
      }

      .header-back-btn {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        border: none;
        background: #f1f5f9;
        color: #475569;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .header-back-btn:hover {
        background: #e2e8f0;
        color: #334155;
      }

      .header-info {
        flex: 1;
      }

      .header-info h1 {
        margin: 0 0 4px 0;
        font-size: 22px;
        font-weight: 700;
        color: #1e293b;
        line-height: 1.2;
      }

      .header-subtitle {
        margin: 0;
        font-size: 13px;
        color: #64748b;
        font-weight: 500;
      }

      .favorites-content {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .favorites-stats-card {
        background: white;
        border-radius: 16px;
        padding: 20px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
        border: 1px solid rgba(226, 232, 240, 0.8);
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
      }

      .stat-item {
        text-align: center;
      }

      .stat-number {
        font-size: 20px;
        font-weight: 800;
        color: #1e293b;
        margin-bottom: 4px;
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .stat-label {
        font-size: 12px;
        color: #64748b;
        font-weight: 600;
      }

      .favorites-section {
        background: white;
        border-radius: 16px;
        padding: 20px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
        border: 1px solid rgba(226, 232, 240, 0.8);
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 12px;
        border-bottom: 2px solid #f1f5f9;
      }

      .section-header h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
        color: #1e293b;
      }

      .favorites-count {
        background: #f1f5f9;
        color: #475569;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
      }

      .favorites-list {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 16px;
        overflow-y: auto;
      }

      .favorite-card {
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        border-radius: 12px;
        padding: 16px;
        border: 1px solid #e2e8f0;
        transition: all 0.2s ease;
        cursor: pointer;
      }

      .favorite-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
        border-color: #cbd5e1;
      }

      .favorite-card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 12px;
      }

      .store-info {
        flex: 1;
      }

      .store-name {
        margin: 0 0 4px 0;
        font-size: 16px;
        font-weight: 700;
        color: #1e293b;
        line-height: 1.3;
      }

      .store-meta {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .store-category {
        background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
        color: white;
        padding: 2px 6px;
        border-radius: 6px;
        font-size: 10px;
        font-weight: 600;
      }

      .favorite-badge {
        font-size: 20px;
      }

      .heart-icon {
        animation: heartbeat 2s infinite;
      }

      @keyframes heartbeat {
        0%, 20%, 50%, 80%, 100% {
          transform: scale(1);
        }
        40% {
          transform: scale(1.1);
        }
        60% {
          transform: scale(1.05);
        }
      }

      .favorite-card-body {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .store-details {
        flex: 1;
      }

      .store-address {
        margin: 0 0 8px 0;
        font-size: 13px;
        color: #64748b;
        line-height: 1.4;
      }

      .store-rating {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .rating-stars {
        color: #f59e0b;
        font-size: 12px;
      }

      .rating-number {
        font-size: 12px;
        color: #475569;
        font-weight: 600;
      }

      .review-count {
        font-size: 11px;
        color: #64748b;
      }

      .favorite-card-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
      }

      .store-status {
        padding: 4px 8px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 600;
      }

      .store-status.open {
        background: #dcfce7;
        color: #166534;
      }

      .store-status.closed {
        background: #fef2f2;
        color: #dc2626;
      }

      .visit-btn {
        padding: 6px 12px;
        border: none;
        border-radius: 8px;
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        color: white;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .visit-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 3px 12px rgba(239, 68, 68, 0.3);
      }

      .primary-btn {
        padding: 12px 24px;
        border: none;
        border-radius: 12px;
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        color: white;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }

      .primary-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(239, 68, 68, 0.3);
      }

      .empty-state,
      .error-state {
        text-align: center;
        padding: 60px 20px;
        color: #64748b;
      }

      .empty-icon,
      .error-icon {
        font-size: 64px;
        margin-bottom: 16px;
      }

      .empty-state h3,
      .error-state h3 {
        margin: 0 0 8px 0;
        font-size: 18px;
        font-weight: 700;
        color: #1e293b;
      }

      .empty-state p,
      .error-state p {
        margin: 0 0 24px 0;
        font-size: 14px;
        color: #64748b;
      }

      /* 스켈레톤 애니메이션 */
      .skeleton-text,
      .skeleton-badge,
      .skeleton-store-name,
      .skeleton-category,
      .skeleton-address,
      .skeleton-rating,
      .skeleton-button {
        background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
        background-size: 200% 100%;
        animation: skeleton-loading 2s infinite;
        border-radius: 4px;
      }

      .skeleton-card {
        pointer-events: none;
      }

      .skeleton-store-name {
        height: 16px;
        width: 120px;
        margin-bottom: 4px;
      }

      .skeleton-category {
        height: 12px;
        width: 60px;
      }

      .skeleton-address {
        height: 13px;
        width: 100%;
        margin-bottom: 8px;
      }

      .skeleton-rating {
        height: 12px;
        width: 80px;
      }

      .skeleton-button {
        height: 28px;
        width: 60px;
      }

      @keyframes skeleton-loading {
        0% {
          background-position: -200% 0;
        }
        100% {
          background-position: 200% 0;
        }
      }

      @media (max-width: 480px) {
        .favorites-header {
          padding: 16px 12px;
        }

        .favorites-content {
          padding: 16px 12px;
        }

        .favorites-stats-card,
        .favorites-section {
          padding: 16px;
        }

        .header-info h1 {
          font-size: 20px;
        }

        .favorite-card-footer {
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
        }

        .visit-btn {
          width: 100%;
          justify-content: center;
        }
      }
    </style>
  `;
}

// 전역으로 함수 노출
window.renderAllFavorites = renderAllFavorites;