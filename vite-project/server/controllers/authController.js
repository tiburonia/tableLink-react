const authService = require('../services/authService');

const authController = {
  register: async (req, res) => {
    try {
      const user = await authService.register(req.body);
      res.status(201).json(user);
    } catch (error) {
      console.error('❌ 회원가입 오류:', error);
      res.status(error.status || 500).json({ error: error.message || '회원가입 실패' });
    }
  },

  login: async (req, res) => {
    try {
      const result = await authService.login(req.body);
      res.json(result);
    } catch (error) {
      console.error('❌ 로그인 오류:', error);
      res.status(error.status || 500).json({ error: error.message || '로그인 실패' });
    }
  },
};

module.exports = authController;
