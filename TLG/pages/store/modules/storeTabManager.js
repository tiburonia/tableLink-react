
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
    if (!storeContent) return;

    switch (tab) {
      case 'menu':
        storeContent.innerHTML = renderMenuHTML(store);
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
