
/**
 * Points Section Component
 * 포인트 섹션 UI 컴포넌트
 */

export function generatePointsSectionHTML(storePoints) {
  const pointsListHTML = storePoints.length > 0
    ? storePoints.slice(0, 3).map(point => generatePointItemHTML(point)).join('')
    : generateEmptyPointHTML();

  return `
    <section class="section-card points-card">
      <div class="section-header">
        <div class="section-title">
          <div class="section-icon">💰</div>
          <div class="section-text">
            <h3>보유 포인트</h3>
            <p class="section-subtitle">적립된 포인트를 확인하세요</p>
          </div>
        </div>
        <button class="modern-see-more-btn" id="viewAllPointsBtn">
          <span class="btn-text">전체보기</span>
          <div class="btn-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </button>
      </div>
      <div id="storePointsList" class="modern-content-list">
        ${pointsListHTML}
      </div>
    </section>
  `;
}

function generatePointItemHTML(pointInfo) {
  const storeName = pointInfo.storeName || '매장';
  const points = pointInfo.points || 0;
  const category = pointInfo.storeCategory || '기타';

  return `
    <div class="store-points-item">
      <div class="points-store-info">
        <div class="points-store-name">${storeName}</div>
        <div class="points-store-category">${category}</div>
      </div>
      <div class="points-amount">
        <span class="points-value">${points.toLocaleString()}</span>
        <span class="points-label">P</span>
      </div>
    </div>
  `;
}

function generateEmptyPointHTML() {
  return `
    <div class="empty-state">
      <div class="empty-icon">💰</div>
      <div class="empty-text">보유한 포인트가 없습니다</div>
    </div>
  `;
}
