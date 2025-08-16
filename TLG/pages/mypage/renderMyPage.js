async function renderMyPage() {
  const main = document.getElementById('main');

  // UI 먼저 렌더링 (로딩 상태로)
  main.innerHTML = `
    <button id="settingsBtn" class="settings-button">⚙️</button>

    <main id="content">
      <!-- 프로필 정보 영역 -->
      <div class="profile-card">
        <div class="profile-header">
          <div class="profile-image-container">
            <div class="profile-image" id="profileImage">
              <span class="profile-icon">👤</span>
            </div>
            <div class="profile-status-indicator"></div>
          </div>
          <div class="profile-basic-info">
            <div class="profile-name" id="profileName">사용자 정보 로딩중...</div>
            <div class="profile-level" id="profileLevel">등급 확인중...</div>
          </div>
        </div>

        <div class="profile-details">
          <div class="detail-row">
            <span class="detail-label">👤 아이디</span>
            <span class="detail-value" id="profileUserId">로딩중...</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">📧 이메일</span>
            <span class="detail-value" id="profileEmail">test@tablelink.co.kr</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">🎂 나이</span>
            <span class="detail-value" id="profileAge">25세</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">📱 전화번호</span>
            <span class="detail-value" id="profilePhone">010-1234-5678</span>
          </div>
        </div>

        <div class="profile-stats">
          <div class="stat-item">
            <span class="stat-value" id="totalOrders">-</span>
            <span class="stat-label">총 주문</span>
          </div>
          <div class="stat-item">
            <span class="stat-value" id="totalReviews">-</span>
            <span class="stat-label">리뷰수</span>
          </div>
          <div class="stat-item">
            <span class="stat-value" id="favoriteCount">-</span>
            <span class="stat-label">즐겨찾기</span>
          </div>
        </div>
      </div>
      <section class="section-card">
        <h2>📦 주문내역</h2>
        <div id="orderList">
          <p>📋 주문내역을 불러오는 중...</p>
        </div>
      </section>

      <section class="section-card">
        <h2>📅 예약내역</h2>
        <div id="reservationList">
          <p>📅 예약내역을 불러오는 중...</p>
        </div>
      </section>

      <section class="section-card">
        <h2>🎁 쿠폰 리스트</h2>
        <div id="couponList">
          <p>🎁 쿠폰 정보를 불러오는 중...</p>
        </div>
      </section>

      <section class="section-card">
        <h2>💖 즐겨찾기 매장</h2>
        <div id="favoriteStoresList">
          <p>💖 즐겨찾기 매장을 불러오는 중...</p>
        </div>
      </section>

      <section class="section-card">
        <h2>⭐ 내 리뷰 내역</h2>
        <div id="reviewList">
          <p>📝 리뷰 내역을 불러오는 중...</p>
        </div>
      </section>

      <!-- 매장별 보유 포인트 정보 영역 -->
      <section class="section-card">
        <h2>💰 매장별 보유 포인트</h2>
        <div id="storePointsList">
          <p>💰 매장별 포인트 정보를 불러오는 중...</p>
        </div>
      </section>

      <!-- 단골 레벨 정보 영역 -->
      <section class="section-card">
        <h2>🏆 나의 단골 레벨</h2>
        <div id="regularLevelsList">
          <p>🏆 단골 레벨 정보를 불러오는 중...</p>
        </div>
      </section>

    </main>

    <nav id="bottomBar">
      <button id="homeBtn" title="홈" onclick="renderSubMain()">
        <span style="font-size: 22px;">🏠</span>
      </button>
      <button id="searchBtn" title="검색" onclick="renderSearch('')">
        <span style="font-size: 22px;">🔍</span>
      </button>
      <button onclick="renderMap().catch(console.error)" title="지도">
        <span style="font-size: 22px;">📍</span>
      </button>
      <button class="active" onclick="renderMyPage()" title="마이페이지">
        <span style="font-size: 22px;">👤</span>
      </button>
    </nav>

    <style>
      #main {
        font-family: sans-serif;
        background: #f8f9fb;
        overflow: hidden; /* 전체 스크롤 방지 */
      }

      .settings-button {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        border: none;
        background: rgba(255, 255, 255, 0.95);
        border-radius: 50%;
        font-size: 24px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #297efc;
        transition: all 0.3s ease;
        box-shadow: 0 4px 16px rgba(41, 126, 252, 0.15);
        z-index: 9999;
        backdrop-filter: blur(10px);
        border: 2px solid rgba(41, 126, 252, 0.1);
      }

      .settings-button:hover {
        background: rgba(41, 126, 252, 0.1);
        transform: scale(1.1) rotate(90deg);
        box-shadow: 0 6px 20px rgba(41, 126, 252, 0.25);
      }

      .settings-button:active {
        background: rgba(41, 126, 252, 0.2);
        transform: scale(0.95) rotate(90deg);
      }

      /* 프로필 카드 스타일 */
      .profile-card {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 20px;
        padding: 24px;
        margin-bottom: 24px;
        box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
      }

      .profile-header {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 20px;
      }

      .profile-image-container {
        position: relative;
        flex-shrink: 0;
      }

      .profile-image {
        width: 70px;
        height: 70px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(10px);
        border: 3px solid rgba(255, 255, 255, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
        transition: all 0.3s ease;
      }

      .profile-status-indicator {
        position: absolute;
        bottom: 2px;
        right: 2px;
        width: 18px;
        height: 18px;
        background: #4CAF50;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }

      .profile-basic-info {
        flex: 1;
        min-width: 0;
      }

      .profile-name {
        font-size: 22px;
        font-weight: 700;
        margin-bottom: 6px;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .profile-level {
        font-size: 14px;
        opacity: 0.9;
        padding: 4px 12px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 20px;
        display: inline-block;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      .profile-details {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 20px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      .detail-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .detail-row:last-child {
        border-bottom: none;
      }

      .detail-label {
        font-size: 14px;
        font-weight: 600;
        opacity: 0.9;
      }

      .detail-value {
        font-size: 14px;
        font-weight: 500;
        text-align: right;
      }

      .profile-stats {
        display: flex;
        justify-content: space-around;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 16px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      .stat-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
      }

      .stat-value {
        font-size: 20px;
        font-weight: 700;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      }

      .stat-label {
        font-size: 11px;
        opacity: 0.8;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      #content {
        position: absolute;
        top: 0;           /* 상단부터 시작 */
        bottom: 78px;     /* 바텀 바 높이만큼 */
        left: 0;
        width: 100%;
        max-width: 430px;
        overflow-y: auto;  /* 여기만 스크롤 */
        padding: 18px;
        box-sizing: border-box;
        background: #f8f9fb;
        z-index: 1;
      }

      .section-card {
        background: white;
        border-radius: 12px;
        padding: 14px 16px;
        margin-bottom: 18px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
      }
      .section-card h2 {
        margin-bottom: 10px;
        font-size: 18px;
        font-weight: 600;
      }

      #bottomBar {
        position: fixed;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 100%;
        max-width: 430px;
        height: 78px;
        background: linear-gradient(145deg, rgba(255,255,255,0.98), rgba(250,252,255,0.95));
        border-top: 1px solid rgba(255, 255, 255, 0.3);
        box-shadow:
          0 -8px 32px rgba(41, 126, 252, 0.08),
          0 -4px 16px rgba(0, 0, 0, 0.04),
          inset 0 1px 0 rgba(255, 255, 255, 0.8);
        display: flex;
        justify-content: space-around;
        align-items: center;
        z-index: 1001;
        padding: 8px 16px 12px 16px;
        box-sizing: border-box;
        border-radius: 24px 24px 0 0;
        backdrop-filter: blur(20px);
        gap: 8px;
      }

      #bottomBar button {
        position: relative;
        flex: 1;
        height: 52px;
        min-width: 0;
        border: none;
        outline: none;
        border-radius: 16px;
        background: linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%);
        color: #6B7280;
        font-size: 20px;
        font-family: inherit;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.4);
      }

      #bottomBar button::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, rgba(41, 126, 252, 0.05), rgba(79, 70, 229, 0.03));
        opacity: 0;
        transition: opacity 0.3s ease;
        border-radius: 16px;
      }

      #bottomBar button:hover {
        background: linear-gradient(135deg, #f0f4ff 0%, #e8f0ff 100%);
        color: #297efc;
        transform: translateY(-2px);
        box-shadow:
          0 8px 24px rgba(41, 126, 252, 0.12),
          0 4px 12px rgba(0, 0, 0, 0.05);
        border-color: rgba(41, 126, 252, 0.2);
      }

      #bottomBar button:hover::before {
        opacity: 1;
      }

      #bottomBar button:active {
        transform: translateY(0px);
        box-shadow:
          0 4px 16px rgba(41, 126, 252, 0.15),
          0 2px 8px rgba(0, 0, 0, 0.05);
      }
      .order-item {
        background: #fff;
        border-radius: 8px;
        padding: 8px 12px;
        margin-bottom: 8px;
        border: 1px solid #f0f0f0;
      }
      .order-info {
        margin-bottom: 6px;
        line-height: 1.3;
      }
      .review-section {
        display: flex;
        justify-content: flex-end;
      }
      .review-btn {
        background: #297efc;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 13px;
        cursor: pointer;
        transition: background 0.2s;
      }
      .review-btn:hover {
        background: #2266d9;
      }
      .review-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2000;
      }
      .review-modal-content {
        background: white;
        padding: 20px;
        border-radius: 12px;
        width: 90%;
        max-width: 400px;
        max-height: 80%;
        overflow-y: auto;
      }
      .star-rating {
        display: flex;
        gap: 5px;
        margin: 10px 0;
      }
      .star {
        font-size: 24px;
        cursor: pointer;
        color: #ddd;
        transition: color 0.2s;
      }
      .star.active {
        color: #ffbf00;
      }
      .review-textarea {
        width: 100%;
        height: 100px;
        border: 1px solid #ddd;
        border-radius: 6px;
        padding: 8px;
        font-size: 14px;
        resize: vertical;
      }
      .modal-buttons {
        display: flex;
        gap: 10px;
        margin-top: 15px;
      }
      .modal-btn {
        flex: 1;
        padding: 10px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
      }
      .submit-btn {
        background: #297efc;
        color: white;
      }
      .cancel-btn {
        background: #f0f0f0;
        color: #333;
      }
      .more-orders-btn {
        width: 100%;
        padding: 10px;
        margin-top: 10px;
        background: #6c757d;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        transition: background 0.2s;
      }
      .more-orders-btn:hover {
        background: #5a6268;
      }
      .review-item {
        background: #f8f9fa;
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 8px;
        border: 1px solid #e9ecef;
        transition: background 0.2s;
      }
      .review-item:hover {
        background: #e9ecef;
      }
      .review-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      .review-store {
        font-weight: 600;
        color: #333;
      }
      .review-rating {
        color: #ffbf00;
        font-weight: bold;
      }
      .review-content {
        color: #666;
        font-size: 14px;
        line-height: 1.4;
        margin-bottom: 6px;
      }
      .review-date {
        color: #999;
        font-size: 12px;
      }
      .view-all-reviews-btn {
        width: 100%;
        padding: 10px;
        margin-top: 10px;
        background: #17a2b8;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        transition: background 0.2s;
      }
      .view-all-reviews-btn:hover {
        background: #138496;
      }
      .view-all-favorites-btn {
        width: 100%;
        padding: 10px;
        margin-top: 10px;
        background: #e91e63;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        transition: background 0.2s;
      }
      .view-all-favorites-btn:hover {
        background: #c2185b;
      }
      .review-actions {
        display: flex;
        gap: 8px;
        margin-top: 10px;
        justify-content: flex-end;
      }
      .edit-review-btn, .delete-review-btn, .go-to-store-btn {
        padding: 6px 10px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 12px;
        transition: background 0.2s, opacity 0.2s;
      }
      .edit-review-btn {
        background: #ffc107;
        color: white;
      }
      .edit-review-btn:hover {
        background: #e0a800;
      }
      .delete-review-btn {
        background: #dc3545;
        color: white;
      }
      .delete-review-btn:hover {
        background: #c82333;
      }
      .go-to-store-btn {
        background: #28a745;
        color: white;
      }
      .go-to-store-btn:hover {
        background: #218838;
      }
      .favorite-store-icon {
        cursor: pointer;
        font-size: 20px;
        margin-left: 10px;
        color: #ccc; /* 기본 회색 */
      }
      .favorite-store-icon.active {
        color: #ffc107; /* 활성화 시 노란색 */
      }

      /* 즐겨찾기 매장 카드 스타일 */
      .favorite-store-item {
        background: #f8f9fa;
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 12px;
        border: 1px solid #e9ecef;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .favorite-store-item:hover {
        background: #e9ecef;
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }
      .favorite-store-content {
        flex: 1;
      }
      .favorite-store-name {
        font-weight: 600;
        color: #333;
        font-size: 16px;
        margin-bottom: 4px;
      }
      .favorite-store-info {
        color: #666;
        font-size: 13px;
        line-height: 1.3;
      }
      .favorite-store-actions {
        display: flex;
        gap: 8px;
        align-items: center;
      }
      .favorite-heart-btn {
        padding: 8px 16px;
        border: 1px solid #ddd;
        border-radius: 6px;
        background: white;
        color: #666;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 80px;
      }
      .favorite-heart-btn.favorited {
        background: #ff6b6b;
        color: white;
        border-color: #ff6b6b;
      }
      .favorite-heart-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
      .favorite-heart-btn.favorited:hover {
        background: #ff5252;
        border-color: #ff5252;
      }

      /* 단골 레벨 관련 스타일 */
      .regular-level-item {
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        border-radius: 16px;
        padding: 20px;
        margin-bottom: 16px;
        border: 1px solid #e9ecef;
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      }
      .regular-level-item:hover {
        background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      }
      .level-store-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        cursor: pointer;
      }
      .level-store-info {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .level-store-name {
        font-weight: 700;
        color: #333;
        font-size: 18px;
      }
      .level-badge {
        color: white;
        padding: 6px 12px;
        border-radius: 16px;
        font-size: 12px;
        font-weight: 600;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
      }
      .level-current-stats {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 12px;
        margin-bottom: 16px;
        font-size: 14px;
        color: #666;
      }
      .current-stat-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        text-align: center;
        padding: 8px 4px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        min-height: 60px;
        justify-content: center;
      }
      .stat-icon {
        font-size: 18px;
        margin-bottom: 4px;
      }
      .stat-value {
        font-weight: 700;
        color: #333;
        font-size: 16px;
        line-height: 1.2;
        word-break: break-all;
        text-align: center;
      }
      .stat-label {
        font-size: 11px;
        color: #666;
        font-weight: 500;
        margin-top: 2px;
        white-space: nowrap;
      }
      .level-progress-section {
        background: rgba(255, 255, 255, 0.6);
        border-radius: 12px;
        padding: 16px;
        border: 1px solid rgba(255, 255, 255, 0.8);
      }
      .progress-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }
      .next-level-info {
        font-size: 14px;
        font-weight: 600;
        color: #667eea;
      }
      .progress-percentage {
        font-size: 16px;
        font-weight: 700;
        color: #28a745;
      }
      .progress-requirements {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 10px;
        margin-bottom: 16px;
      }
      .requirement-item {
        text-align: center;
      }
      .requirement-label {
        font-size: 11px;
        color: #666;
        margin-bottom: 4px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .requirement-gauge {
        height: 8px;
        background: #e9ecef;
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 6px;
      }
      .requirement-fill {
        height: 100%;
        border-radius: 4px;
        transition: width 0.6s ease;
      }
      .requirement-fill.visits {
        background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      }
      .requirement-fill.spending {
        background: linear-gradient(90deg, #f093fb 0%, #f5576c 100%);
      }
      .requirement-fill.points {
        background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
      }
      .requirement-fill.completed {
        background: linear-gradient(90deg, #28a745 0%, #20c997 100%);
        box-shadow: 0 0 8px rgba(40, 167, 69, 0.3);
      }
      .requirement-text {
        font-size: 11px;
        font-weight: 600;
        color: #333;
        word-break: break-all;
        text-align: center;
        line-height: 1.2;
      }
      .requirement-needed {
        font-size: 11px;
        color: #999;
        margin-top: 2px;
        word-break: break-all;
        text-align: center;
        line-height: 1.2;
      }
      .requirement-needed.completed-text {
        color: #28a745;
        font-weight: 600;
      }
      .achievement-rate {
        color: #28a745;
        font-weight: 700;
        font-size: 10px;
        margin-left: 4px;
        background: rgba(40, 167, 69, 0.1);
        padding: 2px 6px;
        border-radius: 8px;
      }
      .overall-progress-bar {
        height: 12px;
        background: #e9ecef;
        border-radius: 6px;
        overflow: hidden;
        margin-bottom: 8px;
      }
      .overall-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        border-radius: 6px;
        transition: width 0.8s ease;
      }
      .progress-description {
        font-size: 12px;
        color: #666;
        text-align: center;
      }
      .view-all-regular-levels-btn {
        width: 100%;
        padding: 10px;
        margin-top: 10px;
        background: #6f42c1;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        transition: background 0.2s;
      }
      .view-all-regular-levels-btn:hover {
        background: #5a32a3;
      }

      /* 단골 레벨 시작 섹션 스타일 */
      .start-loyalty-section {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 16px;
        padding: 20px;
        text-align: center;
        color: white;
        margin-bottom: 16px;
      }
      .start-loyalty-message {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 20px;
        text-align: left;
      }
      .start-loyalty-icon {
        font-size: 32px;
        flex-shrink: 0;
      }
      .start-loyalty-text h4 {
        margin: 0 0 8px 0;
        font-size: 18px;
        font-weight: 700;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
      }
      .start-loyalty-text p {
        margin: 0;
        font-size: 14px;
        opacity: 0.9;
        line-height: 1.4;
      }
      .start-loyalty-btn {
        width: 100%;
        padding: 14px 20px;
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 12px;
        font-size: 16px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
      }
      .start-loyalty-btn:hover {
        background: rgba(255, 255, 255, 0.3);
        border-color: rgba(255, 255, 255, 0.5);
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
      }
      .start-loyalty-btn:active {
        transform: translateY(0);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }

      /* 매장별 포인트 관련 스타일 */
      .store-points-item {
        background: #f8f9fa;
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 12px;
        border: 1px solid #e9ecef;
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: all 0.2s ease;
      }
      .store-points-item:hover {
        background: #e9ecef;
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }
      .points-store-info {
        flex: 1;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .points-store-name {
        font-weight: 600;
        color: #333;
        font-size: 16px;
      }
      .points-store-category {
        font-size: 12px;
        color: #666;
        background: #e9ecef;
        padding: 2px 6px;
        border-radius: 8px;
      }
      .points-amount {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        font-size: 14px;
      }
      .points-value {
        font-size: 18px;
        font-weight: 700;
        color: #28a745;
        margin-bottom: 2px;
      }
      .points-label {
        font-size: 11px;
        color: #666;
      }
      .view-all-points-btn {
        width: 100%;
        padding: 10px;
        margin-top: 10px;
        background: #28a745;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        transition: background 0.2s;
      }
      .view-all-points-btn:hover {
        background: #218838;
      }
    </style>
  `;

  // 설정 버튼 이벤트 리스너 추가
  const settingsBtn = document.querySelector('#settingsBtn');
  settingsBtn.addEventListener('click', () => {
    if (typeof renderMyAccount === 'function') {
      renderMyAccount();
    } else {
      console.warn('⚠️ renderMyAccount 함수를 찾을 수 없습니다');
    }
  });

  // 바텀 네비게이션 이벤트 리스너 추가
  const homeBtn = document.querySelector('#homeBtn');
  if (homeBtn) {
    homeBtn.addEventListener('click', () => {
      if (typeof renderSubMain === 'function') {
        renderSubMain();
      } else {
        console.warn('⚠️ renderSubMain 함수를 찾을 수 없습니다');
      }
    });
  }

  const searchBtn = document.querySelector('#searchBtn');
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      if (typeof renderSearch === 'function') {
        renderSearch(''); // 검색어 없이 호출
      } else {
        console.warn('⚠️ renderSearch 함수를 찾을 수 없습니다');
      }
    });
  }

  const renderMapBtn = document.querySelector('#renderMapBtn');
  if (renderMapBtn) {
    renderMapBtn.addEventListener('click', () => {
      if (typeof renderMap === 'function') {
        renderMap();
      } else {
        location.reload();
      }
    });
  }

  const notificationBtn = document.querySelector('#notificationBtn');
  if (notificationBtn) {
    notificationBtn.addEventListener('click', () => {
      if (typeof renderNotification === 'function') {
        renderNotification();
      } else {
        console.warn('⚠️ renderNotification 함수를 찾을 수 없습니다');
      }
    });
  }

  // 비동기로 사용자 정보 로드 및 업데이트
  loadUserData();
}

