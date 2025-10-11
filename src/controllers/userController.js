
const userService = require('../services/userService');

/**
 * 사용자 컨트롤러 - HTTP 요청/응답 처리
 */
class UserController {
  /**
   * 마이페이지 통합 데이터 조회
   */
  async getMypageData(req, res, next) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: '사용자 ID가 필요합니다'
        });
      }

      // userId는 users.id (PK) 값
      const userPk = parseInt(userId);
      if (isNaN(userPk) || userPk <= 0) {
        return res.status(400).json({
          success: false,
          error: '유효하지 않은 사용자 ID입니다'
        });
      }

      const data = await userService.getMypageData(userPk);

      res.json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 사용자 정보 조회 (마이페이지용)
   * PK(id)를 받아서 사용자 정보 반환
   */
  async getUserInfo(req, res, next) {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: '사용자 ID가 필요합니다'
        });
      }

      // userId는 PK(id)로 처리
      const userPk = parseInt(userId);
      if (isNaN(userPk) || userPk <= 0) {
        return res.status(400).json({
          success: false,
          error: '유효하지 않은 사용자 ID입니다'
        });
      }

      // userRepository에서 직접 PK로 조회
      const userRepository = require('../repositories/userRepository');
      const user = await userRepository.getUserById(userPk);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: '사용자를 찾을 수 없습니다'
        });
      }

      // 쿠폰 정보도 함께 조회
      const coupons = await userRepository.getUserCoupons(userPk);

      res.json({
        success: true,
        user: {
          id: user.id,
          userId: user.user_id,
          name: user.name,
          phone: user.phone,
          email: user.email || '',
          address: user.address || '',
          birth: user.birth || '',
          gender: user.gender || '',
          point: user.point || 0,
          coupons,
          couponStats: {
            total: coupons.unused.length + coupons.used.length,
            unused: coupons.unused.length,
            used: coupons.used.length
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  
  /**
   * 즐겨찾기 매장 조회
   */
  async getFavoriteStores(req, res, next) {
    try {
      const { userId } = req.params;

      const stores = await userService.getFavoriteStores(parseInt(userId));

      res.json({
        success: true,
        stores
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 즐겨찾기 토글
   */
  async toggleFavorite(req, res, next) {
    try {
      const { userId, storeId, action } = req.body;

      if (!userId || !storeId) {
        return res.status(400).json({
          success: false,
          error: 'userId와 storeId가 필요합니다'
        });
      }

      const result = await userService.toggleFavorite(parseInt(userId), parseInt(storeId), action);

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 즐겨찾기 상태 확인
   */
  async getFavoriteStatus(req, res, next) {
    try {
      const { userId, storeId } = req.params;

      const isFavorite = await userService.getFavoriteStatus(parseInt(userId), parseInt(storeId));

      res.json({
        success: true,
        isFavorite
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 사용자 주문 내역 조회
   */
  async getUserOrders(req, res, next) {
    try {
      const { userId } = req.params;
      const { limit = 100, offset = 0, status } = req.query;

      console.log('📦 주문 내역 요청:', { userId, limit, offset, status });

      if (!userId) {
        console.error('❌ userId 파라미터 누락');
        return res.status(400).json({
          success: false,
          error: '사용자 ID가 필요합니다'
        });
      }

      const userPk = parseInt(userId, 10);
      if (isNaN(userPk) || userPk <= 0) {
        console.error('❌ 유효하지 않은 userId:', userId);
        return res.status(400).json({
          success: false,
          error: '유효하지 않은 사용자 ID입니다',
          receivedUserId: userId
        });
      }

      const orders = await userService.getUserOrders(userPk, {
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
        status
      });

      console.log(`✅ 주문 내역 조회 완료: ${orders.length}건`);

      res.json({
        success: true,
        orders,
        count: orders.length
      });
    } catch (error) {
      console.error('❌ getUserOrders 컨트롤러 에러:', error);
      next(error);
    }
  }

  /**
   * 전화번호로 회원 조회
   */
  async searchByPhone(req, res, next) {
    try {
      const { phone } = req.query;

      if (!phone) {
        return res.status(400).json({
          success: false,
          error: '전화번호가 필요합니다'
        });
      }

      const user = await userService.searchByPhone(phone);

      if (!user) {
        return res.json({
          success: false,
          error: '해당 전화번호로 등록된 회원을 찾을 수 없습니다'
        });
      }

      res.json({
        success: true,
        user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 사용자 정보 업데이트
   */
  async updateUserInfo(req, res, next) {
    try {
      const { userId, name, phone, email, birth, gender, address, detailAddress, notifications } = req.body;

      if (!userId || !name || !phone) {
        return res.status(400).json({
          success: false,
          message: '필수 필드가 누락되었습니다.'
        });
      }

      const updatedUser = await userService.updateUserInfo(parseInt(userId), {
        name,
        phone,
        email,
        birth,
        gender,
        address,
        detailAddress,
        notifications
      });

      res.json({
        success: true,
        message: '사용자 정보가 성공적으로 업데이트되었습니다.',
        user: updatedUser
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
