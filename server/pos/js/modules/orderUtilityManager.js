
/**
 * 주문 유틸리티 관리 모듈
 * - 공통 유틸리티 함수들
 * - 토스트 메시지
 * - 상태 텍스트 변환
 */

const OrderUtilityManager = {
    /**
     * 토스트 메시지 표시
     */
    showToast(message, type = 'info') {
        const toast = document.createElement("div");
        toast.className = `toast-message toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add("show");
        }, 100);

        setTimeout(() => {
            toast.remove();
        }, 2000);
    },

    /**
     * 상태 텍스트 반환
     */
    getStatusText(status) {
        const statusMap = {
            PENDING: "대기",
            COOKING: "조리중",
            READY: "완료",
            SERVED: "서빙완료",
            COMPLETED: "완료",
            CANCELLED: "취소됨",
            CART: "카트",
        };
        return statusMap[status] || "대기";
    },

    /**
     * 조리 스테이션 텍스트 반환
     */
    getCookStationText(cookStation) {
        const stationMap = {
            KITCHEN: "주방",
            DRINK: "음료",
            DESSERT: "디저트",
            SIDE: "사이드",
        };
        return stationMap[cookStation] || "주방";
    },

    /**
     * 메뉴 아이콘 반환
     */
    getMenuIcon(category) {
        const icons = {
            찌개류: "🍲",
            구이류: "🥩",
            밥류: "🍚",
            면류: "🍜",
            음료: "🥤",
            기타: "🍽️",
        };
        return icons[category] || "🍽️";
    },

    /**
     * 메뉴 이름으로 조리 스테이션 조회
     */
    getCookStationByMenu(menuName) {
        console.log(`🔍 cook_station 조회: ${menuName}`);

        const posOrderScreen = window.POSOrderScreen;

        // 1. 메뉴 데이터에서 해당 메뉴의 cook_station 찾기
        if (posOrderScreen?.menuData && Array.isArray(posOrderScreen.menuData)) {
            const menuItem = posOrderScreen.menuData.find(menu => 
                menu.name && menu.name.trim() === menuName.trim()
            );

            if (menuItem && menuItem.cook_station) {
                console.log(`✅ 메뉴 데이터에서 cook_station 발견: ${menuName} → ${menuItem.cook_station}`);
                return menuItem.cook_station;
            }

            // cook_station이 없으면 category 필드 사용 (호환성)
            if (menuItem && menuItem.category) {
                console.log(`✅ 메뉴 데이터에서 category 사용: ${menuName} → ${menuItem.category}`);
                return menuItem.category;
            }
        }

        // 2. 현재 주문에서 해당 메뉴의 cook_station 찾기
        if (posOrderScreen?.currentOrders && Array.isArray(posOrderScreen.currentOrders)) {
            const orderItem = posOrderScreen.currentOrders.find(order => 
                order.menuName && order.menuName.trim() === menuName.trim()
            );

            if (orderItem && orderItem.cookStation) {
                console.log(`✅ 현재 주문에서 cook_station 발견: ${menuName} → ${orderItem.cookStation}`);
                return orderItem.cookStation;
            }
        }

        // 3. 폴백: 키워드 기반 추정
        console.log(`⚠️ 실제 데이터에서 cook_station을 찾을 수 없어 키워드 기반 추정 사용: ${menuName}`);

        const menuNameLower = menuName.toLowerCase();

        // 음료 관련 키워드
        const drinkKeywords = ['콜라', '사이다', '음료', '주스', '커피', '차', '라떼', '아메리카노', '물', '맥주', '소주'];
        if (drinkKeywords.some(keyword => menuNameLower.includes(keyword.toLowerCase()))) {
            return 'DRINK';
        }

        // 디저트 관련 키워드
        const dessertKeywords = ['케이크', '아이스크림', '빙수', '떡', '과자'];
        if (dessertKeywords.some(keyword => menuNameLower.includes(keyword.toLowerCase()))) {
            return 'DESSERT';
        }

        // 사이드 관련 키워드
        const sideKeywords = ['샐러드', '김치', '반찬', '무', '피클'];
        if (sideKeywords.some(keyword => menuNameLower.includes(keyword.toLowerCase()))) {
            return 'SIDE';
        }

        // 기본값은 주방
        console.log(`🏠 기본값 사용: ${menuName} → KITCHEN`);
        return 'KITCHEN';
    },

    /**
     * 기본 메뉴 데이터
     */
    getDefaultMenu() {
        return [
            { id: 1, name: "김치찌개", price: 8000, category: "찌개류" },
            { id: 2, name: "된장찌개", price: 7000, category: "찌개류" },
            { id: 3, name: "불고기", price: 15000, category: "구이류" },
            { id: 4, name: "비빔밥", price: 9000, category: "밥류" },
            { id: 5, name: "콜라", price: 2000, category: "음료" },
            { id: 6, name: "사이다", price: 2000, category: "음료" },
        ];
    },

    /**
     * 숫자 포맷팅 (천단위 콤마)
     */
    formatCurrency(amount) {
        return amount.toLocaleString() + "원";
    },

    /**
     * 시간 포맷팅
     */
    formatTime(date) {
        if (!date) return "-";
        return new Date(date).toLocaleTimeString("ko-KR", { 
            hour: "2-digit", 
            minute: "2-digit" 
        });
    },

    /**
     * 날짜 포맷팅
     */
    formatDateTime(date) {
        if (!date) return "-";
        return new Date(date).toLocaleString("ko-KR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    },

    /**
     * 디바운스 함수
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * 로딩 상태 표시
     */
    showLoading(element, message = "로딩 중...") {
        const loadingDiv = document.createElement("div");
        loadingDiv.className = "loading-overlay";
        loadingDiv.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-message">${message}</div>
        `;
        
        if (element) {
            element.style.position = "relative";
            element.appendChild(loadingDiv);
        }
        
        return loadingDiv;
    },

    /**
     * 로딩 상태 제거
     */
    hideLoading(element) {
        if (element) {
            const loadingOverlay = element.querySelector(".loading-overlay");
            if (loadingOverlay) {
                loadingOverlay.remove();
            }
        }
    }
};

// 전역으로 등록
window.OrderUtilityManager = OrderUtilityManager;
