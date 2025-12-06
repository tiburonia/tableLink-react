
/**
 * 빠른 액세스 컴포넌트
 */

export function createQuickAccess() {
  return `
    <div class="quick-access-section">
      <h3 class="section-title">빠른 접근</h3>

      <div class="quick-buttons-grid">
        <button id="quickLogin" class="quick-btn user-btn">
          <div class="quick-btn-icon">⚡</div>
          <div class="quick-btn-content">
            <span class="quick-btn-title">빠른 로그인</span>
            <span class="quick-btn-desc">tiburonia 계정</span>
          </div>
        </button>

        <button id="guestTLLOrder" class="quick-btn guest-btn">
          <div class="quick-btn-icon">🎫</div>
          <div class="quick-btn-content">
            <span class="quick-btn-title">비회원 주문</span>
            <span class="quick-btn-desc">로그인 없이 TLL</span>
          </div>
        </button>

        <button id="adminLogin" class="quick-btn admin-btn">
          <div class="quick-btn-icon">🛠️</div>
          <div class="quick-btn-content">
            <span class="quick-btn-title">관리자</span>
            <span class="quick-btn-desc">Admin Panel</span>
          </div>
        </button>
      </div>

      <div class="system-buttons-grid">
        <button id="goKDS" class="system-btn kds-btn">
          <div class="system-btn-icon">📟</div>
          <div class="system-btn-content">
            <span class="system-btn-title">KDS</span>
            <span class="system-btn-desc">주방 디스플레이</span>
          </div>
        </button>

        <button id="goPOS" class="system-btn pos-btn">
          <div class="system-btn-icon">💳</div>
          <div class="system-btn-content">
            <span class="system-btn-title">POS</span>
            <span class="system-btn-desc">포스 시스템</span>
          </div>
        </button>

        <button id="goKRP" class="system-btn krp-btn">
          <div class="system-btn-icon">🖨️</div>
          <div class="system-btn-content">
            <span class="system-btn-title">KRP</span>
            <span class="system-btn-desc">주방 프린터</span>
          </div>
        </button>

        <button id="goTLM" class="system-btn tlm-btn">
          <div class="system-btn-icon">🏪</div>
          <div class="system-btn-content">
            <span class="system-btn-title">사장님 앱</span>
            <span class="system-btn-desc">매장 관리</span>
          </div>
        </button>
      </div>
    </div>
  `;
}

export function setupQuickAccessEvents() {
  const quickLoginBtn = document.querySelector('#quickLogin');
  const guestTLLBtn = document.querySelector('#guestTLLOrder');
  const adminLogin = document.querySelector('#adminLogin');
  const goKDS = document.querySelector('#goKDS');
  const goPOS = document.querySelector('#goPOS');
  const goKRP = document.querySelector('#goKRP');
  const goTLM = document.querySelector('#goTLM');

  // 빠른 로그인
  if (quickLoginBtn) {
    quickLoginBtn.addEventListener('click', () => {
      if (window.quickLogin) {
        window.quickLogin('tiburonia');
      }
    });
  }

  // 비회원 TLL 주문
  if (guestTLLBtn) {
    guestTLLBtn.addEventListener('click', async () => {
      try {
       

        
        console.log('🎫 비회원 모드로 TLL 진입');

        // 비회원 TLL 렌더링 함수 동적 로드
        if (typeof window.renderGuestTLL === 'function') {
          await window.renderGuestTLL();
        } else {
          const script = document.createElement('script');
          script.type = 'module';
          script.src = '/TLG/pages/pay/renderGuestTLL.js';
          
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });

          if (typeof window.renderGuestTLL === 'function') {
            await window.renderGuestTLL();
          }
        }
      } catch (error) {
        console.error('❌ 비회원 TLL 진입 실패:', error);
        alert('비회원 주문을 시작할 수 없습니다. 다시 시도해주세요.');
      }
    });
  }

  // 관리자 로그인
  if (adminLogin) {
    adminLogin.addEventListener('click', () => {
      window.location.href = '/ADMIN';
    });
  }

  // KDS 진입
  if (goKDS) {
    goKDS.addEventListener('click', () => {
      if (window.showKDSStoreSearchModal) {
        window.showKDSStoreSearchModal();
      }
    });
  }

  // POS 진입
  if (goPOS) {
    goPOS.addEventListener('click', () => {
      if (window.showPOSStoreSearchModal) {
        window.showPOSStoreSearchModal();
      }
    });
  }

  // KRP 진입
  if (goKRP) {
    goKRP.addEventListener('click', () => {
      if (window.showKRPStoreSearchModal) {
        window.showKRPStoreSearchModal();
      }
    });
  }

  // TLM 진입
  if (goTLM) {
    goTLM.addEventListener('click', () => {
      if (window.showStoreSearchModal) {
        window.showStoreSearchModal();
      }
    });
  }
}