// 즐겨찾기 매장을 불러오는 함수
async function loadFavoriteStores(userId) {
  try {
    const response = await fetch(`/api/users/favorites/${userId}`);
    if (!response.ok) {
      throw new Error('즐겨찾기 매장 정보 조회 실패');
    }
    const data = await response.json();
    return data.stores || [];
  } catch (error) {
    console.error('즐겨찾기 매장 로딩 실패:', error);
    return [];
  }
}

// 프로필 섹션 업데이트 함수
async function updateProfileSection(currentUserInfo, ordersData, favoriteStoresData) {
  const profileName = document.getElementById('profileName');
  const profileLevel = document.getElementById('profileLevel');
  const totalOrders = document.getElementById('totalOrders');
  const totalReviews = document.getElementById('totalReviews');
  const favoriteCount = document.getElementById('favoriteCount');
  const profileImage = document.getElementById('profileImage');

  if (!profileName || !profileLevel) return;

  // 사용자명 업데이트
  const displayName = currentUserInfo.name || currentUserInfo.username || userInfo.id;
  profileName.textContent = displayName;

  // 아이디 정보 업데이트
  const profileUserId = document.getElementById('profileUserId');
  if (profileUserId) {
    profileUserId.textContent = userInfo.id;
  }

  // 등급 계산 (주문 수 기반)
  const orderCount = ordersData ? ordersData.length : 0;
  let userLevel = '브론즈';
  let levelColor = '#cd7f32';

  if (orderCount >= 50) {
    userLevel = '다이아몬드';
    levelColor = '#b9f2ff';
  } else if (orderCount >= 30) {
    userLevel = '플래티넘';
    levelColor = '#e5e4e2';
  } else if (orderCount >= 15) {
    userLevel = '골드';
    levelColor = '#ffd700';
  } else if (orderCount >= 5) {
    userLevel = '실버';
    levelColor = '#c0c0c0';
  }

  profileLevel.textContent = `${userLevel} 등급`;
  profileLevel.style.background = `linear-gradient(135deg, ${levelColor}40, ${levelColor}20)`;
  profileLevel.style.borderColor = `${levelColor}60`;

  // 통계 정보 업데이트
  if (totalOrders) {
    // 전체 주문 수 가져오기
    try {
      const allOrdersResponse = await fetch(`/api/orders/mypage/${userInfo.id}?limit=1000`);
      if (allOrdersResponse.ok) {
        const allOrdersData = await allOrdersResponse.json();
        totalOrders.textContent = allOrdersData.orders?.length || 0;
      } else {
        totalOrders.textContent = orderCount;
      }
    } catch (error) {
      totalOrders.textContent = orderCount;
    }
  }

  if (totalReviews) {
    // 전체 리뷰 수 가져오기
    try {
      const reviewsResponse = await fetch(`/api/reviews/users/${userInfo.id}`);
      if (reviewsResponse.ok) {
        const reviewsData = await reviewsResponse.json();
        totalReviews.textContent = reviewsData.total || 0;
      } else {
        totalReviews.textContent = '0';
      }
    } catch (error) {
      totalReviews.textContent = '0';
    }
  }

  if (favoriteCount) {
    favoriteCount.textContent = favoriteStoresData?.length || 0;
  }

  // 프로필 이미지 업데이트 (사용자명 첫 글자 또는 이모지)
  if (profileImage) {
    const firstChar = displayName.charAt(0).toUpperCase();
    profileImage.innerHTML = `<span class="profile-icon">${isNaN(firstChar) ? firstChar : '👤'}</span>`;
  }

  console.log('✅ 프로필 섹션 업데이트 완료:', {
    name: displayName,
    level: userLevel,
    orders: totalOrders?.textContent,
    reviews: totalReviews?.textContent,
    favorites: favoriteCount?.textContent
  });
}

