const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../db/pool');
const eventBus = require('../utils/eventBus');

/**
 * 새로운 POS 시스템 API (orders, order_tickets, order_items 스키마 사용)
 */

/**
 * [POST] /orders/confirm - POS 주문 확정 (카트 -> order_tickets/order_items 생성)
 * 비회원 포스 주문 지원 (user_id, guest_phone NULL)
 * TLL 연동 지원 (mergeWithExisting)
 */
router.post('/orders/confirm', async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      storeId,
      tableNumber,
      items,
      totalAmount,
      orderType,
      isGuestOrder = true,
      mergeWithExisting = false,
      existingOrderId = null
    } = req.body;

    console.log(`🛒 POS 주문 확정: 매장 ${storeId}, 테이블 ${tableNumber}, ${items.length}개 아이템 (비회원: ${isGuestOrder})`);

    if (!storeId || !tableNumber || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: '필수 정보가 누락되었습니다'
      });
    }

    await client.query('BEGIN');

    // 1. TLL 연동 여부에 따른 주문 처리
    let orderId;

    if (mergeWithExisting && existingOrderId) {
      // TLL 연동: 기존 주문에 추가
      console.log(`🔗 TLL 연동 주문: 기존 주문 ${existingOrderId}에 POS 주문 추가`);

      // 기존 주문 존재 및 is_mixed 상태 확인
      const existingOrderCheck = await client.query(`
        SELECT id, is_mixed, session_status, source, total_price
        FROM orders
        WHERE id = $1 AND session_status = 'OPEN'
      `, [existingOrderId]);

      if (existingOrderCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: '연동할 기존 주문을 찾을 수 없습니다'
        });
      }

      const existingOrder = existingOrderCheck.rows[0];

      if (!existingOrder.is_mixed) {
        return res.status(400).json({
          success: false,
          error: '해당 주문은 연동이 활성화되지 않았습니다'
        });
      }

      if (existingOrder.source !== 'TLL') {
        return res.status(400).json({
          success: false,
          error: 'TLL 주문이 아닙니다'
        });
      }

      orderId = existingOrderId;

      // 기존 주문 금액 업데이트
      await client.query(`
        UPDATE orders
        SET total_price = COALESCE(total_price, 0) + $1,
            updated_at = NOW()
        WHERE id = $2
      `, [totalAmount, orderId]);

      console.log(`✅ TLL 연동 주문에 POS 주문 추가: 주문 ${orderId}, 추가 금액 ${totalAmount}원`);
    } else {
      // 일반 처리: 해당 테이블의 활성 주문 확인 또는 생성
      const existingOrderResult = await client.query(`
        SELECT id FROM orders
        WHERE store_id = $1 AND table_num = $2 AND session_status = 'OPEN'
        ORDER BY created_at DESC
        LIMIT 1
      `, [storeId, tableNumber]);

      if (existingOrderResult.rows.length > 0) {
        // 기존 주문에 추가
        orderId = existingOrderResult.rows[0].id;
        console.log(`📋 기존 주문 ${orderId}에 추가`);

        // 기존 주문 금액 업데이트
        await client.query(`
          UPDATE orders
          SET total_price = COALESCE(total_price, 0) + $1,
              updated_at = NOW()
          WHERE id = $2
        `, [totalAmount, orderId]);
      } else {
        // 새 주문 생성 (비회원 POS 주문: user_id, guest_phone NULL)
        const orderResult = await client.query(`
          INSERT INTO orders (
            store_id,
            table_num,
            user_id,
            guest_phone,
            source,
            status,
            payment_status,
            total_price,
            created_at
          ) VALUES ($1, $2, NULL, NULL, 'POS', 'OPEN', 'PENDING', $3, NOW())
          RETURNING id
        `, [storeId, tableNumber, totalAmount]);

        orderId = orderResult.rows[0].id;
        console.log(`📋 새 비회원 POS 주문 ${orderId} 생성 (user_id: NULL, guest_phone: NULL)`);

        // store_tables의 processing_order_id 또는 spare_processing_order_id 업데이트 (이중 주문 처리 로직)
        const currentTableResult = await client.query(`
          SELECT processing_order_id, spare_processing_order_id, status
          FROM store_tables
          WHERE store_id = $1 AND (id = $2 OR table_number = $2)
        `, [storeId, tableNumber]);

        if (currentTableResult.rows.length > 0) {
          const currentTable = currentTableResult.rows[0];
          const hasMainOrder = currentTable.processing_order_id !== null;
          const hasSpareOrder = currentTable.spare_processing_order_id !== null;

          // 레거시 시스템과 동일한 이중 주문 처리 로직
          if (!hasMainOrder) {
            // processing_order_id가 비어있으면 메인 주문으로 설정
            await client.query(`
              UPDATE store_tables
              SET processing_order_id = $1,
                  status = 'OCCUPIED',
                  updated_at = CURRENT_TIMESTAMP
              WHERE store_id = $2 AND (id = $3 OR table_number = $3)
            `, [orderId, storeId, tableNumber]);
            console.log(`📋 POS 새 주문 - 메인 주문으로 설정: 테이블 ${tableNumber}, 주문 ${orderId}`);
          } else if (!hasSpareOrder) {
            // processing_order_id가 존재하지만 spare_processing_order_id가 비어있으면 보조 주문으로 설정 (2개 주문까지 허용)
            await client.query(`
              UPDATE store_tables
              SET spare_processing_order_id = $1,
                  updated_at = CURRENT_TIMESTAMP
              WHERE store_id = $2 AND (id = $3 OR table_number = $3)
            `, [orderId, storeId, tableNumber]);
            console.log(`📋 POS 새 주문 - 보조 주문으로 설정: 테이블 ${tableNumber}, 기존 메인 주문 ${currentTable.processing_order_id}, 새 보조 주문 ${orderId}`);
          } else {
            // 레거시 시스템과 동일: 2개 주문 초과 시 경고만 출력하고 처리하지 않음
            console.warn(`⚠️ POS 새 주문 - 테이블에 이미 2개 주문 존재, 추가 주문 거부: 테이블 ${tableNumber}, 메인: ${currentTable.processing_order_id}, 보조: ${currentTable.spare_processing_order_id}`);
            await client.query('ROLLBACK');
            return res.status(409).json({
              success: false,
              error: '해당 테이블에 이미 2개의 활성 주문이 존재합니다. 더 이상 주문을 받을 수 없습니다.',
              tableStatus: {
                processing_order_id: currentTable.processing_order_id,
                spare_processing_order_id: currentTable.spare_processing_order_id
              }
            });
          }
        } else {
          // 테이블을 찾을 수 없는 경우 에러 로깅
          console.error(`❌ POS 새 주문 - 테이블을 찾을 수 없음: 매장 ${storeId}, 테이블 ${tableNumber}`);
          await client.query('ROLLBACK');
          return res.status(404).json({
            success: false,
            error: '테이블을 찾을 수 없습니다'
          });
        }
      }
    }

    // 2. order_tickets 테이블에 티켓 생성
    const ticketResult = await client.query(`
      INSERT INTO order_tickets (
        order_id,
        store_id,
        batch_no,
        status,
        payment_type,
        source,
        table_num,
        created_at,
        paid_status
      ) VALUES ($1, $2,
        (SELECT COALESCE(MAX(batch_no), 0) + 1 FROM order_tickets WHERE order_id = $1),
        'PENDING', 'POSTPAID', 'POS', $3, NOW(), 'UNPAID')
      RETURNING id, batch_no
    `, [orderId, storeId, tableNumber]);

    const { id: ticketId, batch_no: batchNo } = ticketResult.rows[0];

    // 3. order_items 테이블에 주문 아이템들 생성
    for (const item of items) {
      await client.query(`
        INSERT INTO order_items (
          order_id,
          ticket_id,
          menu_name,
          unit_price,
          quantity,
          total_price,
          item_status,
          cook_station,
          created_at,
          menu_id,
          store_id
        ) VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', $7, NOW(), $8, $9)
      `, [
        orderId,
        ticketId,
        item.name,
        item.price,
        item.quantity,
        item.price * item.quantity,
        item.cook_station || 'KITCHEN',
        item.id,
        item.store_id
      ]);
    }

    await client.query('COMMIT');

    console.log(`✅ POS 주문 확정 완료: 주문 ID ${orderId}, 티켓 ID ${ticketId}, 배치 ${batchNo}`);

    // SSE 브로드캐스트 (레거시 호환성)
    if (global.broadcastPOSTableUpdate) {
      try {
        await global.broadcastPOSTableUpdate(storeId, tableNumber);
        console.log(`📡 SSE 테이블 업데이트 브로드캐스트 완료: 매장 ${storeId}, 테이블 ${tableNumber}`);
      } catch (sseError) {
        console.warn('⚠️ SSE 브로드캐스트 실패:', sseError.message);
      }
    } else {
      console.warn('⚠️ global.broadcastPOSTableUpdate 함수가 등록되지 않음');
    }

    res.json({
      success: true,
      orderId: orderId,
      ticketId: ticketId,
      batchNo: batchNo,
      isMergedWithTLL: mergeWithExisting && existingOrderId ? true : false,
      isGuestOrder: !mergeWithExisting,
      message: mergeWithExisting ? 'TLL 주문에 POS 주문이 추가되었습니다' : '주문이 성공적으로 확정되었습니다'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ POS 주문 확정 실패:', error);
    res.status(500).json({
      success: false,
      error: '주문 확정 중 오류가 발생했습니다: ' + error.message
    });
  } finally {
    client.release();
  }
});

/**
 * [POST] /guest-orders/confirm - 비회원 POS 주문 확정 전용 API
 * TLL 연동되지 않은 테이블에서의 비회원 주문 처리
 */
