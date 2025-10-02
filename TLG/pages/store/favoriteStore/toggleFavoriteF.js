/**
 * 즐겨찾기 토글 레거시 래퍼
 * 레이어드 아키텍처로 완전 전환됨
 */

// 레거시 호환성을 위한 래퍼 함수들
async function toggleFavorite(store) {
  const { favoriteController } = await import('./controllers/favoriteController.js');
  return favoriteController.toggleFavorite(store);
}

async function initializeFavoriteButton(store) {
  const { favoriteController } = await import('./controllers/favoriteController.js');
  return favoriteController.initializeFavoriteButton(store);
}

// 레거시 함수들 (하위 호환성)
async function checkFavoriteStatus(storeId) {
  const { favoriteService } = await import('./services/favoriteService.js');
  if (!window.userInfo || !window.userInfo.id) return false;
  return favoriteService.getFavoriteStatus(window.userInfo.id, storeId);
}

async function updateFavoriteBtn(storeId, isFavorited) {
  const { favoriteButtonView } = await import('./views/favoriteButtonView.js');
  return favoriteButtonView.updateFavoriteButton(storeId, isFavorited);
}

// 전역 함수 등록 (하위 호환성)
window.toggleFavorite = toggleFavorite;
window.initializeFavoriteButton = initializeFavoriteButton;
window.checkFavoriteStatus = checkFavoriteStatus;
window.updateFavoriteBtn = updateFavoriteBtn;