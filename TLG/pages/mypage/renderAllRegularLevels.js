// 단골 레벨 전체보기 렌더링 함수
async function renderAllRegularLevels(userInfo) {
  try {
    console.log('🏆 단골 레벨 전체보기 화면 렌더링');

    const main = document.getElementById('main');

    // 스켈레톤 UI 먼저 표시
    main.innerHTML = `
      <div class="regular-levels-container">
        <div class="regular-levels-header">
          <button id="backBtn" class="header-back-btn" onclick="renderMyPage()">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M19 12H5m7-7l-7 7 7 7"/>
            </svg>
          </button>
          <div class="header-info">
            <h1>🏆 단골 레벨</h1>
            <p class="header-subtitle">나의 단골 매장 등급을 확인하세요</p>
          </div>
        </div>

        <div class="regular-levels-content">
          <div class="levels-stats-card">
            <div class="stat-item">
              <div class="stat-number skeleton-text">-</div>
              <div class="stat-label">단골 매장</div>
            </div>
            <div class="stat-item">
              <div class="stat-number skeleton-text">-</div>
              <div class="stat-label">최고 등급</div>
            </div>
            <div class="stat-item">
              <div class="stat-number skeleton-text">-</div>
              <div class="stat-label">총 혜택</div>
            </div>
          </div>

          <div class="levels-section">
            <div class="section-header">
              <h2>단골 등급 현황</h2>
              <div class="levels-count skeleton-badge">로딩중...</div>
            </div>

            <div id="levelsList" class="levels-list">
              ${generateLevelsSkeletonCards(5)}
            </div>
          </div>
        </div>
      </div>

      ${getRegularLevelsStyles()}
    `;

    // RegularLevelManager 로드 후 데이터 로드
    await loadRegularLevelManager();
    await loadRegularLevelsData(userInfo);

  } catch (error) {
    console.error('❌ 단골 레벨 전체보기 로드 실패:', error);
    showRegularLevelsErrorState();
  }
}

// RegularLevelManager 로드
async function loadRegularLevelManager() {
  if (!window.RegularLevelManager) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = '/TLG/utils/regularLevelManager.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
}

// 단골 레벨 스켈레톤 카드 생성
function generateLevelsSkeletonCards(count) {
  return Array.from({ length: count }, (_, i) => `
    <div class="level-card skeleton-card">
      <div class="level-card-header">
        <div class="skeleton-store-name"></div>
        <div class="skeleton-level-badge"></div>
      </div>
      <div class="level-card-body">
        <div class="skeleton-progress"></div>
        <div class="skeleton-stats"></div>
        <div class="level-card-footer">
          <div class="skeleton-benefits"></div>
          <div class="skeleton-button"></div>
        </div>
      </div>
    </div>
  `).join('');
}

// 실제 단골 레벨 데이터 로드 - 비정규화된 DB 컬럼 직접 사용
async function loadRegularLevelsData(userInfo) {
  try {
    console.log(`🏆 사용자 ${userInfo.id} 단골 레벨 데이터 로드 (비정규화 컬럼 사용)`);

    // 비정규화된 컬럼을 직접 조회하는 API 호출
    const response = await fetch(`/api/regular-levels/user/${userInfo.id}?limit=50`);
    if (!response.ok) throw new Error('단골 레벨 조회 실패');

    const data = await response.json();
    const regularStores = data.regularStores || [];

    console.log(`📊 조회된 단골 매장 데이터:`, regularStores);

    // 통계 데이터 계산
    const totalStores = regularStores.length;
    const highestLevel = regularStores.reduce((max, store) => {
      const currentRank = store.currentLevel ? store.currentLevel.rank : 0;
      return currentRank > max ? currentRank : max;
    }, 0);
    const totalBenefits = regularStores.reduce((total, store) => {
      // 혜택 수는 레벨 랭크를 기준으로 추정
      const rank = store.currentLevel ? store.currentLevel.rank : 0;
      return total + rank;
    }, 0);

    console.log(`📈 계산된 통계: 매장 ${totalStores}개, 최고 레벨 ${highestLevel}, 총 혜택 ${totalBenefits}개`);

    // 통계 업데이트
    updateLevelsStats(totalStores, highestLevel, totalBenefits);

    // 단골 레벨 목록 업데이트
    updateLevelsList(regularStores);

  } catch (error) {
    console.error('❌ 단골 레벨 데이터 로드 실패:', error);
    showRegularLevelsErrorState();
  }
}

