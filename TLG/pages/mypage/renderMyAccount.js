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

  // 기존 이벤트 리스너 플래그 초기화
  window.accountEventListenersInitialized = false;

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

  // renderAllOrderHTML 스크립트 미리 로드
  if (typeof window.renderAllOrderHTML !== 'function') {
    try {
      console.log('🔄 renderAllOrderHTML 스크립트 미리 로드 시작');
      const orderScript = document.createElement('script');
      orderScript.src = '/TLG/pages/store/order/renderAllOrderHTML.js';

      await new Promise((resolve, reject) => {
        orderScript.onload = () => {
          console.log('✅ renderAllOrderHTML 스크립트 미리 로드 완료');
          resolve();
        };
        orderScript.onerror = () => {
          console.error('❌ renderAllOrderHTML 스크립트 미리 로드 실패');
          reject();
        };
        document.head.appendChild(orderScript);
      });
    } catch (error) {
      console.error('❌ renderAllOrderHTML 스크립트 로드 중 오류:', error);
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
        <div class="modern-card loyalty-card">
          <div class="card-header loyalty-gradient-header">
            <div class="header-content">
              <div class="header-icon loyalty-icon">🏆</div>
              <div class="header-text">
                <h3>나의 단골 레벨</h3>
                <p>즐겨찾는 매장에서의 등급</p>
              </div>
            </div>
            <button class="view-all-btn modern-btn loyalty-btn" id="viewAllLevelsBtn">
              <span>전체보기</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2"/>
              </svg>
            </button>
          </div>
          <div class="card-body loyalty-body">
            <div class="regular-levels-container" id="regularLevelsContainer">
              <div class="loading-skeleton modern-skeleton">
                <div class="skeleton-shimmer"></div>
                <span>단골 레벨 정보를 불러오는 중...</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 퀵 액션 메뉴 -->
        <div class="modern-card quick-menu-card">
          <div class="card-header">
            <div class="header-content">
              <div class="header-icon">⚡</div>
              <div class="header-text">
                <h3>빠른 메뉴</h3>
                <p>자주 사용하는 기능들</p>
              </div>
            </div>
          </div>
          <div class="card-body no-padding">
            <div class="quick-menu-grid modern-grid">
              <button class="quick-menu-item modern-item" id="couponBtn">
                <div class="item-background"></div>
                <div class="item-content">
                  <div class="menu-icon">🎫</div>
                  <span class="menu-label">쿠폰함</span>
                  <div class="menu-badge" id="couponBadge">3</div>
                </div>
                <div class="item-hover-effect"></div>
              </button>
              <button class="quick-menu-item modern-item" id="favoritesBtn">
                <div class="item-background"></div>
                <div class="item-content">
                  <div class="menu-icon">⭐</div>
                  <span class="menu-label">즐겨찾기</span>
                </div>
                <div class="item-hover-effect"></div>
              </button>
              <button class="quick-menu-item modern-item" id="achievementsBtn">
                <div class="item-background"></div>
                <div class="item-content">
                  <div class="menu-icon">🏆</div>
                  <span class="menu-label">업적</span>
                </div>
                <div class="item-hover-effect"></div>
              </button>
              <button class="quick-menu-item modern-item" id="settingsBtn">
                <div class="item-background"></div>
                <div class="item-content">
                  <div class="menu-icon">⚙️</div>
                  <span class="menu-label">설정</span>
                </div>
                <div class="item-hover-effect"></div>
              </button>
            </div>
          </div>
        </div>

        <!-- 최근 활동 -->
        <div class="modern-card activity-card">
          <div class="card-header activity-gradient-header">
            <div class="header-content">
              <div class="header-icon activity-icon">📈</div>
              <div class="header-text">
                <h3>최근 활동</h3>
                <p>최근 주문 내역</p>
              </div>
            </div>
            <button class="view-all-btn modern-btn activity-btn" id="viewAllOrdersBtn">
              <span>전체보기</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2"/>
              </svg>
            </button>
          </div>
          <div class="card-body activity-body">
            <div class="activity-list modern-list" id="recentOrdersList">
              <div class="loading-skeleton modern-skeleton">
                <div class="skeleton-shimmer"></div>
                <span>주문 내역을 불러오는 중...</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 개인정보 섹션 -->
        <div class="modern-card info-card">
          <div class="card-header gradient-header info-gradient">
            <div class="header-content">
              <div class="header-icon">👤</div>
              <div class="header-text">
                <h3>개인정보</h3>
                <p>계정 및 프로필 정보</p>
              </div>
            </div>
            <button class="edit-btn modern-btn" id="editPersonalInfoBtn">
              <span>수정</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="2"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2"/>
              </svg>
            </button>
          </div>
          <div class="card-body">
            <div class="personal-info-list modern-info-list" id="personalInfoList">
              <div class="loading-skeleton modern-skeleton">
                <div class="skeleton-shimmer"></div>
                <span>개인정보를 불러오는 중...</span>
              </div>
            </div>
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

      /* 모던 카드 시스템 */
      .modern-card {
        background: white;
        border-radius: 20px;
        margin-bottom: 20px;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
        border: 1px solid rgba(0, 0, 0, 0.04);
        overflow: hidden;
        transition: all 0.3s ease;
        position: relative;
      }

      .modern-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.3), transparent);
      }

      .modern-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
      }

      /* 카드 헤더 */
      .card-header {
        padding: 28px 24px 24px 24px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        position: relative;
      }

      .gradient-header {
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        border-bottom: 1px solid #e2e8f0;
      }

      .gradient-header.activity-gradient {
        background: linear-gradient(135deg, #fef7ed 0%, #fed7aa 100%);
        border-bottom: 1px solid #fdba74;
      }

      .gradient-header.info-gradient {
        background: linear-gradient(135deg, #f0f9ff 0%, #dbeafe 100%);
        border-bottom: 1px solid #93c5fd;
      }

      .header-content {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .header-icon {
        width: 48px;
        height: 48px;
        background: white;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .header-text h3 {
        font-size: 18px;
        font-weight: 700;
        color: #111827;
        margin: 0;
        line-height: 1.2;
      }

      .header-text p {
        font-size: 13px;
        color: #6b7280;
        margin: 4px 0 0 0;
        line-height: 1.3;
      }

      /* 모던 버튼 */
      .modern-btn {
        background: rgba(255, 255, 255, 0.9);
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 12px;
        padding: 10px 16px;
        font-size: 14px;
        font-weight: 600;
        color: #374151;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 6px;
        backdrop-filter: blur(8px);
      }

      .modern-btn:hover {
        background: white;
        border-color: #6366f1;
        color: #6366f1;
        transform: scale(1.02);
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
      }

      .modern-btn svg {
        transition: transform 0.2s ease;
      }

      .modern-btn:hover svg {
        transform: translateX(2px);
      }

      /* 카드 바디 */
      .card-body {
        padding: 0 24px 28px 24px;
      }

      .card-body.no-padding {
        padding: 0;
      }

      /* 퀵 메뉴 모던 그리드 */
      .modern-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 0;
        padding: 16px;
      }

      .modern-item {
        background: none;
        border: none;
        padding: 20px 12px;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        flex-direction: column;
        align-items: center;
        position: relative;
        border-radius: 16px;
        margin: 4px;
      }

      .item-background {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: #f8fafc;
        border-radius: 12px;
        transition: all 0.3s ease;
        opacity: 0;
      }

      .item-hover-effect {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0);
        width: 100%;
        height: 100%;
        background: radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%);
        border-radius: 50%;
        transition: transform 0.3s ease;
        pointer-events: none;
      }

      .modern-item:hover .item-background {
        opacity: 1;
        background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      }

      .modern-item:hover .item-hover-effect {
        transform: translate(-50%, -50%) scale(1);
      }

      .modern-item:hover {
        transform: translateY(-2px);
      }

      .item-content {
        position: relative;
        z-index: 2;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
      }

      .menu-icon {
        font-size: 24px;
        transition: transform 0.3s ease;
      }

      .modern-item:hover .menu-icon {
        transform: scale(1.1);
      }

      .menu-label {
        font-size: 12px;
        font-weight: 600;
        color: #374151;
        text-align: center;
        transition: color 0.3s ease;
      }

      .modern-item:hover .menu-label {
        color: #111827;
      }

      .menu-badge {
        position: absolute;
        top: -8px;
        right: -8px;
        background: linear-gradient(135deg, #ef4444, #dc2626);
        color: white;
        font-size: 10px;
        font-weight: 700;
        padding: 4px 7px;
        border-radius: 12px;
        min-width: 20px;
        text-align: center;
        box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
        border: 2px solid white;
      }

      /* 단골 레벨 모던 컨테이너 */
      /* 단골 레벨 카드 전용 스타일 */
      .loyalty-gradient-header {
        background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
        border-bottom: 1px solid #f59e0b;
        position: relative;
        overflow: hidden;
      }

      .loyalty-gradient-header::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, #f59e0b, #d97706, #f59e0b);
      }

      .loyalty-icon {
        background: linear-gradient(135deg, #fbbf24, #f59e0b) !important;
        color: white !important;
        box-shadow: 0 4px 20px rgba(245, 158, 11, 0.3) !important;
      }

      .loyalty-btn {
        background: rgba(245, 158, 11, 0.1) !important;
        border-color: #f59e0b !important;
        color: #d97706 !important;
      }

      .loyalty-btn:hover {
        background: rgba(245, 158, 11, 0.2) !important;
        transform: scale(1.02) !important;
        box-shadow: 0 4px 16px rgba(245, 158, 11, 0.25) !important;
      }

      .loyalty-body {
        padding: 24px !important;
        background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
      }

      /* 활동 카드 전용 스타일 */
      .activity-gradient-header {
        background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
        border-bottom: 1px solid #10b981;
        position: relative;
        overflow: hidden;
      }

      .activity-gradient-header::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, #10b981, #059669, #10b981);
      }

      .activity-icon {
        background: linear-gradient(135deg, #10b981, #059669) !important;
        color: white !important;
        box-shadow: 0 4px 20px rgba(16, 185, 129, 0.3) !important;
      }

      .activity-btn {
        background: rgba(16, 185, 129, 0.1) !important;
        border-color: #10b981 !important;
        color: #059669 !important;
      }

      .activity-btn:hover {
        background: rgba(16, 185, 129, 0.2) !important;
        transform: scale(1.02) !important;
        box-shadow: 0 4px 16px rgba(16, 185, 129, 0.25) !important;
      }

      .activity-body {
        padding: 24px !important;
        background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
      }

      .regular-levels-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .regular-level-item {
        background: linear-gradient(135deg, #ffffff 0%, #fefbf7 100%);
        border-radius: 16px;
        padding: 20px;
        border: 2px solid #f59e0b;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
        box-shadow: 0 4px 20px rgba(245, 158, 11, 0.1);
      }

      .regular-level-item::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 4px;
        background: linear-gradient(135deg, #f59e0b, #d97706);
        border-radius: 0 2px 2px 0;
      }

      .regular-level-item:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 32px rgba(245, 158, 11, 0.2);
        border-color: #fbbf24;
        background: linear-gradient(135deg, #ffffff 0%, #fef3c7 100%);
      }

      .level-store-name {
        font-weight: 700;
        color: #111827;
        margin-bottom: 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 16px;
      }

      .level-badge {
        background: linear-gradient(135deg, #f59e0b, #d97706);
        color: white;
        padding: 8px 16px;
        border-radius: 24px;
        font-size: 12px;
        font-weight: 700;
        box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      }

      .level-progress {
        font-size: 13px;
        color: #92400e;
        margin-bottom: 8px;
        font-weight: 600;
      }

      .level-benefits {
        font-size: 12px;
        color: #d97706;
        font-weight: 600;
        background: rgba(245, 158, 11, 0.15);
        padding: 6px 12px;
        border-radius: 12px;
        display: inline-block;
        border: 1px solid rgba(245, 158, 11, 0.2);
      }

      /* 활동 리스트 모던 */
      .modern-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .activity-item {
        background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%);
        border-radius: 16px;
        padding: 20px;
        border: 2px solid #10b981;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
        box-shadow: 0 4px 20px rgba(16, 185, 129, 0.1);
      }

      .activity-item::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 4px;
        background: linear-gradient(135deg, #10b981, #059669);
        border-radius: 0 2px 2px 0;
      }

      .activity-item:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 32px rgba(16, 185, 129, 0.2);
        border-color: #34d399;
        background: linear-gradient(135deg, #ffffff 0%, #ecfdf5 100%);
      }

      .activity-store {
        font-weight: 700;
        color: #111827;
        margin-bottom: 8px;
        font-size: 16px;
      }

      .activity-items {
        font-size: 14px;
        color: #047857;
        margin-bottom: 12px;
        font-weight: 500;
        line-height: 1.4;
      }

      .activity-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 13px;
      }

      .activity-date {
        color: #6b7280;
        font-weight: 500;
      }

      .activity-total {
        font-weight: 700;
        color: #059669;
        background: rgba(16, 185, 129, 0.15);
        padding: 6px 12px;
        border-radius: 12px;
        border: 1px solid rgba(16, 185, 129, 0.2);
      }

      /* 개인정보 모던 리스트 */
      .modern-info-list {
        display: flex;
        flex-direction: column;
        gap: 0;
      }

      .info-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 0;
        border-bottom: 1px solid #e5e7eb;
        transition: all 0.2s ease;
      }

      .info-item:last-child {
        border-bottom: none;
      }

      .info-item:hover {
        background: rgba(99, 102, 241, 0.02);
        margin: 0 -16px;
        padding: 16px 16px;
        border-radius: 8px;
      }

      .info-label {
        font-size: 14px;
        color: #6b7280;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .info-label::before {
        content: '';
        width: 6px;
        height: 6px;
        background: #6366f1;
        border-radius: 50%;
      }

      .info-value {
        font-size: 14px;
        color: #111827;
        font-weight: 600;
      }

      /* 모던 스켈레톤 */
      .modern-skeleton {
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        border-radius: 12px;
        padding: 24px;
        text-align: center;
        color: #6b7280;
        font-weight: 500;
        position: relative;
        overflow: hidden;
        border: 1px solid #e2e8f0;
      }

      .skeleton-shimmer {
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
        animation: shimmer 1.5s infinite;
      }

      @keyframes shimmer {
        0% { left: -100%; }
        100% { left: 100%; }
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
    setupAccountEventListeners();
    loadAccountData();
  }, 100);

  // 추가 안전장치 - DOMContentLoaded와 동시에 실행
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log('🔧 DOMContentLoaded 이벤트로 추가 설정');
      setupAccountEventListeners();
    });
  } else {
    // DOM이 이미 로드된 경우 즉시 실행
    console.log('🔧 DOM이 이미 로드됨, 즉시 이벤트 리스너 설정');
    setTimeout(() => setupAccountEventListeners(), 10);
  }
}

