
// 매장 탭 관리자
window.StoreTabManager = {
  initializeTabNavigation(store) {
    const storeNavBar = document.getElementById('storeNavBar');
    
    if (!storeNavBar) return;

    // 탭 네비 이벤트
    storeNavBar.addEventListener('click', (e) => {
      const btn = e.target.closest('.nav-btn');
      if (!btn) return;
      
      storeNavBar.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      this.renderStoreTab(btn.dataset.tab, store);
    });
  },

  renderStoreTab(tab, store) {
    const storeContent = document.getElementById('storeContent');
    if (!storeContent) {
      console.error('❌ storeContent 요소를 찾을 수 없습니다');
      return;
    }

    console.log(`🔄 탭 전환: ${tab}`, store ? store.name : '매장 정보 없음');

    switch (tab) {
      case 'menu':
        try {
          if (typeof renderMenuHTML === 'function') {
            const menuHTML = renderMenuHTML(store);
            storeContent.innerHTML = menuHTML;
            console.log('✅ 메뉴 탭 렌더링 완료');
          } else {
            console.error('❌ renderMenuHTML 함수를 찾을 수 없습니다');
            storeContent.innerHTML = '<div class="empty-menu">메뉴를 불러올 수 없습니다.</div>';
          }
        } catch (error) {
          console.error('❌ 메뉴 렌더링 중 오류:', error);
          storeContent.innerHTML = '<div class="empty-menu">메뉴 로딩 중 오류가 발생했습니다.</div>';
        }
        break;

      case 'review':
        storeContent.innerHTML = renderReviewHTML(store);
        const seeMoreBtn = storeContent.querySelector('.see-more-btn');
        if (seeMoreBtn) {
          seeMoreBtn.addEventListener('click', () => {
            renderAllReview(store);
          });
        }
        break;

      case 'photo':
        storeContent.innerHTML = '등록된 사진이 없습니다...';
        break;

      case 'info':
        storeContent.innerHTML = '등록된 정보가 없습니다...';
        break;

      default:
        storeContent.innerHTML = '준비 중...';
    }
    
    window.StorePanelManager.adjustLayout();
  }
};
