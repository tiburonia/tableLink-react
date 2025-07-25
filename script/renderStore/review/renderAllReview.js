function renderAllReview(store) {
  const reviews = store.reviews || [];
  const total = reviews.length;
  const avgScore = total
    ? (reviews.reduce((sum, r) => sum + r.score, 0) / total).toFixed(1)
    : "0.0";

  const mainEl = document.getElementById('main');
  if (!mainEl) return;

  mainEl.innerHTML = `
    <!-- 상단 뒤로가기, QR결제 버튼 -->
    <div id="allReviewHeader" style="position:relative;height:56px;">
      <button id="backBtn" class="header-btn" style="position:absolute;left:16px;top:10px;" aria-label="뒤로가기">
        <span class="header-btn-ico" style="font-size:22px;">⬅️</span>
      </button>
      <button id="TLL" class="header-btn" style="position:absolute;right:16px;top:10px;" aria-label="QR결제">
        <span class="header-btn-ico" style="font-size:22px;">📱</span>
      </button>
      <div style="height: 100%; display:flex; align-items: center; justify-content: center;">
        <span style="font-size:18px;font-weight:700;">리뷰 전체보기</span>
      </div>
    </div>

    <!-- 리뷰 영역 -->
    <div id="allReviewContent" style="padding:10px 0 84px 0;">
      ${
        total === 0
        ? `
          <div class="review-all-empty">
            <div style="font-size:18px;font-weight:600;margin-bottom:10px;">아직 등록된 리뷰가 없습니다.</div>
            <div style="color:#888;">첫 리뷰의 주인공이 되어보세요!</div>
          </div>
        `
        : `
          <div class="review-all-header">
            <div class="review-all-score">
              <span style="font-size:22px;color:#297efc;">★ ${avgScore}</span>
              <span style="margin-left:10px;color:#888;">(${total}개)</span>
            </div>
          </div>
          <div class="review-all-list">
            ${reviews.map(r => `
              <div class="review-card">
                <div class="review-meta">
                  <span class="review-user">${r.user}</span>
                  <span class="review-score">★ ${r.score}</span>
                </div>
                <div class="review-text">${r.content}</div>
              </div>
            `).join("")}
          </div>
        `
      }
    </div>

    <!-- 하단 바텀바 -->
    <nav id="storeBottomBar">
      <button id="telephone" class="btm-btn phone-btn" aria-label="전화">
        <span class="btm-btn-ico">📞</span>
      </button>
      <button id="order" class="btm-btn order-btn">
        포장·예약하기
      </button>
    </nav>

    <!-- 리뷰 전체보기용 CSS (반복 선언 X, 전역 style에 넣어도 됨) -->
    <style>
    .header-btn {
      border: none;
      border-radius: 50%;
      background: #fff;
      box-shadow: 0 4px 12px rgba(40,110,255,0.09), 0 1.5px 4px rgba(0,0,0,0.04);
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      font-size: 22px;
      color: #297efc;
      cursor: pointer;
      transition: background 0.13s, color 0.13s, box-shadow 0.13s;
      outline: none;
      padding: 0;
      border: 1.2px solid #e8eefe;
    }
    .header-btn:active {
      background: #eaf3ff;
      color: #297efc;
      box-shadow: 0 4px 16px rgba(60,110,255,0.12);
      border-color: #b7cdfa;
    }
    .header-btn-ico {
      font-size: 22px;
      pointer-events: none;
    }
    .review-all-header {
      margin-bottom: 18px;
      display: flex;
      align-items: center;
      justify-content: flex-start;
    }
    .review-all-score {
      font-size: 21px;
      font-weight: 700;
      color: #297efc;
      letter-spacing: -0.5px;
    }
    .review-all-score span { vertical-align: middle; }
    .review-all-list { display: flex; flex-direction: column; gap: 14px; }
    .review-card {
      background: #fff;
      border-radius: 13px;
      box-shadow: 0 2px 12px rgba(40,110,255,0.06), 0 1.5px 4px rgba(0,0,0,0.03);
      padding: 15px 18px 13px 16px;
      display: flex; flex-direction: column;
      min-height: 65px;
      transition: box-shadow 0.2s;
    }
    .review-card:hover {
      box-shadow: 0 4px 20px rgba(40,110,255,0.10), 0 2px 8px rgba(0,0,0,0.05);
    }
    .review-meta {
      font-size: 14px;
      margin-bottom: 7px;
      display: flex;
      align-items: center;
      gap: 12px;
      color: #333;
    }
    .review-user { font-weight: 600; color: #388; font-size: 14px; }
    .review-score { color: #ffbf00; font-weight: 700; font-size: 15px; letter-spacing: -1px; }
    .review-text { font-size: 15px; color: #232323; line-height: 1.65; word-break: break-all; margin-top: 2px; }
    .review-all-empty {
      text-align: center;
      padding: 50px 0 40px 0;
      color: #b2b2b2;
      font-size: 15px;
    }
    /* 바텀바 스타일 */
    #storeBottomBar {
      position: fixed;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 100%;
      max-width: 430px;
      height: 64px;
      background: #fff;
      border-top: 1.5px solid #e2e6ee;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 1000;
      padding: 0 16px;
      box-sizing: border-box;
      gap: 0;
    }
    .btm-btn {
      border: none;
      outline: none;
      font-family: inherit;
      transition: background 0.12s, box-shadow 0.13s, color 0.12s;
      cursor: pointer;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 17px;
      box-shadow: 0 1.5px 6px rgba(0,0,0,0.04);
      font-weight: 600;
    }
    .phone-btn {
      width: 48px; min-width: 48px; max-width: 48px;
      border-radius: 50%;
      background: #f6fafd;
      color: #2299fc;
      margin-right: 12px;
      font-size: 22px;
      box-shadow: 0 2px 8px rgba(34,153,252,0.06);
    }
    .phone-btn:active {
      background: #e4effd;
      color: #1657a0;
    }
    .btm-btn-ico {
      font-size: 23px;
      pointer-events: none;
      line-height: 1;
    }
    .order-btn {
      flex: 1;
      height: 44px;
      min-width: 0;
      border-radius: 13px;
      background: linear-gradient(90deg, #36a1ff 0%, #297efc 100%);
      color: #fff;
      margin-left: 0;
      font-size: 17px;
      letter-spacing: 0.2px;
      box-shadow: 0 2px 12px rgba(34,153,252,0.09);
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .order-btn:active {
      background: linear-gradient(90deg, #297efc 0%, #36a1ff 100%);
      color: #e3f1ff;
    }
    @media (max-width: 480px) {
      .review-all-header { font-size: 17px; }
      .review-card { padding: 13px 10px 10px 10px; }
      .review-all-list { gap: 11px; }
      .review-meta { font-size: 13px; }
      .review-text { font-size: 14px; }
      #storeBottomBar { height: 54px; }
    }
    </style>
  `;

  // 버튼 이벤트 바인딩 (렌더 후 등록!)
  document.getElementById('backBtn').addEventListener('click', () => {
    // 뒤로가기 동작(원래 매장 상세 or 이전 화면 함수 호출)
    renderStore(store);
  });
  document.getElementById('TLL').addEventListener('click', () => {
    alert('QR 결제 기능은 아직 준비 중입니다');
  });

  // 바텀바 버튼 바인딩(필요하면 추가)
  document.getElementById('telephone').addEventListener('click', () => {
    alert('전화 기능은 아직 준비 중입니다');
  });
  document.getElementById('order').addEventListener('click', () => {
    alert('포장·예약하기 기능은 준비 중입니다');
  });
}
