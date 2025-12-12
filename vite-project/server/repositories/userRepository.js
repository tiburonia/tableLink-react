const { pool } = require('../config/database');

const userRepository = {
  findAll: async () => {
    const result = await pool.query(
      `SELECT id, email, name, phone, created_at, updated_at 
       FROM users 
       ORDER BY created_at DESC`
    );
    return result.rows;
  },

  findById: async (id) => {
    const result = await pool.query(
      `SELECT id, email, name, phone, created_at, updated_at 
       FROM users 
       WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  findByEmail: async (email) => {
    const result = await pool.query(
      `SELECT id, email, name, phone, created_at, updated_at 
       FROM users 
       WHERE email = $1`,
      [email]
    );
    return result.rows[0] || null;
  },

  findByIdAndPassword: async (id, password) => {
    const result = await pool.query(
      `SELECT id, user_id, name, phone, status FROM users WHERE user_id = $1 AND user_pw = $2`,
      [id, password]
    );
    return result.rows[0] || null;
  },

  create: async ({ email, name, phone }) => {
    const result = await pool.query(
      `INSERT INTO users (email, name, phone, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING id, email, name, phone, created_at, updated_at`,
      [email, name, phone || null]
    );
    return result.rows[0];
  },

  createWithPassword: async ({ id, name, phone, password }) => {
    const result = await pool.query(
      `INSERT INTO users (user_id, name, phone, user_pw, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING id, user_id, name, phone, created_at, updated_at`,
      [id, name, phone || null, password]
    );
    return result.rows[0];
  },

  update: async (id, updates) => {
    const keys = Object.keys(updates);
    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
    const values = [...Object.values(updates), id];
    
    const result = await pool.query(
      `UPDATE users
       SET ${setClause}, updated_at = NOW()
       WHERE id = $${keys.length + 1}
       RETURNING id, email, name, phone, created_at, updated_at`,
      values
    );
    return result.rows[0] || null;
  },

  delete: async (id) => {
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0] || null;
  },
};

module.exports = userRepository;
