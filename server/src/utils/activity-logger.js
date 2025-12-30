
const pool = require('../db/pool');

/**
 * 사용자 활동 로깅 유틸리티
 */
class ActivityLogger {
  
  /**
   * 활동 로그 생성
   */
  static async logActivity({
    userId = null,
    guestPhone = null,
    storeId,
    eventType,
    eventData = {},
    checkId = null,
    paymentId = null,
    reviewId = null,
    deviceInfo = {}
  }) {
    try {
      // 회원 또는 게스트 정보 중 하나는 필수
      if (!userId && !guestPhone) {
        throw new Error('사용자 ID 또는 게스트 전화번호가 필요합니다');
      }

      const result = await pool.query(`
        INSERT INTO user_activity_logs (
          user_id, guest_phone, store_id, event_type, event_data,
          check_id, payment_id, review_id, device_info, occurred_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
        RETURNING id
      `, [
        userId, guestPhone, storeId, eventType, JSON.stringify(eventData),
        checkId, paymentId, reviewId, JSON.stringify(deviceInfo)
      ]);

      console.log(`📊 활동 로그 생성: ${eventType} (ID: ${result.rows[0].id})`);
      return result.rows[0].id;

    } catch (error) {
      console.error('❌ 활동 로그 생성 실패:', error);
      throw error;
    }
  }

  /**
   * 주문 생성 로그
   */
  static async logOrderCreated(userId, guestPhone, storeId, checkId, orderData) {
    return await this.logActivity({
      userId,
      guestPhone,
      storeId,
      eventType: 'order_created',
      eventData: {
        itemCount: orderData.items?.length || 0,
        totalAmount: orderData.totalAmount || 0,
        source: 'TLL'
      },
      checkId
    });
  }

  /**
   * 결제 완료 로그
   */
  static async logPaymentCompleted(userId, guestPhone, storeId, checkId, paymentId, paymentData) {
    return await this.logActivity({
      userId,
      guestPhone,
      storeId,
      eventType: 'payment_completed',
      eventData: {
        amount: paymentData.amount,
        method: paymentData.method,
        pgTransactionId: paymentData.pgTransactionId
      },
      checkId,
      paymentId
    });
  }

  /**
   * 리뷰 작성 로그
   */
  static async logReviewSubmitted(userId, storeId, reviewId, reviewData) {
    return await this.logActivity({
      userId,
      storeId,
      eventType: 'review_submitted',
      eventData: {
        rating: reviewData.rating,
        hasContent: reviewData.content ? true : false
      },
      reviewId
    });
  }

  /**
   * 포인트 사용/적립 로그
   */
  static async logPointActivity(userId, storeId, checkId, pointType, pointAmount) {
    return await this.logActivity({
      userId,
      storeId,
      eventType: pointType === 'earn' ? 'point_earned' : 'point_used',
      eventData: {
        pointAmount,
        pointType
      },
      checkId
    });
  }
}

module.exports = ActivityLogger;
