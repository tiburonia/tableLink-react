import { OrderService } from '../services/orderService.js';
import { OrderView } from '../views/orderView.js';

export class OrderController {
  constructor() {
    this.orderState = null;
    this.menuData = null;
  }

  async initializeOrder(store, tableName, tableNumber) {
    try {
      console.log('🛒 TLL 주문 화면 로드:', { store: store.name, table: tableName, tableNum: tableNumber });

      const userInfo = this.getUserInfo();
      if (!userInfo) {
        alert('로그인이 필요합니다.');
        if (typeof renderLogin === 'function') {
          renderLogin();
        }
        return;
      }

      const finalTableNumber = parseInt(tableNumber) || 1;
      const finalTableName = tableName || `${finalTableNumber}번 테이블`;

      console.log(`🔍 TLL 최종 테이블 정보: ${finalTableName} (번호: ${finalTableNumber})`);

      this.menuData = await OrderService.loadMenuData(store.id);
      const menuByCategory = OrderService.groupMenuByCategory(this.menuData);

      OrderView.renderOrderHTML(store, finalTableName, finalTableNumber, menuByCategory);

      this.orderState = {
        storeId: store.id,
        storeName: store.name,
        tableName: finalTableName,
        tableNumber: finalTableNumber,
        cart: [],
        userInfo: userInfo
      };

      window.currentTLLOrder = this.orderState;
      window.currentMenuData = this.menuData;

      console.log('🏪 currentTLLOrder 초기화 완료:', this.orderState);
      console.log('✅ TLL 주문 화면 렌더링 완료');

    } catch (error) {
      console.error('❌ TLL 주문 화면 로드 실패:', error);
      alert('주문 화면 로드에 실패했습니다: ' + error.message);
      if (typeof TLL === 'function') {
        TLL();
      }
    }
  }

  getUserInfo() {
    try {
      const cookies = document.cookie.split(';').map(cookie => cookie.trim());
      const userInfoCookie = cookies.find(cookie => cookie.startsWith('userInfo='));

      if (userInfoCookie) {
        const userInfoValue = decodeURIComponent(userInfoCookie.split('=')[1]);
        return JSON.parse(userInfoValue);
      }

      const localStorageUserInfo = localStorage.getItem('userInfo');
      if (localStorageUserInfo) {
        return JSON.parse(localStorageUserInfo);
      }

      if (window.userInfo && window.userInfo.id) {
        return window.userInfo;
      }

      return null;
    } catch (error) {
      console.error('❌ 사용자 정보 파싱 오류:', error);
      return null;
    }
  }

  switchCategory(category) {
    OrderView.switchCategory(category);
  }

  toggleCart() {
    OrderView.toggleCart();
  }

  closeCart() {
    OrderView.closeCart();
  }

  addToCart(menuId, menuName, price) {
    console.log('🛒 장바구니 추가 요청:', { menuId, menuName, price });

    if (!window.currentTLLOrder) {
      console.error('❌ currentTLLOrder가 존재하지 않습니다');
      alert('주문 시스템 초기화 오류입니다. 페이지를 새로고침해주세요.');
      return;
    }

    if (!window.currentTLLOrder.cart) {
      console.warn('⚠️ cart 배열이 초기화되지 않음, 새로 생성');
      window.currentTLLOrder.cart = [];
    }

    if (!window.currentMenuData || !Array.isArray(window.currentMenuData)) {
      console.error('❌ 메뉴 데이터가 없습니다');
      alert('메뉴 데이터 로드 오류입니다.');
      return;
    }

    window.currentTLLOrder.cart = OrderService.addToCart(
      window.currentTLLOrder.cart,
      window.currentMenuData,
      menuId,
      menuName,
      price
    );

    this.updateCartDisplay();
  }

  updateQuantity(menuId, change) {
    if (!window.currentTLLOrder?.cart) {
      console.error('❌ 장바구니가 존재하지 않습니다');
      return;
    }

    window.currentTLLOrder.cart = OrderService.updateQuantity(
      window.currentTLLOrder.cart,
      menuId,
      change
    );

    this.updateCartDisplay();
  }

  removeFromCart(menuId) {
    if (!window.currentTLLOrder?.cart) {
      console.error('❌ 장바구니가 존재하지 않습니다');
      return;
    }

    window.currentTLLOrder.cart = OrderService.removeFromCart(
      window.currentTLLOrder.cart,
      menuId
    );

    this.updateCartDisplay();
  }

  updateCartDisplay() {
    if (!window.currentTLLOrder?.cart) {
      console.error('❌ 장바구니가 존재하지 않습니다');
      return;
    }

    const totalAmount = OrderService.calculateCartTotal(window.currentTLLOrder.cart);
    OrderView.updateCartDisplay(window.currentTLLOrder.cart, totalAmount);

    console.log('🔄 장바구니 디스플레이 업데이트 완료:', {
      items: window.currentTLLOrder.cart.length,
      total: totalAmount
    });
  }

  async proceedToPayment() {
    try {
      console.log('🔍 결제 진행 시 상태 확인:', {
        currentTLLOrder: window.currentTLLOrder,
        hasCart: window.currentTLLOrder?.cart,
        cartLength: window.currentTLLOrder?.cart?.length
      });

      if (!window.currentTLLOrder) {
        console.error('❌ currentTLLOrder가 존재하지 않습니다');
        
        if (window.currentTLLCart && window.currentTLLCart.cart && window.currentTLLCart.cart.length > 0) {
          console.log('🔄 currentTLLCart 발견, currentTLLOrder로 변환 시도');
          window.currentTLLOrder = {
            storeId: window.currentTLLCart.storeId,
            storeName: window.currentTLLCart.storeName,
            tableName: window.currentTLLCart.tableName,
            tableNumber: window.currentTLLCart.tableNumber,
            cart: window.currentTLLCart.cart,
            userInfo: window.currentTLLCart.userInfo
          };
          console.log('✅ currentTLLOrder 복원 완료:', window.currentTLLOrder);
        } else {
          alert('주문 시스템에 오류가 있습니다. 페이지를 새로고침한 후 다시 시도해주세요.');
          return;
        }
      }

      const validation = OrderService.validateCart(window.currentTLLOrder.cart);
      
      if (!validation.valid) {
        alert(validation.message);
        return;
      }

      if (validation.validItems.length !== window.currentTLLOrder.cart.length) {
        console.log('🔄 유효하지 않은 아이템 제거, 장바구니 업데이트');
        window.currentTLLOrder.cart = validation.validItems;
        this.updateCartDisplay();
      }

      const totalAmount = OrderService.calculateCartTotal(window.currentTLLOrder.cart);
      
      console.log('✅ 장바구니 검증 완료:', {
        items: window.currentTLLOrder.cart.length,
        total: totalAmount
      });

      const orderData = OrderService.prepareOrderData(
        window.currentTLLOrder.storeId,
        window.currentTLLOrder.storeName,
        window.currentTLLOrder.tableName,
        window.currentTLLOrder.tableNumber,
        window.currentTLLOrder.cart,
        window.currentTLLOrder.userInfo
      );

      console.log('🔄 결제 화면으로 이동:', orderData);

      if (typeof window.renderPay === 'function') {
        window.renderPay(orderData);
      } else {
        console.error('❌ renderPay 함수가 존재하지 않습니다');
        alert('결제 시스템에 오류가 있습니다. 새로고침 후 다시 시도해주세요.');
      }

    } catch (error) {
      console.error('❌ 결제 진행 오류:', error);
      alert('결제를 진행할 수 없습니다: ' + error.message);
    }
  }
}

export const orderController = new OrderController();
