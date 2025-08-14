
// 즐겨찾기 버튼 UI 업데이트 함수 (storeId 기반)
function updateFavoriteBtn(storeId, isFavorited) {
  const btn = document.getElementById('favoriteBtn');
  if (!btn) {
    console.warn('⚠️ favoriteBtn 요소를 찾을 수 없음');
    return;
  }
  
  btn.textContent = isFavorited ? '❤️' : '🤍';
  btn.classList.toggle('favorited', isFavorited);
  btn.setAttribute('data-favorited', isFavorited);
  
  console.log(`🔄 즐겨찾기 버튼 UI 업데이트: ${isFavorited ? '좋아요' : '좋아요 취소'}`);
}

// 즐겨찾기 상태 확인 함수
async function checkFavoriteStatus(storeId) {
  try {
    const response = await fetch(`/api/users/favorite/status/${userInfo.id}/${storeId}`);
    const data = await response.json();

    if (data.success) {
      return data.isFavorited;
    } else {
      console.error('❌ 즐겨찾기 상태 확인 실패:', data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ 즐겨찾기 상태 확인 중 오류:', error);
    return false;
  }
}

// 즐겨찾기 토글 함수 - storeId 기반으로 완전 리팩토링
async function toggleFavorite(store) {
  try {
    const storeId = store.id || store.storeId;
    const storeName = store.name || store.storeName;

    if (!storeId) {
      console.error('❌ storeId가 없습니다:', store);
      alert('매장 정보가 올바르지 않습니다.');
      return;
    }

    console.log(`🔄 즐겨찾기 토글 시작: storeId=${storeId}, storeName=${storeName}`);

    // 현재 즐겨찾기 상태 확인
    const currentStatus = await checkFavoriteStatus(storeId);
    console.log(`📋 현재 즐겨찾기 상태: ${currentStatus ? '등록됨' : '등록안됨'}`);

    // 서버에 즐겨찾기 토글 요청
    const response = await fetch('/api/users/favorite/toggle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userInfo.id,
        storeId: storeId,
        action: currentStatus ? 'remove' : 'add'
      })
    });

    const data = await response.json();

    if (data.success) {
      const isNowFavorited = data.action === 'added' || data.action === 'already_added';
      
      // UI 업데이트
      updateFavoriteBtn(storeId, isNowFavorited);
      
      // 성공 메시지 표시
      if (data.action === 'added') {
        console.log('✅ 즐겨찾기 추가 성공:', data.message);
      } else if (data.action === 'removed') {
        console.log('✅ 즐겨찾기 제거 성공:', data.message);
      }
      
      // 로컬 스토리지 캐시 무효화 (필요한 경우)
      if (typeof localStorage !== 'undefined') {
        const cacheKey = `tablelink_favorites_${userInfo.id}`;
        localStorage.removeItem(cacheKey);
        console.log('🗑️ 즐겨찾기 캐시 무효화:', cacheKey);
      }
      
    } else {
      console.error('❌ 즐겨찾기 토글 실패:', data.error);
      alert('즐겨찾기 설정에 실패했습니다: ' + data.error);
    }

  } catch (error) {
    console.error('❌ 즐겨찾기 토글 중 오류:', error);
    alert('서버 연결에 실패했습니다.');
  }
}

// 매장 렌더링 시 즐겨찾기 상태 초기화 함수
async function initializeFavoriteButton(store) {
  try {
    const storeId = store.id || store.storeId;
    if (!storeId) {
      console.warn('⚠️ storeId가 없어 즐겨찾기 초기화를 건너뜁니다');
      return;
    }

    const isFavorited = await checkFavoriteStatus(storeId);
    updateFavoriteBtn(storeId, isFavorited);
    
    console.log(`✅ 즐겨찾기 버튼 초기화 완료: storeId=${storeId}, favorited=${isFavorited}`);
  } catch (error) {
    console.error('❌ 즐겨찾기 버튼 초기화 실패:', error);
  }
}
