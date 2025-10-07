import express from 'express';
import { storage } from './storage.js';
import { insertUserSchema, insertOrderSchema, insertReviewSchema } from '../shared/schema.js';

const router = express.Router();

// ============= Auth Routes =============

router.post('/auth/signup', async (req, res) => {
  try {
    const validatedData = insertUserSchema.parse(req.body);
    
    const existingUser = await storage.getUserByUserId(validatedData.userId);
    if (existingUser) {
      return res.status(400).json({ error: '이미 사용 중인 아이디입니다' });
    }

    const user = await storage.createUser(validatedData);
    
    req.session = req.session || {};
    req.session.userId = user.id;
    req.session.userName = user.name;
    
    res.json({ 
      success: true, 
      user: { 
        id: user.id, 
        userId: user.userId, 
        name: user.name, 
        phone: user.phone 
      } 
    });
  } catch (error) {
    console.error('회원가입 오류:', error);
    res.status(400).json({ error: error.message || '회원가입에 실패했습니다' });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const { userId, userPw } = req.body;
    
    const user = await storage.getUserByUserId(userId);
    if (!user || user.userPw !== userPw) {
      return res.status(401).json({ error: '아이디 또는 비밀번호가 잘못되었습니다' });
    }
    
    req.session = req.session || {};
    req.session.userId = user.id;
    req.session.userName = user.name;
    
    res.json({ 
      success: true, 
      user: { 
        id: user.id, 
        userId: user.userId, 
        name: user.name, 
        phone: user.phone 
      } 
    });
  } catch (error) {
    console.error('로그인 오류:', error);
    res.status(500).json({ error: '로그인에 실패했습니다' });
  }
});

router.post('/auth/logout', (req, res) => {
  req.session = null;
  res.json({ success: true });
});

router.get('/auth/me', async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: '로그인이 필요합니다' });
    }
    
    const user = await storage.getUserById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }
    
    res.json({ 
      user: { 
        id: user.id, 
        userId: user.userId, 
        name: user.name, 
        phone: user.phone,
        email: user.email
      } 
    });
  } catch (error) {
    console.error('사용자 정보 조회 오류:', error);
    res.status(500).json({ error: '사용자 정보 조회에 실패했습니다' });
  }
});

// ============= Store Routes =============

router.get('/stores', async (req, res) => {
  try {
    const stores = await storage.getAllStores();
    
    const storesWithDetails = await Promise.all(
      stores.map(async (store) => {
        const address = await storage.getStoreAddress(store.id);
        const info = await storage.getStoreInfo(store.id);
        return {
          ...store,
          address,
          info
        };
      })
    );
    
    res.json(storesWithDetails);
  } catch (error) {
    console.error('매장 목록 조회 오류:', error);
    res.status(500).json({ error: '매장 목록 조회에 실패했습니다' });
  }
});

router.get('/stores/:id', async (req, res) => {
  try {
    const store = await storage.getStoreById(parseInt(req.params.id));
    if (!store) {
      return res.status(404).json({ error: '매장을 찾을 수 없습니다' });
    }
    
    const address = await storage.getStoreAddress(store.id);
    const info = await storage.getStoreInfo(store.id);
    const menu = await storage.getStoreMenu(store.id);
    
    res.json({
      ...store,
      address,
      info,
      menu
    });
  } catch (error) {
    console.error('매장 상세 조회 오류:', error);
    res.status(500).json({ error: '매장 상세 조회에 실패했습니다' });
  }
});

router.get('/stores/:id/menu', async (req, res) => {
  try {
    const menu = await storage.getStoreMenu(parseInt(req.params.id));
    res.json(menu);
  } catch (error) {
    console.error('메뉴 조회 오류:', error);
    res.status(500).json({ error: '메뉴 조회에 실패했습니다' });
  }
});

// ============= Order Routes =============

router.post('/orders', async (req, res) => {
  try {
    if (!req.session?.userId && !req.body.guestPhone) {
      return res.status(401).json({ error: '로그인이 필요하거나 전화번호를 입력해주세요' });
    }
    
    const orderData = {
      ...req.body,
      userId: req.session?.userId || null,
    };
    
    const validatedData = insertOrderSchema.parse(orderData);
    const order = await storage.createOrder(validatedData);
    
    res.json(order);
  } catch (error) {
    console.error('주문 생성 오류:', error);
    res.status(400).json({ error: error.message || '주문 생성에 실패했습니다' });
  }
});

