//즐겨찾기 검증 함수
function updateFavoriteBtn(storeName) {
  const btn = document.getElementById('favoriteBtn');
  const isFavorited = userInfo.favorites.includes(storeName);
  btn.textContent = isFavorited ? '♥' : '♡';
  btn.classList.toggle('favorited', isFavorited); // 빨간색 클래스 적용
}

// 즐겨찾기 토글 함수
function toggleFavorite(storeName) {
  const idx = userInfo.favorites.indexOf(storeName);
  if (idx === -1) {
    userInfo.favorites.push(storeName);
  } else {
    userInfo.favorites.splice(idx, 1);
  }
  updateFavoriteBtn(storeName);
}
