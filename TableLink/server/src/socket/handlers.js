
function setupSocketHandlers(io, pool) {
  // PostgreSQL LISTEN/NOTIFY 완전 구현
  async function setupKDSListener() {
    try {
      const listenerClient = await pool.connect();

      // 여러 채널 구독
      await listenerClient.query('LISTEN kds_order_events');
      await listenerClient.query('LISTEN kds_ticket_events');
      await listenerClient.query('LISTEN kds_item_events');
      await listenerClient.query('LISTEN kds_payment_events');

      listenerClient.on('notification', async (msg) => {
        try {
          const payload = JSON.parse(msg.payload);
          console.log('📡 PostgreSQL NOTIFY 수신:', msg.channel, payload);

          switch (msg.channel) {
            case 'kds_order_events':
              await handleOrderNotification(payload);
              break;
            case 'kds_ticket_events':
              await handleTicketNotification(payload);
              break;
            case 'kds_item_events':
              await handleItemNotification(payload);
              break;
            case 'kds_payment_events':
              await handlePaymentNotification(payload);
              break;
          }

        } catch (error) {
          console.error('❌ PostgreSQL 알림 처리 실패:', error);
        }
      });

      console.log('✅ PostgreSQL LISTEN 설정 완료 - 4개 채널 구독');

      // 연결 끊김 감지 및 재연결
      listenerClient.on('error', async (error) => {
        console.error('❌ PostgreSQL LISTEN 연결 오류:', error);
        setTimeout(() => setupKDSListener(), 5000); // 5초 후 재연결
      });

    } catch (error) {
      console.error('❌ PostgreSQL LISTEN 설정 실패:', error);
      setTimeout(() => setupKDSListener(), 10000); // 10초 후 재시도
    }
  }

  // 주문 알림 처리
  async function handleOrderNotification(payload) {
    const { action, order_id, store_id, table_num, status } = payload;

    if (global.io && store_id) {
      global.io.to(`kds:${store_id}`).emit('kds-update', {
        type: 'db_order_change',
        data: {
          action,
          order_id: parseInt(order_id),
          table_number: table_num,
          status,
          timestamp: new Date().toISOString(),
          source: 'db_trigger'
        }
      });

      console.log(`📡 DB 주문 변경 이벤트: 매장 ${store_id}, 주문 ${order_id} -> ${status}`);
    }
  }

  // 티켓 알림 처리
  async function handleTicketNotification(payload) {
    const { action, ticket_id, order_id, store_id, status } = payload;

    console.log(`📡 처리할 티켓 알림:`, {
      action,
      ticket_id,
      order_id, 
      store_id,
      status,
      timestamp: new Date().toISOString()
    });

    if (global.io && store_id) {
      const kdsRoom = `kds:${store_id}`;
      const connectedClients = global.io.sockets.adapter.rooms.get(kdsRoom)?.size || 0;
      
      console.log(`📡 KDS 브로드캐스트: 룸 ${kdsRoom}에 ${connectedClients}개 클라이언트 연결됨`);
      
      global.io.to(`kds:${store_id}`).emit('kds-update', {
        type: 'db_ticket_change',
        data: {
          action,
          ticket_id: parseInt(ticket_id),
          order_id: parseInt(order_id),
          status,
          timestamp: new Date().toISOString(),
          source: 'db_trigger'
        }
      });

      // 완료된 티켓의 경우 즉시 제거 이벤트
      if (status === 'DONE' || status === 'COMPLETED') {
        global.io.to(`kds:${store_id}`).emit('ticket.completed', {
          ticket_id: parseInt(ticket_id),
          status,
          action: 'remove',
          source: 'db_trigger'
        });
      }

      console.log(`📡 DB 티켓 변경 이벤트: 매장 ${store_id}, 티켓 ${ticket_id} -> ${status}`);
    }
  }

  // 아이템 알림 처리
  async function handleItemNotification(payload) {
    const { action, item_id, ticket_id, store_id, item_status, menu_name } = payload;

    if (global.io && store_id) {
      global.io.to(`kds:${store_id}`).emit('kds-update', {
        type: 'db_item_change',
        data: {
          action,
          item_id: parseInt(item_id),
          ticket_id: parseInt(ticket_id),
          item_status,
          menu_name,
          timestamp: new Date().toISOString(),
          source: 'db_trigger'
        }
      });

      console.log(`📡 DB 아이템 변경 이벤트: 매장 ${store_id}, 아이템 ${item_id} -> ${item_status}`);
    }
  }

  // 결제 알림 처리
  async function handlePaymentNotification(payload) {
    const { action, payment_id, store_id, table_number, final_amount } = payload;

    if (global.io && store_id) {
      global.io.to(`kds:${store_id}`).emit('kds-update', {
        type: 'db_payment_change',
        data: {
          action,
          payment_id: parseInt(payment_id),
          table_number,
          final_amount,
          timestamp: new Date().toISOString(),
          source: 'db_trigger'
        }
      });

      console.log(`📡 DB 결제 변경 이벤트: 매장 ${store_id}, 테이블 ${table_number} 결제 완료`);
    }
  }

  // KRP 웹소켓 브로드캐스트 함수 (전역 설정)
  global.broadcastKRPPrint = (storeId, printData) => {
    if (!global.io) {
      console.error('❌ global.io가 초기화되지 않음');
      return;
    }

    try {
      console.log(`🖨️ KRP 브로드캐스트 시작: 매장 ${storeId}`);

      // 모든 가능한 방식으로 KRP에 전송
      global.io.emit('krp:new-print', printData);
      global.io.to(`kds:${storeId}`).emit('krp:new-print', printData);
      global.io.to(`krp:${storeId}`).emit('krp:new-print', printData);

      // 일반 메시지 형태로도 전송
      global.io.emit('message', { type: 'new-print', data: printData });

      console.log(`✅ KRP 브로드캐스트 완료: 티켓 ${printData.ticket_id}`);
    } catch (error) {
      console.error('❌ KRP 브로드캐스트 실패:', error);
    }
  };

  // WebSocket 연결 처리
  io.on('connection', (socket) => {
    const authData = socket.handshake.auth;
    const userType = authData?.userType || 'unknown';

    console.log(`🔌 새로운 WebSocket 연결: ${socket.id} (${userType})`);

    // KDS 룸 조인 (인증 선택사항)
    socket.on('join-kds', (storeId) => {
      const roomName = `kds:${storeId}`;
      socket.join(roomName);

      const connectionType = userType === 'kds-anonymous' ? '익명 KDS' : 'authenticated';
      console.log(`🏪 KDS 룸 조인: ${socket.id} -> ${roomName} (${connectionType})`);

      socket.emit('joined-kds', {
        storeId,
        message: `매장 ${storeId} KDS에 연결되었습니다`,
        connectionType: connectionType
      });
    });

    // KRP 룸 조인
    socket.on('join-krp', (storeId) => {
      const roomName = `krp:${storeId}`;
      socket.join(roomName);

      // 룸 조인 확인
      const roomSize = io.sockets.adapter.rooms.get(roomName)?.size || 0;
      console.log(`🖨️ KRP 룸 조인: ${socket.id} -> ${roomName} (총 ${roomSize}개 소켓)`);

      socket.emit('joined-krp', {
        storeId,
        roomName,
        socketId: socket.id,
        roomSize,
        message: `매장 ${storeId} KRP에 연결되었습니다`
      });

      // 테스트 이벤트 즉시 전송 (연결 확인용)
      setTimeout(() => {
        socket.emit('krp:connection-test', {
          message: 'KRP 연결 테스트',
          timestamp: new Date().toISOString(),
          storeId
        });
      }, 1000);
    });

    // KDS 룸 떠나기
    socket.on('leave-kds', (storeId) => {
      const roomName = `kds:${storeId}`;
      socket.leave(roomName);
      console.log(`🚪 KDS 룸 떠남: ${socket.id} -> ${roomName}`);
    });

    // KRP 룸 떠나기
    socket.on('leave-krp', (storeId) => {
      const roomName = `krp:${storeId}`;
      socket.leave(roomName);
      console.log(`🚪 KRP 룸 떠남: ${socket.id} -> ${roomName}`);
    });

    // KRP 출력 완료 처리
    socket.on('krp:print-completed', (data) => {
      try {
        const { ticket_id } = data;
        console.log(`🖨️ KRP 출력 완료 처리: 티켓 ${ticket_id}`);

        // 다른 KRP 클라이언트들에게도 알림
        socket.broadcast.emit('krp:receipt-completed', {
          ticket_id: ticket_id,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('❌ KRP 출력 완료 처리 실패:', error);
      }
    });

    // 아이템 상태 변경 요청 처리
    socket.on('item:setStatus', async (data) => {
      try {
        const { item_id, next } = data;
        console.log(`🔄 아이템 상태 변경 요청: ${item_id} -> ${next}`);

        // 아이템 상태 업데이트
        const updateResult = await pool.query(`
          UPDATE order_items
          SET status = $1, updated_at = NOW()
          WHERE id = $2
          RETURNING *
        `, [next, item_id]);

        if (updateResult.rows.length > 0) {
          const updatedItem = updateResult.rows[0];

          // 주문 정보 조회
          const orderResult = await pool.query(`
            SELECT o.store_id, o.check_id, o.table_number
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            WHERE oi.id = $1
          `, [item_id]);

          if (orderResult.rows.length > 0) {
            const order = orderResult.rows[0];

            // 모든 KDS 클라이언트에게 브로드캐스트
            io.to(`kds:${order.store_id}`).emit('item.updated', {
              item_id: item_id,
              ticket_id: order.check_id,
              item_status: next,
              menu_name: updatedItem.menu_name,
              quantity: updatedItem.quantity,
              cook_station: updatedItem.cook_station
            });

            socket.emit('item:statusUpdated', {
              success: true,
              item_id,
              status: next
            });
          }
        }

      } catch (error) {
        console.error('❌ 아이템 상태 변경 실패:', error);
        socket.emit('item:statusUpdated', {
          success: false,
          error: error.message
        });
      }
    });

    // 티켓 상태 변경 요청 처리
    socket.on('ticket:setStatus', async (data) => {
      try {
        const { ticket_id, next } = data;
        console.log(`🎫 티켓 상태 변경 요청: ${ticket_id} -> ${next}`);

        const updateResult = await pool.query(`
          UPDATE orders
          SET status = $1, updated_at = NOW()
          WHERE check_id = $2
          RETURNING *
        `, [next, ticket_id]);

        if (updateResult.rows.length > 0) {
          const updatedOrder = updateResult.rows[0];

          // 모든 KDS 클라이언트에게 브로드캐스트
          io.to(`kds:${updatedOrder.store_id}`).emit('ticket.updated', {
            ticket_id: ticket_id,
            status: next,
            order_id: updatedOrder.id,
            table_number: updatedOrder.table_number
          });

          socket.emit('ticket:statusUpdated', {
            success: true,
            ticket_id,
            status: next
          });
        }

      } catch (error) {
        console.error('❌ 티켓 상태 변경 실패:', error);
        socket.emit('ticket:statusUpdated', {
          success: false,
          error: error.message
        });
      }
    });

    // 티켓 숨김 요청 처리
    socket.on('ticket:hide', async (data) => {
      try {
        const { ticket_id } = data;
        console.log(`👻 티켓 숨김 요청: ${ticket_id}`);

        const orderResult = await pool.query(`
          SELECT store_id FROM orders WHERE check_id = $1
        `, [ticket_id]);

        if (orderResult.rows.length > 0) {
          const storeId = orderResult.rows[0].store_id;

          // 모든 KDS 클라이언트에게 브로드캐스트
          io.to(`kds:${storeId}`).emit('ticket.hidden', {
            ticket_id: ticket_id
          });

          socket.emit('ticket:hidden', {
            success: true,
            ticket_id
          });
        }

      } catch (error) {
        console.error('❌ 티켓 숨김 실패:', error);
        socket.emit('ticket:hidden', {
          success: false,
          error: error.message
        });
      }
    });

    // 연결 해제
    socket.on('disconnect', () => {
      console.log(`🔌 WebSocket 연결 해제: ${socket.id}`);
    });
  });

  // KDS 웹소켓 브로드캐스트 함수
  global.broadcastKDSUpdate = (storeId, event, data) => {
    const roomName = `kds:${storeId}`;
    io.to(roomName).emit('kds-update', {
      type: event,
      storeId: parseInt(storeId),
      data: data,
      timestamp: Date.now()
    });
    console.log(`📡 KDS 브로드캐스트: ${roomName} -> ${event}`, data);
  };

  // PostgreSQL LISTEN 설정 시작
  setupKDSListener();
}

module.exports = setupSocketHandlers;
