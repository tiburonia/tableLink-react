const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

/**
 * POS 결제 처리 API
 * - 카드/현금 결제 버튼 클릭 시 바로 결제 완료 처리
 * - UNPAID인 POS 오더티켓들을 PAID로 변경
 * - payments, payment_details 레코드 생성
 * - 회원/비회원 분기 처리 및 게스트 테이블 연동
 */

/**
 * [POST] /pos-payment/process - POS 결제 처리 (기존 API 유지)
 */
router.post('/process', async (req, res) => {
  const client = await pool.connect();

  try {
    const { 
      orderId, 
      paymentMethod, // 'CARD' 또는 'CASH'
      amount,
      storeId,
      tableNumber
    } = req.body;

    console.log(`💳 POS 결제 처리 시작: 주문 ${orderId}, 방법: ${paymentMethod}, 금액: ${amount}`);

    if (!orderId || !paymentMethod || !amount) {
      return res.status(400).json({
        success: false,
        error: '필수 정보가 누락되었습니다 (orderId, paymentMethod, amount 필요)'
      });
    }

    await client.query('BEGIN');

    // 1. 해당 주문의 UNPAID POS 티켓들 조회
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
        error: '결제할 미지불 티켓이 없습니다'
      });
    }

    const unpaidTickets = unpaidTicketsResult.rows;
    console.log(`📋 미지불 티켓 ${unpaidTickets.length}개 발견`);

    // 2. payments 테이블에 결제 레코드 생성
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
      `POS_${paymentMethod}_${Date.now()}`, // POS 전용 transaction_id
      JSON.stringify({ 
        source: 'POS',
        method: paymentMethod,
        processed_at: new Date().toISOString(),
        pos_payment: true
      })
    ]);

    const paymentId = paymentResult.rows[0].id;
    console.log(`✅ 결제 레코드 생성 완료: payment_id ${paymentId}`);

    // 3. 각 티켓에 대해 payment_details 레코드 생성
    for (const ticket of unpaidTickets) {
      await client.query(`
        INSERT INTO payment_details (
          payment_id,
          order_id,
          ticket_id
        ) VALUES ($1, $2, $3)
      `, [paymentId, orderId, ticket.ticket_id]);

      console.log(`📝 payment_details 생성: ticket_id ${ticket.ticket_id}`);
    }

    // 4. 모든 UNPAID 티켓을 PAID로 변경
    const updateResult = await client.query(`
      UPDATE order_tickets 
      SET paid_status = 'PAID',
          updated_at = CURRENT_TIMESTAMP
      WHERE order_id = $1 
        AND source = 'POS' 
        AND paid_status = 'UNPAID'
      RETURNING id, batch_no
    `, [orderId]);

    console.log(`✅ ${updateResult.rows.length}개 티켓 결제 상태 업데이트 완료`);

    // 5. 주문 상태 업데이트 (모든 티켓이 결제되었는지 확인)
    const remainingUnpaidResult = await client.query(`
      SELECT COUNT(*) as count
      FROM order_tickets
      WHERE order_id = $1 AND paid_status = 'UNPAID'
    `, [orderId]);

    const hasUnpaidTickets = parseInt(remainingUnpaidResult.rows[0].count) > 0;

    if (!hasUnpaidTickets) {
      // 모든 티켓이 결제되었으면 주문 상태를 PAID로 변경하고 세션 종료
      await client.query(`
        UPDATE orders 
        SET payment_status = 'PAID',
            session_status = 'CLOSED',
            session_ended = true,
            session_ended_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [orderId]);

      console.log(`✅ 주문 ${orderId} 전체 결제 완료 및 세션 종료`);
    }

    // 응답 데이터 구성
    const responseData = {
      success: true,
      paymentId: paymentId,
      orderId: orderId,
      paymentMethod: paymentMethod,
      amount: amount,
      paidTickets: updateResult.rows.map(row => ({
        ticketId: row.id,
        batchNo: row.batch_no
      })),
      totalTicketsPaid: updateResult.rows.length,
      orderFullyPaid: !hasUnpaidTickets,
      message: `${paymentMethod} 결제가 완료되었습니다 (${updateResult.rows.length}개 티켓)`
    };

    console.log(`✅ POS 결제 처리 완료:`, responseData);

    res.json(responseData);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ POS 결제 처리 실패:', error);
    res.status(500).json({
      success: false,
      error: 'POS 결제 처리 실패: ' + error.message
    });
  } finally {
    client.release();
  }
});

/**
 * [POST] /pos-payment/process-with-customer - POS 결제 처리 (회원/비회원 분기 처리)
 */
router.post('/process-with-customer', async (req, res) => {
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
      memberPhone // 회원 전화번호
    } = req.body;

    console.log(`💳 POS 회원/비회원 결제 처리 시작:`, {
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

    let guestId = null;
    let userId = null;

    // 1. 고객 유형별 처리
    if (customerType === 'guest' && guestPhone) {
      // 비회원 전화번호 처리
      console.log(`👤 비회원 전화번호 처리: ${guestPhone}`);

      // 기존 게스트 확인
      const existingGuestResult = await client.query(`
        SELECT id FROM guests WHERE phone = $1
      `, [guestPhone]);

      if (existingGuestResult.rows.length > 0) {
        guestId = existingGuestResult.rows[0].id;
        console.log(`🔍 기존 게스트 발견: ID ${guestId}`);
      } else {
        // 새 게스트 생성
        const newGuestResult = await client.query(`
          INSERT INTO guests (phone, created_at)
          VALUES ($1, CURRENT_TIMESTAMP)
          RETURNING id
        `, [guestPhone]);

        guestId = newGuestResult.rows[0].id;
        console.log(`✅ 새 게스트 생성: ID ${guestId}`);
      }

      // 주문에 게스트 정보 업데이트
      await client.query(`
        UPDATE orders 
        SET guest_phone = $1
        WHERE id = $2
      `, [guestPhone, orderId]);

      console.log(`✅ 주문 ${orderId}에 게스트 전화번호 ${guestPhone} 연결`);

    } else if (customerType === 'member' && memberPhone) {
      // 회원 처리
      console.log(`🎫 회원 전화번호 처리: ${memberPhone}`);

      // 회원 조회
      const memberResult = await client.query(`
        SELECT id, name, point FROM users 
        WHERE phone = $1
      `, [memberPhone]);

      if (memberResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          error: '해당 전화번호로 등록된 회원을 찾을 수 없습니다'
        });
      }

      userId = memberResult.rows[0].id;
      console.log(`🔍 회원 발견: ID ${userId}, 이름: ${memberResult.rows[0].name}`);

      // 주문에 회원 정보 업데이트
      await client.query(`
        UPDATE orders 
        SET user_id = $1
        WHERE id = $2
      `, [userId, orderId]);

      console.log(`✅ 주문 ${orderId}에 회원 ID ${userId} 연결`);
    }

    // 2. 해당 주문의 UNPAID POS 티켓들 조회
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
        error: '결제할 미지불 티켓이 없습니다'
      });
    }

    const unpaidTickets = unpaidTicketsResult.rows;
    console.log(`📋 미지불 티켓 ${unpaidTickets.length}개 발견`);

    // 3. payments 테이블에 결제 레코드 생성
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
      `POS_${paymentMethod}_${Date.now()}`, // POS 전용 transaction_id
      JSON.stringify({ 
        source: 'POS',
        method: paymentMethod,
        processed_at: new Date().toISOString(),
        pos_payment: true,
        customer_type: customerType,
        guest_phone: guestPhone,
        member_phone: memberPhone
      })
    ]);

    const paymentId = paymentResult.rows[0].id;
    console.log(`✅ 결제 레코드 생성 완료: payment_id ${paymentId}`);

    // 4. 각 티켓에 대해 payment_details 레코드 생성
    for (const ticket of unpaidTickets) {
      await client.query(`
        INSERT INTO payment_details (
          payment_id,
          order_id,
          ticket_id
        ) VALUES ($1, $2, $3)
      `, [paymentId, orderId, ticket.ticket_id]);

      console.log(`📝 payment_details 생성: ticket_id ${ticket.ticket_id}`);
    }

    // 5. 모든 UNPAID 티켓을 PAID로 변경
    const updateResult = await client.query(`
      UPDATE order_tickets 
      SET paid_status = 'PAID',
          updated_at = CURRENT_TIMESTAMP
      WHERE order_id = $1 
        AND source = 'POS' 
        AND paid_status = 'UNPAID'
      RETURNING id, batch_no
    `, [orderId]);

    console.log(`✅ ${updateResult.rows.length}개 티켓 결제 상태 업데이트 완료`);

    // 6. 주문 상태 업데이트 (모든 티켓이 결제되었는지 확인)
    const remainingUnpaidResult = await client.query(`
      SELECT COUNT(*) as count
      FROM order_tickets
      WHERE order_id = $1 AND paid_status = 'UNPAID'
    `, [orderId]);

    const hasUnpaidTickets = parseInt(remainingUnpaidResult.rows[0].count) > 0;

    if (!hasUnpaidTickets) {
      // 모든 티켓이 결제되었으면 주문 상태를 PAID로 변경하고 세션 종료
      await client.query(`
        UPDATE orders 
        SET payment_status = 'PAID',
            session_status = 'CLOSED',
            session_ended = true,
            session_ended_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [orderId]);

      console.log(`✅ 주문 ${orderId} 전체 결제 완료 및 세션 종료`);
    }

    // 7. 회원인 경우 포인트 적립
    if (customerType === 'member' && userId) {
      const points = Math.floor(amount * 0.01); // 1% 포인트 적립

      await client.query(`
        UPDATE users 
        SET point = COALESCE(point, 0) + $1
        WHERE id = $2
      `, [points, userId]);

      console.log(`🎉 회원 ${userId} 포인트 적립: ${points}P`);
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
      orderFullyPaid: !hasUnpaidTickets,
      message: `${customerType === 'member' ? '회원' : '비회원'} ${paymentMethod} 결제가 완료되었습니다 (${updateResult.rows.length}개 티켓)`
    };

    console.log(`✅ POS 회원/비회원 결제 처리 완료:`, responseData);

    res.json(responseData);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ POS 회원/비회원 결제 처리 실패:', error);
    res.status(500).json({
      success: false,
      error: 'POS 결제 처리 실패: ' + error.message
    });
  } finally {
    client.release();
  }
});

