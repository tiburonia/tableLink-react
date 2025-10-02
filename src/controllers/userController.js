
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
   * 사용자 정보 조회
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

      const user = await userService.getUserWithCoupons(userId);

      res.json({
        success: true,
        user
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

      const isFavorited = await userService.getFavoriteStatus(parseInt(userId), parseInt(storeId));

      res.json({
        success: true,
        userId: parseInt(userId),
        storeId: parseInt(storeId),
        isFavorited
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