router.post('/guest-orders/confirm', async (req, res) => {
  const client = await pool.connect();

  try {
    const { storeId, tableNumber, items, totalAmount } = req.body;

    console.log(`👤 비회원 POS 주문 확정: 매장 ${storeId}, 테이블 ${tableNumber}, ${items.length}개 아이템`);

    if (!storeId || !tableNumber || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: '필수 정보가 누락되었습니다'
      });
    }

    await client.query('BEGIN');

    // 1. 해당 테이블의 기존 비회원 주문 확인
    let orderId;

    const existingOrderResult = await client.query(`
      SELECT id FROM orders
      WHERE store_id = $1
        AND table_num = $2
        AND session_status = 'OPEN'
        AND user_id IS NULL
        AND guest_phone IS NULL
        AND source = 'POS'
      ORDER BY created_at DESC
      LIMIT 1
    `, [storeId, tableNumber]);

    if (existingOrderResult.rows.length > 0) {
      // 기존 비회원 주문에 추가
      orderId = existingOrderResult.rows[0].id;
      console.log(`📋 기존 비회원 주문 ${orderId}에 추가`);

      // 기존 주문 금액 업데이트
      await client.query(`
        UPDATE orders
        SET total_price = COALESCE(total_price, 0) + $1,
            updated_at = NOW()
        WHERE id = $2
      `, [totalAmount, orderId]);
    } else {
      // 새 비회원 주문 생성
      const orderResult = await client.query(`
        INSERT INTO orders (
          store_id,
          table_num,
          user_id,
          guest_phone,
          source,
          session_status,
          payment_status,
          total_price,
          created_at
        ) VALUES ($1, $2, NULL, NULL, 'POS', 'OPEN', 'PENDING', $3, NOW())
        RETURNING id
      `, [storeId, tableNumber, totalAmount]);

      orderId = orderResult.rows[0].id;
      console.log(`📋 새 비회원 POS 주문 ${orderId} 생성`);

      // store_tables의 processing_order_id 또는 spare_processing_order_id 업데이트 (이중 주문 처리 로직)
      const currentTableResult = await client.query(`
        SELECT processing_order_id, spare_processing_order_id, status
        FROM store_tables
        WHERE store_id = $1 AND id = $2
      `, [storeId, tableNumber]);

      if (currentTableResult.rows.length > 0) {
        const currentTable = currentTableResult.rows[0];
        const hasMainOrder = currentTable.processing_order_id !== null;
        const hasSpareOrder = currentTable.spare_processing_order_id !== null;

        // 레거시 시스템과 동일한 이중 주문 처리 로직
        if (!hasMainOrder) {
          // processing_order_id가 비어있으면 메인 주문으로 설정
          await client.query(`
            UPDATE store_tables
            SET processing_order_id = $1,
                status = 'OCCUPIED',
                updated_at = CURRENT_TIMESTAMP
            WHERE store_id = $2 AND id = $3
          `, [orderId, storeId, tableNumber]);
          console.log(`📋 비회원 POS 주문 - 메인 주문으로 설정: 테이블 ${tableNumber}, 주문 ${orderId}`);
        } else if (!hasSpareOrder) {
          // processing_order_id가 존재하지만 spare_processing_order_id가 비어있으면 보조 주문으로 설정 (2개 주문까지 허용)
          await client.query(`
            UPDATE store_tables
            SET spare_processing_order_id = $1,
                status = 'OCCUPIED',
                updated_at = CURRENT_TIMESTAMP
            WHERE store_id = $2 AND id = $3
          `, [orderId, storeId, tableNumber]);
          console.log(`📋 비회원 POS 주문 - 보조 주문으로 설정: 테이블 ${tableNumber}, 기존 메인 주문 ${currentTable.processing_order_id}, 새 보조 주문 ${orderId}`);
        } else {
          // 레거시 시스템과 동일: 2개 주문 초과 시 경고 및 처리 거부
          console.warn(`⚠️ 비회원 POS 주문 - 테이블에 이미 2개 주문 존재, 추가 주문 거부: 테이블 ${tableNumber}`);
          await client.query('ROLLBACK');
          return res.status(409).json({
            success: false,
            error: '해당 테이블에 이미 2개의 활성 주문이 존재합니다. 더 이상 주문을 받을 수 없습니다.',
            tableStatus: {
              processing_order_id: currentTable.processing_order_id,
              spare_processing_order_id: currentTable.spare_processing_order_id
            }
          });
        }
      } else {
        // 테이블을 찾을 수 없는 경우 에러 로깅 및 응답
        console.error(`❌ 비회원 POS 주문 - 테이블을 찾을 수 없음: 매장 ${storeId}, 테이블 ${tableNumber}`);
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          error: '테이블을 찾을 수 없습니다'
        });
      }
    }

    // 2. order_tickets 테이블에 티켓 생성
    const ticketResult = await client.query(`
      INSERT INTO order_tickets (
        order_id,
        store_id,
        batch_no,
        status,
        payment_type,
        source,
        table_num,
        created_at,
        paid_status
      ) VALUES ($1, $2,
        (SELECT COALESCE(MAX(batch_no), 0) + 1 FROM order_tickets WHERE order_id = $1),
        'PENDING', 'POSTPAID', 'POS', $3, NOW(), 'UNPAID')
      RETURNING id, batch_no
    `, [orderId, storeId, tableNumber]);

    const { id: ticketId, batch_no: batchNo } = ticketResult.rows[0];

    // 3. order_items 테이블에 주문 아이템들 생성
    for (const item of items) {
      await client.query(`
        INSERT INTO order_items (
          order_id,
          ticket_id,
          menu_name,
          unit_price,
          quantity,
          total_price,
          item_status,
          cook_station,
          created_at,
          menu_id,
          store_id
        ) VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', $7, NOW(), $8, $9)
      `, [
        orderId,
        ticketId,
        item.name,
        item.price,
        item.quantity,
        item.price * item.quantity,
        item.cook_station || 'KITCHEN',
        item.id,
        storeId
      ]);
    }

    await client.query('COMMIT');

    console.log(`✅ 비회원 POS 주문 확정 완료: 주문 ID ${orderId}, 티켓 ID ${ticketId}, 배치 ${batchNo}`);

    // SSE 브로드캐스트 (레거시 호환성)
    if (global.broadcastPOSTableUpdate) {
      try {
        await global.broadcastPOSTableUpdate(storeId, tableNumber);
        console.log(`📡 SSE 테이블 업데이트 브로드캐스트 완료: 매장 ${storeId}, 테이블 ${tableNumber}`);
      } catch (sseError) {
        console.warn('⚠️ SSE 브로드캐스트 실패:', sseError.message);
      }
    } else {
      console.warn('⚠️ global.broadcastPOSTableUpdate 함수가 등록되지 않음');
    }

    res.json({
      success: true,
      orderId: orderId,
      ticketId: ticketId,
      batchNo: batchNo,
      isGuestOrder: true,
      message: '비회원 주문이 성공적으로 확정되었습니다'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 비회원 POS 주문 확정 실패:', error);
    res.status(500).json({
      success: false,
      error: '비회원 주문 확정 중 오류가 발생했습니다: ' + error.message
    });
  } finally {
    client.release();
  }
});


/**
 * [GET] /stores/:storeId/menu - 매장 메뉴 조회
 */
router.get('/stores/:storeId/menu', async (req, res) => {
  try {
    const { storeId } = req.params;

    console.log(`🍽️ POS 매장 ${storeId} 메뉴 조회 요청`);

    // 매장 존재 확인
    const storeResult = await pool.query(`
      SELECT id, name FROM stores WHERE id = $1
    `, [storeId]);

    if (storeResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '매장을 찾을 수 없습니다'
      });
    }

    // store_menu 테이블에서 메뉴 조회
    const menuResult = await pool.query(`
      SELECT
        id,
        name,
        price,
        description,
        cook_station as category
      FROM store_menu
      WHERE store_id = $1
      ORDER BY id ASC
    `, [storeId]);

    const menu = menuResult.rows.length > 0 ? menuResult.rows : getDefaultMenu();

    console.log(`✅ POS 매장 ${storeId} 메뉴 ${menu.length}개 조회 완료`);

    res.json({
      success: true,
      menu: menu
    });

  } catch (error) {
    console.error('❌ POS 메뉴 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: 'POS 메뉴 조회 실패',
      details: error.message
    });
  }
});

/**
 * [GET] /stores/:storeId/orders/active - 매장의 활성 주문들 (교차 주문 지원)
 */
