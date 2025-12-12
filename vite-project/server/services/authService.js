const userRepository = require('../repositories/userRepository');

const authService = {
  register: async ({ id, name, password, phone }) => {
    if (!id || !name || !password) {
      throw { status: 400, message: '필수 항목: id, name, password' };
    }
    
    try {
      return await userRepository.createWithPassword({ id, name, phone, password });
    } catch (error) {
      if (error.code === '23505') {
        throw { status: 409, message: '이미 존재하는 아이디입니다' };
      }
      throw error;
    }
  },

  login: async ({ id, password }) => {
    if (!id || !password) {
      throw { status: 400, message: '필수 항목: id, password' };
    }

    const user = await userRepository.findByIdAndPassword(id, password);
    if (!user) {
      throw { status: 401, message: '잘못된 아이디 또는 비밀번호' };
    }

    return user;
  },
};

module.exports = authService;
