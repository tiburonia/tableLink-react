/**
 * 결제 전용 서비스 모듈
 * - 결제 관련 비즈니스 로직 집중 관리
 * - 이벤트 발생을 통해 다른 서비스와 통신
 * - 리포지토리 패턴 적용
 */

const eventBus = require('../utils/eventBus');
const pool = require('../db/pool');
const orderRepository = require('../repositories/orderRepository');
const tableRepository = require('../repositories/tableRepository');
const paymentRepository = require('../repositories/paymentRepository');
const userRepository = require('../repositories/userRepository');

class PaymentService {
  /**
   * TLL 주문 처리 (이벤트 기반 아키텍처)
   */
  async processTLLOrder({ orderId, amount, paymentKey, tossResult, orderData, notificationMetadata }) {
    const client = await pool.connect();

    try {
      console.log('💳 결제 서비스: TLL 주문 처리 시작', {
        orderId,
        amount,
        storeId: orderData.storeId,
        userPk: orderData.userPk,
        itemCount: orderData.items?.length
      });

      await client.query('BEGIN');

      // 1. 기존 OPEN 주문 확인 또는 새 주문 생성
      const orderResult = await this.getOrCreateOrder(client, orderData);
      const { orderIdToUse, isNewOrder } = orderResult;

      // 2. 배치 번호 계산
      const batchNo = await orderRepository.getNextBatchNo(client, orderIdToUse);

      // 3. 티켓 생성
      const ticketId = await orderRepository.createTicket(client, {
        orderId: orderIdToUse,
        storeId: orderData.storeId,
        tableNumber: orderData.tableNumber,
        batchNo,
        source: 'TLL'
      });

      // 4. 주문 아이템 생성
      await this.createOrderItems(client, {
        orderId: orderIdToUse,
        ticketId,
        storeId: orderData.storeId,
        items: orderData.items
      });

      // 5. 주문 총 금액 재계산
      await orderRepository.updateOrderTotalAmount(client, orderIdToUse);

      // 6. 결제 정보 저장
      const paymentId = await paymentRepository.createPaymentRecord(client, {
        orderId: orderIdToUse,
        amount: orderData.finalTotal,
        paymentKey,
        providerResponse: tossResult
      });

      // 7. 결제 세부 정보 저장
      await paymentRepository.createPaymentDetails(client, paymentId, orderIdToUse);

      // 8. TLL 주문 시 store_tables에 주문 ID 등록
      await this.updateTableProcessingOrder(client, orderData.storeId, orderData.tableNumber, orderIdToUse);

      //8. TLL 주문 시 talbe_orders에 레코드 생성 (점진적으로 하자)
      await tableRepository.createTableOrder(client, orderData.storeId, orderData.tableNumber, orderIdToUse);

      await client.query('COMMIT');

      console.log(`✅ 결제 서비스: TLL 주문 처리 완료 - 주문 ${orderIdToUse}, 새 주문: ${isNewOrder}`);

      // 새 주문인 경우 알림 생성
      if (isNewOrder) {
        await this.createOrderNotification(client, {
          userId: orderData.userPk,
          storeId: orderData.storeId,
          storeName: orderData.storeName,
          tableNumber: orderData.tableNumber,
          orderId: orderIdToUse,
          ticketId: ticketId,
          paymentKey,
          amount,
          additionalMetadata: notificationMetadata || {}
        });
      }

      // 이벤트 발생: 새 주문 생성됨
      eventBus.emit('order.created', {
        orderId: orderIdToUse,
        ticketId,
        storeId: orderData.storeId,
        tableNumber: orderData.tableNumber,
        items: orderData.items,
        batchNo,
        isNewOrder
      });

      // 이벤트 발생: 결제 완료됨
      eventBus.emit('payment.completed', {
        orderId: orderIdToUse,
        ticketId,
        storeId: orderData.storeId,
        amount: orderData.finalTotal,
        paymentKey: paymentKey
      });

      return {
        success: true,
        orderId: orderIdToUse,
        ticketId,
        batchNo,
        amount: orderData.finalTotal,
        isNewOrder,
        paymentId
      };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ 결제 서비스: TLL 주문 처리 실패:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 기존 주문 확인 또는 새 주문 생성
   */
  async getOrCreateOrder(client, orderData) {
    // 기존 활성 주문 확인 (orderRepository의 getActiveOrderId 메서드 활용)
    const existingOrderId = await this.getActiveUserOrder(client, orderData);

    let orderIdToUse;
    let isNewOrder = false;

    if (existingOrderId) {
      // 기존 주문에 추가
      orderIdToUse = existingOrderId;
      console.log(`🔄 기존 주문에 추가: ${orderIdToUse}`);
    } else {
      // 새 주문 생성
      orderIdToUse = await orderRepository.createOrder(client, {
        storeId: orderData.storeId,
        tableNumber: orderData.tableNumber,
        source: 'TLL',
        totalPrice: 0
      });

      // TLL 주문 특수 속성 설정
      await client.query(`
        UPDATE orders 
        SET user_id = $1, payment_status = 'PAID', session_ended = false
        WHERE id = $2
      `, [orderData.userPk, orderIdToUse]);

      isNewOrder = true;
      console.log(`✅ 새 주문 생성: ${orderIdToUse}`);
    }

    return { orderIdToUse, isNewOrder };
  }

  /**
   * 사용자별 활성 주문 조회
   */
  async getActiveUserOrder(client, orderData) {
    const result = await client.query(`
      SELECT id FROM orders
      WHERE store_id = $1 
        AND table_num = $2 
        AND user_id = $3
        AND session_status = 'OPEN'
        AND NOT COALESCE(session_ended, false)
      ORDER BY created_at DESC
      LIMIT 1
    `, [orderData.storeId, orderData.tableNumber, orderData.userPk]);

    return result.rows.length > 0 ? result.rows[0].id : null;
  }

  /**
   * 주문 아이템 생성
   */
  async createOrderItems(client, itemData) {
    const { orderId, ticketId, storeId, items } = itemData;

    for (const item of items) {
      await orderRepository.createOrderItem(client, {
        orderId,
        ticketId,
        menuId: item.menuId || item.menu_id || 1,
        menuName: item.name,
        unitPrice: item.price,
        quantity: item.quantity || 1,
        options: null,
        cookStation: item.cook_station || 'KITCHEN',
        storeId
      });
    }
  }

  /**
   * 테이블 처리 주문 업데이트
   */
  async updateTableProcessingOrder(client, storeId, tableNumber, orderId) {
    try {
      // 현재 테이블 상태 확인
      const currentTable = await tableRepository.getTableByNumber(storeId, tableNumber);

      if (!currentTable) {
        console.warn(`⚠️ 테이블 정보 없음: 매장 ${storeId}, 테이블 ${tableNumber}`);
        return;
      }

      const hasMainOrder = currentTable.processing_order_id !== null;
      const hasSpareOrder = currentTable.spare_processing_order_id !== null;

      // 현재 주문이 이미 테이블에 등록되어 있는지 확인
      const isAlreadyRegistered = (
        parseInt(currentTable.processing_order_id) === parseInt(orderId) ||
        parseInt(currentTable.spare_processing_order_id) === parseInt(orderId)
      );

      if (!isAlreadyRegistered) {
        if (!hasMainOrder) {
          // 메인 주문으로 설정
          await tableRepository.setMainOrder(client, storeId, tableNumber, orderId);
          console.log(`🍽️ TLL 주문 - 메인 슬롯 설정: 매장 ${storeId}, 테이블 ${tableNumber}, 주문 ${orderId}`);
        } else if (!hasSpareOrder) {
          // 보조 주문으로 설정
          await tableRepository.setSpareOrder(client, storeId, tableNumber, orderId);
          console.log(`🍽️ TLL 주문 - 보조 슬롯 설정: 매장 ${storeId}, 테이블 ${tableNumber}, 주문 ${orderId}`);
        } else {
          console.warn(`⚠️ TLL 주문 - 테이블에 이미 2개 주문 존재: 매장 ${storeId}, 테이블 ${tableNumber}`);
        }
      } else {
        console.log(`ℹ️ TLL 주문 - 이미 테이블에 등록된 주문: 매장 ${storeId}, 테이블 ${tableNumber}, 주문 ${orderId}`);
        // 테이블 상태를 OCCUPIED로 확실히 설정
        await tableRepository.setTableOccupied(storeId, tableNumber);
        ;
      }

    } catch (error) {
      console.error(`❌ 테이블 업데이트 실패: 매장 ${storeId}, 테이블 ${tableNumber}, 주문 ${orderId}`, error);
    }
  }

  /**
   * 새 주문 알림 생성
   */
  async createOrderNotification(client, notificationData) {
    try {
      const notificationId = await paymentRepository.createOrderNotification(client, notificationData);
      console.log(`✅ 결제 서비스: 새 주문 알림 생성 성공`, {
        notificationId,
        orderId: notificationData.orderId,
        userId: notificationData.userId
      });
    } catch (error) {
      console.error('❌ 결제 서비스: 새 주문 알림 생성 실패:', error);
      // 알림 실패가 전체 결제를 방해하지 않도록 에러를 throw하지 않음
    }
  }

  /**
   * 토스 결제 준비
   */
  async prepareTossPayment(prepareData) {
    const client = await pool.connect();

    try {
      const { storeId, tableNumber, userPK, orderData, amount } = prepareData;

      console.log('💳 결제 서비스: 토스 결제 준비 시작', {
        storeId, tableNumber, userPK, amount
      });

      // 고유한 orderId 생성
      const orderId = `toss_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      //유저 pk값 조회
      const userID = await userRepository.getUserById(userPK).row[0].user_id;

      // pending_payments에 저장
      await paymentRepository.createPendingPayment(client, {
        orderId, userID, userPK, storeId, tableNumber, orderData, amount
      });

      console.log('✅ 결제 준비 완료 - pending_payments에 저장:', orderId);

      return { orderId };

    } catch (error) {
      console.error('❌ 결제 준비 실패:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 토스 결제 승인
   */
  async confirmTossPayment(confirmData) {
    const { paymentKey, orderId, amount } = confirmData;

    try {
      console.log('🔄 결제 서비스: 토스 결제 승인 시작', { paymentKey, orderId, amount });

      // pending_payments에서 주문 데이터 조회
      const pendingPayment = await paymentRepository.getPendingPayment(orderId);

      if (!pendingPayment) {
        throw new Error('대기 중인 결제를 찾을 수 없습니다');
      }

      // 토스페이먼츠 API 승인 요청
      const tossResult = await this.requestTossPaymentConfirm(paymentKey, orderId, amount);

      console.log('✅ 토스페이먼츠 승인 성공:', tossResult);

      // 주문 및 결제 처리
      const orderData = pendingPayment.order_data;
      const result = await this.processTLLOrder({
        orderId: pendingPayment.order_id,
        amount: pendingPayment.amount,
        paymentKey,
        tossResult,
        orderData,
        notificationMetadata: {}
      });

      // pending_payments 상태 업데이트
      const updateClient = await pool.connect();
      try {
        await paymentRepository.updatePendingPaymentStatus(updateClient, orderId, 'COMPLETED');
      } finally {
        updateClient.release();
      }

      return result;

    } catch (error) {
      console.error('❌ 결제 서비스: 토스 결제 승인 실패:', error);
      throw error;
    }
  }

  /**
   * 토스페이먼츠 API 승인 요청
   */
  async requestTossPaymentConfirm(paymentKey, orderId, amount) {
    const secretKey = process.env.TOSS_SECRET_KEY || 'test_sk_zXLkKEypNArWmo50nX3lmeaxYG5R';
    const authHeader = Buffer.from(secretKey + ':').toString('base64');

    const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount: parseInt(amount)
      })
    });

    const result = await response.json();

    if (!response.ok) {
      // 이미 처리된 결제인 경우 성공으로 처리
      if (result.code === 'ALREADY_PROCESSED_PAYMENT') {
        console.log('⚠️ 이미 처리된 결제 - 성공으로 처리');
        return {
          success: true,
          message: '이미 처리된 결제입니다',
          alreadyProcessed: true
        };
      }
      throw new Error(result.message || '토스페이먼츠 승인 실패');
    }

    return result;
  }

  /**
   * POS 결제 처리 (회원/비회원 분기)
   */
  async processPOSPaymentWithCustomer(paymentData) {
    const client = await pool.connect();

    try {
      const {
        orderId,
        paymentMethod,
        amount,
        storeId,
        tableNumber,
        customerType,
        guestPhone,
        memberPhone,
        memberId
      } = paymentData;

      console.log(`💳 결제 서비스: POS 회원/비회원 결제 처리`, {
        orderId,
        paymentMethod,
        amount,
        customerType
      });

      await client.query('BEGIN');

      let guestId = null;
      let userId = null;

      // 1. 고객 유형별 처리
      if (customerType === 'guest' && guestPhone) {
        guestId = await this.processGuestCustomer(client, guestPhone, orderId);
      } else if (customerType === 'member' && (memberId || memberPhone)) {
        userId = await this.processMemberCustomer(client, memberId, memberPhone, orderId);
      }

      // 2. 미지불 티켓 조회
      const unpaidTickets = await paymentRepository.getUnpaidTickets(client, orderId, 'POS');

      if (unpaidTickets.length === 0) {
        await client.query('ROLLBACK');
        throw new Error('결제할 미지불 티켓이 없습니다');
      }

      // 3. 결제 레코드 생성
      const paymentId = await paymentRepository.createPaymentRecord(client, {
        orderId,
        method: paymentMethod,
        amount,
        transactionId: `POS_${paymentMethod}_${Date.now()}`,
        providerResponse: {
          source: 'POS',
          method: paymentMethod,
          processed_at: new Date().toISOString(),
          pos_payment: true,
          customer_type: customerType,
          guest_phone: guestPhone,
          member_phone: memberPhone
        }
      });

      // 4. 결제 세부 정보 생성
      await paymentRepository.createPaymentDetailsForTickets(client, paymentId, orderId, unpaidTickets);

      // 5. 티켓 상태 업데이트
      const updatedTickets = await paymentRepository.updateTicketsToPaid(client, orderId, 'POS');

      // 6. 주문 상태 및 테이블 처리
      const orderFullyPaid = await this.handleOrderCompletion(client, orderId, storeId, tableNumber);

      await client.query('COMMIT');

      return {
        success: true,
        paymentId,
        orderId,
        paymentMethod,
        amount,
        customerType,
        guestPhone,
        memberPhone,
        paidTickets: updatedTickets,
        totalTicketsPaid: updatedTickets.length,
        orderFullyPaid,
        message: `${customerType === 'member' ? '회원' : '비회원'} ${paymentMethod} 결제가 완료되었습니다 (${updatedTickets.length}개 티켓)`
      };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ 결제 서비스: POS 결제 처리 실패:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 비회원 고객 처리
   */
  async processGuestCustomer(client, guestPhone, orderId) {
    console.log(`👤 비회원 전화번호 처리: ${guestPhone}`);

    // 기존 리포지토리 활용 (없으면 새로 생성)
    let guestId = await paymentRepository.findGuestByPhone(client, guestPhone);

    if (!guestId) {
      guestId = await paymentRepository.createGuest(client, guestPhone);
      console.log(`✅ 새 게스트 생성: ID ${guestId}`);
    } else {
      console.log(`🔍 기존 게스트 발견: ID ${guestId}`);
    }

    // 주문에 게스트 정보 연결
    await orderRepository.updateOrderGuestInfo(client, orderId, guestPhone);

    return guestId;
  }

  /**
   * 회원 고객 처리
   */
  async processMemberCustomer(client, memberId, memberPhone, orderId) {
    console.log(`🎫 회원 처리: memberId=${memberId}, memberPhone=${memberPhone}`);

    let member;

    if (memberId) {
      member = await paymentRepository.findMemberById(client, memberId);
    } else if (memberPhone) {
      const cleanPhone = memberPhone.replace(/[-\s]/g, '');
      member = await paymentRepository.findMemberByPhone(client, cleanPhone);
    }

    if (!member) {
      throw new Error('해당 회원을 찾을 수 없습니다');
    }

    console.log(`🔍 회원 발견: ID ${member.id}, 이름: ${member.name}`);

    // 주문에 회원 정보 연결
    await orderRepository.updateOrderMemberInfo(client, orderId, member.id);

    return member.id;
  }

  /**
   * 주문 완료 처리
   */
  async handleOrderCompletion(client, orderId, storeId, tableNumber) {
    // 남은 미지불 티켓 확인
    const remainingUnpaid = await paymentRepository.countUnpaidTickets(client, orderId);

    if (remainingUnpaid === 0) {
      // 주문 상태 업데이트
      await orderRepository.markOrderAsPaid(client, orderId);

      // 테이블 해제 처리
      await this.handleTableRelease(client, storeId, tableNumber, orderId);

      return true;
    }

    return false;
  }

  /**
   * 테이블 해제 처리
   */
  async handleTableRelease(client, storeId, tableNumber, completedOrderId) {
    try {
      // 다른 활성 주문 확인
      const hasOtherActiveOrders = await orderRepository.hasOtherActiveOrders(client, storeId, tableNumber, completedOrderId);

      if (hasOtherActiveOrders) {
        // 현재 주문을 테이블에서 제거하고 다른 주문 유지
        await tableRepository.removeOrderFromTable(client, storeId, tableNumber, completedOrderId);
      } else {
        // 테이블 완전 해제
        await tableRepository.releaseTable(client, storeId, tableNumber);
      }

      console.log(`🍽️ 테이블 처리 완료: 매장 ${storeId}, 테이블 ${tableNumber}`);

    } catch (error) {
      console.error(`❌ 테이블 해제 처리 실패: 매장 ${storeId}, 테이블 ${tableNumber}`, error);
    }
  }

  /**
   * 미지불 티켓 조회
   */
  async getUnpaidTickets(orderId) {
    const unpaidTickets = await paymentRepository.getUnpaidTickets(null, orderId, 'POS');
    const totalAmount = unpaidTickets.reduce((sum, ticket) => sum + parseInt(ticket.ticket_amount || 0), 0);

    return {
      unpaidTickets,
      totalTickets: unpaidTickets.length,
      totalAmount
    };
  }

  /**
   * 주문 결제 상태 조회
   */
  async getOrderPaymentStatus(orderId) {
    // 주문 정보 조회
    const order = await paymentRepository.getOrderInfo(orderId);

    if (!order) {
      throw new Error('주문을 찾을 수 없습니다');
    }

    // 결제 내역 조회
    const payments = await paymentRepository.getPaymentHistory(orderId);

    // 티켓 상태 조회
    const tickets = await paymentRepository.getTicketStatus(orderId);

    return {
      order,
      payments,
      tickets,
      summary: {
        totalPayments: payments.length,
        totalPaidAmount: payments.reduce((sum, p) => sum + parseInt(p.amount), 0),
        totalTickets: tickets.length,
        paidTickets: tickets.filter(t => t.paid_status === 'PAID').length,
        unpaidTickets: tickets.filter(t => t.paid_status === 'UNPAID').length
      }
    };
  }
}

module.exports = new PaymentService();