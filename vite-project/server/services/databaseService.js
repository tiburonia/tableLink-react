const databaseRepository = require('../repositories/databaseRepository');

const databaseService = {
  testConnection: async () => {
    const timestamp = await databaseRepository.testConnection();
    return {
      connected: true,
      timestamp,
      message: '데이터베이스 연결 성공',
    };
  },

  initDatabase: async () => {
    const tables = await databaseRepository.initTables();
    return {
      success: true,
      message: '데이터베이스 초기화 완료',
      tables,
    };
  },
};

module.exports = databaseService;
