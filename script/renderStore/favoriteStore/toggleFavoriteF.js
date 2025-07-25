
async function toggleFavorite(storeId) {
  // 로그인 확인
  if (!window.userInfo.id) {
    alert('로그인이 필요합니다');
    return;
  }

  try {
    // 현재 즐겨찾기 상태 확인
    const currentFavorites = window.userInfo.favorites || [];
    let newFavorites;

    if (currentFavorites.includes(storeId)) {
      // 즐겨찾기에서 제거
      newFavorites = currentFavorites.filter(id => id !== storeId);
    } else {
      // 즐겨찾기에 추가
      newFavorites = [...currentFavorites, storeId];
    }

    // 데이터베이스에 업데이트
    const success = await API.updateUserInfo(window.userInfo.id, {
      ...window.userInfo,
      favorites: newFavorites
    });

    if (success) {
      // 로컬 userInfo 업데이트
      window.userInfo.favorites = newFavorites;
      
      // UI 업데이트
      const favoriteBtn = document.querySelector('.favorite-btn');
      if (favoriteBtn) {
        if (newFavorites.includes(storeId)) {
          favoriteBtn.classList.add('favorited');
          favoriteBtn.innerHTML = '❤️';
        } else {
          favoriteBtn.classList.remove('favorited');
          favoriteBtn.innerHTML = '🤍';
        }
      }
    } else {
      alert('즐겨찾기 업데이트에 실패했습니다');
    }
  } catch (error) {
    console.error('즐겨찾기 토글 실패:', error);
    alert('즐겨찾기 업데이트에 실패했습니다');
  }
}

window.toggleFavorite = toggleFavorite;
