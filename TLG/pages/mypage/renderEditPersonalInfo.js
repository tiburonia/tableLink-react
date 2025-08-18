
// 개인정보 수정 화면 렌더링 함수
async function renderEditPersonalInfo(userInfo) {
  console.log('✏️ 개인정보 수정 화면 렌더링 시작:', userInfo?.id);

  // 전역 userInfo 설정 (없으면 매개변수로 받은 값 사용)
  if (!window.userInfo && userInfo) {
    window.userInfo = userInfo;
    console.log('🔧 전역 userInfo 설정:', window.userInfo);
  }

  // 기존 이벤트 리스너 플래그 초기화
  window.editPersonalInfoEventListenersInitialized = false;

  const main = document.getElementById('main');

  // 전역 스타일 완전 리셋
  document.body.style.cssText = '';
  document.documentElement.style.cssText = '';

  // main 컨테이너도 리셋
  if (main) {
    main.style.cssText = '';
  }

  main.innerHTML = `
    <div class="edit-personal-info-wrapper">
      <!-- 상단 네비게이션 -->
      <header class="edit-header">
        <button class="back-btn" id="backBtn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15,18 9,12 15,6"></polyline>
          </svg>
        </button>
        <h1>개인정보 수정</h1>
        <button class="save-btn" id="saveBtn" disabled>
          <span>저장</span>
        </button>
      </header>

      <!-- 스크롤 가능한 컨텐츠 -->
      <div class="edit-content">
        <!-- 프로필 이미지 섹션 -->
        <div class="profile-image-section">
          <div class="profile-avatar-edit">
            <img id="profileImagePreview" src="" alt="프로필" class="avatar-img-edit">
            <button class="change-photo-btn" id="changePhotoBtn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
            </button>
          </div>
          <p class="photo-hint">프로필 사진을 변경하려면 카메라 버튼을 눌러주세요</p>
        </div>

        <!-- 개인정보 입력 폼 -->
        <div class="edit-form-container">
          <form id="personalInfoForm" class="edit-form">
            
            <!-- 기본 정보 섹션 -->
            <div class="form-section">
              <h3 class="section-title">
                <span class="section-icon">👤</span>
                기본 정보
              </h3>
              
              <div class="form-group">
                <label for="userName" class="form-label">이름 *</label>
                <input 
                  type="text" 
                  id="userName" 
                  name="name" 
                  class="form-input" 
                  placeholder="이름을 입력해주세요"
                  required
                >
                <div class="input-helper">실명을 입력해주세요</div>
              </div>

              <div class="form-group">
                <label for="userPhone" class="form-label">전화번호 *</label>
                <input 
                  type="tel" 
                  id="userPhone" 
                  name="phone" 
                  class="form-input" 
                  placeholder="010-0000-0000"
                  required
                >
                <div class="input-helper">주문 관련 연락을 위해 필요합니다</div>
              </div>

              <div class="form-group">
                <label for="userEmail" class="form-label">이메일</label>
                <input 
                  type="email" 
                  id="userEmail" 
                  name="email" 
                  class="form-input" 
                  placeholder="example@email.com"
                >
                <div class="input-helper">프로모션 및 알림 수신용 (선택)</div>
              </div>
            </div>

            <!-- 추가 정보 섹션 -->
            <div class="form-section">
              <h3 class="section-title">
                <span class="section-icon">📝</span>
                추가 정보
              </h3>

              <div class="form-group">
                <label for="userBirth" class="form-label">생년월일</label>
                <input 
                  type="date" 
                  id="userBirth" 
                  name="birth" 
                  class="form-input"
                >
                <div class="input-helper">생일 혜택을 받을 수 있습니다</div>
              </div>

              <div class="form-group">
                <label for="userGender" class="form-label">성별</label>
                <select id="userGender" name="gender" class="form-select">
                  <option value="">선택하지 않음</option>
                  <option value="male">남성</option>
                  <option value="female">여성</option>
                  <option value="other">기타</option>
                </select>
                <div class="input-helper">맞춤형 추천을 위해 사용됩니다</div>
              </div>
            </div>

            <!-- 주소 정보 섹션 -->
            <div class="form-section">
              <h3 class="section-title">
                <span class="section-icon">🏠</span>
                주소 정보
              </h3>

              <div class="form-group">
                <label for="userAddress" class="form-label">주소</label>
                <div class="address-input-group">
                  <input 
                    type="text" 
                    id="userAddress" 
                    name="address" 
                    class="form-input" 
                    placeholder="주소를 입력해주세요"
                    readonly
                  >
                  <button type="button" class="address-search-btn" id="addressSearchBtn">
                    <span>주소 검색</span>
                  </button>
                </div>
                <div class="input-helper">배달 주문 시 기본 주소로 사용됩니다</div>
              </div>

              <div class="form-group">
                <label for="userDetailAddress" class="form-label">상세 주소</label>
                <input 
                  type="text" 
                  id="userDetailAddress" 
                  name="detailAddress" 
                  class="form-input" 
                  placeholder="동, 호수 등 상세 주소를 입력해주세요"
                >
              </div>
            </div>

            <!-- 알림 설정 섹션 -->
            <div class="form-section">
              <h3 class="section-title">
                <span class="section-icon">🔔</span>
                알림 설정
              </h3>

              <div class="form-group checkbox-group">
                <label class="checkbox-label">
                  <input type="checkbox" id="emailNotifications" name="emailNotifications" class="form-checkbox">
                  <span class="checkbox-custom"></span>
                  <span class="checkbox-text">이메일 알림 수신</span>
                </label>
                <div class="input-helper">주문 상태, 프로모션 정보를 이메일로 받습니다</div>
              </div>

              <div class="form-group checkbox-group">
                <label class="checkbox-label">
                  <input type="checkbox" id="smsNotifications" name="smsNotifications" class="form-checkbox">
                  <span class="checkbox-custom"></span>
                  <span class="checkbox-text">SMS 알림 수신</span>
                </label>
                <div class="input-helper">주문 확인 및 배달 완료 SMS를 받습니다</div>
              </div>

              <div class="form-group checkbox-group">
                <label class="checkbox-label">
                  <input type="checkbox" id="pushNotifications" name="pushNotifications" class="form-checkbox">
                  <span class="checkbox-custom"></span>
                  <span class="checkbox-text">푸시 알림 수신</span>
                </label>
                <div class="input-helper">즉시 알림을 브라우저로 받습니다</div>
              </div>
            </div>

          </form>
        </div>

        <!-- 계정 관리 섹션 -->
        <div class="account-management-section">
          <h3 class="section-title danger">
            <span class="section-icon">⚠️</span>
            계정 관리
          </h3>
          
          <div class="danger-actions">
            <button type="button" class="danger-btn" id="changePasswordBtn">
              <span class="btn-icon">🔒</span>
              <span>비밀번호 변경</span>
            </button>
            
            <button type="button" class="danger-btn delete" id="deleteAccountBtn">
              <span class="btn-icon">🗑️</span>
              <span>계정 삭제</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <style>
      /* 전역 리셋 */
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        height: 100% !important;
        overflow: hidden !important;
        position: static !important;
        background: #f8fafc !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif !important;
      }

      #main {
        width: 390px !important;
        height: 760px !important;
        position: absolute !important;
        top: 50% !important;
        left: 50% !important;
        transform: translate(-50%, -50%) !important;
        background: #ffffff !important;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15) !important;
        border-radius: 16px !important;
        overflow: hidden !important;
      }

      .edit-personal-info-wrapper {
        height: 100%;
        display: flex;
        flex-direction: column;
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        position: relative;
      }

      /* 헤더 */
      .edit-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 20px 16px 20px;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(20px);
        border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        position: relative;
        z-index: 10;
      }

      .back-btn {
        width: 40px;
        height: 40px;
        border: none;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 12px;
        color: white;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .back-btn:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: scale(1.05);
      }

      .back-btn svg {
        width: 20px;
        height: 20px;
      }

      .edit-header h1 {
        color: white;
        font-size: 20px;
        font-weight: 600;
        margin: 0;
        text-align: center;
        flex: 1;
      }

      .save-btn {
        background: rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 12px;
        padding: 10px 16px;
        color: white;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        min-width: 60px;
      }

      .save-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .save-btn:not(:disabled):hover {
        background: rgba(255, 255, 255, 0.3);
        transform: scale(1.05);
      }

      .save-btn.changed {
        background: #10b981;
        border-color: #059669;
        box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
      }

      /* 스크롤 컨텐츠 */
      .edit-content {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        background: #f8fafc;
        border-radius: 24px 24px 0 0;
        margin-top: -16px;
        position: relative;
        z-index: 1;
      }

      .edit-content::-webkit-scrollbar {
        width: 6px;
      }

      .edit-content::-webkit-scrollbar-track {
        background: #f1f5f9;
        border-radius: 3px;
      }

      .edit-content::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 3px;
      }

      .edit-content::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }

      /* 프로필 이미지 섹션 */
      .profile-image-section {
        background: white;
        border-radius: 20px;
        padding: 24px;
        margin-bottom: 20px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        text-align: center;
      }

      .profile-avatar-edit {
        position: relative;
        display: inline-block;
        margin-bottom: 12px;
      }

      .avatar-img-edit {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        border: 4px solid #e5e7eb;
        object-fit: cover;
        transition: all 0.2s ease;
      }

      .change-photo-btn {
        position: absolute;
        bottom: 0;
        right: 0;
        width: 36px;
        height: 36px;
        background: #6366f1;
        border: 3px solid white;
        border-radius: 50%;
        color: white;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .change-photo-btn:hover {
        background: #5855eb;
        transform: scale(1.1);
      }

      .change-photo-btn svg {
        width: 16px;
        height: 16px;
      }

      .photo-hint {
        margin: 0;
        font-size: 12px;
        color: #6b7280;
      }

      /* 폼 컨테이너 */
      .edit-form-container {
        background: white;
        border-radius: 20px;
        margin-bottom: 20px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        overflow: hidden;
      }

      .edit-form {
        padding: 0;
      }

      /* 폼 섹션 */
      .form-section {
        padding: 24px;
        border-bottom: 1px solid #f1f5f9;
      }

      .form-section:last-child {
        border-bottom: none;
      }

      .section-title {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 0 0 20px 0;
        font-size: 18px;
        font-weight: 700;
        color: #111827;
      }

      .section-title.danger {
        color: #dc2626;
      }

      .section-icon {
        font-size: 20px;
      }

      /* 폼 그룹 */
      .form-group {
        margin-bottom: 20px;
      }

      .form-group:last-child {
        margin-bottom: 0;
      }

      .form-label {
        display: block;
        margin-bottom: 8px;
        font-size: 14px;
        font-weight: 600;
        color: #374151;
      }

      .form-input,
      .form-select {
        width: 100%;
        padding: 12px 16px;
        border: 2px solid #e5e7eb;
        border-radius: 12px;
        font-size: 14px;
        color: #111827;
        transition: all 0.2s ease;
        background: white;
        box-sizing: border-box;
      }

      .form-input:focus,
      .form-select:focus {
        outline: none;
        border-color: #6366f1;
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
      }

      .form-input:invalid {
        border-color: #ef4444;
      }

      .form-input::placeholder {
        color: #9ca3af;
      }

      .input-helper {
        margin-top: 6px;
        font-size: 12px;
        color: #6b7280;
        line-height: 1.4;
      }

      /* 주소 입력 그룹 */
      .address-input-group {
        display: flex;
        gap: 8px;
      }

      .address-input-group .form-input {
        flex: 1;
      }

      .address-search-btn {
        background: #6366f1;
        border: none;
        border-radius: 12px;
        padding: 12px 16px;
        color: white;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        white-space: nowrap;
      }

      .address-search-btn:hover {
        background: #5855eb;
        transform: translateY(-1px);
      }

      /* 체크박스 그룹 */
      .checkbox-group {
        margin-bottom: 16px;
      }

      .checkbox-label {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        cursor: pointer;
        font-size: 14px;
        color: #374151;
        line-height: 1.5;
      }

      .form-checkbox {
        display: none;
      }

      .checkbox-custom {
        width: 20px;
        height: 20px;
        border: 2px solid #e5e7eb;
        border-radius: 4px;
        background: white;
        position: relative;
        transition: all 0.2s ease;
        flex-shrink: 0;
        margin-top: 2px;
      }

      .form-checkbox:checked + .checkbox-custom {
        background: #6366f1;
        border-color: #6366f1;
      }

      .form-checkbox:checked + .checkbox-custom::after {
        content: '';
        position: absolute;
        left: 6px;
        top: 2px;
        width: 6px;
        height: 10px;
        border: solid white;
        border-width: 0 2px 2px 0;
        transform: rotate(45deg);
      }

      .checkbox-text {
        font-weight: 500;
      }

      /* 계정 관리 섹션 */
      .account-management-section {
        background: white;
        border-radius: 20px;
        padding: 24px;
        margin-bottom: 20px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        border: 2px solid #fecaca;
      }

      .danger-actions {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .danger-btn {
        background: #fee2e2;
        border: 1px solid #fecaca;
        border-radius: 12px;
        padding: 16px 20px;
        color: #dc2626;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 12px;
        justify-content: center;
      }

      .danger-btn:hover {
        background: #fecaca;
        border-color: #fca5a5;
      }

      .danger-btn.delete {
        background: #dc2626;
        border-color: #dc2626;
        color: white;
      }

      .danger-btn.delete:hover {
        background: #b91c1c;
        border-color: #b91c1c;
      }

      .btn-icon {
        font-size: 16px;
      }

      /* 반응형 */
      @media (max-width: 430px) {
        .edit-content {
          padding: 16px;
        }

        .form-section {
          padding: 20px;
        }

        .address-input-group {
          flex-direction: column;
        }

        .address-search-btn {
          align-self: flex-start;
        }
      }

      /* 애니메이션 */
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .form-section {
        animation: fadeInUp 0.4s ease-out;
      }

      .form-section:nth-child(2) {
        animation-delay: 0.1s;
      }

      .form-section:nth-child(3) {
        animation-delay: 0.2s;
      }

      .form-section:nth-child(4) {
        animation-delay: 0.3s;
      }
    </style>
  `;

  // DOM이 완전히 렌더링된 후 이벤트 리스너 설정 및 데이터 로드
  setTimeout(() => {
    console.log('✏️ renderEditPersonalInfo DOM 렌더링 완료');
    setupEditPersonalInfoEventListeners();
    loadUserDataForEdit(userInfo);
  }, 100);
}

