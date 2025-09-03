
const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { storeAuth } = require('../mw/auth');
const sse = require('../services/sse');

// Helper function for input validation
const validateRequired = (body, fields) => {
  for (const field of fields) {
    if (!(field in body) || body[field] === null || body[field] === undefined || body[field] === '') {
      const error = new Error(`필수 값 누락: ${field}`);
      error.code = 'MISSING_REQUIRED_FIELD';
      error.details = { field };
      throw error;
    }
  }
};

// Helper function for enum validation
const validateEnum = (value, allowedValues, fieldName) => {
  if (!allowedValues.includes(value)) {
    const error = new Error(`${fieldName}의 값이 유효하지 않습니다. 허용된 값: ${allowedValues.join(', ')}`);
    error.code = 'INVALID_ENUM_VALUE';
    error.details = { field: fieldName, value, allowedValues };
    throw error;
  }
};

// KDS 실시간 스트림
router.get('/stream', storeAuth, (req, res) => {
  try {
    const storeId = req.storeId;
    const { stations } = req.query;

    if (stations) {
      const stationList = stations.split(',').map(s => s.trim());
      console.log(`[SSE] Store ${storeId} requesting stations: ${stationList.join(', ')}`);
    }

    const topic = `store:${storeId}`;

    if (!sse.add(topic, res)) {
      return;
    }

    // 초기 연결 확인 메시지
    res.write(`data: ${JSON.stringify({
      type: 'connected',
      storeId,
      stations: stations?.split(',') || null,
      timestamp: new Date().toISOString()
    })}\n\n`);

    // 연결 종료 시 정리
    res.on('close', () => {
      sse.remove(topic, res);
      console.log(`🔌 KDS SSE 연결 종료: store ${storeId}`);
    });

    console.log(`🔌 KDS SSE 연결: store ${storeId}, stations: ${stations || 'all'}`);

  } catch (error) {
    console.error('❌ KDS SSE 연결 에러:', error);
    res.status(400).json({
      error: {
        code: 'INVALID_STREAM_REQUEST',
        message: error.message || 'SSE 연결 요청 처리 중 에러가 발생했습니다.'
      }
    });
  }
});

// KDS 데이터 조회 (새 스키마 적용)
router.get('/poll', storeAuth, async (req, res) => {
  try {
    const storeId = req.storeId;
    const { since, status } = req.query;

    let whereClause = 'c.store_id = $1';
    let params = [storeId];
    let paramIndex = 2;

    // 시간 필터
    if (since) {
      whereClause += ` AND oi.updated_at >= $${paramIndex}`;
      params.push(since);
      paramIndex++;
    }

    // 상태 필터
    if (status) {
      const statusList = status.split(',').map(s => s.trim());
      whereClause += ` AND oi.status = ANY($${paramIndex})`;
      params.push(statusList);
      paramIndex++;
    }

    const result = await pool.query(`
      SELECT
        oi.id as line_id,
        oi.menu_name,
        oi.quantity,
        oi.status,
        oi.cook_station,
        oi.cooking_notes as notes,
        oi.updated_at,
        c.table_number,
        c.customer_name,
        o.id as order_id,
        o.source,
        o.order_number,
        oi.started_at,
        oi.ready_at,
        oi.served_at,
        oi.priority,
        oi.estimated_time
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN checks c ON o.check_id = c.id
      WHERE ${whereClause}
      AND oi.status NOT IN ('served', 'cancelled')
      ORDER BY oi.priority DESC, oi.created_at ASC
      LIMIT 100
    `, params);

    res.json({
      success: true,
      lines: result.rows,
      count: result.rows.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ KDS 폴링 실패:', error);
    res.status(500).json({
      error: {
        code: 'KDS_POLLING_FAILED',
        message: 'KDS 데이터를 가져오는 데 실패했습니다.',
        details: error.message
      }
    });
  }
});

// 라인 상태 업데이트 (새 스키마 적용)
router.patch('/lines/:id', storeAuth, async (req, res) => {
  const client = await pool.connect();

  try {
    const lineId = parseInt(req.params.id);
    const { status } = req.body;

    // 입력 검증
    validateRequired(req.body, ['status']);
    validateEnum(status, ['queued', 'cooking', 'ready', 'served', 'hold', 'cancelled'], 'status');

    if (isNaN(lineId) || lineId <= 0) {
      return res.status(400).json({
        error: {
          code: 'INVALID_LINE_ID',
          message: '유효한 라인 ID가 필요합니다.'
        }
      });
    }

    await client.query('BEGIN');

    // 현재 상태 확인
    const currentResult = await client.query(`
      SELECT oi.status, oi.order_id, c.store_id
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN checks c ON o.check_id = c.id
      WHERE oi.id = $1
    `, [lineId]);

    if (currentResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        error: {
          code: 'ORDER_LINE_NOT_FOUND',
          message: '주문 라인을 찾을 수 없습니다.'
        }
      });
    }

    const { status: currentStatus, order_id: orderId, store_id: storeId } = currentResult.rows[0];

    // 매장 권한 확인
    if (storeId !== req.storeId) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        error: {
          code: 'ACCESS_DENIED',
          message: '해당 매장의 주문에 접근할 권한이 없습니다.'
        }
      });
    }

    // 비즈니스 규칙
    if (currentStatus === 'served' && status === 'cancelled') {
      await client.query('ROLLBACK');
      return res.status(409).json({
        error: {
          code: 'CANNOT_CANCEL_SERVED',
          message: '서빙 완료된 항목은 취소할 수 없습니다.'
        }
      });
    }

    // 상태별 타임스탬프 업데이트
    let updateQuery = 'UPDATE order_items SET status = $1, updated_at = CURRENT_TIMESTAMP';
    let updateParams = [status];

    if (status === 'cooking' && currentStatus !== 'cooking') {
      updateQuery += ', started_at = CURRENT_TIMESTAMP';
    } else if (status === 'ready' && currentStatus !== 'ready') {
      updateQuery += ', ready_at = CURRENT_TIMESTAMP';
    } else if (status === 'served' && currentStatus !== 'served') {
      updateQuery += ', served_at = CURRENT_TIMESTAMP';
    }

    updateQuery += ' WHERE id = $2 RETURNING *';
    updateParams.push(lineId);

    const updateResult = await client.query(updateQuery, updateParams);

    await client.query('COMMIT');

    console.log(`🍳 KDS 라인 상태 변경: ${lineId} ${currentStatus} → ${status}`);

    // SSE 브로드캐스트
    const topic = `store:${storeId}`;
    sse.broadcast(topic, {
      type: 'line_status_update',
      data: {
        line_id: lineId,
        old_status: currentStatus,
        new_status: status,
        updated_line: updateResult.rows[0]
      },
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      line_id: lineId,
      status: status,
      previous_status: currentStatus,
      updated_at: updateResult.rows[0].updated_at
    });

  } catch (error) {
    await client.query('ROLLBACK');

    if (error.code === 'MISSING_REQUIRED_FIELD' || error.code === 'INVALID_ENUM_VALUE') {
      res.status(400).json({
        error: {
          code: error.code,
          message: error.message,
          details: error.details
        }
      });
    } else {
      console.error('❌ KDS 라인 상태 업데이트 실패:', error);
      res.status(500).json({
        error: {
          code: 'LINE_STATUS_UPDATE_FAILED',
          message: '라인 상태 업데이트에 실패했습니다.',
          details: error.message
        }
      });
    }
  } finally {
    client.release();
  }
});

