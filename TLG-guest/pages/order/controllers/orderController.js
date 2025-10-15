/**
 * 메뉴 주문 페이지 Controller (비회원 TLL)
 * - 페이지 초기화
 * - 메뉴 선택 및 장바구니 관리
 */

import { orderView } from '../views/orderView.js';
import { orderService } from '../services/orderService.js';

export const orderController = {
    storeId: null,
    tableNumber: null,
    storeInfo: null,
    menus: [],
    cart: [],
    currentMenu: null,
    modalQuantity: 1,
    selectedCategory: null,

    /**
     * 페이지 초기화
     */
    async init(storeId, tableNumber) {
        console.log('🚀 비회원 메뉴 주문 페이지 초기화:', { storeId, tableNumber });

        this.storeId = storeId;
        this.tableNumber = tableNumber;

        // 세션 확인
        const sessionId = localStorage.getItem('guestSessionId');
        if (!sessionId) {
            alert('세션이 만료되었습니다. QR 코드를 다시 스캔해주세요.');
            window.location.href = `/guest/qr.html?storeId=${storeId}&tableNumber=${tableNumber}`;
            return;
        }

        // 장바구니 불러오기
        this.cart = orderService.loadCart();

        // 매장 정보 조회
        const storeResult = await orderService.getStoreInfo(storeId);
        if (!storeResult.success) {
            alert(storeResult.message);
            return;
        }
        this.storeInfo = storeResult.store;

        // 메뉴 조회
        const menuResult = await orderService.getMenuList(storeId);
        if (!menuResult.success) {
            alert(menuResult.message);
            return;
        }
        this.menus = menuResult.menus;

        // 첫 카테고리 선택
        const categories = this.getCategories();
        if (categories.length > 0) {
            this.selectedCategory = categories[0];
        }

        // 화면 렌더링
        this.render();
    },

    /**
     * 카테고리 목록 추출
     */
    getCategories() {
        const categories = [...new Set(this.menus.map(menu => menu.category))];
        return categories.length > 0 ? categories : ['전체'];
    },

    /**
     * 카테고리별 메뉴 필터링
     */
    getFilteredMenus() {
        if (!this.selectedCategory) return this.menus;
        return this.menus.filter(menu => menu.category === this.selectedCategory);
    },

    /**
     * 화면 렌더링
     */
    render() {
        const app = document.getElementById('app');
        if (!app) {
            console.error('❌ app 엘리먼트를 찾을 수 없습니다');
            return;
        }

        const categories = this.getCategories();
        const filteredMenus = this.getFilteredMenus();

        app.innerHTML = orderView.render(
            this.storeInfo,
            this.tableNumber,
            categories,
            filteredMenus,
            this.cart
        );

        console.log('✅ 메뉴 주문 페이지 렌더링 완료');
    },

    /**
     * 카테고리 선택
     */
    selectCategory(category) {
        console.log('📂 카테고리 선택:', category);
        this.selectedCategory = category;

        // 카테고리 탭 스타일 업데이트
        const tabs = document.querySelectorAll('.category-tab');
        tabs.forEach(tab => {
            const isActive = tab.dataset.category === category;
            tab.style.background = isActive ? '#667eea' : '#f5f5f7';
            tab.style.color = isActive ? 'white' : '#1d1d1f';
        });

        // 메뉴 리스트 업데이트
        const filteredMenus = this.getFilteredMenus();
        const menuList = document.getElementById('menuList');
        if (menuList) {
            menuList.innerHTML = filteredMenus
                .map(menu => orderView.renderMenuItem(menu))
                .join('');
        }
    },

    /**
     * 메뉴 상세 모달 표시
     */
    showMenuDetail(menuId) {
        console.log('📋 메뉴 상세:', menuId);
        
        this.currentMenu = this.menus.find(menu => menu.id === parseInt(menuId));
        if (!this.currentMenu) {
            console.error('❌ 메뉴를 찾을 수 없습니다:', menuId);
            return;
        }

        this.modalQuantity = 1;

        // 모달 추가
        const modalHTML = orderView.renderMenuModal(this.currentMenu, this.modalQuantity);
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    },

    /**
     * 메뉴 상세 모달 닫기
     */
    closeMenuModal() {
        const modal = document.getElementById('menuModal');
        if (modal) {
            modal.remove();
        }
        this.currentMenu = null;
        this.modalQuantity = 1;
    },

    /**
     * 수량 증가
     */
    increaseQuantity() {
        this.modalQuantity++;
        this.updateModalQuantity();
    },

    /**
     * 수량 감소
     */
    decreaseQuantity() {
        if (this.modalQuantity > 1) {
            this.modalQuantity--;
            this.updateModalQuantity();
        }
    },

    /**
     * 모달 수량 업데이트
     */
    updateModalQuantity() {
        const quantityEl = document.getElementById('modalQuantity');
        if (quantityEl) {
            quantityEl.textContent = this.modalQuantity;
        }

        // 버튼 텍스트 업데이트
        const button = document.querySelector('#menuModal button[onclick*="confirmAddToCart"]');
        if (button && this.currentMenu) {
            button.textContent = `${(this.currentMenu.price * this.modalQuantity).toLocaleString()}원 담기`;
        }
    },

    /**
     * 장바구니에 담기 (빠른 추가)
     */
    addToCart(menuId) {
        const menu = this.menus.find(m => m.id === parseInt(menuId));
        if (!menu) return;

        this.addItemToCart(menu, 1);
        console.log('✅ 장바구니에 추가:', menu.name);
    },

    /**
     * 장바구니에 담기 확인 (모달에서)
     */
    confirmAddToCart() {
        if (!this.currentMenu) return;

        this.addItemToCart(this.currentMenu, this.modalQuantity);
        this.closeMenuModal();
        console.log('✅ 장바구니에 추가:', this.currentMenu.name, 'x', this.modalQuantity);
    },

    /**
     * 장바구니 아이템 추가
     */
    addItemToCart(menu, quantity) {
        const existingItem = this.cart.find(item => item.id === menu.id);

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.cart.push({
                id: menu.id,
                name: menu.name,
                price: menu.price,
                quantity: quantity,
                image: menu.image
            });
        }

        // 장바구니 저장
        orderService.saveCart(this.cart);

        // 플로팅 카트 업데이트
        this.updateFloatingCart();
    },

    /**
     * 플로팅 카트 업데이트
     */
    updateFloatingCart() {
        const existingCart = document.querySelector('[style*="position: fixed"][style*="bottom: 20px"]');
        if (existingCart) {
            existingCart.remove();
        }

        if (this.cart.length > 0) {
            document.body.insertAdjacentHTML('beforeend', orderView.renderFloatingCart(this.cart));
        }
    },

    /**
     * 결제 페이지로 이동
     */
    goToPayment() {
        if (this.cart.length === 0) {
            alert('장바구니가 비어있습니다');
            return;
        }

        console.log('💳 결제 페이지로 이동');
        window.location.href = `/guest/payment.html?storeId=${this.storeId}&tableNumber=${this.tableNumber}`;
    }
};

// 전역 객체 등록
window.guestOrderController = orderController;
