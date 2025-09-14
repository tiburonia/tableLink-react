/**
 * 로그인 화면 렌더링 (모듈화 버전)
 */

import { createLoginSkeleton } from '../../components/common/skeleton.js';
import { createLoginForm, setupLoginFormEvents } from '../../components/auth/loginForm.js';
import { createQuickAccess, setupQuickAccessEvents } from '../../components/auth/quickAccess.js';
import { createStoreSearchModal, setupStoreSearchModal, modalStyles } from '../../components/auth/storeSearchModal.js';

// 빠른 로그인 함수 (전역으로 등록)
window.quickLogin = async function(userId) {
  console.log(`🚀 빠른 로그인 시도: ${userId}`);

  try {
    const quickBtn = document.querySelector('#quickLogin');
    if (quickBtn) {
      quickBtn.disabled = true;
      quickBtn.innerHTML = `
        <div class="quick-btn-icon">⏳</div>
        <div class="quick-btn-content">
          <span class="quick-btn-title">로그인 중...</span>
          <span class="quick-btn-desc">잠시만 기다리세요</span>
        </div>
      `;
    }

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: userId, pw: 'cchcch11' })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('🔍 로그인 응답 데이터:', data);

    if (data.success && data.user) {
      console.log('✅ 빠른 로그인 성공:', data.user.name);

      if (window.setUserInfo) {
        window.setUserInfo(data.user);
      }

      alert(`${data.user.name}님, 환영합니다!`);

      if (typeof renderMap === 'function') {
        renderMap();
      } else {
        console.error('❌ renderMap 함수를 찾을 수 없음');
        window.location.href = '/';
      }
    } else {
      throw new Error(data.error || data.message || '로그인에 실패했습니다');
    }
  } catch (error) {
    console.error('❌ 빠른 로그인 실패:', error);

    const quickBtn = document.querySelector('#quickLogin');
    if (quickBtn) {
      quickBtn.disabled = false;
      quickBtn.innerHTML = `
        <div class="quick-btn-icon">⚡</div>
        <div class="quick-btn-content">
          <span class="quick-btn-title">빠른 로그인</span>
          <span class="quick-btn-desc">tiburonia 계정</span>
        </div>
      `;
    }

    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #ef4444;
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      font-weight: 600;
      z-index: 10000;
      box-shadow: 0 10px 25px rgba(239, 68, 68, 0.3);
    `;
    errorDiv.textContent = error.message || '빠른 로그인에 실패했습니다';
    document.body.appendChild(errorDiv);

    setTimeout(() => errorDiv.remove(), 3000);
  }
};

// 매장 검색 모달 함수들
function showStoreSearchModal(type, title, themeColor, redirectUrl) {
  const modal = document.createElement('div');
  modal.id = `${type}StoreSearchModal`;
  modal.innerHTML = createStoreSearchModal(type, title, themeColor) + `<style>${modalStyles}</style>`;

  document.body.appendChild(modal);
  setupStoreSearchModal(type, `selectStoreFor${type.toUpperCase()}`);

  // 매장 선택 함수 등록
  window[`selectStoreFor${type.toUpperCase()}`] = function(storeId, storeName) {
    console.log(`✅ ${type.toUpperCase()} 매장 선택: ${storeName} (ID: ${storeId})`);
    window[`close${type.toUpperCase()}StoreSearchModal`]();
    setTimeout(() => {
      window.location.href = `${redirectUrl}?storeId=${storeId}`;
    }, 200);
  };

  // 모달 닫기 함수 등록
  window[`close${type.toUpperCase()}StoreSearchModal`] = function() {
    const modal = document.getElementById(`${type}StoreSearchModal`);
    if (modal) modal.remove();
  };
}

// 각 시스템별 모달 표시 함수들
window.showKDSStoreSearchModal = () => showStoreSearchModal('kds', '📟 KDS 진입', { primary: '#2c3e50', secondary: '#34495e' }, '/kds.html');
window.showPOSStoreSearchModal = () => showStoreSearchModal('pos', '💳 POS 진입', { primary: '#666666', secondary: '#333333' }, '/pos/index.html');
window.showKRPStoreSearchModal = () => showStoreSearchModal('krp', '🖨️ KRP 진입', { primary: '#e67e22', secondary: '#d35400' }, '/krp.html');
window.showStoreSearchModal = () => showStoreSearchModal('tlm', '🏪 사장님 앱 진입', { primary: '#667eea', secondary: '#764ba2' }, '/tlm.html');

// 패널 핸들링 설정
function setupLoginPanelHandling() {
  const panel = document.getElementById('loginPanel');
  const panelContainer = document.getElementById('loginPanelContainer');
  const handle = document.getElementById('loginPanelHandle');

  if (!panel || !panelContainer || !handle) return;

  // 마우스 휠 이벤트
  panel.addEventListener('wheel', (e) => {
    const top = parseInt(window.getComputedStyle(panel).top, 10) || 0;
    const isExpanded = top === 0;
    const isCollapsed = !isExpanded;

    if (e.deltaY > 0) {
      if (isCollapsed) {
        e.preventDefault();
        panel.classList.remove('collapsed');
        panel.classList.add('expanded');
        panel.style.top = '0px';
        return;
      }
      return;
    }

    if (e.deltaY < 0) {
      if (isExpanded) {
        if (panelContainer.scrollTop <= 0) {
          e.preventDefault();
          panel.classList.remove('expanded');
          panel.classList.add('collapsed');
          panel.style.top = '160px';
          return;
        }
        return;
      }
    }
  });

  // 터치 이벤트
  let startY = 0;
  let isDragging = false;
  let initialScrollTop = 0;

  handle.addEventListener('touchstart', (e) => {
    startY = e.touches[0].clientY;
    initialScrollTop = panelContainer.scrollTop;
    isDragging = true;
    panel.style.transition = 'none';
  });

  handle.addEventListener('touchmove', (e) => {
    if (!isDragging) return;

    const currentY = e.touches[0].clientY;
    const deltaY = startY - currentY;
    const top = parseInt(window.getComputedStyle(panel).top, 10) || 0;
    const isExpanded = top === 0;
    const isCollapsed = !isExpanded;

    if (isExpanded && initialScrollTop <= 0 && deltaY < 0) {
      e.preventDefault();
      const newTop = Math.max(0, Math.min(160, -deltaY));
      panel.style.top = `${newTop}px`;
      return;
    }

    if (isCollapsed && deltaY > 30) {
      e.preventDefault();
      panel.classList.remove('collapsed');
      panel.classList.add('expanded');
      panel.style.top = '0px';
      return;
    }
  });

  handle.addEventListener('touchend', () => {
    if (!isDragging) return;
    isDragging = false;
    panel.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';

    const top = parseInt(window.getComputedStyle(panel).top, 10) || 0;

    if (top > 80) {
      panel.classList.remove('expanded');
      panel.classList.add('collapsed');
      panel.style.top = '160px';
    } else {
      panel.classList.remove('collapsed');
      panel.classList.add('expanded');
      panel.style.top = '0px';
    }
  });

  // 핸들 클릭 이벤트
  handle.addEventListener('click', () => {
    const top = parseInt(window.getComputedStyle(panel).top, 10) || 0;
    const isExpanded = top === 0;

    if (isExpanded) {
      panel.classList.remove('expanded');
      panel.classList.add('collapsed');
      panel.style.top = '160px';
    } else {
      panel.classList.remove('collapsed');
      panel.classList.add('expanded');
      panel.style.top = '0px';
    }
  });
}

// 메인 렌더링 함수
async function renderLogin() {
  const main = document.getElementById('main');

  // CSS 파일 로드
  const cssLink = document.createElement('link');
  cssLink.rel = 'stylesheet';
  cssLink.href = '/shared/css/renderLogin.css';
  document.head.appendChild(cssLink);

  main.innerHTML = `
    <!-- 헤더 -->
    <header id="loginHeader">
      <div class="header-background"></div>
      <div class="header-content">
        <div class="header-title">
          <div class="brand-logo">
            <div class="logo-icon">🍽️</div>
            <h1 class="brand-name">TableLink</h1>
          </div>
          <p class="brand-subtitle">스마트 테이블 주문의 새로운 경험</p>
        </div>
      </div>
    </header>

    <!-- 로그인 패널 -->
    <div id="loginPanel" class="collapsed">
      <div id="loginPanelHandle"></div>
      <div id="loginPanelContainer">
        <div id="loginInfoContainer">
          ${createLoginSkeleton()}
        </div>
      </div>
    </div>
  `;

  // 패널 핸들링 설정
  setupLoginPanelHandling();

  // 0.8초 후 실제 폼 표시
  setTimeout(() => {
    const loginInfoContainer = document.querySelector('#loginInfoContainer');
    if (loginInfoContainer) {
      loginInfoContainer.innerHTML = `
        ${createLoginForm()}

        <!-- 구분선 -->
        <div class="divider">
          <span class="divider-text">또는</span>
        </div>

        ${createQuickAccess()}

        <!-- 푸터 -->
        <div class="login-footer">
          <p class="footer-text">© 2025 TableLink. 모든 권리 보유.</p>
        </div>
      `;

      // 이벤트 리스너 설정
      setupLoginFormEvents();
      setupQuickAccessEvents();
    }
  }, 800);

  // 모달 외부 클릭 시 닫기 이벤트
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      const modalIds = ['tlmStoreSearchModal', 'kdsStoreSearchModal', 'posStoreSearchModal', 'krpStoreSearchModal'];
      modalIds.forEach(id => {
        const modal = document.getElementById(id);
        if (modal && e.target === modal.querySelector('.modal-overlay')) {
          modal.remove();
        }
      });
    }
  });

  console.log('✅ 로그인 화면 렌더링 완료 (모듈화 버전)');
}

// 전역 함수로 등록
if (typeof window !== 'undefined') {
  window.renderLogin = renderLogin;
}