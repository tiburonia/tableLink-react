
const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// 📢 사용자 알림 목록 조회
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
        created_at,
        is_read
      FROM notifications
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `, [...queryParams, parseInt(limit), parseInt(offset)]);

    const notifications = result.rows.map(notification => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
     // relatedOrderId: notification.related_order_id,
     // relatedStoreId: notification.related_store_id,
      createdAt: new Date(notification.created_at),
      isRead: notification.is_read,
     // readAt: notification.read_at
    }));

    res.json({
      success: true,
      notifications: notifications,
      count: notifications.length
    });

  } catch (error) {
    console.error('❌ 알림 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '알림을 조회할 수 없습니다'
    });
  }
});

// 📢 개별 알림 읽음 처리
router.put('/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: '사용자 ID가 필요합니다'
      });
    }

    const result = await pool.query(`
      UPDATE notifications
      SET is_read = true, read_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `, [parseInt(notificationId), parseInt(userId)]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '알림을 찾을 수 없습니다'
      });
    }

    res.json({
      success: true,
      message: '알림을 읽음으로 처리했습니다'
    });

  } catch (error) {
    console.error('❌ 알림 읽음 처리 실패:', error);
    res.status(500).json({
      success: false,
      error: '알림 읽음 처리 실패'
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

module.exports = router;