// 계정 페이지 전용 이벤트 리스너 설정
function setupAccountEventListeners() {
  // 이미 이벤트가 설정되었는지 확인
  if (window.accountEventListenersInitialized) {
    console.log('⚠️ 이벤트 리스너가 이미 설정됨 - 중복 방지');
    return;
  }

  console.log('🔧 이벤트 리스너 등록 중...');

  // 이벤트 핸들러 함수들을 미리 정의 (중복 방지용)
  const handleBackClick = function(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('🔙 뒤로가기 버튼 클릭됨');

    if (typeof window.renderMyPage === 'function') {
      console.log('✅ renderMyPage 함수 호출');
      window.renderMyPage();
    } else {
      console.log('🔄 renderMyPage 함수가 없음 - 브라우저 뒤로가기 사용');
      window.history.back();
    }
  };

  const handleLogoutClick = function(e) {
    e.preventDefault();
    if (confirm('정말 로그아웃 하시겠습니까?')) {
      console.log('🚪 로그아웃 확인 - 완전한 로그아웃 처리');

      try {
        // authManager의 logOutF 함수 직접 호출
        if (typeof window.logOutF === 'function') {
          console.log('✅ logOutF 함수 발견 - 호출 중');
          window.logOutF();
        } else {
          console.warn('⚠️ logOutF 함수 없음 - 수동 로그아웃 처리');

          // 수동으로 완전한 로그아웃 처리
          window.userInfo = null;

          // localStorage 완전 초기화
          localStorage.clear();
          console.log('🗑️ localStorage 완전 초기화 완료');

          // 쿠키 삭제
          document.cookie = 'userInfo=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
          console.log('🗑️ 쿠키 삭제 완료');

          console.log('✅ 수동 로그아웃 처리 완료');
          alert('로그아웃 완료');

          // 로그인 화면으로 이동
          if (typeof renderLogin === 'function') {
            renderLogin();
          } else {
            window.location.href = '/';
          }
        }
      } catch (error) {
        console.error('❌ 로그아웃 처리 중 오류:', error);

        // 오류 발생 시 강제 로그아웃
        window.userInfo = null;
        localStorage.clear();
        document.cookie = 'userInfo=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
        alert('로그아웃 완료');
        window.location.reload();
      }
    }
  };

  const handleEditProfileClick = function(e) {
    e.preventDefault();
    showEditProfileModal();
  };

  const handleCouponClick = async function(e) {
    e.preventDefault();
    await loadAllCouponsScript();
    if (typeof renderAllCoupons === 'function') {
      window.previousScreen = 'renderMyAccount';
      renderAllCoupons(window.userInfo || { id: 'user1' });
    } else {
      showCouponModal();
    }
  };

  const handleFavoritesClick = async function(e) {
    e.preventDefault();
    await loadAllFavoritesScript();
    if (typeof renderAllFavorites === 'function') {
      window.previousScreen = 'renderMyAccount';
      renderAllFavorites(window.userInfo || { id: 'user1' });
    } else {
      showFavoritesModal();
    }
  };

  const handleAchievementsClick = function(e) {
    e.preventDefault();
    showAchievementsModal();
  };

  const handleSettingsClick = function(e) {
    e.preventDefault();
    alert('설정 기능은 개발 중입니다.');
  };

  const handleViewAllOrdersClick = function(e) {
    e.preventDefault();
    if (typeof renderAllOrderHTML === 'function') {
      renderAllOrderHTML(window.userInfo || { id: 'user1' });
    } else {
      showAllOrdersModal();
    }
  };

  const handleViewAllLevelsClick = async function(e) {
    e.preventDefault();
    await loadAllRegularLevelsScript();
    if (typeof renderAllRegularLevels === 'function') {
      window.previousScreen = 'renderMyAccount';
      renderAllRegularLevels(window.userInfo || { id: 'user1' });
    } else {
      showAllRegularLevelsModal();
    }
  };

  const handleEditPersonalInfoClick = async function(e) {
    e.preventDefault();
    await loadEditPersonalInfoScript();
    if (typeof renderEditPersonalInfo === 'function') {
      renderEditPersonalInfo(window.userInfo || { id: 'user1' });
    } else {
      alert('개인정보 수정 기능을 불러올 수 없습니다.');
    }
  };

  // 버튼들과 이벤트 핸들러 매핑
  const buttonConfigs = [
    { id: 'backBtn', handler: handleBackClick },
    { id: 'logoutBtn', handler: handleLogoutClick },
    { id: 'editProfileBtn', handler: handleEditProfileClick },
    { id: 'couponBtn', handler: handleCouponClick },
    { id: 'favoritesBtn', handler: handleFavoritesClick },
    { id: 'achievementsBtn', handler: handleAchievementsClick },
    { id: 'settingsBtn', handler: handleSettingsClick },
    { id: 'viewAllOrdersBtn', handler: handleViewAllOrdersClick },
    { id: 'viewAllLevelsBtn', handler: handleViewAllLevelsClick },
    { id: 'editPersonalInfoBtn', handler: handleEditPersonalInfoClick }
  ];

  // 각 버튼에 이벤트 리스너 등록
  buttonConfigs.forEach(config => {
    const element = document.getElementById(config.id);
    if (element) {
      // 기존 이벤트 리스너 제거 (있다면)
      element.removeEventListener('click', config.handler);

      // 새 이벤트 리스너 등록
      element.addEventListener('click', config.handler);

      console.log(`✅ ${config.id} 이벤트 리스너 등록 완료`);
    } else {
      console.warn(`⚠️ ${config.id} 요소를 찾을 수 없음`);
    }
  });

  // 전역 플래그 설정하여 중복 호출 방지
  window.accountEventListenersInitialized = true;

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
        <div class="level-progress">🎯 ${levelInfo.points} / ${levelInfo.nextLevelPoints} 포인트</div>
        <div class="level-benefits">${levelInfo.benefits.join(', ')}</div>
      </div>
    `).join('');
  } else {
    regularLevelsContainer.innerHTML = `
      <div class="modern-skeleton">
        <div class="skeleton-shimmer"></div>
        <span>등록된 단골 레벨이 없습니다</span>
      </div>
    `;
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
        <div class="activity-store">🏪 ${order.store}</div>
        <div class="activity-items">${order.items.map(item => `${item.name} × ${item.qty}`).join(', ')}</div>
        <div class="activity-meta">
          <span class="activity-date">📅 ${order.date}</span>
          <span class="activity-total">${order.total.toLocaleString()}원</span>
        </div>
      </div>
    `).join('');
  } else {
    activityList.innerHTML = `
      <div class="modern-skeleton">
        <div class="skeleton-shimmer"></div>
        <span>최근 주문 내역이 없습니다</span>
      </div>
    `;
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
    <div class="info-item">
      <span class="info-label">VIP 등급</span>
      <span class="info-value">${data.vipLevel}</span>
    </div>
    <div class="info-item">
      <span class="info-label">보유 포인트</span>
      <span class="info-value">${data.point.toLocaleString()}P</span>
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
  if (typeof renderAllOrderHTML === 'function') {
    // 이전 화면 정보 저장
    window.previousScreen = 'renderMyAccount';
    renderAllOrderHTML(window.userInfo || { id: 'user1' });
  } else {
    alert('전체 주문 내역 보기 기능을 불러올 수 없습니다.');
  }
}

