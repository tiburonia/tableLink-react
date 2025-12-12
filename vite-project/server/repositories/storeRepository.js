const { pool } = require('../config/database');

const storeRepository = {
  findAll: async () => {
    const result = await pool.query(
      `SELECT id, name, address, phone, latitude, longitude, category, rating, description, opening_hours, created_at, updated_at 
       FROM stores 
       ORDER BY created_at DESC`
    );
    return result.rows;
  },

  findById: async (id) => {
    const result = await pool.query(
      `SELECT id, name, address, phone, latitude, longitude, category, rating, description, opening_hours, created_at, updated_at 
       FROM stores 
       WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  findByCategory: async (category) => {
    const result = await pool.query(
      `SELECT id, name, address, phone, latitude, longitude, category, rating, description, opening_hours, created_at, updated_at 
       FROM stores 
       WHERE category = $1 
       ORDER BY rating DESC`,
      [category]
    );
    return result.rows;
  },

  findNearby: async (longitude, latitude, radius) => {
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
    return result.rows;
  },

  search: async (query) => {
    const queryText = `%${query}%`;
    const result = await pool.query(
      `SELECT id, name, address, phone, latitude, longitude, category, rating, description, opening_hours, created_at, updated_at
       FROM stores
       WHERE name ILIKE $1 OR address ILIKE $1 OR category ILIKE $1
       ORDER BY rating DESC`,
      [queryText]
    );
    return result.rows;
  },

  create: async ({ name, address, latitude, longitude, phone, category, description, opening_hours }) => {
    const result = await pool.query(
      `INSERT INTO stores (name, address, latitude, longitude, phone, category, description, opening_hours, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING id, name, address, phone, latitude, longitude, category, rating, description, opening_hours, created_at, updated_at`,
      [name, address, latitude, longitude, phone || null, category || null, description || null, opening_hours || null]
    );
    return result.rows[0];
  },

  update: async (id, updates) => {
    const keys = Object.keys(updates);
    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
    const values = [...Object.values(updates), id];
    
    const result = await pool.query(
      `UPDATE stores
       SET ${setClause}, updated_at = NOW()
       WHERE id = $${keys.length + 1}
       RETURNING id, name, address, phone, latitude, longitude, category, rating, description, opening_hours, created_at, updated_at`,
      values
    );
    return result.rows[0] || null;
  },

  delete: async (id) => {
    const result = await pool.query(
      'DELETE FROM stores WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0] || null;
  },
};

module.exports = storeRepository;
