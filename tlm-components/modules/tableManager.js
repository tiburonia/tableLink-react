
// TLM 테이블 관리 모듈
class TLMTableManager {
  constructor(storeId) {
    this.storeId = storeId;
    this.tables = new Map();
    this.realTimeMode = true;
  }

  // 테이블 데이터 로드
  async loadTables() {
    try {
      const response = await fetch(`/api/stores/${this.storeId}/tables`);
      const data = await response.json();
      
      if (data.success) {
        data.tables.forEach(table => {
          this.tables.set(table.tableNumber, table);
        });
        this.notifyTablesChange();
        return data.tables;
      }
    } catch (error) {
      console.error('테이블 데이터 로드 실패:', error);
      throw error;
    }
  }

  // 테이블 상태 변경
  async toggleTableStatus(tableNumber, newStatus = null) {
    const table = this.tables.get(tableNumber);
    if (!table) return;

    const targetStatus = newStatus !== null ? newStatus : !table.isOccupied;
    
    try {
      const endpoint = targetStatus ? '/api/tables/occupy-manual' : '/api/tables/update';
      const payload = targetStatus 
        ? { storeId: this.storeId, tableName: table.tableName, duration: 0 }
        : { storeId: this.storeId, tableName: table.tableName, isOccupied: false };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (data.success) {
        // 로컬 상태 업데이트
        table.isOccupied = targetStatus;
        table.occupiedSince = targetStatus ? new Date().toISOString() : null;
        
        this.notifyTablesChange();
        return data;
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('테이블 상태 변경 실패:', error);
      throw error;
    }
  }

  // 테이블 통계 계산
  getTableStats() {
    const tables = Array.from(this.tables.values());
    const totalTables = tables.length;
    const occupiedTables = tables.filter(t => t.isOccupied).length;
    const availableTables = totalTables - occupiedTables;
    const totalSeats = tables.reduce((sum, t) => sum + t.seats, 0);
    const occupiedSeats = tables.filter(t => t.isOccupied).reduce((sum, t) => sum + t.seats, 0);
    const availableSeats = totalSeats - occupiedSeats;
    const occupancyRate = totalSeats > 0 ? Math.round((occupiedSeats / totalSeats) * 100) : 0;

    return {
      totalTables,
      availableTables,
      occupiedTables,
      totalSeats,
      availableSeats,
      occupiedSeats,
      occupancyRate
    };
  }

  // 실시간 업데이트 활성화
  enableRealTimeUpdates() {
    if (this.realTimeUpdateInterval) {
      clearInterval(this.realTimeUpdateInterval);
    }

    this.realTimeUpdateInterval = setInterval(async () => {
      try {
        await this.loadTables();
      } catch (error) {
        console.error('실시간 테이블 업데이트 실패:', error);
      }
    }, 10000); // 10초마다 업데이트
  }

  // 변경 알림
  notifyTablesChange() {
    if (this.onTablesChange) {
      this.onTablesChange(Array.from(this.tables.values()), this.getTableStats());
    }
  }

  // 정리
  destroy() {
    if (this.realTimeUpdateInterval) {
      clearInterval(this.realTimeUpdateInterval);
    }
  }
}

window.TLMTableManager = TLMTableManager;