function showAllRegularLevelsModal() {
  alert('전체 단골 레벨 보기 기능은 개발 중입니다.');
}

// 개인정보 수정 스크립트 로드 함수
async function loadEditPersonalInfoScript() {
  if (typeof window.renderEditPersonalInfo === 'function') {
    return; // 이미 로드됨
  }

  try {
    console.log('🔄 renderEditPersonalInfo 스크립트 로드 시작');
    const script = document.createElement('script');
    script.src = '/TLG/pages/mypage/renderEditPersonalInfo.js';

    await new Promise((resolve, reject) => {
      script.onload = () => {
        console.log('✅ renderEditPersonalInfo 스크립트 로드 완료');
        resolve();
      };
      script.onerror = () => {
        console.error('❌ renderEditPersonalInfo 스크립트 로드 실패');
        reject();
      };
      document.head.appendChild(script);
    });
  } catch (error) {
    console.error('❌ renderEditPersonalInfo 스크립트 로드 중 오류:', error);
    throw error;
  }
}

// 스크립트 로드 함수들
async function loadAllFavoritesScript() {
  if (typeof window.renderAllFavorites === 'function') {
    return; // 이미 로드됨
  }

  try {
    console.log('🔄 renderAllFavorites 스크립트 로드 시작');
    const script = document.createElement('script');
    script.src = '/TLG/pages/mypage/renderAllFavorites.js';

    await new Promise((resolve, reject) => {
      script.onload = () => {
        console.log('✅ renderAllFavorites 스크립트 로드 완료');
        resolve();
      };
      script.onerror = () => {
        console.error('❌ renderAllFavorites 스크립트 로드 실패');
        reject();
      };
      document.head.appendChild(script);
    });
  } catch (error) {
    console.error('❌ renderAllFavorites 스크립트 로드 중 오류:', error);
    throw error;
  }
}

