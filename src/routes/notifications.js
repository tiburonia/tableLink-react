const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// 📢 사용자 알림 목록 조회 (메타데이터 기반 관련 정보 포함)
router.get('/', async (req, res) => {
  try {
    const { userId, type, limit = 50, offset = 0 } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: '사용자 ID가 필요합니다'
      });
    }

    let whereClause = 'WHERE user_id = $1';
    const queryParams = [parseInt(userId)];
    let paramCount = 2;

    if (type && type !== 'all') {
      whereClause += ` AND type = $${paramCount}`;
      queryParams.push(type);
      paramCount++;
    }

    const result = await pool.query(`
      SELECT 
        id,
        type,
        title,
        message,
        metadata,
        created_at,
        is_read,
        sent_source
      FROM notifications
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `, [...queryParams, parseInt(limit), parseInt(offset)]);

    // 알림에 관련 데이터 조회 및 추가
    const enrichedNotifications = await Promise.all(
      result.rows.map(async (notification) => {
        try {
          const metadata = notification.metadata || {};
          const enrichedData = await getEnrichedNotificationData(metadata);

          return {
            id: notification.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            metadata: metadata,
            createdAt: new Date(notification.created_at),
            isRead: notification.is_read,
            sentSource: notification.sent_source,
            // 기존 호환성을 위한 필드들
            related_order_id: metadata.order_id || null,
            related_store_id: metadata.store_id || null,
            // 새로운 조회된 관련 데이터
            enrichedData: enrichedData
          };
        } catch (error) {
          console.error('❌ 알림 데이터 조회 실패:', notification.id, error);
          return {
            id: notification.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            metadata: notification.metadata,
            createdAt: new Date(notification.created_at),
            isRead: notification.is_read,
            sentSource: notification.sent_source,
            related_order_id: notification.metadata?.order_id || null,
            related_store_id: notification.metadata?.store_id || null,
            enrichedData: null
          };
        }
      })
    );

    res.json({
      success: true,
      notifications: enrichedNotifications,
      count: enrichedNotifications.length
    });

  } catch (error) {
    console.error('❌ 알림 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '알림을 조회할 수 없습니다'
    });
  }
});

// 📢 개별 알림 상세 조회 (관련 데이터 포함)
router.get('/:notificationId', async (req, res) => {
  try {
    const { notificationId } = req.params;

    const result = await pool.query(`
      SELECT 
        id,
        user_id,
        type,
        title,
        message,
        metadata,
        created_at,
        is_read,
        sent_source
      FROM notifications
      WHERE id = $1
    `, [parseInt(notificationId)]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '알림을 찾을 수 없습니다'
      });
    }

    const notification = result.rows[0];
    const metadata = notification.metadata || {};

    // 메타데이터 기반 관련 데이터 조회
    const enrichedData = await getEnrichedNotificationData(metadata);

    res.json({
      success: true,
      notification: {
        id: notification.id,
        user_id: notification.user_id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        metadata: metadata,
        createdAt: new Date(notification.created_at),
        isRead: notification.is_read,
        sentSource: notification.sent_source,
        // 기존 호환성을 위한 필드들
        related_order_id: metadata.order_id || null,
        related_store_id: metadata.store_id || null,
        // 새로운 조회된 관련 데이터
        enrichedData: enrichedData
      }
    });

  } catch (error) {
    console.error('❌ 개별 알림 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '알림을 조회할 수 없습니다'
    });
  }
});

