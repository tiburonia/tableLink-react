
const express = require('express');
const router = express.Router();
const pool = require('../../src/db/pool');

// =================== KDS 티켓 조회 (폴링용) ===================
router.get('/tickets', async (req, res) => {
  try {
    const { store_id, status, station, display_status = 'VISIBLE' } = req.query;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: '매장 ID가 필요합니다'
      });
    }

    console.log(`🎫 KDS 티켓 조회: 매장 ${store_id}, 상태 ${status || 'ALL'}, 스테이션 ${station || 'ALL'}`);

    // KDS 테이블 자동 생성 확인
    await ensureKDSTables();

    // 매장 존재 여부 확인
    const storeCheck = await pool.query('SELECT id, name FROM stores WHERE id = $1', [store_id]);
    if (storeCheck.rows.length === 0) {
      console.log(`⚠️ 매장 ${store_id}가 존재하지 않음`);
      return res.json({
        success: true,
        tickets: [],
        total_tickets: 0,
        timestamp: Date.now(),
        message: '존재하지 않는 매장입니다'
      });
    }

    // 테이블 존재 여부 확인 후 안전한 쿼리 실행
    let result;
    try {
      const tablesCheck = await pool.query(`
        SELECT 
          EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'orders') as orders_exists,
          EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'order_tickets') as tickets_exists,
          EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'order_items') as items_exists,
          EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'ticket_id') as items_extended;
      `);

      const { orders_exists, tickets_exists, items_exists, items_extended } = tablesCheck.rows[0];

      if (!tickets_exists || !orders_exists) {
        // 기본 테이블이 없으면 빈 결과 반환
        result = { rows: [] };
      } else {
        // 티켓 + 아이템 한방 조회 (성능 최적화)
        const query = items_exists && items_extended ? `
          WITH tk AS (
            SELECT 
              ot.id AS ticket_id, 
              ot.order_id, 
              ot.batch_no, 
              ot.status, 
              ot.print_status,
              ot.display_status, 
              ot.payment_type, 
              ot.version, 
              ot.created_at,
              o.store_id, 
              COALESCE('테이블 ', CAST(COALESCE(o.table_number, 1) AS TEXT)) AS table_label,
              EXTRACT(EPOCH FROM (NOW() - ot.created_at))::INTEGER AS elapsed_seconds
            FROM order_tickets ot
            LEFT JOIN orders o ON o.id = ot.order_id
            WHERE (o.store_id = $1 OR o.id IS NULL)
              AND ($2::text IS NULL OR ot.status = ANY(string_to_array($2, ',')))
              AND ot.display_status = $3
            ORDER BY 
              CASE ot.status 
                WHEN 'COOKING' THEN 1
                WHEN 'PENDING' THEN 2  
                WHEN 'DONE' THEN 3
                ELSE 4
              END,
              ot.created_at ASC
          )
          SELECT 
            tk.*, 
            COALESCE(
              json_agg(
                json_build_object(
                  'id', oi.id,
                  'menu_name', COALESCE(oi.menu_name, '메뉴'),
                  'quantity', COALESCE(oi.quantity, 1),
                  'item_status', COALESCE(oi.item_status, 'PENDING'),
                  'cook_station', COALESCE(oi.cook_station, 'KITCHEN'),
                  'special_requests', oi.special_requests,
                  'unit_price', COALESCE(oi.unit_price, 0)
                ) ORDER BY oi.id
              ) FILTER (WHERE oi.id IS NOT NULL),
              '[]'::json
            ) AS items
          FROM tk
          LEFT JOIN order_items oi ON oi.ticket_id = tk.ticket_id
          WHERE ($4::text IS NULL OR oi.cook_station = $4 OR oi.id IS NULL)
          GROUP BY 
            tk.ticket_id, tk.order_id, tk.batch_no, tk.status, tk.print_status,
            tk.display_status, tk.payment_type, tk.version, tk.created_at,
            tk.store_id, tk.table_label, tk.elapsed_seconds
        ` : `
          SELECT 
            ot.id AS ticket_id, 
            ot.order_id, 
            ot.batch_no, 
            ot.status, 
            ot.print_status,
            ot.display_status, 
            ot.payment_type, 
            ot.version, 
            ot.created_at,
            COALESCE(o.store_id, 1) as store_id,
            CONCAT('테이블 ', COALESCE(o.table_number, 1)) AS table_label,
            EXTRACT(EPOCH FROM (NOW() - ot.created_at))::INTEGER AS elapsed_seconds,
            '[]'::json AS items
          FROM order_tickets ot
          LEFT JOIN orders o ON o.id = ot.order_id
          WHERE (o.store_id = $1 OR o.id IS NULL)
            AND ($2::text IS NULL OR ot.status = ANY(string_to_array($2, ',')))
            AND ot.display_status = $3
          ORDER BY 
            CASE ot.status 
              WHEN 'COOKING' THEN 1
              WHEN 'PENDING' THEN 2  
              WHEN 'DONE' THEN 3
              ELSE 4
            END,
            ot.created_at ASC
        `;

        const params = [
          store_id,
          status || 'PENDING,COOKING',
          display_status,
          station || null
        ];

        result = await pool.query(query, params.slice(0, items_exists && items_extended ? 4 : 3));
      }
    } catch (queryError) {
      console.warn('⚠️ 티켓 쿼리 실패, 빈 결과 반환:', queryError.message);
      result = { rows: [] };
    }

    res.json({
      success: true,
      tickets: result.rows,
      total_tickets: result.rows.length,
      timestamp: Date.now(),
      store_id: parseInt(store_id)
    });

  } catch (error) {
    console.error('❌ KDS 티켓 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: 'KDS 티켓 조회 실패',
      message: error.message,
      timestamp: Date.now()
    });
  }
});

