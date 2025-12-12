const userRepository = require('../repositories/userRepository');

const userService = {
  getAllUsers: async () => {
    return await userRepository.findAll();
  },

  getUserById: async (id) => {
    const user = await userRepository.findById(id);
    if (!user) {
      throw { status: 404, message: '사용자를 찾을 수 없습니다' };
    }
    return user;
  },

  getUserByEmail: async (email) => {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw { status: 404, message: '사용자를 찾을 수 없습니다' };
    }
    return user;
  },

  createUser: async ({ email, name, phone }) => {
    if (!email || !name) {
      throw { status: 400, message: '필수 항목: email, name' };
    }
    try {
      return await userRepository.create({ email, name, phone });
    } catch (error) {
      if (error.code === '23505') {
        throw { status: 409, message: '이미 존재하는 이메일입니다' };
      }
      throw error;
    }
  },

  updateUser: async (id, updates) => {
    if (Object.keys(updates).length === 0) {
      throw { status: 400, message: '업데이트할 항목이 없습니다' };
    }
    const user = await userRepository.update(id, updates);
    if (!user) {
      throw { status: 404, message: '사용자를 찾을 수 없습니다' };
    }
    return user;
  },

  deleteUser: async (id) => {
    const result = await userRepository.delete(id);
    if (!result) {
      throw { status: 404, message: '사용자를 찾을 수 없습니다' };
    }
    return { success: true, id: result.id };
  },
};

module.exports = userService;
