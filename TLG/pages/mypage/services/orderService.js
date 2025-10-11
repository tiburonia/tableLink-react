
/**
 * Order Service
 * 주문 비즈니스 로직 - 데이터 가공 및 처리
 */

import { orderRepository } from '../repositories/orderRepository.js';

export const orderService = {
  /**
   * 주문 내역 로드 및 통계 계산
   */
  async loadOrderData(userId) {
    try {
      const orders = await orderRepository.getUserOrders(userId);

      // 통계 계산
      const totalOrders = orders.length;
      const now = new Date();
      
      const thisMonthOrders = orders.filter(order => {
        const orderDate = new Date(order.order_date);
        return orderDate.getMonth() === now.getMonth() && 
               orderDate.getFullYear() === now.getFullYear();
      }).length;

      const totalAmount = orders.reduce((sum, order) => 
        sum + (order.final_amount || order.total_amount || 0), 0);

      return {
        orders,
        stats: {
          totalOrders,
          thisMonthOrders,
          totalAmount
        }
      };
    } catch (error) {
      console.error('❌ loadOrderData 실패:', error);
      throw error;
    }
  },

  /**
   * 주문 아이템 텍스트 생성
   */
  getOrderItemsText(order) {
    const orderData = order.order_data || {};
    const items = orderData.items || [];
    
    if (items.length === 0) return '메뉴 정보 없음';
    
    return items.map(i => `${i.name}(${i.qty || i.quantity || 1}개)`).join(', ');
  }
};
