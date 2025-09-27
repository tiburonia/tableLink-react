
const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

/**
 * TLL 연동 주문 전용 POS 결제 처리 API
 * - POI = SPOI 상황에서 POS 부분만 결제 처리
 * - 결제 완료 시 세션 종료 및 완전 테이블 해제
 */

/**
 * [POST] /tll-payment/process - TLL 연동 주문 POS 부분 결제 처리
 */
router.post('/process', async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      orderId,
      paymentMethod, // 'CARD' 또는 'CASH'
      amount,
      storeId,
      tableNumber,
      customerType, // 'member' 또는 'guest'
      guestPhone, // 비회원 전화번호 (선택사항)
      memberPhone, // 회원 전화번호
      memberId // 회원 ID
    } = req.body;

    console.log(`💳 TLL 연동 POS 결제 처리 시작:`, {
      orderId,
      paymentMethod,
      amount,
      customerType,
      guestPhone,
      memberPhone
    });

    if (!orderId || !paymentMethod || !amount || !customerType) {
      return res.status(400).json({
        success: false,
        error: '필수 정보가 누락되었습니다 (orderId, paymentMethod, amount, customerType 필요)'
      });
    }

    await client.query('BEGIN');

    // 1. TLL 연동 주문 여부 확인 (POI = SPOI 검증)
    const tableStatusResult = await client.query(`
      SELECT processing_order_id, spare_processing_order_id
      FROM store_tables
      WHERE store_id = $1 AND table_number = $2
    `, [storeId, tableNumber]);

    if (tableStatusResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: '해당 테이블을 찾을 수 없습니다'
      });
    }

    const tableStatus = tableStatusResult.rows[0];
    const processingOrderId = parseInt(tableStatus.processing_order_id);
    const spareOrderId = parseInt(tableStatus.spare_processing_order_id);
    const currentOrderId = parseInt(orderId);

    // POI = SPOI 확인
    if (processingOrderId !== spareOrderId || processingOrderId !== currentOrderId) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'TLL 연동 주문이 아니거나 주문 ID가 일치하지 않습니다'
      });
    }

    console.log(`✅ TLL 연동 주문 확인: POI=${processingOrderId}, SPOI=${spareOrderId}, 현재주문=${currentOrderId}`);

    let guestId = null;
    let userId = null;

    // 2. 고객 유형별 처리
    if (customerType === 'guest' && guestPhone) {
      // 비회원 전화번호 처리
      console.log(`👤 비회원 전화번호 처리: ${guestPhone}`);

      const existingGuestResult = await client.query(`
        SELECT id FROM guests WHERE phone = $1
      `, [guestPhone]);

      if (existingGuestResult.rows.length > 0) {
        guestId = existingGuestResult.rows[0].id;
        console.log(`🔍 기존 게스트 발견: ID ${guestId}`);
      } else {
        const newGuestResult = await client.query(`
          INSERT INTO guests (phone, created_at)
          VALUES ($1, CURRENT_TIMESTAMP)
          RETURNING id
        `, [guestPhone]);

        guestId = newGuestResult.rows[0].id;
        console.log(`✅ 새 게스트 생성: ID ${guestId}`);
      }

      await client.query(`
        UPDATE orders
        SET guest_phone = $1
        WHERE id = $2
      `, [guestPhone, orderId]);

    } else if (customerType === 'member' && (memberId || memberPhone)) {
      // 회원 처리
      console.log(`🎫 회원 처리 시작: memberId=${memberId}, memberPhone=${memberPhone}`);

      let memberResult;

      if (memberId) {
        memberResult = await client.query(`
          SELECT id, name, phone FROM users
          WHERE id = $1
        `, [memberId]);

        if (memberResult.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({
            success: false,
            error: '해당 회원 ID로 등록된 회원을 찾을 수 없습니다'
          });
        }
      } else if (memberPhone) {
        const cleanMemberPhone = memberPhone.replace(/[-\s]/g, '');
        memberResult = await client.query(`
          SELECT id, name, point, phone FROM users
          WHERE phone = $1
        `, [cleanMemberPhone]);

        if (memberResult.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({
            success: false,
            error: '해당 전화번호로 등록된 회원을 찾을 수 없습니다'
          });
        }
      }

      userId = memberResult.rows[0].id;
      console.log(`🔍 회원 발견: ID ${userId}, 이름: ${memberResult.rows[0].name}`);

      await client.query(`
        UPDATE orders
        SET user_id = $1
        WHERE id = $2
      `, [userId, orderId]);
    }

    // 3. POS 소스의 UNPAID 티켓들 조회
    const unpaidTicketsResult = await client.query(`
      SELECT
        ot.id as ticket_id,
        ot.order_id,
        ot.batch_no,
        ot.table_num,
        COUNT(oi.id) as item_count
      FROM order_tickets ot
      LEFT JOIN order_items oi ON ot.id = oi.ticket_id
      WHERE ot.order_id = $1
        AND ot.source = 'POS'
        AND ot.paid_status = 'UNPAID'
      GROUP BY ot.id, ot.order_id, ot.batch_no, ot.table_num
      ORDER BY ot.created_at ASC
    `, [orderId]);

    if (unpaidTicketsResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: '결제할 POS 미지불 티켓이 없습니다'
      });
    }

    const unpaidTickets = unpaidTicketsResult.rows;
    console.log(`📋 POS 미지불 티켓 ${unpaidTickets.length}개 발견`);

    // 4. payments 테이블에 결제 레코드 생성
    const paymentResult = await client.query(`
      INSERT INTO payments (
        order_id,
        method,
        amount,
        status,
        paid_at,
        transaction_id,
        provider_response
      ) VALUES ($1, $2, $3, 'COMPLETED', CURRENT_TIMESTAMP, $4, $5)
      RETURNING id
    `, [
      orderId,
      paymentMethod,
      amount,
      `TLL_POS_${paymentMethod}_${Date.now()}`,
      JSON.stringify({
        source: 'TLL_POS',
        method: paymentMethod,
        processed_at: new Date().toISOString(),
        tll_integration: true,
        customer_type: customerType,
        guest_phone: guestPhone,
        member_phone: memberPhone
      })
    ]);

    const paymentId = paymentResult.rows[0].id;
    console.log(`✅ TLL POS 결제 레코드 생성: payment_id ${paymentId}`);

    // 5. 각 POS 티켓에 대해 payment_details 레코드 생성
    for (const ticket of unpaidTickets) {
      await client.query(`
        INSERT INTO payment_details (
          payment_id,
          order_id,
          ticket_id
        ) VALUES ($1, $2, $3)
      `, [paymentId, orderId, ticket.ticket_id]);
    }

    // 6. POS 소스의 모든 UNPAID 티켓을 PAID로 변경
    const updateResult = await client.query(`
      UPDATE order_tickets
      SET paid_status = 'PAID',
          updated_at = CURRENT_TIMESTAMP
      WHERE order_id = $1
        AND source = 'POS'
        AND paid_status = 'UNPAID'
      RETURNING id, batch_no
    `, [orderId]);

    console.log(`✅ ${updateResult.rows.length}개 POS 티켓 결제 상태 업데이트 완료`);

    // 7. TLL 연동 주문 세션 종료 처리
    await client.query(`
      UPDATE orders
      SET session_status = 'CLOSED',
          session_ended = true,
          session_ended_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [orderId]);

    console.log(`✅ TLL 연동 주문 세션 종료: 주문 ${orderId}`);

    // 8. 완전 테이블 해제 (POI, SPOI 모두 NULL, status = AVAILABLE)
    const tableUpdateResult = await client.query(`
      UPDATE store_tables
      SET
        processing_order_id = NULL,
        spare_processing_order_id = NULL,
        status = 'AVAILABLE',
        updated_at = CURRENT_TIMESTAMP
      WHERE store_id = $1 AND table_number = $2
      RETURNING processing_order_id, spare_processing_order_id, status
    `, [storeId, tableNumber]);

    if (tableUpdateResult.rowCount > 0) {
      console.log(`🍽️ TLL 연동 완전 테이블 해제 완료: 매장 ${storeId}, 테이블 ${tableNumber}`);
    } else {
      console.warn(`⚠️ 테이블 해제 실패: 매장 ${storeId}, 테이블 ${tableNumber}`);
    }

    await client.query('COMMIT');

    // 응답 데이터 구성
    const responseData = {
      success: true,
      paymentId: paymentId,
      orderId: orderId,
      paymentMethod: paymentMethod,
      amount: amount,
      customerType: customerType,
      guestPhone: guestPhone,
      memberPhone: memberPhone,
      paidTickets: updateResult.rows.map(row => ({
        ticketId: row.id,
        batchNo: row.batch_no
      })),
      totalTicketsPaid: updateResult.rows.length,
      sessionClosed: true,
      tableReleased: true,
      isTLLIntegration: true,
      message: `TLL 연동 ${customerType === 'member' ? '회원' : '비회원'} ${paymentMethod} 결제 완료 - 세션 종료 및 테이블 해제`
    };

    console.log(`✅ TLL 연동 POS 결제 처리 완료:`, responseData);

    res.json(responseData);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ TLL 연동 POS 결제 처리 실패:', error);
    res.status(500).json({
      success: false,
      error: 'TLL 연동 POS 결제 처리 실패: ' + error.message
    });
  } finally {
    client.release();
  }
});

/**
 * [GET] /tll-payment/validate/:orderId - TLL 연동 주문 유효성 검증
 */
router.get('/validate/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { storeId, tableNumber } = req.query;

    console.log(`🔍 TLL 연동 주문 유효성 검증: 주문 ${orderId}`);

    // 1. 테이블 상태 확인 (POI = SPOI 확인)
    const tableStatusResult = await pool.query(`
      SELECT processing_order_id, spare_processing_order_id, status
      FROM store_tables
      WHERE store_id = $1 AND table_number = $2
    `, [storeId, tableNumber]);

    if (tableStatusResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '해당 테이블을 찾을 수 없습니다'
      });
    }

    const tableStatus = tableStatusResult.rows[0];
    const processingOrderId = parseInt(tableStatus.processing_order_id);
    const spareOrderId = parseInt(tableStatus.spare_processing_order_id);
    const currentOrderId = parseInt(orderId);

    const isTLLIntegration = (
      processingOrderId === spareOrderId &&
      processingOrderId === currentOrderId
    );

    // 2. POS 미지불 티켓 확인
    const unpaidPOSResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM order_tickets
      WHERE order_id = $1
        AND source = 'POS'
        AND paid_status = 'UNPAID'
    `, [orderId]);

    const hasPOSUnpaidTickets = parseInt(unpaidPOSResult.rows[0].count) > 0;

    // 3. TLL 결제 상태 확인
    const tllPaidResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM order_tickets
      WHERE order_id = $1
        AND source = 'TLL'
        AND paid_status = 'PAID'
    `, [orderId]);

    const hasTLLPaidTickets = parseInt(tllPaidResult.rows[0].count) > 0;

    // 3. POS 미지불 금액 계산
    let posUnpaidAmount = 0;
    let posUnpaidTickets = 0;
    
    if (hasPOSUnpaidTickets) {
      const posAmountResult = await pool.query(`
        SELECT 
          COUNT(*) as ticket_count,
          COALESCE(SUM(oi.total_price), 0) as total_amount
        FROM order_tickets ot
        JOIN order_items oi ON ot.id = oi.ticket_id
        WHERE ot.order_id = $1
          AND ot.source = 'POS'
          AND ot.paid_status = 'UNPAID'
          AND oi.item_status NOT IN ('CANCELLED', 'REFUNDED')
      `, [orderId]);
      
      if (posAmountResult.rows.length > 0) {
        posUnpaidTickets = parseInt(posAmountResult.rows[0].ticket_count) || 0;
        posUnpaidAmount = parseInt(posAmountResult.rows[0].total_amount) || 0;
      }
    }

    // 4. 주문의 is_mixed 상태 확인
    const orderMixedResult = await pool.query(`
      SELECT is_mixed, source, session_status
      FROM orders
      WHERE id = $1
    `, [orderId]);
    
    let isOrderMixed = false;
    let orderSource = null;
    if (orderMixedResult.rows.length > 0) {
      const order = orderMixedResult.rows[0];
      isOrderMixed = order.is_mixed === true;
      orderSource = order.source;
    }

    const finalCanProcess = (
      isTLLIntegration &&
      hasPOSUnpaidTickets &&
      hasTLLPaidTickets &&
      isOrderMixed &&
      orderSource === 'TLL' &&
      posUnpaidAmount > 0
    );

    const validationResult = {
      success: true,
      orderId: parseInt(orderId),
      isTLLIntegration: isTLLIntegration,
      hasPOSUnpaidTickets: hasPOSUnpaidTickets,
      hasTLLPaidTickets: hasTLLPaidTickets,
      posUnpaidTickets: posUnpaidTickets,
      posUnpaidAmount: posUnpaidAmount,
      isOrderMixed: isOrderMixed,
      orderSource: orderSource,
      canProcessPOSPayment: finalCanProcess,
      tableStatus: {
        processing_order_id: processingOrderId,
        spare_processing_order_id: spareOrderId,
        status: tableStatus.status
      }
    };

    console.log(`✅ TLL 연동 유효성 검증 완료:`, validationResult);

    res.json(validationResult);

  } catch (error) {
    console.error('❌ TLL 연동 유효성 검증 실패:', error);
    res.status(500).json({
      success: false,
      error: 'TLL 연동 유효성 검증 실패: ' + error.message
    });
  }
});

module.exports = router;
