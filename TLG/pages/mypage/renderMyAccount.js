
// 더미 데이터 생성 함수
function generateDummyData(userId) {
  return {
    id: userId,
    name: '김테이블',
    phone: '010-1234-5678',
    email: 'tablelink@gmail.com',
    address: '서울특별시 강남구 테헤란로 123',
    birth: '1990.05.15',
    gender: '남성',
    point: 25600,
    vipLevel: 'GOLD',
    joinDate: '2023.03.15',
    totalOrders: 47,
    totalSpent: 892000,
    profileImage: 'https://ui-avatars.com/api/?name=김테이블&background=297efc&color=fff&size=128',
    orderList: [
      {
        id: 1,
        store: '스타벅스 강남점',
        items: [
          { name: '아메리카노', qty: 2, price: 4500 },
          { name: '카라멜마키아또', qty: 1, price: 6500 }
        ],
        total: 15500,
        date: '2024.01.25',
        status: '완료',
        reviewId: 1
      },
      {
        id: 2,
        store: '맥도날드 역삼점',
        items: [
          { name: '빅맥세트', qty: 1, price: 8900 },
          { name: '치킨너겟 4조각', qty: 1, price: 3500 }
        ],
        total: 12400,
        date: '2024.01.23',
        status: '완료',
        reviewId: null
      },
      {
        id: 3,
        store: '투썸플레이스 선릉점',
        items: [
          { name: '딸기케이크', qty: 1, price: 7500 },
          { name: '아이스티', qty: 2, price: 4000 }
        ],
        total: 15500,
        date: '2024.01.20',
        status: '완료',
        reviewId: 2
      }
    ],
    reservationList: [
      {
        store: '오마카세 스시젠',
        date: '2024.02.14 19:00',
        people: 2,
        status: '예약완료',
        phone: '02-1234-5678'
      },
      {
        store: '한우마을 본점',
        date: '2024.02.10 18:30',
        people: 4,
        status: '방문완료',
        phone: '02-9876-5432'
      }
    ],
    coupons: {
      unused: [
        {
          name: '신규가입 웰컴쿠폰',
          discountValue: 5000,
          discountType: 'won',
          validUntil: '2024.03.31',
          minOrder: 20000
        },
        {
          name: 'VIP 등급업 축하쿠폰',
          discountValue: 15,
          discountType: 'percent',
          validUntil: '2024.02.29',
          minOrder: 30000
        },
        {
          name: '리뷰작성 감사쿠폰',
          discountValue: 3000,
          discountType: 'won',
          validUntil: '2024.04.15',
          minOrder: 15000
        }
      ],
      used: [
        {
          name: '첫 주문 할인쿠폰',
          discountValue: 10,
          discountType: 'percent',
          usedDate: '2024.01.20',
          store: '투썸플레이스 선릉점'
        }
      ]
    },
    favoriteStores: [
      '스타벅스 강남점',
      '맥도날드 역삼점',
      '투썸플레이스 선릉점',
      '오마카세 스시젠',
      '한우마을 본점'
    ],
    achievements: [
      { name: '첫 주문 달성', icon: '🎉', date: '2023.03.15' },
      { name: '10회 주문 달성', icon: '🏆', date: '2023.06.20' },
      { name: '리뷰왕', icon: '⭐', date: '2023.09.10' },
      { name: 'VIP 등급 달성', icon: '👑', date: '2023.12.01' }
    ],
    monthlyStats: {
      currentMonth: {
        orders: 8,
        spent: 127500,
        savedMoney: 15200
      },
      lastMonth: {
        orders: 12,
        spent: 189300,
        savedMoney: 22100
      }
    }
  };
}

