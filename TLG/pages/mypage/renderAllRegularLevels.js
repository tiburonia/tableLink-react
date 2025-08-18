
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
              <div class="stat-label">총 포인트</div>
            </div>
          </div>

          <div class="levels-section">
            <div class="section-header">
              <h2>단골 등급 현황</h2>
              <div class="levels-count skeleton-badge">로딩중...</div>
            </div>

            <div id="levelsList" class="levels-list">
              ${generateLevelsSkeletonCards(3)}
            </div>
          </div>
        </div>
      </div>

      ${getRegularLevelsStyles()}
    `;

    // 실제 데이터 로드
    await loadRegularLevelsData(userInfo);

  } catch (error) {
    console.error('❌ 단골 레벨 전체보기 로드 실패:', error);
    showRegularLevelsErrorState();
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
        <div class="skeleton-stats-grid"></div>
        <div class="skeleton-progress-section"></div>
      </div>
    </div>
  `).join('');
}

// 실제 단골 레벨 데이터 로드
async function loadRegularLevelsData(userInfo) {
  try {
    console.log(`🏆 사용자 ${userInfo.id} 단골 레벨 데이터 로드`);

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
    const totalPoints = regularStores.reduce((total, store) => {
      return total + (store.points || 0);
    }, 0);

    // 통계 업데이트
    updateLevelsStats(totalStores, highestLevel, totalPoints);

    // 단골 레벨 목록 업데이트
    updateLevelsList(regularStores);

  } catch (error) {
    console.error('❌ 단골 레벨 데이터 로드 실패:', error);
    showRegularLevelsErrorState();
  }
}

// 통계 업데이트
function updateLevelsStats(totalStores, highestLevel, totalPoints) {
  const statNumbers = document.querySelectorAll('.stat-number');
  if (statNumbers[0]) statNumbers[0].textContent = totalStores + '개';
  if (statNumbers[1]) statNumbers[1].textContent = `Lv.${highestLevel}`;
  if (statNumbers[2]) statNumbers[2].textContent = totalPoints.toLocaleString() + 'P';

  // 스켈레톤 클래스 제거
  statNumbers.forEach(el => el.classList.remove('skeleton-text'));
}

