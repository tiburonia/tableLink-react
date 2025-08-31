const express = require('express');
const router = express.Router();
const { query } = require('../db/pool');
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
// [GET] /stream?stations=FRY,GRILL
router.get('/stream', storeAuth, (req, res) => {
  try {
    const storeId = req.storeId; // storeAuth 미들웨어에서 설정
    const { stations } = req.query;

    // TODO: 스테이션 필터링은 메시지 레벨에서 처리 (현재는 store 단위로만 필터링)
    if (stations) {
      const stationList = stations.split(',').map(s => s.trim());
      // 향후 스테이션별 세분화된 필터링 구현 예정
      console.log(`[SSE] Store ${storeId} requesting stations: ${stationList.join(', ')}`);
    }

    const topic = `store:${storeId}`;

    // SSE 연결 수 제한 및 타임아웃/하트비트 로직은 sse.js 서비스에서 관리
    if (!sse.add(topic, res)) {
      // SSE 서비스에서 이미 클라이언트에게 에러 응답을 보냈을 경우, 여기서 추가 응답 없이 반환
      return;
    }

    // 초기 연결 확인 메시지
    res.write(`data: ${JSON.stringify({
      type: 'connected',
      storeId,
      stations: stations?.split(',') || null,
      timestamp: new Date().toISOString()
    })}\n\n`);

    // 하트비트 (20초 간격) - sse.js의 Heartbeat 로직으로 대체될 예정
    // const heartbeat = setInterval(() => {
    //   try {
    //     res.write(`data: ${JSON.stringify({
    //       type: 'heartbeat',
    //       timestamp: new Date().toISOString()
    //     })}\n\n`);
    //   } catch (error) {
    //     console.error(`[SSE] Heartbeat error for store ${storeId}:`, error.message);
    //     clearInterval(heartbeat);
    //     sse.remove(topic, res); // 연결 종료 처리
    //   }
    // }, 20000);

    // 연결 종료 시 정리
    res.on('close', () => {
      // clearInterval(heartbeat); // Heartbeat Interval 제거
      sse.remove(topic, res);
      console.log(`🔌 KDS SSE 연결 종료: store ${storeId}`);
    });

    console.log(`🔌 KDS SSE 연결: store ${storeId}, stations: ${stations || 'all'}`);

  } catch (error) {
    // SSE 서비스 레벨의 에러 처리 (e.g., SSE 서비스 내부에서 연결 수 초과 등)
    if (error.code === 'SSE_CONNECTION_LIMIT_EXCEEDED') {
      res.status(429).json({ // Too Many Requests
        error: {
          code: error.code,
          message: error.message
        }
      });
    } else {
      // 기타 예상치 못한 에러
      console.error('❌ KDS SSE 연결 에러:', error);
      res.status(400).json({
        error: {
          code: 'INVALID_STREAM_REQUEST',
          message: error.message || 'SSE 연결 요청 처리 중 에러가 발생했습니다.'
        }
      });
    }
  }
});

// KDS 폴링 엔드포인트
// [GET] /poll?since=<timestamp>&status=<status1,status2>
router.get('/poll', storeAuth, async (req, res) => {
  try {
    const storeId = req.storeId;
    const { since, status } = req.query;

    let whereClause = 'ol.store_id = $1'; // JOIN 후 store_id 접근
    let params = [storeId];
    let paramIndex = 2;

    // 시간 필터 (SQL 인덱스 힌트: ol.updated_at에 인덱스 필요)
    if (since) {
      whereClause += ` AND ol.updated_at >= $${paramIndex}`;
      params.push(since);
      paramIndex++;
    }

    // 상태 필터 (SQL 인덱스 힌트: ol.status에 인덱스 고려)
    if (status) {
      const statusList = status.split(',').map(s => s.trim());
      // TODO: RBAC/JWT 확장 시, 사용자별 접근 가능한 상태 필터링 추가 고려
      whereClause += ` AND ol.status = ANY($${paramIndex})`;
      params.push(statusList);
      paramIndex++;
    }

    // TODO: 빈번 쿼리 (ol.updated_at, ol.store_id, ol.status)에 대한 WHERE 절 인덱스 사용 확인 및 최적화
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
    // 에러 메시지 표준화 적용
    res.status(500).json({
      error: {
        code: 'KDS_POLLING_FAILED',
        message: 'KDS 데이터를 가져오는 데 실패했습니다.',
        details: error.message // 상세 에러 메시지 포함
      }
    });
  }
});

// 라인 상태 업데이트
// [PATCH] /lines/:id
router.patch('/lines/:id', storeAuth, async (req, res) => {
  const client = await pool.connect();

  try {
    const lineId = parseInt(req.params.id);
    const { status } = req.body;

    // 입력 검증 (필수값, 타입, enum)
    validateRequired(req.body, ['status']);
    validateEnum(status, ['queued', 'cooking', 'ready', 'served', 'canceled'], 'status');

    if (isNaN(lineId) || lineId <= 0) {
      return res.status(400).json({
        error: {
          code: 'INVALID_LINE_ID',
          message: '유효한 라인 ID가 필요합니다.'
        }
      });
    }

    await client.query('BEGIN');

    // 현재 상태 확인 (SQL 인덱스 힌트: order_lines(id) 기본키 사용)
    const currentResult = await client.query(`
      SELECT ol.status, ol.order_id, c.store_id
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

    // 비즈니스 규칙: served 이후로는 canceled 불가
    if (currentStatus === 'served' && status === 'canceled') {
      await client.query('ROLLBACK');
      return res.status(409).json({
        error: {
          code: 'CANNOT_CANCEL_SERVED',
          message: '서빙 완료된 항목은 취소할 수 없습니다.'
        }
      });
    }

    // 상태 업데이트 (SQL 인덱스 힌트: order_lines(id) 기본키 사용)
    await client.query(`
      UPDATE order_lines
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, status, updated_at
    `, [status, lineId]);

    // TODO: PG 연동 시 서명검증(HMAC) 로직 추가 (e.g., 외부 API 호출 시)
    // TODO: 메뉴 가격 서버 신뢰 로직 추가 (e.g., 가격 변동 시 재검증)
    // TODO: RBAC/JWT 확장 포인트: 특정 상태 변경에 대한 권한 체크 강화

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
    `, [lineId, status, currentStatus]);

    await client.query('COMMIT');

    console.log(`🍳 KDS 라인 상태 변경: ${lineId} ${currentStatus} → ${status}`);

    res.json({
      success: true,
      line_id: lineId,
      status: status,
      previous_status: currentStatus,
      updated_at: new Date().toISOString() // 실제 업데이트 시간은 DB에서 가져와야 함 (RETURNING 사용 시)
    });

  } catch (error) {
    await client.query('ROLLBACK');

    // 에러 메시지 표준화 적용
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
          details: error.message // 상세 에러 메시지 포함
        }
      });
    }
  } finally {
    client.release();
  }
});

module.exports = router;