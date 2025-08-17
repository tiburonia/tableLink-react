
// 단골 레벨 관리 유틸리티
window.RegularLevelManager = {
  // 사용자의 매장별 단골 레벨 정보 가져오기
  async getUserRegularLevel(userId, storeId) {
    try {
      const response = await fetch(`/api/regular-levels/user/${userId}/store/${storeId}`);
      const data = await response.json();
      
      if (data.success) {
        return {
          level: data.userStats?.currentLevel,
          stats: data.userStats,
          nextLevel: data.nextLevel,
          progress: this.calculateProgress(data.userStats, data.nextLevel)
        };
      }
      
      return null;
    } catch (error) {
      console.error('❌ 단골 레벨 정보 조회 실패:', error);
      return null;
    }
  },

  // 사용자의 모든 단골 레벨 목록 가져오기
  async getUserAllRegularLevels(userId) {
    try {
      const response = await fetch(`/api/regular-levels/user/${userId}`);
      const data = await response.json();
      
      if (data.success) {
        return data.regularStores || [];
      }
      
      return [];
    } catch (error) {
      console.error('❌ 전체 단골 레벨 정보 조회 실패:', error);
      return [];
    }
  },

  // 매장의 단골 레벨 시스템 정보 가져오기
  async getStoreRegularLevels(storeId) {
    try {
      const response = await fetch(`/api/regular-levels/store/${storeId}`);
      const data = await response.json();
      
      if (data.success) {
        return data.levels || [];
      }
      
      return [];
    } catch (error) {
      console.error('❌ 매장 단골 레벨 시스템 조회 실패:', error);
      return [];
    }
  },

  // 진행률 계산
  calculateProgress(userStats, nextLevel) {
    if (!userStats || !nextLevel) return null;
    
    const points = userStats.points || 0;
    const totalSpent = userStats.totalSpent || 0;
    const visitCount = userStats.visitCount || 0;
    
    const requiredPoints = nextLevel.requiredPoints || 0;
    const requiredSpent = nextLevel.requiredTotalSpent || 0;
    const requiredVisits = nextLevel.requiredVisitCount || 0;
    
    // OR 정책인 경우 가장 높은 진행률 사용
    if (nextLevel.evalPolicy === 'OR') {
      const pointsPercent = requiredPoints > 0 ? Math.min(100, (points / requiredPoints) * 100) : 100;
      const spentPercent = requiredSpent > 0 ? Math.min(100, (totalSpent / requiredSpent) * 100) : 100;
      const visitsPercent = requiredVisits > 0 ? Math.min(100, (visitCount / requiredVisits) * 100) : 100;
      
      const maxPercent = Math.max(pointsPercent, spentPercent, visitsPercent);
      
      return {
        percentage: Math.round(maxPercent),
        points_needed: Math.max(0, requiredPoints - points),
        spending_needed: Math.max(0, requiredSpent - totalSpent),
        visits_needed: Math.max(0, requiredVisits - visitCount)
      };
    } else {
      // AND 정책인 경우 모든 조건의 평균 진행률
      const pointsPercent = requiredPoints > 0 ? Math.min(100, (points / requiredPoints) * 100) : 100;
      const spentPercent = requiredSpent > 0 ? Math.min(100, (totalSpent / requiredSpent) * 100) : 100;
      const visitsPercent = requiredVisits > 0 ? Math.min(100, (visitCount / requiredVisits) * 100) : 100;
      
      const avgPercent = (pointsPercent + spentPercent + visitsPercent) / 3;
      
      return {
        percentage: Math.round(avgPercent),
        points_needed: Math.max(0, requiredPoints - points),
        spending_needed: Math.max(0, requiredSpent - totalSpent),
        visits_needed: Math.max(0, requiredVisits - visitCount)
      };
    }
  },

  // 단골 레벨에 따른 색상 반환
  getLevelColor(levelRank) {
    const colors = {
      1: '#cd7f32', // 브론즈
      2: '#c0c0c0', // 실버
      3: '#ffd700', // 골드
      4: '#e5e4e2', // 플래티넘
      5: '#b9f2ff'  // 다이아몬드
    };
    return colors[levelRank] || '#cd7f32';
  },

  // 단골 레벨 UI 렌더링
  renderLevelUI(levelData, containerSelector) {
    const container = document.querySelector(containerSelector);
    if (!container || !levelData) return;

    const level = levelData.level;
    const stats = levelData.stats;
    const nextLevel = levelData.nextLevel;
    const progress = levelData.progress;

    container.innerHTML = `
      <div class="regular-level-card">
        <div class="level-header">
          <div class="level-badge" style="background: ${this.getLevelColor(level?.level_rank)}">
            <span class="level-name">${level?.level_name || '신규 고객'}</span>
          </div>
          <div class="level-stats">
            <span class="visit-count">${stats?.visit_count || 0}회 방문</span>
            <span class="total-spent">${(stats?.total_spent || 0).toLocaleString()}원 누적</span>
          </div>
        </div>
        
        ${nextLevel ? `
          <div class="level-progress">
            <div class="progress-info">
              <span>다음 레벨: ${nextLevel.level_name}</span>
              <span>${progress?.percentage || 0}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${progress?.percentage || 0}%"></div>
            </div>
            <div class="progress-requirements">
              ${progress?.visits_needed ? `<span>방문 ${progress.visits_needed}회 더</span>` : ''}
              ${progress?.spending_needed ? `<span>결제 ${progress.spending_needed.toLocaleString()}원 더</span>` : ''}
            </div>
          </div>
        ` : ''}
        
        ${level?.benefits && level.benefits.length > 0 ? `
          <div class="level-benefits">
            <h4>🎁 현재 레벨 혜택</h4>
            <div class="benefits-list">
              ${level.benefits.map(benefit => `
                <div class="benefit-item">
                  <span class="benefit-type">${this.formatBenefitType(benefit.type)}</span>
                  <span class="benefit-description">${benefit.description || benefit.value}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
      
      <style>
        .regular-level-card {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-radius: 16px;
          padding: 20px;
          margin: 16px 0;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }
        
        .level-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        
        .level-badge {
          padding: 8px 16px;
          border-radius: 20px;
          color: white;
          font-weight: bold;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }
        
        .level-stats {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
          font-size: 12px;
          color: #666;
        }
        
        .level-progress {
          margin-bottom: 16px;
        }
        
        .progress-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          font-size: 14px;
          font-weight: 500;
        }
        
        .progress-bar {
          height: 8px;
          background: #e9ecef;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 8px;
        }
        
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea, #764ba2);
          transition: width 0.3s ease;
        }
        
        .progress-requirements {
          display: flex;
          gap: 12px;
          font-size: 12px;
          color: #666;
        }
        
        .level-benefits h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          color: #333;
        }
        
        .benefits-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .benefit-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.7);
          border-radius: 8px;
          font-size: 13px;
        }
        
        .benefit-type {
          font-weight: 600;
          color: #667eea;
        }
        
        .benefit-description {
          color: #333;
        }
      </style>
    `;
  },

  // 혜택 타입 포맷팅
  formatBenefitType(type) {
    const typeMap = {
      'point_multiplier': '포인트 적립',
      'discount_percent': '할인',
      'discount_coupon': '할인 쿠폰',
      'loyalty_coupon': '단골 할인',
      'vip_coupon': 'VIP 할인',
      'premium_coupon': '프리미엄 할인',
      'free_delivery': '무료배송',
      'free_drink': '음료 무료',
      'free_side': '사이드 무료',
      'free_upgrade': '업그레이드',
      'birthday_gift': '생일 선물',
      'monthly_free': '월간 무료',
      'priority_service': '우선 서비스',
      'early_access': '신메뉴 체험',
      'exclusive_menu': '전용 메뉴',
      'birthday_coupon': '생일 쿠폰'
    };
    return typeMap[type] || type;
  }
};

console.log('✅ RegularLevelManager 로드 완료');