// 사용자 데이터를 비동기로 로드하는 함수
async function loadUserData() {
  try {
    // 사용자 기본 정보 가져오기
    const userResponse = await fetch('/api/users/info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: userInfo.id })
    });

    if (!userResponse.ok) throw new Error('사용자 정보 조회 실패');
    const userData = await userResponse.json();
    const currentUserInfo = userData.user;

    // orders 테이블에서 주문 내역 가져오기
    const ordersResponse = await fetch(`/api/orders/mypage/${userInfo.id}?limit=2`);
    let ordersData = [];
    if (ordersResponse.ok) {
      const ordersResult = await ordersResponse.json();
      ordersData = ordersResult.orders || [];
    }

    // 즐겨찾기 매장 정보 가져오기
    const favoriteStoresData = await loadFavoriteStores(userInfo.id);

    // 프로필 정보 업데이트 (우선순위 높음)
    updateProfileSection(currentUserInfo, ordersData, favoriteStoresData);

    // 주문내역 업데이트 (비동기)
    await updateOrderList(currentUserInfo, ordersData);

    // 예약내역 업데이트
    updateReservationList(currentUserInfo);

    // 쿠폰내역 업데이트
    updateCouponList(currentUserInfo);

    // 리뷰내역 업데이트
    updateReviewList(currentUserInfo);

    // 즐겨찾기 매장 UI 업데이트
    updateFavoriteStoresUI(favoriteStoresData);

    // 매장별 포인트 UI 업데이트
    await updateStorePointsList(currentUserInfo);

    // 단골 레벨 UI 업데이트
    await updateRegularLevelsList(currentUserInfo);

  } catch (error) {
    console.error('사용자 데이터 로딩 실패:', error);

    // 에러 발생 시 각 섹션에 에러 메시지 표시
    const orderList = document.querySelector('#orderList');
    const reservationList = document.querySelector('#reservationList');
    const couponList = document.querySelector('#couponList');
    const reviewList = document.querySelector('#reviewList');
    const favoriteStoresSection = document.getElementById('favoriteStoresList');
    const storePointsListDiv = document.getElementById('storePointsList');
    const regularLevelsListDiv = document.getElementById('regularLevelsList');

    if (orderList) orderList.innerHTML = `<p>❌ 주문내역을 불러올 수 없습니다.</p>`;
    if (reservationList) reservationList.innerHTML = `<p>❌ 예약내역을 불러올 수 없습니다.</p>`;
    if (couponList) couponList.innerHTML = `<p>❌ 쿠폰 정보를 불러올 수 없습니다.</p>`;
    if (reviewList) reviewList.innerHTML = `<p>❌ 리뷰 내역을 불러올 수 없습니다.</p>`;
    if (favoriteStoresSection) favoriteStoresSection.innerHTML = `<p>❌ 즐겨찾기 매장 정보를 불러올 수 없습니다.</p>`;
    if (storePointsListDiv) storePointsListDiv.innerHTML = `<p>❌ 매장별 포인트 정보를 불러올 수 없습니다.</p>`;
    if (regularLevelsListDiv) regularLevelsListDiv.innerHTML = `<p>❌ 단골 레벨 정보를 불러올 수 없습니다.</p>`;
  }
}

// 주문내역 업데이트 함수 (최근 2개만 표시)
async function updateOrderList(currentUserInfo, ordersData) {
  const orderList = document.querySelector('#orderList');
  if (!orderList) return;

  orderList.innerHTML = ''; // 기존 내용 초기화

  if (ordersData && ordersData.length > 0) {
    // 각 주문에 대한 리뷰 존재 여부를 병렬로 확인
    const reviewCheckPromises = ordersData.map(order => checkOrderHasReview(order.id));
    const reviewStatuses = await Promise.all(reviewCheckPromises);

    ordersData.forEach((order, index) => {
      const orderDiv = document.createElement('div');
      orderDiv.className = 'order-item';

      // order_data에서 메뉴 정보 추출
      const orderData = order.order_data || {};
      const items = orderData.items ? orderData.items.map(i => `${i.name}(${i.qty}개)`).join(', ') : '메뉴 정보 없음';
      const storeName = orderData.store || order.store_name || '매장 정보 없음';

      // 리뷰 작성 여부 확인 결과 사용
      const hasReview = reviewStatuses[index];

      orderDiv.innerHTML = `
        <div class="order-info">
          • <strong>${storeName}</strong><br>
          ${items}<br>
          총 ${order.final_amount?.toLocaleString() || order.total_amount?.toLocaleString() || '0'}원 | 📅 ${new Date(order.order_date).toLocaleDateString()}
        </div>
        <div class="review-section">
          ${hasReview ?
            `<p style="color: #28a745; font-size: 14px; font-weight: 600;">✅ 리뷰 작성 완료</p>` :
            `<button class="review-btn" data-order-id="${order.id}" data-order-index="${index}">📝 리뷰 작성하기</button>`
          }
        </div>
        <br>
      `;
      orderList.appendChild(orderDiv);
    });

    // 더보기 버튼 추가
    const moreBtn = document.createElement('button');
    moreBtn.className = 'more-orders-btn';
    moreBtn.innerHTML = `📋 전체 주문내역 보기`;
    moreBtn.addEventListener('click', () => {
      renderAllOrderHTML(userInfo);
    });
    orderList.appendChild(moreBtn);

    // 리뷰 작성 버튼 이벤트 리스너
    document.querySelectorAll('.review-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const orderIndex = parseInt(e.target.getAttribute('data-order-index'));
        const orderId = e.target.getAttribute('data-order-id');
        const order = ordersData[orderIndex];
        console.log('🔍 선택된 주문 정보:', order);
        showReviewModalFromOrders(order, orderIndex);
      });
    });
  } else {
    orderList.innerHTML = `<p>주문 내역이 없습니다.</p>`;
  }
}

// 주문에 대한 리뷰 존재 여부 확인 함수
async function checkOrderHasReview(orderId) {
  try {
    const response = await fetch(`/api/orders/${orderId}/review-status`);
    const data = await response.json();

    if (data.success) {
      return data.hasReview;
    } else {
      console.warn(`⚠️ 주문 ${orderId} 리뷰 상태 확인 실패:`, data.error);
      return false;
    }
  } catch (error) {
    console.error(`❌ 주문 ${orderId} 리뷰 상태 확인 오류:`, error);
    return false;
  }
}

