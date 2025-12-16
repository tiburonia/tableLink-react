import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { qrController } from './controllers/qrController'
import './QRPage.css'

interface Store {
  id: string
  name: string
  category?: string
  address?: string
}

interface Table {
  id: number
  number: number
  name: string
  isOccupied: boolean
}

export const QRPage = () => {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Store[]>([])
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [selectedTable, setSelectedTable] = useState<number | null>(null)
  const [tables, setTables] = useState<Table[]>([])
  const [showResults, setShowResults] = useState(false)

  // 매장 검색
  useEffect(() => {
    if (searchQuery.length >= 2) {
      qrController.handleSearch(searchQuery, (stores) => {
        setSearchResults(stores)
        setShowResults(true)
      })
    }
  }, [searchQuery])

  // 매장 선택
  const handleStoreSelect = async (store: Store) => {
    try {
      await qrController.handleStoreSelect(store.id, async (selectedStore) => {
        setSelectedStore(selectedStore)
        setShowResults(false)
        setSearchQuery(selectedStore.name)
        
        // 테이블 목록 가져오기
        const tableLists = await qrController.getTables()
        setTables(tableLists)
      })
    } catch (error) {
      console.error('매장 선택 실패:', error)
    }
  }

  // 주문 시작
  const handleStartOrder = () => {
    if (selectedStore && selectedTable) {
      navigate(`/main/p/${selectedStore.id}?table=${selectedTable}`)
    }
  }

  return (
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
              placeholder="매장 이름을 검색하세요..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery && setShowResults(true)}
            />
            {showResults && searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.map((store) => (
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
                ))}
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
              onChange={(e) => setSelectedTable(Number(e.target.value))}
            >
              <option value="">테이블을 선택하세요</option>
              {tables.map((table) => (
                <option key={table.id} value={table.number}>
                  {table.name}
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
  )
}