router.get('/stores/:storeId/orders/active', async (req, res) => {
  try {
    const { storeId } = req.params;

    console.log(`📊 매장 ${storeId} 활성 주문 조회 (교차 주문 지원)`);

    // 메인 주문 조회
    const mainOrdersResult = await pool.query(`
      SELECT
        st.id as table_number,
        o.id as order_id,
        COALESCE(u.name, '포스고객') as customer_name,
        o.user_id,
        o.total_price as total_amount,
        o.session_status,
        o.created_at as opened_at,
        o.source as source_system,
        COUNT(oi.id) as item_count,
        'main' as order_type,
        st.spare_processing_order_id
      FROM store_tables st
      JOIN orders o ON st.processing_order_id = o.id
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id AND oi.item_status != 'CANCELED'
      WHERE st.store_id = $1 AND st.processing_order_id IS NOT NULL
      GROUP BY st.id, o.id, u.name, o.user_id,
               o.total_price, o.session_status, o.created_at, o.source, st.spare_processing_order_id
    `, [storeId]);

    // 보조 주문 조회
    const spareOrdersResult = await pool.query(`
      SELECT
        st.id as table_number,
        o.id as order_id,
        COALESCE(u.name, '포스고객') as customer_name,
        o.user_id,
        o.total_price as total_amount,
        o.session_status,
        o.created_at as opened_at,
        o.source as source_system,
        COUNT(oi.id) as item_count,
        'spare' as order_type
      FROM store_tables st
      JOIN orders o ON st.spare_processing_order_id = o.id
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id AND oi.item_status != 'CANCELED'
      WHERE st.store_id = $1 AND st.spare_processing_order_id IS NOT NULL
      GROUP BY st.id, o.id, u.name, o.user_id,
               o.total_price, o.session_status, o.created_at, o.source
    `, [storeId]);

    // 결과 통합 및 교차 주문 표시
    const activeOrders = [];

    // 메인 주문 처리
    mainOrdersResult.rows.forEach(row => {
      const hasSpareOrder = row.spare_processing_order_id !== null;

      activeOrders.push({
        checkId: row.order_id,
        tableNumber: row.table_number,
        customerName: row.customer_name,
        isGuest: !row.user_id,
        totalAmount: row.total_amount || 0,
        status: row.status,
        openedAt: row.opened_at,
        sourceSystem: row.source_system,
        itemCount: parseInt(row.item_count),
        orderType: 'main',
        isCrossOrder: hasSpareOrder // 교차 주문 여부
      });
    });

    // 보조 주문 처리
    spareOrdersResult.rows.forEach(row => {
      activeOrders.push({
        checkId: row.order_id,
        tableNumber: row.table_number,
        customerName: row.customer_name,
        isGuest: !row.user_id,
        totalAmount: row.total_amount || 0,
        status: row.status,
        openedAt: row.opened_at,
        sourceSystem: row.source_system,
        itemCount: parseInt(row.item_count),
        orderType: 'spare',
        isCrossOrder: true // 보조 주문은 항상 교차 주문
      });
    });

    // 테이블 번호와 주문 생성 시간으로 정렬
    activeOrders.sort((a, b) => {
      if (a.tableNumber !== b.tableNumber) {
        return a.tableNumber - b.tableNumber;
      }
      return new Date(a.openedAt) - new Date(b.openedAt);
    });

    console.log(`✅ 매장 ${storeId} 활성 주문 ${activeOrders.length}개 조회 완료 (교차 주문 포함)`);

    res.json({
      success: true,
      activeOrders: activeOrders
    });

  } catch (error) {
    console.error('❌ 활성 주문 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '활성 주문 조회 실패'
    });
  }
});

/**
 * [GET] /stores/:storeId/table/:tableNumber/all-orders - 테이블별 모든 주문 조회
 */
router.get('/stores/:storeId/table/:tableNumber/all-orders', async (req, res) => {
  try {
    const { storeId, tableNumber } = req.params;

    // 파라미터 검증
    const parsedStoreId = parseInt(storeId);
    const parsedTableNumber = parseInt(tableNumber);

    if (isNaN(parsedStoreId) || isNaN(parsedTableNumber)) {
      return res.status(400).json({
        success: false,
        error: `유효하지 않은 파라미터: storeId=${storeId}, tableNumber=${tableNumber}`
      });
    }

    console.log(`📋 테이블 ${parsedTableNumber} 주문 조회 요청 (매장 ${parsedStoreId})`);

    // 해당 테이블의 활성 주문들 조회 (UNPAID 상태만)
    const ordersResult = await pool.query(`
      SELECT
        o.id as order_id,
        ot.id as ticket_id,
        o.status,
        o.created_at,
        o.user_id,
        COALESCE(u.name, '포스고객') as customer_name,
        o.total_price as final_amount
      FROM orders o
      JOIN order_tickets ot ON o.id = ot.order_id
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.store_id = $1
        AND o.table_num = $2
        AND o.session_status = 'OPEN'
        AND ot.paid_status = 'UNPAID'
      ORDER BY o.created_at DESC
      LIMIT 1
    `, [parsedStoreId, parsedTableNumber]);

    if (ordersResult.rows.length === 0) {
      console.log(`ℹ️ 테이블 ${tableNumber}에 활성 주문 없음`);
      return res.json({
        success: true,
        currentSession: null,
        items: []
      });
    }

    const currentOrder = ordersResult.rows[0];

    // 주문 아이템들 조회
    const itemsResult = await pool.query(`
      SELECT
        oi.id,
        oi.menu_name as "menuName",
        oi.unit_price as price,
        oi.quantity,
        oi.item_status as "cookingStatus",
        oi.created_at,
        oi.options
      FROM order_items oi
      WHERE oi.ticket_id = $1 AND oi.item_status != 'CANCELED'
      ORDER BY oi.created_at ASC
    `, [currentOrder.order_id]);

    const items = itemsResult.rows.map(item => ({
      id: item.id,
      menuName: item.menuName,
      price: item.price,
      quantity: item.quantity,
      cookingStatus: item.cookingStatus,
      created_at: item.created_at,
      isConfirmed: true,
      sessionId: currentOrder.ticket_id
    }));

    console.log(`✅ 테이블 ${tableNumber} 주문 ${items.length}개 조회 완료`);

    res.json({
      success: true,
      currentSession: {
        orderId: currentOrder.order_id,
        checkId: currentOrder.ticket_id,
        status: currentOrder.status,
        customerName: currentOrder.customer_name,
        totalAmount: currentOrder.final_amount || 0,
        items: items
      }
    });

  } catch (error) {
    console.error('❌ 테이블 주문 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '테이블 주문 조회 실패: ' + error.message
    });
  }
});

/**
 * [GET] /stores/:storeId/table/:tableNumber/order-items - 테이블별 order_items 조회 (수량 통합용)
 */
router.get('/stores/:storeId/table/:tableNumber/order-items', async (req, res) => {
  try {
    const { storeId, tableNumber } = req.params;

    // 파라미터 검증
    const parsedStoreId = parseInt(storeId);
    const parsedTableNumber = parseInt(tableNumber);

    if (isNaN(parsedStoreId) || isNaN(parsedTableNumber)) {
      return res.status(400).json({
        success: false,
        error: `유효하지 않은 파라미터: storeId=${storeId}, tableNumber=${tableNumber}`
      });
    }

    console.log(`📋 POS order_items 조회 (미지불만): 매장 ${parsedStoreId}, 테이블 ${parsedTableNumber}`);

    // 먼저 해당 테이블의 모든 티켓 상태 확인 (디버깅용)
    const debugResult = await pool.query(`
      SELECT
        ot.id as ticket_id,
        ot.paid_status,
        ot.source,
        o.session_status as order_status,
        COUNT(oi.id) as item_count
      FROM order_tickets ot
      JOIN orders o ON ot.order_id = o.id
      LEFT JOIN order_items oi ON ot.id = oi.ticket_id
      WHERE o.store_id = $1 AND o.table_num = $2
      GROUP BY ot.id, ot.paid_status, ot.source, o.session_status
      ORDER BY ot.created_at DESC
    `, [parsedStoreId, parsedTableNumber]);

    console.log(`🔍 테이블 ${parsedTableNumber} 모든 티켓 상태:`, debugResult.rows);

    // 해당 테이블의 order_items 조회 (POS 소스, UNPAID + OPEN 상태만 확실히 필터링)
    const result = await pool.query(`
      SELECT
        oi.id,
        oi.menu_id,
        oi.menu_name,
        oi.unit_price,
        oi.quantity,
        oi.total_price,
        oi.item_status,
        oi.cook_station,
        oi.ticket_id,
        oi.created_at,
        ot.order_id,
        ot.paid_status,
        o.session_status as order_status
      FROM order_items oi
      JOIN order_tickets ot ON oi.ticket_id = ot.id
      JOIN orders o ON ot.order_id = o.id
      WHERE o.store_id = $1
        AND o.table_num = $2
        AND ot.source = 'POS'
        AND ot.paid_status = 'UNPAID'  -- 반드시 미지불만
        AND ot.paid_status != 'PAID'   -- PAID 상태 명시적 배제
        AND o.session_status = 'OPEN'
        AND oi.item_status NOT IN ('CANCELED', 'REFUNDED')
      ORDER BY oi.created_at ASC
    `, [parsedStoreId, parsedTableNumber]);

    // 결과에서 PAID 상태 완전 제거 (이중 체크)
    const filteredResults = result.rows.filter(item => {
      const isPaid = item.paid_status === 'PAID';
      if (isPaid) {
        console.warn(`⚠️ PAID 상태 아이템 발견 및 제거:`, {
          ticket_id: item.ticket_id,
          menu_name: item.menu_name,
          paid_status: item.paid_status
        });
      }
      return !isPaid && item.paid_status === 'UNPAID';
    });

    console.log(`✅ POS 미지불 order_items ${filteredResults.length}개 조회 완료 (원본: ${result.rows.length}개)`);

    // 디버깅용 로그 추가
    if (filteredResults.length > 0) {
      console.log(`🔍 첫 번째 아이템 상태:`, {
        paid_status: filteredResults[0].paid_status,
        order_status: filteredResults[0].order_status,
        item_status: filteredResults[0].item_status
      });
    }

    // 각 아이템의 결제 상태 확인
    filteredResults.forEach((item, index) => {
      if (item.paid_status !== 'UNPAID') {
        console.error(`❌ 비미지불 아이템 발견 [${index}]:`, {
          menu_name: item.menu_name,
          paid_status: item.paid_status,
          ticket_id: item.ticket_id
        });
      }
    });

    res.json({
      success: true,
      orderItems: filteredResults,
      count: filteredResults.length
    });

  } catch (error) {
    console.error('❌ POS order_items 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: 'order_items 조회 실패: ' + error.message
    });
  }
});

/**
 * [GET] /stores/:storeId/table/:tableNumber/tll-orders - 테이블별 TLL 주문 조회
 */