// orders 테이블 기반 리뷰 작성 모달 표시
function showReviewModalFromOrders(order, orderIndex) {
  const orderData = order.order_data || {};
  const items = orderData.items ? orderData.items.map(i => `${i.name}(${i.qty}개)`).join(', ') : '메뉴 정보 없음';
  const storeName = orderData.store || order.store_name || '매장 정보 없음';

  const modal = document.createElement('div');
  modal.className = 'review-modal';
  modal.innerHTML = `
    <div class="review-modal-content">
      <h3>리뷰 작성</h3>
      <p><strong>매장:</strong> ${storeName}</p>
      <p><strong>주문:</strong> ${items}</p>

      <div>
        <label>평점:</label>
        <div class="star-rating">
          <span class="star" data-rating="1">★</span>
          <span class="star" data-rating="2">★</span>
          <span class="star" data-rating="3">★</span>
          <span class="star" data-rating="4">★</span>
          <span class="star" data-rating="5">★</span>
        </div>
      </div>

      <div>
        <label>리뷰 내용:</label>
        <textarea class="review-textarea" placeholder="음식과 서비스에 대한 솔직한 후기를 남겨주세요..."></textarea>
      </div>

      <div class="modal-buttons">
        <button class="modal-btn cancel-btn">취소</button>
        <button class="modal-btn submit-btn">리뷰 등록</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  let selectedRating = 0;

  // 별점 선택 이벤트
  modal.querySelectorAll('.star').forEach(star => {
    star.addEventListener('click', (e) => {
      selectedRating = parseInt(e.target.getAttribute('data-rating'));
      updateStarDisplay(modal, selectedRating);
    });
  });

  // 취소 버튼
  modal.querySelector('.cancel-btn').addEventListener('click', () => {
    document.body.removeChild(modal);
  });

  // 등록 버튼
  modal.querySelector('.submit-btn').addEventListener('click', async () => {
    const reviewText = modal.querySelector('.review-textarea').value.trim();

    if (selectedRating === 0) {
      alert('평점을 선택해주세요.');
      return;
    }

    if (reviewText === '') {
      alert('리뷰 내용을 입력해주세요.');
      return;
    }

    try {
      await submitReviewFromOrders(order, selectedRating, reviewText);
      document.body.removeChild(modal);

      // 리뷰 캐시 초기화
      if (order.store_id) {
        const reviewCacheKey = `tablelink_reviews_store_${order.store_id}`;
        localStorage.removeItem(reviewCacheKey);
        console.log('🗑️ 리뷰 등록 후 캐시 초기화 완료:', reviewCacheKey);
      }

      renderMyPage(); // 페이지 새로고침
    } catch (error) {
      console.error('리뷰 등록 오류:', error);
      alert('리뷰 등록에 실패했습니다: ' + error.message);
    }
  });

  // 모달 배경 클릭 시 닫기
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
}

// 모달 표시 (레거시 호환용)
function showReviewModal(order, orderIndex) {
  const modal = document.createElement('div');
  modal.className = 'review-modal';
  modal.innerHTML = `
    <div class="review-modal-content">
      <h3>리뷰 작성</h3>
      <p><strong>매장:</strong> ${order.store}</p>
      <p><strong>주문:</strong> ${order.items.map(i => `${i.name}(${i.qty}개)`).join(', ')}</p>

      <div>
        <label>평점:</label>
        <div class="star-rating">
          <span class="star" data-rating="1">★</span>
          <span class="star" data-rating="2">★</span>
          <span class="star" data-rating="3">★</span>
          <span class="star" data-rating="4">★</span>
          <span class="star" data-rating="5">★</span>
        </div>
      </div>

      <div>
        <label>리뷰 내용:</label>
        <textarea class="review-textarea" placeholder="음식과 서비스에 대한 솔직한 후기를 남겨주세요..."></textarea>
      </div>

      <div class="modal-buttons">
        <button class="modal-btn cancel-btn">취소</button>
        <button class="modal-btn submit-btn">리뷰 등록</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  let selectedRating = 0;

  // 별점 선택 이벤트
  modal.querySelectorAll('.star').forEach(star => {
    star.addEventListener('click', (e) => {
      selectedRating = parseInt(e.target.getAttribute('data-rating'));
      updateStarDisplay(modal, selectedRating);
    });
  });

  // 취소 버튼
  modal.querySelector('.cancel-btn').addEventListener('click', () => {
    document.body.removeChild(modal);
  });

  // 등록 버튼
  modal.querySelector('.submit-btn').addEventListener('click', async () => {
    const reviewText = modal.querySelector('.review-textarea').value.trim();

    if (selectedRating === 0) {
      alert('평점을 선택해주세요.');
      return;
    }

    if (reviewText === '') {
      alert('리뷰 내용을 입력해주세요.');
      return;
    }

    try {
      await submitReview(order, orderIndex, selectedRating, reviewText);
      document.body.removeChild(modal);

      // 리뷰 캐시 초기화 (해당 매장의 리뷰 캐시 삭제)
      if (order.storeId) {
        const reviewCacheKey = `tablelink_reviews_store_${order.storeId}`;
        localStorage.removeItem(reviewCacheKey);
        console.log('🗑️ 리뷰 등록 후 캐시 초기화 완료:', reviewCacheKey);
      }

      renderMyPage(); // 페이지 새로고침
    } catch (error) {
      console.error('리뷰 등록 오류:', error);
      if (error.message.includes('이미 리뷰를 작성한 주문입니다')) {
        alert('이미 리뷰를 작성한 주문입니다.');
      } else {
        alert('리뷰 등록에 실패했습니다: ' + error.message);
      }
    }
  });

  // 모달 배경 클릭 시 닫기
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
}

// 별점 표시 업데이트
function updateStarDisplay(modal, rating) {
  const stars = modal.querySelectorAll('.star');
  stars.forEach((star, index) => {
    if (index < rating) {
      star.classList.add('active');
    } else {
      star.classList.remove('active');
    }
  });
}

// orders 테이블 기반 리뷰 서버 전송
async function submitReviewFromOrders(order, rating, reviewText) {
  console.log('📝 orders 테이블 기반 리뷰 등록 시도:', { order, rating, reviewText });

  const orderData = order.order_data || {};
  const storeName = orderData.store || order.store_name || '매장 정보 없음';

  const reviewData = {
    userId: userInfo.id,
    storeId: order.store_id,
    storeName: storeName,
    orderId: order.id,
    rating: rating,
    reviewText: reviewText,
    orderDate: new Date(order.order_date).toISOString().slice(0, 10)
  };

  console.log('📤 서버로 전송할 리뷰 데이터:', reviewData);

  try {
    const response = await fetch('/api/reviews/submit-from-orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reviewData)
    });

    console.log('📡 서버 응답 상태:', response.status, response.statusText);

    if (!response.ok) {
      let errorData;
      let errorMessage = `서버 오류 (${response.status}): ${response.statusText}`;
      try {
        errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (parseError) {
        console.error('❌ 응답 파싱 실패:', parseError);
      }
      console.error('❌ 서버 오류 응답:', errorData);
      alert('리뷰 등록에 실패했습니다: ' + errorMessage);
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('✅ 리뷰 등록 성공:', result);
    return result;

  } catch (error) {
    console.error('❌ 리뷰 등록 과정에서 오류 발생:', error);
    console.error('❌ 오류 스택:', error.stack);

    let userFriendlyMessage = '리뷰 등록에 실패했습니다.';

    if (error.message.includes('404')) {
      userFriendlyMessage = '리뷰 서비스를 찾을 수 없습니다. 잠시 후 다시 시도해주세요.';
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      userFriendlyMessage = '네트워크 연결 오류가 발생했습니다. 인터넷 연결을 확인해주세요.';
    }

    alert(userFriendlyMessage);
    throw error;
  }
}

// 리뷰 서버 전송 (레거시 호환용)
async function submitReview(order, orderIndex, rating, reviewText) {
  console.log('📝 리뷰 등록 시도:', { order, orderIndex, rating, reviewText });

  // storeId가 없는 경우 매장 이름으로 찾기
  let storeId = order.storeId;
  if (!storeId) {
    try {
      const storesResponse = await fetch('/api/stores');
      const storesData = await storesResponse.json();
      const foundStore = storesData.stores.find(store => store.name === order.store);
      storeId = foundStore ? foundStore.id : 1; // 기본값 1
      console.log('🔍 매장 이름으로 찾은 storeId:', storeId);
    } catch (error) {
      console.warn('⚠️ 매장 ID 찾기 실패, 기본값 사용:', error);
      storeId = 1; // 기본값
    }
  }

  const reviewData = {
    userId: userInfo.id,
    storeId: storeId,
    storeName: order.store,
    orderIndex: orderIndex,
    rating: rating,
    reviewText: reviewText,
    orderDate: order.date
  };

  console.log('📤 서버로 전송할 리뷰 데이터:', reviewData);

  try {
    const response = await fetch('/api/reviews/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reviewData)
    });

    console.log('📡 서버 응답 상태:', response.status, response.statusText);

    if (!response.ok) {
      let errorData;
      let errorMessage = `서버 오류 (${response.status}): ${response.statusText}`;
      try {
        errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (parseError) {
        console.error('❌ 응답 파싱 실패:', parseError);
      }
      console.error('❌ 서버 오류 응답:', errorData);
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('✅ 리뷰 등록 성공:', result);
    return result;

  } catch (error) {
    console.error('❌ 리뷰 등록 과정에서 오류 발생:', error);
    console.error('❌ 오류 스택:', error.stack);
    throw error;
  }
}

function updateReservationList(currentUserInfo) {
  const reservationList = document.querySelector('#reservationList');
  if (!reservationList) return;

  reservationList.innerHTML = ''; // 기존 내용 초기화

  // 예약내역
  if (currentUserInfo.reservationList?.length > 0) {
    currentUserInfo.reservationList.forEach(res => {
      const p = document.createElement('p');
      p.innerHTML = `
        • <strong>${res.store}</strong><br>
        ${res.date} / ${res.people}명<br><br>
      `;
      reservationList.appendChild(p);
    });
  } else {
    reservationList.innerHTML = `<p>예약 내역이 없습니다.</p>`;
  }
}

function updateCouponList(currentUserInfo) {
  const couponList = document.querySelector('#couponList');
  if (!couponList) return;

  couponList.innerHTML = ''; // 기존 내용 초기화

  // 쿠폰내역
  if (!currentUserInfo.coupons?.unused?.length) {
    couponList.innerHTML = `<p>보유한 쿠폰이 없습니다.</p>`;
  } else {
    currentUserInfo.coupons.unused.forEach(coupon => {
      const p = document.createElement('p');
      p.innerHTML = `
        • <strong>${coupon.name}</strong><br>
        할인율: ${coupon.discountValue}${coupon.discountType === 'percent' ? '%' : '원'}<br>
        유효기간: ${coupon.validUntil}<br><br>
      `;
      couponList.appendChild(p);
    });
  }
}

// 리뷰 내역 업데이트 함수 (DB에서 실제 데이터 가져오기)
async function updateReviewList(currentUserInfo) {
  const reviewList = document.querySelector('#reviewList');
  if (!reviewList) return;

  reviewList.innerHTML = '<p>📝 리뷰 내역을 불러오는 중...</p>'; // 로딩 상태

  try {
    console.log('📖 사용자 리뷰 내역 조회 시작, userId:', currentUserInfo.id);

    const response = await fetch(`/api/reviews/users/${currentUserInfo.id}?limit=3`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📖 받은 리뷰 데이터:', data);

    reviewList.innerHTML = ''; // 로딩 메시지 제거

    if (data.success && data.reviews && data.reviews.length > 0) {
      // 최근 3개 리뷰만 표시
      data.reviews.forEach(review => {
        const reviewDiv = document.createElement('div');
        reviewDiv.className = 'review-item';
        reviewDiv.innerHTML = `
          <div class="review-header">
            <span class="review-store">${review.storeName}</span>
            <span class="review-rating">★ ${review.score}</span>
          </div>
          <div class="review-content">${review.content}</div>
          <div class="review-date">${review.date}</div>
          <div class="review-actions">
            <button class="edit-review-btn" data-review-id="${review.id}" data-store-id="${review.storeId}" data-current-score="${review.score}" data-current-content="${review.content.replace(/"/g, '&quot;')}" style="display: ${userInfo.id === review.userId ? '' : 'none'};">
              ✏️ 수정
            </button>
            <button class="delete-review-btn" data-review-id="${review.id}" style="display: ${userInfo.id === review.userId ? '' : 'none'};">
              🗑️ 삭제
            </button>
            <button class="go-to-store-btn" data-store-id="${review.storeId}">
              >());
            </button>
          </div>
        `;

        reviewList.appendChild(reviewDiv);
      });

      // 리뷰 수정/삭제 버튼 이벤트 리스너
      reviewList.querySelectorAll('.edit-review-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const reviewId = btn.getAttribute('data-review-id');
          const storeId = btn.getAttribute('data-store-id');
          const currentScore = parseInt(btn.getAttribute('data-current-score'));
          const currentContent = btn.getAttribute('data-current-content');
          showEditReviewModal(reviewId, storeId, currentScore, currentContent);
        });
      });

      reviewList.querySelectorAll('.delete-review-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const reviewId = btn.getAttribute('data-review-id');
          deleteReview(reviewId);
        });
      });

      reviewList.querySelectorAll('.go-to-store-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const storeId = btn.getAttribute('data-store-id');
          goToStore(storeId);
        });
      });

      // 전체 리뷰 보기 버튼 (3개보다 많은 리뷰가 있을 경우)
      if (data.total > 3) {
        const viewAllBtn = document.createElement('button');
        viewAllBtn.className = 'view-all-reviews-btn';
        viewAllBtn.innerHTML = `📝 전체 리뷰 보기 (${data.total}개)`;
        viewAllBtn.addEventListener('click', () => {
          showAllReviewsModal(currentUserInfo);
        });
        reviewList.appendChild(viewAllBtn);
      }
    } else {
      reviewList.innerHTML = `<p>작성한 리뷰가 없습니다.</p>`;
    }

  } catch (error) {
    console.error('❌ 리뷰 내역 조회 실패:', error);
    reviewList.innerHTML = `<p>❌ 리뷰 내역을 불러올 수 없습니다.</p>`;
  }
}

