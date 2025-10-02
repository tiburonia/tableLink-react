const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authService = require('../services/authService');

// ============ 회원가입 관련 ============

// 아이디 중복 체크
router.post('/users/check-id', async (req, res, next) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ success: false, error: '아이디를 입력해주세요' });
    }

    if (!/^[a-zA-Z0-9]{3,20}$/.test(id)) {
      return res.status(400).json({ success: false, error: '아이디는 3-20자의 영문과 숫자만 사용 가능합니다' });
    }

    const available = await authService.checkIdAvailability(id.trim());

    res.json({
      success: true,
      available,
      message: available ? '사용 가능한 아이디입니다' : '이미 사용 중인 아이디입니다'
    });
  } catch (error) {
    next(error);
  }
});

// 전화번호 중복 체크
router.post('/users/check-phone', async (req, res, next) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ success: false, error: '전화번호를 입력해주세요' });
    }

    if (!/^010-\d{4}-\d{4}$/.test(phone)) {
      return res.status(400).json({ success: false, error: '올바른 전화번호 형식이 아닙니다' });
    }

    const available = await authService.checkPhoneAvailability(phone.trim());

    res.json({
      success: true,
      available,
      message: available ? '사용 가능한 전화번호입니다' : '이미 등록된 전화번호입니다'
    });
  } catch (error) {
    next(error);
  }
});

// 회원가입
router.post('/users/signup', async (req, res, next) => {
  try {
    const { id, pw, name, phone } = req.body;

    const newUser = await authService.signup({ id, pw, name, phone });

    res.json({
      success: true,
      message: '회원가입이 완료되었습니다',
      user: newUser
    });
  } catch (error) {
    next(error);
  }
});

// ============ 로그인 관련 ============

// 로그인 (POST /login, /users/login 모두 지원)
router.post('/login', async (req, res, next) => {
  try {
    const { id, pw } = req.body;

    const user = await authService.login(id, pw);

    res.json({
      success: true,
      message: '로그인 성공',
      user
    });
  } catch (error) {
    next(error);
  }
});

router.post('/users/login', async (req, res, next) => {
  try {
    const { id, pw } = req.body;

    const user = await authService.login(id, pw);

    res.json({
      success: true,
      message: '로그인 성공',
      user
    });
  } catch (error) {
    next(error);
  }
});

// ============ 사용자 정보 관련 ============

// 마이페이지 통합 데이터 조회 (NEW!)
router.get('/users/:userId/mypage', userController.getMypageData);

// 사용자 정보 조회 (POST)
router.post('/users/info', userController.getUserInfo);

// 사용자 정보 조회 (GET)
router.get('/user/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await authService.getUserWithCoupons(userId);

    res.json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
});

// 사용자 정보 업데이트
router.put('/users/update', userController.updateUserInfo);

// ============ 즐겨찾기 관련 ============

// 즐겨찾기 조회
router.get('/users/favorites/:userId', userController.getFavoriteStores);

// 즐겨찾기 토글
router.post('/users/favorite/toggle', userController.toggleFavorite);

// 즐겨찾기 상태 확인
router.get('/users/favorite/status/:userId/:storeId', userController.getFavoriteStatus);

module.exports = router;