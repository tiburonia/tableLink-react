function renderMenuHTML(store) {
  // 메뉴 없는 경우 처리
  if (!store.menu || store.menu.length === 0) {
    return `<div class="empty-menu">등록된 메뉴가 없습니다.</div>`;
  }

  // 메뉴 카드 생성
  return `
    <div class="menu-list">
      ${store.menu.map(menu => `
        <div class="menu-card">
          <div class="menu-img-wrap">
            <img src="TableLink2.png" alt="${menu.name}">
          </div>
          <div class="menu-info">
            <div class="menu-title-row">
              <span class="menu-name">${menu.name}</span>
              <span class="menu-price">${menu.price.toLocaleString()}원</span>
            </div>
            <div class="menu-desc">${menu.desc || ''}</div>
          </div>
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
