
async function renderAllCoupons(userInfo) {
  console.log('🎫 쿠폰함 전체보기 렌더링 시작:', userInfo);

  const main = document.getElementById('main');

  // 전역 스타일 완전 리셋
  document.body.style.cssText = '';
  document.documentElement.style.cssText = '';

  if (main) {
    main.style.cssText = '';
  }

  main.innerHTML = `
    <div class="coupons-wrapper">
      <!-- 상단 네비게이션 -->
      <header class="coupons-header">
        <button class="back-btn" id="backBtn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15,18 9,12 15,6"></polyline>
          </svg>
        </button>
        <h1>🎫 내 쿠폰함</h1>
        <div class="header-spacer"></div>
      </header>

      <!-- 스크롤 가능한 컨텐츠 -->
      <div class="coupons-content">
        <!-- 쿠폰 통계 카드 -->
        <div class="coupon-stats-card">
          <div class="stat-item">
            <div class="stat-number skeleton-stat-number" id="unusedCouponCount">-</div>
            <div class="stat-label">사용 가능</div>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <div class="stat-number skeleton-stat-number" id="usedCouponCount">-</div>
            <div class="stat-label">사용 완료</div>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <div class="stat-number skeleton-stat-number" id="totalSavings">-</div>
            <div class="stat-label">총 절약</div>
          </div>
        </div>

        <!-- 사용 가능한 쿠폰 섹션 -->
        <div class="section-card">
          <div class="section-header">
            <h3>💝 사용 가능한 쿠폰</h3>
            <span class="coupon-count" id="availableCouponCount">0개</span>
          </div>
          <div id="unusedCouponsList" class="coupons-list">
            <!-- 스켈레톤 로딩 -->
            <div class="skeleton-coupons-list">
              <div class="skeleton-coupon-item">
                <div class="skeleton-coupon-header">
                  <div class="skeleton-coupon-name"></div>
                  <div class="skeleton-coupon-discount"></div>
                </div>
                <div class="skeleton-coupon-details">
                  <div class="skeleton-coupon-line"></div>
                  <div class="skeleton-coupon-line short"></div>
                </div>
              </div>
              <div class="skeleton-coupon-item">
                <div class="skeleton-coupon-header">
                  <div class="skeleton-coupon-name"></div>
                  <div class="skeleton-coupon-discount"></div>
                </div>
                <div class="skeleton-coupon-details">
                  <div class="skeleton-coupon-line"></div>
                  <div class="skeleton-coupon-line short"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 사용 완료 쿠폰 섹션 -->
        <div class="section-card">
          <div class="section-header">
            <h3>📝 사용 완료 쿠폰</h3>
            <span class="coupon-count" id="usedCouponCountDisplay">0개</span>
          </div>
          <div id="usedCouponsList" class="coupons-list">
            <!-- 스켈레톤 로딩 -->
            <div class="skeleton-coupons-list">
              <div class="skeleton-coupon-item">
                <div class="skeleton-coupon-header">
                  <div class="skeleton-coupon-name"></div>
                  <div class="skeleton-coupon-discount"></div>
                </div>
                <div class="skeleton-coupon-details">
                  <div class="skeleton-coupon-line"></div>
                  <div class="skeleton-coupon-line short"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 쿠폰 이용 안내 -->
        <div class="coupon-guide-card">
          <h4>🔍 쿠폰 이용 안내</h4>
          <ul>
            <li>쿠폰은 결제 시 자동으로 적용됩니다</li>
            <li>중복 사용이 불가능한 쿠폰이 있습니다</li>
            <li>최소 주문 금액을 확인해주세요</li>
            <li>유효기간이 지난 쿠폰은 자동으로 삭제됩니다</li>
          </ul>
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

      .coupons-wrapper {
        height: 100%;
        display: flex;
        flex-direction: column;
        background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
        position: relative;
      }

      /* 헤더 */
      .coupons-header {
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

      .coupons-header h1 {
        color: white;
        font-size: 20px;
        font-weight: 600;
        margin: 0;
        text-align: center;
        flex: 1;
      }

      .header-spacer {
        width: 40px;
      }

      /* 스크롤 컨텐츠 */
      .coupons-content {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        background: #f8fafc;
        border-radius: 24px 24px 0 0;
        margin-top: -16px;
        position: relative;
        z-index: 1;
      }

      .coupons-content::-webkit-scrollbar {
        width: 0;
      }

      /* 쿠폰 통계 카드 */
      .coupon-stats-card {
        background: white;
        border-radius: 20px;
        padding: 24px;
        margin-bottom: 20px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0;
        position: relative;
        overflow: hidden;
      }

      .coupon-stats-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, #fbbf24, #f59e0b);
      }

      .stat-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        flex: 1;
      }

      .stat-number {
        font-size: 24px;
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 4px;
      }

      .stat-label {
        font-size: 12px;
        color: #6b7280;
        font-weight: 500;
      }

      /* 통계 스켈레톤 */
      .skeleton-stat-number {
        position: relative;
        overflow: hidden;
      }

      .skeleton-stat-number::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(
          90deg,
          transparent 0%,
          rgba(255, 255, 255, 0.6) 50%,
          transparent 100%
        );
        animation: statShimmer 2s infinite;
      }

      @keyframes statShimmer {
        0% {
          left: -100%;
        }
        100% {
          left: 100%;
        }
      }

      .stat-divider {
        width: 1px;
        height: 32px;
        background: #e5e7eb;
        margin: 0 16px;
      }

      /* 섹션 카드 */
      .section-card {
        background: white;
        border-radius: 16px;
        padding: 20px;
        margin-bottom: 16px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }

      .section-header h3 {
        font-size: 16px;
        font-weight: 600;
        color: #111827;
        margin: 0;
      }

      .coupon-count {
        background: #f3f4f6;
        color: #6b7280;
        padding: 4px 8px;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 600;
      }

      /* 쿠폰 리스트 */
      .coupons-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .coupon-item {
        background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
        border: 2px dashed #f59e0b;
        border-radius: 12px;
        padding: 16px;
        position: relative;
        overflow: hidden;
        transition: all 0.2s ease;
      }

      .coupon-item:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(245, 158, 11, 0.2);
      }

      .coupon-item.used {
        background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
        border-color: #d1d5db;
        opacity: 0.7;
      }

      .coupon-item.used:hover {
        transform: none;
        box-shadow: none;
      }

      .coupon-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 12px;
      }

      .coupon-name {
        font-weight: 700;
        color: #92400e;
        font-size: 16px;
        line-height: 1.2;
        flex: 1;
        margin-right: 12px;
      }

      .coupon-item.used .coupon-name {
        color: #6b7280;
      }

      .coupon-discount {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        color: white;
        padding: 6px 12px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 700;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        white-space: nowrap;
      }

      .coupon-item.used .coupon-discount {
        background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
      }

      .coupon-details {
        display: flex;
        flex-direction: column;
        gap: 6px;
        font-size: 12px;
        color: #78716c;
      }

      .coupon-item.used .coupon-details {
        color: #9ca3af;
      }

      .coupon-condition {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .coupon-expiry {
        font-weight: 600;
        color: #dc2626;
      }

      .coupon-item.used .coupon-expiry {
        color: #9ca3af;
      }

      .coupon-used-info {
        background: rgba(255, 255, 255, 0.8);
        border-radius: 8px;
        padding: 8px 12px;
        margin-top: 8px;
        font-size: 11px;
        color: #6b7280;
        border: 1px solid rgba(107, 114, 128, 0.2);
      }

      /* 쿠폰 이용 안내 */
      .coupon-guide-card {
        background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
        border-radius: 16px;
        padding: 20px;
        border: 1px solid #bfdbfe;
        margin-bottom: 20px;
      }

      .coupon-guide-card h4 {
        margin: 0 0 12px 0;
        font-size: 16px;
        font-weight: 600;
        color: #1e40af;
      }

      .coupon-guide-card ul {
        margin: 0;
        padding: 0;
        list-style: none;
      }

      .coupon-guide-card li {
        position: relative;
        padding-left: 20px;
        margin-bottom: 8px;
        font-size: 13px;
        color: #1e40af;
        line-height: 1.4;
      }

      .coupon-guide-card li::before {
        content: '•';
        position: absolute;
        left: 0;
        color: #3b82f6;
        font-weight: bold;
      }

      /* 로딩 스켈레톤 */
      .loading-skeleton {
        background: #f3f4f6;
        border-radius: 8px;
        padding: 20px;
        text-align: center;
        color: #9ca3af;
        font-style: italic;
      }

      /* 쿠폰 스켈레톤 */
      .skeleton-coupons-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .skeleton-coupon-item {
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        border: 2px dashed #e5e7eb;
        border-radius: 12px;
        padding: 16px;
        position: relative;
        overflow: hidden;
      }

      .skeleton-coupon-item::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(
          90deg,
          transparent 0%,
          rgba(255, 255, 255, 0.4) 50%,
          transparent 100%
        );
        animation: skeletonShimmer 2s infinite;
      }

      .skeleton-coupon-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 12px;
      }

      .skeleton-coupon-name {
        width: 120px;
        height: 16px;
        background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
        background-size: 200% 100%;
        border-radius: 4px;
        animation: skeletonPulse 1.8s ease-in-out infinite;
      }

      .skeleton-coupon-discount {
        width: 70px;
        height: 24px;
        background: linear-gradient(90deg, #d1d5db 25%, #e5e7eb 50%, #d1d5db 75%);
        background-size: 200% 100%;
        border-radius: 8px;
        animation: skeletonPulse 1.8s ease-in-out infinite;
        animation-delay: 0.2s;
      }

      .skeleton-coupon-details {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .skeleton-coupon-line {
        height: 12px;
        background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
        background-size: 200% 100%;
        border-radius: 4px;
        animation: skeletonPulse 1.8s ease-in-out infinite;
        animation-delay: 0.4s;
      }

      .skeleton-coupon-line:first-child {
        width: 85%;
      }

      .skeleton-coupon-line.short {
        width: 60%;
        animation-delay: 0.6s;
      }

      @keyframes skeletonShimmer {
        0% {
          left: -100%;
        }
        100% {
          left: 100%;
        }
      }

      @keyframes skeletonPulse {
        0%, 100% {
          opacity: 1;
        }
        50% {
          opacity: 0.6;
        }
      }

      /* 빈 상태 */
      .empty-state {
        text-align: center;
        padding: 40px 20px;
        color: #64748b;
      }

      .empty-state-icon {
        font-size: 48px;
        margin-bottom: 16px;
        display: block;
      }

      .empty-state-title {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 8px;
        color: #1e293b;
      }

      .empty-state-description {
        font-size: 14px;
        line-height: 1.5;
      }

      /* 반응형 */
      @media (max-width: 430px) {
        .coupons-content {
          padding: 16px;
        }

        .coupon-stats-card {
          padding: 20px;
        }

        .coupon-item {
          padding: 14px;
        }

        .coupon-name {
          font-size: 15px;
        }

        .coupon-discount {
          font-size: 13px;
          padding: 5px 10px;
        }
      }
    </style>
  `;

  // DOM이 완전히 렌더링된 후 이벤트 리스너 설정
  setTimeout(() => {
    console.log('🎫 쿠폰함 DOM 렌더링 완료, 이벤트 리스너 설정 시작');
    setupCouponsEventListeners();
    loadCouponsData(userInfo);
  }, 100);
}