// 즐겨찾기 매장 UI 업데이트 함수 (최신 4개만 표시)
function updateFavoriteStoresUI(favoriteStoresData) {
  const favoriteStoresListDiv = document.getElementById('favoriteStoresList');
  if (!favoriteStoresListDiv) return;

  favoriteStoresListDiv.innerHTML = ''; // 기존 내용 초기화

  if (favoriteStoresData && favoriteStoresData.length > 0) {
    // 최신 4개만 표시
    const displayStores = favoriteStoresData.slice(0, 4);

    displayStores.forEach(store => {
      const favoriteDiv = document.createElement('div');
      favoriteDiv.className = 'favorite-store-item';
      favoriteDiv.innerHTML = `
        <div class="favorite-store-content" onclick="goToStore(${store.id})">
          <div class="favorite-store-name">${store.name}</div>
          <div class="favorite-store-info">${store.category || '기타'} • ${store.address || '주소 정보 없음'}</div>
        </div>
        <div class="favorite-store-actions">
          <button class="favorite-heart-btn favorited" data-store-id="${store.id}" data-favorited="true">
            즐겨찾기
          </button>
        </div>
      `;
      favoriteStoresListDiv.appendChild(favoriteDiv);
    });

    // 전체보기 버튼 추가 (4개보다 많은 즐겨찾기가 있을 경우)
    if (favoriteStoresData.length > 4) {
      const viewAllBtn = document.createElement('button');
      viewAllBtn.className = 'view-all-favorites-btn';
      viewAllBtn.innerHTML = `💖 전체 즐겨찾기 보기 (${favoriteStoresData.length}개)`;
      viewAllBtn.addEventListener('click', () => {
        showAllFavoritesModal(favoriteStoresData);
      });
      favoriteStoresListDiv.appendChild(viewAllBtn);
    }

    // 즐겨찾기 하트 토글 버튼 이벤트 리스너
    favoriteStoresListDiv.querySelectorAll('.favorite-heart-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const storeId = parseInt(btn.getAttribute('data-store-id'));
        const currentlyFavorited = btn.getAttribute('data-favorited') === 'true';

        console.log(`🔄 마이페이지 즐겨찾기 토글 시작: storeId=${storeId}, 현재상태=${currentlyFavorited ? '좋아요' : '좋아요취소'}`);

        // 즉시 UI 업데이트 (낙관적 업데이트)
        updateFavoriteHeartUI(btn, !currentlyFavorited);

        try {
          const response = await fetch('/api/users/favorite/toggle', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: userInfo.id,
              storeId: storeId,
              action: currentlyFavorited ? 'remove' : 'add'
            })
          });

          const data = await response.json();

          if (data.success) {
            const isNowFavorited = data.action === 'added' || data.action === 'already_added';
            console.log(`✅ 즐겨찾기 토글 성공: ${isNowFavorited ? '추가' : '제거'} - ${data.message}`);

            // 서버 응답에 맞게 UI 최종 업데이트
            updateFavoriteHeartUI(btn, isNowFavorited);

            // 즐겨찾기 해제 시에도 카드는 유지 (페이지 재렌더링까지)
            // 사용자가 실수로 해제해도 바로 사라지지 않음

          } else {
            console.error('❌ 즐겨찾기 토글 실패:', data.error);
            // 실패 시 원래 상태로 되돌리기
            updateFavoriteHeartUI(btn, currentlyFavorited);
            alert('즐겨찾기 설정에 실패했습니다: ' + data.error);
          }
        } catch (error) {
          console.error('❌ 즐겨찾기 토글 중 오류:', error);
          // 에러 시 원래 상태로 되돌리기
          updateFavoriteHeartUI(btn, currentlyFavorited);
          alert('서버 연결에 실패했습니다.');
        }
      });
    });
  } else {
    favoriteStoresListDiv.innerHTML = `<p>즐겨찾는 매장이 없습니다.</p>`;
  }
}

// 매장별 포인트 업데이트 함수
async function updateStorePointsList(currentUserInfo) {
  const storePointsListDiv = document.getElementById('storePointsList');
  if (!storePointsListDiv) return;

  storePointsListDiv.innerHTML = '<p>💰 매장별 포인트 정보를 불러오는 중...</p>';

  try {
    console.log('💰 매장별 포인트 정보 조회 시작, userId:', currentUserInfo.id);

    // 사용자의 모든 매장별 포인트 정보 조회
    const response = await fetch(`/api/regular-levels/user/${currentUserInfo.id}/all-points`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('💰 받은 포인트 데이터:', data);

    storePointsListDiv.innerHTML = '';

    if (data.success && data.storePoints && data.storePoints.length > 0) {
      // 포인트가 0보다 큰 매장만 필터링하고 포인트 높은 순으로 정렬
      const storesWithPoints = data.storePoints
        .filter(store => store.points > 0)
        .sort((a, b) => b.points - a.points);

      if (storesWithPoints.length > 0) {
        // 최대 4개까지만 표시
        const displayStores = storesWithPoints.slice(0, 4);

        displayStores.forEach(store => {
          const pointsDiv = document.createElement('div');
          pointsDiv.className = 'store-points-item';
          pointsDiv.innerHTML = `
            <div class="points-store-info" onclick="goToStore(${store.storeId})">
              <div>
                <div class="points-store-name">${store.storeName}</div>
                <div class="points-store-category">${store.storeCategory || '기타'}</div>
              </div>
            </div>
            <div class="points-amount">
              <span class="points-value">${store.points.toLocaleString()}P</span>
              <span class="points-label">보유 포인트</span>
            </div>
          `;
          storePointsListDiv.appendChild(pointsDiv);
        });

        // 전체보기 버튼 추가 (4개보다 많은 경우)
        if (storesWithPoints.length > 4) {
          const viewAllBtn = document.createElement('button');
          viewAllBtn.className = 'view-all-points-btn';
          viewAllBtn.innerHTML = `💰 전체 포인트 보기 (${storesWithPoints.length}개 매장)`;
          viewAllBtn.addEventListener('click', () => {
            showAllStorePointsModal(storesWithPoints);
          });
          storePointsListDiv.appendChild(viewAllBtn);
        }
      } else {
        storePointsListDiv.innerHTML = '<p>보유한 포인트가 있는 매장이 없습니다.</p>';
      }

    } else {
      storePointsListDiv.innerHTML = '<p>아직 포인트를 적립한 매장이 없습니다.</p>';
    }

  } catch (error) {
    console.error('❌ 매장별 포인트 정보 조회 실패:', error);
    storePointsListDiv.innerHTML = '<p>❌ 매장별 포인트 정보를 불러올 수 없습니다.</p>';
  }
}

// 전체 매장별 포인트 보기 모달
async function showAllStorePointsModal(storePoints) {
  try {
    const modal = document.createElement('div');
    modal.className = 'review-modal';
    modal.innerHTML = `
      <div class="review-modal-content" style="max-height: 80vh; overflow-y: auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; position: sticky; top: 0; background: white; padding-bottom: 10px; border-bottom: 1px solid #eee;">
          <h3>💰 전체 매장별 포인트 현황 (${storePoints.length}개)</h3>
          <button class="modal-btn cancel-btn" onclick="this.closest('.review-modal').remove()">✕</button>
        </div>
        <div class="all-store-points-list">
          ${storePoints.map(store => `
            <div class="store-points-modal-item" style="cursor: pointer; margin-bottom: 12px;" onclick="closeModalAndGoToStore(${store.storeId})">
              <div class="points-store-header">
                <div class="points-store-name">${store.storeName}</div>
                <div class="points-store-category">${store.storeCategory || '기타'}</div>
              </div>
              <div class="points-modal-stats">
                <span class="points-value">${store.points.toLocaleString()}P</span> •
                <span>${store.visitCount}회 방문</span> •
                <span>${store.totalSpent.toLocaleString()}원 누적</span>
              </div>
              ${store.lastVisitAt ? `
                <div class="points-modal-last-visit">
                  📅 마지막 방문: ${new Date(store.lastVisitAt).toLocaleDateString()}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
      <style>
        .store-points-modal-item {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 16px;
          border: 1px solid #e9ecef;
          transition: background 0.2s;
        }
        .store-points-modal-item:hover {
          background: #e9ecef;
        }
        .points-store-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .points-modal-stats {
          color: #666;
          font-size: 14px;
          margin-bottom: 4px;
        }
        .points-modal-stats .points-value {
          color: #28a745;
          font-weight: 600;
        }
        .points-modal-last-visit {
          color: #999;
          font-size: 12px;
        }
      </style>
    `;

    document.body.appendChild(modal);

    // 모달 배경 클릭 시 닫기
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });

  } catch (error) {
    console.error('❌ 전체 매장별 포인트 조회 실패:', error);
    alert('포인트 목록을 불러올 수 없습니다.');
  }
}

