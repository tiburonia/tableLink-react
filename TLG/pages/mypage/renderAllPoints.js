
// 보유 포인트 전체보기 렌더링 함수
async function renderAllPoints(userInfo) {
  try {
    console.log('💰 보유 포인트 전체보기 화면 렌더링');

    const main = document.getElementById('main');
    
    // 스켈레톤 UI 먼저 표시
    main.innerHTML = `
      <div class="points-container">
        <div class="points-header">
          <button id="backBtn" class="header-back-btn" onclick="renderMyPage()">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M19 12H5m7-7l-7 7 7 7"/>
            </svg>
          </button>
          <div class="header-info">
            <h1>💰 보유 포인트</h1>
            <p class="header-subtitle">매장별 포인트 현황을 확인하세요</p>
          </div>
        </div>

        <div class="points-content">
          <div class="points-stats-card">
            <div class="stat-item">
              <div class="stat-number skeleton-text">-</div>
              <div class="stat-label">총 포인트</div>
            </div>
            <div class="stat-item">
              <div class="stat-number skeleton-text">-</div>
              <div class="stat-label">매장 수</div>
            </div>
            <div class="stat-item">
              <div class="stat-number skeleton-text">-</div>
              <div class="stat-label">평균 포인트</div>
            </div>
          </div>

          <div class="points-section">
            <div class="section-header">
              <h2>매장별 포인트</h2>
              <div class="points-count skeleton-badge">로딩중...</div>
            </div>
            
            <div id="pointsList" class="points-list">
              ${generatePointsSkeletonCards(5)}
            </div>
          </div>
        </div>
      </div>

      ${getPointsStyles()}
    `;

    // 실제 데이터 로드
    await loadPointsData(userInfo);

  } catch (error) {
    console.error('❌ 보유 포인트 전체보기 로드 실패:', error);
    showPointsErrorState();
  }
}

// 포인트 스켈레톤 카드 생성
function generatePointsSkeletonCards(count) {
  return Array.from({ length: count }, (_, i) => `
    <div class="points-card skeleton-card">
      <div class="points-card-header">
        <div class="skeleton-store-name"></div>
        <div class="skeleton-points-value"></div>
      </div>
      <div class="points-card-body">
        <div class="skeleton-category"></div>
        <div class="skeleton-stats"></div>
        <div class="points-card-footer">
          <div class="skeleton-last-visit"></div>
          <div class="skeleton-button"></div>
        </div>
      </div>
    </div>
  `).join('');
}

// 실제 포인트 데이터 로드
async function loadPointsData(userInfo) {
  try {
    const response = await fetch(`/api/regular-levels/user/${userInfo.id}/all-points`);
    if (!response.ok) throw new Error('포인트 조회 실패');

    const data = await response.json();
    const pointsData = data.storePoints || [];

    // 포인트가 있는 매장만 필터링
    const storesWithPoints = pointsData.filter(store => store.points > 0);

    // 통계 데이터 계산
    const totalPoints = storesWithPoints.reduce((sum, store) => sum + store.points, 0);
    const totalStores = storesWithPoints.length;
    const averagePoints = totalStores > 0 ? Math.round(totalPoints / totalStores) : 0;

    // 통계 업데이트
    updatePointsStats(totalPoints, totalStores, averagePoints);

    // 포인트 목록 업데이트
    updatePointsList(storesWithPoints);

  } catch (error) {
    console.error('❌ 포인트 데이터 로드 실패:', error);
    showPointsErrorState();
  }
}

// 통계 업데이트
function updatePointsStats(totalPoints, totalStores, averagePoints) {
  const statNumbers = document.querySelectorAll('.stat-number');
  if (statNumbers[0]) statNumbers[0].textContent = totalPoints.toLocaleString() + 'P';
  if (statNumbers[1]) statNumbers[1].textContent = totalStores + '개';
  if (statNumbers[2]) statNumbers[2].textContent = averagePoints.toLocaleString() + 'P';

  // 스켈레톤 클래스 제거
  statNumbers.forEach(el => el.classList.remove('skeleton-text'));
}

