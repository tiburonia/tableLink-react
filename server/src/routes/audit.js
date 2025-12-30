
const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');

/**
 * [POST] /audit/log - 감사 로그 기록
 */
router.post('/log', async (req, res, next) => {
  try {
    const {
      event_type,
      session_id,
      table_number,
      store_id,
      user_id = 'POS_USER',
      event_data = {},
      event_description
    } = req.body;

    // 감사 로그 테이블이 없으면 콘솔에만 기록
    try {
      await pool.query(`
        INSERT INTO audit_logs (
          event_type, session_id, table_number, store_id, 
          user_id, event_data, event_description, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
      `, [event_type, session_id, table_number, store_id, user_id, 
          JSON.stringify(event_data), event_description]);

      console.log(`📊 감사 로그 기록: ${event_type} - ${event_description}`);
    } catch (tableError) {
      // 테이블이 없으면 콘솔에만 기록
      console.log(`📊 감사 로그 (콘솔): ${event_type} - ${event_description}`, {
        session_id, table_number, store_id, user_id, event_data
      });
    }

    res.json({
      success: true,
      message: '감사 로그 기록됨'
    });

  } catch (error) {
    console.error('❌ 감사 로그 기록 실패:', error);
    res.status(500).json({
      success: false,
      error: '감사 로그 기록 실패'
    });
  }
});

/**
 * [GET] /audit/session/:sessionId - 세션별 감사 로그 조회
 */
router.get('/session/:sessionId', async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const result = await pool.query(`
      SELECT 
        event_type,
        event_description,
        user_id,
        event_data,
        created_at
      FROM audit_logs 
      WHERE session_id = $1 
      ORDER BY created_at ASC
    `, [sessionId]);

    res.json({
      success: true,
      auditLogs: result.rows
    });

  } catch (error) {
    console.error('❌ 감사 로그 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '감사 로그 조회 실패'
    });
  }
});

module.exports = router;