// 🔍 메타데이터 기반 관련 데이터 조회 함수
async function getEnrichedNotificationData(metadata) {
  const enrichedData = {};

  try {
    // 메타데이터에서 관련 정보 조회하여 enrichedData 생성
    if (metadata.order_id) {
      try {
        const orderQuery = await pool.query(`
          SELECT 
            o.id,
            o.store_id,
            o.table_num as table_number,
            o.total_amount,
            o.created_at,
            s.name as store_name
          FROM orders o
          JOIN stores s ON o.store_id = s.id
          WHERE o.id = $1
        `, [metadata.order_id]);

        if (orderQuery.rows.length > 0) {
          enrichedData.order = orderQuery.rows[0];
        }
      } catch (error) {
        console.warn('⚠️ 주문 정보 조회 실패:', error);
      }
    }

    if (metadata.store_id) {
      try {
        const storeQuery = await pool.query(`
          SELECT id as store_id, name
          FROM stores
          WHERE id = $1
        `, [metadata.store_id]);

        if (storeQuery.rows.length > 0) {
          enrichedData.store = storeQuery.rows[0];
        }
      } catch (error) {
        console.warn('⚠️ 매장 정보 조회 실패:', error);
      }
    }

    if (metadata.ticket_id) {
      try {
        // ticket_id를 통해 order_tickets와 orders 조인하여 정보 조회
        const ticketQuery = await pool.query(`
          SELECT 
            ot.id as ticket_id,
            ot.status,
            ot.created_at,
            ot.order_id,
            o.table_num as table_number,
            o.total_price,
            s.name as store_name,
            s.id as store_id
          FROM order_tickets ot
          JOIN orders o ON ot.order_id = o.id
          JOIN stores s ON o.store_id = s.id
          WHERE ot.id = $1
        `, [metadata.ticket_id]);

        if (ticketQuery.rows.length > 0) {
          const ticket = ticketQuery.rows[0];
          enrichedData.ticket = {
            ticket_id: ticket.ticket_id,
            status: ticket.status,
            created_at: ticket.created_at
          };
          // 주문 정보도 함께 추가
          if (!enrichedData.order) {
            enrichedData.order = {
              id: ticket.order_id,
              table_number: ticket.table_number,
              total_amount: ticket.total_amount
            };
          }
          // 매장 정보도 함께 추가
          if (!enrichedData.store) {
            enrichedData.store = {
              store_id: ticket.store_id,
              name: ticket.store_name
            };
          }
        }
      } catch (error) {
        console.warn('⚠️ 티켓 정보 조회 실패:', error);
      }
    }

    if (metadata.payment_id) {
      try {
        const paymentQuery = await pool.query(`
          SELECT id, amount as final_amount, method, status, created_at
          FROM payments
          WHERE id = $1
        `, [metadata.payment_id]);

        if (paymentQuery.rows.length > 0) {
          enrichedData.payment = paymentQuery.rows[0];
        }
      } catch (error) {
        console.warn('⚠️ 결제 정보 조회 실패:', error);
      }
    }

    return enrichedData;

  } catch (error) {
    console.error('❌ 관련 데이터 조회 실패:', error);
    return {};
  }
}

// 📢 개별 알림 읽음 처리
router.put('/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { userId } = req.body;

    console.log(`📢 알림 읽음 처리 요청:`, {
      notificationId,
      userId,
      notificationIdType: typeof notificationId,
      userIdType: typeof userId
    });

    if (!userId) {
      console.error('❌ 사용자 ID 누락');
      return res.status(400).json({
        success: false,
        error: '사용자 ID가 필요합니다'
      });
    }

    // 파라미터 검증
    const parsedNotificationId = parseInt(notificationId);
    const parsedUserId = parseInt(userId);

    if (isNaN(parsedNotificationId) || isNaN(parsedUserId)) {
      console.error('❌ 유효하지 않은 ID:', { notificationId, userId });
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 ID입니다'
      });
    }

    // 먼저 알림이 존재하는지 확인
    const existsResult = await pool.query(`
      SELECT id, user_id, is_read
      FROM notifications
      WHERE id = $1
    `, [parsedNotificationId]);

    if (existsResult.rows.length === 0) {
      console.error('❌ 알림을 찾을 수 없음:', parsedNotificationId);
      return res.status(404).json({
        success: false,
        error: '알림을 찾을 수 없습니다'
      });
    }

    const notification = existsResult.rows[0];
    console.log(`📢 알림 확인:`, {
      id: notification.id,
      user_id: notification.user_id,
      is_read: notification.is_read,
      requestUserId: parsedUserId
    });

    // 사용자 권한 확인
    if (notification.user_id !== parsedUserId) {
      console.error('❌ 권한 없음:', { 
        notificationUserId: notification.user_id, 
        requestUserId: parsedUserId 
      });
      return res.status(403).json({
        success: false,
        error: '이 알림에 대한 권한이 없습니다'
      });
    }

    // 이미 읽음 상태인 경우
    if (notification.is_read) {
      console.log('ℹ️ 이미 읽음 상태인 알림:', parsedNotificationId);
      return res.json({
        success: true,
        message: '이미 읽음으로 처리된 알림입니다'
      });
    }

    // 읽음 상태로 업데이트
    const updateResult = await pool.query(`
      UPDATE notifications
      SET is_read = true, read_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2
      RETURNING id, is_read, read_at
    `, [parsedNotificationId, parsedUserId]);

    if (updateResult.rows.length === 0) {
      console.error('❌ 업데이트 실패 - 조건에 맞는 알림 없음');
      return res.status(404).json({
        success: false,
        error: '알림 업데이트에 실패했습니다'
      });
    }

    const updatedNotification = updateResult.rows[0];
    console.log('✅ 알림 읽음 처리 성공:', {
      id: updatedNotification.id,
      is_read: updatedNotification.is_read,
      read_at: updatedNotification.read_at
    });

    res.json({
      success: true,
      message: '알림을 읽음으로 처리했습니다',
      notification: {
        id: updatedNotification.id,
        isRead: updatedNotification.is_read,
        readAt: updatedNotification.read_at
      }
    });

  } catch (error) {
    console.error('❌ 알림 읽음 처리 실패:', error);
    res.status(500).json({
      success: false,
      error: '알림 읽음 처리 실패: ' + error.message
    });
  }
});

