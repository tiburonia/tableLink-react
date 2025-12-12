const databaseService = require('../services/databaseService');

const databaseController = {
  testConnection: async (req, res) => {
    try {
      const result = await databaseService.testConnection();
      res.json(result);
    } catch (error) {
      console.error('❌ 데이터베이스 연결 테스트 실패:', error);
      res.status(503).json({
        connected: false,
        error: '데이터베이스 연결 실패',
        message: error.message,
      });
    }
  },

  init: async (req, res) => {
    try {
      const result = await databaseService.initDatabase();
      res.json(result);
    } catch (error) {
      console.error('❌ 데이터베이스 초기화 오류:', error);
      res.status(500).json({ error: '데이터베이스 초기화 실패' });
    }
  },
};

module.exports = databaseController;
