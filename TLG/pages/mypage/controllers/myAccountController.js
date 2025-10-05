
/**
 * Controller Layer: 이벤트 처리 전담
 * 순수하게 이벤트 핸들링과 의존성 조율만 수행
 */

import myAccountRepository from '../repositories/myAccountRepository.js';
import myAccountService from '../services/myAccountService.js';
import myAccountView from '../views/myAccountView.js';

export const myAccountController = {
  // 초기화 플래그
  initialized: false,

  // 메인 초기화 함수
  async init() {
    console.log('🔧 myAccountController.init() 시작');

    // 중복 초기화 방지
    if (this.initialized) {
      console.log('⚠️ Controller 이미 초기화됨');
      return;
    }

    try {
      // 1. 의존성 스크립트 로드
      await this.loadDependencies();

      // 2. 데이터 로드 및 뷰 렌더링
      const userId = window.userInfo?.id || 'user1';
      const viewModel = await myAccountService.buildAccountViewModel(userId, myAccountRepository);

      // 3. 뷰 렌더링
      myAccountView.render(viewModel);

      // 4. 이벤트 리스너 등록
      this.setupEventListeners();

      // 초기화 완료
      this.initialized = true;
      console.log('✅ myAccountController 초기화 완료');

    } catch (error) {
      console.error('❌ Controller 초기화 실패:', error);
      alert('페이지 로드 중 오류가 발생했습니다.');
    }
  },

  // 의존성 스크립트 로드
  async loadDependencies() {
    const scripts = [
      { name: 'renderMyPage', src: '/TLG/pages/mypage/renderMyPage.js' },
      { name: 'renderAllOrderHTML', src: '/TLG/pages/store/views/order/renderAllOrderHTML.js' }
    ];

    for (const script of scripts) {
      if (typeof window[script.name] !== 'function') {
        await this.loadScript(script.src);
      }
    }
  },

  // 스크립트 로드 헬퍼
  loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  },

  // 이벤트 리스너 설정
  setupEventListeners() {
    const handlers = {
      backBtn: this.handleBack,
      logoutBtn: this.handleLogout,
      editProfileBtn: this.handleEditProfile,
      couponBtn: this.handleCoupon,
      favoritesBtn: this.handleFavorites,
      achievementsBtn: this.handleAchievements,
      settingsBtn: this.handleSettings,
      viewAllOrdersBtn: this.handleViewAllOrders,
      viewAllLevelsBtn: this.handleViewAllLevels,
      editPersonalInfoBtn: this.handleEditPersonalInfo
    };

    Object.entries(handlers).forEach(([id, handler]) => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('click', handler.bind(this));
        console.log(`✅ ${id} 이벤트 등록`);
      }
    });
  },

  // 이벤트 핸들러들
  handleBack(e) {
    e.preventDefault();
    if (typeof window.renderMyPage === 'function') {
      window.renderMyPage();
    } else {
      window.history.back();
    }
  },

  handleLogout(e) {
    e.preventDefault();
    if (!confirm('정말 로그아웃 하시겠습니까?')) return;

    try {
      if (typeof window.logOutF === 'function') {
        window.logOutF();
      } else {
        window.userInfo = null;
        localStorage.clear();
        document.cookie = 'userInfo=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
        alert('로그아웃 완료');
        
        if (typeof renderLogin === 'function') {
          renderLogin();
        } else {
          window.location.href = '/';
        }
      }
    } catch (error) {
      console.error('❌ 로그아웃 오류:', error);
      window.userInfo = null;
      localStorage.clear();
      window.location.reload();
    }
  },

  handleEditProfile(e) {
    e.preventDefault();
    alert('프로필 수정 기능은 개발 중입니다.');
  },

  async handleCoupon(e) {
    e.preventDefault();
    await this.loadOptionalScript('renderAllCoupons', '/TLG/pages/mypage/renderAllCoupons.js');
    if (typeof window.renderAllCoupons === 'function') {
      window.previousScreen = 'renderMyAccount';
      window.renderAllCoupons(window.userInfo || { id: 'user1' });
    }
  },

  async handleFavorites(e) {
    e.preventDefault();
    await this.loadOptionalScript('renderAllFavorites', '/TLG/pages/mypage/renderAllFavorites.js');
    if (typeof window.renderAllFavorites === 'function') {
      window.previousScreen = 'renderMyAccount';
      window.renderAllFavorites(window.userInfo || { id: 'user1' });
    }
  },

  handleAchievements(e) {
    e.preventDefault();
    alert('업적 기능은 개발 중입니다.');
  },

  handleSettings(e) {
    e.preventDefault();
    alert('설정 기능은 개발 중입니다.');
  },

  handleViewAllOrders(e) {
    e.preventDefault();
    if (typeof window.renderAllOrderHTML === 'function') {
      window.renderAllOrderHTML(window.userInfo || { id: 'user1' });
    } else {
      alert('주문 내역을 불러올 수 없습니다.');
    }
  },

  async handleViewAllLevels(e) {
    e.preventDefault();
    await this.loadOptionalScript('renderAllRegularLevels', '/TLG/pages/mypage/renderAllRegularLevels.js');
    if (typeof window.renderAllRegularLevels === 'function') {
      window.previousScreen = 'renderMyAccount';
      window.renderAllRegularLevels(window.userInfo || { id: 'user1' });
    }
  },

  async handleEditPersonalInfo(e) {
    e.preventDefault();
    await this.loadOptionalScript('renderEditPersonalInfo', '/TLG/pages/mypage/renderEditPersonalInfo.js');
    if (typeof window.renderEditPersonalInfo === 'function') {
      window.renderEditPersonalInfo(window.userInfo || { id: 'user1' });
    } else {
      alert('개인정보 수정 기능을 불러올 수 없습니다.');
    }
  },

  handleEditProfile(e) {
    e.preventDefault();
    alert('프로필 수정 기능은 개발 중입니다.');
  }derEditPersonalInfo === 'function') {
      window.renderEditPersonalInfo(window.userInfo || { id: 'user1' });
    } else {
      alert('개인정보 수정 기능을 불러올 수 없습니다.');
    }
  },

  // 선택적 스크립트 로드
  async loadOptionalScript(funcName, src) {
    if (typeof window[funcName] === 'function') return;
    
    try {
      await this.loadScript(src);
    } catch (error) {
      console.error(`❌ ${funcName} 로드 실패:`, error);
    }
  }
};

export default myAccountController;
