/**
 * QRPage - QR 주문 페이지
 * 
 * FSD 원칙: 페이지는 조립만 한다
 * - useState ❌
 * - useEffect ❌
 * - API 호출 ❌
 */

import { useQRScan } from '@/features/qr-scan'
import { BottomNavigation } from '@/widgets/Layout'
import styles from './QRPage.module.css'

export const QRPage = () => {
  // Hook에서 모든 상태와 로직을 가져옴
  const {
    searchQuery,
    searchResults,
    selectedStore,
    selectedTable,
    tables,
    showResults,
    isSearching,
    handleSearchChange,
    handleSearchFocus,
    handleSearchBlur,
    handleStoreSelect,
    handleTableSelect,
    handleStartOrder,
  } = useQRScan()

  return (
    <div className='mobile-app'>
      <div className="mobile-content">
    <div className="qr-page">
      <div className="qr-header">
        <h1>🏪 매장 주문</h1>
        <p>매장과 테이블을 선택하고 주문을 시작하세요</p>
      </div>

      <div className="qr-content">
        {/* 매장 검색 */}
        <div className="qr-section">
          <label className="qr-label">
            <span className="label-icon">🔍</span>
            <span>매장 검색</span>
          </label>
          <div className="search-wrapper">
            <input
              type="text"
              className="qr-search-input"
              placeholder="매장 이름을 검색하세요... (최소 2글자)"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
            />
            {showResults && !selectedStore && (
              <div className="search-results">
                {isSearching ? (
                  <div className="search-loading">
                    <div className="loading-spinner">🔄</div>
                    <div>검색 중...</div>
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((store) => (
                    <div
                      key={store.id}
                      className="search-result-item"
                      onClick={() => handleStoreSelect(store)}
                    >
                      <div className="result-icon">🏪</div>
                      <div className="result-info">
                        <div className="result-name">{store.name}</div>
                        <div className="result-category">{store.category || '기타'}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="search-no-results">
                    <div className="no-results-icon">🔍</div>
                    <div>검색 결과가 없습니다</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 선택된 매장 */}
        {selectedStore && (
          <div className="qr-section">
            <div className="selected-store-card">
              <div className="store-badge">✓ 선택됨</div>
              <div className="store-info">
                <div className="store-name">{selectedStore.name}</div>
                <div className="store-address">{selectedStore.address || '주소 정보 없음'}</div>
              </div>
            </div>
          </div>
        )}

        {/* 테이블 선택 */}
        {selectedStore && tables.length > 0 && (
          <div className="qr-section">
            <label className="qr-label">
              <span className="label-icon">🪑</span>
              <span>테이블 선택</span>
            </label>
            <select
              className="qr-select"
              value={selectedTable || ''}
              onChange={(e) => handleTableSelect(Number(e.target.value))}
            >
              <option value="">테이블을 선택하세요</option>
              {tables.map((table) => (
                <option key={table.id} value={table.id}>
                  {table.tableName}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 주문 시작 버튼 */}
        <button
          className="qr-start-btn"
          disabled={!selectedStore || !selectedTable}
          onClick={handleStartOrder}
        >
          <span className="btn-icon">🛒</span>
          <span>주문 시작하기</span>
        </button>

        {/* QR 스캔 안내 */}
        <div className="qr-divider">
          <span>또는</span>
        </div>

        <div className="qr-scan-section">
          <div className="scan-icon">📱</div>
          <h3>QR 코드 스캔</h3>
          <p>테이블의 QR 코드를 스캔하면 바로 주문할 수 있습니다</p>
          <button className="qr-scan-btn" onClick={() => alert('QR 스캔 기능은 준비중입니다')}>
            카메라 열기
          </button>
        </div>
      </div>
    </div>
    <BottomNavigation />
    </div>
    </div>
  )
}