// 단골 레벨 업데이트 함수
async function updateRegularLevelsList(currentUserInfo) {
  const regularLevelsListDiv = document.getElementById('regularLevelsList');
  if (!regularLevelsListDiv) return;

  regularLevelsListDiv.innerHTML = '<p>🏆 단골 레벨 정보를 불러오는 중...</p>';

  try {
    // RegularLevelManager가 로드되지 않은 경우 로드
    if (!window.RegularLevelManager) {
      console.log('📥 RegularLevelManager 로드 중...');
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = '/TLG/utils/regularLevelManager.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    const regularLevels = await window.RegularLevelManager.getUserAllRegularLevels(currentUserInfo.id);

    regularLevelsListDiv.innerHTML = '';

    if (regularLevels && regularLevels.length > 0) {
      // 최대 3개까지만 표시
      const displayLevels = regularLevels.slice(0, 3);

      displayLevels.forEach(levelData => {
        console.log('🔍 레벨 데이터 검증:', {
          storeName: levelData.storeName,
          currentLevel: levelData.currentLevel,
          nextLevel: levelData.nextLevel,
          nextLevelId: levelData.nextLevel?.id,
          nextLevelIdType: typeof levelData.nextLevel?.id
        });

        const levelDiv = document.createElement('div');
        levelDiv.className = 'regular-level-item';

        // 레벨 조건 만족 여부 확인 로직 추가
        if (!levelData.currentLevel && levelData.nextLevel) {
          // 현재 레벨이 없지만 첫 번째 레벨 조건을 만족하는지 확인
          const firstLevel = levelData.nextLevel;
          const points = levelData.points || 0;
          const totalSpent = levelData.totalSpent || 0;
          const visitCount = levelData.visitCount || 0;

          let meetsCondition = false;
          if (firstLevel.evalPolicy === 'OR') {
            meetsCondition = points >= firstLevel.requiredPoints ||
                            totalSpent >= firstLevel.requiredTotalSpent ||
                            visitCount >= firstLevel.requiredVisitCount;
          } else {
            meetsCondition = points >= firstLevel.requiredPoints &&
                            totalSpent >= firstLevel.requiredTotalSpent &&
                            visitCount >= firstLevel.requiredVisitCount;
          }

          levelData.shouldHaveLevel = meetsCondition;
          console.log(`🔍 레벨 조건 검증 (${levelData.storeName}):`, {
            points, totalSpent, visitCount,
            required: firstLevel,
            meetsCondition,
            evalPolicy: firstLevel.evalPolicy
          });
        }

        // 다음 레벨 정보가 있으면 진행률 계산
        if (levelData.nextLevel) {
          const progress = calculateLevelProgress(levelData, levelData.nextLevel);
          levelData.progress = progress;
        }

        levelDiv.innerHTML = `
          <div class="level-store-header" onclick="goToStore(${levelData.storeId})">
            <div class="level-store-info">
              <div class="level-store-name">${levelData.storeName || '매장 정보 없음'}</div>
              <div class="level-badge" style="background: ${window.RegularLevelManager.getLevelColor(levelData.currentLevel?.rank)}">
                ${levelData.currentLevel ? levelData.currentLevel.name : (levelData.shouldHaveLevel ? '⚠️ 레벨 미할당' : '신규 고객')}
              </div>
            </div>
          </div>

          <div class="level-current-stats">
            <div class="current-stat-item">
              <span class="stat-icon">👥</span>
              <span class="stat-value">${levelData.visitCount || 0}</span>
              <span class="stat-label">회 방문</span>
            </div>
            <div class="current-stat-item">
              <span class="stat-icon">⭐</span>
              <span class="stat-value">${(levelData.points || 0).toLocaleString()}</span>
              <span class="stat-label">포인트</span>
            </div>
            <div class="current-stat-item">
              <span class="stat-icon">💰</span>
              <span class="stat-value">${(levelData.totalSpent || 0).toLocaleString()}</span>
              <span class="stat-label">원 누적</span>
            </div>
          </div>

          ${levelData.nextLevel && levelData.nextLevel.name && levelData.nextLevel.id && typeof levelData.nextLevel.id === 'number' && !levelData.progress?.isMaxLevel ? `
            <div class="level-progress-section" onclick="handleLevelProgressClick(${levelData.storeId}, ${levelData.progress.overallPercent}, ${JSON.stringify(levelData.nextLevel).replace(/"/g, '&quot;')}, '${levelData.currentLevel?.name || '신규 고객'}')" style="cursor: pointer;">
              <div class="progress-header">
                <span class="next-level-info">다음 등급: ${levelData.nextLevel.name}</span>
                <span class="progress-percentage">${levelData.progress.overallPercent}%</span>
              </div>

              <div class="progress-requirements">
                ${(levelData.nextLevel.requiredVisitCount || 0) > 0 ? `
                <div class="requirement-item">
                  <div class="requirement-label">방문 횟수 ${levelData.progress.visitsDisplay > 100 && levelData.nextLevel.evalPolicy === 'OR' ? `<span class="achievement-rate">(${levelData.progress.visitsDisplay}%)</span>` : ''}</div>
                  <div class="requirement-gauge">
                    <div class="requirement-fill visits ${levelData.progress.visitsDisplay >= 100 ? 'completed' : ''}" style="width: ${levelData.progress.visitsPercent}%"></div>
                  </div>
                  <div class="requirement-text">${levelData.visitCount || 0} / ${levelData.nextLevel.requiredVisitCount || 0}</div>
                  ${levelData.progress.visitsNeeded > 0 ? `<div class="requirement-needed">${levelData.progress.visitsNeeded}회 더 필요</div>` : '<div class="requirement-needed completed-text">✅ 달성 완료!</div>'}
                </div>
                ` : ''}

                ${(levelData.nextLevel.requiredTotalSpent || 0) > 0 ? `
                <div class="requirement-item">
                  <div class="requirement-label">누적 결제 ${levelData.progress.spendingDisplay > 100 && levelData.nextLevel.evalPolicy === 'OR' ? `<span class="achievement-rate">(${levelData.progress.spendingDisplay}%)</span>` : ''}</div>
                  <div class="requirement-gauge">
                    <div class="requirement-fill spending ${levelData.progress.spendingDisplay >= 100 ? 'completed' : ''}" style="width: ${levelData.progress.spendingPercent}%"></div>
                  </div>
                  <div class="requirement-text">${((levelData.totalSpent || 0) / 1000).toFixed(0)}K / ${((levelData.nextLevel.requiredTotalSpent || 0) / 1000).toFixed(0)}K</div>
                  ${levelData.progress.spendingNeeded > 0 ? `<div class="requirement-needed">${levelData.progress.spendingNeeded.toLocaleString()}원 더 필요</div>` : '<div class="requirement-needed completed-text">✅ 달성 완료!</div>'}
                </div>
                ` : ''}

                ${(levelData.nextLevel.requiredPoints || 0) > 0 ? `
                <div class="requirement-item">
                  <div class="requirement-label">포인트 ${levelData.progress.pointsDisplay > 100 && levelData.nextLevel.evalPolicy === 'OR' ? `<span class="achievement-rate">(${levelData.progress.pointsDisplay}%)</span>` : ''}</div>
                  <div class="requirement-gauge">
                    <div class="requirement-fill points ${levelData.progress.pointsDisplay >= 100 ? 'completed' : ''}" style="width: ${levelData.progress.pointsPercent}%"></div>
                  </div>
                  <div class="requirement-text">${levelData.points || 0} / ${levelData.nextLevel.requiredPoints || 0}</div>
                  ${levelData.progress.pointsNeeded > 0 ? `<div class="requirement-needed">${levelData.progress.pointsNeeded}P 더 필요</div>` : '<div class="requirement-needed completed-text">✅ 달성 완료!</div>'}
                </div>
                ` : ''}
              </div>

              <div class="overall-progress-bar">
                <div class="overall-progress-fill" style="width: ${levelData.progress.overallPercent}%"></div>
              </div>
              <div class="progress-description">
                ${levelData.nextLevel.evalPolicy === 'OR' ? '조건 중 하나만 달성하면 승급됩니다' : '모든 조건을 달성해야 승급됩니다'}
              </div>
            </div>
          ` : `
            <div class="level-progress-section" onclick="handleStartLoyaltyClick(${levelData.storeId}, ${levelData.nextLevel?.id || 'null'}, '${levelData.nextLevel?.name || ''}', '${levelData.currentLevel?.name || '신규 고객'}')" style="cursor: pointer;">
              ${(!levelData.currentLevel || !levelData.currentLevel.name) && levelData.nextLevel && levelData.nextLevel.name && levelData.shouldHaveLevel ? `
                <div class="start-loyalty-section">
                  <div class="start-loyalty-message">
                    <span class="start-loyalty-icon">🚀</span>
                    <div class="start-loyalty-text">
                      <h4>단골 레벨을 시작해보세요!</h4>
                      <p>첫 번째 등급 "${levelData.nextLevel.name}"으로 승급하고<br>특별한 혜택을 받아보세요</p>
                    </div>
                  </div>
                  <button class="start-loyalty-btn" data-store-id="${levelData.storeId}" data-next-level-id="${levelData.nextLevel.id}" onclick="event.stopPropagation(); console.log('🎯 단골 레벨 시작 버튼 직접 클릭됨', ${levelData.storeId}, ${levelData.nextLevel.id})">
                    🎯 ${levelData.nextLevel.name} 등급 시작하기
                  </button>
                </div>
              ` : `
                <div class="progress-description" style="text-align: center; padding: 20px; color: #666; font-weight: 500; background: rgba(255, 255, 255, 0.7); border-radius: 12px;">
                  ${levelData.progress?.isMaxLevel ? '🎉 최고 등급에 도달했습니다!' :
                    (!levelData.nextLevel || !levelData.nextLevel.name) ?
                    '🔧 단골 레벨 시스템을 준비중입니다...' :
                    '🚀 단골 레벨을 시작해보세요!'}
                </div>
              `}
            </div>
          `}
        `;
        regularLevelsListDiv.appendChild(levelDiv);
      });

      // 단골 레벨 시작 버튼 이벤트 리스너 추가 (이벤트 위임 방식 사용)
      regularLevelsListDiv.addEventListener('click', async (e) => {
        const btn = e.target.closest('.start-loyalty-btn');
        if (!btn) return;

        e.stopPropagation();
        e.preventDefault();

        const storeId = parseInt(btn.getAttribute('data-store-id'));
        const nextLevelId = parseInt(btn.getAttribute('data-next-level-id'));

        console.log(`🚀 단골 레벨 시작 버튼 클릭: 매장 ${storeId}, 레벨 ${nextLevelId}`);

        if (!storeId || !nextLevelId) {
          console.error('❌ 필수 데이터가 누락됨:', { storeId, nextLevelId });
          alert('단골 레벨 정보가 올바르지 않습니다.');
          return;
        }

        // 버튼 비활성화 (중복 클릭 방지)
        btn.disabled = true;
        const originalText = btn.textContent;
        btn.textContent = '승급 처리중...';

        try {
          await startLoyaltyLevel(currentUserInfo.id, storeId, nextLevelId);

          // 성공 시 페이지 새로고침
          setTimeout(() => {
            renderMyPage();
          }, 1000);

        } catch (error) {
          console.error('❌ 단골 레벨 시작 실패:', error);
          alert('단골 레벨 시작에 실패했습니다: ' + error.message);

          // 실패 시 버튼 복구
          btn.disabled = false;
          btn.textContent = originalText;
        }
      });

      // 전체보기 버튼 추가 (3개보다 많은 경우)
      if (regularLevels.length > 3) {
        const viewAllBtn = document.createElement('button');
        viewAllBtn.className = 'view-all-regular-levels-btn';
        viewAllBtn.innerHTML = `🏆 전체 단골 레벨 보기 (${regularLevels.length}개)`;
        viewAllBtn.addEventListener('click', () => {
          showAllRegularLevelsModal(regularLevels);
        });
        regularLevelsListDiv.appendChild(viewAllBtn);
      }

    } else {
      regularLevelsListDiv.innerHTML = '<p>아직 단골로 등록된 매장이 없습니다.</p>';
    }

  } catch (error) {
    console.error('❌ 단골 레벨 정보 조회 실패:', error);
    regularLevelsListDiv.innerHTML = '<p>❌ 단골 레벨 정보를 불러올 수 없습니다.</p>';
  }
}

