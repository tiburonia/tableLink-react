function renderMenuHTML(store) {
  console.log('🍽️ 메뉴 렌더링 시작:', store.name);
  console.log('📋 메뉴 데이터:', store.menu);

  // 메뉴 데이터 유효성 검사
  if (!store) {
    console.error('❌ 매장 정보가 없습니다');
    return `<div class="empty-menu">매장 정보를 불러올 수 없습니다.</div>`;
  }

  if (!store.menu) {
    console.warn('⚠️ 메뉴 속성이 없습니다');
    return `<div class="empty-menu">메뉴 정보가 없습니다.</div>`;
  }

  // 메뉴가 문자열인 경우 JSON 파싱 시도
  let menuData = store.menu;
  if (typeof store.menu === 'string') {
    try {
      menuData = JSON.parse(store.menu);
      console.log('🔧 JSON 문자열을 파싱했습니다:', menuData);
    } catch (error) {
      console.error('❌ 메뉴 JSON 파싱 실패:', error);
      return `<div class="empty-menu">메뉴 데이터 형식이 올바르지 않습니다.</div>`;
    }
  }

  // 배열 확인
  if (!Array.isArray(menuData)) {
    console.error('❌ 메뉴가 배열이 아닙니다:', typeof menuData, menuData);
    return `<div class="empty-menu">메뉴 데이터 형식이 올바르지 않습니다.</div>`;
  }

  // 빈 배열 처리
  if (menuData.length === 0) {
    console.log('📭 메뉴가 비어있습니다');
    return `<div class="empty-menu">등록된 메뉴가 없습니다.</div>`;
  }

  console.log(`✅ ${menuData.length}개의 메뉴 항목을 렌더링합니다`);

  // 메뉴 카드 생성
  return `
    <div class="menu-list">
      ${menuData.map((menu, index) => {
        if (!menu || typeof menu !== 'object') {
          console.warn(`⚠️ 잘못된 메뉴 항목 ${index}:`, menu);
          return '';
        }

        const menuName = menu.name || `메뉴 ${index + 1}`;
        const menuPrice = menu.price || 0;
        const menuDesc = menu.description || menu.desc || '';

        return `
          <div class="menu-card">
            <div class="menu-img-wrap">
              <img src="TableLink2.png" alt="${menuName}" onerror="this.src='TableLink.png'">
            </div>
            <div class="menu-info">
              <div class="menu-title-row">
                <span class="menu-name">${menuName}</span>
                <span class="menu-price">${parseInt(menuPrice).toLocaleString()}원</span>
              </div>
              <div class="menu-desc">${menuDesc}</div>
            </div>
          </div>
        `;
      }).join('')}
    </div>

    <style>
      .menu-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 16px;
        padding: 16px;
      }

      .menu-card {
        background: white;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        overflow: hidden;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      .menu-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }

      .menu-img-wrap {
        position: relative;
        width: 100%;
        height: 160px;
        overflow: hidden;
        background: #f5f5f5;
      }

      .menu-img-wrap img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s ease;
      }

      .menu-card:hover .menu-img-wrap img {
        transform: scale(1.05);
      }

      .menu-info {
        padding: 16px;
      }

      .menu-title-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }

      .menu-name {
        font-size: 16px;
        font-weight: 600;
        color: #333;
        flex: 1;
        margin-right: 8px;
      }

      .menu-price {
        font-size: 16px;
        font-weight: 700;
        color: #297efc;
        white-space: nowrap;
      }

      .menu-desc {
        font-size: 14px;
        color: #666;
        line-height: 1.4;
        margin-top: 4px;
      }

      .empty-menu {
        text-align: center;
        padding: 40px 20px;
        color: #999;
        font-size: 16px;
        background: white;
        border-radius: 12px;
        margin: 16px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }

      @media (max-width: 480px) {
        .menu-list {
          grid-template-columns: 1fr;
          gap: 12px;
          padding: 12px;
        }
        
        .menu-card {
          border-radius: 8px;
        }
        
        .menu-img-wrap {
          height: 140px;
        }
      }
    </style>
  `;/div>
        </div>
      `).join('')}
    </div>

    <style>
      .menu-list {
        display: flex;
        flex-direction: column;
        gap: 13px;
      }
      .menu-card {
        display: flex;
        background: #f6f7fa;
        border-radius: 12px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.03);
        overflow: hidden;
        min-height: 90px;
        align-items: stretch;
      }
      .menu-img-wrap {
        width: 90px;
        height: 90px;
        flex-shrink: 0;
        background: #eef2fa;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .menu-img-wrap img {
        width: 76px;
        height: 76px;
        object-fit: cover;
        border-radius: 10px;
      }
      .menu-info {
        flex: 1;
        padding: 12px 16px 11px 13px;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
      .menu-title-row {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 5px;
        margin-bottom: 4px;
      }
      .menu-name {
        font-size: 16px;
        font-weight: 700;
        color: #252525;
      }
      .menu-price {
        font-size: 16px;
        font-weight: 600;
        color: #3e85f6;
      }
      .menu-desc {
        font-size: 13px;
        color: #666;
        margin-top: 3px;
      }
      .empty-menu {
        padding: 38px 0;
        text-align: center;
        color: #aaa;
        font-size: 15px;
      }

    </style>
  `;
}
