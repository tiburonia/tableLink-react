const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

// Database Pool (server.js에서 전달받음)
let pool = null;

// Pool 설정 함수 (server.js에서 호출)
function setPool(dbPool) {
  pool = dbPool;
}

// =============================================================================
// STORES ENDPOINTS
// =============================================================================

// 모든 매장 조회
router.get('/stores', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({ error: '데이터베이스 연결 불가' });
    }
    
    const result = await pool.query(
      `SELECT id, name, address, phone, latitude, longitude, category, rating, description, opening_hours, created_at, updated_at 
       FROM stores 
       ORDER BY created_at DESC`
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('❌ 매장 조회 오류:', error);
    res.status(500).json({ error: '매장 조회 실패' });
  }
});

// ID로 매장 조회
router.get('/stores/:id', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({ error: '데이터베이스 연결 불가' });
    }
    
    const result = await pool.query(
      `SELECT id, name, address, phone, latitude, longitude, category, rating, description, opening_hours, created_at, updated_at 
       FROM stores 
       WHERE id = $1`,
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '매장을 찾을 수 없습니다' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ 매장 조회 오류:', error);
    res.status(500).json({ error: '매장 조회 실패' });
  }
});

// 카테고리로 매장 조회
router.get('/stores-by-category/:category', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({ error: '데이터베이스 연결 불가' });
    }
    
    const result = await pool.query(
      `SELECT id, name, address, phone, latitude, longitude, category, rating, description, opening_hours, created_at, updated_at 
       FROM stores 
       WHERE category = $1 
       ORDER BY rating DESC`,
      [req.params.category]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('❌ 카테고리별 매장 조회 오류:', error);
    res.status(500).json({ error: '카테고리별 매장 조회 실패' });
  }
});

// 위치 기반 매장 조회 (반경 내)
router.get('/stores-nearby', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({ error: '데이터베이스 연결 불가' });
    }
    
    const { latitude, longitude, radius = 5 } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ error: '위도, 경도는 필수입니다' });
    }
    
    const result = await pool.query(
      `SELECT id, name, address, phone, latitude, longitude, category, rating, description, opening_hours, created_at, updated_at,
              ST_Distance(
                ST_SetSRID(ST_MakePoint(longitude, latitude), 4326),
                ST_SetSRID(ST_MakePoint($1, $2), 4326)
              )::numeric / 1000 as distance_km
       FROM stores
       WHERE ST_DWithin(
         ST_SetSRID(ST_MakePoint(longitude, latitude), 4326),
         ST_SetSRID(ST_MakePoint($1, $2), 4326),
         $3 * 1000
       )
       ORDER BY distance_km ASC`,
      [longitude, latitude, radius]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('❌ 근처 매장 조회 오류:', error);
    res.status(500).json({ error: '근처 매장 조회 실패' });
  }
});

// 매장 검색
router.get('/stores-search', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({ error: '데이터베이스 연결 불가' });
    }
    
    const { query: searchQuery } = req.query;
    
    if (!searchQuery) {
      return res.status(400).json({ error: '검색어는 필수입니다' });
    }
    
    const query_text = `%${searchQuery}%`;
    const result = await pool.query(
      `SELECT id, name, address, phone, latitude, longitude, category, rating, description, opening_hours, created_at, updated_at
       FROM stores
       WHERE name ILIKE $1 OR address ILIKE $1 OR category ILIKE $1
       ORDER BY rating DESC`,
      [query_text]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('❌ 매장 검색 오류:', error);
    res.status(500).json({ error: '매장 검색 실패' });
  }
});

// 매장 생성
router.post('/stores', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({ error: '데이터베이스 연결 불가' });
    }
    
    const { name, address, latitude, longitude, phone, category, description, opening_hours } = req.body;
    
    if (!name || !address || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: '필수 항목: name, address, latitude, longitude' });
    }
    
    const result = await pool.query(
      `INSERT INTO stores (name, address, latitude, longitude, phone, category, description, opening_hours, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING id, name, address, phone, latitude, longitude, category, rating, description, opening_hours, created_at, updated_at`,
      [name, address, latitude, longitude, phone || null, category || null, description || null, opening_hours || null]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ 매장 생성 오류:', error);
    res.status(500).json({ error: '매장 생성 실패' });
  }
});