// 단골 레벨 목록 업데이트
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
    const currentLevel = storeData.currentLevel;
    const levelRank = currentLevel ? currentLevel.rank : 0;
    const levelName = currentLevel ? currentLevel.name : '신규고객';
    const levelDescription = currentLevel ? currentLevel.description : '';

    // 레벨 색상 결정
    const getLevelColor = (rank) => {
      const colors = {
        0: '#9ca3af', // 신규고객
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
    let progressData = null;
    if (storeData.nextLevel) {
      const current = {
        points: storeData.points || 0,
        spent: storeData.totalSpent || 0,
        visits: storeData.visitCount || 0
      };
      
      const required = {
        points: storeData.nextLevel.requiredPoints || 0,
        spent: storeData.nextLevel.requiredTotalSpent || 0,
        visits: storeData.nextLevel.requiredVisitCount || 0
      };

      const needed = {
        points: Math.max(0, required.points - current.points),
        spent: Math.max(0, required.spent - current.spent),
        visits: Math.max(0, required.visits - current.visits)
      };

      const percentages = {
        points: required.points > 0 ? Math.min(100, (current.points / required.points) * 100) : 100,
        spent: required.spent > 0 ? Math.min(100, (current.spent / required.spent) * 100) : 100,
        visits: required.visits > 0 ? Math.min(100, (current.visits / required.visits) * 100) : 100
      };

      // 전체 진행률 계산
      let overallProgress = 0;
      if (storeData.nextLevel.evalPolicy === 'OR') {
        overallProgress = Math.max(percentages.points, percentages.spent, percentages.visits);
      } else {
        const validConditions = [];
        if (required.points > 0) validConditions.push(percentages.points);
        if (required.spent > 0) validConditions.push(percentages.spent);
        if (required.visits > 0) validConditions.push(percentages.visits);
        overallProgress = validConditions.length > 0 ? 
          validConditions.reduce((a, b) => a + b, 0) / validConditions.length : 100;
      }

      progressData = {
        current,
        required,
        needed,
        percentages,
        overallProgress: Math.round(overallProgress),
        evalPolicy: storeData.nextLevel.evalPolicy,
        nextLevelName: storeData.nextLevel.name
      };
    }

    return `
      <div class="level-card" onclick="goToStore(${storeData.storeId})">
        <div class="level-card-header">
          <div class="store-info">
            <h3 class="store-name">${storeData.storeName}</h3>
            <div class="store-category">${storeData.category || '기타'}</div>
          </div>
          <div class="level-badge" style="background: ${levelColor}">
            <span class="level-rank">Lv.${levelRank}</span>
            <span class="level-name">${levelName}</span>
          </div>
        </div>

        <div class="level-card-body">
          <div class="current-stats-grid">
            <div class="stat-box points">
              <div class="stat-icon">⭐</div>
              <div class="stat-content">
                <div class="stat-number">${(storeData.points || 0).toLocaleString()}</div>
                <div class="stat-label">포인트</div>
              </div>
            </div>
            <div class="stat-box spent">
              <div class="stat-icon">💰</div>
              <div class="stat-content">
                <div class="stat-number">${(storeData.totalSpent || 0).toLocaleString()}</div>
                <div class="stat-label">누적결제</div>
              </div>
            </div>
            <div class="stat-box visits">
              <div class="stat-icon">🏪</div>
              <div class="stat-content">
                <div class="stat-number">${storeData.visitCount || 0}</div>
                <div class="stat-label">방문횟수</div>
              </div>
            </div>
          </div>

          ${levelDescription ? `
            <div class="level-description">
              <p>${levelDescription}</p>
            </div>
          ` : ''}

          ${progressData ? `
            <div class="progress-section">
              <div class="progress-header">
                <span class="next-level-info">다음: ${progressData.nextLevelName}</span>
                <span class="overall-progress">${progressData.overallProgress}%</span>
              </div>
              
              <div class="progress-details">
                ${progressData.required.points > 0 ? `
                  <div class="progress-item">
                    <div class="progress-item-header">
                      <span class="progress-label">⭐ 포인트</span>
                      <span class="progress-value">${progressData.current.points.toLocaleString()} / ${progressData.required.points.toLocaleString()}</span>
                    </div>
                    <div class="progress-bar">
                      <div class="progress-fill points-fill" style="width: ${progressData.percentages.points}%"></div>
                    </div>
                    ${progressData.needed.points > 0 ? `<div class="progress-needed">${progressData.needed.points.toLocaleString()}P 더 필요</div>` : '<div class="progress-completed">✅ 달성</div>'}
                  </div>
                ` : ''}
                
                ${progressData.required.spent > 0 ? `
                  <div class="progress-item">
                    <div class="progress-item-header">
                      <span class="progress-label">💰 누적결제</span>
                      <span class="progress-value">${progressData.current.spent.toLocaleString()} / ${progressData.required.spent.toLocaleString()}원</span>
                    </div>
                    <div class="progress-bar">
                      <div class="progress-fill spent-fill" style="width: ${progressData.percentages.spent}%"></div>
                    </div>
                    ${progressData.needed.spent > 0 ? `<div class="progress-needed">${progressData.needed.spent.toLocaleString()}원 더 필요</div>` : '<div class="progress-completed">✅ 달성</div>'}
                  </div>
                ` : ''}
                
                ${progressData.required.visits > 0 ? `
                  <div class="progress-item">
                    <div class="progress-item-header">
                      <span class="progress-label">🏪 방문횟수</span>
                      <span class="progress-value">${progressData.current.visits} / ${progressData.required.visits}회</span>
                    </div>
                    <div class="progress-bar">
                      <div class="progress-fill visits-fill" style="width: ${progressData.percentages.visits}%"></div>
                    </div>
                    ${progressData.needed.visits > 0 ? `<div class="progress-needed">${progressData.needed.visits}회 더 필요</div>` : '<div class="progress-completed">✅ 달성</div>'}
                  </div>
                ` : ''}
              </div>
              
              <div class="eval-policy-info">
                <span class="policy-badge ${progressData.evalPolicy.toLowerCase()}">${progressData.evalPolicy === 'OR' ? '조건 중 하나만 만족' : '모든 조건을 만족'}</span>
              </div>
            </div>
          ` : `
            <div class="max-level-section">
              <div class="max-level-badge">🏆 최고 등급 달성!</div>
              <div class="max-level-message">축하합니다! 이 매장의 최고 단골이에요!</div>
            </div>
          `}
        </div>

        <div class="level-card-footer">
          <div class="last-visit">
            ${storeData.lastVisitAt ? `마지막 방문: ${new Date(storeData.lastVisitAt).toLocaleDateString()}` : '방문 기록 없음'}
          </div>
          <button class="view-store-btn" onclick="event.stopPropagation(); goToStore(${storeData.storeId})">
            매장 보기
          </button>
        </div>
      </div>
    `;
  }).join('');

  levelsList.innerHTML = levelsHTML;
  console.log(`✅ ${regularStores.length}개 단골 매장 UI 렌더링 완료`);
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
        gap: 20px;
        overflow-y: auto;
      }

      .level-card {
        background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
        border-radius: 20px;
        padding: 24px;
        border: 1px solid #e2e8f0;
        transition: all 0.3s ease;
        cursor: pointer;
        position: relative;
        overflow: hidden;
      }

      .level-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 4px;
        height: 100%;
        background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
        border-radius: 0 2px 2px 0;
      }

      .level-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 40px rgba(139, 92, 246, 0.15);
        border-color: #cbd5e1;
      }

      .level-card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 20px;
      }

      .store-info {
        flex: 1;
      }

      .store-name {
        margin: 0 0 6px 0;
        font-size: 20px;
        font-weight: 700;
        color: #1e293b;
        line-height: 1.3;
      }

      .store-category {
        display: inline-block;
        background: #f1f5f9;
        color: #64748b;
        padding: 4px 8px;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 600;
      }

      .level-badge {
        padding: 12px 16px;
        border-radius: 16px;
        color: white;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        white-space: nowrap;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }

      .level-rank {
        font-size: 14px;
        font-weight: 800;
        opacity: 0.9;
      }

      .level-name {
        font-size: 12px;
        font-weight: 600;
      }

      .level-card-body {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .current-stats-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
      }

      .stat-box {
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        border-radius: 12px;
        padding: 16px;
        border: 1px solid #e2e8f0;
        text-align: center;
        transition: all 0.2s ease;
      }

      .stat-box:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
      }

      .stat-box.points:hover {
        box-shadow: 0 4px 16px rgba(251, 191, 36, 0.2);
      }

      .stat-box.spent:hover {
        box-shadow: 0 4px 16px rgba(34, 197, 94, 0.2);
      }

      .stat-box.visits:hover {
        box-shadow: 0 4px 16px rgba(59, 130, 246, 0.2);
      }

      .stat-icon {
        font-size: 20px;
        margin-bottom: 8px;
        display: block;
      }

      .stat-content {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .stat-box .stat-number {
        font-size: 16px;
        font-weight: 700;
        color: #1e293b;
        margin: 0;
        background: none;
        -webkit-background-clip: unset;
        -webkit-text-fill-color: unset;
        background-clip: unset;
      }

      .stat-box .stat-label {
        font-size: 11px;
        color: #64748b;
        font-weight: 500;
      }

      .level-description {
        background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
        border-radius: 12px;
        padding: 12px;
        border: 1px solid #f59e0b;
      }

      .level-description p {
        margin: 0;
        font-size: 13px;
        color: #92400e;
        font-weight: 500;
        line-height: 1.4;
      }

      .progress-section {
        background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
        border-radius: 16px;
        padding: 20px;
        border: 1px solid #0ea5e9;
      }

      .progress-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }

      .next-level-info {
        font-size: 14px;
        font-weight: 600;
        color: #0c4a6e;
      }

      .overall-progress {
        font-size: 16px;
        font-weight: 800;
        color: #0369a1;
        background: white;
        padding: 4px 8px;
        border-radius: 8px;
      }

      .progress-details {
        display: flex;
        flex-direction: column;
        gap: 16px;
        margin-bottom: 16px;
      }

      .progress-item {
        background: white;
        border-radius: 12px;
        padding: 16px;
        border: 1px solid #bae6fd;
      }

      .progress-item-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }

      .progress-label {
        font-size: 13px;
        font-weight: 600;
        color: #0c4a6e;
      }

      .progress-value {
        font-size: 12px;
        font-weight: 500;
        color: #64748b;
      }

      .progress-bar {
        width: 100%;
        height: 8px;
        background: #f1f5f9;
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 8px;
      }

      .progress-fill {
        height: 100%;
        border-radius: 4px;
        transition: width 0.6s ease;
      }

      .points-fill {
        background: linear-gradient(90deg, #fbbf24, #f59e0b);
      }

      .spent-fill {
        background: linear-gradient(90deg, #34d399, #10b981);
      }

      .visits-fill {
        background: linear-gradient(90deg, #60a5fa, #3b82f6);
      }

      .progress-needed {
        font-size: 11px;
        color: #ef4444;
        font-weight: 500;
      }

      .progress-completed {
        font-size: 11px;
        color: #059669;
        font-weight: 600;
      }

      .eval-policy-info {
        text-align: center;
      }

      .policy-badge {
        display: inline-block;
        padding: 6px 12px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
      }

      .policy-badge.or {
        background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
        color: white;
      }

      .policy-badge.and {
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        color: white;
      }

      .max-level-section {
        background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
        border-radius: 16px;
        padding: 20px;
        text-align: center;
        border: 1px solid #fbbf24;
      }

      .max-level-badge {
        font-size: 18px;
        font-weight: 800;
        color: #92400e;
        margin-bottom: 8px;
      }

      .max-level-message {
        font-size: 13px;
        color: #b45309;
        font-weight: 500;
      }

      .level-card-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 20px;
        padding-top: 16px;
        border-top: 1px solid #f1f5f9;
      }

      .last-visit {
        font-size: 12px;
        color: #64748b;
        font-weight: 500;
      }

      .view-store-btn {
        background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 10px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
      }

      .view-store-btn:hover {
        background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(139, 92, 246, 0.4);
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
      .skeleton-stats-grid,
      .skeleton-progress-section {
        background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
        background-size: 200% 100%;
        animation: skeleton-loading 2s infinite;
        border-radius: 4px;
      }

      .skeleton-card {
        pointer-events: none;
      }

      .skeleton-store-name {
        height: 20px;
        width: 160px;
        margin-bottom: 8px;
      }

      .skeleton-level-badge {
        height: 48px;
        width: 80px;
      }

      .skeleton-stats-grid {
        height: 80px;
        width: 100%;
        margin-bottom: 16px;
      }

      .skeleton-progress-section {
        height: 120px;
        width: 100%;
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
          padding: 20px;
        }

        .header-info h1 {
          font-size: 20px;
        }

        .current-stats-grid {
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .stat-box {
          padding: 12px;
        }

        .stat-icon {
          font-size: 16px;
        }

        .stat-box .stat-number {
          font-size: 14px;
        }

        .progress-section {
          padding: 16px;
        }
      }
    </style>
  `;
}

// 전역으로 함수 노출
window.renderAllRegularLevels = renderAllRegularLevels;