// 이벤트 리스너 설정
function setupEditPersonalInfoEventListeners() {
  if (window.editPersonalInfoEventListenersInitialized) {
    console.log('⚠️ 개인정보 수정 이벤트 리스너가 이미 설정됨');
    return;
  }

  console.log('🔧 개인정보 수정 이벤트 리스너 설정 중...');

  // 뒤로가기 버튼
  const backBtn = document.getElementById('backBtn');
  if (backBtn) {
    backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof window.renderMyAccount === 'function') {
        window.renderMyAccount();
      } else {
        window.history.back();
      }
    });
  }

  // 저장 버튼
  const saveBtn = document.getElementById('saveBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', handleSavePersonalInfo);
  }

  // 프로필 사진 변경
  const changePhotoBtn = document.getElementById('changePhotoBtn');
  if (changePhotoBtn) {
    changePhotoBtn.addEventListener('click', handleChangePhoto);
  }

  // 주소 검색
  const addressSearchBtn = document.getElementById('addressSearchBtn');
  if (addressSearchBtn) {
    addressSearchBtn.addEventListener('click', handleAddressSearch);
  }

  // 비밀번호 변경
  const changePasswordBtn = document.getElementById('changePasswordBtn');
  if (changePasswordBtn) {
    changePasswordBtn.addEventListener('click', handleChangePassword);
  }

  // 계정 삭제
  const deleteAccountBtn = document.getElementById('deleteAccountBtn');
  if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener('click', handleDeleteAccount);
  }

  // 폼 입력 감지 (변경사항 있을 때 저장 버튼 활성화)
  const form = document.getElementById('personalInfoForm');
  if (form) {
    const inputs = form.querySelectorAll('input, select');
    inputs.forEach(input => {
      input.addEventListener('input', handleFormChange);
      input.addEventListener('change', handleFormChange);
    });
  }

  window.editPersonalInfoEventListenersInitialized = true;
  console.log('✅ 개인정보 수정 이벤트 리스너 설정 완료');
}