// 쿠폰함 이벤트 리스너 설정
function setupCouponsEventListeners() {
  console.log('🔧 쿠폰함 이벤트 리스너 등록 중...');

  const backBtn = document.getElementById('backBtn');
  if (backBtn) {
    backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('🔙 쿠폰함 뒤로가기 버튼 클릭됨');
      
      // 이전 화면 정보 확인하여 적절한 화면으로 돌아가기
      if (window.previousScreen === 'renderMyPage') {
        if (typeof window.renderMyPage === 'function') {
          window.renderMyPage();
        } else {
          window.history.back();
        }
      } else if (window.previousScreen === 'renderMyAccount') {
        if (typeof window.renderMyAccount === 'function') {
          window.renderMyAccount();
        } else {
          window.history.back();
        }
      } else {
        // 기본적으로 마이페이지로 이동
        if (typeof window.renderMyPage === 'function') {
          window.renderMyPage();
        } else {
          window.history.back();
        }
      }
    });
    console.log('✅ 뒤로가기 버튼 이벤트 리스너 등록 완료');
  }
}

// 쿠폰 데이터 로드
async function loadCouponsData(userInfo) {
  try {
    console.log('📖 쿠폰 데이터 로드 시작:', userInfo.id);

    // 사용자 정보에서 쿠폰 데이터 가져오기
    const response = await fetch('/api/users/info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: userInfo.id })
    });

    if (!response.ok) throw new Error('사용자 정보 조회 실패');
    
    const userData = await response.json();
    const currentUserInfo = userData.user;

    console.log('✅ 사용자 정보 로드:', currentUserInfo);

    // 쿠폰 데이터 파싱
    let couponsData = { unused: [], used: [] };
    try {
      if (currentUserInfo.coupons) {
        if (typeof currentUserInfo.coupons === 'string') {
          couponsData = JSON.parse(currentUserInfo.coupons);
        } else {
          couponsData = currentUserInfo.coupons;
        }
      }
    } catch (parseError) {
      console.warn('쿠폰 데이터 파싱 실패:', parseError);
      couponsData = { unused: [], used: [] };
    }

    console.log('📊 쿠폰 데이터:', couponsData);

    // UI 업데이트
    updateCouponStats(couponsData);
    updateUnusedCoupons(couponsData.unused || []);
    updateUsedCoupons(couponsData.used || []);

    console.log('✅ 쿠폰 데이터 로드 및 UI 업데이트 완료');

  } catch (error) {
    console.error('❌ 쿠폰 데이터 로드 실패:', error);
    
    // 오류 시 빈 데이터로 표시
    const emptyCoupons = { unused: [], used: [] };
    updateCouponStats(emptyCoupons);
    updateUnusedCoupons([]);
    updateUsedCoupons([]);
    
    // 오류 메시지 표시
    document.getElementById('unusedCouponsList').innerHTML = `
      <div class="empty-state">
        <span class="empty-state-icon">⚠️</span>
        <div class="empty-state-title">쿠폰 정보를 불러올 수 없습니다</div>
        <div class="empty-state-description">잠시 후 다시 시도해주세요</div>
      </div>
    `;
  }
}