// KDS 주문 변경사항 알림
router.post('/order-changed', async (req, res) => {
  try {
    const { storeId, tableNumber, changeType } = req.body;

    console.log(`📡 KDS 변경사항 알림: 매장 ${storeId}, 테이블 ${tableNumber}, 타입: ${changeType}`);

    // SSE를 통한 실시간 알림
    const topic = `store:${storeId}`;
    sse.broadcast(topic, {
      type: 'order_changed',
      data: {
        storeId,
        tableNumber,
        changeType
      },
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: 'KDS에 변경사항이 전송되었습니다'
    });

  } catch (error) {
    console.error('❌ KDS 변경사항 알림 실패:', error);
    res.status(500).json({
      success: false,
      error: 'KDS 변경사항 알림 실패'
    });
  }
});

// KDS 전체 주문 목록 조회
router.get('/orders', storeAuth, async (req, res) => {
  try {
    const storeId = req.storeId;
    const { status, limit = 50 } = req.query;

    let whereClause = 'c.store_id = $1';
    let params = [storeId];
    let paramIndex = 2;

    if (status) {
      whereClause += ` AND o.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    const result = await pool.query(`
      SELECT 
        o.id as order_id,
        o.order_number,
        o.status as order_status,
        o.total_amount,
        c.table_number,
        c.customer_name,
        o.created_at,
        o.updated_at,
        COUNT(oi.id) as total_items,
        COUNT(CASE WHEN oi.status = 'served' THEN 1 END) as served_items,
        COUNT(CASE WHEN oi.status = 'ready' THEN 1 END) as ready_items,
        COUNT(CASE WHEN oi.status = 'cooking' THEN 1 END) as cooking_items,
        COUNT(CASE WHEN oi.status = 'queued' THEN 1 END) as queued_items
      FROM orders o
      JOIN checks c ON o.check_id = c.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE ${whereClause}
      GROUP BY o.id, o.order_number, o.status, o.total_amount, c.table_number, c.customer_name, o.created_at, o.updated_at
      ORDER BY o.created_at DESC
      LIMIT $${paramIndex}
    `, [...params, parseInt(limit)]);

    res.json({
      success: true,
      orders: result.rows,
      count: result.rows.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ KDS 주문 목록 조회 실패:', error);
    res.status(500).json({
      error: {
        code: 'KDS_ORDERS_FETCH_FAILED',
        message: 'KDS 주문 목록을 가져오는 데 실패했습니다.',
        details: error.message
      }
    });
  }
});

module.exports = router;
