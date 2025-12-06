
/**
 * Favorite Section Component
 * 즐겨찾기 섹션 UI 컴포넌트
 */

export function generateFavoriteSectionHTML(favoriteStores) {
  const favoriteListHTML = favoriteStores.length > 0
    ? favoriteStores.slice(0, 3).map(store => generateFavoriteItemHTML(store)).join('')
    : generateEmptyFavoriteHTML();

  return `
    <section class="section-card favorites-card">
      <div class="section-header">
        <div class="section-title">
          <div class="section-icon">💖</div>
          <div class="section-text">
            <h3>즐겨찾기 매장</h3>
            <p class="section-subtitle">자주 가는 매장들을 확인하세요</p>
          </div>
        </div>
        <button class="modern-see-more-btn" id="viewAllFavoritesBtn">
          <span class="btn-text">전체보기</span>
          <div class="btn-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </button>
      </div>
      <div id="favoriteStoresList" class="modern-content-list">
        ${favoriteListHTML}
      </div>
    </section>
  `;
}

function generateFavoriteItemHTML(store) {
  const storeName = store.name || '매장';
  const category = store.category || '기타';
  const rating = (store.ratingAverage || 0).toFixed(1);

  return `
    <div class="favorite-store-item" onclick="window.renderStore && renderStore({id: ${store.id}})">
      <div class="favorite-store-content">
        <div class="favorite-store-name">${storeName}</div>
        <div class="favorite-store-info">
          <span class="favorite-category">${category}</span>
          <span>⭐ ${rating}점</span>
        </div>
      </div>
      <div class="favorite-heart">💖</div>
    </div>
  `;
}

function generateEmptyFavoriteHTML() {
  return `
    <div class="empty-state">
      <div class="empty-icon">💖</div>
      <div class="empty-text">즐겨찾기한 매장이 없습니다</div>
    </div>
  `;
}