// 쿠폰 통계 업데이트
function updateCouponStats(couponsData) {
  const unusedCouponCount = document.getElementById('unusedCouponCount');
  const usedCouponCount = document.getElementById('usedCouponCount');
  const totalSavings = document.getElementById('totalSavings');

  const unusedCount = (couponsData.unused || []).length;
  const usedCount = (couponsData.used || []).length;
  
  // 총 절약 금액 계산 (사용완료 쿠폰 기준)
  let totalSavingsAmount = 0;
  (couponsData.used || []).forEach(coupon => {
    if (coupon.discountType === 'percent') {
      // 퍼센트 할인의 경우 정확한 절약 금액을 모르므로 추정값 사용
      totalSavingsAmount += (coupon.discountValue || 0) * 100; // 임시 계산
    } else {
      totalSavingsAmount += (coupon.discountValue || 0);
    }
  });

  if (unusedCouponCount) unusedCouponCount.textContent = unusedCount;
  if (usedCouponCount) usedCouponCount.textContent = usedCount;
  if (totalSavings) totalSavings.textContent = `${totalSavingsAmount.toLocaleString()}원`;

  // 섹션별 카운트도 업데이트
  const availableCouponCount = document.getElementById('availableCouponCount');
  const usedCouponCountDisplay = document.getElementById('usedCouponCountDisplay');
  
  if (availableCouponCount) availableCouponCount.textContent = `${unusedCount}개`;
  if (usedCouponCountDisplay) usedCouponCountDisplay.textContent = `${usedCount}개`;
}

