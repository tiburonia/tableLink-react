
/**
 * Level Section Component
 * 단골 레벨 섹션 UI 컴포넌트
 */

export function generateLevelSectionHTML(regularLevels) {
  const levelListHTML = regularLevels.length > 0
    ? regularLevels.slice(0, 3).map(level => generateLevelItemHTML(level)).join('')
    : generateEmptyLevelHTML();

  return `
    <section class="section-card levels-card">
      <div class="section-header">
        <div class="section-title">
          <div class="section-icon">🏆</div>
          <div class="section-text">
            <h3>단골 레벨</h3>
            <p class="section-subtitle">나의 단골 등급을 확인하세요</p>
          </div>
        </div>
        <button class="modern-see-more-btn" id="viewAllLevelsBtn">
          <span class="btn-text">전체보기</span>
          <div class="btn-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </button>
      </div>
      <div id="regularLevelsList" class="modern-content-list">
        ${levelListHTML}
      </div>
    </section>
  `;
}

function generateLevelItemHTML(levelInfo) {
  const storeName = levelInfo.storeName || levelInfo.store || '매장';
  const level = levelInfo.currentLevel?.name || '신규고객';
  const points = levelInfo.points || 0;
  const nextLevelPoints = levelInfo.nextLevel?.requiredPoints || 0;
  const benefits = levelInfo.currentLevel?.description || '혜택 없음';

  return `
    <div class="regular-level-item">
      <div class="level-store-name">
        <span>${storeName}</span>
        <span class="level-badge">${level}</span>
      </div>
      <div class="level-progress">🎯 ${points} / ${nextLevelPoints} 포인트</div>
      <div class="level-benefits">${benefits}</div>
    </div>
  `;
}

function generateEmptyLevelHTML() {
  return `
    <div class="empty-state">
      <div class="empty-icon">🏆</div>
      <div class="empty-text">등록된 단골 레벨이 없습니다</div>
    </div>
  `;
}
