
// 진행중인 혜택 자세히 보기 렌더링 함수
function renderPromotionDetail(store) {
  console.log('🎉 매장 혜택 상세보기 로딩:', store.name);

  const main = document.getElementById('main');

  main.innerHTML = `
    <style>
      .promotion-container {
        width: 100%;
        max-width: 430px;
        min-height: 100vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        position: relative;
        overflow-x: hidden;
      }

      .promotion-header {
        position: relative;
        padding: 60px 20px 40px 20px;
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%);
        color: white;
        text-align: center;
      }

      .back-button {
        position: absolute;
        top: 20px;
        left: 20px;
        width: 40px;
        height: 40px;
        background: rgba(255, 255, 255, 0.2);
        border: none;
        border-radius: 50%;
        color: white;
        font-size: 18px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(10px);
        transition: all 0.3s ease;
      }

      .back-button:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: scale(1.05);
      }

      .promotion-title {
        font-size: 24px;
        font-weight: 700;
        margin-bottom: 8px;
      }

      .promotion-subtitle {
        font-size: 16px;
        opacity: 0.9;
        font-weight: 400;
      }

      .promotions-content {
        background: #f8f9fa;
        border-radius: 25px 25px 0 0;
        margin-top: -20px;
        padding: 30px 20px 20px 20px;
        min-height: calc(100vh - 200px);
        position: relative;
      }

      .promotion-card {
        background: white;
        border-radius: 16px;
        padding: 20px;
        margin-bottom: 16px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        border-left: 4px solid #667eea;
        transition: all 0.3s ease;
      }

      .promotion-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
      }

      .promotion-badge {
        display: inline-block;
        background: linear-gradient(45deg, #667eea, #764ba2);
        color: white;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        margin-bottom: 12px;
        text-transform: uppercase;
      }

      .promotion-name {
        font-size: 18px;
        font-weight: 700;
        color: #2c3e50;
        margin-bottom: 8px;
      }

      .promotion-description {
        color: #666;
        font-size: 14px;
        line-height: 1.5;
        margin-bottom: 12px;
      }

      .promotion-details {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-bottom: 16px;
      }

      .detail-item {
        background: #f8f9fa;
        padding: 12px;
        border-radius: 8px;
        text-align: center;
      }

      .detail-label {
        font-size: 12px;
        color: #666;
        margin-bottom: 4px;
      }

      .detail-value {
        font-size: 14px;
        font-weight: 600;
        color: #2c3e50;
      }

      .promotion-period {
        background: #e8f4fd;
        padding: 12px;
        border-radius: 8px;
        border-left: 3px solid #3498db;
        margin-bottom: 16px;
      }

      .period-label {
        font-size: 12px;
        color: #3498db;
        font-weight: 600;
        margin-bottom: 4px;
      }

      .period-value {
        font-size: 14px;
        color: #2c3e50;
        font-weight: 500;
      }

      .promotion-conditions {
        background: #fff9e6;
        padding: 12px;
        border-radius: 8px;
        border-left: 3px solid #f39c12;
      }

      .conditions-title {
        font-size: 13px;
        color: #f39c12;
        font-weight: 600;
        margin-bottom: 8px;
      }

      .conditions-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      .conditions-list li {
        font-size: 13px;
        color: #666;
        margin-bottom: 4px;
        padding-left: 16px;
        position: relative;
      }

      .conditions-list li:before {
        content: "•";
        color: #f39c12;
        position: absolute;
        left: 0;
      }

      .no-promotions {
        text-align: center;
        padding: 60px 20px;
        color: #666;
      }

      .no-promotions-icon {
        font-size: 48px;
        margin-bottom: 16px;
        opacity: 0.5;
      }

      .loading-spinner {
        display: inline-block;
        width: 20px;
        height: 20px;
        border: 3px solid #f3f3f3;
        border-top: 3px solid #667eea;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-right: 10px;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .fade-in {
        animation: fadeIn 0.5s ease-in;
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }

      /* 단골 등급별 혜택 스타일 */
      .loyalty-benefits-section {
        background: white;
        border-radius: 16px;
        padding: 20px;
        margin-bottom: 20px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      }

      .section-title {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 20px;
        font-size: 18px;
        font-weight: 700;
        color: #2c3e50;
      }

      .title-icon {
        font-size: 20px;
      }

      .loyalty-levels-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      .loyalty-level-card {
        border-radius: 12px;
        padding: 16px;
        border: 2px solid;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
      }

      .loyalty-level-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
      }

      .loyalty-level-card.bronze {
        background: linear-gradient(135deg, #cd7f32 0%, #b8860b 100%);
        border-color: #cd7f32;
        color: white;
      }

      .loyalty-level-card.silver {
        background: linear-gradient(135deg, #c0c0c0 0%, #a8a8a8 100%);
        border-color: #c0c0c0;
        color: #2c3e50;
      }

      .loyalty-level-card.gold {
        background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
        border-color: #ffd700;
        color: #2c3e50;
      }

      .loyalty-level-card.diamond {
        background: linear-gradient(135deg, #b9f2ff 0%, #667eea 100%);
        border-color: #667eea;
        color: white;
      }

      .level-header {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 12px;
        text-align: center;
      }

      .level-icon {
        font-size: 24px;
        margin-bottom: 4px;
      }

      .level-name {
        font-size: 14px;
        font-weight: 700;
        margin-bottom: 2px;
      }

      .level-requirement {
        font-size: 11px;
        opacity: 0.9;
        font-weight: 500;
      }

      .level-benefits {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .benefit-item {
        font-size: 11px;
        line-height: 1.3;
        opacity: 0.95;
        font-weight: 500;
      }

      .loyalty-level-card.bronze .benefit-item,
      .loyalty-level-card.diamond .benefit-item {
        color: rgba(255, 255, 255, 0.95);
      }

      .loyalty-level-card.silver .benefit-item,
      .loyalty-level-card.gold .benefit-item {
        color: rgba(44, 62, 80, 0.85);
      }

      /* 반응형 조정 */
      @media (max-width: 380px) {
        .loyalty-levels-grid {
          grid-template-columns: 1fr;
        }
        
        .loyalty-level-card {
          padding: 14px;
        }
      }
    </style>

    <div class="promotion-container">
      <div class="promotion-header">
        <button class="back-button" onclick="renderStore(window.currentStore)">
          ⬅️
        </button>
        <div class="promotion-title">${store.name}</div>
        <div class="promotion-subtitle">진행중인 혜택</div>
      </div>

      <div class="promotions-content">
        <!-- 단골 등급별 혜택 안내 -->
        <div class="loyalty-benefits-section">
          <div class="section-title">
            <span class="title-icon">👑</span>
            <span class="title-text">단골 등급별 혜택</span>
          </div>
          <div class="loyalty-levels-grid">
            <div class="loyalty-level-card bronze">
              <div class="level-header">
                <span class="level-icon">🥉</span>
                <span class="level-name">브론즈</span>
                <span class="level-requirement">방문 1-4회</span>
              </div>
              <div class="level-benefits">
                <div class="benefit-item">• 기본 포인트 적립 2%</div>
                <div class="benefit-item">• 생일 축하 쿠폰</div>
              </div>
            </div>
            
            <div class="loyalty-level-card silver">
              <div class="level-header">
                <span class="level-icon">🥈</span>
                <span class="level-name">실버</span>
                <span class="level-requirement">방문 5-9회</span>
              </div>
              <div class="level-benefits">
                <div class="benefit-item">• 포인트 적립 3%</div>
                <div class="benefit-item">• 월 1회 무료 음료</div>
                <div class="benefit-item">• 생일 특별 할인 10%</div>
              </div>
            </div>
            
            <div class="loyalty-level-card gold">
              <div class="level-header">
                <span class="level-icon">🥇</span>
                <span class="level-name">골드</span>
                <span class="level-requirement">방문 10-19회</span>
              </div>
              <div class="level-benefits">
                <div class="benefit-item">• 포인트 적립 5%</div>
                <div class="benefit-item">• 모든 메뉴 5% 추가 할인</div>
                <div class="benefit-item">• 월 2회 무료 음료</div>
                <div class="benefit-item">• 우선 예약 서비스</div>
              </div>
            </div>
            
            <div class="loyalty-level-card diamond">
              <div class="level-header">
                <span class="level-icon">💎</span>
                <span class="level-name">다이아몬드</span>
                <span class="level-requirement">방문 20회+</span>
              </div>
              <div class="level-benefits">
                <div class="benefit-item">• 포인트 적립 7%</div>
                <div class="benefit-item">• 모든 메뉴 10% 추가 할인</div>
                <div class="benefit-item">• 주 1회 무료 음료</div>
                <div class="benefit-item">• VIP 전용 메뉴 이용</div>
                <div class="benefit-item">• 전용 고객센터</div>
              </div>
            </div>
          </div>
        </div>

        <div id="promotionsContainer">
          <div class="loading-spinner"></div>
          혜택 정보를 불러오는 중...
        </div>
      </div>
    </div>
  `;

  // 혜택 데이터 로드
  loadPromotionDetails(store);
}