// 포인트 목록 업데이트
function updatePointsList(pointsData) {
  const pointsList = document.getElementById('pointsList');
  const pointsCount = document.querySelector('.points-count');

  if (pointsCount) {
    pointsCount.textContent = `${pointsData.length}개`;
    pointsCount.classList.remove('skeleton-badge');
  }

  if (pointsData.length === 0) {
    pointsList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">💰</div>
        <h3>아직 보유한 포인트가 없어요</h3>
        <p>매장에서 주문하여 포인트를 적립해보세요!</p>
        <button class="primary-btn" onclick="renderMap()">
          <span class="btn-icon">🗺️</span>
          매장 찾기
        </button>
      </div>
    `;
    return;
  }

  // 포인트 순으로 정렬
  const sortedPoints = pointsData.sort((a, b) => b.points - a.points);

  const pointsHTML = sortedPoints.map((store, index) => {
    const lastVisitDate = store.lastVisitAt ? new Date(store.lastVisitAt) : null;
    const lastVisitText = lastVisitDate ? 
      `${lastVisitDate.toLocaleDateString()} 방문` : '방문 기록 없음';
    
    // 포인트 등급 결정
    let pointsGrade = '';
    let gradeColor = '';
    if (store.points >= 10000) {
      pointsGrade = 'VIP';
      gradeColor = '#dc2626';
    } else if (store.points >= 5000) {
      pointsGrade = 'GOLD';
      gradeColor = '#f59e0b';
    } else if (store.points >= 1000) {
      pointsGrade = 'SILVER';
      gradeColor = '#6b7280';
    } else {
      pointsGrade = 'BRONZE';
      gradeColor = '#92400e';
    }
    
    return `
      <div class="points-card" onclick="goToStore(${store.storeId})">
        <div class="points-card-header">
          <div class="store-info">
            <h3 class="store-name">${store.storeName}</h3>
            <div class="store-meta">
              <span class="store-category">${store.storeCategory || '기타'}</span>
              <span class="points-grade" style="background: ${gradeColor}">${pointsGrade}</span>
            </div>
          </div>
          <div class="points-value">
            <span class="points-number">${store.points.toLocaleString()}</span>
            <span class="points-unit">P</span>
          </div>
        </div>

        <div class="points-card-body">
          <div class="points-stats">
            <div class="stat-row">
              <span class="stat-icon">🏪</span>
              <span class="stat-label">방문 횟수</span>
              <span class="stat-value">${store.visitCount || 0}회</span>
            </div>
            <div class="stat-row">
              <span class="stat-icon">💳</span>
              <span class="stat-label">누적 결제</span>
              <span class="stat-value">${(store.totalSpent || 0).toLocaleString()}원</span>
            </div>
            <div class="stat-row">
              <span class="stat-icon">📅</span>
              <span class="stat-label">마지막 방문</span>
              <span class="stat-value">${lastVisitText}</span>
            </div>
          </div>
          
          <div class="points-card-footer">
            <div class="points-actions">
              <button class="use-points-btn" onclick="event.stopPropagation(); usePoints(${store.storeId}, ${store.points})">
                <span class="btn-icon">💸</span>
                포인트 사용
              </button>
              <button class="visit-store-btn" onclick="event.stopPropagation(); goToStore(${store.storeId})">
                <span class="btn-icon">🏪</span>
                매장가기
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  pointsList.innerHTML = pointsHTML;
}

// 포인트 사용하기
function usePoints(storeId, points) {
  console.log('💸 포인트 사용:', storeId, points);
  // 추후 포인트 사용 기능 구현
  alert(`${points.toLocaleString()}P 포인트 사용 기능은 준비중입니다.`);
}

// 에러 상태 표시
function showPointsErrorState() {
  const main = document.getElementById('main');
  if (main) {
    main.innerHTML = `
      <div class="points-container">
        <div class="points-header">
          <button id="backBtn" class="header-back-btn" onclick="renderMyPage()">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M19 12H5m7-7l-7 7 7 7"/>
            </svg>
          </button>
          <div class="header-info">
            <h1>💰 보유 포인트</h1>
          </div>
        </div>

        <div class="points-content">
          <div class="error-state">
            <div class="error-icon">⚠️</div>
            <h3>포인트 정보를 불러올 수 없어요</h3>
            <p>잠시 후 다시 시도해주세요</p>
            <button class="primary-btn" onclick="renderAllPoints(userInfo)">
              <span class="btn-icon">🔄</span>
              다시 시도
            </button>
          </div>
        </div>
      </div>

      ${getPointsStyles()}
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
function getPointsStyles() {
  return `
    <style>
      .points-container {
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

      .points-header {
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

      .points-content {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .points-stats-card {
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
        background: linear-gradient(135deg, #059669 0%, #047857 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .stat-label {
        font-size: 12px;
        color: #64748b;
        font-weight: 600;
      }

      .points-section {
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

      .points-count {
        background: #f1f5f9;
        color: #475569;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
      }

      .points-list {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 16px;
        overflow-y: auto;
      }

      .points-card {
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        border-radius: 16px;
        padding: 20px;
        border: 1px solid #e2e8f0;
        transition: all 0.2s ease;
        cursor: pointer;
      }

      .points-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
        border-color: #cbd5e1;
      }

      .points-card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 16px;
      }

      .store-info {
        flex: 1;
      }

      .store-name {
        margin: 0 0 8px 0;
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

      .store-category {
        background: #f1f5f9;
        color: #475569;
        padding: 2px 8px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 600;
      }

      .points-grade {
        color: white;
        padding: 2px 8px;
        border-radius: 6px;
        font-size: 10px;
        font-weight: 700;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
      }

      .points-value {
        text-align: right;
        display: flex;
        align-items: baseline;
        gap: 2px;
      }

      .points-number {
        font-size: 24px;
        font-weight: 800;
        color: #059669;
        line-height: 1;
      }

      .points-unit {
        font-size: 14px;
        font-weight: 600;
        color: #047857;
      }

      .points-card-body {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .points-stats {
        background: #f8fafc;
        border-radius: 12px;
        padding: 16px;
        border: 1px solid #e2e8f0;
      }

      .stat-row {
        display: flex;
        align-items: center;
        margin-bottom: 8px;
        gap: 8px;
      }

      .stat-row:last-child {
        margin-bottom: 0;
      }

      .stat-icon {
        font-size: 14px;
        width: 20px;
        text-align: center;
      }

      .stat-label {
        flex: 1;
        font-size: 13px;
        color: #64748b;
        font-weight: 500;
      }

      .stat-value {
        font-size: 13px;
        color: #1e293b;
        font-weight: 600;
      }

      .points-card-footer {
        display: flex;
        justify-content: flex-end;
      }

      .points-actions {
        display: flex;
        gap: 8px;
      }

      .use-points-btn,
      .visit-store-btn {
        padding: 8px 12px;
        border: none;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .use-points-btn {
        background: linear-gradient(135deg, #059669 0%, #047857 100%);
        color: white;
      }

      .use-points-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 3px 12px rgba(5, 150, 105, 0.3);
      }

      .visit-store-btn {
        background: #f1f5f9;
        color: #475569;
        border: 1px solid #e2e8f0;
      }

      .visit-store-btn:hover {
        background: #e2e8f0;
        color: #334155;
      }

      .primary-btn {
        padding: 12px 24px;
        border: none;
        border-radius: 12px;
        background: linear-gradient(135deg, #059669 0%, #047857 100%);
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
        box-shadow: 0 4px 16px rgba(5, 150, 105, 0.3);
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
      .skeleton-points-value,
      .skeleton-category,
      .skeleton-stats,
      .skeleton-last-visit,
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
        margin-bottom: 8px;
      }

      .skeleton-points-value {
        height: 24px;
        width: 80px;
      }

      .skeleton-category {
        height: 16px;
        width: 60px;
      }

      .skeleton-stats {
        height: 80px;
        width: 100%;
      }

      .skeleton-last-visit {
        height: 14px;
        width: 100px;
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
        .points-header {
          padding: 16px 12px;
        }

        .points-content {
          padding: 16px 12px;
        }

        .points-stats-card,
        .points-section {
          padding: 16px;
        }

        .points-card {
          padding: 16px;
        }

        .header-info h1 {
          font-size: 20px;
        }

        .points-actions {
          flex-direction: column;
          gap: 4px;
          width: 100%;
        }

        .use-points-btn,
        .visit-store-btn {
          width: 100%;
          justify-content: center;
        }
      }
    </style>
  `;
}

// 전역으로 함수 노출
window.renderAllPoints = renderAllPoints;
