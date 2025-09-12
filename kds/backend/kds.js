
const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// KDS 티켓 조회 (order_tickets 기반)
router.get('/tickets', async (req, res) => {
  try {
    const { store_id, station_id, status } = req.query;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: '매장 ID가 필요합니다'
      });
    }

    console.log(`🎫 KDS 티켓 조회: 매장 ${store_id}, 스테이션 ${station_id}`);

    // 먼저 매장이 존재하는지 확인
    const storeCheck = await pool.query('SELECT id FROM stores WHERE id = $1', [store_id]);
    if (storeCheck.rows.length === 0) {
      console.warn(`⚠️ 존재하지 않는 매장 ID: ${store_id}`);
      return res.json({
        success: true,
        tickets: [],
        total_tickets: 0,
        timestamp: Date.now(),
        message: '매장이 존재하지 않습니다'
      });
    }

    // order_tickets 테이블 존재 여부 확인
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'order_tickets'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.warn('⚠️ order_tickets 테이블이 존재하지 않음');
      return res.json({
        success: true,
        tickets: [],
        total_tickets: 0,
        timestamp: Date.now(),
        message: 'KDS 시스템이 설정되지 않았습니다'
      });
    }

    let query = `
      WITH ticket_items AS (
        SELECT 
          ot.id as ticket_id,
          ot.order_id,
          ot.table_number,
          ot.customer_name,
          ot.status as ticket_status,
          ot.station_id,
          ot.course_no,
          ot.fired_at,
          ot.started_at,
          ot.completed_at,
          ot.served_at,
          ot.canceled_at,
          ot.cancel_reason,
          ot.created_at,
          ot.updated_at,
          EXTRACT(EPOCH FROM (NOW() - COALESCE(ot.started_at, ot.fired_at, ot.created_at)))::INTEGER as elapsed_seconds,
          COALESCE(o.source_system, 'TLL') as source_system,
          o.store_id,
          COALESCE(
            JSON_AGG(
              JSON_BUILD_OBJECT(
                'id', ol.id,
                'menu_name', ol.menu_name,
                'quantity', ol.quantity,
                'unit_price', ol.unit_price,
                'options', ol.options,
                'special_requests', ol.special_requests
              ) ORDER BY ol.created_at
            ) FILTER (WHERE ol.id IS NOT NULL),
            '[]'::json
          ) as items
        FROM order_tickets ot
        LEFT JOIN orders o ON ot.order_id = o.id
        LEFT JOIN order_lines ol ON o.id = ol.order_id AND ot.course_no = ol.course_no
        WHERE (o.store_id = $1 OR o.store_id IS NULL)
          AND ot.status IN ('PENDING', 'COOKING', 'DONE')
    `;

    const params = [store_id];
    let paramIndex = 2;

    if (station_id && station_id !== 'all') {
      query += ` AND ot.station_id = $${paramIndex}`;
      params.push(station_id);
      paramIndex++;
    }

    if (status) {
      query += ` AND ot.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += `
        GROUP BY 
          ot.id, ot.order_id, ot.table_number, ot.customer_name, 
          ot.status, ot.station_id, ot.course_no, ot.fired_at, 
          ot.started_at, ot.completed_at, ot.served_at, ot.canceled_at,
          ot.cancel_reason, ot.created_at, ot.updated_at, o.source_system, o.store_id
      )
      SELECT * FROM ticket_items
      ORDER BY 
        CASE ticket_status 
          WHEN 'COOKING' THEN 1
          WHEN 'PENDING' THEN 2  
          WHEN 'DONE' THEN 3
        END,
        course_no ASC,
        fired_at ASC NULLS LAST
    `;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      tickets: result.rows,
      total_tickets: result.rows.length,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('❌ KDS 티켓 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: 'KDS 티켓 조회 실패',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: Date.now()
    });
  }
});

// 스테이션 정보 조회 (개선)
router.get('/stations', async (req, res) => {
  try {
    const { store_id } = req.query;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: '매장 ID가 필요합니다'
      });
    }

    console.log(`🏪 KDS 스테이션 조회: 매장 ${store_id}`);

    // 매장 존재 여부 확인
    const storeCheck = await pool.query('SELECT id, name FROM stores WHERE id = $1', [store_id]);
    if (storeCheck.rows.length === 0) {
      console.warn(`⚠️ 존재하지 않는 매장 ID: ${store_id}`);
      
      // 기본 스테이션 반환 (매장이 없어도 KDS 테스트 가능)
      const defaultStations = [
        { id: 1, name: '주방', code: 'KITCHEN', is_expo: false, display_order: 1, 
          active_tickets: 0, pending_tickets: 0, cooking_tickets: 0, done_tickets: 0 },
        { id: 2, name: '음료', code: 'BEVERAGE', is_expo: false, display_order: 2, 
          active_tickets: 0, pending_tickets: 0, cooking_tickets: 0, done_tickets: 0 },
        { id: 3, name: '엑스포', code: 'EXPO', is_expo: true, display_order: 3, 
          active_tickets: 0, pending_tickets: 0, cooking_tickets: 0, done_tickets: 0 }
      ];

      return res.json({
        success: true,
        stations: defaultStations,
        fallback: true,
        message: '기본 스테이션 반환 (매장 미존재)'
      });
    }

    // kds_stations 테이블 존재 여부 확인
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'kds_stations'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.warn('⚠️ kds_stations 테이블이 존재하지 않음 - 테이블 생성');
      
      // kds_stations 테이블 생성
      await pool.query(`
        CREATE TABLE IF NOT EXISTS kds_stations (
          id SERIAL PRIMARY KEY,
          store_id INTEGER NOT NULL,
          name VARCHAR(50) NOT NULL,
          code VARCHAR(20) NOT NULL,
          is_expo BOOLEAN DEFAULT FALSE,
          display_order INTEGER DEFAULT 1,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(store_id, code)
        );
      `);
      
      console.log('✅ kds_stations 테이블 생성 완료');
    }

    // 스테이션별 활성 티켓 수 조회 (안전한 쿼리)
    let result;
    try {
      result = await pool.query(`
        SELECT 
          s.id,
          s.name,
          s.code,
          s.is_expo,
          s.display_order,
          COUNT(ot.id) as active_tickets,
          SUM(CASE WHEN ot.status = 'PENDING' THEN 1 ELSE 0 END) as pending_tickets,
          SUM(CASE WHEN ot.status = 'COOKING' THEN 1 ELSE 0 END) as cooking_tickets,
          SUM(CASE WHEN ot.status = 'DONE' THEN 1 ELSE 0 END) as done_tickets
        FROM kds_stations s
        LEFT JOIN order_tickets ot ON s.id = ot.station_id 
          AND ot.status IN ('PENDING', 'COOKING', 'DONE')
        WHERE s.store_id = $1 AND s.is_active = true
        GROUP BY s.id, s.name, s.code, s.is_expo, s.display_order
        ORDER BY s.display_order ASC, s.name ASC
      `, [store_id]);
    } catch (joinError) {
      console.warn('⚠️ 조인 쿼리 실패, 기본 스테이션만 조회:', joinError.message);
      
      result = await pool.query(`
        SELECT 
          id, name, code, is_expo, display_order,
          0 as active_tickets,
          0 as pending_tickets,
          0 as cooking_tickets,
          0 as done_tickets
        FROM kds_stations
        WHERE store_id = $1 AND is_active = true
        ORDER BY display_order ASC, name ASC
      `, [store_id]);
    }

    if (result.rows.length === 0) {
      console.log('📝 기본 스테이션 생성 중...');
      
      // 기본 스테이션 생성
      const defaultStations = [
        { name: '주방', code: 'KITCHEN', is_expo: false, display_order: 1 },
        { name: '음료', code: 'BEVERAGE', is_expo: false, display_order: 2 },
        { name: '엑스포', code: 'EXPO', is_expo: true, display_order: 3 }
      ];

      const stations = [];
      for (const station of defaultStations) {
        try {
          const insertResult = await pool.query(`
            INSERT INTO kds_stations (store_id, name, code, is_expo, display_order)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (store_id, code) DO UPDATE SET
              name = EXCLUDED.name,
              is_expo = EXCLUDED.is_expo,
              display_order = EXCLUDED.display_order
            RETURNING *
          `, [store_id, station.name, station.code, station.is_expo, station.display_order]);

          stations.push({
            ...insertResult.rows[0],
            active_tickets: 0,
            pending_tickets: 0,
            cooking_tickets: 0,
            done_tickets: 0
          });
        } catch (insertError) {
          console.error(`❌ 스테이션 ${station.name} 생성 실패:`, insertError.message);
        }
      }

      return res.json({
        success: true,
        stations: stations,
        created: true
      });
    }

    res.json({
      success: true,
      stations: result.rows
    });

  } catch (error) {
    console.error('❌ 스테이션 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '스테이션 조회 실패',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: Date.now()
    });
  }
});

// 티켓 상태 변경 (개선)
router.patch('/tickets/:ticketId/status', async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const ticketId = req.params.ticketId;
    const { action, actor_id = 'kds_user', actor_type = 'USER', reason } = req.body;

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
      case 'fire':
        if (ticket.status === 'CREATED') {
          newStatus = 'PENDING';
          updateFields.fired_at = 'NOW()';
          eventType = 'TICKET_FIRED';
        }
        break;

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
          eventType = 'TICKET_COMPLETED';
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
          updateFields.cancel_reason = reason || '주방에서 취소';
          eventType = 'TICKET_CANCELED';
        }
        break;

      case 'recall':
        if (ticket.status === 'DONE') {
          newStatus = 'COOKING';
          updateFields.completed_at = null;
          eventType = 'TICKET_RECALLED';
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
        message: `이미 ${ticket.status} 상태입니다`
      });
    }

    // 티켓 상태 업데이트
    let updateQuery = 'UPDATE order_tickets SET status = $1, updated_at = NOW()';
    let updateParams = [newStatus];
    let paramIndex = 2;

    Object.entries(updateFields).forEach(([field, value]) => {
      if (value === 'NOW()') {
        updateQuery += `, ${field} = NOW()`;
      } else if (value === null) {
        updateQuery += `, ${field} = NULL`;
      } else {
        updateQuery += `, ${field} = $${paramIndex}`;
        updateParams.push(value);
        paramIndex++;
      }
    });

    updateQuery += ' WHERE id = $' + paramIndex;
    updateParams.push(ticketId);

    await client.query(updateQuery, updateParams);

    // 이벤트 로그 기록
    if (eventType) {
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
        actor_type,
        actor_id,
        JSON.stringify({
          old_status: ticket.status,
          new_status: newStatus,
          action: action,
          table_number: ticket.table_number,
          reason: reason
        })
      ]);
    }

    await client.query('COMMIT');

    // 실시간 알림
    try {
      await client.query(`
        SELECT pg_notify('kds_updates', $1)
      `, [JSON.stringify({
        type: 'ticket_status_change',
        store_id: ticket.store_id,
        ticket_id: parseInt(ticketId),
        order_id: ticket.order_id,
        table_number: ticket.table_number,
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
      message: `티켓이 ${newStatus} 상태로 변경되었습니다`,
      data: {
        ticket_id: parseInt(ticketId),
        old_status: ticket.status,
        new_status: newStatus,
        action: action
      }
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

// KDS 대시보드 데이터
router.get('/dashboard', async (req, res) => {
  try {
    const { store_id } = req.query;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: '매장 ID가 필요합니다'
      });
    }

    console.log(`📊 KDS 대시보드 조회: 매장 ${store_id}`);

    // 테이블 존재 여부 확인
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'order_tickets'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.warn('⚠️ order_tickets 테이블이 존재하지 않음');
      
      return res.json({
        success: true,
        dashboard: {
          pending_count: 0,
          cooking_count: 0,
          done_count: 0,
          served_today: 0,
          avg_cook_time_minutes: null,
          avg_wait_time_minutes: null
        },
        timestamp: Date.now(),
        message: 'KDS 시스템이 설정되지 않았습니다'
      });
    }

    let result;
    try {
      result = await pool.query(`
        SELECT 
          COUNT(*) FILTER (WHERE ot.status = 'PENDING') as pending_count,
          COUNT(*) FILTER (WHERE ot.status = 'COOKING') as cooking_count,
          COUNT(*) FILTER (WHERE ot.status = 'DONE') as done_count,
          COUNT(*) FILTER (WHERE ot.status = 'SERVED') as served_today,
          AVG(
            EXTRACT(EPOCH FROM (ot.completed_at - ot.started_at)) / 60
          ) FILTER (WHERE ot.completed_at IS NOT NULL AND ot.started_at IS NOT NULL) as avg_cook_time_minutes,
          AVG(
            EXTRACT(EPOCH FROM (ot.served_at - ot.completed_at)) / 60
          ) FILTER (WHERE ot.served_at IS NOT NULL AND ot.completed_at IS NOT NULL) as avg_wait_time_minutes
        FROM order_tickets ot
        LEFT JOIN orders o ON ot.order_id = o.id
        WHERE (o.store_id = $1 OR o.store_id IS NULL)
          AND DATE(ot.created_at) = CURRENT_DATE
      `, [store_id]);
    } catch (queryError) {
      console.warn('⚠️ 조인 쿼리 실패, 단순 쿼리 시도:', queryError.message);
      
      // 조인 실패 시 order_tickets만 조회
      result = await pool.query(`
        SELECT 
          COUNT(*) FILTER (WHERE status = 'PENDING') as pending_count,
          COUNT(*) FILTER (WHERE status = 'COOKING') as cooking_count,
          COUNT(*) FILTER (WHERE status = 'DONE') as done_count,
          COUNT(*) FILTER (WHERE status = 'SERVED') as served_today,
          AVG(
            EXTRACT(EPOCH FROM (completed_at - started_at)) / 60
          ) FILTER (WHERE completed_at IS NOT NULL AND started_at IS NOT NULL) as avg_cook_time_minutes,
          AVG(
            EXTRACT(EPOCH FROM (served_at - completed_at)) / 60
          ) FILTER (WHERE served_at IS NOT NULL AND completed_at IS NOT NULL) as avg_wait_time_minutes
        FROM order_tickets
        WHERE DATE(created_at) = CURRENT_DATE
      `);
    }

    // null 값 처리
    const dashboard = result.rows[0];
    Object.keys(dashboard).forEach(key => {
      if (dashboard[key] === null) {
        if (key.includes('count') || key.includes('today')) {
          dashboard[key] = 0;
        } else {
          dashboard[key] = null;
        }
      }
    });

    res.json({
      success: true,
      dashboard: dashboard,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('❌ KDS 대시보드 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '대시보드 조회 실패',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: Date.now()
    });
  }
});

// SSE 스트림 (개선)
router.get('/stream/:store_id', (req, res) => {
  const storeId = req.params.store_id;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // 연결 확인 메시지
  res.write(`data: ${JSON.stringify({
    type: 'connected',
    store_id: parseInt(storeId),
    timestamp: Date.now()
  })}\n\n`);

  let client;

  // PostgreSQL LISTEN 설정
  const setupListener = async () => {
    try {
      client = await pool.connect();
      await client.query('LISTEN kds_updates');

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

      console.log(`🔌 KDS SSE 연결됨: 매장 ${storeId}`);

    } catch (error) {
      console.error('❌ SSE 설정 실패:', error);
      res.write(`data: ${JSON.stringify({
        type: 'error',
        message: 'SSE 연결 실패'
      })}\n\n`);
    }
  };

  setupListener();

  // 주기적 keepalive (30초마다)
  const keepAlive = setInterval(() => {
    res.write(`data: ${JSON.stringify({
      type: 'keepalive',
      timestamp: Date.now()
    })}\n\n`);
  }, 30000);

  // 연결 종료 처리
  req.on('close', () => {
    console.log(`🔌 KDS SSE 연결 종료: 매장 ${storeId}`);
    
    clearInterval(keepAlive);
    
    if (client) {
      client.release();
    }
  });
});

// 주문 생성 시 자동 KDS 설정 (새로운 방식)
async function createOrderTickets(orderId, storeId, sourceSystem = 'TLL') {
  const client = await pool.connect();

  try {
    console.log(`🎫 주문 티켓 생성 시작: 주문 ${orderId}`);

    // 주문 라인별로 코스별 그룹화
    const orderLinesResult = await client.query(`
      SELECT 
        ol.*,
        COALESCE(ol.course_no, 1) as effective_course_no
      FROM order_lines ol
      WHERE ol.order_id = $1 AND ol.status != 'canceled'
      ORDER BY ol.course_no, ol.created_at
    `, [orderId]);

    const orderLines = orderLinesResult.rows;
    
    if (orderLines.length === 0) {
      return { success: true, message: '생성할 티켓이 없습니다' };
    }

    // 주문 정보 조회
    const orderResult = await client.query(`
      SELECT o.*, u.name as customer_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = $1
    `, [orderId]);

    const order = orderResult.rows[0];

    // 스테이션 조회
    const stationsResult = await client.query(`
      SELECT * FROM kds_stations 
      WHERE store_id = $1 AND is_active = true
      ORDER BY display_order ASC
    `, [storeId]);

    let stations = stationsResult.rows;

    // 코스별 티켓 생성
    const courseGroups = {};
    orderLines.forEach(line => {
      const courseNo = line.effective_course_no;
      if (!courseGroups[courseNo]) {
        courseGroups[courseNo] = [];
      }
      courseGroups[courseNo].push(line);
    });

    const createdTickets = [];

    for (const [courseNo, lines] of Object.entries(courseGroups)) {
      // 메뉴 타입별 스테이션 할당
      let targetStation = stations.find(s => !s.is_expo) || stations[0];

      // 스테이션 라우팅 로직 (메뉴명 기반)
      const hasOnlyBeverage = lines.every(line => 
        line.menu_name.toLowerCase().includes('음료') || 
        line.menu_name.toLowerCase().includes('커피') ||
        line.menu_name.toLowerCase().includes('차')
      );

      if (hasOnlyBeverage) {
        const beverageStation = stations.find(s => s.code === 'BEVERAGE');
        if (beverageStation) targetStation = beverageStation;
      }

      // 티켓 생성
      const ticketResult = await client.query(`
        INSERT INTO order_tickets (
          order_id, table_number, customer_name, course_no,
          station_id, status, fired_at, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), NOW())
        RETURNING *
      `, [
        orderId,
        order.table_number || 1,
        order.customer_name || '고객',
        parseInt(courseNo),
        targetStation.id,
        'PENDING'
      ]);

      const ticket = ticketResult.rows[0];
      createdTickets.push(ticket);

      // KDS 이벤트 로그
      await client.query(`
        INSERT INTO kds_events (
          store_id, ticket_id, order_id, event_type,
          actor_type, actor_id, payload
        )
        VALUES ($1, $2, $3, 'TICKET_CREATED', 'SYSTEM', $4, $5)
      `, [
        storeId,
        ticket.id,
        orderId,
        sourceSystem.toLowerCase(),
        JSON.stringify({
          course_no: parseInt(courseNo),
          item_count: lines.length,
          station_id: targetStation.id,
          source_system: sourceSystem
        })
      ]);
    }

    // 실시간 알림
    try {
      await client.query(`
        SELECT pg_notify('kds_updates', $1)
      `, [JSON.stringify({
        type: 'new_tickets',
        store_id: parseInt(storeId),
        order_id: parseInt(orderId),
        ticket_count: createdTickets.length,
        source_system: sourceSystem,
        timestamp: Date.now()
      })]);
    } catch (notifyError) {
      console.warn('⚠️ 실시간 알림 실패:', notifyError.message);
    }

    console.log(`✅ KDS 티켓 생성 완료: ${createdTickets.length}개`);
    
    return {
      success: true,
      message: `KDS 티켓 ${createdTickets.length}개 생성 완료`,
      tickets: createdTickets
    };

  } catch (error) {
    console.error('❌ KDS 티켓 생성 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

// KDS 티켓 생성 API
router.post('/create-tickets', async (req, res) => {
  try {
    const { order_id, store_id, source_system } = req.body;

    if (!order_id || !store_id) {
      return res.status(400).json({
        success: false,
        message: 'order_id와 store_id가 필요합니다'
      });
    }

    const result = await createOrderTickets(order_id, store_id, source_system);
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
module.exports.createOrderTickets = createOrderTickets;