// 레벨 진행률 계산 함수
function calculateLevelProgress(levelData, nextLevel) {
  console.log('🔍 레벨 진행률 계산 시작:', {
    nextLevel: nextLevel,
    currentLevel: levelData.currentLevel,
    stats: {
      points: levelData.points,
      totalSpent: levelData.totalSpent,
      visitCount: levelData.visitCount
    }
  });

  // 현재 레벨이 없고(신규 고객) 다음 레벨도 없는 경우만 최고 등급으로 처리
  const isNewCustomer = !levelData.currentLevel || !levelData.currentLevel.name;
  const hasValidNextLevel = nextLevel &&
                           nextLevel.name &&
                           nextLevel.id &&
                           typeof nextLevel.id === 'number';

  // 신규 고객이 아니면서 다음 레벨이 없는 경우에만 최고 등급으로 처리
  if (!isNewCustomer && !hasValidNextLevel) {
    console.log('🏆 최고 등급 도달:', levelData.currentLevel?.name);
    return {
      overallPercent: 100,
      visitsPercent: 100,
      spendingPercent: 100,
      pointsPercent: 100,
      visitsNeeded: 0,
      spendingNeeded: 0,
      pointsNeeded: 0,
      visitsDisplay: 100,
      spendingDisplay: 100,
      pointsDisplay: 100,
      isMaxLevel: true
    };
  }

  // 신규 고객이면서 다음 레벨이 없는 경우 (레벨 시스템이 없는 매장)
  if (isNewCustomer && !hasValidNextLevel) {
    console.log('ℹ️ 레벨 시스템이 없는 매장');
    return {
      overallPercent: 0,
      visitsPercent: 0,
      spendingPercent: 0,
      pointsPercent: 0,
      visitsNeeded: 0,
      spendingNeeded: 0,
      pointsNeeded: 0,
      visitsDisplay: 0,
      spendingDisplay: 0,
      pointsDisplay: 0,
      isMaxLevel: false
    };
  }

  const currentVisits = levelData.visitCount || 0;
  const currentSpending = levelData.totalSpent || 0;
  const currentPoints = levelData.points || 0;

  const requiredVisits = nextLevel.requiredVisitCount || 0;
  const requiredSpending = nextLevel.requiredTotalSpent || 0;
  const requiredPoints = nextLevel.requiredPoints || 0;

  // 각 조건별 실제 진행률 계산 (100% 초과 허용)
  const visitsPercent = requiredVisits > 0 ? (currentVisits / requiredVisits) * 100 : 100;
  const spendingPercent = requiredSpending > 0 ? (currentSpending / requiredSpending) * 100 : 100;
  const pointsPercent = requiredPoints > 0 ? (currentPoints / requiredPoints) * 100 : 100;

  // 게이지 표시용 진행률 (100% 최대)
  const visitsGaugePercent = Math.min(100, visitsPercent);
  const spendingGaugePercent = Math.min(100, spendingPercent);
  const pointsGaugePercent = Math.min(100, pointsPercent);

  // 필요한 추가 수량 계산
  const visitsNeeded = Math.max(0, requiredVisits - currentVisits);
  const spendingNeeded = Math.max(0, requiredSpending - currentSpending);
  const pointsNeeded = Math.max(0, requiredPoints - currentPoints);

  // 전체 진행률 계산 (OR/AND 정책에 따라)
  let overallPercent;
  if (nextLevel.evalPolicy === 'OR') {
    // OR 정책: 가장 높은 진행률 사용
    overallPercent = Math.max(visitsGaugePercent, spendingGaugePercent, pointsGaugePercent);
  } else {
    // AND 정책: 평균 진행률 사용
    const validPercents = [];
    if (requiredVisits > 0) validPercents.push(visitsGaugePercent);
    if (requiredSpending > 0) validPercents.push(spendingGaugePercent);
    if (requiredPoints > 0) validPercents.push(pointsGaugePercent);

    overallPercent = validPercents.length > 0 ?
      validPercents.reduce((sum, percent) => sum + percent, 0) / validPercents.length : 100;
  }

  const result = {
    overallPercent: Math.round(overallPercent),
    visitsPercent: Math.round(visitsGaugePercent),
    spendingPercent: Math.round(spendingGaugePercent),
    pointsPercent: Math.round(pointsGaugePercent),
    visitsNeeded,
    spendingNeeded,
    pointsNeeded,
    // 실제 표시용 퍼센트 (100% 초과 가능)
    visitsDisplay: Math.round(visitsPercent),
    spendingDisplay: Math.round(spendingPercent),
    pointsDisplay: Math.round(pointsPercent),
    isMaxLevel: false
  };

  console.log('✅ 레벨 진행률 계산 완료:', result);
  return result;
}

// 전체 단골 레벨 보기 모달
async function showAllRegularLevelsModal(regularLevels) {
  try {
    const modal = document.createElement('div');
    modal.className = 'review-modal';
    modal.innerHTML = `
      <div class="review-modal-content" style="max-height: 80vh; overflow-y: auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; position: sticky; top: 0; background: white; padding-bottom: 10px; border-bottom: 1px solid #eee;">
          <h3>🏆 전체 단골 레벨 현황 (${regularLevels.length}개)</h3>
          <button class="modal-btn cancel-btn" onclick="this.closest('.review-modal').remove()">✕</button>
        </div>
        <div class="all-regular-levels-list">
          ${regularLevels.map(levelData => {
            const progress = calculateLevelProgress(levelData, levelData.nextLevel);
            return `
            <div class="regular-level-modal-item" style="cursor: pointer; margin-bottom: 16px; padding: 16px; background: #f8f9fa; border-radius: 12px;" onclick="closeModalAndGoToStore(${levelData.storeId})">
              <div class="level-store-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <div class="level-store-name" style="font-weight: 600; font-size: 16px;">${levelData.storeName || '매장 정보 없음'}</div>
                <div class="level-badge" style="background: ${window.RegularLevelManager.getLevelColor(levelData.currentLevel?.rank)}; color: white; padding: 6px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">
                  ${levelData.currentLevel?.name || (levelData.shouldHaveLevel ? '⚠️ 레벨 미할당' : '신규 고객')}
                </div>
              </div>

              <div class="level-modal-stats" style="display: flex; gap: 16px; margin-bottom: 12px; font-size: 13px; color: #666;">
                <span>👥 ${levelData.visitCount || 0}회 방문</span>
                <span>⭐ ${(levelData.points || 0).toLocaleString()}P</span>
                <span>💰 ${(levelData.totalSpent || 0).toLocaleString()}원</span>
              </div>

              ${!progress.isMaxLevel && levelData.nextLevel && levelData.nextLevel.name ? `
                <div style="background: rgba(255,255,255,0.7); padding: 12px; border-radius: 8px; margin-bottom: 8px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="font-size: 12px; font-weight: 600; color: #667eea;">다음: ${levelData.nextLevel.name}</span>
                    <span style="font-size: 14px; font-weight: 700; color: #28a745;">${progress.overallPercent}%</span>
                  </div>
                  <div style="height: 6px; background: #e9ecef; border-radius: 3px; overflow: hidden;">
                    <div style="height: 100%; background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); width: ${progress.overallPercent}%; transition: width 0.6s ease;"></div>
                  </div>
                  <div style="font-size: 11px; color: #666; margin-top: 4px; text-align: center;">
                    ${levelData.nextLevel.evalPolicy === 'OR' ? '조건 중 하나만 달성' : '모든 조건 달성 필요'}
                  </div>
                </div>
              ` : `
                <div style="background: rgba(40, 167, 69, 0.1); padding: 12px; border-radius: 8px; text-align: center; color: #28a745; font-weight: 600; font-size: 12px;">
                  ${progress.isMaxLevel ? '🎉 최고 등급 달성!' : '🚀 단골 레벨 시작!'}
                </div>
              `}

              ${levelData.currentLevel?.benefits && levelData.currentLevel.benefits.length > 0 ? `
                <div class="level-modal-benefits" style="color: #667eea; font-size: 12px; font-weight: 500;">
                  💝 ${levelData.currentLevel.benefits.map(b => window.RegularLevelManager.formatBenefitType(b.type)).join(', ')}
                </div>
              ` : ''}
            </div>
          `;
          }).join('')}
        </div>
      </div>
      <style>
        .regular-level-modal-item {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 16px;
          border: 1px solid #e9ecef;
          transition: background 0.2s;
        }
        .regular-level-modal-item:hover {
          background: #e9ecef;
        }
        .level-store-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .level-store-name {
          font-weight: 600;
          color: #333;
          font-size: 16px;
        }
        .level-modal-stats {
          color: #666;
          font-size: 14px;
          margin-bottom: 4px;
        }
        .level-modal-benefits {
          color: #667eea;
          font-size: 12px;
          font-weight: 500;
        }
      </style>
    `;

    document.body.appendChild(modal);

    // 모달 배경 클릭 시 닫기
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });

  } catch (error) {
    console.error('❌ 전체 단골 레벨 조회 실패:', error);
    alert('단골 레벨 목록을 불러올 수 없습니다.');
  }
}

// 모달 닫고 매장으로 이동하는 전역 함수
window.closeModalAndGoToStore = function(storeId) {
  // 모달 닫기
  const modal = document.querySelector('.review-modal');
  if (modal) {
    document.body.removeChild(modal);
  }

  // 매장으로 이동
  if (typeof renderStore === 'function') {
    fetch(`/api/stores/${storeId}`)
      .then(response => response.json())
      .then(storeData => {
        if (storeData.success && storeData.store) {
          renderStore(storeData.store);
        }
      })
      .catch(error => {
        console.error('매장 정보 가져오기 실패:', error);
      });
  }
};

// 전체 리뷰 보기 모달
async function showAllReviewsModal(currentUserInfo) {
  try {
    const response = await fetch(`/api/reviews/users/${currentUserInfo.id}`);
    const data = await response.json();

    if (!data.success) {
      throw new Error('리뷰 데이터 조회 실패');
    }

    const modal = document.createElement('div');
    modal.className = 'review-modal';
    modal.innerHTML = `
      <div class="review-modal-content" style="max-height: 80vh; overflow-y: auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; position: sticky; top: 0; background: white; padding-bottom: 10px; border-bottom: 1px solid #eee;">
          <h3>⭐ 내 리뷰 전체보기 (${data.total}개)</h3>
          <button class="modal-btn cancel-btn" onclick="this.closest('.review-modal').remove()">✕</button>
        </div>
        <div class="all-reviews-list">
          ${data.reviews.map(review => `
            <div class="review-item" style="cursor: pointer; margin-bottom: 12px;" onclick="closeModalAndGoToStore(${review.storeId})">
              <div class="review-header">
                <span class="review-store">${review.storeName}</span>
                <span class="review-rating">★ ${review.score}</span>
              </div>
              <div class="review-content">${review.content}</div>
              <div class="review-date">${review.date}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // 모달 배경 클릭 시 닫기
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });

  } catch (error) {
    console.error('❌ 전체 리뷰 조회 실패:', error);
    alert('리뷰 목록을 불러올 수 없습니다.');
  }
}

