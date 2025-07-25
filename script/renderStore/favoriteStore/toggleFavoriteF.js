//즐겨찾기 검증 함수
function updateFavoriteBtn(storeName) {
  const btn = document.getElementById('favoriteBtn');
  const favorites = currentUserInfo.favorites || currentUserInfo.favorite_stores || [];
  const isFavorited = favorites.includes(storeName);
  btn.classList.toggle('favorited', isFavorited); // 빨간색 클래스 적용
}

// 즐겨찾기 토글 함수 - 데이터베이스 기반
async function toggleFavorite(storeName) {
  try {
    // 현재 즐겨찾기 상태 확인
    const favorites = currentUserInfo.favorites || currentUserInfo.favorite_stores || [];
    const isFavorited = favorites.includes(storeName);

    // 서버에 즐겨찾기 토글 요청
    const response = await fetch('/api/users/favorite/toggle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userInfo.id,
        storeName: storeName,
        action: isFavorited ? 'remove' : 'add'
      })
    });

    const data = await response.json();

    if (response.ok) {
      // 로컬 userInfo 업데이트
      if (isFavorited) {
        const idx = userInfo.favorites.indexOf(storeName);
        if (idx !== -1) {
          userInfo.favorites.splice(idx, 1);
        }
      } else {
        userInfo.favorites.push(storeName);
      }

      // UI 업데이트
      updateFavoriteBtn(storeName);

      console.log('즐겨찾기 상태 업데이트 성공:', data.message);
    } else {
      console.error('즐겨찾기 토글 실패:', data.error);
      alert('즐겨찾기 설정에 실패했습니다.');
    }
  } catch (error) {
    console.error('즐겨찾기 토글 오류:', error);
    alert('서버 연결에 실패했습니다.');
  }
}