/**
 * [GET] /pos-payment/unpaid-tickets/:orderId - 미지불 티켓 조회
 */
router.get('/unpaid-tickets/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    console.log(`🔍 주문 ${orderId} 미지불 티켓 조회`);

    const result = await pool.query(`
      SELECT 
        ot.id as ticket_id,
        ot.batch_no,
        ot.table_num,
        ot.created_at,
        COUNT(oi.id) as item_count,
        COALESCE(SUM(oi.total_price), 0) as ticket_amount
      FROM order_tickets ot
      LEFT JOIN order_items oi ON ot.id = oi.ticket_id
      WHERE ot.order_id = $1 
        AND ot.source = 'POS' 
        AND ot.paid_status = 'UNPAID'
      GROUP BY ot.id, ot.batch_no, ot.table_num, ot.created_at
      ORDER BY ot.created_at ASC
    `, [orderId]);

    const unpaidTickets = result.rows;
    const totalAmount = unpaidTickets.reduce((sum, ticket) => sum + parseInt(ticket.ticket_amount), 0);

    console.log(`✅ 미지불 티켓 ${unpaidTickets.length}개, 총 금액: ${totalAmount}원`);

    res.json({
      success: true,
      orderId: parseInt(orderId),
      unpaidTickets: unpaidTickets,
      totalTickets: unpaidTickets.length,
      totalAmount: totalAmount
    });

  } catch (error) {
    console.error('❌ 미지불 티켓 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '미지불 티켓 조회 실패: ' + error.message
    });
  }
});

