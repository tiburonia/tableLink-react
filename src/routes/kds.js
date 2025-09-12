const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// KDS 아이템 조회 (스테이션별)
router.get('/items', async (req, res) => {
  try {
    const { store_id, station_id, status } = req.query;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: '매장 ID가 필요합니다'
      });
    }

    console.log(`🎫 KDS 아이템 조회: 매장 ${store_id}, 스테이션 ${station_id}`);

    let query = `
      SELECT 
        ci.id,
        ci.check_id,
        ci.menu_name,
        ci.quantity,
        ci.unit_price,
        ci.options,
        ci.kds_status,
        ci.station_id,
        ci.source_system,
        ci.fired_at,
        ci.started_at,
        ci.done_at,
        ci.canceled_at,
        ci.cancel_reason,
        ci.course_no,
        ci.created_at,
        c.table_number,
        c.customer_name,
        c.user_id,
        c.guest_phone,
        c.source_system as check_source,
        CASE 
          WHEN ci.source_system = 'TLL' THEN c.customer_name
          ELSE COALESCE(c.customer_name, '고객')
        END as display_name,
        EXTRACT(EPOCH FROM (NOW() - ci.fired_at))::INTEGER as elapsed_seconds
      FROM check_items ci
      JOIN checks c ON ci.check_id = c.id
      WHERE c.store_id = $1 
        AND ci.kds_status IN ('PENDING', 'COOKING', 'DONE')
        AND ci.status != 'canceled'
    `;

    const params = [store_id];
    let paramIndex = 2;

    if (station_id && station_id !== 'all') {
      query += ` AND ci.station_id = $${paramIndex}`;
      params.push(station_id);
      paramIndex++;
    }

    if (status) {
      query += ` AND ci.kds_status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += `
      ORDER BY 
        ci.course_no ASC,
        CASE ci.kds_status 
          WHEN 'COOKING' THEN 1
          WHEN 'PENDING' THEN 2  
          WHEN 'DONE' THEN 3
        END,
        ci.fired_at ASC
    `;

    const result = await pool.query(query, params);

    // 체크별로 그룹화
    const checkGroups = {};
    result.rows.forEach(item => {
      const checkId = item.check_id;
      if (!checkGroups[checkId]) {
        checkGroups[checkId] = {
          check_id: checkId,
          table_number: item.table_number,
          customer_name: item.display_name,
          source_system: item.check_source,
          items: []
        };
      }
      checkGroups[checkId].items.push(item);
    });

    res.json({
      success: true,
      checks: Object.values(checkGroups),
      total_items: result.rows.length,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('❌ KDS 아이템 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: 'KDS 아이템 조회 실패',
      error: error.message
    });
  }
});

// 스테이션 정보 조회
router.get('/stations', async (req, res) => {
  try {
    const { store_id } = req.query;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: '매장 ID가 필요합니다'
      });
    }

    // 기본 스테이션 정보와 활성 아이템 수 조회
    const result = await pool.query(`
      SELECT 
        s.id,
        s.name,
        s.code,
        s.is_expo,
        COUNT(ci.id) as active_items
      FROM kds_stations s
      LEFT JOIN check_items ci ON s.id = ci.station_id 
        AND ci.kds_status IN ('PENDING', 'COOKING', 'DONE')
        AND ci.status != 'canceled'
      WHERE s.store_id = $1 AND s.is_active = true
      GROUP BY s.id, s.name, s.code, s.is_expo
      ORDER BY s.is_expo ASC, s.name ASC
    `, [store_id]);

    if (result.rows.length === 0) {
      // 기본 스테이션이 없으면 생성
      const defaultStations = [
        { name: '주방', code: 'KITCHEN', is_expo: false },
        { name: '엑스포', code: 'EXPO', is_expo: true }
      ];

      const stations = [];
      for (const station of defaultStations) {
        const insertResult = await pool.query(`
          INSERT INTO kds_stations (store_id, name, code, is_expo)
          VALUES ($1, $2, $3, $4)
          RETURNING id, name, code, is_expo
        `, [store_id, station.name, station.code, station.is_expo]);

        stations.push({
          ...insertResult.rows[0],
          active_items: 0
        });
      }

      res.json({
        success: true,
        stations: stations,
        created: true
      });
    } else {
      res.json({
        success: true,
        stations: result.rows
      });
    }

  } catch (error) {
    console.error('❌ 스테이션 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '스테이션 조회 실패',
      error: error.message
    });
  }
});

// 티켓 상태 변경 
router.patch('/tickets/:id/status', async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const ticketId = req.params.id;
    const { action, actor_id, actor_type } = req.body;

    // 현재 티켓 정보 조회
    const ticketResult = await client.query(`
      SELECT ot.*, o.store_id, o.source_system
      FROM order_tickets ot
      JOIN orders o ON ot.order_id = o.id
      WHERE ot.id = $1
    `, [ticketId]);

    if (ticketResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '티켓을 찾을 수 없습니다'
      });
    }

    const ticket = ticketResult.rows[0];
    let newStatus = ticket.status;
    let updateFields = {};
    let eventType = null;

    // 상태 변경 로직
    switch (action) {
      case 'start':
        if (ticket.status === 'PENDING') {
          newStatus = 'COOKING';
          updateFields.started_at = 'NOW()';
          eventType = 'TICKET_STARTED';
        }
        break;

      case 'done':
        if (ticket.status === 'COOKING') {
          newStatus = 'DONE';
          updateFields.completed_at = 'NOW()';
          eventType = 'TICKET_DONE';
        }
        break;

      case 'serve':
        if (ticket.status === 'DONE') {
          newStatus = 'SERVED';
          updateFields.served_at = 'NOW()';
          eventType = 'TICKET_SERVED';
        }
        break;

      case 'cancel':
        if (['PENDING', 'COOKING'].includes(ticket.status)) {
          newStatus = 'CANCELED';
          updateFields.canceled_at = 'NOW()';
          updateFields.cancel_reason = req.body.reason || '주방에서 취소';
          eventType = 'TICKET_CANCELED';
        }
        break;

      default:
        return res.status(400).json({
          success: false,
          message: '유효하지 않은 액션입니다'
        });
    }

    if (newStatus === ticket.status) {
      return res.status(400).json({
        success: false,
        message: '이미 해당 상태입니다'
      });
    }

    // 티켓 상태 업데이트
    let updateQuery = 'UPDATE order_tickets SET status = $1, updated_at = NOW()';
    let updateParams = [newStatus];
    let paramIndex = 2;

    Object.entries(updateFields).forEach(([field, value]) => {
      if (value === 'NOW()') {
        updateQuery += `, ${field} = NOW()`;
      } else {
        updateQuery += `, ${field} = $${paramIndex}`;
        updateParams.push(value);
        paramIndex++;
      }
    });

    updateQuery += ' WHERE id = $' + paramIndex;
    updateParams.push(ticketId);

    await client.query(updateQuery, updateParams);

    // TLL 주문인 경우 이벤트 로그 기록
    if (ticket.source_system === 'TLL' && eventType) {
      await client.query(`
        INSERT INTO kds_events (
          store_id, ticket_id, event_type, 
          actor_type, actor_id, payload
        )
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        ticket.store_id,
        ticketId,
        eventType,
        actor_type || 'SYSTEM',
        actor_id || 'kds',
        JSON.stringify({
          old_status: ticket.status,
          new_status: newStatus,
          action: action,
          table_number: ticket.table_number
        })
      ]);
    }

    await client.query('COMMIT');

    // 실시간 알림 (PostgreSQL NOTIFY)
    try {
      await client.query(`
        SELECT pg_notify('kds_updates', $1)
      `, [JSON.stringify({
        type: 'ticket_status_change',
        store_id: ticket.store_id,
        ticket_id: ticketId,
        order_id: ticket.order_id,
        old_status: ticket.status,
        new_status: newStatus,
        action: action,
        timestamp: Date.now()
      })]);
    } catch (notifyError) {
      console.warn('⚠️ 실시간 알림 실패:', notifyError.message);
    }

    res.json({
      success: true,
      message: `티켓 상태가 ${newStatus}로 변경되었습니다`,
      ticket_id: ticketId,
      old_status: ticket.status,
      new_status: newStatus
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

// 주문 생성 시 KDS 아이템 자동 설정
async function setupKDSForNewOrder(checkId, storeId, sourceSystem = 'POS') {
  const client = await pool.connect();

  try {
    console.log(`🎫 KDS 설정 시작: 체크 ${checkId}, 소스 ${sourceSystem}`);

    // 체크의 아이템들 조회
    const itemsResult = await client.query(`
      SELECT * FROM check_items 
      WHERE check_id = $1 AND status != 'canceled'
    `, [checkId]);

    const items = itemsResult.rows;
    if (items.length === 0) {
      return { success: true, message: '설정할 아이템이 없습니다' };
    }

    // 스테이션 조회
    const stationsResult = await client.query(`
      SELECT * FROM kds_stations 
      WHERE store_id = $1 AND is_active = true
      ORDER BY is_expo ASC
    `, [storeId]);

    let stations = stationsResult.rows;

    // 기본 스테이션이 없으면 생성
    if (stations.length === 0) {
      const defaultStations = [
        { name: '주방', code: 'KITCHEN', is_expo: false },
        { name: '엑스포', code: 'EXPO', is_expo: true }
      ];

      for (const station of defaultStations) {
        const result = await client.query(`
          INSERT INTO kds_stations (store_id, name, code, is_expo)
          VALUES ($1, $2, $3, $4)
          RETURNING *
        `, [storeId, station.name, station.code, station.is_expo]);
        stations.push(result.rows[0]);
      }
    }

    // 각 아이템에 스테이션 할당 및 KDS 상태 설정
    for (const item of items) {
      let targetStation = stations.find(s => !s.is_expo); // 기본적으로 주방 스테이션

      // 메뉴명 기반 스테이션 라우팅 로직
      const menuName = item.menu_name.toLowerCase();
      if (menuName.includes('음료') || menuName.includes('커피')) {
        const drinkStation = stations.find(s => s.name.includes('음료'));
        if (drinkStation) targetStation = drinkStation;
      }

      await client.query(`
        UPDATE check_items 
        SET 
          kds_status = 'PENDING',
          station_id = $1,
          source_system = $2,
          fired_at = NOW(),
          updated_at = NOW()
        WHERE id = $3
      `, [targetStation.id, sourceSystem, item.id]);

      // TLL 주문인 경우 이벤트 기록
      if (sourceSystem === 'TLL') {
        await client.query(`
          INSERT INTO kds_events (
            store_id, check_item_id, event_type,
            actor_type, actor_id, payload
          )
          VALUES ($1, $2, 'ITEM_CREATED', 'SYSTEM', 'tll', $3)
        `, [
          storeId,
          item.id,
          JSON.stringify({
            menu_name: item.menu_name,
            quantity: item.quantity,
            station_id: targetStation.id
          })
        ]);
      }
    }

    // 실시간 알림
    try {
      await client.query(`
        SELECT pg_notify('kds_updates', $1)
      `, [JSON.stringify({
        type: 'new_order',
        store_id: parseInt(storeId),
        check_id: parseInt(checkId),
        source_system: sourceSystem,
        item_count: items.length,
        timestamp: Date.now()
      })]);
    } catch (notifyError) {
      console.warn('⚠️ 실시간 알림 실패:', notifyError.message);
    }

    console.log(`✅ KDS 설정 완료: ${items.length}개 아이템`);
    return {
      success: true,
      message: `KDS 설정 완료: ${items.length}개 아이템`,
      items_count: items.length
    };

  } catch (error) {
    console.error('❌ KDS 설정 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

// KDS 설정 API
router.post('/setup', async (req, res) => {
  try {
    const { check_id, store_id, source_system } = req.body;

    if (!check_id || !store_id) {
      return res.status(400).json({
        success: false,
        message: 'check_id와 store_id가 필요합니다'
      });
    }

    const result = await setupKDSForNewOrder(check_id, store_id, source_system);
    res.json(result);

  } catch (error) {
    console.error('❌ KDS 설정 실패:', error);
    res.status(500).json({
      success: false,
      message: 'KDS 설정 실패',
      error: error.message
    });
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

  res.write(`data: ${JSON.stringify({
    type: 'connected',
    store_id: storeId,
    timestamp: Date.now()
  })}\n\n`);

  const client = pool.connect().then(client => {
    client.query('LISTEN kds_updates');

    client.on('notification', (msg) => {
      try {
        const payload = JSON.parse(msg.payload);
        if (payload.store_id === parseInt(storeId)) {
          res.write(`data: ${JSON.stringify(payload)}\n\n`);
        }
      } catch (error) {
        console.error('❌ SSE 알림 처리 실패:', error);
      }
    });

    return client;
  });

  req.on('close', async () => {
    try {
      const resolvedClient = await client;
      resolvedClient.release();
    } catch (error) {
      console.error('❌ SSE 연결 종료 처리 실패:', error);
    }
  });
});

module.exports = router;
module.exports.setupKDSForNewOrder = setupKDSForNewOrder;