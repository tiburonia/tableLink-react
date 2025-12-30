
/**
 * Quick Actions Component
 * 퀵 액션 메뉴 UI 컴포넌트
 */

export function generateQuickActionsHTML() {
  return `
    <div class="quick-actions">
      <div class="quick-action-item" id="quickOrdersBtn">
        <div class="action-icon">📦</div>
        <span class="action-label">주문내역</span>
      </div>
      <div class="quick-action-item" id="quickCouponsBtn">
        <div class="action-icon">🎫</div>
        <span class="action-label">쿠폰함</span>
      </div>
      <div class="quick-action-item" id="quickFavoritesBtn">
        <div class="action-icon">💖</div>
        <span class="action-label">즐겨찾기</span>
      </div>
      <div class="quick-action-item" id="quickPointsBtn">
        <div class="action-icon">🏆</div>
        <span class="action-label">포인트</span>
      </div>
    </div>
  `;
}
