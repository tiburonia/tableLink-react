/**
 * 메뉴 주문 페이지 View (비회원 TLL)
 * - 메뉴 목록 표시
 * - 장바구니 관리
 * - 네이티브 앱 스타일 UI
 */

export const orderView = {
    /**
     * 메인 페이지 렌더링
     */
    render(storeInfo, tableNumber, categories, menus, cart) {
        return `
            ${this.renderHeader(storeInfo, tableNumber)}
            ${this.renderCategories(categories)}
            ${this.renderMenuList(menus)}
            ${this.renderFloatingCart(cart)}
        `;
    },

    /**
     * 헤더 렌더링
     */
    renderHeader(storeInfo, tableNumber) {
        return `
            <div style="
                position: sticky;
                top: 0;
                background: white;
                z-index: 100;
                border-bottom: 1px solid #e5e5ea;
            ">
                <div style="
                    padding: 16px 20px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                ">
                    <div style="flex: 1;">
                        <h1 style="
                            font-size: 22px;
                            font-weight: 700;
                            color: #1d1d1f;
                            margin: 0 0 4px 0;
                        ">${storeInfo.name}</h1>
                        <p style="
                            font-size: 13px;
                            color: #86868b;
                            margin: 0;
                        ">테이블 ${tableNumber}번</p>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * 카테고리 탭 렌더링
     */
    renderCategories(categories) {
        return `
            <div style="
                position: sticky;
                top: 73px;
                background: white;
                z-index: 99;
                overflow-x: auto;
                white-space: nowrap;
                border-bottom: 1px solid #e5e5ea;
                -webkit-overflow-scrolling: touch;
            ">
                <div style="
                    display: flex;
                    padding: 12px 20px;
                    gap: 8px;
                ">
                    ${categories.map((category, index) => `
                        <button
                            onclick="window.guestOrderController.selectCategory('${category}')"
                            class="category-tab ${index === 0 ? 'active' : ''}"
                            data-category="${category}"
                            style="
                                padding: 8px 16px;
                                background: ${index === 0 ? '#667eea' : '#f5f5f7'};
                                color: ${index === 0 ? 'white' : '#1d1d1f'};
                                border: none;
                                border-radius: 20px;
                                font-size: 14px;
                                font-weight: 600;
                                cursor: pointer;
                                white-space: nowrap;
                                transition: all 0.2s;
                            "
                        >
                            ${category}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    },

    /**
     * 메뉴 리스트 렌더링
     */
    renderMenuList(menus) {
        return `
            <div style="
                padding: 16px 20px 120px 20px;
                background: #f5f5f7;
                min-height: calc(100vh - 200px);
            ">
                <div id="menuList" style="
                    display: grid;
                    gap: 12px;
                ">
                    ${menus.map(menu => this.renderMenuItem(menu)).join('')}
                </div>
            </div>
        `;
    },

    /**
     * 메뉴 아이템 렌더링
     */
    renderMenuItem(menu) {
        return `
            <div
                onclick="window.guestOrderController.showMenuDetail('${menu.id}')"
                style="
                    background: white;
                    border-radius: 16px;
                    padding: 16px;
                    display: flex;
                    gap: 16px;
                    cursor: pointer;
                    transition: transform 0.2s;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
                "
                onmouseover="this.style.transform='scale(1.02)'"
                onmouseout="this.style.transform='scale(1)'"
            >
                <!-- 메뉴 이미지 -->
                <div style="
                    width: 80px;
                    height: 80px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 12px;
                    flex-shrink: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 32px;
                ">
                    ${menu.image || '🍽️'}
                </div>

                <!-- 메뉴 정보 -->
                <div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
                    <h3 style="
                        font-size: 16px;
                        font-weight: 600;
                        color: #1d1d1f;
                        margin: 0 0 4px 0;
                    ">${menu.name}</h3>
                    ${menu.description ? `
                        <p style="
                            font-size: 13px;
                            color: #86868b;
                            margin: 0 0 8px 0;
                            line-height: 1.4;
                        ">${menu.description}</p>
                    ` : ''}
                    <div style="
                        font-size: 17px;
                        font-weight: 700;
                        color: #667eea;
                    ">${menu.price.toLocaleString()}원</div>
                </div>

                <!-- 담기 버튼 -->
                <div style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">
                    <button
                        onclick="event.stopPropagation(); window.guestOrderController.addToCart('${menu.id}')"
                        style="
                            width: 36px;
                            height: 36px;
                            background: #667eea;
                            color: white;
                            border: none;
                            border-radius: 50%;
                            font-size: 20px;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        "
                    >+</button>
                </div>
            </div>
        `;
    },

    /**
     * 플로팅 장바구니 렌더링
     */
    renderFloatingCart(cart) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        if (totalItems === 0) {
            return '';
        }

        return `
            <div
                onclick="window.guestOrderController.goToPayment()"
                style="
                    position: fixed;
                    bottom: 20px;
                    left: 20px;
                    right: 20px;
                    height: 64px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 24px;
                    box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
                    cursor: pointer;
                    z-index: 1000;
                    transition: transform 0.2s;
                "
                onmouseover="this.style.transform='translateY(-4px)'"
                onmouseout="this.style.transform='translateY(0)'"
            >
                <div style="
                    display: flex;
                    align-items: center;
                    gap: 12px;
                ">
                    <div style="
                        width: 32px;
                        height: 32px;
                        background: rgba(255,255,255,0.2);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 14px;
                        font-weight: 700;
                        color: white;
                    ">${totalItems}</div>
                    <span style="
                        font-size: 16px;
                        font-weight: 600;
                        color: white;
                    ">장바구니</span>
                </div>
                <div style="
                    display: flex;
                    align-items: center;
                    gap: 8px;
                ">
                    <span style="
                        font-size: 20px;
                        font-weight: 700;
                        color: white;
                    ">${totalPrice.toLocaleString()}원</span>
                    <span style="font-size: 20px; color: white;">→</span>
                </div>
            </div>
        `;
    },

    /**
     * 메뉴 상세 모달 렌더링
     */
    renderMenuModal(menu, quantity) {
        return `
            <div
                id="menuModal"
                style="
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.5);
                    z-index: 10000;
                    display: flex;
                    align-items: flex-end;
                    animation: fadeIn 0.2s;
                "
                onclick="if(event.target.id === 'menuModal') window.guestOrderController.closeMenuModal()"
            >
                <div style="
                    background: white;
                    border-radius: 24px 24px 0 0;
                    width: 100%;
                    max-height: 80vh;
                    overflow-y: auto;
                    animation: slideUp 0.3s;
                ">
                    <!-- 모달 헤더 -->
                    <div style="
                        padding: 24px 20px;
                        border-bottom: 1px solid #e5e5ea;
                    ">
                        <button
                            onclick="window.guestOrderController.closeMenuModal()"
                            style="
                                background: none;
                                border: none;
                                font-size: 28px;
                                cursor: pointer;
                                padding: 0;
                                color: #86868b;
                            "
                        >×</button>
                    </div>

                    <!-- 메뉴 이미지 -->
                    <div style="
                        width: 100%;
                        height: 200px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 80px;
                    ">
                        ${menu.image || '🍽️'}
                    </div>

                    <!-- 메뉴 정보 -->
                    <div style="padding: 24px 20px;">
                        <h2 style="
                            font-size: 24px;
                            font-weight: 700;
                            color: #1d1d1f;
                            margin: 0 0 8px 0;
                        ">${menu.name}</h2>
                        ${menu.description ? `
                            <p style="
                                font-size: 14px;
                                color: #86868b;
                                line-height: 1.5;
                                margin: 0 0 16px 0;
                            ">${menu.description}</p>
                        ` : ''}
                        <div style="
                            font-size: 22px;
                            font-weight: 700;
                            color: #667eea;
                            margin-bottom: 24px;
                        ">${menu.price.toLocaleString()}원</div>

                        <!-- 수량 선택 -->
                        <div style="
                            display: flex;
                            align-items: center;
                            justify-content: space-between;
                            background: #f5f5f7;
                            border-radius: 16px;
                            padding: 16px;
                            margin-bottom: 16px;
                        ">
                            <span style="
                                font-size: 16px;
                                font-weight: 600;
                                color: #1d1d1f;
                            ">수량</span>
                            <div style="
                                display: flex;
                                align-items: center;
                                gap: 20px;
                            ">
                                <button
                                    onclick="window.guestOrderController.decreaseQuantity()"
                                    style="
                                        width: 36px;
                                        height: 36px;
                                        background: white;
                                        border: 1px solid #e5e5ea;
                                        border-radius: 50%;
                                        font-size: 20px;
                                        cursor: pointer;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        color: #1d1d1f;
                                    "
                                >−</button>
                                <span id="modalQuantity" style="
                                    font-size: 18px;
                                    font-weight: 700;
                                    color: #1d1d1f;
                                    min-width: 30px;
                                    text-align: center;
                                ">${quantity}</span>
                                <button
                                    onclick="window.guestOrderController.increaseQuantity()"
                                    style="
                                        width: 36px;
                                        height: 36px;
                                        background: #667eea;
                                        border: none;
                                        border-radius: 50%;
                                        font-size: 20px;
                                        cursor: pointer;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        color: white;
                                    "
                                >+</button>
                            </div>
                        </div>

                        <!-- 담기 버튼 -->
                        <button
                            onclick="window.guestOrderController.confirmAddToCart()"
                            style="
                                width: 100%;
                                height: 56px;
                                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                color: white;
                                border: none;
                                border-radius: 16px;
                                font-size: 17px;
                                font-weight: 600;
                                cursor: pointer;
                            "
                        >
                            ${(menu.price * quantity).toLocaleString()}원 담기
                        </button>
                    </div>
                </div>
            </div>

            <style>
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
            </style>
        `;
    }
};
