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
          <div class="quick-btn-icon">📱</div>
          <div class="quick-btn-content">
            <span class="quick-btn-title">비회원 QR주문</span>
            <span class="quick-btn-desc">QR 스캔하고 주문</span>
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

export function renderQuickAccessSection() {
    return `
        <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e5e5;">
            <button 
                onclick="showQuickAccessModal()"
                style="
                    width: 100%;
                    padding: 16px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    border-radius: 12px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: all 0.3s ease;
                "
            >
                <span style="font-size: 20px;">⚡</span>
                <span>비회원 TLL 빠른접근</span>
            </button>
            <p style="
                margin-top: 8px;
                font-size: 12px;
                color: #666;
                text-align: center;
            ">
                회원가입 없이 테이블에서 바로 주문하기
            </p>
        </div>
    `;
}

// 빠른접근 모달 표시
window.showQuickAccessModal = function() {
    const modal = `
        <div id="quickAccessModal" style="
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            padding: 20px;
        " onclick="if(event.target.id === 'quickAccessModal') closeQuickAccessModal()">
            <div style="
                background: white;
                border-radius: 24px;
                padding: 32px 24px;
                max-width: 400px;
                width: 100%;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            " onclick="event.stopPropagation()">
                <h2 style="
                    font-size: 24px;
                    font-weight: 700;
                    color: #1d1d1f;
                    margin-bottom: 8px;
                    text-align: center;
                ">비회원 주문</h2>
                <p style="
                    font-size: 14px;
                    color: #666;
                    text-align: center;
                    margin-bottom: 24px;
                ">매장과 테이블 번호를 입력해주세요</p>

                <div style="margin-bottom: 16px;">
                    <label style="
                        display: block;
                        font-size: 14px;
                        font-weight: 600;
                        color: #1d1d1f;
                        margin-bottom: 8px;
                    ">매장 ID</label>
                    <input 
                        type="number" 
                        id="quickStoreId"
                        placeholder="예: 497"
                        style="
                            width: 100%;
                            padding: 12px;
                            border: 1px solid #e5e5e5;
                            border-radius: 8px;
                            font-size: 16px;
                        "
                    />
                </div>

                <div style="margin-bottom: 24px;">
                    <label style="
                        display: block;
                        font-size: 14px;
                        font-weight: 600;
                        color: #1d1d1f;
                        margin-bottom: 8px;
                    ">테이블 번호</label>
                    <input 
                        type="number" 
                        id="quickTableNumber"
                        placeholder="예: 1"
                        style="
                            width: 100%;
                            padding: 12px;
                            border: 1px solid #e5e5e5;
                            border-radius: 8px;
                            font-size: 16px;
                        "
                    />
                </div>

                <button 
                    onclick="confirmQuickAccess()"
                    style="
                        width: 100%;
                        padding: 16px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border: none;
                        border-radius: 12px;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                        margin-bottom: 12px;
                    "
                >확인</button>

                <button 
                    onclick="closeQuickAccessModal()"
                    style="
                        width: 100%;
                        padding: 16px;
                        background: #f5f5f7;
                        color: #1d1d1f;
                        border: none;
                        border-radius: 12px;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                    "
                >취소</button>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modal);
};

// 빠른접근 모달 닫기
window.closeQuickAccessModal = function() {
    const modal = document.getElementById('quickAccessModal');
    if (modal) modal.remove();
};

// 빠른접근 확인
window.confirmQuickAccess = function() {
    const storeId = document.getElementById('quickStoreId').value;
    const tableNumber = document.getElementById('quickTableNumber').value;

    if (!storeId || !tableNumber) {
        alert('매장 ID와 테이블 번호를 모두 입력해주세요');
        return;
    }

    window.location.href = `/TLG-guest/qr.html?storeId=${storeId}&tableNumber=${tableNumber}`;
};


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

  // 비회원 TLL 주문 (QR 스캔 페이지로 이동)
  if (guestTLLBtn) {
    guestTLLBtn.addEventListener('click', () => {
      console.log('🎫 비회원 QR 주문 시스템으로 이동');
      // window.location.href = '/TLG-guest/qr.html'; // This line is replaced by the modal logic
      showQuickAccessModal(); // Call the modal to get storeId and tableNumber
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