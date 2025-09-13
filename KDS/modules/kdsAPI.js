
/**
 * KDS API 서비스 모듈
 * - 초기 데이터 로드
 * - HTTP API 호출
 * - 상태 업데이트
 */

(function() {
  'use strict';

  console.log('🌐 KDS API 모듈 로드');

  // =================== API 서비스 ===================
  window.KDSAPIService = {
    /**
     * 초기 데이터 로드
     */
    async loadInitialData(storeId) {
      try {
        console.log(`🔄 매장 ${storeId} KDS 데이터 로드 중...`);

        const response = await fetch(`/api/orders/kds/${storeId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();

        if (data.success) {
          console.log(`✅ KDS 데이터 로드 완료: ${data.orders?.length || 0}개 주문`);
          return data.orders || [];
        } else {
          throw new Error(data.error || 'KDS 데이터 로드 실패');
        }

      } catch (error) {
        console.error('❌ KDS 초기 데이터 로드 실패:', error);

        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          throw new Error('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
        }

        throw error;
      }
    },

    /**
     * 조리 시작 API
     */
    async startCooking(ticketId) {
      try {
        const response = await fetch(`/api/orders/kds/tickets/${ticketId}/start-cooking`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();
        return result;

      } catch (error) {
        console.error('❌ 조리 시작 API 실패:', error);
        throw error;
      }
    },

    /**
     * 완료 처리 API
     */
    async markComplete(ticketId) {
      try {
        const response = await fetch(`/api/orders/kds/tickets/${ticketId}/complete`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();
        return result;

      } catch (error) {
        console.error('❌ 완료 처리 API 실패:', error);
        throw error;
      }
    },

    /**
     * 아이템 상태 업데이트 (HTTP 백업)
     */
    async updateItemStatus(itemId, status, kitchenNotes = null) {
      try {
        const response = await fetch(`/api/orders/kds/items/${itemId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: status,
            kitchenNotes: kitchenNotes
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();
        return result;

      } catch (error) {
        console.error('❌ 아이템 상태 업데이트 실패:', error);
        throw error;
      }
    }
  };

  console.log('✅ KDS API 모듈 로드 완료');
})();