// 사용자 데이터 로드 및 폼 채우기
async function loadUserDataForEdit(userInfo) {
  try {
    console.log('📖 수정용 사용자 데이터 로드:', userInfo?.id);

    // 실제 API에서 사용자 정보 가져오기
    const response = await fetch('/api/users/info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: userInfo?.id || 'user1' })
    });

    if (!response.ok) throw new Error('사용자 정보 조회 실패');
    const userData = await response.json();
    const currentUserInfo = userData.user;

    // 프로필 이미지 설정
    const profileImagePreview = document.getElementById('profileImagePreview');
    if (profileImagePreview) {
      profileImagePreview.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUserInfo.name || currentUserInfo.id)}&background=6366f1&color=fff&size=200`;
    }

    // 폼 필드에 데이터 채우기
    const formFields = {
      userName: currentUserInfo.name || '',
      userPhone: currentUserInfo.phone || '',
      userEmail: currentUserInfo.email || `${currentUserInfo.id}@tablelink.com`,
      userBirth: '', // 생년월일 필드가 DB에 없으므로 빈값
      userGender: '', // 성별 필드가 DB에 없으므로 빈값
      userAddress: '', // 주소 필드가 DB에 없으므로 빈값
      userDetailAddress: ''
    };

    Object.entries(formFields).forEach(([fieldId, value]) => {
      const field = document.getElementById(fieldId);
      if (field) {
        field.value = value;
      }
    });

    // 알림 설정 (기본값으로 설정)
    const emailNotifications = document.getElementById('emailNotifications');
    const smsNotifications = document.getElementById('smsNotifications');
    const pushNotifications = document.getElementById('pushNotifications');

    if (emailNotifications) emailNotifications.checked = true;
    if (smsNotifications) smsNotifications.checked = true;
    if (pushNotifications) pushNotifications.checked = false;

    // 원본 데이터 저장 (변경사항 감지용)
    window.originalFormData = new FormData(document.getElementById('personalInfoForm'));

    console.log('✅ 사용자 데이터 로드 및 폼 채우기 완료');

  } catch (error) {
    console.error('❌ 사용자 데이터 로드 실패:', error);
    alert('사용자 정보를 불러오는데 실패했습니다.');
  }
}

// 폼 변경사항 감지
function handleFormChange() {
  const saveBtn = document.getElementById('saveBtn');
  if (!saveBtn) return;

  const form = document.getElementById('personalInfoForm');
  const currentFormData = new FormData(form);
  
  // 변경사항 있는지 확인
  let hasChanges = false;
  
  if (window.originalFormData) {
    for (let [key, value] of currentFormData.entries()) {
      if (window.originalFormData.get(key) !== value) {
        hasChanges = true;
        break;
      }
    }
  } else {
    hasChanges = true; // 원본 데이터가 없으면 변경된 것으로 간주
  }

  // 저장 버튼 상태 변경
  saveBtn.disabled = !hasChanges;
  if (hasChanges) {
    saveBtn.classList.add('changed');
  } else {
    saveBtn.classList.remove('changed');
  }
}

// 개인정보 저장
async function handleSavePersonalInfo() {
  try {
    const form = document.getElementById('personalInfoForm');
    const formData = new FormData(form);

    // 필수 필드 검증
    const name = formData.get('name');
    const phone = formData.get('phone');

    if (!name || !phone) {
      alert('이름과 전화번호는 필수 입력 항목입니다.');
      return;
    }

    // 전화번호 형식 검증
    const phoneRegex = /^01[0-9]-?[0-9]{4}-?[0-9]{4}$/;
    if (!phoneRegex.test(phone.replace(/-/g, ''))) {
      alert('올바른 전화번호 형식을 입력해주세요.');
      return;
    }

    console.log('💾 개인정보 저장 시작');

    // API 요청 데이터 구성
    const updateData = {
      userId: window.userInfo?.id || 'user1',
      name: name,
      phone: phone,
      email: formData.get('email') || null,
      birth: formData.get('birth') || null,
      gender: formData.get('gender') || null,
      address: formData.get('address') || null,
      detailAddress: formData.get('detailAddress') || null,
      notifications: {
        email: document.getElementById('emailNotifications')?.checked || false,
        sms: document.getElementById('smsNotifications')?.checked || false,
        push: document.getElementById('pushNotifications')?.checked || false
      }
    };

    console.log('🔄 개인정보 업데이트 요청 데이터:', updateData);

    // 저장 중 상태 표시
    const saveBtn = document.getElementById('saveBtn');
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<span>저장중...</span>';
    saveBtn.disabled = true;

    // API 호출 (올바른 엔드포인트 사용)
    const response = await fetch('/users/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `개인정보 저장 실패 (${response.status})`);
    }

    const result = await response.json();
    console.log('✅ 개인정보 저장 완료:', result);
    
    // 성공 상태 표시
    saveBtn.innerHTML = '<span>저장완료</span>';
    saveBtn.classList.remove('changed');
    
    // 원본 데이터 업데이트
    window.originalFormData = new FormData(form);

    // 2초 후 원래 상태로 복원
    setTimeout(() => {
      saveBtn.innerHTML = originalText;
      saveBtn.disabled = true;
    }, 2000);

    // 전역 사용자 정보 업데이트
    if (window.userInfo) {
      window.userInfo.name = name;
      window.userInfo.phone = phone;
      window.userInfo.email = formData.get('email');
    }

    console.log('✅ 전역 사용자 정보 업데이트 완료:', window.userInfo);

    alert('개인정보가 성공적으로 저장되었습니다.');

  } catch (error) {
    console.error('❌ 개인정보 저장 실패:', error);
    alert('개인정보 저장에 실패했습니다. 다시 시도해주세요.');
    
    // 저장 버튼 복원
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
      saveBtn.innerHTML = '<span>저장</span>';
      saveBtn.disabled = false;
    }
  }
}

// 프로필 사진 변경
function handleChangePhoto() {
  alert('프로필 사진 변경 기능은 개발 중입니다.');
}

// 주소 검색
function handleAddressSearch() {
  alert('주소 검색 기능은 개발 중입니다.\n직접 입력해주세요.');
  
  // 임시로 입력 필드 활성화
  const addressInput = document.getElementById('userAddress');
  if (addressInput) {
    addressInput.removeAttribute('readonly');
    addressInput.focus();
  }
}

// 비밀번호 변경
function handleChangePassword() {
  const newPassword = prompt('새 비밀번호를 입력하세요:');
  if (newPassword && newPassword.length >= 6) {
    alert('비밀번호가 변경되었습니다.');
  } else if (newPassword) {
    alert('비밀번호는 6자 이상이어야 합니다.');
  }
}

// 계정 삭제
function handleDeleteAccount() {
  const confirmed = confirm('정말로 계정을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.');
  
  if (confirmed) {
    const finalConfirm = confirm('모든 데이터가 영구적으로 삭제됩니다.\n정말 진행하시겠습니까?');
    
    if (finalConfirm) {
      alert('계정 삭제 기능은 개발 중입니다.\n고객센터로 문의해주세요.');
    }
  }
}

// 전역 함수 등록
window.renderEditPersonalInfo = renderEditPersonalInfo;

console.log('✅ renderEditPersonalInfo 스크립트 로드 완료');
