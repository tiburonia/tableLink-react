const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// KDS 스테이션별 티켓 조회 (TLL 주문 포함)
router.get('/tickets', async (req, res) => {
  try {
    const { store_id, station_id, status, updated_since } = req.query;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: '매장 ID가 필요합니다'
      });
    }

    console.log(`🎫 KDS 티켓 조회: 매장 ${store_id}, 스테이션 ${station_id}`);

    let query = `
      SELECT 
        t.id as ticket_id,
        t.check_id,
        t.station_id,
        t.course_no,
        t.status as ticket_status,
        t.priority,
        t.source_system,
        t.created_at,
        t.fired_at,
        t.ready_at,
        t.updated_at,
        s.name as station_name,
        s.code as station_code,
        s.is_expo,
        c.table_number,
        c.customer_name,
        c.status as check_status,
        c.source_system as check_source,
        json_agg(
          json_build_object(
            'item_id', ti.id,
            'check_item_id', ti.check_item_id,
            'menu_name', ti.menu_name,
            'quantity', ti.quantity,
            'options', ti.options,
            'kds_status', ti.kds_status,
            'notes', ti.notes,
            'started_at', ti.started_at,
            'done_at', ti.done_at,
            'expo_at', ti.expo_at,
            'served_at', ti.served_at,
            'est_prep_sec', ti.est_prep_sec
          ) ORDER BY ti.id
        ) FILTER (WHERE ti.id IS NOT NULL) as items
      FROM kds_tickets t
      LEFT JOIN kds_stations s ON t.station_id = s.id
      LEFT JOIN checks c ON t.check_id = c.id
      LEFT JOIN kds_ticket_items ti ON t.id = ti.ticket_id AND ti.kds_status != 'CANCELED'
      WHERE t.store_id = $1 AND t.status != 'BUMPED'
    `;

    const params = [store_id];
    let paramIndex = 2;

    if (station_id && station_id !== 'null') {
      query += ` AND t.station_id = $${paramIndex}`;
      params.push(station_id);
      paramIndex++;
    }

    if (status) {
      query += ` AND t.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (updated_since && updated_since !== '0') {
      query += ` AND t.updated_at > $${paramIndex}`;
      params.push(new Date(parseInt(updated_since)));
      paramIndex++;
    }

    query += `
      GROUP BY t.id, s.name, s.code, s.is_expo, c.table_number, c.customer_name, c.status, c.source_system
      ORDER BY t.priority DESC, t.created_at ASC
    `;

    const result = await pool.query(query, params);

    // 빈 티켓도 프레임으로 표시하기 위해 최소 1개는 반환
    const tickets = result.rows;
    
    res.json({
      success: true,
      tickets: tickets,
      timestamp: Date.now(),
      total_count: tickets.length
    });

  } catch (error) {
    console.error('❌ KDS 티켓 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '티켓 조회 실패',
      error: error.message
    });
  }
});

// 스테이션 정보 조회
router.get('/stations', async (req, res) => {
  try {
    const { store_id } = req.query;

    const result = await pool.query(`
      SELECT 
        s.*,
        COUNT(t.id) as active_tickets
      FROM kds_stations s
      LEFT JOIN kds_tickets t ON s.id = t.station_id AND t.status IN ('OPEN', 'IN_PROGRESS')
      WHERE s.store_id = $1 AND s.is_active = true
      GROUP BY s.id
      ORDER BY s.is_expo ASC, s.name ASC
    `, [store_id]);

    res.json({
      success: true,
      stations: result.rows
    });

  } catch (error) {
    console.error('❌ 스테이션 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '스테이션 조회 실패',
      error: error.message
    });
  }
});

// EXPO 화면용 전체 현황
router.get('/expo', async (req, res) => {
  try {
    const { store_id, updated_since } = req.query;

    let query = `
      SELECT 
        ti.id as item_id,
        ti.ticket_id,
        ti.menu_name,
        ti.quantity,
        ti.options,
        ti.kds_status,
        ti.done_at,
        ti.expo_at,
        t.check_id,
        t.priority,
        c.table_number,
        c.customer_name,
        s.name as station_name,
        s.code as station_code
      FROM kds_ticket_items ti
      JOIN kds_tickets t ON ti.ticket_id = t.id
      JOIN kds_stations s ON t.station_id = s.id
      JOIN checks c ON t.check_id = c.id
      WHERE t.store_id = $1 
        AND ti.kds_status IN ('DONE', 'EXPO')
        AND t.status != 'BUMPED'
    `;

    const params = [store_id];

    if (updated_since) {
      query += ` AND ti.updated_at > $2`;
      params.push(new Date(parseInt(updated_since)));
    }

    query += ` ORDER BY ti.done_at ASC`;

    const result = await pool.query(query, params);

    // 체크별로 그룹화
    const checkGroups = {};
    result.rows.forEach(item => {
      if (!checkGroups[item.check_id]) {
        checkGroups[item.check_id] = {
          check_id: item.check_id,
          table_number: item.table_number,
          customer_name: item.customer_name,
          priority: item.priority,
          items: []
        };
      }
      checkGroups[item.check_id].items.push(item);
    });

    res.json({
      success: true,
      expo_items: Object.values(checkGroups),
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('❌ EXPO 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: 'EXPO 조회 실패',
      error: error.message
    });
  }
});

// 아이템 상태 변경
router.patch('/items/:id', async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const itemId = req.params.id;
    const { action, notes } = req.body;

    // 현재 아이템 정보 조회
    const itemResult = await client.query(`
      SELECT ti.*, t.store_id, t.check_id, t.station_id
      FROM kds_ticket_items ti
      JOIN kds_tickets t ON ti.ticket_id = t.id
      WHERE ti.id = $1
    `, [itemId]);

    if (itemResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '아이템을 찾을 수 없습니다'
      });
    }

    const item = itemResult.rows[0];
    let newStatus = item.kds_status;
    let updateFields = {};

    switch (action) {
      case 'start':
        if (item.kds_status === 'PENDING') {
          newStatus = 'COOKING';
          updateFields.started_at = 'NOW()';
        }
        break;

      case 'done':
        if (item.kds_status === 'COOKING') {
          newStatus = 'DONE';
          updateFields.done_at = 'NOW()';
        }
        break;

      case 'expo':
        if (item.kds_status === 'DONE') {
          newStatus = 'EXPO';
          updateFields.expo_at = 'NOW()';
        }
        break;

      case 'served':
        if (['DONE', 'EXPO'].includes(item.kds_status)) {
          newStatus = 'SERVED';
          updateFields.served_at = 'NOW()';
        }
        break;

      case 'hold':
        if (['PENDING', 'COOKING'].includes(item.kds_status)) {
          newStatus = 'HOLD';
        }
        break;

      case 'cancel':
        newStatus = 'CANCELED';
        break;

      default:
        return res.status(400).json({
          success: false,
          message: '유효하지 않은 액션입니다'
        });
    }

    // 아이템 상태 업데이트
    let updateQuery = 'UPDATE kds_ticket_items SET kds_status = $1, updated_at = NOW()';
    let updateParams = [newStatus];
    let paramIndex = 2;

    Object.entries(updateFields).forEach(([field, value]) => {
      updateQuery += `, ${field} = ${value}`;
    });

    if (notes) {
      updateQuery += `, notes = $${paramIndex}`;
      updateParams.push(notes);
      paramIndex++;
    }

    updateQuery += ' WHERE id = $' + paramIndex;
    updateParams.push(itemId);

    await client.query(updateQuery, updateParams);

    // check_items 테이블도 동기화
    await client.query(`
      UPDATE check_items 
      SET kds_status = $1, updated_at = NOW()
      WHERE id = $2
    `, [newStatus, item.check_item_id]);

    // 티켓 상태 업데이트 확인
    if (newStatus === 'DONE') {
      // 티켓 내 모든 아이템이 DONE인지 확인
      const ticketStatus = await client.query(`
        SELECT 
          COUNT(*) as total_items,
          COUNT(CASE WHEN kds_status = 'DONE' THEN 1 END) as done_items
        FROM kds_ticket_items
        WHERE ticket_id = $1 AND kds_status != 'CANCELED'
      `, [item.ticket_id]);

      const { total_items, done_items } = ticketStatus.rows[0];

      if (parseInt(total_items) === parseInt(done_items)) {
        await client.query(`
          UPDATE kds_tickets 
          SET status = 'READY', ready_at = NOW(), updated_at = NOW()
          WHERE id = $1
        `, [item.ticket_id]);
      }
    }

    await client.query('COMMIT');

    // 웹소켓으로 실시간 알림 전송
    try {
      await client.query(`
        SELECT pg_notify('kds_updates', $1)
      `, [JSON.stringify({
        type: 'item_status_change',
        store_id: item.store_id,
        ticket_id: item.ticket_id,
        item_id: itemId,
        old_status: item.kds_status,
        new_status: newStatus,
        timestamp: Date.now()
      })]);
    } catch (notifyError) {
      console.warn('⚠️ KDS 웹소켓 알림 실패:', notifyError.message);
    }

    res.json({
      success: true,
      message: `아이템 상태가 ${newStatus}로 변경되었습니다`,
      item_id: itemId,
      new_status: newStatus
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 아이템 상태 변경 실패:', error);
    res.status(500).json({
      success: false,
      message: '아이템 상태 변경 실패',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// 티켓 상태 변경
router.patch('/tickets/:id', async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const ticketId = req.params.id;
    const { action } = req.body;

    switch (action) {
      case 'start_all':
        await client.query(`
          UPDATE kds_ticket_items 
          SET kds_status = 'COOKING', started_at = NOW(), updated_at = NOW()
          WHERE ticket_id = $1 AND kds_status = 'PENDING'
        `, [ticketId]);

        await client.query(`
          UPDATE kds_tickets 
          SET status = 'IN_PROGRESS', fired_at = NOW(), updated_at = NOW()
          WHERE id = $1
        `, [ticketId]);
        break;

      case 'complete_all':
        await client.query(`
          UPDATE kds_ticket_items 
          SET kds_status = 'DONE', done_at = NOW(), updated_at = NOW()
          WHERE ticket_id = $1 AND kds_status IN ('PENDING', 'COOKING')
        `, [ticketId]);

        await client.query(`
          UPDATE kds_tickets 
          SET status = 'READY', ready_at = NOW(), updated_at = NOW()
          WHERE id = $1
        `, [ticketId]);
        break;

      case 'bump':
        await client.query(`
          UPDATE kds_tickets 
          SET status = 'BUMPED', updated_at = NOW()
          WHERE id = $1
        `, [ticketId]);

        await client.query(`
          UPDATE kds_ticket_items 
          SET kds_status = 'SERVED', served_at = NOW(), updated_at = NOW()
          WHERE ticket_id = $1 AND kds_status IN ('DONE', 'EXPO')
        `, [ticketId]);
        break;

      case 'raise_priority':
        await client.query(`
          UPDATE kds_tickets 
          SET priority = priority + 1, updated_at = NOW()
          WHERE id = $1
        `, [ticketId]);
        break;

      case 'hold_all':
        await client.query(`
          UPDATE kds_ticket_items 
          SET kds_status = 'HOLD', updated_at = NOW()
          WHERE ticket_id = $1 AND kds_status IN ('PENDING', 'COOKING')
        `, [ticketId]);
        break;

      case 'expo_all':
        await client.query(`
          UPDATE kds_ticket_items 
          SET kds_status = 'EXPO', expo_at = NOW(), updated_at = NOW()
          WHERE ticket_id = $1 AND kds_status = 'DONE'
        `, [ticketId]);
        break;

      case 'cancel_all':
        await client.query(`
          UPDATE kds_ticket_items 
          SET kds_status = 'CANCELED', updated_at = NOW()
          WHERE ticket_id = $1 AND kds_status NOT IN ('SERVED', 'CANCELED')
        `, [ticketId]);

        await client.query(`
          UPDATE kds_tickets 
          SET status = 'BUMPED', updated_at = NOW()
          WHERE id = $1
        `, [ticketId]);
        break;

      default:
        return res.status(400).json({
          success: false,
          message: '유효하지 않은 액션입니다'
        });
    }

    await client.query('COMMIT');

    // 현재 티켓 정보 조회 후 웹소켓 알림
    try {
      const ticketInfo = await client.query(`
        SELECT store_id FROM kds_tickets WHERE id = $1
      `, [ticketId]);

      if (ticketInfo.rows.length > 0) {
        await client.query(`
          SELECT pg_notify('kds_updates', $1)
        `, [JSON.stringify({
          type: 'ticket_action',
          store_id: ticketInfo.rows[0].store_id,
          ticket_id: ticketId,
          action: action,
          timestamp: Date.now()
        })]);
      }
    } catch (notifyError) {
      console.warn('⚠️ KDS 웹소켓 알림 실패:', notifyError.message);
    }

    res.json({
      success: true,
      message: `티켓 액션 ${action} 완료`,
      ticket_id: ticketId
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 티켓 상태 변경 실패:', error);
    res.status(500).json({
      success: false,
      message: '티켓 상태 변경 실패',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// SSE 스트림
router.get('/stream/:store_id', (req, res) => {
  const storeId = req.params.store_id;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  // 초기 데이터 전송
  res.write(`data: ${JSON.stringify({
    type: 'connected',
    store_id: storeId,
    timestamp: Date.now()
  })}\n\n`);

  // PostgreSQL LISTEN으로 실시간 업데이트 수신
  const client = pool.connect().then(client => {
    client.query('LISTEN kds_updates');

    client.on('notification', (msg) => {
      try {
        const payload = JSON.parse(msg.payload);
        if (payload.store_id === parseInt(storeId)) {
          res.write(`data: ${JSON.stringify({
            type: 'update',
            ...payload,
            timestamp: Date.now()
          })}\n\n`);
        }
      } catch (error) {
        console.error('❌ SSE 알림 처리 실패:', error);
      }
    });

    return client;
  });

  // 연결 종료 처리
  req.on('close', async () => {
    try {
      const resolvedClient = await client;
      resolvedClient.release();
    } catch (error) {
      console.error('❌ SSE 연결 종료 처리 실패:', error);
    }
  });
});

// 주문 생성 시 KDS 티켓 생성 함수
async function createKDSTicketsForOrder(checkId, storeId, sourceSystem = 'TLL') {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 체크의 아이템들 조회 (category_id 제거)
    const itemsResult = await client.query(`
      SELECT ci.*
      FROM check_items ci
      WHERE ci.check_id = $1 AND ci.status != 'canceled'
    `, [checkId]);

    const items = itemsResult.rows;

    // 스테이션별로 아이템 그룹화
    const stationGroups = {};

    for (const item of items) {
      // 기본 주방 스테이션으로 라우팅 (단순화)
      let stationId = 1;
      let prepSec = 600;

      // 매장별 기본 스테이션 조회
      const defaultStation = await client.query(`
        SELECT id FROM kds_stations 
        WHERE store_id = $1 AND is_expo = false
        ORDER BY id ASC
        LIMIT 1
      `, [storeId]);

      if (defaultStation.rows.length > 0) {
        stationId = defaultStation.rows[0].id;
      }

      if (!stationGroups[stationId]) {
        stationGroups[stationId] = [];
      }

      stationGroups[stationId].push({
        ...item,
        station_id: stationId,
        prep_sec: prepSec
      });
    }

    // 스테이션별 티켓 생성
    for (const [stationId, stationItems] of Object.entries(stationGroups)) {
      // 티켓 생성
      const ticketResult = await client.query(`
        INSERT INTO kds_tickets (store_id, check_id, station_id, source_system, fired_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING id
      `, [storeId, checkId, stationId, sourceSystem]);

      const ticketId = ticketResult.rows[0].id;

      // 티켓 아이템들 생성
      for (const item of stationItems) {
        await client.query(`
          INSERT INTO kds_ticket_items (
            ticket_id, check_item_id, menu_name, quantity, 
            options, est_prep_sec, cook_station
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          ticketId,
          item.id,
          item.menu_name,
          item.quantity,
          item.options || {},
          prepSec,
          stationId
        ]);

        // check_items 테이블 업데이트
        await client.query(`
          UPDATE check_items 
          SET station_id = $1, fired_at = NOW(), kds_status = 'PENDING'
          WHERE id = $2
        `, [stationId, item.id]);
      }
    }

    await client.query('COMMIT');

    // 웹소켓으로 실시간 알림 전송
    try {
      await client.query(`
        SELECT pg_notify('kds_updates', $1)
      `, [JSON.stringify({
        type: 'new_tickets',
        store_id: storeId,
        check_id: checkId,
        ticket_count: Object.keys(stationGroups).length,
        timestamp: Date.now()
      })]);
    } catch (notifyError) {
      console.warn('⚠️ KDS 웹소켓 알림 실패:', notifyError.message);
    }

    return {
      success: true,
      message: 'KDS 티켓이 생성되었습니다',
      ticket_count: Object.keys(stationGroups).length
    };

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// KDS 티켓 생성 API 엔드포인트
router.post('/tickets/create', async (req, res) => {
  try {
    const { check_id, store_id, source_system } = req.body;

    const result = await createKDSTicketsForOrder(check_id, store_id, source_system);

    res.json(result);

  } catch (error) {
    console.error('❌ KDS 티켓 생성 실패:', error);
    res.status(500).json({
      success: false,
      message: 'KDS 티켓 생성 실패',
      error: error.message
    });
  }
});

module.exports = router;
module.exports.createKDSTicketsForOrder = createKDSTicketsForOrder;