// =================== 아이템 상태 변경 (핵심 로직) ===================
router.patch('/items/:id', async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const itemId = parseInt(req.params.id);
    const { item_status, actor_id = 'kds_user', reason } = req.body;

    if (!['PENDING', 'COOKING', 'DONE', 'CANCELED'].includes(item_status)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 아이템 상태입니다'
      });
    }

    console.log(`🔄 아이템 ${itemId} 상태 변경: ${item_status}`);

    // 아이템 상태 업데이트 + 티켓 자동 집계
    const updateResult = await client.query(`
      WITH item_update AS (
        UPDATE order_items
        SET item_status = $1, 
            updated_at = NOW(),
            cancel_reason = CASE WHEN $1 = 'CANCELED' THEN $2 ELSE cancel_reason END
        WHERE id = $3
        RETURNING ticket_id, menu_name, quantity, cook_station
      ),
      ticket_aggregation AS (
        SELECT 
          iu.ticket_id,
          COUNT(*) FILTER (WHERE oi.item_status IN ('PENDING','COOKING')) AS outstanding,
          COUNT(*) FILTER (WHERE oi.item_status = 'COOKING') AS cooking_cnt,
          COUNT(*) FILTER (WHERE oi.item_status = 'CANCELED') AS canceled_cnt,
          COUNT(*) AS total_cnt
        FROM item_update iu
        JOIN order_items oi ON oi.ticket_id = iu.ticket_id
        GROUP BY iu.ticket_id
      ),
      ticket_update AS (
        UPDATE order_tickets ot
        SET 
          status = CASE
            WHEN ta.outstanding = 0 AND ta.canceled_cnt < ta.total_cnt THEN 'DONE'
            WHEN ta.cooking_cnt > 0 THEN 'COOKING'
            ELSE 'PENDING'
          END,
          version = ot.version + 1,
          updated_at = NOW()
        FROM ticket_aggregation ta
        WHERE ot.id = ta.ticket_id
        RETURNING ot.id, ot.status, ot.order_id
      )
      SELECT 
        iu.ticket_id,
        iu.menu_name,
        iu.quantity,
        iu.cook_station,
        tu.status AS new_ticket_status,
        tu.order_id
      FROM item_update iu
      JOIN ticket_update tu ON tu.id = iu.ticket_id
    `, [item_status, reason || null, itemId]);

    if (updateResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: '아이템을 찾을 수 없습니다'
      });
    }

    const result = updateResult.rows[0];

    // KDS 이벤트 로그 기록
    await client.query(`
      INSERT INTO kds_events (
        store_id, ticket_id, order_id, event_type,
        actor_type, actor_id, payload, created_at
      )
      SELECT 
        o.store_id,
        $1,
        $2,
        'ITEM_STATUS_CHANGED',
        'USER',
        $3,
        json_build_object(
          'item_id', $4,
          'menu_name', $5,
          'old_status', 'UNKNOWN',
          'new_status', $6,
          'cook_station', $7,
          'reason', $8
        ),
        NOW()
      FROM orders o
      WHERE o.id = $2
    `, [
      result.ticket_id,
      result.order_id,
      actor_id,
      itemId,
      result.menu_name,
      item_status,
      result.cook_station,
      reason
    ]);

    await client.query('COMMIT');

    // 실시간 알림
    try {
      const storeResult = await pool.query('SELECT store_id FROM orders WHERE id = $1', [result.order_id]);
      if (storeResult.rows.length > 0) {
        await pool.query(`
          SELECT pg_notify('kds_updates', $1)
        `, [JSON.stringify({
          type: 'item_status_change',
          store_id: storeResult.rows[0].store_id,
          ticket_id: result.ticket_id,
          item_id: itemId,
          new_item_status: item_status,
          new_ticket_status: result.new_ticket_status,
          timestamp: Date.now()
        })]);
      }
    } catch (notifyError) {
      console.warn('⚠️ 실시간 알림 실패:', notifyError.message);
    }

    res.json({
      success: true,
      message: `아이템이 ${item_status} 상태로 변경되었습니다`,
      data: {
        item_id: itemId,
        ticket_id: result.ticket_id,
        new_item_status: item_status,
        new_ticket_status: result.new_ticket_status,
        menu_name: result.menu_name
      }
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

// =================== 티켓 상태 강제 변경 (낙관적 락) ===================
router.patch('/tickets/:id', async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const ticketId = parseInt(req.params.id);
    const { status, if_version, actor_id = 'kds_user', reason } = req.body;

    if (!['PENDING', 'COOKING', 'DONE'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 티켓 상태입니다'
      });
    }

    console.log(`🎫 티켓 ${ticketId} 상태 강제 변경: ${status}`);

    // 낙관적 락으로 버전 체크하며 업데이트
    const updateResult = await client.query(`
      UPDATE order_tickets
      SET 
        status = $1, 
        version = version + 1,
        updated_at = NOW()
      WHERE id = $2 
        AND ($3::integer IS NULL OR version = $3)
      RETURNING id, order_id, status, version
    `, [status, ticketId, if_version]);

    if (updateResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        message: if_version ? '버전 충돌이 발생했습니다. 페이지를 새로고침하세요.' : '티켓을 찾을 수 없습니다'
      });
    }

    const result = updateResult.rows[0];

    // 상태에 따라 모든 아이템 상태도 일괄 변경
    if (status === 'DONE') {
      await client.query(`
        UPDATE order_items
        SET item_status = 'DONE', updated_at = NOW()
        WHERE ticket_id = $1 AND item_status != 'CANCELED'
      `, [ticketId]);
    } else if (status === 'COOKING') {
      await client.query(`
        UPDATE order_items
        SET item_status = 'COOKING', updated_at = NOW()
        WHERE ticket_id = $1 AND item_status = 'PENDING'
      `, [ticketId]);
    }

    // 이벤트 로그
    await client.query(`
      INSERT INTO kds_events (
        store_id, ticket_id, order_id, event_type,
        actor_type, actor_id, payload, created_at
      )
      SELECT 
        o.store_id,
        $1,
        $2,
        'TICKET_STATUS_FORCED',
        'USER',
        $3,
        json_build_object(
          'old_status', 'UNKNOWN',
          'new_status', $4,
          'version', $5,
          'reason', $6
        ),
        NOW()
      FROM orders o
      WHERE o.id = $2
    `, [ticketId, result.order_id, actor_id, status, result.version, reason]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `티켓이 ${status} 상태로 변경되었습니다`,
      data: {
        ticket_id: ticketId,
        new_status: status,
        new_version: result.version
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

// =================== 프린트 큐 진입 ===================
router.post('/tickets/:id/print', async (req, res) => {
  try {
    const ticketId = parseInt(req.params.id);
    const { actor_id = 'kds_user' } = req.body;

    console.log(`🖨️ 티켓 ${ticketId} 프린트 큐 진입`);

    const result = await pool.query(`
      UPDATE order_tickets
      SET 
        print_status = 'QUEUED',
        print_requested_at = NOW(),
        updated_at = NOW()
      WHERE id = $1 AND print_status = 'WAITING'
      RETURNING id, order_id, batch_no
    `, [ticketId]);

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: '이미 프린트 요청되었거나 존재하지 않는 티켓입니다'
      });
    }

    // 프린트 큐 이벤트 로그
    await pool.query(`
      INSERT INTO kds_events (
        store_id, ticket_id, order_id, event_type,
        actor_type, actor_id, payload, created_at
      )
      SELECT 
        o.store_id,
        $1,
        $2,
        'PRINT_QUEUED',
        'USER',
        $3,
        json_build_object(
          'batch_no', $4,
          'print_requested_at', NOW()
        ),
        NOW()
      FROM orders o
      WHERE o.id = $2
    `, [ticketId, result.rows[0].order_id, actor_id, result.rows[0].batch_no]);

    res.json({
      success: true,
      message: '프린트 큐에 추가되었습니다',
      data: {
        ticket_id: ticketId,
        print_status: 'QUEUED'
      }
    });

  } catch (error) {
    console.error('❌ 프린트 큐 진입 실패:', error);
    res.status(500).json({
      success: false,
      message: '프린트 큐 진입 실패',
      error: error.message
    });
  }
});