async function renderMyAccount() {
  console.log('🔧 renderMyAccount 시작');
  
  const main = document.getElementById('main');

  // body와 html의 스크롤 강제 활성화
  document.body.style.overflow = 'auto';
  document.documentElement.style.overflow = 'auto';

  // UI 프레임을 먼저 렌더링 (로딩 상태)
  main.innerHTML = `
    <div class="account-container">
      <button id="backBtn" class="back-button">←</button>
      
      <div class="account-content">
        <!-- 프로필 헤더 -->
        <div class="profile-header">
          <div class="profile-image-wrapper">
            <img id="profileImage" src="" alt="프로필" class="profile-image">
            <div class="vip-badge" id="vipBadge">
              <span class="vip-text">GOLD</span>
            </div>
          </div>
          <div class="profile-info">
            <h1 class="user-name" id="userName">로딩중...</h1>
            <p class="user-email" id="userEmail">이메일을 불러오는 중...</p>
            <div class="user-stats">
              <div class="stat-item">
                <span class="stat-number" id="totalOrders">-</span>
                <span class="stat-label">총 주문</span>
              </div>
              <div class="stat-item">
                <span class="stat-number" id="currentPoints">-</span>
                <span class="stat-label">포인트</span>
              </div>
              <div class="stat-item">
                <span class="stat-number" id="vipLevel">-</span>
                <span class="stat-label">등급</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 이번 달 활동 요약 -->
        <div class="monthly-summary">
          <h3>📊 이번 달 활동</h3>
          <div class="summary-grid">
            <div class="summary-item orders">
              <div class="summary-icon">🛍️</div>
              <div class="summary-content">
                <div class="summary-number" id="monthlyOrders">-</div>
                <div class="summary-label">주문</div>
              </div>
            </div>
            <div class="summary-item spent">
              <div class="summary-icon">💰</div>
              <div class="summary-content">
                <div class="summary-number" id="monthlySpent">-</div>
                <div class="summary-label">사용금액</div>
              </div>
            </div>
            <div class="summary-item saved">
              <div class="summary-icon">🎁</div>
              <div class="summary-content">
                <div class="summary-number" id="monthlySaved">-</div>
                <div class="summary-label">절약금액</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 퀵 액션 -->
        <div class="quick-actions">
          <button class="quick-action-btn" id="editProfileBtn">
            <span class="action-icon">👤</span>
            <span class="action-text">프로필 수정</span>
          </button>
          <button class="quick-action-btn" id="couponBtn">
            <span class="action-icon">🎫</span>
            <span class="action-text">쿠폰함</span>
            <span class="notification-badge" id="couponBadge">3</span>
          </button>
          <button class="quick-action-btn" id="favoritesBtn">
            <span class="action-icon">⭐</span>
            <span class="action-text">즐겨찾기</span>
          </button>
          <button class="quick-action-btn" id="achievementsBtn">
            <span class="action-icon">🏆</span>
            <span class="action-text">업적</span>
          </button>
        </div>

        <!-- 최근 주문 내역 -->
        <div class="recent-orders">
          <div class="section-header">
            <h3>📦 최근 주문</h3>
            <button class="view-all-btn" id="viewAllOrdersBtn">전체보기</button>
          </div>
          <div class="orders-list" id="recentOrdersList">
            <div class="loading-placeholder">주문 내역을 불러오는 중...</div>
          </div>
        </div>

        <!-- 예약 내역 -->
        <div class="reservations">
          <div class="section-header">
            <h3>📅 예약 관리</h3>
            <button class="view-all-btn" id="viewAllReservationsBtn">전체보기</button>
          </div>
          <div class="reservations-list" id="reservationsList">
            <div class="loading-placeholder">예약 정보를 불러오는 중...</div>
          </div>
        </div>

        <!-- 개인정보 카드 -->
        <div class="personal-info">
          <div class="section-header">
            <h3>📋 개인정보</h3>
            <button class="edit-btn" id="editPersonalInfoBtn">수정</button>
          </div>
          <div class="info-grid" id="personalInfoGrid">
            <div class="loading-placeholder">개인정보를 불러오는 중...</div>
          </div>
        </div>

        <!-- 하단 액션 버튼들 -->
        <div class="bottom-actions">
          <button class="primary-button" id="backToMyPageBtn">
            마이페이지로 돌아가기
          </button>
          <button class="secondary-button" id="logoutBtn">
            로그아웃
          </button>
        </div>
      </div>
    </div>

    <style>
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      html, body {
        overflow: auto !important;
        height: auto !important;
        position: static !important;
      }

      .account-container {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        min-height: 100vh;
        position: static;
        overflow: visible;
        padding-bottom: 40px;
      }

      .back-button {
        position: fixed;
        top: 20px;
        left: 20px;
        width: 48px;
        height: 48px;
        border: none;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-radius: 50%;
        font-size: 20px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #667eea;
        transition: all 0.3s ease;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        z-index: 1000;
      }

      .back-button:hover {
        background: rgba(255, 255, 255, 1);
        transform: scale(1.05);
        box-shadow: 0 6px 25px rgba(0, 0, 0, 0.15);
      }

      .account-content {
        padding: 80px 20px 40px 20px;
        max-width: 430px;
        margin: 0 auto;
        overflow: visible;
        position: static;
        height: auto;
      }

      .profile-header {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(20px);
        border-radius: 24px;
        padding: 30px 25px;
        margin-bottom: 20px;
        display: flex;
        align-items: center;
        gap: 20px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      }

      .profile-image-wrapper {
        position: relative;
        flex-shrink: 0;
      }

      .profile-image {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        border: 4px solid #fff;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      }

      .vip-badge {
        position: absolute;
        bottom: -5px;
        right: -5px;
        background: linear-gradient(45deg, #ffd700, #ffed4e);
        color: #333;
        font-size: 10px;
        font-weight: bold;
        padding: 4px 8px;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3);
      }

      .profile-info {
        flex: 1;
      }

      .user-name {
        font-size: 24px;
        font-weight: 700;
        color: #333;
        margin-bottom: 4px;
      }

      .user-email {
        color: #666;
        font-size: 14px;
        margin-bottom: 16px;
      }

      .user-stats {
        display: flex;
        gap: 16px;
      }

      .stat-item {
        text-align: center;
      }

      .stat-number {
        display: block;
        font-size: 16px;
        font-weight: bold;
        color: #667eea;
      }

      .stat-label {
        font-size: 11px;
        color: #999;
        margin-top: 2px;
      }

      .monthly-summary {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(20px);
        border-radius: 20px;
        padding: 24px;
        margin-bottom: 20px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      }

      .monthly-summary h3 {
        color: #333;
        font-size: 18px;
        margin-bottom: 16px;
        font-weight: 600;
      }

      .summary-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
      }

      .summary-item {
        background: linear-gradient(135deg, #f8f9fa, #e9ecef);
        border-radius: 16px;
        padding: 16px 12px;
        text-align: center;
        transition: transform 0.2s ease;
      }

      .summary-item:hover {
        transform: translateY(-2px);
      }

      .summary-item.orders {
        background: linear-gradient(135deg, #e3f2fd, #bbdefb);
      }

      .summary-item.spent {
        background: linear-gradient(135deg, #fff3e0, #ffcc80);
      }

      .summary-item.saved {
        background: linear-gradient(135deg, #e8f5e8, #c8e6c9);
      }

      .summary-icon {
        font-size: 20px;
        margin-bottom: 8px;
      }

      .summary-number {
        font-size: 16px;
        font-weight: bold;
        color: #333;
      }

      .summary-label {
        font-size: 12px;
        color: #666;
        margin-top: 4px;
      }

      .quick-actions {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        margin-bottom: 20px;
      }

      .quick-action-btn {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(20px);
        border: none;
        border-radius: 16px;
        padding: 20px 16px;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
      }

      .quick-action-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
      }

      .action-icon {
        font-size: 24px;
      }

      .action-text {
        font-size: 14px;
        font-weight: 500;
        color: #333;
      }

      .notification-badge {
        position: absolute;
        top: 12px;
        right: 12px;
        background: #ff4757;
        color: white;
        font-size: 10px;
        font-weight: bold;
        padding: 2px 6px;
        border-radius: 10px;
        min-width: 16px;
        text-align: center;
      }

      .recent-orders, .reservations, .personal-info {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(20px);
        border-radius: 20px;
        padding: 24px;
        margin-bottom: 20px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }

      .section-header h3 {
        color: #333;
        font-size: 18px;
        font-weight: 600;
      }

      .view-all-btn, .edit-btn {
        background: none;
        border: none;
        color: #667eea;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: color 0.2s ease;
      }

      .view-all-btn:hover, .edit-btn:hover {
        color: #5a6fd8;
      }

      .order-item, .reservation-item {
        background: #f8f9fa;
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 12px;
        border-left: 4px solid #667eea;
        transition: transform 0.2s ease;
      }

      .order-item:hover, .reservation-item:hover {
        transform: translateX(4px);
      }

      .order-store {
        font-weight: 600;
        color: #333;
        margin-bottom: 4px;
      }

      .order-items {
        font-size: 14px;
        color: #666;
        margin-bottom: 8px;
      }

      .order-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 12px;
      }

      .order-date {
        color: #999;
      }

      .order-total {
        font-weight: bold;
        color: #667eea;
      }

      .review-status {
        background: #e8f5e8;
        color: #2e7d2e;
        padding: 2px 8px;
        border-radius: 8px;
        font-size: 11px;
      }

      .info-grid {
        display: grid;
        gap: 12px;
      }

      .info-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid #eee;
      }

      .info-item:last-child {
        border-bottom: none;
      }

      .info-label {
        color: #666;
        font-size: 14px;
      }

      .info-value {
        color: #333;
        font-weight: 500;
        font-size: 14px;
      }

      .bottom-actions {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-top: 20px;
      }

      .primary-button, .secondary-button {
        width: 100%;
        padding: 16px;
        border: none;
        border-radius: 16px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .primary-button {
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
      }

      .primary-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 30px rgba(102, 126, 234, 0.4);
      }

      .secondary-button {
        background: rgba(255, 255, 255, 0.95);
        color: #333;
        border: 2px solid #eee;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      }

      .secondary-button:hover {
        background: #f8f9fa;
        transform: translateY(-1px);
      }

      .loading-placeholder {
        text-align: center;
        color: #999;
        padding: 20px;
        font-style: italic;
      }

      .coupon-item {
        background: linear-gradient(135deg, #fff5f5, #fed7d7);
        border: 2px dashed #fc8181;
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 12px;
        position: relative;
      }

      .coupon-item::before {
        content: '🎫';
        position: absolute;
        top: 12px;
        right: 12px;
        font-size: 20px;
      }

      .coupon-name {
        font-weight: 600;
        color: #333;
        margin-bottom: 4px;
      }

      .coupon-discount {
        color: #e53e3e;
        font-weight: bold;
        font-size: 16px;
        margin-bottom: 4px;
      }

      .coupon-valid {
        font-size: 12px;
        color: #666;
      }

      .achievement-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: #f8f9fa;
        border-radius: 12px;
        margin-bottom: 8px;
      }

      .achievement-icon {
        font-size: 24px;
        width: 40px;
        text-align: center;
      }

      .achievement-info {
        flex: 1;
      }

      .achievement-name {
        font-weight: 600;
        color: #333;
        margin-bottom: 2px;
      }

      .achievement-date {
        font-size: 12px;
        color: #999;
      }

      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2000;
      }
      
      .modal-content {
        background: white;
        border-radius: 20px;
        width: 90%;
        max-width: 400px;
        max-height: 80vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      
      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        border-bottom: 1px solid #eee;
      }
      
      .modal-header h2 {
        margin: 0;
        font-size: 18px;
      }
      
      .modal-close {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #999;
      }
      
      .modal-body {
        padding: 20px;
        overflow-y: auto;
        flex: 1;
      }

      @media (max-width: 430px) {
        .account-content {
          padding: 80px 16px 40px 16px;
        }
        
        .profile-header {
          padding: 24px 20px;
          gap: 16px;
        }
        
        .profile-image {
          width: 70px;
          height: 70px;
        }
        
        .user-name {
          font-size: 20px;
        }
        
        .user-stats {
          gap: 12px;
        }
        
        .stat-number {
          font-size: 14px;
        }
        
        .quick-actions {
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        
        .quick-action-btn {
          padding: 16px 12px;
        }
        
        .action-icon {
          font-size: 20px;
        }
        
        .action-text {
          font-size: 12px;
        }
      }
    </style>
  `;

  console.log('🔧 이벤트 리스너 설정 시작');
  
  // DOM이 완전히 생성된 후 이벤트 리스너 등록 (requestAnimationFrame 사용)
  requestAnimationFrame(() => {
    setupEventListeners();
    loadAccountData();
  });
}

