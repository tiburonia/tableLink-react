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
    <div className={styles.qrPage}>
      <div className={styles.qrHeader}>
        <h1>🏪 매장 주문</h1>
        <p>매장과 테이블을 선택하고 주문을 시작하세요</p>
      </div>

      <div className={styles.qrContent}>
        {/* 매장 검색 */}
        <div className={styles.qrSection}>
          <label className={styles.qrLabel}>
            <span className={styles.labelIcon}>🔍</span>
            <span>매장 검색</span>
          </label>
          <div className={styles.searchWrapper}>
            <input
              type="text"
              className={styles.qrSearchInput}
              placeholder="매장 이름을 검색하세요... (최소 2글자)"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
            />
            {showResults && !selectedStore && (
              <div className={styles.searchResults}>
                {isSearching ? (
                  <div className={styles.searchLoading}>
                    <div className={styles.loadingSpinner}>🔄</div>
                    <div>검색 중...</div>
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((store) => (
                    <div
                      key={store.id}
                      className={styles.searchResultItem}
                      onClick={() => handleStoreSelect(store)}
                    >
                      <div className={styles.resultIcon}>🏪</div>
                      <div className={styles.resultInfo}>
                        <div className={styles.resultName}>{store.name}</div>
                        <div className={styles.resultCategory}>{store.category || '기타'}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={styles.searchNoResults}>
                    <div className={styles.noResultsIcon}>🔍</div>
                    <div>검색 결과가 없습니다</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 선택된 매장 */}
        {selectedStore && (
          <div className={styles.qrSection}>
            <div className={styles.selectedStoreCard}>
              <div className={styles.storeBadge}>✓ 선택됨</div>
              <div className={styles.storeInfo}>
                <div className={styles.storeName}>{selectedStore.name}</div>
                <div className={styles.storeAddress}>{selectedStore.address || '주소 정보 없음'}</div>
              </div>
            </div>
          </div>
        )}

        {/* 테이블 선택 */}
        {selectedStore && tables.length > 0 && (
          <div className={styles.qrSection}>
            <label className={styles.qrLabel}>
              <span className={styles.labelIcon}>🪑</span>
              <span>테이블 선택</span>
            </label>
            <select
              className={styles.qrSelect}
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
          className={styles.qrStartBtn}
          disabled={!selectedStore || !selectedTable}
          onClick={handleStartOrder}
        >
          <span className={styles.btnIcon}>🛒</span>
          <span>주문 시작하기</span>
        </button>

        {/* QR 스캔 안내 */}
        <div className={styles.qrDivider}>
          <span>또는</span>
        </div>

        <div className={styles.qrScanSection}>
          <div className={styles.scanIcon}>📱</div>
          <h3>QR 코드 스캔</h3>
          <p>테이블의 QR 코드를 스캔하면 바로 주문할 수 있습니다</p>
          <button className={styles.qrScanBtn} onClick={() => alert('QR 스캔 기능은 준비중입니다')}>
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