router.get('/stores/:storeId/table/:tableNumber/tll-orders', async (req, res) => {
  try {
    const { storeId, tableNumber } = req.params;

    // 파라미터 검증
    const parsedStoreId = parseInt(storeId);
    const parsedTableNumber = parseInt(tableNumber);

    if (isNaN(parsedStoreId) || isNaN(parsedTableNumber)) {
      return res.status(400).json({
        success: false,
        error: `유효하지 않은 파라미터: storeId=${storeId}, tableNumber=${tableNumber}`
      });
    }

    console.log(`📱 TLL 주문 조회: 매장 ${parsedStoreId}, 테이블 ${parsedTableNumber}`);

    // TLL 주문 조회 (order_items 기준으로 조회, TLL 소스의 모든 상태)
    const tllOrdersResult = await pool.query(`
      SELECT
        oi.id,
        oi.menu_name,
        oi.quantity,
        oi.unit_price,
        oi.total_price,
        oi.item_status,
        oi.cook_station,
        oi.order_id,
        ot.paid_status,
        ot.created_at as ticket_created_at,
        o.user_id,
        o.guest_phone,
        o.created_at as order_created_at,
        o.is_mixed
      FROM order_items oi
      JOIN order_tickets ot ON oi.ticket_id = ot.id
      JOIN orders o ON ot.order_id = o.id
      WHERE o.store_id = $1
        AND o.table_num = $2
        AND ot.source = 'TLL'
        AND oi.item_status != 'CANCELED'
        AND o.session_status = 'OPEN'
      ORDER BY oi.created_at DESC
    `, [parsedStoreId, parsedTableNumber]);

    console.log(`📱 TLL 주문 조회 결과: ${tllOrdersResult.rows.length}개 아이템 발견`);

    // 사용자 정보 조회 (첫 번째 TLL 주문의 사용자 정보 사용)
    let userInfo = null;
    if (tllOrdersResult.rows.length > 0) {
      const firstOrder = tllOrdersResult.rows[0];

      if (firstOrder.user_id) {
        // 회원 주문인 경우
        const userResult = await pool.query(`
          SELECT id, name, phone,  created_at
          FROM users
          WHERE id = $1
        `, [firstOrder.user_id]);

        if (userResult.rows.length > 0) {
          userInfo = userResult.rows[0];
          console.log(`📱 TLL 회원 사용자 정보 로드: ${userInfo.name}`);
        }
      } else if (firstOrder.guest_phone) {
        // 게스트 주문인 경우
        userInfo = {
          id: null,
          name: '게스트',
          phone: firstOrder.guest_phone,
          guest_phone: firstOrder.guest_phone,
          point: 0,
          created_at: null
        };
        console.log(`📱 TLL 게스트 사용자 정보 로드: ${userInfo.phone}`);
      }
    }

    res.json({
      success: true,
      tllOrders: tllOrdersResult.rows,
      userInfo: userInfo
    });

  } catch (error) {
    console.error('❌ TLL 주문 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: 'TLL 주문 조회 실패: ' + error.message
    });
  }
});

/**
 * [GET] /stores/:storeId/table/:tableNumber/session-status - 테이블 세션 상태 확인
 */
router.get('/stores/:storeId/table/:tableNumber/session-status', async (req, res) => {
  try {
    const { storeId, tableNumber } = req.params;

    console.log(`🔍 테이블 ${tableNumber} 세션 상태 확인 (매장 ${storeId})`);

    const result = await pool.query(`
      SELECT
        o.id,
        o.status,
        o.created_at,
        COALESCE(u.name, '포스고객') as customer_name,
        o.source,
        COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.ticket_id
      WHERE o.store_id = $1 AND o.table_num = $2 AND o.status = 'OPEN'
      GROUP BY o.id, o.status, o.created_at, u.name, o.source
      ORDER BY o.created_at DESC
    `, [storeId, tableNumber]);

    const hasActiveSession = result.rows.length > 0;
    const sessionInfo = hasActiveSession ? {
      orderId: result.rows[0].id,
      status: result.rows[0].status,
      startTime: result.rows[0].created_at,
      customerName: result.rows[0].customer_name,
      sourceSystem: result.rows[0].source,
      itemCount: parseInt(result.rows[0].item_count)
    } : null;

    console.log(`✅ 테이블 ${tableNumber} 세션 상태 확인 완료 - 활성 세션: ${hasActiveSession}`);

    res.json({
      success: true,
      hasActiveSession,
      sessionInfo
    });

  } catch (error) {
    console.error('❌ 세션 상태 확인 실패:', error);
    res.status(500).json({
      success: false,
      error: '세션 상태 확인 실패: ' + error.message
    });
  }
});

/**
 * [POST] /orders - POS 주문 생성 (기존 API - 호환성용)
 */
router.post('/orders', async (req, res) => {
  const client = await pool.connect();

  try {
    const { storeId, tableNumber, items, totalAmount, orderType } = req.body;

    console.log(`🛒 POS 주문 생성: 매장 ${storeId}, 테이블 ${tableNumber}, ${items.length}개 아이템`);

    if (!storeId || !tableNumber || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: '필수 정보가 누락되었습니다'
      });
    }

    await client.query('BEGIN');

    // 1. orders 테이블에 주문 생성
    const orderResult = await client.query(`
      INSERT INTO orders (
        store_id,
        table_num,
        source,
        status,
        payment_status,
        total_price,
        created_at
      ) VALUES ($1, $2, 'POS', 'OPEN', 'PENDING', $3, NOW())
      RETURNING id
    `, [storeId, tableNumber, totalAmount]);

    const orderId = orderResult.rows[0].id;

    // 2. order_tickets 테이블에 티켓 생성
    const ticketResult = await client.query(`
      INSERT INTO order_tickets (
        order_id,
        store_id,
        batch_no,
        status,
        payment_type,
        source,
        table_num,
        created_at,
        paid_status
      ) VALUES ($1, $2, 1, 'PENDING', 'POSTPAID', 'POS', $3, NOW(), 'UNPAID')
      RETURNING id
    `, [orderId, storeId, tableNumber]);

    const ticketId = ticketResult.rows[0].id;

    // 3. order_items 테이블에 주문 아이템들 생성
    for (const item of items) {
      await client.query(`
        INSERT INTO order_items (
          order_id,
          ticket_id,
          menu_name,
          unit_price,
          quantity,
          subtotal,
          item_status,
          options,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', $7, NOW())
      `, [
        orderId,
        ticketId,
        item.name,
        item.price,
        item.quantity,
        item.price * item.quantity,
        item.options ? JSON.stringify(item.options) : null
      ]);
    }

    await client.query('COMMIT');

    console.log(`✅ POS 주문 생성 완료: 주문 ID ${orderId}, 티켓 ID ${ticketId}`);

    res.json({
      success: true,
      orderId: orderId,
      ticketId: ticketId,
      message: '주문이 성공적으로 생성되었습니다'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ POS 주문 생성 실패:', error);
    res.status(500).json({
      success: false,
      error: '주문 생성 중 오류가 발생했습니다'
    });
  } finally {
    client.release();
  }
});



/**
 * [PUT] /orders/:orderId/enable-mixed - TLL 주문의 is_mixed 상태를 true로 변경
 */
router.put('/orders/:orderId/enable-mixed', async (req, res) => {
  const client = await pool.connect();

  try {
    const { orderId } = req.params;

    console.log(`🔗 TLL 연동 활성화 요청: 주문 ID ${orderId}`);

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: '주문 ID가 필요합니다'
      });
    }

    await client.query('BEGIN');

    // 주문 존재 및 상태 확인
    const orderCheck = await client.query(`
      SELECT id, source, session_status, is_mixed
      FROM orders
      WHERE id = $1
    `, [orderId]);

    if (orderCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '주문을 찾을 수 없습니다'
      });
    }

    const order = orderCheck.rows[0];

    if (order.source !== 'TLL') {
      return res.status(400).json({
        success: false,
        error: 'TLL 주문이 아닙니다'
      });
    }

    if (order.session_status !== 'OPEN') {
      return res.status(400).json({
        success: false,
        error: '종료된 주문은 연동할 수 없습니다'
      });
    }

    if (order.is_mixed) {
      return res.status(400).json({
        success: false,
        error: '이미 연동이 활성화된 주문입니다'
      });
    }

    // is_mixed를 true로 업데이트
    await client.query(`
      UPDATE orders
      SET is_mixed = true, updated_at = NOW()
      WHERE id = $1
    `, [orderId]);



    console.log(`✅ TLL 연동 활성화 완료: 주문 ID ${orderId}`);

    //spare_processing_order_id 업데이트
    await client.query(`
      UPDATE store_tables
      SET spare_processing_order_id = $1, updated_at = NOW()
      WHERE processing_order_id = $1
      `, [orderId]);

     await client.query('COMMIT');

     console.log(`✅ SPOI 업데이트 완료: 주문 ID ${orderId}`);

    res.json({
      success: true,
      orderId: parseInt(orderId),
      is_mixed: true,
      message: 'TLL 연동이 활성화되었습니다'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ TLL 연동 활성화 실패:', error);
    res.status(500).json({
      success: false,
      error: 'TLL 연동 활성화 중 오류가 발생했습니다: ' + error.message
    });
  } finally {
    client.release();
  }
});

/**
 * [GET] /orders/:orderId/mixed-status - TLL 주문의 is_mixed 상태 조회
 */
router.get('/orders/:orderId/mixed-status', async (req, res) => {
  try {
    const { orderId } = req.params;

    console.log(`🔍 TLL 주문 ${orderId}의 is_mixed 상태 조회`);

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: '주문 ID가 필요합니다'
      });
    }

    const result = await pool.query(`
      SELECT id, source, session_status, is_mixed, created_at, updated_at
      FROM orders
      WHERE id = $1
    `, [orderId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '주문을 찾을 수 없습니다'
      });
    }

    const order = result.rows[0];

    console.log(`✅ TLL 주문 ${orderId} 상태 조회 완료: is_mixed=${order.is_mixed}`);

    res.json({
      success: true,
      orderId: parseInt(orderId),
      source: order.source,
      session_status: order.session_status,
      is_mixed: order.is_mixed,
      created_at: order.created_at,
      updated_at: order.updated_at
    });

  } catch (error) {
    console.error('❌ TLL 주문 상태 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: 'TLL 주문 상태 조회 중 오류가 발생했습니다: ' + error.message
    });
  }
});