// 📢 모든 알림 읽음 처리
router.put('/mark-all-read', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: '사용자 ID가 필요합니다'
      });
    }

    await pool.query(`
      UPDATE notifications
      SET is_read = true, read_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND is_read = false
    `, [parseInt(userId)]);

    res.json({
      success: true,
      message: '모든 알림을 읽음으로 처리했습니다'
    });

  } catch (error) {
    console.error('❌ 모든 알림 읽음 처리 실패:', error);
    res.status(500).json({
      success: false,
      error: '모든 알림 읽음 처리 실패'
    });
  }
});

// 📋 주문 처리 관련 알림 생성
router.post('/create-order-notification', async (req, res) => {
  try {
    const { 
      userId, 
      type = 'order', 
      title, 
      message, 
      orderId, 
      storeId, 
      ticketId 
    } = req.body;

    if (!userId || !title || !message) {
      return res.status(400).json({
        success: false,
        error: '필수 파라미터가 누락되었습니다'
      });
    }

    const metadata = {
      order_id: orderId,
      store_id: storeId,
      ticket_id: ticketId,
      created_source: 'processing_order'
    };

    const result = await pool.query(`
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        metadata,
        sent_source
      ) VALUES ($1, $2, $3, $4, $5, 'system')
      RETURNING id, created_at
    `, [
      parseInt(userId),
      type,
      title,
      message,
      JSON.stringify(metadata)
    ]);

    const notification = result.rows[0];

    console.log(`📢 주문 처리 알림 생성: 사용자 ${userId}, 알림 ${notification.id}`);

    res.json({
      success: true,
      notification: {
        id: notification.id,
        createdAt: notification.created_at
      }
    });

  } catch (error) {
    console.error('❌ 주문 처리 알림 생성 실패:', error);
    res.status(500).json({
      success: false,
      error: '알림 생성 실패: ' + error.message
    });
  }
});

// 📋 티켓별 알림 조회
router.get('/ticket/:ticketId', async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: '사용자 ID가 필요합니다'
      });
    }

    const result = await pool.query(`
      SELECT 
        id,
        type,
        title,
        message,
        metadata,
        created_at,
        is_read,
        sent_source
      FROM notifications
      WHERE user_id = $1 
        AND metadata->>'ticket_id' = $2
      ORDER BY created_at DESC
    `, [parseInt(userId), ticketId]);

    const notifications = result.rows.map(notification => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      metadata: notification.metadata,
      createdAt: new Date(notification.created_at),
      isRead: notification.is_read,
      sentSource: notification.sent_source
    }));

    res.json({
      success: true,
      notifications: notifications,
      count: notifications.length
    });

  } catch (error) {
    console.error('❌ 티켓별 알림 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '티켓별 알림 조회 실패'
    });
  }
});

