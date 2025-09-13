
const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

// PostgreSQL 연결 풀
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// =================== 스테이션 조회 ===================
router.get('/stations/:store_id', async (req, res) => {
  const { store_id } = req.params;

  try {
    const result = await pool.query(`
      SELECT DISTINCT cook_station as station_name
      FROM order_items 
      WHERE cook_station IS NOT NULL 
        AND cook_station != ''
        AND EXISTS (
          SELECT 1 FROM orders o 
          WHERE o.id = order_items.order_id 
          AND o.store_id = $1
        )
      ORDER BY cook_station
    `, [store_id]);

    const stations = result.rows.map(row => ({
      name: row.station_name,
      display_name: row.station_name === 'KITCHEN' ? '주방' : 
                    row.station_name === 'DRINK' ? '음료' : row.station_name
    }));

    res.json({
      success: true,
      stations: stations,
      timestamp: Date.now(),
      store_id: parseInt(store_id)
    });

  } catch (error) {
    console.error('❌ KDS 스테이션 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '스테이션 조회 실패',
      message: error.message
    });
  }
});

// =================== 티켓 조회 ===================
router.get('/tickets/:store_id', async (req, res) => {
  const { store_id } = req.params;
  const { station } = req.query;

  try {
    let stationFilter = '';
    if (station && station !== 'ALL') {
      stationFilter = 'AND oi.cook_station = $2';
    }

    const query = `
      SELECT 
        ot.id AS ticket_id,
        ot.status,
        ot.created_at,
        ot.updated_at,
        o.id AS order_id,
        CONCAT('테이블 ', COALESCE(o.table_num, 1)) AS table_label,
        json_agg(
          json_build_object(
            'id', oi.id,
            'name', oi.name,
            'quantity', oi.quantity,
            'cook_station', oi.cook_station,
            'status', oi.status,
            'notes', oi.notes
          ) ORDER BY oi.id
        ) FILTER (WHERE oi.id IS NOT NULL ${station && station !== 'ALL' ? 'AND oi.cook_station = $2' : ''}) AS items
      FROM orders o
      INNER JOIN order_tickets ot ON ot.order_id = o.id
      LEFT JOIN order_items oi ON oi.ticket_id = ot.id
      WHERE o.store_id = $1 
        AND ot.status IN ('PENDING', 'COOKING', 'DONE')
        AND ot.display_status = 'VISIBLE'
        ${stationFilter}
      GROUP BY ot.id, ot.status, ot.created_at, ot.updated_at, o.id, o.table_num
      HAVING COUNT(oi.id) > 0
      ORDER BY 
        CASE ot.status 
          WHEN 'COOKING' THEN 1 
          WHEN 'PENDING' THEN 2 
          WHEN 'DONE' THEN 3 
        END,
        ot.created_at ASC
    `;

    const params = station && station !== 'ALL' ? [store_id, station] : [store_id];
    const result = await pool.query(query, params);

    console.log(`✅ 티켓 로드 완료: ${result.rows.length} 개`);

    res.json({
      success: true,
      tickets: result.rows,
      count: result.rows.length,
      timestamp: Date.now(),
      store_id: parseInt(store_id)
    });

  } catch (error) {
    console.error('❌ KDS 티켓 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '티켓 조회 실패',
      message: error.message
    });
  }
});

// =================== 티켓 상태 업데이트 ===================
router.patch('/tickets/:ticket_id/status', async (req, res) => {
  const { ticket_id } = req.params;
  const { status, item_id, store_id } = req.body;

  try {
    if (item_id) {
      // 개별 아이템 상태 업데이트
      await pool.query(`
        UPDATE order_items 
        SET status = $1, updated_at = NOW() 
        WHERE id = $2
      `, [status, item_id]);

      console.log(`✅ 아이템 상태 업데이트: ${item_id} -> ${status}`);
    } else {
      // 전체 티켓 상태 업데이트
      await pool.query(`
        UPDATE order_tickets 
        SET status = $1, updated_at = NOW() 
        WHERE id = $2
      `, [status, ticket_id]);

      console.log(`✅ 티켓 상태 업데이트: ${ticket_id} -> ${status}`);
    }

    // WebSocket으로 실시간 알림 전송
    if (global.broadcastKDSUpdate && store_id) {
      global.broadcastKDSUpdate(store_id, 'status_updated', {
        ticket_id: parseInt(ticket_id),
        item_id: item_id ? parseInt(item_id) : null,
        status: status,
        timestamp: Date.now()
      });
    }

    res.json({
      success: true,
      ticket_id: parseInt(ticket_id),
      item_id: item_id ? parseInt(item_id) : null,
      status: status,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('❌ KDS 상태 업데이트 실패:', error);
    res.status(500).json({
      success: false,
      error: '상태 업데이트 실패',
      message: error.message
    });
  }
});

// =================== 티켓 숨김 처리 ===================
router.patch('/tickets/:ticket_id/hide', async (req, res) => {
  const { ticket_id } = req.params;
  const { store_id } = req.body;

  try {
    await pool.query(`
      UPDATE order_tickets 
      SET display_status = 'HIDDEN', updated_at = NOW() 
      WHERE id = $1
    `, [ticket_id]);

    console.log(`✅ 티켓 숨김 처리: ${ticket_id}`);

    // WebSocket으로 실시간 알림 전송
    if (global.broadcastKDSUpdate && store_id) {
      global.broadcastKDSUpdate(store_id, 'ticket_hidden', {
        ticket_id: parseInt(ticket_id),
        timestamp: Date.now()
      });
    }

    res.json({
      success: true,
      ticket_id: parseInt(ticket_id),
      action: 'hidden',
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('❌ KDS 티켓 숨김 처리 실패:', error);
    res.status(500).json({
      success: false,
      error: '티켓 숨김 처리 실패',
      message: error.message
    });
  }
});

// =================== 대시보드 조회 ===================
router.get('/dashboard/:store_id', async (req, res) => {
  const { store_id } = req.params;

  try {
    const result = await pool.query(`
      SELECT 
        COUNT(CASE WHEN ot.status = 'PENDING' THEN 1 END) as pending_count,
        COUNT(CASE WHEN ot.status = 'COOKING' THEN 1 END) as cooking_count,
        COUNT(CASE WHEN ot.status = 'DONE' THEN 1 END) as done_count,
        COUNT(CASE WHEN DATE(ot.created_at) = CURRENT_DATE AND ot.status = 'DONE' THEN 1 END) as served_today,
        AVG(CASE 
          WHEN ot.status = 'DONE' AND ot.updated_at > ot.created_at 
          THEN EXTRACT(EPOCH FROM (ot.updated_at - ot.created_at))/60 
        END) as avg_cook_time_minutes,
        AVG(CASE 
          WHEN ot.status IN ('COOKING', 'DONE') 
          THEN EXTRACT(EPOCH FROM (NOW() - ot.created_at))/60 
        END) as avg_wait_time_minutes
      FROM orders o
      INNER JOIN order_tickets ot ON ot.order_id = o.id
      WHERE o.store_id = $1
        AND ot.display_status = 'VISIBLE'
        AND DATE(ot.created_at) = CURRENT_DATE
    `, [store_id]);

    if (!result.rows || result.rows.length === 0) {
      return res.json({
        success: true,
        dashboard: [{
          pending_count: 0,
          cooking_count: 0,
          done_count: 0,
          served_today: 0,
          avg_cook_time_minutes: null,
          avg_wait_time_minutes: null
        }] 
      }); 
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

module.exports = router;
