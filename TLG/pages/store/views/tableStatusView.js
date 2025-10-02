
/**
 * 테이블 상태 View - UI 업데이트 전용
 */
export const tableStatusView = {
  /**
   * 테이블 정보 UI 업데이트
   */
  updateTableInfoUI(info) {
    // 기존 요소들 업데이트
    this.updateLegacyElements(info);

    // 새로운 시각적 요소들 업데이트
    this.updateVisualElements(info);

    // 상태 배지 업데이트
    this.updateStatusBadge(info);

    // 헤더 상태 업데이트
    this.updateStoreHeaderStatus(info.statusText, info.statusClass);

    console.log(`✅ 테이블 정보 UI 업데이트 완료: ${info.statusText} (사용률: ${info.occupancyRate}%)`);
  },

  /**
   * 레거시 요소 업데이트
   */
  updateLegacyElements(info) {
    const elements = {
      totalTables: document.getElementById('totalTables'),
      availableTables: document.getElementById('availableTables'),
      totalSeats: document.getElementById('totalSeats'),
      availableSeats: document.getElementById('availableSeats'),
      occupancyRate: document.getElementById('occupancyRate'),
      usageRateFill: document.getElementById('usageRateFill')
    };

    if (elements.totalTables) elements.totalTables.textContent = info.totalTables;
    if (elements.availableTables) elements.availableTables.textContent = info.availableTables;
    if (elements.totalSeats) elements.totalSeats.textContent = info.totalSeats;
    if (elements.availableSeats) elements.availableSeats.textContent = info.availableSeats;
    if (elements.occupancyRate) {
      elements.occupancyRate.textContent = info.occupancyRate + (info.occupancyRate !== '-' ? '%' : '');
    }

    // 사용률 바 업데이트
    if (elements.usageRateFill && info.occupancyRate !== '-') {
      const percentage = parseInt(info.occupancyRate) || 0;
      elements.usageRateFill.style.width = percentage + '%';
      
      if (percentage >= 90) {
        elements.usageRateFill.style.background = 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)';
      } else if (percentage >= 70) {
        elements.usageRateFill.style.background = 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)';
      } else {
        elements.usageRateFill.style.background = 'linear-gradient(90deg, #10b981 0%, #3b82f6 100%)';
      }
    }
  },

  /**
   * 시각적 요소 업데이트
   */
  updateVisualElements(info) {
    const rawData = info.rawData || {};
    const totalTables = rawData.totalTables || 0;
    const availableTables = rawData.availableTables || 0;
    const occupiedTables = totalTables - availableTables;
    const totalSeats = rawData.totalSeats || 0;
    const availableSeats = rawData.availableSeats || 0;
    const usedSeats = totalSeats - availableSeats;

    // 통계 업데이트
    const elements = {
      totalTablesVisual: document.getElementById('totalTablesVisual'),
      availableTablesVisual: document.getElementById('availableTablesVisual'),
      occupiedTablesVisual: document.getElementById('occupiedTablesVisual'),
      occupancyRateNew: document.getElementById('occupancyRateNew'),
      occupancyFillNew: document.getElementById('occupancyFillNew'),
      occupancyGlow: document.getElementById('occupancyGlow'),
      usedSeatsCount: document.getElementById('usedSeatsCount'),
      totalSeatsCount: document.getElementById('totalSeatsCount'),
      seatsVisual: document.getElementById('seatsVisual')
    };

    if (elements.totalTablesVisual) elements.totalTablesVisual.textContent = totalTables;
    if (elements.availableTablesVisual) elements.availableTablesVisual.textContent = availableTables;
    if (elements.occupiedTablesVisual) elements.occupiedTablesVisual.textContent = occupiedTables;
    if (elements.occupancyRateNew) {
      elements.occupancyRateNew.textContent = info.occupancyRate + (info.occupancyRate !== '-' ? '%' : '');
    }
    if (elements.usedSeatsCount) elements.usedSeatsCount.textContent = usedSeats;
    if (elements.totalSeatsCount) elements.totalSeatsCount.textContent = totalSeats;

    // 사용률 바 업데이트
    if (elements.occupancyFillNew && info.occupancyRate !== '-') {
      const percentage = parseInt(info.occupancyRate) || 0;
      elements.occupancyFillNew.style.width = percentage + '%';
      if (elements.occupancyGlow) {
        elements.occupancyGlow.style.width = percentage + '%';
      }
    }

    // 좌석 시각화
    if (elements.seatsVisual && totalSeats > 0) {
      this.renderSeatVisualization(elements.seatsVisual, totalSeats, usedSeats);
    }
  },

  /**
   * 좌석 시각화 렌더링
   */
  renderSeatVisualization(container, totalSeats, usedSeats) {
    const maxSeatsToShow = 30;
    const seatsToShow = Math.min(totalSeats, maxSeatsToShow);
    const seatRatio = usedSeats / totalSeats;
    const visualUsedSeats = Math.round(seatsToShow * seatRatio);
    
    let seatsHTML = '';
    for (let i = 0; i < seatsToShow; i++) {
      const seatClass = i < visualUsedSeats ? 'occupied' : 'available';
      seatsHTML += `<div class="seat-icon ${seatClass}"></div>`;
    }
    
    if (totalSeats > maxSeatsToShow) {
      seatsHTML += '<span style="font-size: 10px; color: #9ca3af; margin-left: 4px;">...</span>';
    }
    
    container.innerHTML = seatsHTML;
  },

  /**
   * 상태 배지 업데이트
   */
  updateStatusBadge(info) {
    const statusBadge = document.getElementById('tableStatusBadge');
    if (statusBadge) {
      statusBadge.textContent = info.statusText;
      statusBadge.className = `tlr-status-badge ${info.statusClass || ''}`;
    }
  },

  /**
   * 매장 헤더 상태 업데이트
   */
  updateStoreHeaderStatus(statusText, statusClass) {
    const storeStatusElements = document.querySelectorAll('.store-status, .status-badge');
    storeStatusElements.forEach(element => {
      if (element) {
        element.textContent = statusText === '운영중지' ? '🔴 운영중지' : '🟢 운영중';
        element.className = element.className.replace(/\b(open|closed)\b/g, '') + ` ${statusClass || ''}`;
      }
    });
  }
};