// =================== 스테이션 관리 ===================
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

    // KDS 테이블 자동 생성 확인
    await ensureKDSTables();

    // 스테이션별 활성 티켓 수 조회 (order_items 테이블이 없어도 작동)
    let result;
    try {
      // order_items 테이블 존재 여부 확인
      const itemsExists = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'order_items'
          AND EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'order_items' 
            AND column_name = 'cook_station'
          )
        );
      `);

      if (itemsExists.rows[0].exists) {
        result = await pool.query(`
          SELECT 
            DISTINCT COALESCE(oi.cook_station, 'KITCHEN') as station_code,
            COALESCE(oi.cook_station, 'KITCHEN') as station_name,
            COUNT(DISTINCT ot.id) FILTER (WHERE ot.status IN ('PENDING', 'COOKING', 'DONE') AND ot.display_status = 'VISIBLE') as active_tickets,
            COUNT(DISTINCT ot.id) FILTER (WHERE ot.status = 'PENDING' AND ot.display_status = 'VISIBLE') as pending_tickets,
            COUNT(DISTINCT ot.id) FILTER (WHERE ot.status = 'COOKING' AND ot.display_status = 'VISIBLE') as cooking_tickets,
            COUNT(DISTINCT ot.id) FILTER (WHERE ot.status = 'DONE' AND ot.display_status = 'VISIBLE') as done_tickets
          FROM order_items oi
          LEFT JOIN order_tickets ot ON ot.id = oi.ticket_id
          LEFT JOIN orders o ON o.id = ot.order_id
          WHERE o.store_id = $1 OR oi.id IS NULL
          GROUP BY COALESCE(oi.cook_station, 'KITCHEN')
          ORDER BY 
            CASE COALESCE(oi.cook_station, 'KITCHEN')
              WHEN 'KITCHEN' THEN 1
              WHEN 'BEVERAGE' THEN 2
              WHEN 'DESSERT' THEN 3
              ELSE 4
            END
        `, [store_id]);
      } else {
        // order_items 테이블이 없거나 cook_station 컬럼이 없으면 기본 스테이션만 반환
        result = { rows: [] };
      }
    } catch (queryError) {
      console.warn('⚠️ 스테이션 쿼리 실패, 기본값 반환:', queryError.message);
      result = { rows: [] };
    }

    // 기본 스테이션이 없으면 추가
    const stations = result.rows.length > 0 ? result.rows : [
      {
        station_code: 'KITCHEN',
        station_name: 'KITCHEN',
        active_tickets: 0,
        pending_tickets: 0,
        cooking_tickets: 0,
        done_tickets: 0
      }
    ];

    res.json({
      success: true,
      stations: stations.map(station => ({
        id: station.station_code,
        name: station.station_name,
        code: station.station_code,
        active_tickets: parseInt(station.active_tickets) || 0,
        pending_tickets: parseInt(station.pending_tickets) || 0,
        cooking_tickets: parseInt(station.cooking_tickets) || 0,
        done_tickets: parseInt(station.done_tickets) || 0
      }))
    });

  } catch (error) {
    console.error('❌ 스테이션 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '스테이션 조회 실패',
      message: error.message
    });
  }
});

// =================== KDS 대시보드 데이터 ===================
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

    // KDS 테이블 자동 생성 확인
    await ensureKDSTables();

    let result;
    try {
      // orders 테이블과 order_tickets 테이블 존재 여부 확인
      const tablesCheck = await pool.query(`
        SELECT 
          EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'orders') as orders_exists,
          EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'order_tickets') as tickets_exists;
      `);

      const { orders_exists, tickets_exists } = tablesCheck.rows[0];

      if (orders_exists && tickets_exists) {
        result = await pool.query(`
          SELECT 
            COUNT(*) FILTER (WHERE ot.status = 'PENDING' AND ot.display_status = 'VISIBLE') as pending_count,
            COUNT(*) FILTER (WHERE ot.status = 'COOKING' AND ot.display_status = 'VISIBLE') as cooking_count,
            COUNT(*) FILTER (WHERE ot.status = 'DONE' AND ot.display_status = 'VISIBLE') as done_count,
            COUNT(*) FILTER (WHERE ot.status = 'DONE' AND DATE(ot.updated_at) = CURRENT_DATE) as served_today,
            AVG(
              EXTRACT(EPOCH FROM (ot.updated_at - ot.created_at)) / 60
            ) FILTER (WHERE ot.status = 'DONE' AND ot.updated_at > ot.created_at) as avg_cook_time_minutes,
            AVG(
              EXTRACT(EPOCH FROM (NOW() - ot.created_at)) / 60
            ) FILTER (WHERE ot.status IN ('PENDING', 'COOKING')) as avg_wait_time_minutes
          FROM order_tickets ot
          LEFT JOIN orders o ON o.id = ot.order_id
          WHERE (o.store_id = $1 OR o.id IS NULL)
            AND DATE(ot.created_at) = CURRENT_DATE
        `, [store_id]);
      } else {
        // 테이블이 없으면 기본값으로 채워진 결과 생성
        result = { 
          rows: [{ 
            pending_count: '0', 
            cooking_count: '0', 
            done_count: '0', 
            served_today: '0',
            avg_cook_time_minutes: null,
            avg_wait_time_minutes: null
          }] 
        };
      }
    } catch (queryError) {
      console.warn('⚠️ 대시보드 쿼리 실패, 기본값 반환:', queryError.message);
      result = { 
        rows: [{ 
          pending_count: '0', 
          cooking_count: '0', 
          done_count: '0', 
          served_today: '0',
          avg_cook_time_minutes: null,
          avg_wait_time_minutes: null
        }] 
      };
    }

    const dashboard = result.rows[0] || {};

    // null 값 처리
    Object.keys(dashboard).forEach(key => {
      if (dashboard[key] === null) {
        if (key.includes('count') || key.includes('today')) {
          dashboard[key] = 0;
        } else {
          dashboard[key] = 0;
        }
      } else if (typeof dashboard[key] === 'string') {
        dashboard[key] = parseFloat(dashboard[key]) || 0;
      }
    });

    res.json({
      success: true,
      dashboard: {
        pending_count: parseInt(dashboard.pending_count) || 0,
        cooking_count: parseInt(dashboard.cooking_count) || 0,
        done_count: parseInt(dashboard.done_count) || 0,
        served_today: parseInt(dashboard.served_today) || 0,
        avg_cook_time_minutes: Math.round((dashboard.avg_cook_time_minutes || 0) * 10) / 10,
        avg_wait_time_minutes: Math.round((dashboard.avg_wait_time_minutes || 0) * 10) / 10
      },
      timestamp: Date.now(),
      store_id: parseInt(store_id)
    });

  } catch (error) {
    console.error('❌ KDS 대시보드 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '대시보드 조회 실패',
      message: error.message
    });
  }
});

// =================== SSE 스트림 ===================
router.get('/stream/:store_id', (req, res) => {
  const storeId = parseInt(req.params.store_id);

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
    store_id: storeId,
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
          console.log(`📡 PostgreSQL NOTIFY 수신 (매장 ${storeId}):`, msg.payload);
          const payload = JSON.parse(msg.payload);
          
          // 해당 매장의 알림만 전송
          if (payload.store_id === storeId || payload.store_id === parseInt(storeId)) {
            const message = `data: ${JSON.stringify(payload)}\n\n`;
            res.write(message);
            console.log(`📤 SSE 메시지 전송됨:`, payload.type);
          } else {
            console.log(`🔇 다른 매장 알림 무시: ${payload.store_id} !== ${storeId}`);
          }
        } catch (error) {
          console.error('❌ SSE 알림 처리 실패:', error);
          res.write(`data: ${JSON.stringify({
            type: 'error',
            message: 'SSE 알림 처리 실패',
            error: error.message
          })}\n\n`);
        }
      });

      client.on('error', (error) => {
        console.error('❌ PostgreSQL 클라이언트 오류:', error);
      });

      console.log(`✅ KDS SSE PostgreSQL LISTEN 설정 완료: 매장 ${storeId}`);

    } catch (error) {
      console.error('❌ SSE PostgreSQL 설정 실패:', error);
      res.write(`data: ${JSON.stringify({
        type: 'error',
        message: 'SSE 연결 실패',
        error: error.message
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

// =================== 화면 정리 (DONE 티켓 자동 숨김) ===================
router.post('/cleanup/:store_id', async (req, res) => {
  try {
    const storeId = parseInt(req.params.store_id);
    const { minutes_threshold = 3 } = req.body;

    console.log(`🧹 매장 ${storeId} 화면 정리 시작 (${minutes_threshold}분 임계값)`);

    const result = await pool.query(`
      UPDATE order_tickets ot
      SET 
        display_status = 'HIDDEN',
        updated_at = NOW()
      FROM orders o
      WHERE o.id = ot.order_id
        AND o.store_id = $1
        AND ot.status = 'DONE'
        AND ot.display_status = 'VISIBLE'
        AND ot.updated_at < NOW() - INTERVAL '1 minute' * $2
      RETURNING ot.id
    `, [storeId, minutes_threshold]);

    res.json({
      success: true,
      message: `${result.rows.length}개 티켓이 숨김 처리되었습니다`,
      hidden_tickets: result.rows.length,
      store_id: storeId
    });

  } catch (error) {
    console.error('❌ 화면 정리 실패:', error);
    res.status(500).json({
      success: false,
      message: '화면 정리 실패',
      error: error.message
    });
  }
});

// =================== KDS 테이블 생성/확인 함수 ===================
async function ensureKDSTables() {
  // 이미 생성 시도 중이면 대기
  if (ensureKDSTables._creating) {
    await ensureKDSTables._creating;
    return;
  }

  // 이미 확인했으면 스�ip
  if (ensureKDSTables._checked) {
    return;
  }

  const client = await pool.connect();
  
  try {
    console.log('🔍 KDS 테이블 존재 여부 확인 중...');

    // 필수 테이블들이 모두 존재하는지 확인
    const tableCheck = await client.query(`
      SELECT 
        (SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'order_tickets')) as tickets_exists,
        (SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'ticket_id')) as items_extended,
        (SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'kds_events')) as events_exists
    `);

    const { tickets_exists, items_extended, events_exists } = tableCheck.rows[0];

    if (!tickets_exists || !items_extended || !events_exists) {
      console.log('📋 KDS 테이블 일부가 누락됨, 생성 시작...');
      ensureKDSTables._creating = createKDSTables();
      await ensureKDSTables._creating;
      ensureKDSTables._creating = null;
    }

    ensureKDSTables._checked = true;
    console.log('✅ KDS 테이블 확인 완료');

  } catch (error) {
    console.error('❌ KDS 테이블 확인 실패:', error);
    // 에러가 발생해도 계속 진행 (기본 응답 반환)
  } finally {
    client.release();
  }
}

// 실제 테이블 생성 함수
async function createKDSTables() {
  const client = await pool.connect();
  
  try {
    console.log('📋 KDS 필수 테이블들을 생성합니다...');

    await client.query('BEGIN');

    // order_tickets 테이블
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_tickets (
        id SERIAL PRIMARY KEY,
        order_id INTEGER,
        batch_no INTEGER DEFAULT 1,
        status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COOKING', 'DONE', 'CANCELED')),
        print_status VARCHAR(20) DEFAULT 'WAITING' CHECK (print_status IN ('WAITING', 'QUEUED', 'PRINTED', 'FAILED')),
        display_status VARCHAR(20) DEFAULT 'VISIBLE' CHECK (display_status IN ('VISIBLE', 'HIDDEN')),
        payment_type VARCHAR(20) DEFAULT 'POSTPAID',
        version INTEGER DEFAULT 1,
        print_requested_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // orders 테이블이 존재하면 외래키 추가
    try {
      await client.query(`
        DO $$ 
        BEGIN
          IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'orders') THEN
            ALTER TABLE order_tickets ADD CONSTRAINT fk_order_tickets_order_id 
            FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
          END IF;
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);
    } catch (err) {
      console.log('⚠️ 외래키 제약조건 추가 스킵:', err.message);
    }

    // 인덱스 생성
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_order_tickets_order_id ON order_tickets(order_id);
      CREATE INDEX IF NOT EXISTS idx_order_tickets_status ON order_tickets(status);
      CREATE INDEX IF NOT EXISTS idx_order_tickets_display_status ON order_tickets(display_status);
    `);

    // order_items 테이블이 존재하는 경우만 확장
    const itemsTableExists = await client.query(`
      SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'order_items');
    `);

    if (itemsTableExists.rows[0].exists) {
      await client.query(`
        ALTER TABLE order_items 
        ADD COLUMN IF NOT EXISTS ticket_id INTEGER,
        ADD COLUMN IF NOT EXISTS item_status VARCHAR(20) DEFAULT 'PENDING',
        ADD COLUMN IF NOT EXISTS cook_station VARCHAR(50) DEFAULT 'KITCHEN',
        ADD COLUMN IF NOT EXISTS cancel_reason TEXT;
      `);

      // 제약조건 추가 (이미 있으면 무시)
      try {
        await client.query(`
          ALTER TABLE order_items 
          ADD CONSTRAINT chk_item_status 
          CHECK (item_status IN ('PENDING', 'COOKING', 'DONE', 'CANCELED'));
        `);
      } catch (err) {
        // 제약조건이 이미 있으면 무시
      }

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_order_items_ticket_id ON order_items(ticket_id);
        CREATE INDEX IF NOT EXISTS idx_order_items_item_status ON order_items(item_status);
        CREATE INDEX IF NOT EXISTS idx_order_items_cook_station ON order_items(cook_station);
      `);
    }

    // kds_events 테이블 (로그)
    await client.query(`
      CREATE TABLE IF NOT EXISTS kds_events (
        id SERIAL PRIMARY KEY,
        store_id INTEGER,
        ticket_id INTEGER,
        order_id INTEGER,
        event_type VARCHAR(50) NOT NULL,
        actor_type VARCHAR(20) DEFAULT 'USER',
        actor_id VARCHAR(50) DEFAULT 'unknown',
        payload JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_kds_events_store_id ON kds_events(store_id);
      CREATE INDEX IF NOT EXISTS idx_kds_events_created_at ON kds_events(created_at);
    `);

    await client.query('COMMIT');
    console.log('✅ KDS 테이블 생성 완료');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ KDS 테이블 생성 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

// =================== 주문 생성 시 자동 티켓 생성 함수 ===================
async function createOrderTickets(orderId, storeId, sourceSystem = 'TLL') {
  const client = await pool.connect();

  try {
    console.log(`🎫 주문 ${orderId}에 대한 KDS 티켓 생성 시작`);

    await client.query('BEGIN');

    // 주문 정보 조회
    const orderResult = await client.query(`
      SELECT o.*, u.name as customer_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = $1
    `, [orderId]);

    if (orderResult.rows.length === 0) {
      throw new Error('주문을 찾을 수 없습니다');
    }

    const order = orderResult.rows[0];

    // 티켓 생성 (배치 단위)
    const ticketResult = await client.query(`
      INSERT INTO order_tickets (
        order_id, batch_no, status, payment_type,
        print_status, display_status, created_at, updated_at
      )
      VALUES ($1, 1, 'PENDING', 'POSTPAID', 'WAITING', 'VISIBLE', NOW(), NOW())
      RETURNING id
    `, [orderId]);

    const ticketId = ticketResult.rows[0].id;

    // 모든 order_items에 ticket_id 할당
    await client.query(`
      UPDATE order_items 
      SET 
        ticket_id = $1,
        item_status = 'PENDING',
        cook_station = COALESCE(cook_station, 'KITCHEN')
      WHERE order_id = $2
    `, [ticketId, orderId]);

    // 이벤트 로그
    await client.query(`
      INSERT INTO kds_events (
        store_id, ticket_id, order_id, event_type,
        actor_type, actor_id, payload, created_at
      )
      VALUES ($1, $2, $3, 'TICKET_CREATED', 'SYSTEM', $4, $5, NOW())
    `, [
      storeId,
      ticketId,
      orderId,
      sourceSystem.toLowerCase(),
      JSON.stringify({
        source_system: sourceSystem,
        customer_name: order.customer_name || '고객',
        table_number: order.table_number || 1
      })
    ]);

    await client.query('COMMIT');

    // 실시간 알림
    try {
      await pool.query(`
        SELECT pg_notify('kds_updates', $1)
      `, [JSON.stringify({
        type: 'new_ticket',
        store_id: parseInt(storeId),
        ticket_id: ticketId,
        order_id: parseInt(orderId),
        source_system: sourceSystem,
        timestamp: Date.now()
      })]);
    } catch (notifyError) {
      console.warn('⚠️ 실시간 알림 실패:', notifyError.message);
    }

    console.log(`✅ KDS 티켓 생성 완료: 티켓 ID ${ticketId}`);
    
    return {
      success: true,
      message: 'KDS 티켓 생성 완료',
      ticket_id: ticketId
    };

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ KDS 티켓 생성 실패:', error);
    throw error;
  } finally {
    client.release();
  }
}

// =================== 외부 호출용 티켓 생성 API ===================
router.post('/create-tickets', async (req, res) => {
  try {
    const { order_id, store_id, source_system = 'TLL' } = req.body;

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
