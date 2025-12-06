
// TLM 매출 대시보드 모듈
class TLMSalesDashboard {
  constructor(storeId) {
    this.storeId = storeId;
    this.salesData = {};
  }

  // 매출 데이터 로드
  async loadSalesData(period = 'today') {
    try {
      const response = await fetch(`/api/stores/${this.storeId}/sales?period=${period}`);
      const data = await response.json();
      
      if (data.success) {
        this.salesData[period] = data.sales;
        this.notifyDataChange(period);
        return data.sales;
      }
    } catch (error) {
      console.error('매출 데이터 로드 실패:', error);
      throw error;
    }
  }

  // 실시간 매출 현황 렌더링
  renderRealTimeSales() {
    const todaySales = this.salesData.today || {};
    
    return `
      <div class="sales-dashboard">
        <h3>📊 실시간 매출 현황</h3>
        <div class="sales-grid">
          <div class="sales-card">
            <div class="sales-value">${(todaySales.revenue || 0).toLocaleString()}원</div>
            <div class="sales-label">오늘 매출</div>
            <div class="sales-trend ${this.getTrendClass(todaySales.revenueTrend)}">
              ${this.getTrendIcon(todaySales.revenueTrend)} ${Math.abs(todaySales.revenueTrend || 0)}%
            </div>
          </div>
          
          <div class="sales-card">
            <div class="sales-value">${todaySales.orderCount || 0}건</div>
            <div class="sales-label">오늘 주문</div>
            <div class="sales-trend ${this.getTrendClass(todaySales.orderTrend)}">
              ${this.getTrendIcon(todaySales.orderTrend)} ${Math.abs(todaySales.orderTrend || 0)}%
            </div>
          </div>
          
          <div class="sales-card">
            <div class="sales-value">${(todaySales.avgOrderValue || 0).toLocaleString()}원</div>
            <div class="sales-label">평균 주문액</div>
          </div>
          
          <div class="sales-card">
            <div class="sales-value">${todaySales.peakHour || '정보없음'}</div>
            <div class="sales-label">피크 시간</div>
          </div>
        </div>
      </div>
    `;
  }

  getTrendClass(trend) {
    if (trend > 0) return 'trend-up';
    if (trend < 0) return 'trend-down';
    return 'trend-neutral';
  }

  getTrendIcon(trend) {
    if (trend > 0) return '📈';
    if (trend < 0) return '📉';
    return '➡️';
  }

  // 변경 알림
  notifyDataChange(period) {
    if (this.onDataChange) {
      this.onDataChange(period, this.salesData[period]);
    }
  }
}

window.TLMSalesDashboard = TLMSalesDashboard;