// 매장 업데이트
router.put('/stores/:id', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({ error: '데이터베이스 연결 불가' });
    }
    
    const { id } = req.params;
    const updates = req.body;
    const keys = Object.keys(updates);
    
    if (keys.length === 0) {
      return res.status(400).json({ error: '업데이트할 항목이 없습니다' });
    }
    
    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
    const values = [...Object.values(updates), id];
    
    const result = await pool.query(
      `UPDATE stores
       SET ${setClause}, updated_at = NOW()
       WHERE id = $${keys.length + 1}
       RETURNING id, name, address, phone, latitude, longitude, category, rating, description, opening_hours, created_at, updated_at`,
      values
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '매장을 찾을 수 없습니다' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ 매장 업데이트 오류:', error);
    res.status(500).json({ error: '매장 업데이트 실패' });
  }
});

// 매장 삭제
router.delete('/stores/:id', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({ error: '데이터베이스 연결 불가' });
    }
    
    const result = await pool.query(
      'DELETE FROM stores WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '매장을 찾을 수 없습니다' });
    }
    
    res.json({ success: true, id: result.rows[0].id });
  } catch (error) {
    console.error('❌ 매장 삭제 오류:', error);
    res.status(500).json({ error: '매장 삭제 실패' });
  }
});

// =============================================================================
// USERS ENDPOINTS
// =============================================================================

// 모든 사용자 조회
router.get('/users', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({ error: '데이터베이스 연결 불가' });
    }
    
    const result = await pool.query(
      `SELECT id, email, name, phone, created_at, updated_at 
       FROM users 
       ORDER BY created_at DESC`
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('❌ 사용자 조회 오류:', error);
    res.status(500).json({ error: '사용자 조회 실패' });
  }
});

// ID로 사용자 조회
router.get('/users/:id', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({ error: '데이터베이스 연결 불가' });
    }
    
    const result = await pool.query(
      `SELECT id, email, name, phone, created_at, updated_at 
       FROM users 
       WHERE id = $1`,
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ 사용자 조회 오류:', error);
    res.status(500).json({ error: '사용자 조회 실패' });
  }
});

// 이메일로 사용자 조회
router.get('/users-by-email/:email', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({ error: '데이터베이스 연결 불가' });
    }
    
    const result = await pool.query(
      `SELECT id, email, name, phone, created_at, updated_at 
       FROM users 
       WHERE email = $1`,
      [req.params.email]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ 사용자 조회 오류:', error);
    res.status(500).json({ error: '사용자 조회 실패' });
  }
});

// 사용자 생성
router.post('/users', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({ error: '데이터베이스 연결 불가' });
    }
    
    const { email, name, phone } = req.body;
    
    if (!email || !name) {
      return res.status(400).json({ error: '필수 항목: email, name' });
    }
    
    const result = await pool.query(
      `INSERT INTO users (email, name, phone, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING id, email, name, phone, created_at, updated_at`,
      [email, name, phone || null]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ 사용자 생성 오류:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: '이미 존재하는 이메일입니다' });
    }
    res.status(500).json({ error: '사용자 생성 실패' });
  }
});

// 사용자 업데이트
router.put('/users/:id', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({ error: '데이터베이스 연결 불가' });
    }
    
    const { id } = req.params;
    const updates = req.body;
    const keys = Object.keys(updates);
    
    if (keys.length === 0) {
      return res.status(400).json({ error: '업데이트할 항목이 없습니다' });
    }
    
    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
    const values = [...Object.values(updates), id];
    
    const result = await pool.query(
      `UPDATE users
       SET ${setClause}, updated_at = NOW()
       WHERE id = $${keys.length + 1}
       RETURNING id, email, name, phone, created_at, updated_at`,
      values
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ 사용자 업데이트 오류:', error);
    res.status(500).json({ error: '사용자 업데이트 실패' });
  }
});

// 사용자 삭제
router.delete('/users/:id', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({ error: '데이터베이스 연결 불가' });
    }
    
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }
    
    res.json({ success: true, id: result.rows[0].id });
  } catch (error) {
    console.error('❌ 사용자 삭제 오류:', error);
    res.status(500).json({ error: '사용자 삭제 실패' });
  }
});

// =============================================================================
// DATABASE CONNECTION TEST
// =============================================================================

// 데이터베이스 연결 테스트
router.get('/test-connection', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({ error: '데이터베이스 풀이 초기화되지 않았습니다', connected: false });
    }
    
    const result = await pool.query('SELECT NOW()');
    
    res.json({
      connected: true,
      timestamp: result.rows[0].now,
      message: '데이터베이스 연결 성공'
    });
  } catch (error) {
    console.error('❌ 데이터베이스 연결 테스트 실패:', error);
    res.status(503).json({
      connected: false,
      error: '데이터베이스 연결 실패',
      message: error.message
    });
  }
});

module.exports = router;
module.exports.setPool = setPool;
