/**
 * KDS API 서비스 모듈
 * - 초기 데이터 로드
 * - HTTP API 호출
 * - 상태 업데이트
 */

import type { APIResponse, Ticket } from '../types';

const API_BASE_URL = '/api';

class KDSAPIService {
  /**
   * 초기 데이터 로드
   */
  async loadInitialData(storeId: string): Promise<Ticket[]> {
    try {
      console.log(`🔄 매장 ${storeId} KDS 데이터 로드 중...`);

      const response = await fetch(`${API_BASE_URL}/kds/${storeId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data: APIResponse<Ticket[]> = await response.json();

      if (data.success) {
        console.log(`✅ KDS 데이터 로드 완료: ${data.orders?.length || 0}개 주문`);
        return data.orders || [];
      } else {
        throw new Error(data.error || 'KDS 데이터 로드 실패');
      }
    } catch (error) {
      console.error('❌ KDS 초기 데이터 로드 실패:', error);

      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
      }

      throw error;
    }
  }

  /**
   * 조리 시작 API
   */
  async startCooking(ticketId: string): Promise<APIResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/kds/tickets/${ticketId}/start-cooking`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result: APIResponse = await response.json();
      return result;
    } catch (error) {
      console.error('❌ 조리 시작 API 실패:', error);
      throw error;
    }
  }

  /**
   * 완료 처리 API
   */
  async markComplete(ticketId: string): Promise<APIResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/kds/tickets/${ticketId}/complete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result: APIResponse = await response.json();
      return result;
    } catch (error) {
      console.error('❌ 완료 처리 API 실패:', error);
      throw error;
    }
  }

  /**
   * 아이템 상태 업데이트
   */
  async updateItemStatus(itemId: string, status: string): Promise<APIResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/kds/items/${itemId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      const data: APIResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('❌ 아이템 상태 업데이트 API 실패:', error);
      throw error;
    }
  }

  /**
   * 출력 상태 업데이트 - 즉시 PRINTED 상태로 변경 및 KRP WebSocket 전송
   */
  async updatePrintStatus(ticketId: string): Promise<APIResponse> {
    try {
      console.log(`📡 출력 상태 업데이트 API 호출: ${ticketId} - 즉시 PRINTED 처리`);

      const response = await fetch(`${API_BASE_URL}/kds/tickets/${ticketId}/print`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          immediate: true,
          timestamp: new Date().toISOString(),
        }),
      });

      const data: APIResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      console.log(`✅ 출력 상태 업데이트 성공: ${ticketId} - KRP로 즉시 전송됨`);
      return data;
    } catch (error) {
      console.error(`❌ 출력 상태 업데이트 API 실패:`, error);
      throw error;
    }
  }
}

// 싱글톤 인스턴스 내보내기
export const kdsAPI = new KDSAPIService();
export default kdsAPI;
