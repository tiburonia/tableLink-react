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
          console.log('🍽️ 메뉴 탭 활성화 - 매장 정보 확인 중...');
          console.log('🏪 전체 매장 객체:', store);
          console.log('📋 매장 메뉴 원본 데이터:', store.menu, '타입:', typeof store.menu);

          // store 객체 유효성 검사
          if (!store || !store.id) {
            console.error('❌ 매장 정보가 없습니다:', store);
            storeContent.innerHTML = '<div class="empty-menu">매장 정보를 불러올 수 없습니다.</div>';
            return;
          }

          // 메뉴 데이터 확인 및 파싱
          let menuData = store.menu;

          // null 또는 undefined 체크
          if (menuData === null || menuData === undefined) {
            console.warn('⚠️ 메뉴 데이터가 null/undefined입니다.');
            storeContent.innerHTML = '<div class="empty-menu">등록된 메뉴가 없습니다...</div>';
            return;
          }

          // 문자열인 경우 JSON 파싱 시도
          if (typeof menuData === 'string') {
            console.log('🔧 문자열 메뉴 데이터 파싱 시도:', menuData.substring(0, 100) + '...');
            try {
              menuData = JSON.parse(menuData);
              console.log('✅ JSON 파싱 성공:', menuData);
            } catch (parseError) {
              console.error('❌ 메뉴 JSON 파싱 실패:', parseError);
              console.error('❌ 파싱 실패한 원본 데이터:', menuData);
              storeContent.innerHTML = '<div class="empty-menu">메뉴 데이터 형식 오류</div>';
              return;
            }
          }

          // 빈 배열 또는 빈 데이터 체크
          if (!menuData || (Array.isArray(menuData) && menuData.length === 0)) {
            console.log('📭 메뉴가 비어있습니다.');
            storeContent.innerHTML = '<div class="empty-menu">등록된 메뉴가 없습니다...</div>';
            return;
          }

          // 배열이 아닌 경우 배열로 변환
          if (!Array.isArray(menuData)) {
            console.warn('⚠️ 메뉴 데이터가 배열이 아님, 배열로 변환:', typeof menuData, menuData);
            menuData = [menuData];
          }

          // 메뉴 데이터를 store 객체에 업데이트
          store.menu = menuData;
          console.log('✅ 처리된 메뉴 데이터 (개수: ' + menuData.length + '):', menuData.slice(0, 3));

          // renderMenuHTML 함수 존재 여부 확인
          console.log('🔍 renderMenuHTML 함수 확인:', typeof renderMenuHTML, typeof window.renderMenuHTML);
          
          if (typeof renderMenuHTML === 'function') {
            console.log('🎯 renderMenuHTML 함수 호출 중...');
            const menuHTML = renderMenuHTML(store);
            console.log('📄 생성된 HTML 길이:', menuHTML ? menuHTML.length : 0);
            storeContent.innerHTML = menuHTML;
            console.log('✅ 메뉴 HTML 렌더링 완료');
          } else if (typeof window.renderMenuHTML === 'function') {
            console.log('🎯 window.renderMenuHTML 함수 호출 중...');
            const menuHTML = window.renderMenuHTML(store);
            storeContent.innerHTML = menuHTML;
            console.log('✅ 메뉴 HTML 렌더링 완료 (window)');
          } else {
            console.error('❌ renderMenuHTML 함수를 찾을 수 없습니다');
            console.error('🔍 전역 함수 목록:', Object.getOwnPropertyNames(window).filter(name => name.includes('Menu')));
            storeContent.innerHTML = '<div class="empty-menu">메뉴 렌더링 함수를 찾을 수 없습니다.</div>';
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