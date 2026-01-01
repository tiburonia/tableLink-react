/**
 * 내정보 관리 Controller
 * 이벤트 처리 및 비즈니스 로직 연결
 */

import accountSettingsView from '../views/accountSettingsView.js';

export const accountSettingsController = {
  /**
   * 초기화
   */
  async init() {
    console.log('🔧 accountSettingsController.init() 시작');

    try {
      // 사용자 정보 가져오기
      const userInfo = window.userInfo || {};
      
      // SNS 연동 상태 (더미 데이터)
      const snsConnections = {
        kakao: false,
        naver: false,
        apple: userInfo.email?.includes('appleid.com') || false
      };

      const viewModel = {
        userInfo,
        snsConnections
      };

      // 뷰 렌더링
      accountSettingsView.render(viewModel);

      // 이벤트 리스너 설정
      this.setupEventListeners();

      console.log('✅ accountSettingsController 초기화 완료');
    } catch (error) {
      console.error('❌ Controller 초기화 실패:', error);
      alert('페이지 로드 중 오류가 발생했습니다.');
    }
  },

  /**
   * 이벤트 리스너 설정
   */
  setupEventListeners() {
    // 뒤로가기
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
      backBtn.addEventListener('click', this.handleBack.bind(this));
    }

    // SNS 연동 버튼
    const kakaoBtn = document.getElementById('kakaoBtn');
    const naverBtn = document.getElementById('naverBtn');
    const appleBtn = document.getElementById('appleBtn');

    if (kakaoBtn) kakaoBtn.addEventListener('click', () => this.handleSNSConnect('kakao'));
    if (naverBtn) naverBtn.addEventListener('click', () => this.handleSNSConnect('naver'));
    if (appleBtn) appleBtn.addEventListener('click', () => this.handleSNSConnect('apple'));

    // 계정 정보 수정
    const nicknameRow = document.getElementById('nicknameRow');
    const emailRow = document.getElementById('emailRow');
    const phoneRow = document.getElementById('phoneRow');
    const passwordRow = document.getElementById('passwordRow');

    if (nicknameRow) nicknameRow.addEventListener('click', () => this.handleEditField('nickname'));
    if (emailRow) emailRow.addEventListener('click', () => this.handleEditField('email'));
    if (phoneRow) phoneRow.addEventListener('click', () => this.handleEditField('phone'));
    if (passwordRow) passwordRow.addEventListener('click', () => this.handleEditField('password'));

    // 하단 버튼
    const withdrawBtn = document.getElementById('withdrawBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    if (withdrawBtn) withdrawBtn.addEventListener('click', this.handleWithdraw.bind(this));
    if (logoutBtn) logoutBtn.addEventListener('click', this.handleLogout.bind(this));

    console.log('✅ 이벤트 리스너 설정 완료');
  },

  /**
   * 뒤로가기
   */
  handleBack() {
    if (typeof window.renderMyPage === 'function') {
      window.renderMyPage();
    } else if (typeof window.history !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      console.error('❌ 뒤로가기 실패');
    }
  },

  /**
   * SNS 연동 처리
   */
  async handleSNSConnect(snsType) {
    const snsNames = {
      kakao: '카카오톡',
      naver: '네이버',
      apple: '애플'
    };

    const button = document.querySelector(`[data-sns="${snsType}"]`);
    const isConnected = button?.classList.contains('connected');

    if (isConnected) {
      // 연동 해제
      if (confirm(`${snsNames[snsType]} 연동을 해제하시겠습니까?`)) {
        button.classList.remove('connected');
        alert(`${snsNames[snsType]} 연동이 해제되었습니다.`);
      }
    } else {
      // 연동 시작
      alert(`${snsNames[snsType]} 연동 기능은 개발 중입니다.`);
      // TODO: OAuth 연동 로직 구현
    }
  },

  /**
   * 계정 정보 수정
   */
  async handleEditField(fieldType) {
    const fieldNames = {
      nickname: '닉네임',
      email: '이메일',
      phone: '휴대폰번호',
      password: '비밀번호'
    };

    const currentValue = window.userInfo?.[fieldType] || '';
    
    if (fieldType === 'password') {
      // 비밀번호 변경 페이지로 이동
      this.showPasswordChangeModal();
      return;
    }

    const newValue = prompt(`새로운 ${fieldNames[fieldType]}을(를) 입력하세요`, currentValue);
    
    if (newValue && newValue !== currentValue) {
      // TODO: 서버에 업데이트 요청
      if (window.userInfo) {
        window.userInfo[fieldType] = newValue;
        
        // localStorage 업데이트
        localStorage.setItem('userInfo', JSON.stringify(window.userInfo));
        
        alert(`${fieldNames[fieldType]}이(가) 변경되었습니다.`);
        
        // 페이지 새로고침
        this.init();
      }
    }
  },

  /**
   * 비밀번호 변경 모달
   */
  showPasswordChangeModal() {
    const modalHTML = `
      <div class="modal-overlay-settings" id="passwordModal">
        <div class="modal-container-settings">
          <div class="modal-header-settings">
            <h3>비밀번호 변경</h3>
            <button class="modal-close-btn-settings" onclick="document.getElementById('passwordModal').remove()">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
          <div class="modal-body-settings">
            <div class="input-group-settings">
              <label>현재 비밀번호</label>
              <input type="password" id="currentPassword" placeholder="현재 비밀번호 입력">
            </div>
            <div class="input-group-settings">
              <label>새 비밀번호</label>
              <input type="password" id="newPassword" placeholder="새 비밀번호 입력">
            </div>
            <div class="input-group-settings">
              <label>새 비밀번호 확인</label>
              <input type="password" id="confirmPassword" placeholder="새 비밀번호 다시 입력">
            </div>
          </div>
          <div class="modal-footer-settings">
            <button class="cancel-btn-settings" onclick="document.getElementById('passwordModal').remove()">취소</button>
            <button class="confirm-btn-settings" id="confirmPasswordBtn">변경</button>
          </div>
        </div>
      </div>
      <style>
        .modal-overlay-settings {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 20px;
        }

        .modal-container-settings {
          background: white;
          border-radius: 24px;
          max-width: 400px;
          width: 100%;
          overflow: hidden;
        }

        .modal-header-settings {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 24px 16px 24px;
          border-bottom: 1px solid #f5f5f7;
        }

        .modal-header-settings h3 {
          margin: 0;
          font-size: 20px;
          font-weight: 800;
          color: #1d1d1f;
        }

        .modal-close-btn-settings {
          width: 36px;
          height: 36px;
          border: none;
          background: #f5f5f7;
          border-radius: 50%;
          color: #86868b;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-body-settings {
          padding: 24px;
        }

        .input-group-settings {
          margin-bottom: 20px;
        }

        .input-group-settings label {
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #1d1d1f;
        }

        .input-group-settings input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #e5e5e7;
          border-radius: 12px;
          font-size: 15px;
          box-sizing: border-box;
        }

        .input-group-settings input:focus {
          outline: none;
          border-color: #007aff;
        }

        .modal-footer-settings {
          display: flex;
          gap: 12px;
          padding: 16px 24px 24px 24px;
        }

        .cancel-btn-settings, .confirm-btn-settings {
          flex: 1;
          padding: 14px;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
        }

        .cancel-btn-settings {
          background: #f5f5f7;
          color: #1d1d1f;
        }

        .confirm-btn-settings {
          background: #007aff;
          color: white;
        }
      </style>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // 변경 버튼 이벤트
    const confirmBtn = document.getElementById('confirmPasswordBtn');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        const current = document.getElementById('currentPassword').value;
        const newPwd = document.getElementById('newPassword').value;
        const confirm = document.getElementById('confirmPassword').value;

        if (!current || !newPwd || !confirm) {
          alert('모든 필드를 입력해주세요.');
          return;
        }

        if (newPwd !== confirm) {
          alert('새 비밀번호가 일치하지 않습니다.');
          return;
        }

        if (newPwd.length < 6) {
          alert('비밀번호는 6자 이상이어야 합니다.');
          return;
        }

        // TODO: 서버에 비밀번호 변경 요청
        alert('비밀번호가 변경되었습니다.');
        document.getElementById('passwordModal').remove();
      });
    }
  },

  /**
   * 회원탈퇴
   */
  async handleWithdraw() {
    if (!confirm('정말 회원탈퇴 하시겠습니까?\n모든 데이터가 삭제되며 복구할 수 없습니다.')) {
      return;
    }

    const password = prompt('비밀번호를 입력하여 본인 확인을 해주세요:');
    
    if (!password) {
      return;
    }

    // TODO: 서버에 회원탈퇴 요청
    alert('회원탈퇴가 완료되었습니다.');
    
    // 로그아웃 처리
    this.handleLogout(true);
  },

  /**
   * 로그아웃
   */
  async handleLogout(skipConfirm = false) {
    if (!skipConfirm && !confirm('로그아웃 하시겠습니까?')) {
      return;
    }

    try {
      // 전역 로그아웃 함수 사용
      if (typeof window.logOutF === 'function') {
        window.logOutF();
      } else {
        // 수동 로그아웃
        window.userInfo = null;
        localStorage.removeItem('userInfo');
        localStorage.clear();
        
        // 쿠키 삭제
        document.cookie = 'userInfo=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
        
        // 로그인 페이지로 이동
        if (typeof window.renderLogin === 'function') {
          window.renderLogin();
        } else {
          window.location.href = '/';
        }
      }
    } catch (error) {
      console.error('❌ 로그아웃 오류:', error);
      window.location.reload();
    }
  }
};

export default accountSettingsController;
