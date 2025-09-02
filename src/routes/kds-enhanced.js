
const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { storeAuth } = require('../mw/auth');
const sse = require('../services/sse');

// 입력 검증 헬퍼
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

const validateEnum = (value, allowedValues, fieldName) => {
  if (!allowedValues.includes(value)) {
    const error = new Error(`${fieldName}의 값이 유효하지 않습니다. 허용된 값: ${allowedValues.join(', ')}`);
    error.code = 'INVALID_ENUM_VALUE';
    error.details = { field: fieldName, value, allowedValues };
    throw error;
  }
};

// KDS 실시간 스트림 (향상된 버전)
router.get('/stream', storeAuth, (req, res) => {
  try {
    const storeId = req.storeId;
    const { stations, priority } = req.query;

    const topic = `store:${storeId}`;
    
    if (!sse.add(topic, res)) {
      return;
    }

    // 연결 확인 메시지
    res.write(`data: ${JSON.stringify({
      type: 'connected',
      storeId,
      stations: stations?.split(',') || null,
      priority: priority || 'all',
      timestamp: new Date().toISOString()
    })}\n\n`);

    // 연결 종료 시 정리
    res.on('close', () => {
      sse.remove(topic, res);
      console.log(`🔌 Enhanced KDS SSE 연결 종료: store ${storeId}`);
    });

    console.log(`🔌 Enhanced KDS SSE 연결: store ${storeId}, stations: ${stations || 'all'}`);

  } catch (error) {
    console.error('❌ Enhanced KDS SSE 연결 에러:', error);
    res.status(400).json({
      error: {
        code: 'INVALID_STREAM_REQUEST',
        message: error.message || 'SSE 연결 요청 처리 중 에러가 발생했습니다.'
      }
    });
  }
});

