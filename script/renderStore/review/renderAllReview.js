
async function renderAllReview(store) {
  console.log('🔍 리뷰 전체보기 로딩 중...', store.name);
  
  try {
    // 캐시에서 리뷰 데이터 가져오기 (실시간 데이터이므로 캐시하지 않고 항상 서버에서 조회)
    let reviews = [];
    
    try {
      console.log('🌐 서버에서 최신 리뷰 데이터 조회 중...');
      const response = await fetch(`/api/stores/${store.id}/reviews`);
      
      if (!response.ok) {
        throw new Error(`리뷰 조회 실패: ${response.status}`);
      }
      
      const reviewData = await response.json();
      reviews = reviewData.reviews || [];
      
      console.log('📖 서버에서 가져온 리뷰 데이터:', reviews);
      
    } catch (apiError) {
      console.error('❌ 서버 리뷰 조회 실패:', apiError);
      
      // 서버 조회 실패 시 빈 배열로 처리하여 UI는 정상 렌더링
      reviews = [];
      console.log('⚠️ 리뷰 데이터를 가져올 수 없어 빈 상태로 표시합니다');
    }
    
    const total = reviews.length;
    const avgScore = total
      ? (reviews.reduce((sum, r) => sum + r.score, 0) / total).toFixed(1)
      : "0.0";

    const mainEl = document.getElementById('main');
    if (!mainEl) return;

    mainEl.innerHTML = `
      <!-- 상단 헤더 (고정) -->
      <div id="allReviewHeader" style="position:fixed;top:0;left:50%;transform:translateX(-50%);width:100%;max-width:430px;height:60px;background:#fff;border-bottom:1px solid #e8eefe;z-index:1001;">
        <button id="backBtn" class="header-btn" style="position:absolute;left:16px;top:10px;" aria-label="뒤로가기">
          <span class="header-btn-ico" style="font-size:22px;">⬅️</span>
        </button>
        <button id="TLL" class="header-btn" style="position:absolute;right:16px;top:10px;" aria-label="QR결제">
          <span class="header-btn-ico" style="font-size:22px;">📱</span>
        </button>
        <div style="height: 100%; display:flex; align-items: center; justify-content: center;">
          <span style="font-size:18px;font-weight:700;">${store.name} 리뷰</span>
        </div>
      </div>

      <!-- 스크롤 가능한 컨텐츠 영역 -->
      <div id="allReviewScrollArea" style="position:fixed;top:60px;bottom:64px;left:50%;transform:translateX(-50%);width:100%;max-width:430px;overflow-y:auto;-webkit-overflow-scrolling:touch;z-index:1;">
        <div id="allReviewContent" style="padding:16px;background:#f8f9fb;min-height:100%;">
          ${
            total === 0
            ? `
              <div class="review-all-empty">
                <div style="font-size:18px;font-weight:600;margin-bottom:10px;color:#333;">아직 등록된 리뷰가 없습니다.</div>
                <div style="color:#888;font-size:15px;">첫 리뷰의 주인공이 되어보세요!</div>
              </div>
            `
            : `
              <div class="review-all-header">
                <div class="review-all-score">
                  <span style="font-size:24px;color:#297efc;font-weight:700;">★ ${avgScore}</span>
                  <span style="margin-left:10px;color:#666;font-size:16px;">(${total}개 리뷰)</span>
                </div>
              </div>
              <div class="review-all-list">
                ${reviews.map(r => `
                  <div class="review-card">
                    <div class="review-meta">
                      <span class="review-user">👤 사용자${r.userId}</span>
                      <span class="review-score">★ ${r.score}</span>
                      <span class="review-date">${r.date || ''}</span>
                    </div>
                    <div class="review-text">${r.content}</div>
                  </div>
                `).join("")}
              </div>
            `
          }
        </div>
      </div>

      <!-- 하단 바텀바 (고정) -->
      <nav id="storeBottomBar">
        <button id="telephone" class="btm-btn phone-btn" aria-label="전화">
          <span class="btm-btn-ico">📞</span>
        </button>
        <button id="order" class="btm-btn order-btn">
          포장·예약하기
        </button>
      </nav>

      <!-- 개선된 스타일 -->
      <style>
      body, #main {
        overflow: hidden;
      }
      
      .header-btn {
        border: none;
        border-radius: 50%;
        background: #fff;
        box-shadow: 0 2px 8px rgba(40,110,255,0.08);
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        font-size: 22px;
        color: #297efc;
        cursor: pointer;
        transition: all 0.2s ease;
        outline: none;
        padding: 0;
        border: 1px solid #f0f4ff;
      }
      .header-btn:active {
        background: #f0f6ff;
        transform: scale(0.95);
        box-shadow: 0 1px 4px rgba(40,110,255,0.12);
      }
      .header-btn-ico {
        font-size: 20px;
        pointer-events: none;
      }
      
      #allReviewScrollArea::-webkit-scrollbar {
        width: 4px;
      }
      #allReviewScrollArea::-webkit-scrollbar-track {
        background: transparent;
      }
      #allReviewScrollArea::-webkit-scrollbar-thumb {
        background: #ccc;
        border-radius: 2px;
      }
      #allReviewScrollArea::-webkit-scrollbar-thumb:hover {
        background: #aaa;
      }
      
      .review-all-header {
        margin-bottom: 20px;
        padding: 16px;
        background: #fff;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        text-align: center;
      }
      .review-all-score {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }
      
      .review-all-list { 
        display: flex; 
        flex-direction: column; 
        gap: 12px; 
      }
      
      .review-card {
        background: #fff;
        border-radius: 12px;
        box-shadow: 0 2px 12px rgba(40,110,255,0.06);
        padding: 16px;
        display: flex; 
        flex-direction: column;
        gap: 8px;
        transition: all 0.2s ease;
        border: 1px solid #f5f7fa;
      }
      .review-card:hover {
        box-shadow: 0 4px 20px rgba(40,110,255,0.10);
        transform: translateY(-1px);
      }
      
      .review-meta {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 14px;
        margin-bottom: 4px;
      }
      .review-user { 
        font-weight: 600; 
        color: #2d5aa0; 
        font-size: 14px; 
      }
      .review-score { 
        color: #ffbf00; 
        font-weight: 700; 
        font-size: 15px; 
      }
      .review-date {
        color: #999;
        font-size: 13px;
        margin-left: auto;
      }
      
      .review-text { 
        font-size: 15px; 
        color: #333; 
        line-height: 1.6; 
        word-break: break-word;
      }
      
      .review-all-empty {
        text-align: center;
        padding: 60px 20px;
        background: #fff;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.04);
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
        border-top: 1px solid #e8eefe;
        display: flex;
        justify-content: space-between;
        align-items: center;
        z-index: 1000;
        padding: 0 16px;
        box-sizing: border-box;
      }
      
      .btm-btn {
        border: none;
        outline: none;
        font-family: inherit;
        transition: all 0.2s ease;
        cursor: pointer;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 17px;
        font-weight: 600;
      }
      
      .phone-btn {
        width: 48px; 
        min-width: 48px; 
        max-width: 48px;
        border-radius: 50%;
        background: #f6fafd;
        color: #297efc;
        margin-right: 12px;
        font-size: 22px;
        box-shadow: 0 2px 8px rgba(41,126,252,0.08);
      }
      .phone-btn:active {
        background: #e4effd;
        transform: scale(0.95);
      }
      
      .btm-btn-ico {
        font-size: 22px;
        pointer-events: none;
        line-height: 1;
      }
      
      .order-btn {
        flex: 1;
        height: 44px;
        min-width: 0;
        border-radius: 12px;
        background: linear-gradient(135deg, #36a1ff 0%, #297efc 100%);
        color: #fff;
        font-size: 16px;
        letter-spacing: 0.3px;
        box-shadow: 0 3px 12px rgba(41,126,252,0.15);
      }
      .order-btn:active {
        background: linear-gradient(135deg, #297efc 0%, #1e6bd8 100%);
        transform: translateY(1px);
        box-shadow: 0 2px 8px rgba(41,126,252,0.2);
      }
      
      @media (max-width: 480px) {
        .review-all-header { padding: 12px; }
        .review-card { padding: 14px; }
        .review-all-list { gap: 10px; }
        .review-meta { font-size: 13px; }
        .review-text { font-size: 14px; }
        #allReviewContent { padding: 12px; }
      }
      </style>
    `;

    // 버튼 이벤트 바인딩
    document.getElementById('backBtn').addEventListener('click', async () => {
      // 캐시에서 최신 매장 정보 가져와서 renderStore 호출
      try {
        const cachedStore = await cacheManager.getStoreById(store.id);
        if (cachedStore) {
          console.log('🏪 캐시에서 매장 정보 가져와서 뒤로가기:', cachedStore.name);
          renderStore(cachedStore);
        } else {
          console.log('⚠️ 캐시에서 매장 정보를 찾을 수 없어 기존 정보 사용');
          renderStore(store);
        }
      } catch (error) {
        console.error('❌ 매장 정보 조회 실패:', error);
        renderStore(store);
      }
    });
    
    document.getElementById('TLL').addEventListener('click', () => {
      alert('QR 결제 기능은 아직 준비 중입니다');
    });

    document.getElementById('telephone').addEventListener('click', () => {
      alert('전화 기능은 아직 준비 중입니다');
    });
    
    document.getElementById('order').addEventListener('click', () => {
      alert('포장·예약하기 기능은 준비 중입니다');
    });

  } catch (error) {
    console.error('❌ 리뷰 데이터 로딩 실패:', error);
    
    // 에러 발생 시 기본 UI 렌더링
    const mainEl = document.getElementById('main');
    if (!mainEl) return;

    mainEl.innerHTML = `
      <div style="padding: 20px; text-align: center;">
        <h2>리뷰를 불러올 수 없습니다</h2>
        <p>네트워크 오류가 발생했습니다.</p>
        <button onclick="renderStore(${JSON.stringify(store).replace(/"/g, '&quot;')})" 
                style="padding: 10px 20px; background: #297efc; color: white; border: none; border-radius: 6px;">
          뒤로가기
        </button>
      </div>
    `;
  }
}
