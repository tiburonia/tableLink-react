import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as storeApi from '@/shared/api/storeApi'
import type { MenuItem } from '@/shared/api/storeApi'
import styles from './MenuManagementPage.module.css'

export function MenuManagementPage() {
  const navigate = useNavigate()
  const { storeId: paramStoreId } = useParams()
  const [menus, setMenus] = useState<MenuItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  // 폼 상태
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    cook_station: 'kitchen'
  })

  const storeId = paramStoreId 
    ? parseInt(paramStoreId) 
    : parseInt(localStorage.getItem('tlm_current_store_id') || '0')

  // 메뉴 목록 로드
  useEffect(() => {
    const loadMenus = async () => {
      if (!storeId) {
        setError('매장 정보를 찾을 수 없습니다')
        setIsLoading(false)
        return
      }

      try {
        console.log('🍽️ 메뉴 목록 로드:', storeId)
        const response = await storeApi.getMenuItems(storeId)
        
        if (response.success && response.menus) {
          setMenus(response.menus)
          console.log(`✅ 메뉴 ${response.count}개 로드 완료`)
        } else {
          setError(response.error || '메뉴 목록을 불러올 수 없습니다')
        }
      } catch (err) {
        console.error('메뉴 로드 실패:', err)
        setError('메뉴 목록을 불러오는 중 오류가 발생했습니다')
      } finally {
        setIsLoading(false)
      }
    }

    loadMenus()
  }, [storeId])

  // 새 메뉴 추가 모달 열기
  const handleAddMenu = () => {
    setEditingMenu(null)
    setFormData({
      name: '',
      description: '',
      price: 0,
      cook_station: 'kitchen'
    })
    setIsModalOpen(true)
  }

  // 메뉴 수정 모달 열기
  const handleEditMenu = (menu: MenuItem) => {
    setEditingMenu(menu)
    setFormData({
      name: menu.name,
      description: menu.description || '',
      price: menu.price,
      cook_station: menu.cook_station || 'kitchen'
    })
    setIsModalOpen(true)
  }

  // 메뉴 저장 (추가 또는 수정)
  const handleSaveMenu = async () => {
    if (!formData.name.trim()) {
      alert('메뉴명을 입력해주세요')
      return
    }
    if (formData.price <= 0) {
      alert('가격을 입력해주세요')
      return
    }

    setIsSaving(true)

    try {
      if (editingMenu) {
        // 수정
        console.log('✏️ 메뉴 수정:', editingMenu.id)
        const response = await storeApi.updateMenuItem(storeId, editingMenu.id, formData)
        
        if (response.success) {
          setMenus(prev => prev.map(m => 
            m.id === editingMenu.id 
              ? { ...m, ...formData } 
              : m
          ))
          setIsModalOpen(false)
          alert('메뉴가 수정되었습니다')
        } else {
          alert(response.error || '메뉴 수정에 실패했습니다')
        }
      } else {
        // 추가
        console.log('➕ 메뉴 추가')
        const response = await storeApi.addMenuItem(storeId, formData)
        
        if (response.success && response.data) {
          const newMenu = response.data as MenuItem
          setMenus(prev => [...prev, newMenu])
          setIsModalOpen(false)
          alert('메뉴가 추가되었습니다')
        } else {
          alert(response.error || '메뉴 추가에 실패했습니다')
        }
      }
    } catch (err) {
      console.error('메뉴 저장 실패:', err)
      alert('메뉴 저장 중 오류가 발생했습니다')
    } finally {
      setIsSaving(false)
    }
  }

  // 메뉴 삭제
  const handleDeleteMenu = async (menu: MenuItem) => {
    if (!confirm(`"${menu.name}" 메뉴를 삭제하시겠습니까?`)) {
      return
    }

    try {
      console.log('🗑️ 메뉴 삭제:', menu.id)
      const response = await storeApi.deleteMenuItem(storeId, menu.id)
      
      if (response.success) {
        setMenus(prev => prev.filter(m => m.id !== menu.id))
        alert('메뉴가 삭제되었습니다')
      } else {
        alert(response.error || '메뉴 삭제에 실패했습니다')
      }
    } catch (err) {
      console.error('메뉴 삭제 실패:', err)
      alert('메뉴 삭제 중 오류가 발생했습니다')
    }
  }

  // 가격 포맷팅
  const formatPrice = (price: number) => {
    return price.toLocaleString() + '원'
  }

  if (isLoading) {
    return (
      <div className="mobile-app">
        <div className="mobile-content">
          <div className={styles.loading}>
            <span>🍽️</span>
            <p>메뉴 로딩 중...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mobile-app">
        <div className="mobile-content">
          <div className={styles.error}>
            <span>❌</span>
            <p>{error}</p>
            <button onClick={() => navigate(-1)}>뒤로가기</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mobile-app">
      <div className="mobile-content">
        <div className={styles.page}>
          {/* 헤더 */}
          <header className={styles.header}>
            <button className={styles.backBtn} onClick={() => navigate(-1)}>
              ← 뒤로
            </button>
            <h1>메뉴 관리</h1>
            <button className={styles.addBtn} onClick={handleAddMenu}>
              + 추가
            </button>
          </header>

          {/* 메뉴 통계 */}
          <div className={styles.stats}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{menus.length}</span>
              <span className={styles.statLabel}>전체 메뉴</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>
                {menus.filter(m => m.cook_station === 'kitchen').length}
              </span>
              <span className={styles.statLabel}>주방</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>
                {menus.filter(m => m.cook_station === 'bar').length}
              </span>
              <span className={styles.statLabel}>바</span>
            </div>
          </div>

          {/* 메뉴 목록 */}
          <main className={styles.menuList}>
            {menus.length === 0 ? (
              <div className={styles.emptyState}>
                <span>🍽️</span>
                <p>등록된 메뉴가 없습니다</p>
                <button onClick={handleAddMenu}>첫 메뉴 추가하기</button>
              </div>
            ) : (
              menus.map(menu => (
                <div key={menu.id} className={styles.menuCard}>
                  <div className={styles.menuInfo}>
                    <div className={styles.menuHeader}>
                      <h3 className={styles.menuName}>{menu.name}</h3>
                      <span className={`${styles.cookStation} ${styles[menu.cook_station || 'kitchen']}`}>
                        {menu.cook_station === 'bar' ? '🍸 바' : '👨‍🍳 주방'}
                      </span>
                    </div>
                    {menu.description && (
                      <p className={styles.menuDesc}>{menu.description}</p>
                    )}
                    <span className={styles.menuPrice}>{formatPrice(menu.price)}</span>
                  </div>
                  <div className={styles.menuActions}>
                    <button 
                      className={styles.editBtn}
                      onClick={() => handleEditMenu(menu)}
                    >
                      ✏️ 수정
                    </button>
                    <button 
                      className={styles.deleteBtn}
                      onClick={() => handleDeleteMenu(menu)}
                    >
                      🗑️ 삭제
                    </button>
                  </div>
                </div>
              ))
            )}
          </main>

          {/* 메뉴 추가/수정 모달 */}
          {isModalOpen && (
            <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
              <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                  <h2>{editingMenu ? '메뉴 수정' : '새 메뉴 추가'}</h2>
                  <button 
                    className={styles.closeBtn}
                    onClick={() => setIsModalOpen(false)}
                  >
                    ✕
                  </button>
                </div>

                <div className={styles.modalBody}>
                  <div className={styles.formGroup}>
                    <label>메뉴명 *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="메뉴 이름을 입력하세요"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>설명</label>
                    <textarea
                      value={formData.description}
                      onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="메뉴 설명을 입력하세요"
                      rows={3}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>가격 *</label>
                    <input
                      type="number"
                      value={formData.price || ''}
                      onChange={e => setFormData(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                      placeholder="가격을 입력하세요"
                      min="0"
                      step="100"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>조리 스테이션</label>
                    <div className={styles.stationButtons}>
                      <button
                        type="button"
                        className={`${styles.stationBtn} ${formData.cook_station === 'kitchen' ? styles.active : ''}`}
                        onClick={() => setFormData(prev => ({ ...prev, cook_station: 'kitchen' }))}
                      >
                        👨‍🍳 주방
                      </button>
                      <button
                        type="button"
                        className={`${styles.stationBtn} ${formData.cook_station === 'bar' ? styles.active : ''}`}
                        onClick={() => setFormData(prev => ({ ...prev, cook_station: 'bar' }))}
                      >
                        🍸 바
                      </button>
                    </div>
                  </div>
                </div>

                <div className={styles.modalFooter}>
                  <button 
                    className={styles.cancelBtn}
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSaving}
                  >
                    취소
                  </button>
                  <button 
                    className={styles.saveBtn}
                    onClick={handleSaveMenu}
                    disabled={isSaving}
                  >
                    {isSaving ? '저장 중...' : (editingMenu ? '수정' : '추가')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
