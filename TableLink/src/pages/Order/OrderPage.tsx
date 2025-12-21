import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { orderController } from './controllers/orderController'
import { orderService, type MenuItem, type CartItem, type StoreInfo } from './services/orderService'
import './OrderPage.css'



export const OrderPage = () => {
  const { storeId } = useParams<{ storeId: string }>()
  const [searchParams] = useSearchParams()
  const tableNumber = searchParams.get('table')
  const navigate = useNavigate()
  
  const [store, setStore] = useState<StoreInfo | null>(null)
  const [menuList, setMenuList] = useState<MenuItem[]>([])
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showCart, setShowCart] = useState(false)
  const [loading, setLoading] = useState(true)

  //유저 정보 로드 (테스트용 하드코딩)
  const user = localStorage.getItem('user')
  const userPk = user ? JSON.parse(user).user_pk : null

  // 매장 및 메뉴 로드
  useEffect(() => {
    const loadData = async () => {
      if (!storeId) return

      setLoading(true)
      const storeIdNum = parseInt(storeId)
      const result = await orderService.getStoreAndMenu(storeIdNum)
      
      setStore(result.store)
      setMenuList(result.menu)
      setLoading(false)
    }

    loadData()
  }, [storeId])

  // 카테고리 목록 (cook_station 기준)
  const categories = ['all', ...Array.from(new Set(menuList.map(m => m.cook_station).filter(Boolean)))] as string[]

  // 필터링된 메뉴
  const filteredMenu = selectedCategory === 'all'
    ? menuList
    : menuList.filter(m => m.cook_station === selectedCategory)

  // 장바구니에 추가
  const handleAddToCart = (menu: MenuItem) => {
    orderController.addToCart(menu, setCartItems)
  }

  // 수량 변경
  const handleUpdateQuantity = (menuId: number, change: number) => {
    orderController.updateQuantity(menuId, change, setCartItems)
  }

  // 주문하기
  const handleOrder = async () => {
    if (!storeId || !tableNumber || !store) {
      alert('매장 또는 테이블 정보가 없습니다')
      return
    }

    if (cartItems.length === 0) {
      alert('장바구니가 비어있습니다')
      return
    }

    try {
      // PayPage로 이동 (결제 정보 확인 화면)
      navigate('/pay', {
        state: {
          userPk: userPk,
          storeId: parseInt(storeId),
          storeName: store.name,
          tableNumber: parseInt(tableNumber),
          items: cartItems,
        },
      })
    } catch (error) {
      console.error('주문 처리 실패:', error)
      alert('주문 처리 중 오류가 발생했습니다')
    }
  }

  // 총액 계산
  const { subtotal, tax, total } = orderController.calculateTotal()

  if (loading) {
    return (
      <div className="order-page">
        <div className="order-loading">로딩 중...</div>
      </div>
    )
  }

  if (!store) {
    return (
      <div className="order-page">
        <div className="order-error">매장 정보를 찾을 수 없습니다</div>
      </div>
    )
  }

  return (
    <div className ="mobile-app">
      <div className="mobile-content">
    <div className="order-page">
      {/* 헤더 */}
      <div className="order-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ←
        </button>
        <div className="header-info">
          <h1>{store.name}</h1>
          <p>테이블 {tableNumber ? `${tableNumber}번` : '미설정'}</p>
        </div>
        <button 
          className="cart-btn" 
          onClick={() => setShowCart(true)}
        >
          🛒
          {cartItems.length > 0 && (
            <span className="cart-badge">{cartItems.length}</span>
          )}
        </button>
      </div>

      {/* 카테고리 */}
      <div className="category-bar">
        {categories.map(cat => (
          <button
            key={cat}
            className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => {
              const category = cat || 'all'
              setSelectedCategory(category)
              orderController.setCategory(category)
            }}
          >
            {cat === 'all' ? '전체' : cat}
          </button>
        ))}
      </div>

      {/* 메뉴 목록 */}
      <div className="menu-list">
        {filteredMenu.map(menu => (
          <div key={menu.id} className="menu-item">
            <div className="menu-info">
              <h3>{menu.name}</h3>
              {menu.description && <p>{menu.description}</p>}
              <div className="menu-price">₩{menu.price.toLocaleString()}</div>
            </div>
            <button 
              className="add-btn"
              onClick={() => handleAddToCart(menu)}
            >
              +
            </button>
          </div>
        ))}
      </div>

      {/* 장바구니 모달 */}
      {showCart && (
        <div className="cart-modal">
          <div className="cart-overlay" onClick={() => setShowCart(false)} />
          <div className="cart-content">
            <div className="cart-header">
              <h2>장바구니</h2>
              <button onClick={() => setShowCart(false)}>✕</button>
            </div>

            {cartItems.length === 0 ? (
              <div className="cart-empty">장바구니가 비어있습니다</div>
            ) : (
              <>
                <div className="cart-items">
                  {cartItems.map(item => (
                    <div key={item.id} className="cart-item">
                      <div className="cart-item-info">
                        <h4>{item.name}</h4>
                        <p>₩{item.price.toLocaleString()}</p>
                      </div>
                      <div className="cart-item-controls">
                        <button onClick={() => handleUpdateQuantity(item.id, -1)}>-</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => handleUpdateQuantity(item.id, 1)}>+</button>
                      </div>
                      <div className="cart-item-total">
                        ₩{(item.price * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="cart-summary">
                  <div className="summary-row">
                    <span>소계</span>
                    <span>₩{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="summary-row">
                    <span>부가세</span>
                    <span>₩{tax.toLocaleString()}</span>
                  </div>
                  <div className="summary-row total">
                    <span>합계</span>
                    <span>₩{total.toLocaleString()}</span>
                  </div>
                </div>

                <button className="order-btn" onClick={handleOrder}>
                  주문하기 (₩{total.toLocaleString()})
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
    </div>
    </div>
  )
}