// 이벤트 리스너 설정
function setupEventListeners() {
  console.log('🔧 이벤트 리스너 등록 중...');
  
  const backBtn = document.getElementById('backBtn');
  const backToMyPageBtn = document.getElementById('backToMyPageBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const editProfileBtn = document.getElementById('editProfileBtn');
  const couponBtn = document.getElementById('couponBtn');
  const favoritesBtn = document.getElementById('favoritesBtn');
  const achievementsBtn = document.getElementById('achievementsBtn');
  const viewAllOrdersBtn = document.getElementById('viewAllOrdersBtn');
  const viewAllReservationsBtn = document.getElementById('viewAllReservationsBtn');
  const editPersonalInfoBtn = document.getElementById('editPersonalInfoBtn');

  if (backBtn) {
    console.log('✅ 뒤로가기 버튼 이벤트 리스너 등록');
    backBtn.onclick = function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('🔙 뒤로가기 버튼 클릭됨');
      if (typeof renderMyPage === 'function') {
        renderMyPage();
      } else {
        console.error('❌ renderMyPage 함수를 찾을 수 없음');
      }
    };
  } else {
    console.error('❌ 뒤로가기 버튼을 찾을 수 없음');
  }

  if (backToMyPageBtn) {
    backToMyPageBtn.onclick = function(e) {
      e.preventDefault();
      if (typeof renderMyPage === 'function') {
        renderMyPage();
      }
    };
  }

  if (logoutBtn) {
    logoutBtn.onclick = function(e) {
      e.preventDefault();
      if (confirm('정말 로그아웃 하시겠습니까?')) {
        window.location.href = '/';
      }
    };
  }

  if (editProfileBtn) {
    editProfileBtn.onclick = function(e) {
      e.preventDefault();
      showEditProfileModal();
    };
  }

  if (couponBtn) {
    couponBtn.onclick = function(e) {
      e.preventDefault();
      showCouponModal();
    };
  }

  if (favoritesBtn) {
    favoritesBtn.onclick = function(e) {
      e.preventDefault();
      showFavoritesModal();
    };
  }

  if (achievementsBtn) {
    achievementsBtn.onclick = function(e) {
      e.preventDefault();
      showAchievementsModal();
    };
  }

  if (viewAllOrdersBtn) {
    viewAllOrdersBtn.onclick = function(e) {
      e.preventDefault();
      showAllOrdersModal();
    };
  }

  if (viewAllReservationsBtn) {
    viewAllReservationsBtn.onclick = function(e) {
      e.preventDefault();
      showAllReservationsModal();
    };
  }

  if (editPersonalInfoBtn) {
    editPersonalInfoBtn.onclick = function(e) {
      e.preventDefault();
      showEditPersonalInfoModal();
    };
  }
  
  console.log('✅ 모든 이벤트 리스너 설정 완료');
}

