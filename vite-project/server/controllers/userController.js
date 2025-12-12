const userService = require('../services/userService');

const userController = {
  getAll: async (req, res) => {
    try {
      const users = await userService.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error('❌ 사용자 조회 오류:', error);
      res.status(error.status || 500).json({ error: error.message || '사용자 조회 실패' });
    }
  },

  getById: async (req, res) => {
    try {
      const user = await userService.getUserById(req.params.id);
      res.json(user);
    } catch (error) {
      console.error('❌ 사용자 조회 오류:', error);
      res.status(error.status || 500).json({ error: error.message || '사용자 조회 실패' });
    }
  },

  getByEmail: async (req, res) => {
    try {
      const user = await userService.getUserByEmail(req.params.email);
      res.json(user);
    } catch (error) {
      console.error('❌ 사용자 조회 오류:', error);
      res.status(error.status || 500).json({ error: error.message || '사용자 조회 실패' });
    }
  },

  create: async (req, res) => {
    try {
      const user = await userService.createUser(req.body);
      res.status(201).json(user);
    } catch (error) {
      console.error('❌ 사용자 생성 오류:', error);
      res.status(error.status || 500).json({ error: error.message || '사용자 생성 실패' });
    }
  },

  update: async (req, res) => {
    try {
      const user = await userService.updateUser(req.params.id, req.body);
      res.json(user);
    } catch (error) {
      console.error('❌ 사용자 업데이트 오류:', error);
      res.status(error.status || 500).json({ error: error.message || '사용자 업데이트 실패' });
    }
  },

  delete: async (req, res) => {
    try {
      const result = await userService.deleteUser(req.params.id);
      res.json(result);
    } catch (error) {
      console.error('❌ 사용자 삭제 오류:', error);
      res.status(error.status || 500).json({ error: error.message || '사용자 삭제 실패' });
    }
  },
};

module.exports = userController;
