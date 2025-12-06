
/**
 * Profile Card Component
 * 프로필 카드 UI 컴포넌트
 */

export function generateProfileCardHTML(userInfo, stats) {
  const displayName = userInfo.name || userInfo.username || userInfo.id;
  const vipLevel = calculateVipLevel(stats.totalOrders);

  return `
    <div class="profile-card">
      <div class="profile-avatar">
        <div class="avatar-circle" id="profileImage">
          <span class="avatar-text">${getAvatarText(displayName)}</span>
        </div>
        <div class="online-indicator"></div>
      </div>

      <div class="profile-info">
        <h2 id="profileName" class="profile-name">${displayName}</h2>
        <div id="profileLevel" class="profile-badge" style="background: ${vipLevel.color};">
          ${vipLevel.level} 등급
        </div>

        <div class="profile-stats">
          <div class="stat-item">
            <span class="stat-number" id="totalOrders">${stats.totalOrders}</span>
            <span class="stat-label">총 주문</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-number" id="totalReviews">${stats.totalReviews}</span>
            <span class="stat-label">리뷰</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-number" id="favoriteCount">${stats.favoriteCount}</span>
            <span class="stat-label">즐겨찾기</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function calculateVipLevel(orderCount) {
  if (orderCount >= 50) return { level: 'DIAMOND', color: '#b9f2ff' };
  if (orderCount >= 30) return { level: 'PLATINUM', color: '#e5e4e2' };
  if (orderCount >= 15) return { level: 'GOLD', color: '#ffd700' };
  if (orderCount >= 5) return { level: 'SILVER', color: '#c0c0c0' };
  return { level: 'BRONZE', color: '#cd7f32' };
}

function getAvatarText(name) {
  const firstChar = name.charAt(0).toUpperCase();
  return isNaN(firstChar) ? firstChar : '👤';
}