// 계정 데이터 로드
async function loadAccountData() {
  try {
    // 실제 API 대신 더미 데이터 사용
    const dummyData = generateDummyData(window.userInfo?.id || 'user1');
    
    // UI 업데이트
    updateProfileHeader(dummyData);
    updateMonthlySummary(dummyData);
    updateRecentOrders(dummyData);
    updateReservations(dummyData);
    updatePersonalInfo(dummyData);
    
  } catch (error) {
    console.error('계정 데이터 로드 실패:', error);
    showErrorMessage();
  }
}

// 프로필 헤더 업데이트
function updateProfileHeader(data) {
  const profileImage = document.getElementById('profileImage');
  const userName = document.getElementById('userName');
  const userEmail = document.getElementById('userEmail');
  const totalOrders = document.getElementById('totalOrders');
  const currentPoints = document.getElementById('currentPoints');
  const vipLevelElement = document.getElementById('vipLevel');
  const vipBadge = document.getElementById('vipBadge');

  if (profileImage) profileImage.src = data.profileImage;
  if (userName) userName.textContent = data.name;
  if (userEmail) userEmail.textContent = data.email;
  if (totalOrders) totalOrders.textContent = data.totalOrders;
  if (currentPoints) currentPoints.textContent = `${data.point.toLocaleString()}P`;
  if (vipLevelElement) vipLevelElement.textContent = data.vipLevel;
  if (vipBadge) vipBadge.innerHTML = `<span class="vip-text">${data.vipLevel}</span>`;
  
  // VIP 레벨에 따른 배지 색상 변경
  if (vipBadge) {
    switch(data.vipLevel) {
      case 'PLATINUM':
        vipBadge.style.background = 'linear-gradient(45deg, #e5e7eb, #d1d5db)';
        break;
      case 'GOLD':
        vipBadge.style.background = 'linear-gradient(45deg, #ffd700, #ffed4e)';
        break;
      case 'SILVER':
        vipBadge.style.background = 'linear-gradient(45deg, #c0c0c0, #e8e8e8)';
        break;
      default:
        vipBadge.style.background = 'linear-gradient(45deg, #cd7f32, #daa520)';
    }
  }
}