// 혜택 상세 정보 로드
async function loadPromotionDetails(store) {
  const container = document.getElementById('promotionsContainer');
  
  try {
    // 실제 API 호출 (현재는 목업 데이터 사용)
    // const response = await fetch(`/api/stores/${store.id}/promotions`);
    // const data = await response.json();
    
    // 목업 데이터
    const promotions = [
      {
        id: 1,
        name: "신규 고객 웰컴 할인",
        description: "첫 방문 고객에게 드리는 특별한 혜택입니다. 모든 메뉴 15% 할인과 함께 무료 음료를 제공해드립니다.",
        type: "할인",
        discountRate: "15%",
        minOrderAmount: "10,000원",
        maxDiscount: "5,000원",
        startDate: "2025-01-01",
        endDate: "2025-12-31",
        conditions: [
          "첫 방문 고객에 한함",
          "최소 주문 금액 10,000원 이상",
          "다른 할인과 중복 불가",
          "1인 1회 한정"
        ],
        isActive: true
      },
      {
        id: 2,
        name: "점심 특가 메뉴",
        description: "평일 점심시간 한정으로 제공되는 특가 메뉴입니다. 인기 메뉴들을 합리적인 가격으로 만나보세요.",
        type: "특가",
        discountRate: "20%",
        minOrderAmount: "8,000원",
        maxDiscount: "3,000원",
        startDate: "2025-01-01",
        endDate: "2025-06-30",
        conditions: [
          "평일 오전 11시 ~ 오후 2시",
          "지정 메뉴에만 적용",
          "포장 주문 가능",
          "카드 결제시에만 할인"
        ],
        isActive: true
      },
      {
        id: 3,
        name: "단골 고객 적립 혜택",
        description: "방문할 때마다 포인트가 쌓이는 단골 고객 전용 혜택입니다. 포인트로 다양한 혜택을 받아보세요.",
        type: "적립",
        discountRate: "5% 적립",
        minOrderAmount: "5,000원",
        maxDiscount: "무제한",
        startDate: "2025-01-01",
        endDate: "2025-12-31",
        conditions: [
          "결제 금액의 5% 포인트 적립",
          "1,000포인트부터 사용 가능",
          "포인트 유효기간 1년",
          "현금 결제시 3% 적립"
        ],
        isActive: true
      }
    ];

    console.log(`🎁 매장 ${store.id} 혜택 정보 로드:`, promotions.length, '개 혜택');

    if (promotions.length === 0) {
      container.innerHTML = `
        <div class="no-promotions fade-in">
          <div class="no-promotions-icon">🎁</div>
          <h3>진행중인 혜택이 없습니다</h3>
          <p>새로운 혜택이 준비되면 알려드리겠습니다!</p>
        </div>
      `;
      return;
    }

    const activePromotions = promotions.filter(p => p.isActive);
    
    container.innerHTML = activePromotions.map(promotion => `
      <div class="promotion-card fade-in">
        <div class="promotion-badge">${promotion.type}</div>
        <div class="promotion-name">${promotion.name}</div>
        <div class="promotion-description">${promotion.description}</div>
        
        <div class="promotion-details">
          <div class="detail-item">
            <div class="detail-label">할인율</div>
            <div class="detail-value">${promotion.discountRate}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">최소주문</div>
            <div class="detail-value">${promotion.minOrderAmount}</div>
          </div>
        </div>

        <div class="promotion-period">
          <div class="period-label">혜택 기간</div>
          <div class="period-value">${formatDate(promotion.startDate)} ~ ${formatDate(promotion.endDate)}</div>
        </div>

        <div class="promotion-conditions">
          <div class="conditions-title">이용 조건</div>
          <ul class="conditions-list">
            ${promotion.conditions.map(condition => `<li>${condition}</li>`).join('')}
          </ul>
        </div>
      </div>
    `).join('');

    console.log('✅ 혜택 상세 정보 렌더링 완료');

  } catch (error) {
    console.error('❌ 혜택 정보 로드 실패:', error);
    container.innerHTML = `
      <div class="no-promotions fade-in">
        <div class="no-promotions-icon">⚠️</div>
        <h3>혜택 정보를 불러올 수 없습니다</h3>
        <p>잠시 후 다시 시도해주세요.</p>
        <button onclick="loadPromotionDetails(window.currentStore)" style="margin-top: 16px; padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer;">
          다시 시도
        </button>
      </div>
    `;
  }
}

// 날짜 포맷 함수
function formatDate(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

// 전역 함수 등록
window.renderPromotionDetail = renderPromotionDetail;
window.loadPromotionDetails = loadPromotionDetails;