// 통계 업데이트
function updateLevelsStats(totalStores, highestLevel, totalBenefits) {
  const statNumbers = document.querySelectorAll('.stat-number');
  if (statNumbers[0]) statNumbers[0].textContent = totalStores + '개';
  if (statNumbers[1]) statNumbers[1].textContent = `Lv.${highestLevel}`;
  if (statNumbers[2]) statNumbers[2].textContent = totalBenefits + '개';

  // 스켈레톤 클래스 제거
  statNumbers.forEach(el => el.classList.remove('skeleton-text'));
}

// 단골 레벨 목록 업데이트 - 비정규화된 데이터 사용
function updateLevelsList(regularStores) {
  const levelsList = document.getElementById('levelsList');
  const levelsCount = document.querySelector('.levels-count');

  if (levelsCount) {
    levelsCount.textContent = `${regularStores.length}개`;
    levelsCount.classList.remove('skeleton-badge');
  }

  if (regularStores.length === 0) {
    levelsList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🏆</div>
        <h3>아직 단골 매장이 없어요</h3>
        <p>자주 방문하여 단골 등급을 올려보세요!</p>
        <button class="primary-btn" onclick="renderMap()">
          <span class="btn-icon">🗺️</span>
          매장 찾기
        </button>
      </div>
    `;
    return;
  }

  const levelsHTML = regularStores.map(storeData => {
    // 비정규화된 컬럼에서 직접 레벨 정보 가져오기
    const currentLevel = storeData.currentLevel;
    const levelRank = currentLevel ? currentLevel.rank : 0;
    const levelName = currentLevel ? currentLevel.name : '신규고객';
    const levelDescription = currentLevel ? currentLevel.description : '';

    // 레벨 색상 결정
    const getLevelColor = (rank) => {
      const colors = {
        0: '#9ca3af', // 신규고객 - 회색
        1: '#cd7f32', // 브론즈
        2: '#c0c0c0', // 실버
        3: '#ffd700', // 골드
        4: '#e5e4e2', // 플래티넘
        5: '#b9f2ff'  // 다이아몬드
      };
      return colors[rank] || '#9ca3af';
    };

    const levelColor = getLevelColor(levelRank);

    // 다음 레벨까지의 진행률 계산
    let progressPercentage = 0;
    if (storeData.nextLevel) {
      const points = storeData.points || 0;
      const totalSpent = storeData.totalSpent || 0;
      const visitCount = storeData.visitCount || 0;

      const requiredPoints = storeData.nextLevel.requiredPoints || 0;
      const requiredSpent = storeData.nextLevel.requiredTotalSpent || 0;
      const requiredVisits = storeData.nextLevel.requiredVisitCount || 0;

      if (storeData.nextLevel.evalPolicy === 'OR') {
        const pointsPercent = requiredPoints > 0 ? Math.min(100, (points / requiredPoints) * 100) : 100;
        const spentPercent = requiredSpent > 0 ? Math.min(100, (totalSpent / requiredSpent) * 100) : 100;
        const visitsPercent = requiredVisits > 0 ? Math.min(100, (visitCount / requiredVisits) * 100) : 100;
        progressPercentage = Math.max(pointsPercent, spentPercent, visitsPercent);
      } else {
        const pointsPercent = requiredPoints > 0 ? Math.min(100, (points / requiredPoints) * 100) : 100;
        const spentPercent = requiredSpent > 0 ? Math.min(100, (totalSpent / requiredSpent) * 100) : 100;
        const visitsPercent = requiredVisits > 0 ? Math.min(100, (visitCount / requiredVisits) * 100) : 100;
        progressPercentage = (pointsPercent + spentPercent + visitsPercent) / 3;
      }
    }

    console.log(`🏪 매장 ${storeData.storeName}: 레벨 랭크 ${levelRank}, 이름 ${levelName}, 진행률 ${progressPercentage.toFixed(1)}%`);

    return `
      <div class="level-card" onclick="goToStore(${storeData.storeId})">
        <div class="level-card-header">
          <div class="store-info">
            <h3 class="store-name">${storeData.storeName}</h3>
            <div class="store-category">${storeData.category || '기타'}</div>
          </div>
          <div class="level-badge" style="background: ${levelColor}">
            <span class="level-name">Lv.${levelRank} ${levelName}</span>
          </div>
        </div>

        <div class="level-card-body">
          <div class="level-stats">
            <div class="stat-item">
              <span class="stat-number">${storeData.visitCount || 0}</span>
              <span class="stat-label">방문</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">${(storeData.points || 0).toLocaleString()}</span>
              <span class="stat-label">포인트</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">${(storeData.totalSpent || 0).toLocaleString()}</span>
              <span class="stat-label">누적결제</span>
            </div>
          </div>

          ${storeData.nextLevel ? `
            <div class="progress-section">
              <div class="progress-header">
                <span class="next-level">다음: ${storeData.nextLevel.name}</span>
                <span class="progress-percent">${Math.round(progressPercentage)}%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${Math.round(progressPercentage)}%"></div>
              </div>
              <div class="progress-requirements">
                ${storeData.nextLevel.requiredVisitCount > storeData.visitCount ? `<span>방문 ${storeData.nextLevel.requiredVisitCount - storeData.visitCount}회 더</span>` : ''}
                ${storeData.nextLevel.requiredTotalSpent > storeData.totalSpent ? `<span>결제 ${(storeData.nextLevel.requiredTotalSpent - storeData.totalSpent).toLocaleString()}원 더</span>` : ''}
                ${storeData.nextLevel.requiredPoints > storeData.points ? `<span>포인트 ${storeData.nextLevel.requiredPoints - storeData.points}P 더</span>` : ''}
              </div>
            </div>
          ` : `
            <div class="max-level">
              <div class="max-level-badge">🏆 최고 등급 달성!</div>
            </div>
          `}

          ${levelDescription ? `
            <div class="level-description">
              <p>${levelDescription}</p>
            </div>
          ` : ''}
        </div>

        <div class="level-card-footer">
          <div class="last-visit">
            ${storeData.lastVisitAt ? `마지막 방문: ${new Date(storeData.lastVisitAt).toLocaleDateString()}` : '방문 기록 없음'}
          </div>
          <button class="view-benefits-btn" onclick="event.stopPropagation(); viewStoreBenefits(${storeData.storeId})">
            혜택 보기
          </button>
        </div>
      </div>
    `;
  }).join('');

  levelsList.innerHTML = levelsHTML;
  console.log(`✅ ${regularStores.length}개 단골 매장 UI 렌더링 완료`);
}

// 레벨 상세 정보 보기
function showLevelDetail(storeId) {
  console.log('📊 레벨 상세 정보:', storeId);
  // 추후 상세 정보 모달 구현
  alert('레벨 상세 정보 기능은 준비중입니다.');
}

// 에러 상태 표시
function showRegularLevelsErrorState() {
  const main = document.getElementById('main');
  if (main) {
    main.innerHTML = `
      <div class="regular-levels-container">
        <div class="regular-levels-header">
          <button id="backBtn" class="header-back-btn" onclick="renderMyPage()">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M19 12H5m7-7l-7 7 7 7"/>
            </svg>
          </button>
          <div class="header-info">
            <h1>🏆 단골 레벨</h1>
          </div>
        </div>

        <div class="regular-levels-content">
          <div class="error-state">
            <div class="error-icon">⚠️</div>
            <h3>단골 레벨 정보를 불러올 수 없어요</h3>
            <p>잠시 후 다시 시도해주세요</p>
            <button class="primary-btn" onclick="renderAllRegularLevels(userInfo)">
              <span class="btn-icon">🔄</span>
              다시 시도
            </button>
          </div>
        </div>
      </div>

      ${getRegularLevelsStyles()}
    `;
  }
}

// 매장으로 이동
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
      });
  }
}

// 스타일 정의
function getRegularLevelsStyles() {
  return `
    <style>
      .regular-levels-container {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        width: 100%;
        max-width: 430px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        overflow: hidden;
      }

      .regular-levels-header {
        height: 80px;
        background: white;
        padding: 20px 16px;
        display: flex;
        align-items: center;
        gap: 16px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
        flex-shrink: 0;
        z-index: 100;
      }

      .header-back-btn {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        border: none;
        background: #f1f5f9;
        color: #475569;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .header-back-btn:hover {
        background: #e2e8f0;
        color: #334155;
      }

      .header-info {
        flex: 1;
      }

      .header-info h1 {
        margin: 0 0 4px 0;
        font-size: 22px;
        font-weight: 700;
        color: #1e293b;
        line-height: 1.2;
      }

      .header-subtitle {
        margin: 0;
        font-size: 13px;
        color: #64748b;
        font-weight: 500;
      }

      .regular-levels-content {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .levels-stats-card {
        background: white;
        border-radius: 16px;
        padding: 20px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
        border: 1px solid rgba(226, 232, 240, 0.8);
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
      }

      .stat-item {
        text-align: center;
      }

      .stat-number {
        font-size: 20px;
        font-weight: 800;
        color: #1e293b;
        margin-bottom: 4px;
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .stat-label {
        font-size: 12px;
        color: #64748b;
        font-weight: 600;
      }

      .levels-section {
        background: white;
        border-radius: 16px;
        padding: 20px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
        border: 1px solid rgba(226, 232, 240, 0.8);
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 12px;
        border-bottom: 2px solid #f1f5f9;
      }

      .section-header h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
        color: #1e293b;
      }

      .levels-count {
        background: #f1f5f9;
        color: #475569;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
      }

      .levels-list {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 16px;
        overflow-y: auto;
      }

      .level-card {
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        border-radius: 16px;
        padding: 20px;
        border: 1px solid #e2e8f0;
        transition: all 0.2s ease;
        cursor: pointer;
      }

      .level-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
        border-color: #cbd5e1;
      }

      .level-card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 16px;
      }

      .store-info {
        flex: 1;
      }

      .store-name {
        margin: 0 0 4px 0;
        font-size: 18px;
        font-weight: 700;
        color: #1e293b;
        line-height: 1.3;
      }

      .store-meta {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }

      .visit-count,
      .total-spent {
        font-size: 12px;
        color: #64748b;
        background: #f1f5f9;
        padding: 2px 6px;
        border-radius: 6px;
        font-weight: 500;
      }

      .level-badge {
        padding: 8px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 700;
        color: white;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        white-space: nowrap;
      }

      .level-card-body {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .progress-section {
        background: #f8fafc;
        border-radius: 12px;
        padding: 16px;
        border: 1px solid #e2e8f0;
      }

      .progress-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }

      .progress-label {
        font-size: 14px;
        color: #475569;
        font-weight: 600;
      }

      .progress-percentage {
        font-size: 14px;
        color: #f59e0b;
        font-weight: 700;
      }

      .progress-bar {
        width: 100%;
        height: 8px;
        background: #e2e8f0;
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 8px;
      }

      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #f59e0b, #d97706);
        border-radius: 4px;
        transition: width 0.3s ease;
      }

      .next-level-info {
        font-size: 12px;
        color: #64748b;
        text-align: center;
      }

      .max-level-section {
        background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
        border-radius: 12px;
        padding: 16px;
        text-align: center;
        border: 1px solid #fbbf24;
      }

      .max-level-badge {
        font-size: 16px;
        font-weight: 700;
        color: #92400e;
        margin-bottom: 4px;
      }

      .max-level-message {
        font-size: 12px;
        color: #b45309;
      }

      .level-stats {
        background: #f8fafc;
        border-radius: 8px;
        padding: 12px;
        border: 1px solid #e2e8f0;
      }

      .stat-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;
      }

      .stat-row:last-child {
        margin-bottom: 0;
      }

      .stat-label {
        font-size: 13px;
        color: #64748b;
        font-weight: 500;
      }

      .stat-value {
        font-size: 13px;
        color: #1e293b;
        font-weight: 600;
      }

      .benefits-section {
        background: #f0f9ff;
        border-radius: 8px;
        padding: 12px;
        border: 1px solid #bae6fd;
      }

      .benefits-title {
        margin: 0 0 8px 0;
        font-size: 14px;
        color: #0369a1;
        font-weight: 600;
      }

      .benefits-list {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .benefit-item {
        font-size: 12px;
        color: #0c4a6e;
        background: white;
        padding: 4px 8px;
        border-radius: 6px;
        border: 1px solid #e0f2fe;
      }

      .level-card-footer {
        display: flex;
        gap: 8px;
      }

      .level-detail-btn,
      .visit-store-btn {
        flex: 1;
        padding: 8px 12px;
        border: none;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
      }

      .level-detail-btn {
        background: #f1f5f9;
        color: #475569;
        border: 1px solid #e2e8f0;
      }

      .level-detail-btn:hover {
        background: #e2e8f0;
        color: #334155;
      }

      .visit-store-btn {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        color: white;
      }

      .visit-store-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 3px 12px rgba(245, 158, 11, 0.3);
      }

      .primary-btn {
        padding: 12px 24px;
        border: none;
        border-radius: 12px;
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        color: white;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }

      .primary-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(245, 158, 11, 0.3);
      }

      .empty-state,
      .error-state {
        text-align: center;
        padding: 60px 20px;
        color: #64748b;
      }

      .empty-icon,
      .error-icon {
        font-size: 64px;
        margin-bottom: 16px;
      }

      .empty-state h3,
      .error-state h3 {
        margin: 0 0 8px 0;
        font-size: 18px;
        font-weight: 700;
        color: #1e293b;
      }

      .empty-state p,
      .error-state p {
        margin: 0 0 24px 0;
        font-size: 14px;
        color: #64748b;
      }

      /* 스켈레톤 애니메이션 */
      .skeleton-text,
      .skeleton-badge,
      .skeleton-store-name,
      .skeleton-level-badge,
      .skeleton-progress,
      .skeleton-stats,
      .skeleton-benefits,
      .skeleton-button {
        background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
        background-size: 200% 100%;
        animation: skeleton-loading 2s infinite;
        border-radius: 4px;
      }

      .skeleton-card {
        pointer-events: none;
      }

      .skeleton-store-name {
        height: 18px;
        width: 140px;
        margin-bottom: 4px;
      }

      .skeleton-level-badge {
        height: 32px;
        width: 80px;
      }

      .skeleton-progress {
        height: 40px;
        width: 100%;
        margin-bottom: 8px;
      }

      .skeleton-stats {
        height: 60px;
        width: 100%;
        margin-bottom: 8px;
      }

      .skeleton-benefits {
        height: 80px;
        width: 100%;
      }

      .skeleton-button {
        height: 32px;
        width: 80px;
      }

      @keyframes skeleton-loading {
        0% {
          background-position: -200% 0;
        }
        100% {
          background-position: 200% 0;
        }
      }

      @media (max-width: 480px) {
        .regular-levels-header {
          padding: 16px 12px;
        }

        .regular-levels-content {
          padding: 16px 12px;
        }

        .levels-stats-card,
        .levels-section {
          padding: 16px;
        }

        .level-card {
          padding: 16px;
        }

        .header-info h1 {
          font-size: 20px;
        }

        .level-card-footer {
          flex-direction: column;
          gap: 4px;
        }
      }
    </style>
  `;
}

// 전역으로 함수 노출
window.renderAllRegularLevels = renderAllRegularLevels;