// 월간 요약 업데이트
function updateMonthlySummary(data) {
  const monthlyStats = data.monthlyStats.currentMonth;
  const monthlyOrders = document.getElementById('monthlyOrders');
  const monthlySpent = document.getElementById('monthlySpent');
  const monthlySaved = document.getElementById('monthlySaved');

  if (monthlyOrders) monthlyOrders.textContent = `${monthlyStats.orders}회`;
  if (monthlySpent) monthlySpent.textContent = `${monthlyStats.spent.toLocaleString()}원`;
  if (monthlySaved) monthlySaved.textContent = `${monthlyStats.savedMoney.toLocaleString()}원`;
}

// 최근 주문 업데이트
function updateRecentOrders(data) {
  const ordersList = document.getElementById('recentOrdersList');
  if (!ordersList) return;

  const recentOrders = data.orderList.slice(0, 3); // 최근 3개만
  
  ordersList.innerHTML = recentOrders.map(order => `
    <div class="order-item">
      <div class="order-store">${order.store}</div>
      <div class="order-items">${order.items.map(item => `${item.name} × ${item.qty}`).join(', ')}</div>
      <div class="order-meta">
        <span class="order-date">${order.date}</span>
        <span class="order-total">${order.total.toLocaleString()}원</span>
        ${order.reviewId ? '<span class="review-status">리뷰완료</span>' : ''}
      </div>
    </div>
  `).join('');
}