/**
 * [GET] /stores/:storeId/table/:tableId/shared-order - POI=SPOI인 경우 order_tickets source별 그룹핑 조회
 */
router.get('/stores/:storeId/table/:tableId/shared-order', async (req, res) => {
  try {
    const { storeId, tableId } = req.params;

    console.log(`🔍 테이블 ${tableId} 공유 주문 source별 그룹핑 조회`);

    // 파라미터 검증
    const parsedStoreId = parseInt(storeId);
    const parsedTableId = parseInt(tableId);

    if (isNaN(parsedStoreId) || isNaN(parsedTableId)) {
      return res.status(400).json({
        success: false,
        error: `유효하지 않은 파라미터: storeId=${storeId}, tableId=${tableId}`
      });
    }

    // 테이블 상태 조회 (POI=SPOI 확인)
    const tableResult = await pool.query(`
      SELECT processing_order_id, spare_processing_order_id, status
      FROM store_tables
      WHERE store_id = $1 AND id = $2
    `, [parsedStoreId, parsedTableId]);

    if (tableResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '테이블을 찾을 수 없습니다'
      });
    }

    const table = tableResult.rows[0];
    const { processing_order_id, spare_processing_order_id } = table;

    // POI=SPOI 확인
    if (!processing_order_id || processing_order_id !== spare_processing_order_id) {
      return res.json({
        success: true,
        isSharedOrder: false,
        message: 'POI와 SPOI가 다르거나 비어있음'
      });
    }

    const sharedOrderId = processing_order_id;
    console.log(`✅ 공유 주문 감지: 주문 ID ${sharedOrderId}`);

    // order_tickets를 source별로 그룹핑하여 조회
    const ticketsResult = await pool.query(`
      SELECT
        ot.id as ticket_id,
        ot.source,
        ot.paid_status,
        ot.created_at as ticket_created_at,
        oi.id as item_id,
        oi.menu_name,
        oi.quantity,
        oi.unit_price,
        oi.total_price,
        oi.item_status,
        oi.cook_station
      FROM order_tickets ot
      JOIN order_items oi ON ot.id = oi.ticket_id
      WHERE ot.order_id = $1
        AND oi.item_status != 'CANCELED'
      ORDER BY ot.source, ot.created_at, oi.created_at
    `, [sharedOrderId]);

    if (ticketsResult.rows.length === 0) {
      return res.json({
        success: true,
        isSharedOrder: true,
        sharedOrderId: sharedOrderId,
        sourceGroups: {}
      });
    }

    // source별로 그룹핑
    const sourceGroups = {};
    let totalAmount = 0;

    for (const row of ticketsResult.rows) {
      const source = row.source;

      if (!sourceGroups[source]) {
        sourceGroups[source] = {
          source: source,
          items: [],
          totalAmount: 0,
          itemCount: 0
        };
      }

      const item = {
        id: row.item_id,
        ticketId: row.ticket_id,
        menuName: row.menu_name,
        quantity: row.quantity,
        unitPrice: row.unit_price,
        totalPrice: row.total_price,
        itemStatus: row.item_status,
        cookStation: row.cook_station,
        paidStatus: row.paid_status,
        ticketCreatedAt: row.ticket_created_at,
        ticket_source: source  // 프론트엔드 호환용
      };

      sourceGroups[source].items.push(item);
      sourceGroups[source].totalAmount += row.total_price || 0;
      sourceGroups[source].itemCount += 1;
      totalAmount += row.total_price || 0;
    }

    console.log(`✅ 공유 주문 source별 그룹핑 완료: ${Object.keys(sourceGroups).length}개 source, 총 ${totalAmount}원`);

    res.json({
      success: true,
      isSharedOrder: true,
      sharedOrderId: sharedOrderId,
      sourceGroups: sourceGroups,
      totalAmount: totalAmount,
      totalItemCount: ticketsResult.rows.length
    });

  } catch (error) {
    console.error('❌ 공유 주문 source별 그룹핑 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '공유 주문 조회 실패: ' + error.message
    });
  }
});

/**
 * [GET] /stores/:storeId/table/:tableNumber/active-order - 현재 테이블의 활성 주문 조회
 */
router.get('/stores/:storeId/table/:tableNumber/active-order', async (req, res) => {
  try {
    const { storeId, tableNumber } = req.params;

    // 파라미터 검증
    const parsedStoreId = parseInt(storeId);
    const parsedTableNumber = parseInt(tableNumber);

    if (isNaN(parsedStoreId) || isNaN(parsedTableNumber)) {
      return res.status(400).json({
        success: false,
        error: `유효하지 않은 파라미터: storeId=${storeId}, tableNumber=${tableNumber}`
      });
    }

    console.log(`🔍 활성 주문 조회: 매장 ${parsedStoreId}, 테이블 ${parsedTableNumber}`);

    // 현재 테이블에서 UNPAID 상태의 티켓이 있는 주문 찾기 (store_tables.id와 매칭)
    const activeOrderResult = await pool.query(`
      SELECT DISTINCT o.id as order_id, o.created_at, o.total_price,
             COUNT(oi.id) as item_count
      FROM orders o
      JOIN order_tickets ot ON o.id = ot.order_id
      LEFT JOIN order_items oi ON ot.id = oi.ticket_id AND oi.item_status != 'CANCELED'
      WHERE o.store_id = $1
        AND o.table_num = $2
        AND ot.paid_status = 'UNPAID'
        AND ot.status != 'CANCELED'
        AND o.session_status = 'OPEN'
      GROUP BY o.id, o.created_at, o.total_price
      ORDER BY o.created_at DESC
      LIMIT 1
    `, [parsedStoreId, parsedTableNumber]);

    if (activeOrderResult.rows.length === 0) {
      console.log(`ℹ️ 테이블 ${parsedTableNumber}에 활성 주문이 없습니다`);
      return res.json({
        success: true,
        hasActiveOrder: false,
        message: '활성 주문이 없습니다'
      });
    }

    const orderData = activeOrderResult.rows[0];
    console.log(`✅ 활성 주문 발견: ${orderData.order_id}, 아이템 ${orderData.item_count}개`);

    res.json({
      success: true,
      hasActiveOrder: true,
      orderId: orderData.order_id,
      totalAmount: orderData.total_price || 0,
      itemCount: parseInt(orderData.item_count) || 0,
      storeId: parsedStoreId,
      tableNumber: parsedTableNumber
    });

  } catch (error) {
    console.error('❌ 활성 주문 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '활성 주문 조회 실패: ' + error.message
    });
  }
});

/**
 * [GET] /stores/:storeId/table/:tableNumber/status - 테이블 상태 조회 (TLL 연동 교차주문 확인용)
 */
router.get('/stores/:storeId/table/:tableNumber/status', async (req, res) => {
  try {
    const { storeId, tableNumber } = req.params;

    console.log(`🔍 테이블 상태 조회: 매장 ${storeId}, 테이블 ${tableNumber}`);

    // store_tables에서 해당 테이블의 주문 상태 조회 (id 또는 table_number로 검색)
    const tableResult = await pool.query(`
      SELECT
        id,
        table_name,
        processing_order_id,
        spare_processing_order_id,
        status,
        updated_at
      FROM store_tables
      WHERE store_id = $1 AND id = $2
    `, [parseInt(storeId), parseInt(tableNumber)]);

    if (tableResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '테이블을 찾을 수 없습니다'
      });
    }

    const table = tableResult.rows[0];

    // TLL 연동 교차주문 여부 판단 (POI = SPOI이고 둘 다 null이 아님)
    const isTLLMixedOrder = (
      table.processing_order_id !== null &&
      table.spare_processing_order_id !== null &&
      parseInt(table.processing_order_id) === parseInt(table.spare_processing_order_id)
    );

    // 추가 검증: 해당 주문이 실제로 is_mixed = true인지 확인
    let isActuallyMixed = false;
    if (isTLLMixedOrder && table.processing_order_id) {
      try {
        const orderCheckResult = await pool.query(`
          SELECT is_mixed, source, session_status
          FROM orders
          WHERE id = $1
        `, [table.processing_order_id]);

        if (orderCheckResult.rows.length > 0) {
          const order = orderCheckResult.rows[0];
          isActuallyMixed = (
            order.is_mixed === true &&
            order.source === 'TLL' &&
            order.session_status === 'OPEN'
          );
        }
      } catch (error) {
        console.warn(`⚠️ 주문 is_mixed 상태 확인 실패: ${table.processing_order_id}`, error);
      }
    }

    const finalTLLMixedStatus = isTLLMixedOrder && isActuallyMixed;

    console.log(`✅ 테이블 ${tableNumber} 상태 조회 완료:`, {
      processing_order_id: table.processing_order_id,
      spare_processing_order_id: table.spare_processing_order_id,
      isTLLMixedOrder: isTLLMixedOrder,
      isActuallyMixed: isActuallyMixed,
      finalTLLMixedStatus: finalTLLMixedStatus
    });

/**
 * 단일 수량 감소 처리 헬퍼 함수
 */


    res.json({
      success: true,
      table: {
        id: table.id,
        processing_order_id: table.processing_order_id,
        spare_processing_order_id: table.spare_processing_order_id,
        status: table.status,
        updated_at: table.updated_at,
        isTLLMixedOrder: finalTLLMixedStatus
      }
    });

  } catch (error) {
    console.error('❌ 테이블 상태 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '테이블 상태 조회 실패'
    });
  }
});

/**
 * [GET] /stores/:storeId/table/:tableNumber/mixed-order-items - TLL 연동 교차주문 아이템 조회 (source별 분리)
 */
