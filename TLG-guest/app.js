
/**
 * 비회원 TLL 앱 진입점
 */
import { guestTLLController } from './controllers/guestTLLController.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log('🎫 비회원 QR 주문 시스템 시작');
  guestTLLController.init();
});
