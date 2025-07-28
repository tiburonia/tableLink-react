const express = require('express');
const router = express.Router();
const pool = require('../shared/config/database');

// stores 테이블 별점 평균 업데이트 함수
async function updateStoreRating(storeId) {
  try {
    console.log(`🔄 매장 ${storeId} 별점 평균 업데이트 중...`);

    const ratingResult = await pool.query(`
      SELECT AVG(rating) as avg_rating, COUNT(*) as review_count 
      FROM reviews 
      WHERE store_id = $1
    `, [storeId]);

    const avgRating = ratingResult.rows[0].avg_rating;
    const reviewCount = parseInt(ratingResult.rows[0].review_count);
    const formattedRating = avgRating ? parseFloat(avgRating).toFixed(1) : 0;

    await pool.query(`
      UPDATE stores 
      SET rating_average = $1, review_count = $2 
      WHERE id = $3
    `, [formattedRating, reviewCount, storeId]);

    console.log(`✅ 매장 ${storeId} 별점 평균 업데이트 완료: ${formattedRating}점 (${reviewCount}개 리뷰)`);

    return { avgRating: formattedRating, reviewCount };
  } catch (error) {
    console.error(`❌ 매장 ${storeId} 별점 평균 업데이트 실패:`, error);
    throw error;
  }
}

// 모든 매장 조회 API
router.get('/', async (req, res) => {
  try {
    const storesResult = await pool.query('SELECT * FROM stores ORDER BY id');

    const storesWithTables = await Promise.all(
      storesResult.rows.map(async (store) => {
        const tablesResult = await pool.query(`
          SELECT 
            table_number, table_name, seats, is_occupied, occupied_since
          FROM store_tables 
          WHERE store_id = $1 
          ORDER BY table_number
        `, [store.id]);

        const tables = tablesResult.rows.map(table => ({
          tableNumber: table.table_number,
          tableName: table.table_name,
          seats: table.seats,
          isOccupied: table.is_occupied,
          occupiedSince: table.occupied_since
        }));

        const totalTables = tables.length;
        const availableTables = tables.filter(t => !t.isOccupied).length;
        const occupiedTables = tables.filter(t => t.isOccupied).length;

        return {
          id: store.id,
          name: store.name,
          category: store.category,
          distance: store.distance || '정보없음',
          address: store.address || '주소 정보 없음',
          menu: store.menu || [],
          coord: store.coord || { lat: 37.5665, lng: 126.9780 },
          reviews: store.reviews || [],
          reviewCount: store.review_count || 0,
          ratingAverage: store.rating_average ? parseFloat(store.rating_average) : 0.0,
          isOpen: store.is_open !== false,
          tableInfo: {
            totalTables,
            availableTables,
            occupiedTables,
            occupancyRate: totalTables > 0 ? Math.round((occupiedTables / totalTables) * 100) : 0
          },
          tables: tables
        };
      })
    );

    res.json({
      success: true,
      message: 'TableLink API 서버가 정상 작동 중입니다.',
      stores: storesWithTables
    });
  } catch (error) {
    console.error('stores 조회 실패:', error);
    res.status(500).json({ error: 'stores 조회 실패' });
  }
});

// 특정 매장 조회 API
router.get('/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;
    const storeResult = await pool.query('SELECT * FROM stores WHERE id = $1', [storeId]);

    if (storeResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: '매장을 찾을 수 없습니다' });
    }

    const store = storeResult.rows[0];

    // 테이블 정보 조회
    const tablesResult = await pool.query(`
      SELECT id, table_number, table_name, seats, is_occupied, occupied_since 
      FROM store_tables 
      WHERE store_id = $1 
      ORDER BY table_number
    `, [storeId]);

    const tables = tablesResult.rows.map(table => ({
      id: table.id,
      tableNumber: table.table_number,
      tableName: table.table_name,
      seats: table.seats,
      isOccupied: table.is_occupied,
      occupiedSince: table.occupied_since
    }));

    const totalTables = tables.length;
    const occupiedTables = tables.filter(t => t.is_occupied).length;
    const availableTables = totalTables - occupiedTables;
    const occupancyRate = totalTables > 0 ? Math.round((occupiedTables / totalTables) * 100) : 0;

    res.json({
      success: true,
      store: {
        id: store.id,
        name: store.name,
        category: store.category,
        address: store.address,
        phone: store.phone,
        isOpen: store.is_open,
        ratingAverage: parseFloat(store.rating_average) || 0,
        reviewCount: store.review_count || 0,
        description: store.description,
        operatingHours: store.operating_hours,
        latitude: store.latitude,
        longitude: store.longitude,
        tables: tables,
        tableInfo: {
          totalTables: totalTables,
          availableTables: availableTables,
          occupiedTables: occupiedTables,
          occupancyRate: occupancyRate
        }
      }
    });
  } catch (error) {
    console.error('매장 조회 실패:', error);
    res.status(500).json({ success: false, error: '매장 조회 실패' });
  }
});