router.get('/stores/:storeId/table/:tableNumber/mixed-order-items', async (req, res) => {
  try {
    const { storeId, tableNumber } = req.params;

    console.log(`🔗 TLL 연동 교차주문 아이템 조회: 매장 ${storeId}, 테이블 ${tableNumber}`);

    // 파라미터 검증
    const parsedStoreId = parseInt(storeId);
    const parsedTableNumber = parseInt(tableNumber);

    if (isNaN(parsedStoreId) || isNaN(parsedTableNumber)) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 매장 ID 또는 테이블 ID입니다'
      });
    }

    // 먼저 TLL 연동 교차주문인지 확인
    const tableStatusResult = await pool.query(`
      SELECT processing_order_id, spare_processing_order_id
      FROM store_tables
      WHERE store_id = $1 AND id = $2
    `, [parsedStoreId, parsedTableNumber]);

    if (tableStatusResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '테이블을 찾을 수 없습니다'
      });
    }

    const tableStatus = tableStatusResult.rows[0];
    const isTLLMixedOrder = (
      tableStatus.processing_order_id !== null &&
      tableStatus.spare_processing_order_id !== null &&
      parseInt(tableStatus.processing_order_id) === parseInt(tableStatus.spare_processing_order_id)
    );

    if (!isTLLMixedOrder) {
      return res.status(400).json({
        success: false,
        error: 'TLL 연동 교차주문이 아닙니다'
      });
    }

    const orderId = tableStatus.processing_order_id;

    // 해당 주문의 모든 티켓과 아이템을 source별로 조회
    const mixedOrderItemsResult = await pool.query(`
      SELECT
        oi.id,
        oi.menu_id,
        oi.menu_name,
        oi.unit_price,
        oi.quantity,
        oi.total_price,
        oi.item_status,
        oi.cook_station,
        oi.created_at,
        ot.source as ticket_source,
        ot.id as ticket_id,
        ot.paid_status
      FROM order_items oi
      JOIN order_tickets ot ON oi.ticket_id = ot.id
      WHERE oi.order_id = $1
        AND oi.item_status NOT IN ('CANCELED', 'REFUNDED')
        AND ot.table_num = $2
      ORDER BY ot.source, oi.created_at ASC
    `, [orderId, parsedTableNumber]);

    // 총액 계산
    const totalAmount = mixedOrderItemsResult.rows.reduce((sum, item) => {
      return sum + (parseFloat(item.total_price) || 0);
    }, 0);

    // source별 통계
    const tllItems = mixedOrderItemsResult.rows.filter(item => item.ticket_source === 'TLL');
    const posItems = mixedOrderItemsResult.rows.filter(item => item.ticket_source === 'POS');

    console.log(`✅ TLL 연동 교차주문 아이템 조회 완료: 테이블 ${tableNumber}, 주문 ${orderId}`);
    console.log(`📊 아이템 분포: TLL ${tllItems.length}개, POS ${posItems.length}개, 총액 ${totalAmount}원`);

    res.json({
      success: true,
      orderId: parseInt(orderId),
      orderItems: mixedOrderItemsResult.rows,
      totalAmount: totalAmount,
      statistics: {
        tllItemCount: tllItems.length,
        posItemCount: posItems.length,
        totalItemCount: mixedOrderItemsResult.rows.length,
        tllAmount: tllItems.reduce((sum, item) => sum + (parseFloat(item.total_price) || 0), 0),
        posAmount: posItems.reduce((sum, item) => sum + (parseFloat(item.total_price) || 0), 0)
      }
    });

  } catch (error) {
    console.error('❌ TLL 연동 교차주문 아이템 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: 'TLL 연동 교차주문 아이템 조회 실패: ' + error.message
    });
  }
});

/**
 * [GET] /stores/:storeId/orders/active - 활성 주문 조회 (교차 주문 지원)
 */
router.get('/stores/:storeId/orders/active', async (req, res) => {
  try {
    const { storeId } = req.params;

    console.log(`📊 매장 ${storeId} 활성 주문 조회 (교차 주문 지원)`);

    // 메인 주문 조회
    const mainOrdersResult = await pool.query(`
      SELECT
        st.id as table_number,
        o.id as order_id,
        COALESCE(u.name, '포스고객') as customer_name,
        o.user_id,
        o.total_price as total_amount,
        o.session_status,
        o.created_at as opened_at,
        o.source as source_system,
        COUNT(oi.id) as item_count,
        'main' as order_type,
        st.spare_processing_order_id
      FROM store_tables st
      JOIN orders o ON st.processing_order_id = o.id
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id AND oi.item_status != 'CANCELED'
      WHERE st.store_id = $1 AND st.processing_order_id IS NOT NULL
      GROUP BY st.id, o.id, u.name, o.user_id,
               o.total_price, o.session_status, o.created_at, o.source, st.spare_processing_order_id
    `, [storeId]);

    // 보조 주문 조회
    const spareOrdersResult = await pool.query(`
      SELECT
        st.id as table_number,
        o.id as order_id,
        COALESCE(u.name, '포스고객') as customer_name,
        o.user_id,
        o.total_price as total_amount,
        o.session_status,
        o.created_at as opened_at,
        o.source as source_system,
        COUNT(oi.id) as item_count,
        'spare' as order_type
      FROM store_tables st
      JOIN orders o ON st.spare_processing_order_id = o.id
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id AND oi.item_status != 'CANCELED'
      WHERE st.store_id = $1 AND st.spare_processing_order_id IS NOT NULL
      GROUP BY st.id, o.id, u.name, o.user_id,
               o.total_price, o.session_status, o.created_at, o.source
    `, [storeId]);

    // 결과 통합 및 교차 주문 표시
    const activeOrders = [];

    // 메인 주문 처리
    mainOrdersResult.rows.forEach(row => {
      const hasSpareOrder = row.spare_processing_order_id !== null;

      activeOrders.push({
        checkId: row.order_id,
        tableNumber: row.table_number,
        customerName: row.customer_name,
        isGuest: !row.user_id,
        totalAmount: row.total_amount || 0,
        status: row.status,
        openedAt: row.opened_at,
        sourceSystem: row.source_system,
        itemCount: parseInt(row.item_count),
        orderType: 'main',
        isCrossOrder: hasSpareOrder // 교차 주문 여부
      });
    });

    // 보조 주문 처리
    spareOrdersResult.rows.forEach(row => {
      activeOrders.push({
        checkId: row.order_id,
        tableNumber: row.table_number,
        customerName: row.customer_name,
        isGuest: !row.user_id,
        totalAmount: row.total_amount || 0,
        status: row.status,
        openedAt: row.opened_at,
        sourceSystem: row.source_system,
        itemCount: parseInt(row.item_count),
        orderType: 'spare',
        isCrossOrder: true // 보조 주문은 항상 교차 주문
      });
    });

    // 테이블 번호와 주문 생성 시간으로 정렬
    activeOrders.sort((a, b) => {
      if (a.tableNumber !== b.tableNumber) {
        return a.tableNumber - b.tableNumber;
      }
      return new Date(a.openedAt) - new Date(b.openedAt);
    });

    console.log(`✅ 매장 ${storeId} 활성 주문 ${activeOrders.length}개 조회 완료 (교차 주문 포함)`);

    res.json({
      success: true,
      activeOrders: activeOrders
    });

  } catch (error) {
    console.error('❌ 활성 주문 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '활성 주문 조회 실패'
    });
  }
});

// Helper function to update order total amount
async function updateOrderTotalAmount(client, orderId) {
  const totalResult = await client.query(`
    SELECT 
      COALESCE(SUM(oi.unit_price * oi.quantity), 0) as item_total
    FROM order_items oi
    JOIN order_tickets ot ON oi.ticket_id = ot.id
    WHERE ot.order_id = $1 
      AND oi.item_status NOT IN ('CANCELLED', 'REFUNDED')
      AND ot.status NOT IN ('CANCELLED')
  `, [orderId]);

  const itemTotal = parseFloat(totalResult.rows[0].item_total) || 0;

  await client.query(`
    UPDATE orders
    SET 
      total_price = $2,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
  `, [orderId, itemTotal]);

  console.log(`✅ 주문 ${orderId} 총 금액 업데이트: ${itemTotal}원`);
}



/**
 * [POST] /orders/modify-batch - POS 주문 수정 (batch 알고리즘)
 */
