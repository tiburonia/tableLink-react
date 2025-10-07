const d=document.createElement("link");d.rel="stylesheet";d.href="/TLG/pages/main/views/mapStoreCard.css";document.querySelector('link[href="/TLG/pages/main/views/mapStoreCard.css"]')||document.head.appendChild(d);const c={renderMapUI(){const e=document.getElementById("main");if(!window.MapPanelUI||typeof window.MapPanelUI.renderPanelHTML!="function"){console.error("❌ MapPanelUI가 로드되지 않았습니다."),e.innerHTML=this.renderErrorUI("MapPanelUI 모듈을 찾을 수 없습니다.");return}e.innerHTML=`
      <main id="content">
        <div id="map" style="width: 100%; height: 100%; min-height: 100vh;"></div>
        ${this.renderSearchBar()}
        ${this.renderNotificationButton()}
        ${this.renderLocationModal()}
        ${window.MapPanelUI.renderPanelHTML()}
      </main>
      ${this.renderBottomBar()}
      ${this.getMapStyles()}
    `},renderSearchBar(){return`
      <div id="searchBar">
        <div class="search-container" onclick="renderSearch()">
          <button id="searchBtn">🔍</button>
          <input id="searchInput" type="text" placeholder="매장명, 카테고리 또는 위치 검색...">
        </div>
        <div id="searchResults" class="search-results hidden"></div>
      </div>
    `},renderNotificationButton(){return`
      <button id="notificationBtn" class="notification-btn" title="알림">
        <span>🔔</span>
        <span id="notificationBadge" class="notification-badge hidden">3</span>
      </button>
      <button id="currentLocationBtn" class="current-location-btn" title="현재 위치로 이동">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#007aff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="9" stroke="#007aff" fill="white" />
          <line x1="12" y1="3" x2="12" y2="6" />
          <line x1="12" y1="18" x2="12" y2="21" />
          <line x1="3" y1="12" x2="6" y2="12" />
          <line x1="18" y1="12" x2="21" y2="12" />
          <circle cx="12" cy="12" r="2.2" fill="#007aff" />
        </svg>
      </button>
    `},renderLocationModal(){return`
      <div id="locationModal" class="location-modal hidden">
        <div class="modal-content">
          <div class="modal-header">
            <h3>📍 내 위치 설정</h3>
            <button id="closeModal" class="close-btn">✕</button>
          </div>
          <div class="modal-body">
            <div class="region-selection-container">
              <div class="select-group">
                <label for="provinceSelect">시/도</label>
                <select id="provinceSelect" class="region-select">
                  <option value="">시/도를 선택하세요</option>
                </select>
              </div>
              <div class="select-group">
                <label for="citySelect">시/군/구</label>
                <select id="citySelect" class="region-select" disabled>
                  <option value="">시/군/구를 선택하세요</option>
                </select>
              </div>
              <div class="select-group">
                <label for="districtSelect">읍/면/동</label>
                <select id="districtSelect" class="region-select" disabled>
                  <option value="">읍/면/동을 선택하세요</option>
                </select>
              </div>
              <button id="confirmLocationBtn" class="confirm-location-btn" disabled>
                📍 이 위치로 설정
              </button>
            </div>
            <div class="divider">또는</div>
            <div class="current-location-section">
              <button id="getCurrentLocationBtn" class="get-current-btn">
                🎯 현재 GPS 위치 사용
              </button>
            </div>
          </div>
        </div>
      </div>
    `},renderBottomBar(){return`
      <nav class="bottom-nav-bar">
        <button onclick="renderSubMain()" class="nav-item">
          <span class="nav-icon">🏠</span>
          <span class="nav-label">홈</span>
        </button>
        <button onclick="TLL()" class="nav-item">
          <span class="nav-icon">📱</span>
          <span class="nav-label">QR 주문</span>
        </button>
        <button onclick="renderMap()" class="nav-item active" id="renderMapBtn">
          <span class="nav-icon">📍</span>
          <span class="nav-label">내주변</span>
        </button>
        <button class="nav-item" onclick="renderMyPage()">
          <span class="nav-icon">👤</span>
          <span class="nav-label">내정보</span>
        </button>
      </nav>
    `},displaySearchResults(e,t,n,o){const r=document.getElementById("searchResults");let a="";const s=(e?.length||0)+(t?.length||0);t&&t.length>0&&(a+=`
        <div style="padding: 8px 16px; background: #f0f9ff; font-size: 12px; font-weight: 600; color: #1e40af; border-bottom: 1px solid #e0e7ff;">
          📍 위치 검색 결과 (${t.length}개)
        </div>
      `,a+=t.slice(0,5).map(i=>`
        <div class="search-result-item location-search-item" data-lat="${i.y}" data-lng="${i.x}">
          <div class="result-name">📍 ${i.place_name}</div>
          <div class="result-info">${i.address_name} • 위치로 이동</div>
        </div>
      `).join("")),e&&e.length>0&&(a&&(a+=`
          <div style="padding: 8px 16px; background: #fef3f2; font-size: 12px; font-weight: 600; color: #b91c1c; border-bottom: 1px solid #fecaca;">
            🏪 매장 검색 결과 (${e.length}개)
          </div>
        `),a+=e.slice(0,7).map(i=>`
        <div class="search-result-item store-search-item" data-store-id="${i.id}">
          <div class="result-name">🏪 ${i.name}</div>
          <div class="result-info">${i.category} • ${i.address||"주소 정보 없음"} • ${i.isOpen?"운영중":"운영중지"} • ★${i.ratingAverage||"0.0"}</div>
        </div>
      `).join("")),s===0&&(a=`
        <div class="search-result-item">
          <div style="text-align: center; padding: 20px; color: #666;">
            <div style="font-size: 18px; margin-bottom: 8px;">🔍</div>
            <div style="font-weight: 600; margin-bottom: 4px;">"${n}"에 대한 검색 결과가 없습니다</div>
            <div style="font-size: 12px; color: #999;">다른 키워드로 검색해보세요</div>
          </div>
        </div>
      `),r.innerHTML=a,this.setupSearchResultEvents(e,t,o),r.classList.remove("hidden")},setupSearchResultEvents(e,t,n){const o=document.getElementById("searchResults");o.querySelectorAll(".location-search-item").forEach(r=>{r.addEventListener("click",()=>{const a=parseFloat(r.dataset.lat),s=parseFloat(r.dataset.lng),i=r.querySelector(".result-name").textContent.replace("📍 ",""),l=new naver.maps.LatLng(a,s);n.setCenter(l),n.setZoom(17),this.hideSearchResults(),document.getElementById("searchInput").value=i})}),o.querySelectorAll(".store-search-item").forEach(r=>{r.addEventListener("click",()=>{const a=parseInt(r.dataset.storeId),s=e.find(i=>i.id===a);if(s&&s.coord){const i=new naver.maps.LatLng(s.coord.lat,s.coord.lng);n.setCenter(i),n.setZoom(17),this.hideSearchResults(),document.getElementById("searchInput").value=s.name}})})},hideSearchResults(){const e=document.getElementById("searchResults");e&&e.classList.add("hidden")},showSearchError(e){const t=document.getElementById("searchResults");t.innerHTML=`
      <div class="search-result-item">
        <div style="text-align: center; padding: 20px; color: #e74c3c;">
          <div style="font-size: 18px; margin-bottom: 8px;">⚠️</div>
          <div style="font-weight: 600; margin-bottom: 4px;">검색 중 오류가 발생했습니다</div>
          <div style="font-size: 12px; color: #999;">${e}</div>
        </div>
      </div>
    `,t.classList.remove("hidden")},updateLocationText(e){const t=document.getElementById("locationText");t&&(t.textContent=e)},resetRegionSelects(){const e=document.getElementById("provinceSelect"),t=document.getElementById("citySelect"),n=document.getElementById("districtSelect"),o=document.getElementById("confirmLocationBtn");e.innerHTML='<option value="">시/도를 선택하세요</option>',t.innerHTML='<option value="">시/군/구를 선택하세요</option>',n.innerHTML='<option value="">읍/면/동을 선택하세요</option>',t.disabled=!0,n.disabled=!0,o.disabled=!0},resetCityAndDistrictSelects(){const e=document.getElementById("citySelect"),t=document.getElementById("districtSelect"),n=document.getElementById("confirmLocationBtn");e.innerHTML='<option value="">시/군/구를 선택하세요</option>',t.innerHTML='<option value="">읍/면/동을 선택하세요</option>',e.disabled=!0,t.disabled=!0,n.disabled=!0},resetDistrictSelect(){const e=document.getElementById("districtSelect"),t=document.getElementById("confirmLocationBtn");e.innerHTML='<option value="">읍/면/동을 선택하세요</option>',e.disabled=!0,t.disabled=!0},populateProvinceSelect(e){const t=document.getElementById("provinceSelect");t.innerHTML='<option value="">시/도를 선택하세요</option>',e.forEach(n=>{const o=document.createElement("option");o.value=n,o.textContent=n,t.appendChild(o)})},populateCitySelect(e){const t=document.getElementById("citySelect");t.innerHTML='<option value="">시/군/구를 선택하세요</option>',t.disabled=!1,e.forEach(n=>{const o=document.createElement("option");o.value=n,o.textContent=n,t.appendChild(o)})},populateDistrictSelect(e){const t=document.getElementById("districtSelect");t.innerHTML='<option value="">읍/면/동을 선택하세요</option>',t.disabled=!1,e.forEach(n=>{const o=document.createElement("option");o.value=n,o.textContent=n,t.appendChild(o)})},renderErrorUI(e){return`
      <div style="padding: 20px; text-align: center; color: red;">
        <h2>🚫 지도 로딩 실패</h2>
        <p>${e}</p>
        <button onclick="location.reload()">다시 시도</button>
      </div>
    `},showError(e){alert(e)},getMapStyles(){return`
      <style>
        html, body {
          margin: 0;
          padding: 0;
          height: 100%;
          font-family: 'Noto Sans KR', sans-serif;
          background: #f8f8f8;
          overflow: hidden;
        }

        /* 알림 버튼 */
        .notification-btn {
          position: absolute;
          top: 115px;
          right: 15px;
          width: 35px;
          height: 35px;
          border: none;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 18px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transition: all 0.3s ease;
          z-index: 1002;
        }

        .notification-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 16px rgba(220, 38, 38, 0.3);
        }

        .notification-btn:active {
          transform: scale(0.95);
        }

        .notification-badge {
          position: absolute;
          top: -2px;
          right: -2px;
          background: #dc2626;
          color: white;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 10px;
          min-width: 18px;
          text-align: center;
        }

        .notification-badge.hidden {
          display: none;
        }

        /* 현재 위치 버튼 */
        .current-location-btn {
          position: absolute;
          left: 20px;
          bottom: 205px;
          width: 48px;
          height: 48px;
          background: white;
          border: none;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transition: all 0.3s ease;
          z-index: 1001;
        }

        .current-location-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 16px rgba(0, 122, 255, 0.3);
        }

        .current-location-btn:active {
          transform: scale(0.95);
        }

        /* 검색바 */
        #searchBar {
          position: absolute;
          top: 48px;
          left: 12px;
          right: 12px;
          z-index: 1002;
          pointer-events: auto;
        }

        .search-container {
          display: flex;
          align-items: center;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.65), rgba(248, 250, 252, 0.40));
          border-radius: 28px;
          padding: 10px 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(41, 126, 252, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.3);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }

        .search-container:hover {
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12), 0 6px 20px rgba(41, 126, 252, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9);
          border-color: rgba(41, 126, 252, 0.2);
        }

        #searchInput {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          font-size: 16px;
          color: #1f2937;
          padding: 10px 12px;
          font-weight: 500;
        }

        #searchInput::placeholder {
          color: #9ca3af;
          font-weight: 400;
        }

        #searchBtn, #clearBtn {
          background: linear-gradient(135deg, #f8f9ff 0%, #f1f5f9 100%);
          border: 1px solid rgba(41, 126, 252, 0.1);
          font-size: 18px;
          cursor: pointer;
          padding: 8px;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          color: #6b7280;
        }

        


        /* 검색 결과 */
        .search-results {
          position: absolute;
          top: 100%;
          left: 0;
          width: 100%;
          max-height: 350px;
          overflow-y: auto;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.95));
          border-radius: 0 0 20px 20px;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12), 0 6px 20px rgba(41, 126, 252, 0.08);
          backdrop-filter: blur(20px);
          margin-top: 6px;
          border: 1px solid rgba(255, 255, 255, 0.4);
          border-top: none;
          z-index: 3000;
        }

        .search-results.hidden {
          display: none;
        }

        .search-result-item {
          padding: 14px 18px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.04);
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }

        .search-result-item::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background: linear-gradient(135deg, #297efc, #4f46e5);
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .search-result-item:hover {
          background: linear-gradient(135deg, rgba(41, 126, 252, 0.08), rgba(79, 70, 229, 0.05));
          transform: translateX(4px);
        }

        .search-result-item:hover::before {
          opacity: 1;
        }

        .search-result-item:last-child {
          border-bottom: none;
          border-radius: 0 0 20px 20px;
        }

        .result-name {
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 6px;
          font-size: 15px;
        }

        .result-info {
          font-size: 13px;
          color: #6b7280;
          font-weight: 500;
        }

        /* 위치 설정 모달 */
        .location-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(10px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          box-sizing: border-box;
        }

        .location-modal.hidden {
          display: none;
        }

        .modal-content {
          background: white;
          border-radius: 20px;
          width: 100%;
          max-width: 400px;
          max-height: 80vh;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
          animation: modalSlideIn 0.3s ease-out;
        }

        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-50px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .modal-header {
          padding: 20px 24px 16px 24px;
          border-bottom: 1px solid #f1f2f6;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          color: #2d3748;
        }

        .close-btn {
          background: #f7fafc;
          border: none;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 16px;
          color: #a0aec0;
          transition: all 0.2s ease;
        }

        .close-btn:hover {
          background: #edf2f7;
          color: #718096;
          transform: scale(1.1);
        }

        .modal-body {
          padding: 20px 24px 24px 24px;
          max-height: 60vh;
          overflow-y: auto;
        }

        .region-selection-container {
          margin-bottom: 20px;
        }

        .select-group {
          margin-bottom: 16px;
        }

        .select-group label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 6px;
        }

        .region-select {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 14px;
          background: white;
          outline: none;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .region-select:focus {
          border-color: #4299e1;
          box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
        }

        .region-select:disabled {
          background: #f7fafc;
          color: #a0aec0;
          cursor: not-allowed;
        }

        .confirm-location-btn {
          width: 100%;
          padding: 14px 20px;
          background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-top: 8px;
        }

        .confirm-location-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #3182ce 0%, #2c5282 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(66, 153, 225, 0.3);
        }

        .confirm-location-btn:disabled {
          background: #e2e8f0;
          color: #a0aec0;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .divider {
          text-align: center;
          margin: 20px 0;
          position: relative;
          color: #718096;
          font-size: 14px;
        }

        .divider::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background: #e2e8f0;
          z-index: 1;
        }

        .divider {
          background: white;
          padding: 0 16px;
          position: relative;
          z-index: 2;
        }

        .current-location-section {
          text-align: center;
          padding-top: 16px;
          border-top: 1px solid #e2e8f0;
        }

        .get-current-btn {
          padding: 12px 24px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .get-current-btn:hover {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        /* 콘텐츠 및 바텀바 */
        #content {
          position: fixed;
          top: 0;
          bottom: 84px;
          left: 0;
          width: 100%;
          max-width: 430px;
          height: calc(100vh - 84px);
          overflow: hidden;
          background: #fdfdfd;
          z-index: 1;
        }

        #map {
          width: 100%;
          height: 100%;
          position: relative;
          z-index: 0;
          overflow: hidden;
          border-radius: 0 0 18px 18px;
        }

        .bottom-nav-bar {
          position: fixed;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          max-width: 430px;
          background-color: #fff;
          display: flex;
          justify-content: space-around;
          align-items: center;
          padding: 8px 0 12px 0;
          border-top: 1px solid #eee;
          box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
          z-index: 1000;
        }

        .nav-item {
          background: none;
          border: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          padding: 6px 12px;
          transition: all 0.2s ease;
          flex: 1;
        }

        .nav-icon {
          font-size: 22px;
          transition: transform 0.2s ease;
        }

        .nav-label {
          font-size: 11px;
          color: #999;
          font-weight: 500;
        }

        .nav-item.active .nav-label {
          color: #007aff;
          font-weight: 600;
        }

        .nav-item.active .nav-icon {
          transform: scale(1.1);
        }

        .nav-item:active {
          transform: scale(0.95);
        }
        @supports (padding: max(0px)) {
          .bottom-nav-bar {
            padding-bottom: max(12px, env(safe-area-inset-bottom));
          }

      </style>
    `}};typeof window<"u"&&(window.mapView=c);export{c as mapView};
