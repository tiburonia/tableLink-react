// 지도 패널 UI 렌더링 관리자 (개별 매장 전용)
window.MapPanelUI = {
  // 필터 상태 관리
  activeFilters: {},
  renderPanelHTML() {
    return `
      <div id="mapStorePanel" class="collapsed">
        <div id="panelHandle"></div>
        <div id="filterBar" class="filter-bar">
          <button class="filter-btn" data-filter-type="category">
            <span class="filter-btn-icon">🍽️</span>
            <span class="filter-btn-text">카테고리</span>
          </button>
          <button class="filter-btn" data-filter-type="status">
            <span class="filter-btn-icon">🟢</span>
            <span class="filter-btn-text">운영 상태</span>
          </button>
          <button class="filter-btn" data-filter-type="rating">
            <span class="filter-btn-icon">⭐</span>
            <span class="filter-btn-text">별점</span>
          </button>
        </div>
        <div id="mapStoreListContainer"></div>
      </div>

      <!-- 바텀 시트 딤 -->
      <div id="sheetDim" class="sheet-dim"></div>

      <!-- 바텀 시트 -->
      <div id="bottomSheet" class="bottom-sheet">
        <div class="bottom-sheet-handle"></div>
        <div class="bottom-sheet-content" id="bottomSheetContent">
          <!-- 필터 내용이 동적으로 렌더링됨 -->
        </div>
      </div>
    `;
  },

  showLoading() {
    return `
      <div id="mapStorePanelContainer">
        <div class="map-panel-loading">
          <div class="map-panel-loading-spinner"></div>
          매장 정보를 불러오는 중...
        </div>
      </div>
    `;
  },



  // 바텀 시트 렌더링
  renderBottomSheetContent(filterType) {
    const contentMap = {
      category: {
        title: '카테고리',
        icon: '🍽️',
        options: [
          { value: 'all', label: '전체' },
          { value: '한식', label: '한식' },
          { value: '중식', label: '중식' },
          { value: '일식', label: '일식' },
          { value: '양식', label: '양식' },
          { value: '카페', label: '카페' },
          { value: '치킨', label: '치킨' }
        ]
      },
      status: {
        title: '운영 상태',
        icon: '🟢',
        options: [
          { value: 'all', label: '전체' },
          { value: 'open', label: '운영중' },
          { value: 'closed', label: '운영중지' }
        ]
      },
      rating: {
        title: '별점',
        icon: '⭐',
        options: [
          { value: 'all', label: '전체' },
          { value: '4+', label: '4점 이상' },
          { value: '3+', label: '3점 이상' },
          { value: '2+', label: '2점 이상' }
        ]
      }
    };

    const config = contentMap[filterType];
    if (!config) return '';

    const activeFilter = this.getActiveFilter(filterType);

    return `
      <div class="bottom-sheet-header">
        <span class="bottom-sheet-icon">${config.icon}</span>
        <h3 class="bottom-sheet-title">${config.title}</h3>
      </div>
      <div class="bottom-sheet-options">
        ${config.options.map(option => `
          <button 
            class="sheet-option-btn ${activeFilter === option.value ? 'active' : ''}" 
            data-filter="${option.value}" 
            data-type="${filterType}"
          >
            ${option.label}
          </button>
        `).join('')}
      </div>
    `;
  },

  // 현재 활성화된 필터 값 가져오기
  getActiveFilter(filterType) {
    return this.activeFilters[filterType] || 'all';
  },

  // 바텀 시트 열기
  openBottomSheet(filterType) {
    const bottomSheet = document.getElementById('bottomSheet');
    const sheetDim = document.getElementById('sheetDim');
    const bottomSheetContent = document.getElementById('bottomSheetContent');

    // 컨텐츠 렌더링
    bottomSheetContent.innerHTML = this.renderBottomSheetContent(filterType);

    // 활성화
    setTimeout(() => {
      bottomSheet.classList.add('active');
      sheetDim.classList.add('active');
    }, 10);

    // 옵션 버튼 이벤트 설정
    this.setupSheetOptionEvents();

    console.log('📂 바텀 시트 열림:', filterType);
  },

  // 바텀 시트 닫기
  closeBottomSheet() {
    const bottomSheet = document.getElementById('bottomSheet');
    const sheetDim = document.getElementById('sheetDim');

    bottomSheet.classList.remove('active');
    sheetDim.classList.remove('active');

    console.log('📁 바텀 시트 닫힘');
  },

  // 시트 옵션 버튼 이벤트 설정
  setupSheetOptionEvents() {
    const optionBtns = document.querySelectorAll('.sheet-option-btn');

    optionBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const filterValue = e.target.getAttribute('data-filter');
        const filterType = e.target.getAttribute('data-type');

        // 같은 타입의 다른 버튼 비활성화
        document.querySelectorAll(`.sheet-option-btn[data-type="${filterType}"]`).forEach(b => {
          b.classList.remove('active');
        });

        // 클릭된 버튼 활성화
        e.target.classList.add('active');

        // 필터 상태 저장
        if (filterValue === 'all') {
          delete this.activeFilters[filterType];
        } else {
          this.activeFilters[filterType] = filterValue;
        }

        // 필터링 적용
        this.applyFilters();

        // 바텀 시트 닫기
        setTimeout(() => {
          this.closeBottomSheet();
        }, 200);

        console.log('🔍 필터 변경됨:', filterType, '=', filterValue);
      });
    });
  },

  // 필터링 이벤트 설정
  setupFilterEvents() {
    // 필터 버튼 클릭 이벤트
    const filterBtns = document.querySelectorAll('.filter-btn');

    filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const filterType = btn.getAttribute('data-filter-type');
        this.openBottomSheet(filterType);
      });
    });

    // 딤 클릭 시 바텀 시트 닫기
    const sheetDim = document.getElementById('sheetDim');
    if (sheetDim) {
      sheetDim.addEventListener('click', () => {
        this.closeBottomSheet();
      });
    }

    console.log('✅ 필터 이벤트 설정 완료');
  },

  // 현재 설정된 모든 필터 값에 따라 매장 필터링
  applyFilters() {
    const activeFilters = this.activeFilters;

    const storeCards = document.querySelectorAll('#mapStoreListContainer .storeCard');

    storeCards.forEach(card => {
      const storeCategory = card.dataset.category;
      const storeStatus = card.dataset.status;
      const storeRating = parseFloat(card.dataset.rating);

      let categoryMatch = true;
      let statusMatch = true;
      let ratingMatch = true;

      // 카테고리 필터
      if (activeFilters.category) {
        categoryMatch = storeCategory === activeFilters.category;
      }

      // 운영 상태 필터
      if (activeFilters.status) {
        if (activeFilters.status === 'open') {
          statusMatch = storeStatus === 'true';
        } else if (activeFilters.status === 'closed') {
          statusMatch = storeStatus === 'false';
        }
      }

      // 별점 필터
      if (activeFilters.rating) {
        const requiredRating = parseFloat(activeFilters.rating.replace('+', ''));
        ratingMatch = !isNaN(storeRating) && storeRating >= requiredRating;
      }

      // 모든 조건 만족시 표시
      if (categoryMatch && statusMatch && ratingMatch) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });

    // 필터링 결과 로깅
    const visibleCards = document.querySelectorAll('#mapStoreListContainer .storeCard[style*="flex"], #mapStoreListContainer .storeCard:not([style*="none"])');
    console.log('🔍 필터링 적용:', activeFilters);
    console.log('📊 필터링 결과 - 총', visibleCards.length, '개 매장 표시');
  },

  // 패널 드래그 기능 설정
  setupPanelDrag() {
    const storePanel = document.getElementById('mapStorePanel');
    const panelHandle = document.getElementById('panelHandle');
    let isDragging = false;
    let startY;
    let startHeight;
    let currentHeight = storePanel.classList.contains('collapsed') ? 120 : 630;

    // 패널 상태 초기화
    storePanel.style.height = `${currentHeight}px`;
    if (currentHeight === 120) storePanel.classList.add('collapsed');
    else storePanel.classList.add('expanded');

    // 마우스 이벤트
    panelHandle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      isDragging = true;
      startY = e.clientY;
      startHeight = currentHeight;
      storePanel.style.transition = 'none';
      panelHandle.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      e.preventDefault();

      const deltaY = e.clientY - startY;
      let newHeight = startHeight - deltaY;

      const maxHeight = 630;
      const minHeight = 120;

      newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));

      storePanel.style.height = `${newHeight}px`;
      currentHeight = newHeight;

      if (newHeight <= minHeight + 10) {
        storePanel.classList.add('collapsed');
        storePanel.classList.remove('expanded');
      } else if (newHeight >= maxHeight - 10) {
        storePanel.classList.add('expanded');
        storePanel.classList.remove('collapsed');
      } else {
        storePanel.classList.remove('collapsed', 'expanded');
      }
    });

    document.addEventListener('mouseup', (e) => {
      if (!isDragging) return;
      isDragging = false;
      storePanel.style.transition = 'height 0.3s cubic-bezier(.68,-0.55,.27,1.55)';
      panelHandle.style.cursor = 'grab';
      document.body.style.userSelect = '';

      const midPoint = 300;

      if (currentHeight < midPoint) {
        storePanel.style.height = '120px';
        storePanel.classList.add('collapsed');
        storePanel.classList.remove('expanded');
        currentHeight = 120;
      } else {
        storePanel.style.height = '630px';
        storePanel.classList.add('expanded');
        storePanel.classList.remove('collapsed');
        currentHeight = 630;
      }
    });

    // 터치 이벤트
    panelHandle.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      isDragging = true;
      startY = e.touches[0].clientY;
      startHeight = currentHeight;
      storePanel.style.transition = 'none';
      document.body.style.userSelect = 'none';
      console.log('📱 모바일 패널 드래그 시작:', startY);
    });

    panelHandle.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      e.preventDefault();

      const currentY = e.touches[0].clientY;
      const deltaY = currentY - startY;
      let newHeight = startHeight - deltaY;

      const maxHeight = 630;
      const minHeight = 120;

      newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));

      storePanel.style.height = `${newHeight}px`;
      currentHeight = newHeight;

      if (newHeight <= minHeight + 10) {
        storePanel.classList.add('collapsed');
        storePanel.classList.remove('expanded');
      } else if (newHeight >= maxHeight - 10) {
        storePanel.classList.add('expanded');
        storePanel.classList.remove('collapsed');
      } else {
        storePanel.classList.remove('collapsed', 'expanded');
      }
    });

    panelHandle.addEventListener('touchend', (e) => {
      if (!isDragging) return;
      e.preventDefault();
      isDragging = false;
      storePanel.style.transition = 'height 0.3s cubic-bezier(.68,-0.55,.27,1.55)';
      document.body.style.userSelect = '';

      const midPoint = 300;

      if (currentHeight < midPoint) {
        storePanel.style.height = '120px';
        storePanel.classList.add('collapsed');
        storePanel.classList.remove('expanded');
        currentHeight = 120;
        console.log('📱 모바일 패널 접힘');
      } else {
        storePanel.style.height = '630px';
        storePanel.classList.add('expanded');
        storePanel.classList.remove('collapsed');
        currentHeight = 630;
        console.log('📱 모바일 패널 펼침');
      }
    });

    panelHandle.addEventListener('touchcancel', (e) => {
      if (!isDragging) return;
      isDragging = false;
      storePanel.style.transition = 'height 0.3s cubic-bezier(.68,-0.55,.27,1.55)';
      document.body.style.userSelect = '';
      console.log('📱 모바일 패널 드래그 취소');
    });

    // 이벤트 전파 차단
    storePanel.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    storePanel.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      e.preventDefault();
    });

    const filterContainer = document.getElementById('mapFilterContainer');
    if (filterContainer) {
      filterContainer.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }

    const storeListContainer = document.getElementById('mapStoreListContainer');
    if (storeListContainer) {
      storeListContainer.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }

    const filterToggleBtn = document.getElementById('mapFilterToggleBtn');
    if (filterToggleBtn) {
      filterToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }

    console.log('✅ 지도 패널: 드래그 전용 모드로 설정 완료');
  },

  // 개별 매장 전용 API 호출
  async loadViewportStores(map) {
    if (!map) {
      console.warn('⚠️ 지도 인스턴스가 없습니다');
      return [];
    }

    try {
      const bounds = map.getBounds();
      const naverZoom = map.getZoom(); // 네이버 지도: getZoom() 사용 (6-21)

      // 네이버 줌을 카카오 레벨로 변환 (1-14)
      const kakaoLevel = window.mapLevelConverter ?
        window.mapLevelConverter.naverZoomToKakaoLevel(naverZoom) :
        Math.max(1, Math.min(14, 28 - naverZoom)); // fallback

      // 네이버 지도 API: getSW(), getNE() 또는 _sw, _ne 프로퍼티 사용
      const sw = bounds.getSW ? bounds.getSW() : bounds._sw;
      const ne = bounds.getNE ? bounds.getNE() : bounds._ne;

      // bbox 형식으로 파라미터 구성
      const bbox = `${sw.lng()},${sw.lat()},${ne.lng()},${ne.lat()}`;

      const params = new URLSearchParams({
        level: kakaoLevel,
        bbox: bbox
      });

      console.log(`📱 개별 매장 API 호출: 네이버줌=${naverZoom} → 카카오레벨=${kakaoLevel}, bbox=${bbox}`);

      const response = await fetch(`/api/clusters/clusters?${params}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API 응답 오류:', response.status, errorText);
        throw new Error(`API 호출 실패: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || '매장 데이터 조회 실패');
      }

      // 응답 데이터 정규화
      const features = data.data || data.features || [];
      console.log(`✅ 개별 매장 ${features.length}개 로딩 완료 (카카오레벨: ${kakaoLevel})`);

      // 빈 결과 처리
      if (features.length === 0) {
        console.log(`📍 현재 뷰포트에 매장 데이터 없음 - 카카오레벨: ${kakaoLevel}, bbox: ${bbox}`);
      }

      // 표준화된 storeData 객체로 변환
      const stores = features
        .filter(feature => feature.kind === 'individual')
        .map(feature => {
          // 서버에서 이미 표준화된 형식으로 받았는지 확인
          if (feature.coord && feature.region) {
            console.log('✅ 이미 표준화된 storeData:', feature.name);
            return feature;
          }

          // 레거시 형식이면 변환
          console.log('🔄 레거시 데이터 변환:', feature.name);
          return window.mapService ?
            window.mapService.transformStoreData(feature) :
            this.legacyTransformStoreData(feature);
        })
        .filter(store => {
          const isValid = window.mapService ?
            window.mapService.validateStoreData(store) :
            store && store.id && store.name;

          if (!isValid) {
            console.warn('⚠️ 유효하지 않은 storeData:', store);
          }

          return isValid;
        });

      console.log(`✅ 최종 변환된 매장 데이터 ${stores.length}개:`, stores.map(s => ({ id: s.id, name: s.name, idType: typeof s.id })));
      return stores;
    } catch (error) {
      console.error('❌ 뷰포트 매장 데이터 로딩 실패:', error);
      throw error;
    }
  },

  // 뷰포트 기반 패널 완전 재구성 (개별 매장만)
  async rebuildStorePanel(map) {
    const storeListContainer = document.getElementById('mapStoreListContainer');
    if (!storeListContainer) return;

    const bounds = map.getBounds();
    const naverZoom = map.getZoom(); // 네이버 지도: getZoom() 사용 (6-21)

    // 네이버 지도 API: getSW(), getNE() 또는 _sw, _ne 프로퍼티 사용
    const sw = bounds.getSW ? bounds.getSW() : bounds._sw;
    const ne = bounds.getNE ? bounds.getNE() : bounds._ne;
    console.log(`🔄 뷰포트 기반 패널 재구성 - 네이버줌: ${naverZoom}, 범위: (${sw.lat()},${sw.lng()}) ~ (${ne.lat()},${ne.lng()})`);

    // 기존 컨텐츠 제거
    storeListContainer.innerHTML = '';

    // 로딩 상태 표시
    storeListContainer.innerHTML = this.showLoading();

    try {
      // 뷰포트 매장 데이터 새로 로딩
      const stores = await this.loadViewportStores(map);

      // 로딩 메시지 제거
      storeListContainer.innerHTML = '';

      if (stores.length === 0) {
        storeListContainer.innerHTML = `
          <div class="empty-viewport-message" style="text-align: center; padding: 40px 20px; color: #666;">
            <div style="font-size: 48px; margin-bottom: 16px;">🔍</div>
            <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">현재 영역에 매장이 없습니다</div>
            <div style="font-size: 14px;">지도를 이동하거나 확대해보세요</div>
            <div style="font-size: 12px; color: #999; margin-top: 8px;">네이버줌: ${naverZoom}</div>
          </div>
        `;
        return;
      }

      // 매장 카드 렌더링
      const cardFragments = stores
        .filter(store => store)
        .map(store => {
          try {
            return this.createStoreCard(store);
          } catch (error) {
            console.error(`❌ 매장 카드 렌더링 실패 (${store?.name || 'Unknown'}):`, error);
            return '';
          }
        })
        .filter(card => card);

      // 모든 카드를 한번에 DOM에 추가
      storeListContainer.innerHTML = cardFragments.join('');

      console.log(`✅ 뷰포트 기반 패널 재구성 완료: ${cardFragments.length}개 매장 카드`);

      // 필터 상태 초기화 후 재적용
      this.resetFilters();
      this.applyFilters();

    } catch (error) {
      console.error('❌ 뷰포트 기반 패널 재구성 실패:', error);
      storeListContainer.innerHTML = `
        <div class="error-message" style="text-align: center; padding: 40px 20px; color: #dc2626;">
          <div style="font-size: 48px; margin-bottom: 16px;">❌</div>
          <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">패널 재구성 실패</div>
          <div style="font-size: 14px;">네트워크를 확인하고 다시 시도해주세요</div>
          <div style="font-size: 12px; color: #999; margin-top: 8px;">오류: ${error.message}</div>
        </div>
      `;
    }
  },

  // 지도 이벤트와 연동하여 패널 업데이트
  connectToMap(map) {
    if (!map) {
      console.warn('⚠️ 지도 인스턴스가 없어 패널 연동을 건너뜁니다');
      return;
    }

    console.log('🔗 지도와 패널 연동 시작 (개별 매장 전용)');

    // 디바운스용 타이머
    let updateTimer = null;

    // 뷰포트 기반 패널 완전 재구성 함수
    const rebuildPanelForViewport = () => {
      console.log('🔄 뷰포트 변경 - 패널 완전 재구성 시작');

      // 기존 타이머 정리
      if (updateTimer) {
        clearTimeout(updateTimer);
      }

      // 300ms 디바운스로 성능 최적화
      updateTimer = setTimeout(async () => {
        try {
          // 패널 완전 재구성
          await this.rebuildStorePanel(map);
          console.log('✅ 뷰포트 기반 패널 재구성 완료');
        } catch (error) {
          console.error('❌ 패널 재구성 실패:', error);
        }
      }, 300);
    };

    // 초기 패널 구성
    this.rebuildStorePanel(map);

    // 지도 이벤트 리스너 등록
    naver.maps.Event.addListener(map, 'dragend', rebuildPanelForViewport);
    naver.maps.Event.addListener(map, 'zoom_changed', rebuildPanelForViewport);
    naver.maps.Event.addListener(map, 'idle', () => {
      console.log('🗺️ 지도 idle - 최종 패널 재구성');
      rebuildPanelForViewport();
    });
  },

  // 매장 카드 생성 (개별 매장 전용)
  createStoreCard(store) {
    if (!store) {
      console.error('❌ 매장 데이터가 없음');
      return '';
    }


    // ID 우선 검증 - store_id 또는 id 사용
    let storeId = store.id || store.store_id;

    // 숫자 타입으로 변환 시도
    if (typeof storeId === 'string' && !isNaN(storeId)) {
      storeId = parseInt(storeId, 10);
    }

    if (!storeId || (typeof storeId !== 'number' && typeof storeId !== 'string') || storeId <= 0) {
      console.error('❌ 매장 카드 생성 실패: 유효하지 않은 ID', {
        store,
        hasId: !!store.id,
        hasStoreId: !!store.store_id,
        storeIdType: typeof storeId,
        storeIdValue: storeId,
        keys: Object.keys(store || {})
      });
      return '';
    }

    const storeName = store?.name || '매장명 없음';
    const storeCategory = store?.category || '카테고리 없음';
    const rating = store?.ratingAverage ? parseFloat(store.ratingAverage).toFixed(1) : '0.0';
    const reviewCount = store?.reviewCount || 0;
    const storeAddress = store?.address || '주소 정보 없음';
    const isOpen = store?.isOpen !== false;

    // 매장 데이터 정규화 - id 속성 확실히 설정
    const normalizedStore = {
      ...store,
      id: storeId,
      store_id: storeId // 호환성을 위해 둘 다 설정
    };



    // renderStore 함수 호출을 위한 안전한 데이터 처리
    let storeDataForRender;
    try {
      const jsonString = JSON.stringify(normalizedStore);
      storeDataForRender = jsonString.replace(/"/g, '&quot;');
    } catch (jsonError) {
      console.error('❌ JSON 직렬화 실패:', jsonError);
      // 최소한의 데이터만 전달
      const minimalStore = {
        id: storeId,
        store_id: storeId,
        name: storeName,
        category: storeCategory,
        isOpen: isOpen
      };
      storeDataForRender = JSON.stringify(minimalStore).replace(/"/g, '&quot;');
    }

    return `
      <div class="storeCard" data-status="${isOpen ? 'true' : 'false'}" data-category="${storeCategory}" data-rating="${rating}" onclick="renderStore(${storeDataForRender})">
        <div class="storeImageBox">
          <img src="TableLink.png" alt="가게 이미지" />
          <div class="storeStatus ${isOpen ? 'open' : 'closed'}">
            ${isOpen ? '🟢 운영중' : '🔴 운영중지'}
          </div>
        </div>
        <div class="storeInfoBox">
          <div class="storeHeader">
            <div class="storeName">${storeName}</div>
            <div class="storeRating">
              <span class="ratingStars">★</span>
              <span class="ratingValue">${rating}</span>
              <span class="reviewCount">(${reviewCount})</span>
            </div>
          </div>
          <div class="storeCategory">${storeCategory}</div>
          <div class="storeActions">
            <div class="actionButton primary">
              <span class="actionIcon">🍽️</span>
              <span class="actionText">메뉴보기</span>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // 필터 상태 초기화
  resetFilters() {
    // 필터 상태 초기화
    this.activeFilters = {};

    console.log('🔄 필터 상태 초기화 완료');
  },

  // 필터링 이벤트 설정 및 초기화
  initializeFiltering() {
    setTimeout(() => {
      this.setupFilterEvents();
      this.applyFilters();
    }, 100);
  },

  // 호환성을 위한 updateStoreList 메서드
  async updateStoreList(map) {
    console.log('⚠️ updateStoreList 호출됨 - rebuildStorePanel로 리다이렉트');
    return await this.rebuildStorePanel(map);
  },

  // 레거시 데이터 변환 함수 (폴백용)
  legacyTransformStoreData(feature) {
    let storeId = feature.id || feature.store_id;

    if (typeof storeId === 'string' && !isNaN(storeId)) {
      storeId = parseInt(storeId, 10);
    }

    if (!storeId || storeId <= 0) {
      console.error('❌ 유효하지 않은 매장 ID:', feature);
      return null;
    }

    return {
      id: storeId,
      store_id: storeId,
      name: feature.name || '매장명 없음',
      category: feature.category || '기타',
      address: `${feature.sido || ''} ${feature.sigungu || ''} ${feature.eupmyeondong || ''}`.trim() || '주소 정보 없음',
      ratingAverage: feature.rating_average ? parseFloat(feature.rating_average) : 0.0,
      reviewCount: feature.review_count || 0,
      favoriteCount: 0,
      isOpen: feature.is_open !== false,
      coord: {
        lat: parseFloat(feature.lat),
        lng: parseFloat(feature.lng)
      },
      region: {
        sido: feature.sido,
        sigungu: feature.sigungu,
        eupmyeondong: feature.eupmyeondong
      }
    };
  },

  // 수동 새로고침 메서드
  async refresh() {
    if (window.currentMap) {
      console.log('🔄 패널 수동 새로고침 - 개별 매장 전용');
      await this.rebuildStorePanel(window.currentMap);
    } else {
      console.warn('⚠️ 지도가 준비되지 않아 패널 새로고침을 건너뜁니다');
    }
  },

  // 초기화 함수
  init() {
    // 패널 DOM 및 스타일 렌더링
    if (!document.getElementById('mapStorePanel')) {
      document.body.insertAdjacentHTML('beforeend', this.renderPanelHTML());
      document.body.insertAdjacentHTML('beforeend', this.getPanelStyles());
    }

    // 필터링 및 드래그 이벤트 설정
    this.initializeFiltering();
    this.setupPanelDrag();

    // 지도가 준비되면 연동
    const checkMapReady = () => {
      if (window.currentMap) {
        this.connectToMap(window.currentMap);
      } else {
        setTimeout(checkMapReady, 100);
      }
    };
    checkMapReady();
  }
};