// 예약 업데이트
function updateReservations(data) {
  const reservationsList = document.getElementById('reservationsList');
  if (!reservationsList) return;

  const recentReservations = data.reservationList.slice(0, 2); // 최근 2개만
  
  reservationsList.innerHTML = recentReservations.map(reservation => `
    <div class="reservation-item">
      <div class="order-store">${reservation.store}</div>
      <div class="order-items">${reservation.date} • ${reservation.people}명</div>
      <div class="order-meta">
        <span class="order-date">${reservation.phone}</span>
        <span class="order-total ${reservation.status === '예약완료' ? 'text-blue' : 'text-green'}">${reservation.status}</span>
      </div>
    </div>
  `).join('');
}

// 개인정보 업데이트
function updatePersonalInfo(data) {
  const personalInfoGrid = document.getElementById('personalInfoGrid');
  if (!personalInfoGrid) return;

  personalInfoGrid.innerHTML = `
    <div class="info-item">
      <span class="info-label">전화번호</span>
      <span class="info-value">${data.phone}</span>
    </div>
    <div class="info-item">
      <span class="info-label">주소</span>
      <span class="info-value">${data.address}</span>
    </div>
    <div class="info-item">
      <span class="info-label">생년월일</span>
      <span class="info-value">${data.birth}</span>
    </div>
    <div class="info-item">
      <span class="info-label">성별</span>
      <span class="info-value">${data.gender}</span>
    </div>
    <div class="info-item">
      <span class="info-label">가입일</span>
      <span class="info-value">${data.joinDate}</span>
    </div>
    <div class="info-item">
      <span class="info-label">총 사용금액</span>
      <span class="info-value">${data.totalSpent.toLocaleString()}원</span>
    </div>
  `;
}

