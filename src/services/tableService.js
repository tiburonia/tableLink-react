
const tableRepository = require('../repositories/tableRepository');
const orderRepository = require('../repositories/orderRepository');
const storeRepository = require('../repositories/storeRepository');
const pool = require('../db/pool');

/**
 * 테이블 서비스 - 테이블 상태 관리
 */
class TableService {
  /**
   * 테이블 상태 조회 (TLL 연동 교차주문 확인용)
   */
  async getTableStatus(storeId, tableNumber) {
    const table = await tableRepository.getTableByNumber(storeId, tableNumber);
    
    if (!table) {
      throw new Error('테이블을 찾을 수 없습니다');
    }

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
        const order = await orderRepository.getOrderById(null, table.processing_order_id);
        if (order) {
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

    return {
      id: table.id,
      processing_order_id: table.processing_order_id,
      spare_processing_order_id: table.spare_processing_order_id,
      status: table.status,
      updated_at: table.updated_at,
      isTLLMixedOrder: finalTLLMixedStatus
    };
  }

  /**
   * 매장별 테이블 정보 조회
   */
  async getStoreTablesInfo(storeId) {
    const parsedStoreId = parseInt(storeId);
    if (isNaN(parsedStoreId)) {
      throw new Error('유효하지 않은 매장 ID입니다');
    }

    // 매장 존재 여부 확인
    const store = await storeRepository.getStoreById(parsedStoreId);
    if (!store) {
      throw new Error('매장을 찾을 수 없습니다');
    }

    // store_tables 조회
    const storeTables = await tableRepository.getStoreTable(parsedStoreId);
    console.log(`📊 매장 ${storeId} store_tables에서 ${storeTables.length}개 테이블 발견`);

    // 활성 주문 조회
    const activeOrders = await this.getActiveOrders(parsedStoreId);
    console.log(`📊 매장 ${storeId} 활성 주문 ${activeOrders.length}개`);

    // 테이블 목록 구성
    const tables = this.buildTablesList(storeTables, activeOrders);

    console.log(`✅ 매장 ${store.name} (${storeId}) 테이블 ${tables.length}개 조회 완료`);
    console.log(`📊 사용중: ${tables.filter(t => t.isOccupied).length}개, 빈 테이블: ${tables.filter(t => !t.isOccupied).length}개`);

    return {
      tables,
      store: {
        id: parsedStoreId,
        name: store.name
      }
    };
  }

  /**
   * 활성 주문 조회
   */
  async getActiveOrders(storeId) {
    try {
      const result = await pool.query(`
        SELECT 
          o.table_num as table_number,
          o.created_at as opened_at,
          o.user_id,
          o.guest_phone
        FROM orders o
        WHERE o.store_id = $1 
          AND o.session_status = 'OPEN'
          AND NOT COALESCE(o.session_ended, false)
        ORDER BY o.table_num ASC
      `, [storeId]);

      return result.rows;
    } catch (error) {
      console.warn(`⚠️ 활성 주문 조회 실패, 빈 배열로 처리:`, error.message);
      return [];
    }
  }

  /**
   * 테이블 목록 구성
   */
  buildTablesList(storeTables, activeOrders) {
    if (storeTables.length > 0) {
      // store_tables 기반 테이블 생성
      return storeTables.map(storeTable => {
        const tableNumber = storeTable.id;
        const activeOrder = activeOrders.find(order => order.table_number === tableNumber);

        return {
          id: tableNumber,
          tableNumber: tableNumber,
          tableName: storeTable.table_name || `${tableNumber}번`,
          capacity: storeTable.capacity || 4,
          isOccupied: !!activeOrder,
          status: storeTable.status,
          occupiedSince: activeOrder ? activeOrder.opened_at : null,
          occupiedBy: activeOrder ? (activeOrder.user_id || activeOrder.guest_phone) : null
        };
      });
    } else {
      // 기본 5개 테이블 생성
      console.warn(`⚠️ store_tables 데이터가 없어 기본 5개 테이블 생성`);
      return Array.from({ length: 5 }, (_, i) => {
        const tableNumber = i + 1;
        const activeOrder = activeOrders.find(order => order.table_number === tableNumber);

        return {
          id: tableNumber,
          tableNumber: tableNumber,
          tableName: `${tableNumber}번`,
          seats: 4,
          isOccupied: !!activeOrder,
          occupiedSince: activeOrder ? activeOrder.opened_at : null,
          occupiedBy: activeOrder ? (activeOrder.user_id || activeOrder.guest_phone) : null
        };
      });
    }
  }

  /**
   * TLL 연동 상태 확인
   */
  async checkTLLStatus(storeId, tableNumber) {
    // 현재는 모든 테이블을 TLL 미연동으로 처리
    // 실제 환경에서는 테이블별 TLL 연동 설정 확인 필요
    const hasTLLIntegration = false;

    return {
      hasTLLIntegration,
      message: hasTLLIntegration ? 'TLL 연동 테이블' : 'TLL 미연동 테이블 (비회원 POS 주문 가능)'
    };
  }

  /**
   * 매장의 모든 테이블과 진행 중인 주문 정보를 통합 조회
   */
  async getStoreTablesWithOrders(storeId) {
    const rawData = await tableRepository.getStoreTablesWithOrders(storeId);
    
    // 테이블별로 그룹화
    const tablesMap = new Map();
    
    rawData.forEach(row => {
      const tableId = row.table_id;
      
      if (!tablesMap.has(tableId)) {
        tablesMap.set(tableId, {
          id: tableId,
          tableNumber: tableId,
          tableName: row.table_name || `${tableId}번`,
          capacity: row.capacity || 4,
          status: row.status,
          isOccupied: row.is_occupied || false,
          orders: []
        });
      }
      
      const table = tablesMap.get(tableId);
      
      // 주문이 있는 경우에만 처리
      if (row.order_id && row.item_id) {
        // source별로 주문 찾기
        let sourceOrder = table.orders.find(order => order.source === row.source_system);
        
        if (!sourceOrder) {
          sourceOrder = {
            source: row.source_system,
            items: {},
            createdAt: row.order_created_at
          };
          table.orders.push(sourceOrder);
        }
        
        // 아이템 집계 (메뉴명 기준)
        const menuName = row.menu_name;
        if (sourceOrder.items[menuName]) {
          sourceOrder.items[menuName] += row.quantity;
        } else {
          sourceOrder.items[menuName] = row.quantity;
        }
      }
    });
    
    return Array.from(tablesMap.values()).sort((a, b) => a.tableNumber - b.tableNumber);
  }

  /**
   * 테이블 점유 처리
   */
  async occupyTable({ storeId, tableNumber, userId, guestPhone, duration }) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 이미 오픈된 체크 확인
      const existingCheck = await client.query(`
        SELECT id FROM checks 
        WHERE store_id = $1 AND table_number = $2 AND status = 'open'
      `, [storeId, tableNumber]);

      if (existingCheck.rows.length > 0) {
        throw new Error('이미 사용중인 테이블입니다');
      }

      // 새 체크 생성
      const checkResult = await client.query(`
        INSERT INTO checks (
          store_id, 
          table_number, 
          user_id, 
          guest_phone, 
          status, 
          opened_at,
          subtotal,
          tax_amount,
          service_charge,
          discount_amount,
          final_amount
        ) VALUES ($1, $2, $3, $4, 'open', NOW(), 0, 0, 0, 0, 0)
        RETURNING id, opened_at
      `, [storeId, tableNumber, userId || null, guestPhone || null]);

      const newCheck = checkResult.rows[0];

      await client.query('COMMIT');

      console.log(`✅ 테이블 ${tableNumber} 점유 완료 - 체크 ID: ${newCheck.id}`);

      return {
        checkId: newCheck.id,
        occupiedSince: newCheck.opened_at
      };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ 테이블 점유 실패:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 테이블 해제 처리
   */
  async releaseTable(storeId, tableNumber) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 오픈된 체크 조회
      const checkResult = await client.query(`
        SELECT id FROM checks 
        WHERE store_id = $1 AND table_number = $2 AND status = 'open'
      `, [storeId, tableNumber]);

      if (checkResult.rows.length === 0) {
        throw new Error('점유중인 체크를 찾을 수 없습니다');
      }

      const checkId = checkResult.rows[0].id;

      // 체크 상태를 closed로 변경
      await client.query(`
        UPDATE checks 
        SET status = 'closed', closed_at = NOW()
        WHERE id = $1
      `, [checkId]);

      await client.query('COMMIT');

      console.log(`✅ 테이블 ${tableNumber} 해제 완료 - 체크 ID: ${checkId}`);

      return { checkId };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ 테이블 해제 실패:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = new TableService();
