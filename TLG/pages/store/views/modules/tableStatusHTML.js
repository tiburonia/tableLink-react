
// 테이블 상태 HTML 렌더링 모듈
export const tableStatusHTML = {
  renderTableStatusHTML(store) {
    return `
      <div id="TLR" class="tlr-container premium-table-card">
        <div class="card-gradient-bg"></div>

        <div class="tlr-header-new">
          <div class="status-indicator-wrapper">
            <div class="status-pulse ${store.isOpen ? 'active' : 'inactive'}"></div>
            <div class="tlr-title-section">
              <h3 class="tlr-main-title">테이블 현황</h3>
              <div class="tlr-status-badge ${store.isOpen ? 'open' : 'closed'}" id="tableStatusBadge">
                ${store.isOpen ? '실시간 업데이트 중' : '운영중지'}
              </div>
            </div>
          </div>
          <div class="refresh-indicator" id="refreshIndicator">
            <span class="refresh-icon">🔄</span>
          </div>
        </div>

        <div class="table-visual-summary">
          <div class="visual-stats-row">
            <div class="visual-stat-item occupied">
              <div class="visual-icon">🔴</div>
              <div class="visual-data">
                <span class="visual-number" id="occupiedTablesVisual">-</span>
                <span class="visual-label">사용중</span>
              </div>
            </div>
            <div class="visual-stat-item available">
              <div class="visual-icon">🟢</div>
              <div class="visual-data">
                <span class="visual-number" id="availableTablesVisual">-</span>
                <span class="visual-label">이용가능</span>
              </div>
            </div>
            <div class="visual-stat-item total">
              <div class="visual-icon">⚪</div>
              <div class="visual-data">
                <span class="visual-number" id="totalTablesVisual">-</span>
                <span class="visual-label">전체</span>
              </div>
            </div>
          </div>
        </div>

        <div class="table-detail-toggle-section">
          <button class="table-detail-toggle-btn" id="tableDetailToggleBtn">
            <span class="toggle-text">테이블 현황 자세히 보기</span>
            <span class="toggle-arrow">▼</span>
          </button>
        </div>

        <div class="table-detail-content" id="tableDetailContent" style="display: none;">
          <div class="occupancy-visualization">
            <div class="occupancy-header">
              <span class="occupancy-title">좌석 사용률</span>
              <div class="occupancy-percentage-wrapper">
                <span class="occupancy-percentage" id="occupancyRateNew">-%</span>
                <div class="percentage-trend" id="occupancyTrend">
                  <span class="trend-icon">📈</span>
                </div>
              </div>
            </div>

            <div class="occupancy-progress-container">
              <div class="occupancy-track">
                <div class="occupancy-fill" id="occupancyFillNew"></div>
                <div class="occupancy-glow" id="occupancyGlow"></div>
              </div>
              <div class="occupancy-markers">
                <span class="marker low">25%</span>
                <span class="marker mid">50%</span>
                <span class="marker high">75%</span>
              </div>
            </div>

            <div class="seats-breakdown">
              <div class="seats-info">
                <span class="seats-used" id="usedSeatsCount">-</span>
                <span class="seats-separator">/</span>
                <span class="seats-total" id="totalSeatsCount">-</span>
                <span class="seats-label">좌석</span>
              </div>
              <div class="seats-visual" id="seatsVisual">
                <!-- 좌석 아이콘들이 동적으로 생성됩니다 -->
              </div>
            </div>
          </div>

          <div class="quick-actions-row">
            <button class="action-btn layout-btn" onclick="renderTableLayout(${JSON.stringify(store).replace(/"/g, '&quot;')})">
              <span class="action-icon">🗺️</span>
              <span class="action-text">배치도</span>
            </button>
            <button class="action-btn refresh-btn" id="manualRefreshBtn">
              <span class="action-icon">🔄</span>
              <span class="action-text">새로고침</span>
            </button>
            <button class="action-btn reserve-btn" onclick="renderReservationScreen(${JSON.stringify(store).replace(/"/g, '&quot;')})">
              <span class="action-icon">📅</span>
              <span class="action-text">예약</span>
            </button>
          </div>
        </div>
      </div>
    `;
  },
};

// 전역 등록
window.tableStatusHTML = tableStatusHTML;