// 모달 함수들
function showEditProfileModal() {
  alert('프로필 수정 기능은 개발 중입니다.');
}

function showCouponModal() {
  const dummyData = generateDummyData(window.userInfo?.id || 'user1');
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>🎫 내 쿠폰함</h2>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
      </div>
      <div class="modal-body">
        <h3 style="margin-bottom: 16px;">💝 사용 가능한 쿠폰</h3>
        ${dummyData.coupons.unused.map(coupon => `
          <div class="coupon-item">
            <div class="coupon-name">${coupon.name}</div>
            <div class="coupon-discount">
              ${coupon.discountType === 'percent' ? coupon.discountValue + '%' : coupon.discountValue.toLocaleString() + '원'} 할인
            </div>
            <div class="coupon-valid">
              유효기간: ${coupon.validUntil} | 최소주문: ${coupon.minOrder.toLocaleString()}원
            </div>
          </div>
        `).join('')}
        
        <h3 style="margin: 24px 0 16px 0;">📝 사용완료 쿠폰</h3>
        ${dummyData.coupons.used.map(coupon => `
          <div class="coupon-item" style="opacity: 0.6; background: linear-gradient(135deg, #f7f7f7, #e0e0e0);">
            <div class="coupon-name">${coupon.name}</div>
            <div class="coupon-discount">
              ${coupon.discountType === 'percent' ? coupon.discountValue + '%' : coupon.discountValue.toLocaleString() + '원'} 할인
            </div>
            <div class="coupon-valid">
              사용일: ${coupon.usedDate} | 사용처: ${coupon.store}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

function showFavoritesModal() {
  const dummyData = generateDummyData(window.userInfo?.id || 'user1');
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>⭐ 즐겨찾기 매장</h2>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
      </div>
      <div class="modal-body">
        ${dummyData.favoriteStores.map((store) => `
          <div class="favorite-item" style="padding: 12px; background: #f8f9fa; border-radius: 12px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 500;">${store}</span>
            <button style="background: #ff4757; color: white; border: none; padding: 4px 8px; border-radius: 6px; font-size: 12px; cursor: pointer;">삭제</button>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

function showAchievementsModal() {
  const dummyData = generateDummyData(window.userInfo?.id || 'user1');
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>🏆 나의 업적</h2>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
      </div>
      <div class="modal-body">
        ${dummyData.achievements.map(achievement => `
          <div class="achievement-item">
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-info">
              <div class="achievement-name">${achievement.name}</div>
              <div class="achievement-date">${achievement.date} 달성</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

function showAllOrdersModal() {
  alert('전체 주문 내역 보기 기능은 개발 중입니다.');
}

function showAllReservationsModal() {
  alert('전체 예약 내역 보기 기능은 개발 중입니다.');
}

function showEditPersonalInfoModal() {
  alert('개인정보 수정 기능은 개발 중입니다.');
}

function showErrorMessage() {
  const content = document.querySelector('.account-content');
  if (content) {
    content.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #666;">
        <div style="font-size: 48px; margin-bottom: 16px;">😔</div>
        <h2>데이터를 불러올 수 없습니다</h2>
        <p>잠시 후 다시 시도해주세요.</p>
        <button onclick="if(typeof renderMyPage === 'function') renderMyPage();" style="margin-top: 16px; padding: 12px 24px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer;">
          마이페이지로 돌아가기
        </button>
      </div>
    `;
  }
}

// 전역 함수 등록
window.renderMyAccount = renderMyAccount;