router.get('/orders/my', async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: '로그인이 필요합니다' });
    }
    
    const orders = await storage.getOrdersByUserId(req.session.userId);
    
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await storage.getOrderItemsByOrderId(order.id);
        return {
          ...order,
          items
        };
      })
    );
    
    res.json(ordersWithItems);
  } catch (error) {
    console.error('주문 내역 조회 오류:', error);
    res.status(500).json({ error: '주문 내역 조회에 실패했습니다' });
  }
});

router.get('/orders/:id', async (req, res) => {
  try {
    const order = await storage.getOrderById(parseInt(req.params.id));
    if (!order) {
      return res.status(404).json({ error: '주문을 찾을 수 없습니다' });
    }
    
    const items = await storage.getOrderItemsByOrderId(order.id);
    const payment = await storage.getPaymentByOrderId(order.id);
    
    res.json({
      ...order,
      items,
      payment
    });
  } catch (error) {
    console.error('주문 상세 조회 오류:', error);
    res.status(500).json({ error: '주문 상세 조회에 실패했습니다' });
  }
});

// ============= Review Routes =============

router.post('/reviews', async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: '로그인이 필요합니다' });
    }
    
    const reviewData = {
      ...req.body,
      userId: req.session.userId
    };
    
    const validatedData = insertReviewSchema.parse(reviewData);
    const review = await storage.createReview(validatedData);
    
    res.json(review);
  } catch (error) {
    console.error('리뷰 작성 오류:', error);
    res.status(400).json({ error: error.message || '리뷰 작성에 실패했습니다' });
  }
});

router.get('/reviews/store/:storeId', async (req, res) => {
  try {
    const reviews = await storage.getReviewsByStoreId(parseInt(req.params.storeId));
    res.json(reviews);
  } catch (error) {
    console.error('리뷰 조회 오류:', error);
    res.status(500).json({ error: '리뷰 조회에 실패했습니다' });
  }
});

router.get('/reviews/my', async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: '로그인이 필요합니다' });
    }
    
    const reviews = await storage.getReviewsByUserId(req.session.userId);
    res.json(reviews);
  } catch (error) {
    console.error('내 리뷰 조회 오류:', error);
    res.status(500).json({ error: '리뷰 조회에 실패했습니다' });
  }
});

// ============= Favorite Routes =============

router.post('/favorites', async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: '로그인이 필요합니다' });
    }
    
    const favoriteData = {
      userId: req.session.userId,
      storeId: req.body.storeId
    };
    
    const exists = await storage.isFavorite(favoriteData.userId, favoriteData.storeId);
    if (exists) {
      return res.status(400).json({ error: '이미 즐겨찾기한 매장입니다' });
    }
    
    const favorite = await storage.createFavorite(favoriteData);
    res.json(favorite);
  } catch (error) {
    console.error('즐겨찾기 추가 오류:', error);
    res.status(400).json({ error: '즐겨찾기 추가에 실패했습니다' });
  }
});

router.delete('/favorites/:storeId', async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: '로그인이 필요합니다' });
    }
    
    await storage.deleteFavorite(req.session.userId, parseInt(req.params.storeId));
    res.json({ success: true });
  } catch (error) {
    console.error('즐겨찾기 삭제 오류:', error);
    res.status(500).json({ error: '즐겨찾기 삭제에 실패했습니다' });
  }
});

router.get('/favorites/my', async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: '로그인이 필요합니다' });
    }
    
    const favorites = await storage.getFavoritesByUserId(req.session.userId);
    
    const favoritesWithStores = await Promise.all(
      favorites.map(async (favorite) => {
        const store = await storage.getStoreById(favorite.storeId);
        const info = await storage.getStoreInfo(favorite.storeId);
        return {
          ...favorite,
          store,
          storeInfo: info
        };
      })
    );
    
    res.json(favoritesWithStores);
  } catch (error) {
    console.error('즐겨찾기 조회 오류:', error);
    res.status(500).json({ error: '즐겨찾기 조회에 실패했습니다' });
  }
});

// ============= Notification Routes =============

router.get('/notifications/my', async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: '로그인이 필요합니다' });
    }
    
    const notifications = await storage.getNotificationsByUserId(req.session.userId);
    res.json(notifications);
  } catch (error) {
    console.error('알림 조회 오류:', error);
    res.status(500).json({ error: '알림 조회에 실패했습니다' });
  }
});

router.patch('/notifications/:id/read', async (req, res) => {
  try {
    await storage.markNotificationAsRead(parseInt(req.params.id));
    res.json({ success: true });
  } catch (error) {
    console.error('알림 읽음 처리 오류:', error);
    res.status(500).json({ error: '알림 읽음 처리에 실패했습니다' });
  }
});

export default router;
