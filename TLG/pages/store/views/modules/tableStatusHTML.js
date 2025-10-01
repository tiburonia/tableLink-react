
// 테이블 상태 HTML 렌더링 모듈
export const tableStatusHTML = {
  render(store) {
    return `
      <div id="TLR" class="tlr-container">
        <div class="tlr-header">
          <div class="tlr-title">
            <span class="tlr-icon">🍽️</span>
            <h3>테이블 현황</h3>
          </div>
          <div id="tableStatusBadge" class="tlr-status-badge">LOADING</div>
        </div>
        
        <div class="tlr-stats-grid">
          <div class="tlr-stat-item">
            <div class="stat-label">총 테이블</div>
            <div id="totalTables" class="stat-value">-</div>
          </div>
          <div class="tlr-stat-item">
            <div class="stat-label">빈 테이블</div>
            <div id="availableTables" class="stat-value">-</div>
          </div>
          <div class="tlr-stat-item">
            <div class="stat-label">총 좌석</div>
            <div id="totalSeats" class="stat-value">-</div>
          </div>
          <div class="tlr-stat-item">
            <div class="stat-label">잔여 좌석</div>
            <div id="availableSeats" class="stat-value">-</div>
          </div>
        </div>

        <div class="tlr-usage-section">
          <div class="usage-header">
            <span class="usage-label">사용률</span>
            <span id="occupancyRate" class="usage-percentage">-%</span>
          </div>
          <div class="usage-bar">
            <div id="usageRateFill" class="usage-fill"></div>
          </div>
        </div>

        <div class="tlr-actions">
          <button id="manualRefreshBtn" class="tlr-action-btn">
            <span class="btn-icon">🔄</span>
            <span class="btn-text">새로고침</span>
          </button>
          <button id="tableDetailToggleBtn" class="tlr-action-btn">
            <span class="btn-icon">📊</span>
            <span class="toggle-text">테이블 현황 자세히 보기</span>
          </button>
        </div>

        <div id="tableDetailContent" class="table-detail-content" style="display: none;">
          <div class="visual-stats">
            <div class="visual-stat-group">
              <div class="visual-stat-item">
                <div class="stat-circle tables">
                  <span id="totalTablesVisual" class="stat-number">0</span>
                  <span class="stat-unit">테이블</span>
                </div>
                <div class="stat-breakdown">
                  <div class="breakdown-item available">
                    <span class="breakdown-dot"></span>
                    <span class="breakdown-label">빈 테이블</span>
                    <span id="availableTablesVisual" class="breakdown-value">0</span>
                  </div>
                  <div class="breakdown-item occupied">
                    <span class="breakdown-dot"></span>
                    <span class="breakdown-label">사용중</span>
                    <span id="occupiedTablesVisual" class="breakdown-value">0</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="occupancy-visual">
              <div class="occupancy-header">
                <span class="occupancy-title">전체 사용률</span>
                <span id="occupancyRateNew" class="occupancy-rate">0%</span>
              </div>
              <div class="occupancy-bar-container">
                <div class="occupancy-bar">
                  <div id="occupancyFillNew" class="occupancy-fill"></div>
                  <div id="occupancyGlow" class="occupancy-glow"></div>
                </div>
              </div>
            </div>

            <div class="seats-visual">
              <div class="seats-header">
                <span class="seats-title">좌석 현황</span>
                <span class="seats-count">
                  <span id="usedSeatsCount">0</span>/<span id="totalSeatsCount">0</span>석
                </span>
              </div>
              <div id="seatsVisual" class="seats-grid"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
};

// 전역 등록
window.tableStatusHTML = tableStatusHTML;