// 매장 통계 API
router.get('/:storeId/stats', async (req, res) => {
  try {
    const { storeId } = req.params;
    console.log(`📊 매장 ${storeId} 통계 조회 요청`);

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];

    const todayStats = await pool.query(`
      SELECT COUNT(*) as count, COALESCE(SUM(final_amount), 0) as revenue
      FROM orders 
      WHERE store_id = $1 AND DATE(order_date) = $2
    `, [parseInt(storeId), todayStr]);

    const monthStats = await pool.query(`
      SELECT COUNT(*) as count, COALESCE(SUM(final_amount), 0) as revenue
      FROM orders 
      WHERE store_id = $1 AND order_date >= $2
    `, [parseInt(storeId), thisMonthStart]);

    const stats = {
      todayOrders: parseInt(todayStats.rows[0].count) || 0,
      todayRevenue: parseInt(todayStats.rows[0].revenue) || 0,
      monthOrders: parseInt(monthStats.rows[0].count) || 0,
      monthRevenue: parseInt(monthStats.rows[0].revenue) || 0
    };

    console.log(`✅ 매장 ${storeId} 통계 조회 완료:`, stats);

    res.json({
      success: true,
      stats: stats
    });

  } catch (error) {
    console.error('❌ 매장 통계 조회 실패:', error);
    res.status(500).json({ 
      success: false, 
      error: '통계 조회 실패: ' + error.message 
    });
  }
});

// 매장별 별점 정보 조회 API
router.get('/:storeId/rating', async (req, res) => {
  try {
    const { storeId } = req.params;
    console.log(`⭐ 매장 ${storeId} 별점 정보 조회 요청`);

    const result = await pool.query(`
      SELECT rating_average, review_count 
      FROM stores 
      WHERE id = $1
    `, [parseInt(storeId)]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '매장을 찾을 수 없습니다' });
    }

    const store = result.rows[0];
    const ratingData = {
      success: true,
      storeId: parseInt(storeId),
      ratingAverage: store.rating_average ? parseFloat(store.rating_average) : 0.0,
      reviewCount: store.review_count || 0
    };

    console.log(`⭐ 매장 ${storeId} 별점 정보 조회 완료: ${ratingData.ratingAverage}점 (${ratingData.reviewCount}개 리뷰)`);
    res.json(ratingData);

  } catch (error) {
    console.error('❌ 매장 별점 정보 조회 실패:', error);
    res.status(500).json({ error: '매장 별점 정보 조회 실패' });
  }
});

// 매장 검색 API (TLM용)
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ 
        success: false, 
        error: '검색어가 필요합니다' 
      });
    }

    console.log(`🔍 매장 검색 요청: "${query}"`);

    const result = await pool.query(`
      SELECT * FROM stores 
      WHERE name ILIKE $1 
      ORDER BY id
      LIMIT 20
    `, [`%${query}%`]);

    const stores = result.rows.map(store => ({
      id: store.id,
      name: store.name,
      category: store.category,
      address: store.address,
      coord: store.coord,
      isOpen: store.is_open,
      ratingAverage: store.rating_average ? parseFloat(store.rating_average) : 0.0,
      reviewCount: store.review_count || 0
    }));

    console.log(`✅ 매장 검색 완료: "${query}" - ${stores.length}개 결과`);

    res.json({
      success: true,
      query: query,
      total: stores.length,
      stores: stores
    });

  } catch (error) {
    console.error('❌ 매장 검색 실패:', error);
    res.status(500).json({ 
      success: false, 
      error: '매장 검색 실패: ' + error.message 
    });
  }
});

// 매장별 테이블 정보 조회 API
router.get('/:storeId/tables', async (req, res) => {
  try {
    const { storeId } = req.params;
    console.log(`🪑 매장 ${storeId} 테이블 정보 조회 요청`);

    const tablesResult = await pool.query(`
      SELECT 
        id, table_number, table_name, seats, is_occupied, occupied_since
      FROM store_tables 
      WHERE store_id = $1 
      ORDER BY table_number
    `, [storeId]);

    const tables = tablesResult.rows.map(table => ({
      id: table.id,
      tableNumber: table.table_number,
      tableName: table.table_name,
      seats: table.seats,
      isOccupied: table.is_occupied,
      occupiedSince: table.occupied_since
    }));

    const totalTables = tables.length;
    const occupiedTables = tables.filter(t => t.isOccupied).length;
    const availableTables = totalTables - occupiedTables;

    console.log(`✅ 매장 ${storeId} 테이블 정보 조회 완료: 총 ${totalTables}개, 사용중 ${occupiedTables}개, 빈 테이블 ${availableTables}개`);

    res.json({
      success: true,
      storeId: parseInt(storeId),
      totalTables: totalTables,
      availableTables: availableTables,
      occupiedTables: occupiedTables,
      tables: tables
    });

  } catch (error) {
    console.error('매장별 테이블 정보 조회 실패:', error);
    res.status(500).json({ success: false, error: '테이블 정보 조회 실패' });
  }
});