// 사용 가능한 쿠폰 업데이트
function updateUnusedCoupons(unusedCoupons) {
  const unusedCouponsList = document.getElementById('unusedCouponsList');
  if (!unusedCouponsList) return;

  if (unusedCoupons.length === 0) {
    unusedCouponsList.innerHTML = `
      <div class="empty-state">
        <span class="empty-state-icon">🎫</span>
        <div class="empty-state-title">사용 가능한 쿠폰이 없습니다</div>
        <div class="empty-state-description">새로운 쿠폰이 발급되면 알려드리겠습니다!</div>
      </div>
    `;
    return;
  }

  unusedCouponsList.innerHTML = unusedCoupons.map(coupon => {
    const discountText = coupon.discountType === 'percent' 
      ? `${coupon.discountValue}% 할인`
      : `${(coupon.discountValue || 0).toLocaleString()}원 할인`;

    return `
      <div class="coupon-item">
        <div class="coupon-header">
          <div class="coupon-name">${coupon.name || '쿠폰'}</div>
          <div class="coupon-discount">${discountText}</div>
        </div>
        <div class="coupon-details">
          <div class="coupon-condition">
            <span>💰 최소주문: ${(coupon.minOrderAmount || 0).toLocaleString()}원</span>
          </div>
          <div class="coupon-condition">
            <span class="coupon-expiry">⏰ ${coupon.validUntil || '기한 없음'}까지</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// 사용 완료 쿠폰 업데이트
function updateUsedCoupons(usedCoupons) {
  const usedCouponsList = document.getElementById('usedCouponsList');
  if (!usedCouponsList) return;

  if (usedCoupons.length === 0) {
    usedCouponsList.innerHTML = `
      <div class="empty-state">
        <span class="empty-state-icon">📝</span>
        <div class="empty-state-title">사용한 쿠폰이 없습니다</div>
        <div class="empty-state-description">쿠폰을 사용하면 여기에 기록됩니다</div>
      </div>
    `;
    return;
  }

  usedCouponsList.innerHTML = usedCoupons.map(coupon => {
    const discountText = coupon.discountType === 'percent' 
      ? `${coupon.discountValue}% 할인`
      : `${(coupon.discountValue || 0).toLocaleString()}원 할인`;

    return `
      <div class="coupon-item used">
        <div class="coupon-header">
          <div class="coupon-name">${coupon.name || '쿠폰'}</div>
          <div class="coupon-discount">${discountText}</div>
        </div>
        <div class="coupon-details">
          <div class="coupon-condition">
            <span>💰 최소주문: ${(coupon.minOrderAmount || 0).toLocaleString()}원</span>
          </div>
        </div>
        <div class="coupon-used-info">
          <div>📅 사용일: ${coupon.usedDate || '알 수 없음'}</div>
          ${coupon.store ? `<div>🏪 사용처: ${coupon.store}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

// 전역 함수 등록
window.renderAllCoupons = renderAllCoupons;
