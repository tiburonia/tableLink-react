
// 단골 레벨 HTML 렌더링 모듈
export const loyaltyLevelHTML = {
  renderLoyaltyLevelHTML() {
    return `
      <div class="loyalty-levels-grid">
        <!-- 실제 데이터가 loadLoyaltyData 함수에서 여기에 동적으로 삽입됩니다 -->
        <div class="loyalty-loading-skeleton">
          <div class="skeleton-loyalty-card">
            <div class="skeleton-level-header">
              <div class="skeleton-level-icon"></div>
              <div class="skeleton-level-info">
                <div class="skeleton-level-name"></div>
                <div class="skeleton-level-requirement"></div>
              </div>
            </div>
            <div class="skeleton-level-benefits">
              <div class="skeleton-benefit"></div>
              <div class="skeleton-benefit"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
};