// 📋 주문별 알림 조회
router.get('/order/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: '사용자 ID가 필요합니다'
      });
    }

    const result = await pool.query(`
      SELECT 
        id,
        type,
        title,
        message,
        metadata,
        created_at,
        is_read,
        sent_source
      FROM notifications
      WHERE user_id = $1 
        AND metadata->>'order_id' = $2
      ORDER BY created_at DESC
    `, [parseInt(userId), orderId]);

    const notifications = result.rows.map(notification => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      metadata: notification.metadata,
      createdAt: new Date(notification.created_at),
      isRead: notification.is_read,
      sentSource: notification.sent_source
    }));

    res.json({
      success: true,
      notifications: notifications,
      count: notifications.length
    });

  } catch (error) {
    console.error('❌ 주문별 알림 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '주문별 알림 조회 실패'
    });
  }
});

// 📋 일괄 알림 읽음 처리 (주문/티켓별)
router.put('/mark-read-by-order', async (req, res) => {
  try {
    const { userId, orderId, ticketId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: '사용자 ID가 필요합니다'
      });
    }

    let whereCondition = 'user_id = $1 AND is_read = false';
    const queryParams = [parseInt(userId)];

    if (orderId) {
      whereCondition += ` AND metadata->>'order_id' = $2`;
      queryParams.push(orderId);
    }

    if (ticketId) {
      const paramIndex = queryParams.length + 1;
      whereCondition += ` AND metadata->>'ticket_id' = $${paramIndex}`;
      queryParams.push(ticketId);
    }

    const updateResult = await pool.query(`
      UPDATE notifications
      SET is_read = true, read_at = CURRENT_TIMESTAMP
      WHERE ${whereCondition}
      RETURNING id
    `, queryParams);

    console.log(`📢 일괄 알림 읽음 처리: ${updateResult.rows.length}개 알림 처리`);

    res.json({
      success: true,
      message: `${updateResult.rows.length}개의 알림을 읽음으로 처리했습니다`,
      updatedCount: updateResult.rows.length
    });

  } catch (error) {
    console.error('❌ 일괄 알림 읽음 처리 실패:', error);
    res.status(500).json({
      success: false,
      error: '일괄 알림 읽음 처리 실패'
    });
  }
});

// 📋 결제 완료 알림 생성 (토스 결제 전용)
router.post('/create-payment-notification', async (req, res) => {
  try {
    const { 
      userId, 
      orderId, 
      ticketId,
      storeId, 
      storeName,
      tableNumber,
      paymentId,
      paymentKey,
      amount,
      type = 'payment' 
    } = req.body;

    if (!userId || !orderId || !storeId) {
      return res.status(400).json({
        success: false,
        error: '필수 파라미터가 누락되었습니다 (userId, orderId, storeId 필요)'
      });
    }

    const metadata = {
      order_id: orderId,
      ticket_id: ticketId,
      store_id: storeId,
      store_name: storeName,
      table_number: tableNumber,
      payment_id: paymentId,
      payment_key: paymentKey,
      amount: amount,
      created_source: 'toss_payment_completion',
      notification_type: 'payment_completed'
    };

    const result = await pool.query(`
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        metadata,
        sent_source
      ) VALUES ($1, $2, $3, $4, $5, 'TLL')
      RETURNING id, created_at
    `, [
      parseInt(userId),
      type,
      '결제가 완료되었습니다',
      `${storeName || '매장'}에서 ${amount ? `${amount.toLocaleString()}원` : ''} 결제가 완료되었습니다. 테이블 ${tableNumber}`,
      JSON.stringify(metadata)
    ]);

    const notification = result.rows[0];

    console.log(`📢 결제 완료 알림 생성: 사용자 ${userId}, 주문 ${orderId}, 알림 ${notification.id}`);

    res.json({
      success: true,
      notification: {
        id: notification.id,
        createdAt: notification.created_at,
        metadata: metadata
      }
    });

  } catch (error) {
    console.error('❌ 결제 완료 알림 생성 실패:', error);
    res.status(500).json({
      success: false,
      error: '결제 완료 알림 생성 실패: ' + error.message
    });
  }
});

module.exports = router;