// 전체 즐겨찾기 매장 보기 모달
async function showAllFavoritesModal(favoriteStoresData) {
  try {
    const modal = document.createElement('div');
    modal.className = 'review-modal';
    modal.innerHTML = `
      <div class="review-modal-content" style="max-height: 80vh; overflow-y: auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; position: sticky; top: 0; background: white; padding-bottom: 10px; border-bottom: 1px solid #eee;">
          <h3>💖 전체 즐겨찾기 매장 (${favoriteStoresData.length}개)</h3>
          <button class="modal-btn cancel-btn" onclick="this.closest('.review-modal').remove()">✕</button>
        </div>
        <div class="all-favorites-list">
          ${favoriteStoresData.map(store => `
            <div class="favorite-store-item" style="cursor: pointer; margin-bottom: 12px;" onclick="closeModalAndGoToFavoriteStore(${store.id})">
              <div class="favorite-store-content">
                <div class="favorite-store-name">${store.name}</div>
                <div class="favorite-store-info">${store.category || '기타'} • ${store.address || '주소 정보 없음'}</div>
              </div>
              <div class="favorite-store-actions">
                <button class="favorite-heart-btn favorited" data-store-id="${store.id}" data-favorited="true" onclick="event.stopPropagation(); toggleFavoriteInModal(this, ${store.id})">
                  즐겨찾기
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // 모달 배경 클릭 시 닫기
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });

  } catch (error) {
    console.error('❌ 전체 즐겨찾기 조회 실패:', error);
    alert('즐겨찾기 목록을 불러올 수 없습니다.');
  }
}

// 모달 닫고 즐겨찾기 매장으로 이동하는 전역 함수
window.closeModalAndGoToFavoriteStore = function(storeId) {
  // 모달 닫기
  const modal = document.querySelector('.review-modal');
  if (modal) {
    document.body.removeChild(modal);
  }

  // 매장으로 이동
  goToStore(storeId);
};

// 모달 내 즐겨찾기 토글 함수
window.toggleFavoriteInModal = async function(btn, storeId) {
  const currentlyFavorited = btn.getAttribute('data-favorited') === 'true';

  console.log(`🔄 모달 즐겨찾기 토글 시작: storeId=${storeId}, 현재상태=${currentlyFavorited ? '좋아요' : '좋아요취소'}`);

  // 즉시 UI 업데이트 (낙관적 업데이트)
  updateFavoriteHeartUI(btn, !currentlyFavorited);

  try {
    const response = await fetch('/api/users/favorite/toggle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userInfo.id,
        storeId: storeId,
        action: currentlyFavorited ? 'remove' : 'add'
      })
    });

    const data = await response.json();

    if (data.success) {
      const isNowFavorited = data.action === 'added' || data.action === 'already_added';
      console.log(`✅ 모달 즐겨찾기 토글 성공: ${isNowFavorited ? '추가' : '제거'} - ${data.message}`);

      // 서버 응답에 맞게 UI 최종 업데이트
      updateFavoriteHeartUI(btn, isNowFavorited);

      // 즐겨찾기 해제된 경우 카드 페이드아웃 효과
      if (!isNowFavorited) {
        const favoriteItem = btn.closest('.favorite-store-item');
        if (favoriteItem) {
          favoriteItem.style.opacity = '0.5';
          favoriteItem.style.pointerEvents = 'none';
        }
      }

    } else {
      console.error('❌ 모달 즐겨찾기 토글 실패:', data.error);
      // 실패 시 원래 상태로 되돌리기
      updateFavoriteHeartUI(btn, currentlyFavorited);
      alert('즐겨찾기 설정에 실패했습니다: ' + data.error);
    }
  } catch (error) {
    console.error('❌ 모달 즐겨찾기 토글 중 오류:', error);
    // 에러 시 원래 상태로 되돌리기
    updateFavoriteHeartUI(btn, currentlyFavorited);
    alert('서버 연결에 실패했습니다.');
  }
};

// 리뷰 수정 모달 표시
function showEditReviewModal(reviewId, storeId, currentScore, currentContent) {
  const modal = document.createElement('div');
  modal.className = 'review-modal';
  modal.innerHTML = `
    <div class="review-modal-content">
      <h3>리뷰 수정</h3>
      <p><strong>매장 ID:</strong> ${storeId}</p>

      <div>
        <label>평점:</label>
        <div class="star-rating">
          <span class="star" data-rating="1">★</span>
          <span class="star" data-rating="2">★</span>
          <span class="star" data-rating="3">★</span>
          <span class="star" data-rating="4">★</span>
          <span class="star" data-rating="5">★</span>
        </div>
      </div>

      <div>
        <label>리뷰 내용:</label>
        <textarea class="review-textarea">${currentContent}</textarea>
      </div>

      <div class="modal-buttons">
        <button class="modal-btn cancel-btn">취소</button>
        <button class="modal-btn submit-btn">수정 완료</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  let selectedRating = currentScore;
  updateStarDisplay(modal, selectedRating); // 초기 별점 설정

  // 별점 선택 이벤트
  modal.querySelectorAll('.star').forEach(star => {
    star.addEventListener('click', (e) => {
      selectedRating = parseInt(e.target.getAttribute('data-rating'));
      updateStarDisplay(modal, selectedRating);
    });
  });

  // 취소 버튼
  modal.querySelector('.cancel-btn').addEventListener('click', () => {
    document.body.removeChild(modal);
  });

  // 수정 완료 버튼
  modal.querySelector('.submit-btn').addEventListener('click', async () => {
    const reviewText = modal.querySelector('.review-textarea').value.trim();

    if (selectedRating === 0) {
      alert('평점을 선택해주세요.');
      return;
    }

    if (reviewText === '') {
      alert('리뷰 내용을 입력해주세요.');
      return;
    }

    try {
      await editReview(reviewId, selectedRating, reviewText);
      document.body.removeChild(modal);
      renderMyPage(); // 페이지 새로고침
    } catch (error) {
      console.error('리뷰 수정 오류:', error);
      alert('리뷰 수정에 실패했습니다: ' + error.message);
    }
  });

  // 모달 배경 클릭 시 닫기
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
}

// 리뷰 수정 API 호출
async function editReview(reviewId, rating, reviewText) {
  const response = await fetch(`/api/reviews/${reviewId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      rating: rating,
      content: reviewText,
      userId: userInfo.id
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || '리뷰 수정 실패');
  }
  return response.json();
}

// 리뷰 삭제 API 호출
async function deleteReview(reviewId) {
  if (!confirm('정말 리뷰를 삭제하시겠습니까?')) {
    return;
  }

  const response = await fetch(`/api/reviews/${reviewId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: userInfo.id })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || '리뷰 삭제 실패');
  }

  alert('리뷰가 삭제되었습니다.');
  renderMyPage(); // 페이지 새로고침
}

// 즐겨찾기 하트 UI 업데이트 헬퍼 함수
function updateFavoriteHeartUI(btn, isFavorited) {
  if (isFavorited) {
    btn.textContent = '즐겨찾기';
    btn.className = 'favorite-heart-btn favorited';
    btn.setAttribute('data-favorited', 'true');
  } else {
    btn.textContent = '즐겨찾기 추가';
    btn.className = 'favorite-heart-btn not-favorited';
    btn.setAttribute('data-favorited', 'false');
  }
}

// 매장 상세 페이지로 이동
function goToStore(storeId) {
  if (typeof renderStore === 'function') {
    fetch(`/api/stores/${storeId}`)
      .then(response => response.json())
      .then(storeData => {
        if (storeData.success && storeData.store) {
          renderStore(storeData.store);
        }
      })
      .catch(error => {
        console.error('매장 정보 가져오기 실패:', error);
        alert('매장 정보를 가져오는 중 오류가 발생했습니다.');
      });
  } else {
    console.warn('renderStore 함수를 찾을 수 없습니다.');
  }
}

// 단골 레벨 시작 함수
async function startLoyaltyLevel(userId, storeId, levelId) {
  try {
    console.log(`🚀 단골 레벨 시작 요청: 사용자 ${userId}, 매장 ${storeId}, 레벨 ${levelId}`);

    const response = await fetch('/api/regular-levels/start-loyalty', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: userId,
        storeId: storeId,
        levelId: levelId
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '단골 레벨 시작 실패');
    }

    const result = await response.json();
    console.log('✅ 단골 레벨 시작 성공:', result);

    // 성공 메시지 표시
    alert(`🎉 축하합니다! "${result.levelName}" 등급으로 승급되었습니다!`);

    return result;

  } catch (error) {
    console.error('❌ 단골 레벨 시작 중 오류:', error);
    throw error;
  }
}

// 단골 레벨 진행률 섹션 클릭 핸들러
function handleLevelProgressClick(storeId, overallPercent, nextLevel, currentLevelName) {
  console.log(`📊 레벨 진행률 섹션 클릭됨: storeId=${storeId}, overallPercent=${overallPercent}, nextLevel=${JSON.stringify(nextLevel)}, currentLevelName=${currentLevelName}`);
  // 현재 로직에서는 단순히 goToStore로 이동하지만, 향후 상세 정보 표시 등의 기능 추가 가능
  // if (overallPercent < 100) {
  //   // 아직 승급 전이면 상세 정보 표시하거나 알림
  //   alert(`"${nextLevel.name}" 등급까지 ${overallPercent}% 진행되었습니다.\n${currentLevelName} 등급에서 시작해보세요!`);
  // } else {
  //   alert('🎉 이미 최고 등급입니다!');
  // }
  goToStore(storeId);
}

// 단골 레벨 시작 섹션 클릭 핸들러
function handleStartLoyaltyClick(storeId, nextLevelId, nextLevelName, currentLevelName) {
  console.log(`🚀 단골 레벨 시작 클릭됨: storeId=${storeId}, nextLevelId=${nextLevelId}, nextLevelName=${nextLevelName}, currentLevelName=${currentLevelName}`);

  // "단골 레벨을 시작해보세요!" 텍스트가 있는 경우에만 버튼 클릭 시 동작
  if (currentLevelName === '신규 고객' && nextLevelId !== null && nextLevelName) {
    // 버튼 클릭과 동일한 로직 수행
    const startButton = document.querySelector(`.regular-level-item[data-store-id='${storeId}'] .start-loyalty-btn`);
    if (startButton) {
      startButton.click();
    } else {
      console.error('🎯 시작 버튼을 찾을 수 없습니다:', storeId);
      alert('단골 레벨 시작에 문제가 발생했습니다.');
    }
  } else {
    // 이미 레벨이 있거나, 다음 레벨 정보가 없는 경우
    console.log(`ℹ️ 단골 레벨 시작 조건 미충족: currentLevelName=${currentLevelName}, nextLevelId=${nextLevelId}`);
    //alert('단골 레벨을 시작할 수 없습니다.'); // 불필요한 알림 제거
  }
}


// 전역 함수로도 등록
window.renderMyPage = renderMyPage;
window.handleLevelProgressClick = handleLevelProgressClick;
window.handleStartLoyaltyClick = handleStartLoyaltyClick;
window.showReviewModalFromOrders = showReviewModalFromOrders; // showReviewModalFromOrders 함수를 전역으로 등록