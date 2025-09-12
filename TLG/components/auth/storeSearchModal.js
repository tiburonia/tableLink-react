/**
 * 매장 검색 모달 컴포넌트
 */

export function createStoreSearchModal(type, title, themeColor) {
  const modalId = `${type}StoreSearchModal`;
  const inputId = `${type}StoreNameInput`;
  const resultsId = `${type}StoreSearchResults`;

  return `
    <div class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header" style="background: linear-gradient(135deg, ${themeColor.primary} 0%, ${themeColor.secondary} 100%);">
          <h2>${title}</h2>
          <button class="close-btn" onclick="close${type.toUpperCase()}StoreSearchModal()">×</button>
        </div>
        <div class="modal-body">
          <div class="search-section">
            <div class="search-input-wrapper">
              <input
                id="${inputId}"
                type="text"
                placeholder="매장 이름을 입력하세요..."
                class="search-input"
                autocomplete="off"
              />
              <div class="search-icon">🔍</div>
            </div>
            <div id="${resultsId}" class="search-results"></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function setupStoreSearchModal(type, selectCallback) {
  const inputId = `${type}StoreNameInput`;
  const resultsId = `${type}StoreSearchResults`;

  const input = document.getElementById(inputId);
  const results = document.getElementById(resultsId);

  if (!input || !results) return;

  let searchTimeout = null;

  input.addEventListener('input', (e) => {
    const query = e.target.value.trim();

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (query.length < 2) {
      results.style.display = 'none';
      return;
    }

    searchTimeout = setTimeout(() => {
      searchStores(query, type, results, selectCallback);
    }, 200);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const firstResult = results.querySelector('.store-result-item');
      if (firstResult) {
        firstResult.click();
      }
    }
  });

  // 포커스 설정
  setTimeout(() => input.focus(), 100);
}

async function searchStores(query, type, resultsElement, selectCallback) {
  try {
    console.log(`🔍 ${type.toUpperCase()} 매장 검색: "${query}"`);

    if (!query || query.trim().length === 0) {
      return [];
    }

    const response = await fetch(`/api/stores/search?query=${encodeURIComponent(query.trim())}&limit=20`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`📊 ${type.toUpperCase()} 매장 검색 결과:`, data);

    if (data.success && Array.isArray(data.stores)) {
      displaySearchResults(data.stores, resultsElement, selectCallback);
    } else {
      console.warn(`${type.toUpperCase()} 매장 검색 응답 형식 오류:`, data);
      resultsElement.innerHTML = `
        <div class="no-results">
          "${query}"에 대한 검색 결과가 없습니다.
        </div>
      `;
      resultsElement.style.display = 'block';
    }
  } catch (error) {
    console.error(`${type.toUpperCase()} 매장 검색 실패:`, error);

    // 사용자에게 에러 표시
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: absolute;
      top: 50px;
      left: 20px;
      right: 20px;
      background: #fee;
      color: #c53030;
      padding: 12px;
      border-radius: 8px;
      border: 1px solid #fed7d7;
      z-index: 1000;
    `;
    errorDiv.textContent = `매장 검색 실패: ${error.message}`;

    const modalContent = document.querySelector(`#${type}StoreSearchModal .modal-content`);
    if (modalContent) {
      // 기존 로딩 스피너가 있다면 제거
      const existingLoading = modalContent.querySelector('.loading-results');
      if (existingLoading) existingLoading.remove();

      modalContent.appendChild(errorDiv);
      setTimeout(() => errorDiv.remove(), 3000);
    }

    resultsElement.innerHTML = `
      <div class="no-results">
        검색 중 오류가 발생했습니다.
      </div>
    `;
    resultsElement.style.display = 'block';

    return [];
  }
}

function displaySearchResults(stores, resultsElement, selectCallback) {
  try {
    const resultsHTML = stores.map(store => {
      const storeName = (store.name || '').replace(/'/g, "\\'");
      const storeCategory = store.category || '기타';
      const storeAddress = store.address || '주소 정보 없음';

      return `
        <div class="store-result-item" onclick="${selectCallback}(${store.id}, '${storeName}')">
          <div class="store-result-name">${store.name || 'Unknown Store'}</div>
          <div class="store-result-info">
            ${storeCategory} • ${storeAddress}
          </div>
        </div>
      `;
    }).join('');

    resultsElement.innerHTML = resultsHTML;
    resultsElement.style.display = 'block';
  } catch (error) {
    console.error('검색 결과 표시 오류:', error);
    resultsElement.innerHTML = `
      <div class="no-results">
        검색 결과 표시 중 오류가 발생했습니다
      </div>
    `;
    resultsElement.style.display = 'block';
  }
}

// 매장 검색 모달 스타일
export const modalStyles = `
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    backdrop-filter: blur(4px);
  }

  .modal-content {
    position: relative; /* Error message positioning for */
    background: white;
    border-radius: 16px;
    width: 90%;
    max-width: 500px;
    max-height: 80vh;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid #e5e7eb;
    color: white;
  }

  .modal-header h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
  }

  .close-btn {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    font-size: 24px;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .close-btn:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .modal-body {
    padding: 24px;
  }

  .search-input-wrapper {
    position: relative;
    margin-bottom: 16px;
  }

  .search-input {
    width: 100%;
    padding: 16px 20px;
    padding-right: 50px;
    font-size: 16px;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    background: #f9fafb;
    transition: all 0.3s ease;
    box-sizing: border-box;
  }

  .search-input:focus {
    outline: none;
    border-color: #667eea;
    background: white;
    box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
  }

  .search-icon {
    position: absolute;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
    color: #9ca3af;
    font-size: 18px;
    pointer-events: none;
  }

  .search-results {
    max-height: 300px;
    overflow-y: auto;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    background: white;
    display: none;
  }

  .store-result-item {
    padding: 16px 20px;
    cursor: pointer;
    border-bottom: 1px solid #f3f4f6;
    transition: all 0.2s ease;
  }

  .store-result-item:hover {
    background: #f8fafc;
  }

  .store-result-item:last-child {
    border-bottom: none;
  }

  .store-result-name {
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 4px;
  }

  .store-result-info {
    font-size: 14px;
    color: #6b7280;
  }

  .no-results, .loading-results {
    padding: 20px;
    text-align: center;
    color: #6b7280;
    font-size: 14px;
  }

  .loading-spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid #e0e0e0;
    border-top: 2px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-right: 8px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;