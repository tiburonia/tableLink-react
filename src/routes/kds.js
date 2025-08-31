
const express = require('express');
const router = express.Router();
const { query } = require('../db/pool');
const { storeAuth } = require('../mw/auth');
const sse = require('../services/sse');
const { query } = require('../db/pool');

// KDS 실시간 스트림
router.get('/stream', (req, res) => {
  const storeId = parseInt(req.query.store_id);
  
  if (!storeId) {
    return res.status(400).json({
      message: 'store_id 쿼리 매개변수가 필요합니다',
      code: 'MISSING_STORE_ID'
    });
  }
  const { stations } = req.query; // 스테이션 필터 (예: FRY,GRILL)
  
  // SSE 헤더 설정
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  const topic = `store:${storeId}`;
  sse.add(topic, res);

  // 초기 연결 확인 메시지
  res.write(`data: ${JSON.stringify({
    type: 'connected',
    storeId,
    stations: stations?.split(',') || null,
    timestamp: new Date().toISOString()
  })}\n\n`);

  // 하트비트 (20초 간격)
  const heartbeat = setInterval(() => {
    try {
      res.write(`data: ${JSON.stringify({
        type: 'heartbeat',
        timestamp: new Date().toISOString()
      })}\n\n`);
    } catch (error) {
      clearInterval(heartbeat);
    }
  }, 20000);

  // 연결 종료 시 정리
  res.on('close', () => {
    clearInterval(heartbeat);
    console.log(`🔌 KDS SSE 연결 종료: store ${storeId}`);
  });

  console.log(`🔌 KDS SSE 연결: store ${storeId}, stations: ${stations || 'all'}`);
});

// KDS 폴링 엔드포인트
router.get('/poll', storeAuth, async (req, res) => {
  try {
    const storeId = req.storeId;
    const { since, status } = req.query;
    
    let whereClause = 'c.store_id = $1';
    let params = [storeId];
    let paramIndex = 2;

    // 시간 필터
    if (since) {
      whereClause += ` AND ol.updated_at >= $${paramIndex}`;
      params.push(since);
      paramIndex++;
    }

    // 상태 필터
    if (status) {
      const statusList = status.split(',').map(s => s.trim());
      whereClause += ` AND ol.status = ANY($${paramIndex})`;
      params.push(statusList);
      paramIndex++;
    }

    const result = await query(`
      SELECT 
        ol.id as line_id,
        ol.menu_name,
        ol.quantity,
        ol.status,
        ol.cook_station,
        ol.notes,
        ol.updated_at,
        c.table_number,
        c.customer_name,
        o.id as order_id,
        o.source
      FROM order_lines ol
      JOIN orders o ON ol.order_id = o.id
      JOIN checks c ON o.check_id = c.id
      WHERE ${whereClause}
      ORDER BY ol.updated_at DESC
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
      success: false,
      error: 'KDS 폴링 실패'
    });
  }
});

// 라인 상태 업데이트
router.patch('/lines/:id', storeAuth, async (req, res) => {
  try {
    const lineId = req.params.id;
    const { status } = req.body;
    const storeId = req.storeId;

    if (!status || !['queued', 'cooking', 'ready', 'served', 'canceled'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 상태입니다'
      });
    }

    // 현재 라인 상태 확인
    const lineCheck = await query(`
      SELECT ol.id, ol.status, c.store_id
      FROM order_lines ol
      JOIN orders o ON ol.order_id = o.id
      JOIN checks c ON o.check_id = c.id
      WHERE ol.id = $1
    `, [lineId]);

    if (lineCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '라인을 찾을 수 없습니다'
      });
    }

    const line = lineCheck.rows[0];
    
    // 매장 권한 확인
    if (line.store_id !== storeId) {
      return res.status(403).json({
        success: false,
        error: '접근 권한이 없습니다'
      });
    }

    // 비즈니스 규칙: served 이후로는 canceled 불가
    if (line.status === 'served' && status === 'canceled') {
      return res.status(409).json({
        success: false,
        error: '서빙 완료된 항목은 취소할 수 없습니다'
      });
    }

    // 상태 업데이트
    const updateResult = await query(`
      UPDATE order_lines 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [status, lineId]);

    // 이벤트 로그 기록
    await query(`
      INSERT INTO order_events (order_id, event_type, event_data)
      SELECT 
        order_id, 
        CASE 
          WHEN $2 = 'canceled' THEN 'LINE_CANCELED'
          ELSE 'LINE_STATUS_CHANGED'
        END,
        jsonb_build_object(
          'line_id', $1,
          'old_status', $3,
          'new_status', $2,
          'updated_by', 'KDS'
        )
      FROM order_lines 
      WHERE id = $1
    `, [lineId, status, line.status]);

    console.log(`🍳 KDS 라인 상태 변경: ${lineId} ${line.status} → ${status}`);

    res.json({
      success: true,
      line_id: lineId,
      status: status,
      previous_status: line.status,
      updated_at: updateResult.rows[0].updated_at
    });

  } catch (error) {
    console.error('❌ KDS 라인 상태 업데이트 실패:', error);
    res.status(500).json({
      success: false,
      error: '라인 상태 업데이트 실패'
    });
  }
});

module.exports = router;