router.post('/orders/modify-batch', async (req, res) => {
  const client = await pool.connect();

  try {
    const { storeId, tableNumber, modifications } = req.body;
    const { add = {}, remove = {} } = modifications || {};

    console.log(`🔧 batch 알고리즘 주문 수정: 매장 ${storeId}, 테이블 ${tableNumber}`);
    console.log(`📈 추가:`, add);
    console.log(`📉 감소:`, remove);

    if (!storeId || !tableNumber || (!Object.keys(add).length && !Object.keys(remove).length)) {
      return res.status(400).json({
        success: false,
        error: '필수 정보가 누락되었습니다'
      });
    }

    await client.query('BEGIN');

    // 1. 현재 테이블의 활성 주문 조회
    const activeOrderResult = await client.query(`
      SELECT DISTINCT o.id as order_id, o.created_at
      FROM orders o
      JOIN order_tickets ot ON o.id = ot.order_id
      WHERE o.store_id = $1 
        AND o.table_num = $2 
        AND ot.paid_status = 'UNPAID'
        AND o.session_status = 'OPEN'
        AND ot.source = 'POS'
      ORDER BY o.created_at DESC
      LIMIT 1
    `, [parseInt(storeId), parseInt(tableNumber)]);

    let orderId;

    if (activeOrderResult.rows.length === 0) {
      // 활성 주문이 없는 경우 새로운 주문 생성 (첫 주문 상황)
      console.log(`📋 활성 주문이 없음 - 새 주문 생성: 매장 ${storeId}, 테이블 ${tableNumber}`);

      const newOrderResult = await client.query(`
        INSERT INTO orders (
          store_id,
          table_num,
          user_id,
          guest_phone,
          source,
          payment_status,
          total_price,
          session_status,
          created_at
        ) VALUES ($1, $2, NULL, NULL, 'POS', 'UNPAID', 0, 'OPEN', NOW())
        RETURNING id
      `, [storeId, tableNumber]);

      orderId = newOrderResult.rows[0].id;
      console.log(`✅ 새 주문 생성 완료: ${orderId}`);

      // store_tables의 processing_order_id 또는 spare_processing_order_id 업데이트
    //  await client.query( ``)

      const currentTableResult = await client.query(`
        SELECT processing_order_id, spare_processing_order_id, status
        FROM store_tables
        WHERE store_id = $1 AND id = $2 
      `, [storeId, tableNumber]);

      if (currentTableResult.rows.length > 0) {
        const currentTable = currentTableResult.rows[0];
        const hasMainOrder = currentTable.processing_order_id !== null;
        const hasSpareOrder = currentTable.spare_processing_order_id !== null;

        // 레거시 시스템과 동일한 이중 주문 처리 로직
        if (!hasMainOrder) {
          // processing_order_id가 비어있으면 메인 주문으로 설정
          await client.query(`
            UPDATE store_tables
            SET processing_order_id = $1,
                status = 'OCCUPIED',
                updated_at = CURRENT_TIMESTAMP
            WHERE store_id = $2 AND id = $3
          `, [orderId, storeId, tableNumber]);
          console.log(`📋 POS 새 주문 - 메인 주문으로 설정: 테이블 ${tableNumber}, 주문 ${orderId}`);
        } else if (!hasSpareOrder) {
          // processing_order_id가 존재하지만 spare_processing_order_id가 비어있으면 보조 주문으로 설정 (2개 주문까지 허용)
          await client.query(`
            UPDATE store_tables
            SET spare_processing_order_id = $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE store_id = $2 AND id = $3 
          `, [orderId, storeId, tableNumber]);
          console.log(`📋 POS 새 주문 - 보조 주문으로 설정: 테이블 ${tableNumber}, 기존 메인 주문 ${currentTable.processing_order_id}, 새 보조 주문 ${orderId}`);
        } else {
          // 레거시 시스템과 동일: 2개 주문 초과 시 경고만 출력하고 처리하지 않음
          console.warn(`⚠️ POS 새 주문 - 테이블에 이미 2개 주문 존재, 추가 주문 거부: 테이블 ${tableNumber}, 메인: ${currentTable.processing_order_id}, 보조: ${currentTable.spare_processing_order_id}`);
          await client.query('ROLLBACK');
          return res.status(409).json({
            success: false,
            error: '해당 테이블에 이미 2개의 활성 주문이 존재합니다. 더 이상 주문을 받을 수 없습니다.',
            tableStatus: {
              processing_order_id: currentTable.processing_order_id,
              spare_processing_order_id: currentTable.spare_processing_order_id
            }
          });
        }
      } else {
        // 테이블을 찾을 수 없는 경우 에러 로깅
        console.error(`❌ POS 새 주문 - 테이블을 찾을 수 없음: 매장 ${storeId}, 테이블 ${tableNumber}`);
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          error: '테이블을 찾을 수 없습니다'
        });
      }
    } else {
      orderId = activeOrderResult.rows[0].order_id;
      console.log(`📋 기존 활성 주문 사용: ${orderId}`);
    }

    // 2. 추가 주문 처리 (새 batch 생성)
    if (Object.keys(add).length > 0) {
      console.log(`➕ 추가 주문 처리: ${Object.keys(add).length}개 메뉴`);

      // 새 batch_no 생성
      const newBatchResult = await client.query(`
        SELECT COALESCE(MAX(batch_no), 0) + 1 AS next_batch 
        FROM order_tickets 
        WHERE order_id = $1
      `, [orderId]);

      const newBatchNo = newBatchResult.rows[0].next_batch;

      // 새 티켓 생성
      const newTicketResult = await client.query(`
        INSERT INTO order_tickets (
          order_id,
          store_id,
          batch_no,
          version,
          status,
          payment_type,
          source,
          table_num,
          created_at,
          paid_status
        ) VALUES ($1, $2, $3, 1, 'PENDING', 'POSTPAID', 'POS', $4, NOW(), 'UNPAID')
        RETURNING id
      `, [orderId, storeId, newBatchNo, tableNumber]);

      const newTicketId = newTicketResult.rows[0].id;

      // 추가 메뉴들을 새 티켓에 추가
      for (const [menuName, quantity] of Object.entries(add)) {
        // 메뉴 정보 조회
        const menuResult = await client.query(`
          SELECT id, price, cook_station 
          FROM store_menu 
          WHERE store_id = $1 AND name = $2
        `, [storeId, menuName]);

        if (menuResult.rows.length > 0) {
          const menu = menuResult.rows[0];

          await client.query(`
            INSERT INTO order_items (
              order_id,
              ticket_id,
              menu_id,
              menu_name,
              unit_price,
              quantity,
              total_price,
              item_status,
              cook_station,
              created_at,
              store_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING', $8, NOW(), $9)
          `, [
            orderId,
            newTicketId,
            menu.id,
            menuName,
            menu.price,
            quantity,
            menu.price * quantity,
            menu.cook_station || 'KITCHEN',
            storeId
          ]);

          console.log(`✅ 추가 완료: ${menuName} ${quantity}개`);
        }
      }
    }

    // 3. 감소 주문 처리 (batch_no 높은 순으로 차감)
    for (const [menuName, removeQty] of Object.entries(remove)) {
      let remaining = removeQty;
      console.log(`📉 ${menuName} ${removeQty}개 감소 시작`);

      // batch_no 높은 순으로 해당 메뉴가 포함된 티켓들 조회
      const ticketsResult = await client.query(`
        SELECT 
          ot.id as ticket_id,
          ot.batch_no,
          ot.version,
          oi.id as item_id,
          oi.quantity,
          oi.unit_price,
          oi.cook_station,
          oi.menu_id
        FROM order_tickets ot
        JOIN order_items oi ON ot.id = oi.ticket_id
        WHERE ot.order_id = $1 
          AND oi.menu_name = $2
          AND ot.status != 'CANCELED'
          AND oi.item_status != 'CANCELED'
          AND ot.paid_status = 'UNPAID'
          AND ot.source = 'POS'
        ORDER BY ot.batch_no DESC, ot.version DESC
      `, [orderId, menuName]);

      if (ticketsResult.rows.length === 0) {
        console.warn(`⚠️ ${menuName} 감소 대상 티켓 없음`);
        continue;
      }

      // 각 티켓에서 차감 처리 (사용자 알고리즘 준수)
      const processedTickets = new Set(); // 중복 처리 방지

      for (const ticket of ticketsResult.rows) {
        if (remaining <= 0) break;

        // 이미 처리된 티켓은 건너뛰기
        if (processedTickets.has(ticket.ticket_id)) continue;
        processedTickets.add(ticket.ticket_id);

        // 1. 해당 티켓에서 타겟 메뉴의 oldQty 확인
        const oldQty = ticket.quantity;

        // 2. deduct = min(oldQty, remaining) 계산
        const deduct = Math.min(oldQty, remaining);
        const newQty = oldQty - deduct;
        remaining -= deduct;

        console.log(`🔄 티켓 ${ticket.ticket_id} (batch: ${ticket.batch_no}, v${ticket.version}): ${menuName} ${oldQty} → ${newQty} (차감: ${deduct})`);

        // 3. 기존 티켓 전체를 CANCELED 처리
        await client.query(`
          UPDATE order_items 
          SET item_status = 'CANCELED', updated_at = NOW()
          WHERE ticket_id = $1
        `, [ticket.ticket_id]);

        await client.query(`
          UPDATE order_tickets 
          SET status = 'CANCELED', updated_at = NOW()
          WHERE id = $1
        `, [ticket.ticket_id]);

        // 4. 해당 티켓의 모든 아이템 정보 조회 (CANCELED 상태에서)
        const allItemsResult = await client.query(`
          SELECT 
            menu_id,
            menu_name, 
            unit_price,
            quantity,
            cook_station
          FROM order_items
          WHERE ticket_id = $1 AND item_status = 'CANCELED'
        `, [ticket.ticket_id]);

        // 5. 새 version 티켓 생성 (같은 batch_no, version+1)
        const newVersionTicketResult = await client.query(`
          INSERT INTO order_tickets (
            order_id,
            store_id,
            batch_no,
            version,
            status,
            payment_type,
            source,
            table_num,
            created_at,
            paid_status
          ) VALUES ($1, $2, $3, $4, 'PENDING', 'POSTPAID', 'POS', $5, NOW(), 'UNPAID')
          RETURNING id
        `, [orderId, storeId, ticket.batch_no, ticket.version + 1, tableNumber]);

        const newVersionTicketId = newVersionTicketResult.rows[0].id;

        // 6. 모든 아이템을 새 티켓에 복사
        for (const item of allItemsResult.rows) {
          let finalQty = item.quantity;

          // 타겟 메뉴인 경우: newQty 사용
          if (item.menu_name === menuName) {
            finalQty = newQty;
          }
          // 다른 메뉴들: 원래 수량 그대로 복사

          // 수량이 0보다 큰 경우만 새 티켓에 추가
          if (finalQty > 0) {
            await client.query(`
              INSERT INTO order_items (
                order_id,
                ticket_id,
                menu_id,
                menu_name,
                unit_price,
                quantity,
                total_price,
                item_status,
                cook_station,
                created_at,
                store_id
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING', $8, NOW(), $9)
            `, [
              orderId,
              newVersionTicketId,
              item.menu_id,
              item.menu_name,
              item.unit_price,
              finalQty,
              item.unit_price * finalQty,
              item.cook_station,
              storeId
            ]);
          }
        }

        console.log(`✅ 새 버전 티켓 생성: ${newVersionTicketId} (batch: ${ticket.batch_no}, version: ${ticket.version + 1})`);
      }

      if (remaining > 0) {
        console.warn(`⚠️ ${menuName} ${remaining}개 차감 실패 (재고 부족)`);
      }
    }

    // 4. 주문 총액 업데이트
    await updateOrderTotalAmount(client, orderId);

    await client.query('COMMIT');

    console.log(`✅ batch 알고리즘 수정 완료: 주문 ${orderId}`);

    // KDS 이벤트 발생
    try {
      // 수정된 주문의 모든 아이템 조회
      const modifiedItemsResult = await pool.query(`
        SELECT 
          oi.id,
          oi.menu_name as name,
          oi.quantity,
          oi.unit_price as price,
          oi.cook_station,
          oi.menu_id
        FROM order_items oi
        JOIN order_tickets ot ON oi.ticket_id = ot.id
        WHERE ot.order_id = $1 
          AND oi.item_status != 'CANCELED'
          AND ot.status != 'CANCELED'
          AND ot.paid_status = 'UNPAID'
        ORDER BY oi.created_at DESC
      `, [orderId]);

      const kdsEventData = {
        orderId: orderId,
        ticketId: null, // batch 수정이므로 특정 티켓 ID 없음
        storeId: parseInt(storeId),
        tableNumber: parseInt(tableNumber),
        batchNo: null, // batch 수정
        items: modifiedItemsResult.rows,
        modifications: {
          type: 'batch_update',
          added: Object.keys(add).length,
          removed: Object.keys(remove).length,
          details: { add, remove }
        }
      };

      eventBus.emit('order.modified', kdsEventData);
      console.log(`📡 KDS 이벤트 발생: batch 알고리즘 수정 완료 (주문 ${orderId})`);
    } catch (kdsError) {
      console.warn('⚠️ KDS 이벤트 발생 실패:', kdsError.message);
    }

    res.json({
      success: true,
      orderId: orderId,
      message: 'batch 알고리즘으로 주문 수정이 완료되었습니다',
      processed: {
        added: Object.keys(add).length,
        removed: Object.keys(remove).length
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ batch 알고리즘 수정 실패:', error);
    res.status(500).json({
      success: false,
      error: 'batch 알고리즘 수정 중 오류가 발생했습니다: ' + error.message
    });
  } finally {
    client.release();
  }
});



/**
 * [GET] /stores/:storeId/table/:tableId/mixed-order-items - TLL 연동 교차주문 아이템 조회
 */
router.get('/stores/:storeId/table/:tableId/mixed-order-items', async (req, res) => {
  try {
    const { storeId, tableId } = req.params;

    console.log(`🔗 TLL 연동 교차주문 아이템 조회: 매장 ${storeId}, 테이블 ${tableId}`);

    // 파라미터 검증
    const parsedStoreId = parseInt(storeId);
    const parsedTableId = parseInt(tableId);

    if (isNaN(parsedStoreId) || isNaN(parsedTableId)) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 매장 ID 또는 테이블 ID입니다'
      });
    }

    // 테이블 상태 확인 (TLL 연동 교차주문인지 검증)
    const tableResult = await pool.query(`
      SELECT processing_order_id, spare_processing_order_id
      FROM store_tables
      WHERE store_id = $1 AND id = $2
    `, [parsedStoreId, parsedTableId]);

    if (tableResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '테이블을 찾을 수 없습니다'
      });
    }

    const table = tableResult.rows[0];
    const orderId = table.processing_order_id;

    // TLL 연동 교차주문 검증
    const isTLLMixed = (
      table.processing_order_id !== null &&
      table.spare_processing_order_id !== null &&
      parseInt(table.processing_order_id) === parseInt(table.spare_processing_order_id)
    );

    if (!isTLLMixed) {
      return res.status(400).json({
        success: false,
        error: 'TLL 연동 교차주문이 아닙니다'
      });
    }

    // 해당 주문의 모든 티켓과 아이템 조회 (ticket_source로 구분)
    const result = await pool.query(`
      SELECT 
        oi.id,
        oi.menu_name,
        oi.unit_price,
        oi.quantity,
        oi.total_price,
        oi.cook_station,
        oi.item_status,
        ot.source as ticket_source,
        oi.created_at
      FROM order_items oi
      JOIN order_tickets ot ON oi.ticket_id = ot.id
      WHERE ot.order_id = $1
        AND oi.item_status NOT IN ('CANCELED', 'REFUNDED')
      ORDER BY ot.source, oi.created_at
    `, [orderId]);

    // 총 금액 계산
    const totalAmount = result.rows.reduce((sum, item) => sum + (item.total_price || 0), 0);

    console.log(`✅ TLL 연동 교차주문 아이템 조회 완료: ${result.rows.length}개 아이템, 총액 ${totalAmount}원`);

    res.json({
      success: true,
      orderItems: result.rows,
      totalAmount: totalAmount,
      orderId: orderId,
      isTLLMixed: true
    });

  } catch (error) {
    console.error('❌ TLL 연동 교차주문 아이템 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: 'TLL 연동 교차주문 아이템 조회 실패: ' + error.message
    });
  }
});