// 매장 운영 상태 토글
router.post('/:storeId/toggle-status', async (req, res) => {
  const { storeId } = req.params;
  let { isOpen } = req.body;

  try {
    console.log(`🔄 [API] 매장 ${storeId} 운영 상태 토글 요청 - isOpen: ${isOpen}`);

    // storeId 유효성 검사
    const storeIdInt = parseInt(storeId);
    if (isNaN(storeIdInt) || storeIdInt <= 0) {
      console.error('❌ [API] 잘못된 매장 ID:', storeId);
      return res.status(400).json({
        success: false,
        message: '잘못된 매장 ID입니다.',
        error: 'INVALID_STORE_ID'
      });
    }

    // 트랜잭션 시작
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // 현재 매장 정보 확인 (행 잠금)
      const currentStoreResult = await client.query(
        'SELECT id, name, is_open FROM stores WHERE id = $1 FOR UPDATE',
        [storeIdInt]
      );

      if (currentStoreResult.rows.length === 0) {
        await client.query('ROLLBACK');
        console.error('❌ [API] 매장을 찾을 수 없음:', storeIdInt);
        return res.status(404).json({
          success: false,
          message: '매장을 찾을 수 없습니다.',
          error: 'STORE_NOT_FOUND'
        });
      }

      const currentStore = currentStoreResult.rows[0];
      console.log(`📋 [API] 현재 매장 상태: ${currentStore.name} (ID: ${currentStore.id}) - 운영중: ${currentStore.is_open}`);

      // 새로운 상태 결정
      let newStatus;
      if (isOpen === undefined || isOpen === null) {
        // isOpen이 지정되지 않은 경우 현재 상태를 토글
        newStatus = !currentStore.is_open;
      } else {
        // 명시적으로 지정된 경우 해당 값 사용
        newStatus = Boolean(isOpen);
      }

      console.log(`🔄 [API] 상태 변경: ${currentStore.is_open} → ${newStatus}`);

      // 상태가 동일한 경우 체크
      if (currentStore.is_open === newStatus) {
        await client.query('ROLLBACK');
        console.log(`ℹ️ [API] 매장 상태가 이미 ${newStatus ? '운영중' : '운영중지'} 상태입니다.`);
        return res.json({
          success: true,
          message: `매장이 이미 ${newStatus ? '운영중' : '운영중지'} 상태입니다.`,
          store: {
            id: currentStore.id,
            name: currentStore.name,
            isOpen: currentStore.is_open
          },
          isOpen: newStatus,
          changed: false
        });
      }

      // 운영 상태 업데이트
      const updateResult = await client.query(
        'UPDATE stores SET is_open = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, name, is_open',
        [newStatus, storeIdInt]
      );

      await client.query('COMMIT');

      if (updateResult.rows.length === 0) {
        console.error('❌ [API] 업데이트 결과가 없습니다.');
        return res.status(500).json({
          success: false,
          message: '운영 상태 업데이트에 실패했습니다.',
          error: 'UPDATE_FAILED'
        });
      }

      const updatedStore = updateResult.rows[0];
      const actionText = newStatus ? '운영 시작' : '운영 중지';
      
      console.log(`✅ [API] 매장 ${storeIdInt} 운영 상태 변경 완료: ${updatedStore.is_open} (${actionText})`);

      // 성공 응답
      res.json({
        success: true,
        message: `매장이 ${actionText}되었습니다.`,
        store: {
          id: updatedStore.id,
          name: updatedStore.name,
          isOpen: updatedStore.is_open
        },
        previousStatus: currentStore.is_open,
        isOpen: updatedStore.is_open,
        changed: true,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ [API] 매장 운영 상태 토글 오류:', error);
    
    // 상세한 에러 정보 로깅
    console.error('❌ [API] 에러 스택:', error.stack);
    
    res.status(500).json({
      success: false,
      message: '서버 내부 오류가 발생했습니다.',
      error: 'INTERNAL_SERVER_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = { router, updateStoreRating };