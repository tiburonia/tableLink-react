
const express = require('express');
const router = express.Router();
const pool = require('../shared/config/database');

// 전체 데이터 캐시 조회 API
router.get('/', async (req, res) => {
  try {
    console.log('📦 전체 캐시 데이터 요청');

    // 모든 매장 조회
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

    const cacheData = {
      success: true,
      message: 'TableLink 캐시 데이터',
      timestamp: new Date().toISOString(),
      stores: storesWithTables
    };

    console.log(`✅ 캐시 데이터 제공 완료: ${storesWithTables.length}개 매장`);

    res.json(cacheData);

  } catch (error) {
    console.error('❌ 캐시 데이터 조회 실패:', error);
    res.status(500).json({ 
      success: false, 
      error: '캐시 데이터 조회 실패' 
    });
  }
});

// 매장별 캐시 조회 API
router.get('/stores/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;
    console.log(`📦 매장 ${storeId} 캐시 데이터 요청`);

    const storeResult = await pool.query('SELECT * FROM stores WHERE id = $1', [parseInt(storeId)]);

    if (storeResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: '매장을 찾을 수 없습니다' 
      });
    }

    const store = storeResult.rows[0];

    const tablesResult = await pool.query(`
      SELECT 
        table_number, table_name, seats, is_occupied, occupied_since
      FROM store_tables 
      WHERE store_id = $1 
      ORDER BY table_number
    `, [parseInt(storeId)]);

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

    const cacheData = {
      success: true,
      store: {
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
      }
    };

    console.log(`✅ 매장 ${storeId} 캐시 데이터 제공 완료`);
    res.json(cacheData);

  } catch (error) {
    console.error('❌ 매장 캐시 데이터 조회 실패:', error);
    res.status(500).json({ 
      success: false, 
      error: '매장 캐시 데이터 조회 실패' 
    });
  }
});

module.exports = router;