/**
 * [GET] /pos-payment/status/:orderId - 주문 결제 상태 확인
 */
router.get('/status/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    // 주문 정보와 결제 내역 조회
    const orderResult = await pool.query(`
      SELECT 
        o.id,
        o.store_id,
        o.table_num,
        o.total_price,
        o.payment_status,
        o.status,
        o.user_id,
        o.guest_phone,
        s.name as store_name
      FROM orders o
      JOIN stores s ON o.store_id = s.id
      WHERE o.id = $1
    `, [orderId]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '주문을 찾을 수 없습니다'
      });
    }

    const order = orderResult.rows[0];

    // 결제 내역 조회
    const paymentsResult = await pool.query(`
      SELECT 
        p.id,
        p.method,
        p.amount,
        p.status,
        p.paid_at,
        p.transaction_id,
        array_agg(pd.ticket_id) as ticket_ids
      FROM payments p
      LEFT JOIN payment_details pd ON p.id = pd.payment_id
      WHERE p.order_id = $1
      GROUP BY p.id, p.method, p.amount, p.status, p.paid_at, p.transaction_id
      ORDER BY p.paid_at DESC
    `, [orderId]);

    // 티켓별 결제 상태 조회
    const ticketsResult = await pool.query(`
      SELECT 
        ot.id as ticket_id,
        ot.batch_no,
        ot.paid_status,
        ot.source,
        COUNT(oi.id) as item_count
      FROM order_tickets ot
      LEFT JOIN order_items oi ON ot.id = oi.ticket_id
      WHERE ot.order_id = $1
      GROUP BY ot.id, ot.batch_no, ot.paid_status, ot.source
      ORDER BY ot.batch_no ASC
    `, [orderId]);

    res.json({
      success: true,
      order: order,
      payments: paymentsResult.rows,
      tickets: ticketsResult.rows,
      summary: {
        totalPayments: paymentsResult.rows.length,
        totalPaidAmount: paymentsResult.rows.reduce((sum, p) => sum + parseInt(p.amount), 0),
        totalTickets: ticketsResult.rows.length,
        paidTickets: ticketsResult.rows.filter(t => t.paid_status === 'PAID').length,
        unpaidTickets: ticketsResult.rows.filter(t => t.paid_status === 'UNPAID').length
      }
    });

  } catch (error) {
    console.error('❌ 결제 상태 확인 실패:', error);
    res.status(500).json({
      success: false,
      error: '결제 상태 확인 실패: ' + error.message
    });
  }
});

module.exports = router;