// KDS 데이터 조회 (세분화된 필터링)
router.get('/lines', storeAuth, async (req, res) => {
  try {
    const storeId = req.storeId;
    const { since, status, station, priority, limit = 100 } = req.query;

    let whereClause = 'c.store_id = $1';
    let params = [storeId];
    let paramIndex = 2;

    // 시간 필터
    if (since) {
      whereClause += ` AND ol.updated_at >= $${paramIndex}`;
      params.push(since);
      paramIndex++;
    }

    // 상태 필터 (다중 선택 지원)
    if (status) {
      const statusList = status.split(',').map(s => s.trim());
      whereClause += ` AND ol.status = ANY($${paramIndex})`;
      params.push(statusList);
      paramIndex++;
    }

    // 조리 스테이션 필터
    if (station) {
      const stationList = station.split(',').map(s => s.trim());
      whereClause += ` AND ol.cook_station = ANY($${paramIndex})`;
      params.push(stationList);
      paramIndex++;
    }

    // 우선순위 필터
    if (priority && priority !== 'all') {
      whereClause += ` AND ol.priority >= $${paramIndex}`;
      params.push(parseInt(priority));
      paramIndex++;
    }

    const result = await pool.query(`
      SELECT
        ol.id as line_id,
        ol.menu_name,
        ol.quantity,
        ol.unit_price,
        ol.status,
        ol.cook_station,
        ol.priority,
        ol.estimated_time,
        ol.notes,
        ol.started_at,
        ol.ready_at,
        ol.served_at,
        ol.created_at,
        ol.updated_at,
        c.table_number,
        c.customer_name,
        o.id as order_id,
        o.order_number,
        o.source,
        o.total_amount as order_total,
        -- 조리 시간 계산
        CASE 
          WHEN ol.status = 'cooking' AND ol.started_at IS NOT NULL 
          THEN EXTRACT(epoch FROM (NOW() - ol.started_at))::INTEGER
          WHEN ol.status IN ('ready', 'served') AND ol.started_at IS NOT NULL AND ol.ready_at IS NOT NULL
          THEN EXTRACT(epoch FROM (ol.ready_at - ol.started_at))::INTEGER
          ELSE NULL
        END as cooking_duration,
        -- 대기 시간 계산
        EXTRACT(epoch FROM (NOW() - ol.created_at))::INTEGER as wait_duration
      FROM order_lines ol
      JOIN orders o ON ol.order_id = o.id
      JOIN checks c ON o.check_id = c.id
      WHERE ${whereClause}
      ORDER BY 
        ol.priority DESC,
        ol.created_at ASC
      LIMIT $${paramIndex}
    `, [...params, parseInt(limit)]);

    // 스테이션별 통계
    const statsResult = await pool.query(`
      SELECT 
        ol.cook_station,
        ol.status,
        COUNT(*) as count,
        AVG(EXTRACT(epoch FROM (NOW() - ol.created_at))) as avg_wait_time
      FROM order_lines ol
      JOIN orders o ON ol.order_id = o.id
      JOIN checks c ON o.check_id = c.id
      WHERE c.store_id = $1 AND ol.status IN ('queued', 'cooking', 'ready')
      GROUP BY ol.cook_station, ol.status
    `, [storeId]);

    res.json({
      success: true,
      lines: result.rows,
      count: result.rows.length,
      statistics: statsResult.rows,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Enhanced KDS 데이터 조회 실패:', error);
    res.status(500).json({
      error: {
        code: 'KDS_DATA_FETCH_FAILED',
        message: 'KDS 데이터를 가져오는 데 실패했습니다.',
        details: error.message
      }
    });
  }
});

// 라인 상태 업데이트 (향상된 버전)
router.patch('/lines/:id', storeAuth, async (req, res) => {
  const client = await pool.connect();

  try {
    const lineId = parseInt(req.params.id);
    const { status, cook_station, estimated_time, notes, operator = 'KDS' } = req.body;

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
      SELECT ol.status, ol.cook_station, ol.order_id, c.store_id, ol.started_at
      FROM order_lines ol
      JOIN orders o ON ol.order_id = o.id
      JOIN checks c ON o.check_id = c.id
      WHERE ol.id = $1
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

    const { 
      status: currentStatus, 
      cook_station: currentStation,
      order_id: orderId, 
      store_id: storeId,
      started_at: currentStartedAt
    } = currentResult.rows[0];

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

    // 비즈니스 규칙 검증
    if (currentStatus === 'served' && status === 'cancelled') {
      await client.query('ROLLBACK');
      return res.status(409).json({
        error: {
          code: 'CANNOT_CANCEL_SERVED',
          message: '서빙 완료된 항목은 취소할 수 없습니다.'
        }
      });
    }

    // 타임스탬프 설정
    let updateFields = ['status = $1', 'updated_at = CURRENT_TIMESTAMP'];
    let updateParams = [status];
    let paramIndex = 2;

    // 조리 시작 시간 설정
    if (status === 'cooking' && currentStatus !== 'cooking') {
      updateFields.push(`started_at = CURRENT_TIMESTAMP`);
    }

    // 조리 완료 시간 설정
    if (status === 'ready' && currentStatus !== 'ready') {
      updateFields.push(`ready_at = CURRENT_TIMESTAMP`);
    }

    // 서빙 완료 시간 설정
    if (status === 'served' && currentStatus !== 'served') {
      updateFields.push(`served_at = CURRENT_TIMESTAMP`);
    }

    // 조리 스테이션 업데이트
    if (cook_station && cook_station !== currentStation) {
      updateFields.push(`cook_station = $${paramIndex}`);
      updateParams.push(cook_station);
      paramIndex++;
    }

    // 예상 조리 시간 업데이트
    if (estimated_time !== undefined) {
      updateFields.push(`estimated_time = $${paramIndex}`);
      updateParams.push(estimated_time);
      paramIndex++;
    }

    // 메모 업데이트
    if (notes !== undefined) {
      updateFields.push(`notes = $${paramIndex}`);
      updateParams.push(notes);
      paramIndex++;
    }

    // 상태 업데이트
    const updateResult = await client.query(`
      UPDATE order_lines
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, [...updateParams, lineId]);

    await client.query('COMMIT');

    console.log(`🍳 Enhanced KDS 라인 상태 변경: ${lineId} ${currentStatus} → ${status}`);

    // SSE 브로드캐스트
    const topic = `store:${storeId}`;
    sse.broadcast(topic, {
      type: 'line_status_update',
      data: {
        line_id: lineId,
        old_status: currentStatus,
        new_status: status,
        cook_station: cook_station || currentStation,
        operator,
        updated_line: updateResult.rows[0]
      },
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      line_id: lineId,
      status: status,
      previous_status: currentStatus,
      cook_station: cook_station || currentStation,
      updated_at: updateResult.rows[0].updated_at,
      cooking_duration: updateResult.rows[0].ready_at && updateResult.rows[0].started_at ?
        Math.floor((new Date(updateResult.rows[0].ready_at) - new Date(updateResult.rows[0].started_at)) / 1000) : null
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
      console.error('❌ Enhanced KDS 라인 상태 업데이트 실패:', error);
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

// 배치 상태 업데이트
router.patch('/lines/batch', storeAuth, async (req, res) => {
  const client = await pool.connect();

  try {
    const { line_ids, status, cook_station, operator = 'KDS' } = req.body;

    validateRequired(req.body, ['line_ids', 'status']);
    validateEnum(status, ['queued', 'cooking', 'ready', 'served', 'hold', 'cancelled'], 'status');

    if (!Array.isArray(line_ids) || line_ids.length === 0) {
      return res.status(400).json({
        error: {
          code: 'INVALID_LINE_IDS',
          message: '유효한 라인 ID 배열이 필요합니다.'
        }
      });
    }

    await client.query('BEGIN');

    // 권한 확인
    const authResult = await client.query(`
      SELECT ol.id, c.store_id
      FROM order_lines ol
      JOIN orders o ON ol.order_id = o.id
      JOIN checks c ON o.check_id = c.id
      WHERE ol.id = ANY($1)
    `, [line_ids]);

    const unauthorizedLines = authResult.rows.filter(row => row.store_id !== req.storeId);
    if (unauthorizedLines.length > 0) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        error: {
          code: 'ACCESS_DENIED',
          message: '일부 라인에 접근할 권한이 없습니다.'
        }
      });
    }

    // 배치 업데이트
    let updateFields = ['status = $1', 'updated_at = CURRENT_TIMESTAMP'];
    let updateParams = [status];
    let paramIndex = 2;

    if (status === 'cooking') {
      updateFields.push(`started_at = CASE WHEN status != 'cooking' THEN CURRENT_TIMESTAMP ELSE started_at END`);
    }
    
    if (status === 'ready') {
      updateFields.push(`ready_at = CASE WHEN status != 'ready' THEN CURRENT_TIMESTAMP ELSE ready_at END`);
    }
    
    if (status === 'served') {
      updateFields.push(`served_at = CASE WHEN status != 'served' THEN CURRENT_TIMESTAMP ELSE served_at END`);
    }

    if (cook_station) {
      updateFields.push(`cook_station = $${paramIndex}`);
      updateParams.push(cook_station);
      paramIndex++;
    }

    const result = await client.query(`
      UPDATE order_lines
      SET ${updateFields.join(', ')}
      WHERE id = ANY($${paramIndex})
      RETURNING id, status, cook_station, updated_at
    `, [...updateParams, line_ids]);

    await client.query('COMMIT');

    console.log(`🍳 Enhanced KDS 배치 상태 변경: ${line_ids.length}개 라인 → ${status}`);

    // SSE 브로드캐스트
    const topic = `store:${req.storeId}`;
    sse.broadcast(topic, {
      type: 'batch_status_update',
      data: {
        line_ids,
        new_status: status,
        cook_station,
        operator,
        updated_lines: result.rows
      },
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      updated_count: result.rows.length,
      status: status,
      cook_station,
      updated_lines: result.rows
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Enhanced KDS 배치 업데이트 실패:', error);
    res.status(500).json({
      error: {
        code: 'BATCH_UPDATE_FAILED',
        message: '배치 상태 업데이트에 실패했습니다.',
        details: error.message
      }
    });
  } finally {
    client.release();
  }
});

// KDS 통계 조회
router.get('/statistics', storeAuth, async (req, res) => {
  try {
    const storeId = req.storeId;
    const { date = new Date().toISOString().split('T')[0] } = req.query;

    // 일일 통계
    const dailyStats = await pool.query(`
      SELECT 
        COUNT(*) as total_lines,
        COUNT(CASE WHEN ol.status = 'served' THEN 1 END) as completed_lines,
        COUNT(CASE WHEN ol.status = 'cancelled' THEN 1 END) as cancelled_lines,
        AVG(CASE 
          WHEN ol.ready_at IS NOT NULL AND ol.started_at IS NOT NULL 
          THEN EXTRACT(epoch FROM (ol.ready_at - ol.started_at))
        END) as avg_cooking_time,
        AVG(CASE 
          WHEN ol.served_at IS NOT NULL 
          THEN EXTRACT(epoch FROM (ol.served_at - ol.created_at))
        END) as avg_total_time
      FROM order_lines ol
      JOIN orders o ON ol.order_id = o.id
      JOIN checks c ON o.check_id = c.id
      WHERE c.store_id = $1 AND DATE(ol.created_at) = $2
    `, [storeId, date]);

    // 스테이션별 통계
    const stationStats = await pool.query(`
      SELECT 
        ol.cook_station,
        COUNT(*) as total_items,
        COUNT(CASE WHEN ol.status = 'served' THEN 1 END) as completed_items,
        AVG(CASE 
          WHEN ol.ready_at IS NOT NULL AND ol.started_at IS NOT NULL 
          THEN EXTRACT(epoch FROM (ol.ready_at - ol.started_at))
        END) as avg_cooking_time
      FROM order_lines ol
      JOIN orders o ON ol.order_id = o.id
      JOIN checks c ON o.check_id = c.id
      WHERE c.store_id = $1 AND DATE(ol.created_at) = $2
      GROUP BY ol.cook_station
    `, [storeId, date]);

    res.json({
      success: true,
      date,
      daily_statistics: dailyStats.rows[0],
      station_statistics: stationStats.rows,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ KDS 통계 조회 실패:', error);
    res.status(500).json({
      error: {
        code: 'STATISTICS_FETCH_FAILED',
        message: 'KDS 통계를 가져오는 데 실패했습니다.',
        details: error.message
      }
    });
  }
});

module.exports = router;
