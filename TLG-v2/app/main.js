import { initRouter } from './router.js';
import { appState } from '../state/appState.js';
import { on } from './events.js';
import { EVENTS } from './constants.js';

import { handleSearch } from '../controllers/searchController.js';
import { handleLogin, handleLogout } from '../controllers/authController.js';
import { addToCart, removeFromCart, updateCartQuantity, clearCart } from '../controllers/cartController.js';

import '../styles/base.css';
import '../styles/layout.css';
import '../styles/components.css';

(async function bootstrap() {
  console.log('🚀 TLG-v2 앱 시작');
  
  await appState.hydrate();
  
  setupEventListeners();
  
  initRouter();
  
  console.log('✅ TLG-v2 앱 초기화 완료');
})();

function setupEventListeners() {
  on(EVENTS.SEARCH, async ({ q }) => {
    console.log('🔍 검색:', q);
    try {
      await handleSearch(q);
    } catch (error) {
      console.error('검색 실패:', error);
      alert('검색 중 오류가 발생했습니다.');
    }
  });
  
  on(EVENTS.LOGIN, async ({ email, password }) => {
    console.log('🔐 로그인 시도:', email);
    try {
      await handleLogin(email, password);
    } catch (error) {
      console.error('로그인 실패:', error);
      alert('로그인에 실패했습니다.');
    }
  });
  
  on(EVENTS.LOGOUT, async () => {
    console.log('👋 로그아웃');
    try {
      await handleLogout();
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  });
  
  on(EVENTS.CART_UPDATE, ({ menuId, action }) => {
    console.log('🛒 장바구니 업데이트:', menuId, action);
    try {
      if (action === 'plus') {
        addToCart(menuId, 1);
      } else if (action === 'minus') {
        const state = appState.get();
        const currentQty = state.cart[menuId] || 0;
        if (currentQty > 1) {
          updateCartQuantity(menuId, currentQty - 1);
        } else {
          removeFromCart(menuId);
        }
      } else if (action === 'remove') {
        removeFromCart(menuId);
      }
    } catch (error) {
      console.error('장바구니 업데이트 실패:', error);
    }
  });
  
  on(EVENTS.CART_CLEAR, () => {
    console.log('🗑️ 장바구니 전체삭제');
    if (confirm('장바구니를 비우시겠습니까?')) {
      clearCart();
      alert('장바구니가 비워졌습니다.');
      window.location.reload();
    }
  });
  
  on(EVENTS.CART_ORDER, () => {
    console.log('📦 주문하기');
    alert('주문 기능은 준비 중입니다.');
  });
  
  window.addEventListener('tlg:search', (e) => {
    on(EVENTS.SEARCH, () => {})(e.detail);
  });
  
  window.addEventListener('tlg:login', (e) => {
    on(EVENTS.LOGIN, () => {})(e.detail);
  });
}
