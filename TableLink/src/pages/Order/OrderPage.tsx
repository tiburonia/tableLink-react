/**
 * OrderPage - 주문 페이지
 * 
 * FSD 원칙: 페이지는 조립만 한다
 * - useState ❌
 * - useEffect ❌
 * - API 호출 ❌
 */

import { useParams, useSearchParams } from 'react-router-dom'
import { useOrderPage } from '@/features/order-create'
import styles from './OrderPage.module.css'

export const OrderPage = () => {
  const { storeId } = useParams<{ storeId: string }>()
  const [searchParams] = useSearchParams()
  const tableNumber = searchParams.get('table')

  // Feature Hook에서 모든 상태와 로직을 가져옴
  const {
    store,
    filteredMenu,
    cartItems,
    categories,
    selectedCategory,
    showCart,
    loading,
    totals,
    addToCart,
    updateQuantity,
    changeCategory,
    toggleCart,
    submitOrder,
    goBack,
  } = useOrderPage({ storeId, tableNumber })

  const { subtotal, tax, total } = totals

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
        <button className="back-btn" onClick={goBack}>
          ←
        </button>
        <div className="header-info">
          <h1>{store.name}</h1>
          <p>테이블 {tableNumber ? `${tableNumber}번` : '미설정'}</p>
        </div>
        <button 
          className="cart-btn" 
          onClick={() => toggleCart(true)}
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
            onClick={() => changeCategory(cat || 'all')}
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
              onClick={() => addToCart(menu)}
            >
              +
            </button>
          </div>
        ))}
      </div>

      {/* 장바구니 모달 */}
      {showCart && (
        <div className="cart-modal">
          <div className="cart-overlay" onClick={() => toggleCart(false)} />
          <div className="cart-content">
            <div className="cart-header">
              <h2>장바구니</h2>
              <button onClick={() => toggleCart(false)}>✕</button>
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
                        <button onClick={() => updateQuantity(item.id, -1)}>-</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)}>+</button>
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

                <button className="order-btn" onClick={submitOrder}>
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
