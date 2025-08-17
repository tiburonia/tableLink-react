
// 실제 API 데이터를 UI 표시 형식으로 변환
async function convertToDisplayFormat(userInfo, ordersData, reviewsData) {
  console.log('🔄 실제 데이터를 UI 형식으로 변환 시작');

  // 주문 데이터 변환
  const convertedOrders = await Promise.all(ordersData.map(async (order) => {
    try {
      console.log('🔄 주문 데이터 변환 중:', order);

      // 매장 이름 우선순위: order_data.storeName > store_name > API 조회
      let storeName = order.store_name || '알 수 없는 매장';

      if (order.order_data && order.order_data.storeName) {
        storeName = order.order_data.storeName;
      } else if (!order.store_name && order.store_id) {
        try {
          const storeResponse = await fetch(`/api/stores/${order.store_id}`);
          if (storeResponse.ok) {
            const storeData = await storeResponse.json();
            storeName = storeData?.store?.name || `매장 ${order.store_id}`;
          }
        } catch (storeError) {
          console.warn('매장 정보 조회 실패:', order.store_id, storeError);
          storeName = `매장 ${order.store_id}`;
        }
      }

      // 주문 항목 파싱 - order_data.items 우선 사용
      let items = [];
      try {
        if (order.order_data && order.order_data.items) {
          items = order.order_data.items;
        } else if (order.items) {
          items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
        }
      } catch (e) {
        console.warn('주문 항목 파싱 실패:', order.id, e);
        items = [];
      }

      const convertedOrder = {
        id: order.id,
        store: storeName,
        items: items.map(item => ({
          name: item.name || item.menu_name || '메뉴',
          qty: item.qty || item.quantity || 1,
          price: item.price || 0
        })),
        total: order.total_amount || order.final_amount || 0,
        date: new Date(order.order_date || order.created_at).toLocaleDateString('ko-KR'),
        status: order.order_status || '완료',
        reviewId: order.has_review ? order.id : null
      };

      console.log('✅ 주문 변환 완료:', convertedOrder);
      return convertedOrder;

    } catch (error) {
      console.error('❌ 주문 데이터 변환 실패:', order.id, error);
      return {
        id: order.id || 'unknown',
        store: order.store_name || '알 수 없는 매장',
        items: [],
        total: order.total_amount || 0,
        date: new Date().toLocaleDateString('ko-KR'),
        status: '완료',
        reviewId: null
      };
    }
  }));

  // null 값 제거
  const validOrders = convertedOrders.filter(order => order !== null);

  // 리뷰 데이터 변환
  const convertedReviews = reviewsData.map(review => ({
    id: review.id,
    store: review.store_name || `매장 ${review.store_id}`,
    rating: review.score || review.rating || 0,
    content: review.content || review.review_text || '',
    date: new Date(review.created_at).toLocaleDateString('ko-KR')
  }));

  // 예약 데이터 (현재 DB에 없으므로 빈 배열)
  let reservationList = [];
  try {
    if (userInfo.reservation_list) {
      reservationList = typeof userInfo.reservation_list === 'string' 
        ? JSON.parse(userInfo.reservation_list) 
        : userInfo.reservation_list;
    }
  } catch (e) {
    console.warn('예약 데이터 파싱 실패:', e);
    reservationList = [];
  }

  // 쿠폰 데이터
  let coupons = { unused: [], used: [] };
  try {
    if (userInfo.coupons) {
      coupons = typeof userInfo.coupons === 'string' 
        ? JSON.parse(userInfo.coupons) 
        : userInfo.coupons;
    }
  } catch (e) {
    console.warn('쿠폰 데이터 파싱 실패:', e);
    coupons = { unused: [], used: [] };
  }

  // 즐겨찾기 매장
  let favoriteStores = [];
  try {
    if (userInfo.favorite_stores) {
      favoriteStores = typeof userInfo.favorite_stores === 'string' 
        ? JSON.parse(userInfo.favorite_stores) 
        : userInfo.favorite_stores;
    }
  } catch (e) {
    console.warn('즐겨찾기 데이터 파싱 실패:', e);
    favoriteStores = [];
  }

  // 월간 통계 계산
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const thisMonthOrders = validOrders.filter(order => {
    const orderDate = new Date(order.date);
    return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
  });

  const monthlySpent = thisMonthOrders.reduce((sum, order) => sum + order.total, 0);

  return {
    id: userInfo.id,
    name: userInfo.name || '사용자',
    phone: userInfo.phone || '정보 없음',
    email: `${userInfo.id}@tablelink.com`, // 실제 이메일 필드가 없으므로 임시로 생성
    address: '정보 없음', // 실제 주소 필드가 없음
    birth: '정보 없음',
    gender: '정보 없음',
    point: userInfo.point || 0,
    vipLevel: calculateVipLevel(userInfo.point || 0),
    joinDate: new Date(userInfo.created_at).toLocaleDateString('ko-KR'),
    totalOrders: validOrders.length,
    totalSpent: validOrders.reduce((sum, order) => sum + order.total, 0),
    profileImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(userInfo.name || userInfo.id)}&background=297efc&color=fff&size=128`,
    orderList: validOrders,
    reservationList: reservationList,
    coupons: coupons,
    favoriteStores: favoriteStores,
    achievements: generateAchievements(validOrders.length, convertedReviews.length, userInfo.point),
    monthlyStats: {
      currentMonth: {
        orders: thisMonthOrders.length,
        spent: monthlySpent,
        savedMoney: Math.floor(monthlySpent * 0.1) // 임시로 10% 절약으로 계산
      },
      lastMonth: {
        orders: 0, // 지난달 데이터는 별도 계산 필요
        spent: 0,
        savedMoney: 0
      }
    },
    // 단골 레벨 데이터 추가
    regularLevels: userInfo.regularLevels || []
  };
}

// VIP 레벨 계산
function calculateVipLevel(point) {
  if (point >= 100000) return 'PLATINUM';
  if (point >= 50000) return 'GOLD';
  if (point >= 20000) return 'SILVER';
  return 'BRONZE';
}

// 업적 생성
function generateAchievements(orderCount, reviewCount, point) {
  const achievements = [];

  if (orderCount >= 1) {
    achievements.push({ name: '첫 주문 달성', icon: '🎉', date: '달성' });
  }
  if (orderCount >= 10) {
    achievements.push({ name: '10회 주문 달성', icon: '🏆', date: '달성' });
  }
  if (reviewCount >= 5) {
    achievements.push({ name: '리뷰왕', icon: '⭐', date: '달성' });
  }
  if (point >= 50000) {
    achievements.push({ name: 'VIP 등급 달성', icon: '👑', date: '달성' });
  }

  return achievements;
}

// 더미 데이터 생성 함수 (폴백용)
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
    },
    // 단골 레벨 더미 데이터
    regularLevels: [
      { store: '스타벅스 강남점', level: 'VVIP', points: 1200, nextLevelPoints: 2000, benefits: ['음료 사이즈 업'] },
      { store: '맥도날드 역삼점', level: 'VIP', points: 800, nextLevelPoints: 1500, benefits: ['감자튀김 무료'] },
      { store: '투썸플레이스 선릉점', level: 'REGULAR', points: 300, nextLevelPoints: 700, benefits: ['아메리카노 10% 할인'] }
    ]
  };
}

async function renderMyAccount() {
  console.log('🔧 renderMyAccount 시작');

  // renderMyPage 스크립트 미리 로드
  if (typeof window.renderMyPage !== 'function') {
    try {
      console.log('🔄 renderMyPage 스크립트 미리 로드 시작');
      const script = document.createElement('script');
      script.src = '/TLG/pages/mypage/renderMyPage.js';
      
      await new Promise((resolve, reject) => {
        script.onload = () => {
          console.log('✅ renderMyPage 스크립트 미리 로드 완료');
          resolve();
        };
        script.onerror = () => {
          console.error('❌ renderMyPage 스크립트 미리 로드 실패');
          reject();
        };
        document.head.appendChild(script);
      });
    } catch (error) {
      console.error('❌ renderMyPage 스크립트 로드 중 오류:', error);
    }
  }

  const main = document.getElementById('main');

  // 전역 스타일 완전 리셋
  document.body.style.cssText = '';
  document.documentElement.style.cssText = '';

  // main 컨테이너도 리셋
  if (main) {
    main.style.cssText = '';
  }

  main.innerHTML = `
    <div class="account-wrapper">
      <!-- 상단 네비게이션 -->
      <header class="account-header">
        <button class="back-btn" id="backBtn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15,18 9,12 15,6"></polyline>
          </svg>
        </button>
        <h1>내 계정</h1>
        <div class="header-spacer"></div>
      </header>

      <!-- 스크롤 가능한 컨텐츠 -->
      <div class="account-content">
        <!-- 프로필 카드 -->
        <div class="profile-card">
          <div class="profile-avatar">
            <img id="profileImage" src="" alt="프로필" class="avatar-img">
            <div class="status-indicator"></div>
          </div>
          <div class="profile-info">
            <h2 id="userName" class="user-name">로딩중...</h2>
            <p id="userEmail" class="user-email">이메일을 불러오는 중...</p>
            <div class="vip-badge" id="vipBadge">
              <span class="badge-text">GOLD</span>
            </div>
          </div>
          <button class="edit-profile-btn" id="editProfileBtn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m18 2 4 4-14 14H4v-4L18 2z"></path>
            </svg>
          </button>
        </div>

        <!-- 통계 카드 -->
        <div class="stats-grid">
          <div class="stat-card primary">
            <div class="stat-icon">🛍️</div>
            <div class="stat-content">
              <span class="stat-number" id="totalOrders">-</span>
              <span class="stat-label">총 주문</span>
            </div>
          </div>
          <div class="stat-card secondary">
            <div class="stat-icon">💎</div>
            <div class="stat-content">
              <span class="stat-number" id="currentPoints">-</span>
              <span class="stat-label">포인트</span>
            </div>
          </div>
          <div class="stat-card tertiary">
            <div class="stat-icon">💰</div>
            <div class="stat-content">
              <span class="stat-number" id="monthlySpent">-</span>
              <span class="stat-label">이번달 사용</span>
            </div>
          </div>
        </div>

        <!-- 단골 레벨 섹션 -->
        <div class="section-card">
          <div class="section-header">
            <h3>🏆 나의 단골 레벨</h3>
            <button class="view-all-btn" id="viewAllLevelsBtn">전체보기</button>
          </div>
          <div class="regular-levels-container" id="regularLevelsContainer">
            <div class="loading-skeleton">단골 레벨 정보를 불러오는 중...</div>
          </div>
        </div>

        <!-- 퀵 액션 메뉴 -->
        <div class="section-card">
          <div class="section-header">
            <h3>⚡ 빠른 메뉴</h3>
          </div>
          <div class="quick-menu-grid">
            <button class="quick-menu-item" id="couponBtn">
              <div class="menu-icon">🎫</div>
              <span class="menu-label">쿠폰함</span>
              <div class="menu-badge" id="couponBadge">3</div>
            </button>
            <button class="quick-menu-item" id="favoritesBtn">
              <div class="menu-icon">⭐</div>
              <span class="menu-label">즐겨찾기</span>
            </button>
            <button class="quick-menu-item" id="achievementsBtn">
              <div class="menu-icon">🏆</div>
              <span class="menu-label">업적</span>
            </button>
            <button class="quick-menu-item" id="settingsBtn">
              <div class="menu-icon">⚙️</div>
              <span class="menu-label">설정</span>
            </button>
          </div>
        </div>

        <!-- 최근 활동 -->
        <div class="section-card">
          <div class="section-header">
            <h3>📈 최근 활동</h3>
            <button class="view-all-btn" id="viewAllOrdersBtn">전체보기</button>
          </div>
          <div class="activity-list" id="recentOrdersList">
            <div class="loading-skeleton">주문 내역을 불러오는 중...</div>
          </div>
        </div>

        <!-- 개인정보 섹션 -->
        <div class="section-card">
          <div class="section-header">
            <h3>👤 개인정보</h3>
            <button class="edit-btn" id="editPersonalInfoBtn">수정</button>
          </div>
          <div class="personal-info-list" id="personalInfoList">
            <div class="loading-skeleton">개인정보를 불러오는 중...</div>
          </div>
        </div>

        <!-- 로그아웃 버튼 -->
        <div class="logout-section">
          <button class="logout-btn" id="logoutBtn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16,17 21,12 16,7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            로그아웃
          </button>
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

      .account-wrapper {
        height: 100%;
        display: flex;
        flex-direction: column;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        position: relative;
      }

      /* 헤더 */
      .account-header {
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

      .account-header h1 {
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
      .account-content {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        background: #f8fafc;
        border-radius: 24px 24px 0 0;
        margin-top: -16px;
        position: relative;
        z-index: 1;
      }

      .account-content::-webkit-scrollbar {
        width: 0;
      }

      /* 프로필 카드 */
      .profile-card {
        background: white;
        border-radius: 20px;
        padding: 24px;
        margin-bottom: 20px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        display: flex;
        align-items: center;
        gap: 16px;
        position: relative;
      }

      .profile-avatar {
        position: relative;
        flex-shrink: 0;
      }

      .avatar-img {
        width: 70px;
        height: 70px;
        border-radius: 50%;
        border: 3px solid #e5e7eb;
        object-fit: cover;
      }

      .status-indicator {
        position: absolute;
        bottom: 2px;
        right: 2px;
        width: 16px;
        height: 16px;
        background: #10b981;
        border: 3px solid white;
        border-radius: 50%;
      }

      .profile-info {
        flex: 1;
      }

      .user-name {
        font-size: 20px;
        font-weight: 700;
        color: #111827;
        margin: 0 0 4px 0;
      }

      .user-email {
        font-size: 14px;
        color: #6b7280;
        margin: 0 0 12px 0;
      }

      .vip-badge {
        display: inline-flex;
        align-items: center;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        background: linear-gradient(135deg, #fbbf24, #f59e0b);
        color: white;
        box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
      }

      .edit-profile-btn {
        position: absolute;
        top: 16px;
        right: 16px;
        width: 36px;
        height: 36px;
        border: none;
        background: #f3f4f6;
        border-radius: 10px;
        color: #6b7280;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .edit-profile-btn:hover {
        background: #e5e7eb;
        color: #374151;
      }

      .edit-profile-btn svg {
        width: 16px;
        height: 16px;
      }

      /* 통계 그리드 */
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
        margin-bottom: 20px;
      }

      .stat-card {
        background: white;
        border-radius: 16px;
        padding: 20px 16px;
        text-align: center;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
        transition: transform 0.2s ease;
        position: relative;
        overflow: hidden;
      }

      .stat-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, #667eea, #764ba2);
      }

      .stat-card.primary::before {
        background: linear-gradient(90deg, #3b82f6, #1d4ed8);
      }

      .stat-card.secondary::before {
        background: linear-gradient(90deg, #8b5cf6, #7c3aed);
      }

      .stat-card.tertiary::before {
        background: linear-gradient(90deg, #10b981, #059669);
      }

      .stat-card:hover {
        transform: translateY(-2px);
      }

      .stat-icon {
        font-size: 24px;
        margin-bottom: 8px;
        display: block;
      }

      .stat-content {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .stat-number {
        font-size: 18px;
        font-weight: 700;
        color: #111827;
      }

      .stat-label {
        font-size: 12px;
        color: #6b7280;
        font-weight: 500;
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

      .view-all-btn, .edit-btn {
        background: none;
        border: none;
        color: #667eea;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: color 0.2s ease;
        padding: 4px 8px;
        border-radius: 6px;
      }

      .view-all-btn:hover, .edit-btn:hover {
        background: #f3f4f6;
        color: #5a6fd8;
      }

      /* 퀵 메뉴 */
      .quick-menu-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
      }

      .quick-menu-item {
        background: #f8fafc;
        border: none;
        border-radius: 12px;
        padding: 16px 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        position: relative;
      }

      .quick-menu-item:hover {
        background: #e5e7eb;
        transform: translateY(-1px);
      }

      .menu-icon {
        font-size: 20px;
      }

      .menu-label {
        font-size: 12px;
        font-weight: 500;
        color: #374151;
      }

      .menu-badge {
        position: absolute;
        top: 8px;
        right: 8px;
        background: #ef4444;
        color: white;
        font-size: 10px;
        font-weight: 600;
        padding: 2px 6px;
        border-radius: 10px;
        min-width: 16px;
        text-align: center;
      }

      /* 단골 레벨 컨테이너 */
      .regular-levels-container {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .regular-level-item {
        background: #f8fafc;
        border-radius: 12px;
        padding: 16px;
        border-left: 4px solid #667eea;
        transition: transform 0.2s ease;
      }

      .regular-level-item:hover {
        transform: translateX(4px);
      }

      .level-store-name {
        font-weight: 600;
        color: #111827;
        margin-bottom: 8px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .level-badge {
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        padding: 4px 8px;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 600;
      }

      .level-progress {
        font-size: 12px;
        color: #6b7280;
        margin-bottom: 4px;
      }

      .level-benefits {
        font-size: 11px;
        color: #667eea;
        font-weight: 500;
      }

      /* 활동 리스트 */
      .activity-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .activity-item {
        background: #f8fafc;
        border-radius: 12px;
        padding: 16px;
        border-left: 4px solid #10b981;
        transition: transform 0.2s ease;
      }

      .activity-item:hover {
        transform: translateX(4px);
      }

      .activity-store {
        font-weight: 600;
        color: #111827;
        margin-bottom: 4px;
      }

      .activity-items {
        font-size: 14px;
        color: #6b7280;
        margin-bottom: 8px;
      }

      .activity-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 12px;
      }

      .activity-date {
        color: #9ca3af;
      }

      .activity-total {
        font-weight: 600;
        color: #10b981;
      }

      /* 개인정보 리스트 */
      .personal-info-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .info-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid #f3f4f6;
      }

      .info-item:last-child {
        border-bottom: none;
      }

      .info-label {
        font-size: 14px;
        color: #6b7280;
        font-weight: 500;
      }

      .info-value {
        font-size: 14px;
        color: #111827;
        font-weight: 500;
      }

      /* 로그아웃 섹션 */
      .logout-section {
        margin-top: 20px;
        padding-bottom: 20px;
      }

      .logout-btn {
        width: 100%;
        background: #fee2e2;
        border: 1px solid #fecaca;
        border-radius: 12px;
        padding: 16px;
        color: #dc2626;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }

      .logout-btn:hover {
        background: #fecaca;
        border-color: #fca5a5;
      }

      .logout-btn svg {
        width: 20px;
        height: 20px;
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

      /* 모달 스타일 */
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
        z-index: 1000;
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
        border-bottom: 1px solid #f3f4f6;
      }

      .modal-header h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #111827;
      }

      .modal-close {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #9ca3af;
        width: 32px;
        height: 32px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .modal-close:hover {
        background: #f3f4f6;
        color: #6b7280;
      }

      .modal-body {
        padding: 20px;
        overflow-y: auto;
        flex: 1;
      }

      /* 반응형 */
      @media (max-width: 430px) {
        .account-content {
          padding: 16px;
        }

        .profile-card {
          padding: 20px;
        }

        .stats-grid {
          gap: 8px;
        }

        .stat-card {
          padding: 16px 12px;
        }

        .quick-menu-grid {
          gap: 8px;
        }

        .quick-menu-item {
          padding: 12px 6px;
        }
      }
    </style>
  `;

  // DOM이 완전히 렌더링된 후 이벤트 리스너 설정
  setTimeout(() => {
    console.log('🔧 renderMyAccount DOM 렌더링 완료, 이벤트 리스너 설정 시작');
    setupEventListeners();
    loadAccountData();
  }, 50);
}

// 이벤트 리스너 설정
function setupEventListeners() {
  console.log('🔧 이벤트 리스너 등록 중...');

  // DOM 요소들을 다시 한번 체크
  const backBtn = document.getElementById('backBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const editProfileBtn = document.getElementById('editProfileBtn');
  const couponBtn = document.getElementById('couponBtn');
  const favoritesBtn = document.getElementById('favoritesBtn');
  const achievementsBtn = document.getElementById('achievementsBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const viewAllOrdersBtn = document.getElementById('viewAllOrdersBtn');
  const viewAllLevelsBtn = document.getElementById('viewAllLevelsBtn');
  const editPersonalInfoBtn = document.getElementById('editPersonalInfoBtn');

  if (backBtn) {
    console.log('✅ 뒤로가기 버튼 발견, 이벤트 리스너 등록 중...');
    
    backBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('🔙 뒤로가기 버튼 클릭됨');
      
      // 직접 renderMyPage 호출 시도
      if (typeof window.renderMyPage === 'function') {
        console.log('✅ renderMyPage 함수 호출');
        window.renderMyPage();
      } else {
        console.log('🔄 renderMyPage 함수가 없음 - 브라우저 뒤로가기 사용');
        window.history.back();
      }
    });
    
    console.log('✅ 뒤로가기 버튼 이벤트 리스너 등록 완료');
  } else {
    console.error('❌ 뒤로가기 버튼을 찾을 수 없음');
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      if (confirm('정말 로그아웃 하시겠습니까?')) {
        window.location.href = '/';
      }
    });
  }

  if (editProfileBtn) {
    editProfileBtn.addEventListener('click', function(e) {
      e.preventDefault();
      showEditProfileModal();
    });
  }

  if (couponBtn) {
    couponBtn.addEventListener('click', function(e) {
      e.preventDefault();
      showCouponModal();
    });
  }

  if (favoritesBtn) {
    favoritesBtn.addEventListener('click', function(e) {
      e.preventDefault();
      showFavoritesModal();
    });
  }

  if (achievementsBtn) {
    achievementsBtn.addEventListener('click', function(e) {
      e.preventDefault();
      showAchievementsModal();
    });
  }

  if (settingsBtn) {
    settingsBtn.addEventListener('click', function(e) {
      e.preventDefault();
      alert('설정 기능은 개발 중입니다.');
    });
  }

  if (viewAllOrdersBtn) {
    viewAllOrdersBtn.addEventListener('click', function(e) {
      e.preventDefault();
      showAllOrdersModal();
    });
  }

  if (viewAllLevelsBtn) {
    viewAllLevelsBtn.addEventListener('click', function(e) {
      e.preventDefault();
      showAllRegularLevelsModal();
    });
  }

  if (editPersonalInfoBtn) {
    editPersonalInfoBtn.addEventListener('click', function(e) {
      e.preventDefault();
      showEditPersonalInfoModal();
    });
  }

  console.log('✅ 모든 이벤트 리스너 설정 완료');
}

// 계정 데이터 로드
async function loadAccountData() {
  try {
    console.log('📖 실제 사용자 데이터 로드 시작:', window.userInfo?.id);

    // 1. 사용자 기본 정보 가져오기
    const userResponse = await fetch('/api/users/info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: window.userInfo?.id || 'user1' })
    });

    if (!userResponse.ok) throw new Error('사용자 정보 조회 실패');
    const userData = await userResponse.json();
    const currentUserInfo = userData.user;

    console.log('✅ 사용자 기본 정보 로드:', currentUserInfo);

    // 2. 주문 내역 가져오기 (최근 3개)
    const ordersResponse = await fetch(`/api/orders/mypage/${window.userInfo?.id || 'user1'}?limit=5`);
    let ordersData = [];
    if (ordersResponse.ok) {
      const ordersResult = await ordersResponse.json();
      ordersData = ordersResult.orders || [];
    }

    console.log('✅ 주문 내역 로드:', ordersData);

    // 3. 리뷰 내역 가져오기
    const reviewsResponse = await fetch(`/api/reviews/users/${window.userInfo?.id || 'user1'}`);
    let reviewsData = [];
    if (reviewsResponse.ok) {
      const reviewsResult = await reviewsResponse.json();
      reviewsData = reviewsResult.reviews || [];
    } else {
      console.warn('⚠️ 리뷰 데이터 로드 실패');
    }
    console.log('✅ 리뷰 내역 로드:', reviewsData);

    // 실제 데이터를 UI 형식으로 변환
    console.log('🔄 convertToDisplayFormat 호출 전 데이터 확인:', {
      userInfo: userData.user,
      ordersCount: ordersData.length,
      reviewsCount: reviewsData.length
    });

    const displayData = await convertToDisplayFormat(userData.user, ordersData, reviewsData);

    // UI 업데이트
    updateProfileHeader(displayData);
    updateStatsGrid(displayData);
    updateRecentActivity(displayData);
    updatePersonalInfo(displayData);
    updateRegularLevels(displayData);

    console.log('✅ 모든 사용자 데이터 로드 및 UI 업데이트 완료');

  } catch (error) {
    console.error('❌ 계정 데이터 로드 실패:', error);
    console.error('❌ 에러 상세:', error.stack);

    // 부분적으로 데이터가 있는 경우 처리
    try {
      console.log('🔄 부분 데이터 복구 시도');

      // 사용자 기본 정보만이라도 가져오기
      const userResponse = await fetch('/api/users/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: window.userInfo?.id || 'user1' })
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        const basicData = await convertToDisplayFormat(userData.user, [], []);
        updateProfileHeader(basicData);
        updateStatsGrid(basicData);
        updatePersonalInfo(basicData);
        updateRegularLevels(basicData);

        // 주문/리뷰는 빈 데이터로
        document.getElementById('recentOrdersList').innerHTML = '<div class="loading-skeleton">주문 내역을 불러올 수 없습니다.</div>';

        console.log('✅ 부분 데이터 복구 성공');
        return;
      }
    } catch (recoveryError) {
      console.error('❌ 부분 데이터 복구도 실패:', recoveryError);
    }

    // 완전 실패 시 더미 데이터로 폴백
    console.log('🔄 더미 데이터로 완전 폴백');
    const fallbackData = generateDummyData(window.userInfo?.id || 'user1');
    updateProfileHeader(fallbackData);
    updateStatsGrid(fallbackData);
    updateRecentActivity(fallbackData);
    updatePersonalInfo(fallbackData);
    updateRegularLevels(fallbackData);
  }
}

// 프로필 헤더 업데이트
function updateProfileHeader(data) {
  const profileImage = document.getElementById('profileImage');
  const userName = document.getElementById('userName');
  const userEmail = document.getElementById('userEmail');
  const vipBadge = document.getElementById('vipBadge');

  if (profileImage) profileImage.src = data.profileImage;
  if (userName) userName.textContent = data.name;
  if (userEmail) userEmail.textContent = data.email;

  if (vipBadge) {
    vipBadge.innerHTML = `<span class="badge-text">${data.vipLevel}</span>`;
    
    // VIP 레벨에 따른 배지 색상 변경
    switch(data.vipLevel) {
      case 'PLATINUM':
        vipBadge.style.background = 'linear-gradient(135deg, #9ca3af, #6b7280)';
        break;
      case 'GOLD':
        vipBadge.style.background = 'linear-gradient(135deg, #fbbf24, #f59e0b)';
        break;
      case 'SILVER':
        vipBadge.style.background = 'linear-gradient(135deg, #d1d5db, #9ca3af)';
        break;
      default:
        vipBadge.style.background = 'linear-gradient(135deg, #d97706, #92400e)';
    }
  }
}

// 통계 그리드 업데이트
function updateStatsGrid(data) {
  const totalOrders = document.getElementById('totalOrders');
  const currentPoints = document.getElementById('currentPoints');
  const monthlySpent = document.getElementById('monthlySpent');

  if (totalOrders) totalOrders.textContent = data.totalOrders;
  if (currentPoints) currentPoints.textContent = `${data.point.toLocaleString()}P`;
  if (monthlySpent) monthlySpent.textContent = `${data.monthlyStats.currentMonth.spent.toLocaleString()}원`;
}

// 단골 레벨 업데이트
function updateRegularLevels(data) {
  const regularLevelsContainer = document.getElementById('regularLevelsContainer');
  if (!regularLevelsContainer) return;

  if (data.regularLevels && data.regularLevels.length > 0) {
    regularLevelsContainer.innerHTML = data.regularLevels.slice(0, 3).map((levelInfo) => `
      <div class="regular-level-item">
        <div class="level-store-name">
          <span>${levelInfo.store}</span>
          <span class="level-badge">${levelInfo.level}</span>
        </div>
        <div class="level-progress">${levelInfo.points} / ${levelInfo.nextLevelPoints} 포인트</div>
        <div class="level-benefits">${levelInfo.benefits.join(', ')}</div>
      </div>
    `).join('');
  } else {
    regularLevelsContainer.innerHTML = '<div class="loading-skeleton">등록된 단골 레벨이 없습니다.</div>';
  }
}

// 최근 활동 업데이트
function updateRecentActivity(data) {
  const activityList = document.getElementById('recentOrdersList');
  if (!activityList) return;

  const recentOrders = data.orderList.slice(0, 3);

  if (recentOrders.length > 0) {
    activityList.innerHTML = recentOrders.map(order => `
      <div class="activity-item">
        <div class="activity-store">${order.store}</div>
        <div class="activity-items">${order.items.map(item => `${item.name} × ${item.qty}`).join(', ')}</div>
        <div class="activity-meta">
          <span class="activity-date">${order.date}</span>
          <span class="activity-total">${order.total.toLocaleString()}원</span>
        </div>
      </div>
    `).join('');
  } else {
    activityList.innerHTML = '<div class="loading-skeleton">최근 주문 내역이 없습니다.</div>';
  }
}

// 개인정보 업데이트
function updatePersonalInfo(data) {
  const personalInfoList = document.getElementById('personalInfoList');
  if (!personalInfoList) return;

  personalInfoList.innerHTML = `
    <div class="info-item">
      <span class="info-label">전화번호</span>
      <span class="info-value">${data.phone}</span>
    </div>
    <div class="info-item">
      <span class="info-label">이메일</span>
      <span class="info-value">${data.email}</span>
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
        <h3 style="margin-bottom: 16px; color: #111827; font-size: 16px;">💝 사용 가능한 쿠폰</h3>
        ${dummyData.coupons.unused.length > 0 ? dummyData.coupons.unused.map(coupon => `
          <div style="background: linear-gradient(135deg, #fef3c7, #fde68a); border: 2px dashed #f59e0b; border-radius: 12px; padding: 16px; margin-bottom: 12px; position: relative;">
            <div style="font-weight: 600; color: #92400e; margin-bottom: 4px;">${coupon.name}</div>
            <div style="color: #d97706; font-weight: bold; font-size: 16px; margin-bottom: 4px;">
              ${coupon.discountType === 'percent' ? coupon.discountValue + '%' : coupon.discountValue.toLocaleString() + '원'} 할인
            </div>
            <div style="font-size: 12px; color: #78716c;">
              유효기간: ${coupon.validUntil} | 최소주문: ${coupon.minOrder.toLocaleString()}원
            </div>
          </div>
        `).join('') : '<p style="text-align: center; color: #9ca3af; padding: 20px;">사용 가능한 쿠폰이 없습니다.</p>'}

        <h3 style="margin: 24px 0 16px 0; color: #111827; font-size: 16px;">📝 사용완료 쿠폰</h3>
        ${dummyData.coupons.used.length > 0 ? dummyData.coupons.used.map(coupon => `
          <div style="opacity: 0.6; background: #f3f4f6; border: 2px dashed #d1d5db; border-radius: 12px; padding: 16px; margin-bottom: 12px;">
            <div style="font-weight: 600; color: #6b7280; margin-bottom: 4px;">${coupon.name}</div>
            <div style="color: #9ca3af; font-weight: bold; font-size: 16px; margin-bottom: 4px;">
              ${coupon.discountType === 'percent' ? coupon.discountValue + '%' : coupon.discountValue.toLocaleString() + '원'} 할인
            </div>
            <div style="font-size: 12px; color: #9ca3af;">
              사용일: ${coupon.usedDate} | 사용처: ${coupon.store}
            </div>
          </div>
        `).join('') : '<p style="text-align: center; color: #9ca3af; padding: 20px;">사용한 쿠폰이 없습니다.</p>'}
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
          <div style="padding: 16px; background: #f8fafc; border-radius: 12px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; border-left: 4px solid #667eea;">
            <span style="font-weight: 600; color: #111827;">${store}</span>
            <button style="background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; padding: 6px 12px; border-radius: 8px; font-size: 12px; cursor: pointer; font-weight: 500;">삭제</button>
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
          <div style="display: flex; align-items: center; gap: 16px; padding: 16px; background: #f8fafc; border-radius: 12px; margin-bottom: 12px;">
            <div style="font-size: 28px; width: 48px; text-align: center;">${achievement.icon}</div>
            <div style="flex: 1;">
              <div style="font-weight: 600; color: #111827; margin-bottom: 4px;">${achievement.name}</div>
              <div style="font-size: 12px; color: #9ca3af;">${achievement.date} 달성</div>
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

function showAllRegularLevelsModal() {
  alert('전체 단골 레벨 보기 기능은 개발 중입니다.');
}

function showEditPersonalInfoModal() {
  alert('개인정보 수정 기능은 개발 중입니다.');
}

// 전역 함수 등록
window.renderMyAccount = renderMyAccount;


