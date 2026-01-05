import { useEffect, useRef } from 'react'
import { useMenuSelection, CategoryTabs, MenuGrid } from '@/features/menu-selection'
import { useCart, CartPanel } from '@/features/cart'
import { useOrderManagement, OrderList } from '@/features/order-management'
import { usePosStore } from '@/shared/stores'
import type { MenuItem } from '@/entities/menu'
import styles from './OrderScreen.module.css'

interface OrderScreenProps {
  storeId: number
  tableNumber: number
  onOrderComplete?: () => void
}

export function OrderScreen({
  storeId,
  tableNumber,
  onOrderComplete,
}: OrderScreenProps) {
  const orderTab = usePosStore((state) => state.orderTab)

  const {
    categories,
    selectedCategory,
    fetchCategories,
    fetchMenuItems,
    handleCategorySelect,
    getMenuItemsByCategory,
  } = useMenuSelection()

  const { handleAddItem, cart } = useCart()

  const {
    currentOrders,
    orderLoading,
    fetchTableOrders,
    createOrder,
    updateOrderStatus,
    cancelOrder,
  } = useOrderManagement()

  const hasFetched = useRef(false)

  useEffect(() => {
    // 초기 로딩 시 한 번만 실행
    if (!hasFetched.current) {
      hasFetched.current = true
      fetchCategories(storeId)
      fetchMenuItems(storeId)
      fetchTableOrders(storeId, tableNumber)
    }
  }, [storeId, tableNumber])

  const handleMenuItemClick = (item: MenuItem) => {
    handleAddItem(item)
  }

  const handleOrder = async () => {
    const result = await createOrder(storeId, tableNumber, cart)
    if (result) {
      onOrderComplete?.()
    }
  }

  const filteredOrders = currentOrders.filter((order) => {
    if (orderTab === 'all') return true
    if (orderTab === 'tll') return order.source === 'TLL'
    if (orderTab === 'pos') return order.source === 'POS'
    return true
  })

  const displayMenuItems = getMenuItemsByCategory(selectedCategory)

  return (
    <div className={styles.screen}>
      <div className={styles.main}>
        <div className={styles.menuSection}>
          <CategoryTabs
            categories={categories}
            selectedCategory={selectedCategory}
            onSelect={handleCategorySelect}
          />
          <div className={styles.menuContent}>
            <MenuGrid
              items={displayMenuItems}
              onItemClick={handleMenuItemClick}
              columns={4}
            />
          </div>
        </div>

        <div className={styles.orderSection}>
          <div className={styles.orderHeader}>
            <h3>주문 내역</h3>
            <span className={styles.orderCount}>{filteredOrders.length}건</span>
          </div>
          <OrderList
            orders={filteredOrders}
            onStatusChange={updateOrderStatus}
            onCancel={cancelOrder}
          />
        </div>
      </div>

      <div className={styles.sidebar}>
        <CartPanel
          onOrder={handleOrder}
          disabled={orderLoading}
        />
      </div>
    </div>
  )
}