async function loadAllRegularLevelsScript() {
  if (typeof window.renderAllRegularLevels === 'function') {
    return; // 이미 로드됨
  }

  try {
    console.log('🔄 renderAllRegularLevels 스크립트 로드 시작');
    const script = document.createElement('script');
    script.src = '/TLG/pages/mypage/renderAllRegularLevels.js';

    await new Promise((resolve, reject) => {
      script.onload = () => {
        console.log('✅ renderAllRegularLevels 스크립트 로드 완료');
        resolve();
      };
      script.onerror = () => {
        console.error('❌ renderAllRegularLevels 스크립트 로드 실패');
        reject();
      };
      document.head.appendChild(script);
    });
  } catch (error) {
    console.error('❌ renderAllRegularLevels 스크립트 로드 중 오류:', error);
    throw error;
  }
}

async function loadAllCouponsScript() {
  if (typeof window.renderAllCoupons === 'function') {
    return; // 이미 로드됨
  }

  try {
    console.log('🔄 renderAllCoupons 스크립트 로드 시작');
    const script = document.createElement('script');
    script.src = '/TLG/pages/mypage/renderAllCoupons.js';

    await new Promise((resolve, reject) => {
      script.onload = () => {
        console.log('✅ renderAllCoupons 스크립트 로드 완료');
        resolve();
      };
      script.onerror = () => {
        console.error('❌ renderAllCoupons 스크립트 로드 실패');
        reject();
      };
      document.head.appendChild(script);
    });
  } catch (error) {
    console.error('❌ renderAllCoupons 스크립트 로드 중 오류:', error);
    throw error;
  }
}

// 전역 함수 등록
window.renderMyAccount = renderMyAccount;