import { orderController } from './controllers/orderController.js';

window.renderOrderScreen = async function(store, tableName, tableNumber) {
  await orderController.initializeOrder(store, tableName, tableNumber);
};

window.switchCategory = function(category) {
  orderController.switchCategory(category);
};

window.toggleCart = function() {
  orderController.toggleCart();
};

window.closeCart = function() {
  orderController.closeCart();
};

window.addToCart = function(menuId, menuName, price) {
  orderController.addToCart(menuId, menuName, price);
};

window.updateQuantity = function(menuId, change) {
  orderController.updateQuantity(menuId, change);
};

window.removeFromCart = function(menuId) {
  orderController.removeFromCart(menuId);
};

window.proceedToPayment = async function() {
  await orderController.proceedToPayment();
};

console.log('✅ TLL 주문 화면 모듈 로드 완료 (레이어드 아키텍처)');