/**
 * [GET] /stores/:storeId/orders/active - 활성 주문 조회 (교차 주문 지원)
 */
router.get('/stores/:storeId/orders/active', async (req, res) => {
  try {
    const { storeId } = req.params;

    console.log(`📊 매장 ${storeId} 활성 주문 조회 (교차 주문 지원)`);

    // 메인 주문 조회
    const mainOrdersResult = await pool.query(`
      SELECT
        st.id as table_number,
        o.id as order_id,
        COALESCE(u.name, '포스고객') as customer_name,
        o.user_id,
        o.total_price as total_amount,
        o.session_status,
        o.created_at as opened_at,
        o.source as source_system,
        COUNT(oi.id) as item_count,
        'main' as order_type,
        st.spare_processing_order_id
      FROM store_tables st
      JOIN orders o ON st.processing_order_id = o.id
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id AND oi.item_status != 'CANCELED'
      WHERE st.store_id = $1 AND st.processing_order_id IS NOT NULL
      GROUP BY st.id, o.id, u.name, o.user_id,
               o.total_price, o.session_status, o.created_at, o.source, st.spare_processing_order_id
    `, [storeId]);

    // 보조 주문 조회
    const spareOrdersResult = await pool.query(`
      SELECT
        st.id as table_number,
        o.id as order_id,
        COALESCE(u.name, '포스고객') as customer_name,
        o.user_id,
        o.total_price as total_amount,
        o.session_status,
        o.created_at as opened_at,
        o.source as source_system,
        COUNT(oi.id) as item_count,
        'spare' as order_type
      FROM store_tables st
      JOIN orders o ON st.spare_processing_order_id = o.id
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id AND oi.item_status != 'CANCELED'
      WHERE st.store_id = $1 AND st.spare_processing_order_id IS NOT NULL
      GROUP BY st.id, o.id, u.name, o.user_id,
               o.total_price, o.session_status, o.created_at, o.source
    `, [storeId]);

    // 결과 통합 및 교차 주문 표시
    const activeOrders = [];

    // 메인 주문 처리
    mainOrdersResult.rows.forEach(row => {
      const hasSpareOrder = row.spare_processing_order_id !== null;

      activeOrders.push({
        checkId: row.order_id,
        tableNumber: row.table_number,
        customerName: row.customer_name,
        isGuest: !row.user_id,
        totalAmount: row.total_amount || 0,
        status: row.status,
        openedAt: row.opened_at,
        sourceSystem: row.source_system,
        itemCount: parseInt(row.item_count),
        orderType: 'main',
        isCrossOrder: hasSpareOrder // 교차 주문 여부
      });
    });

    // 보조 주문 처리
    spareOrdersResult.rows.forEach(row => {
      activeOrders.push({
        checkId: row.order_id,
        tableNumber: row.table_number,
        customerName: row.customer_name,
        isGuest: !row.user_id,
        totalAmount: row.total_amount || 0,
        status: row.status,
        openedAt: row.opened_at,
        sourceSystem: row.source_system,
        itemCount: parseInt(row.item_count),
        orderType: 'spare',
        isCrossOrder: true // 보조 주문은 항상 교차 주문
      });
    });

    // 테이블 번호와 주문 생성 시간으로 정렬
    activeOrders.sort((a, b) => {
      if (a.tableNumber !== b.tableNumber) {
        return a.tableNumber - b.tableNumber;
      }
      return new Date(a.openedAt) - new Date(b.openedAt);
    });

    console.log(`✅ 매장 ${storeId} 활성 주문 ${activeOrders.length}개 조회 완료 (교차 주문 포함)`);

    res.json({
      success: true,
      activeOrders: activeOrders
    });

  } catch (error) {
    console.error('❌ 활성 주문 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '활성 주문 조회 실패'
    });
  }
});

// 기본 메뉴 데이터
function getDefaultMenu() {
  return [
    { id: 1, name: '김치찌개', price: 8000, description: '돼지고기와 김치가 들어간 찌개', category: '찌개류' },
    { id: 2, name: '된장찌개', price: 7000, description: '국산 콩으로 만든 된장찌개', category: '찌개류' },
    { id: 3, name: '불고기', price: 15000, description: '양념에 재운 소고기 불고기', category: '구이류' },
    { id: 4, name: '비빔밥', price: 9000, description: '각종 나물이 들어간 비빔밥', category: '밥류' },
    { id: 5, name: '냉면', price: 10000, description: '시원한 물냉면', category: '면류' },
    { id: 6, name: '공기밥', price: 1000, description: '갓 지은 따뜻한 쌀밥', category: '기타' },
    { id: 7, name: '콜라', price: 2000, description: '시원한 콜라', category: '음료' },
    { id: 8, name: '사이다', price: 2000, description: '시원한 사이다', category: '음료' }
  ];
}

module.exports = router;