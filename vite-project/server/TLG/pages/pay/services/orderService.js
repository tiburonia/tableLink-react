import { OrderRepository } from '../repositories/orderRepository.js';

export const OrderService = {
  async loadMenuData(storeId) {
    try {
      const menuResult = await OrderRepository.loadStoreMenu(storeId);
      
      if (menuResult.success && menuResult.menu) {
        const normalizedMenu = this.normalizeMenuData(menuResult.menu);
        
        if (!this.validateMenuData(normalizedMenu)) {
          console.error('❌ 메뉴 데이터 검증 실패, 기본 메뉴로 대체');
          return this.getDefaultMenu();
        }
        
        console.log(`✅ 매장 ${storeId} 메뉴 ${normalizedMenu.length}개 로드 및 정규화 완료`);
        return normalizedMenu;
      } else {
        console.warn('⚠️ API 응답에서 메뉴 데이터가 없음, 기본 메뉴 사용');
        return this.getDefaultMenu();
      }
    } catch (error) {
      console.warn('⚠️ 메뉴 로드 오류:', error);
      return this.getDefaultMenu();
    }
  },

  normalizeMenuData(menu) {
    return menu.map((item, index) => {
      const normalizedMenu = {
        id: parseInt(item.id),
        menuId: parseInt(item.id),
        name: item.name || `메뉴 ${index + 1}`,
        description: item.description || '',
        price: parseInt(item.price) || 0,
        cook_station: item.cook_station || 'KITCHEN',
        category: item.category || item.cook_station || 'KITCHEN'
      };

      console.log(`📋 메뉴 ${index + 1} 정규화:`, {
        원본: item,
        정규화: normalizedMenu
      });

      return normalizedMenu;
    });
  },

  validateMenuData(menuData) {
    if (!Array.isArray(menuData) || menuData.length === 0) {
      return false;
    }

    return menuData.every(item => 
      item && 
      (item.id || item.menuId) && 
      item.name && 
      typeof item.price === 'number'
    );
  },

  groupMenuByCategory(menuData) {
    const grouped = {};

    menuData.forEach(item => {
      const category = item.category || '일반';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(item);
    });

    if (Object.keys(grouped).length === 0) {
      grouped['일반'] = menuData;
    }

    return grouped;
  },

  findMenuById(menuData, menuId) {
    const validMenuId = parseInt(menuId);
    return menuData.find(item => {
      const itemId = parseInt(item.id);
      const itemMenuId = parseInt(item.menuId);
      return itemId === validMenuId || itemMenuId === validMenuId;
    });
  },

  findMenuByName(menuData, menuName) {
    const validMenuName = String(menuName).trim();
    return menuData.find(item => 
      String(item.name).trim() === validMenuName
    );
  },

  findMenuByPartialName(menuData, menuName) {
    const validMenuName = String(menuName).toLowerCase();
    return menuData.find(item => 
      String(item.name).toLowerCase().includes(validMenuName) ||
      validMenuName.includes(String(item.name).toLowerCase())
    );
  },

  findMenu(menuData, menuId, menuName) {
    console.log('🔍 메뉴 찾기 시작:', { menuId, menuName });

    let actualMenuData = this.findMenuById(menuData, menuId);
    console.log('🔍 1단계 ID로 찾기 결과:', actualMenuData);

    if (!actualMenuData) {
      actualMenuData = this.findMenuByName(menuData, menuName);
      console.log('🔍 2단계 이름으로 찾기 결과:', actualMenuData);
    }

    if (!actualMenuData) {
      actualMenuData = this.findMenuByPartialName(menuData, menuName);
      console.log('🔍 3단계 부분 매칭 결과:', actualMenuData);
    }

    return actualMenuData;
  },

  addToCart(cart, menuData, menuId, menuName, price) {
    const validMenuId = parseInt(menuId);
    const validMenuName = String(menuName);
    const validPrice = parseInt(price);

    const actualMenuData = this.findMenu(menuData, validMenuId, validMenuName);

    if (!actualMenuData) {
      console.warn('⚠️ 메뉴 데이터를 찾을 수 없어 기본 정보로 추가');
    }

    const finalMenuId = actualMenuData ? 
      (parseInt(actualMenuData.id) || parseInt(actualMenuData.menuId)) : validMenuId;
    const finalCookStation = actualMenuData?.cook_station || 'KITCHEN';

    const existingItem = cart.find(item => parseInt(item.id) === finalMenuId);

    if (existingItem) {
      existingItem.quantity += 1;
      console.log(`✅ 기존 메뉴 수량 증가: ${validMenuName}, 수량: ${existingItem.quantity}`);
    } else {
      const newItem = {
        id: finalMenuId,
        menuId: finalMenuId,
        name: validMenuName,
        price: validPrice,
        quantity: 1,
        cook_station: finalCookStation
      };
      cart.push(newItem);
      console.log('✅ 새 메뉴 추가:', newItem);
    }

    console.log('🛒 장바구니에 추가 완료:', validMenuName, '총 아이템:', cart.length);
    return cart;
  },

  updateQuantity(cart, menuId, change) {
    const item = cart.find(item => parseInt(item.id) === parseInt(menuId));
    
    if (item) {
      item.quantity += change;
      
      if (item.quantity <= 0) {
        const index = cart.indexOf(item);
        cart.splice(index, 1);
        console.log('🗑️ 수량 0으로 장바구니에서 제거:', item.name);
      } else {
        console.log('🔄 수량 업데이트:', item.name, '수량:', item.quantity);
      }
    }
    
    return cart;
  },

  removeFromCart(cart, menuId) {
    const index = cart.findIndex(item => parseInt(item.id) === parseInt(menuId));
    
    if (index !== -1) {
      const removedItem = cart.splice(index, 1)[0];
      console.log('🗑️ 장바구니에서 제거:', removedItem.name);
    }
    
    return cart;
  },

  calculateCartTotal(cart) {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  },

  validateCart(cart) {
    if (!cart || !Array.isArray(cart)) {
      console.error('❌ cart 배열이 존재하지 않습니다');
      return { valid: false, message: '장바구니가 초기화되지 않았습니다.' };
    }

    const validItems = cart.filter(item => 
      item && item.id && item.name && item.price && item.quantity > 0
    );

    console.log('🔍 장바구니 유효성 검사:', {
      originalCount: cart.length,
      validCount: validItems.length
    });

    if (validItems.length === 0) {
      console.warn('⚠️ 유효한 장바구니 아이템이 없습니다');
      return { valid: false, message: '주문할 메뉴를 선택해주세요.' };
    }

    return { valid: true, validItems };
  },

  prepareOrderData(storeId, storeName, tableName, tableNumber, cart, userInfo) {
    const totalAmount = this.calculateCartTotal(cart);

    const orderData = {
      store_id: storeId,
      store_name: storeName,
      table_name: tableName,
      table_number: tableNumber,
      items: cart.map(item => ({
        id: item.id,
        menuId: item.menuId || item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        cook_station: item.cook_station || 'KITCHEN'
      })),
      totalAmount: totalAmount,
      user_id: userInfo.id,
      user_name: userInfo.name
    };

    console.log('📦 주문 데이터 준비 완료:', orderData);
    return orderData;
  },

  getDefaultMenu() {
    return [
      { id: 1, name: '김치찌개', description: '돼지고기와 김치가 들어간 찌개', price: 8000, category: '찌개류', cook_station: 'KITCHEN' },
      { id: 2, name: '된장찌개', description: '국산 콩으로 만든 된장찌개', price: 7000, category: '찌개류', cook_station: 'KITCHEN' },
      { id: 3, name: '불고기', description: '양념에 재운 소고기 불고기', price: 15000, category: '구이류', cook_station: 'GRILL' },
      { id: 4, name: '비빔밥', description: '각종 나물이 들어간 비빔밥', price: 9000, category: '밥류', cook_station: 'KITCHEN' },
      { id: 5, name: '냉면', description: '시원한 물냉면', price: 10000, category: '면류', cook_station: 'COLD_STATION' },
      { id: 6, name: '공기밥', description: '갓 지은 따뜻한 쌀밥', price: 1000, category: '기타', cook_station: 'KITCHEN' }
    ];
  }
};
