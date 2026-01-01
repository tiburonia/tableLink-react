import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as authApi from '@/shared/api/authApi'
import * as storeApi from '@/shared/api/storeApi'
import type { MenuItemInput, TableInput, HourInput } from '@/shared/api/storeApi'
import styles from './StoreRegistrationPage.module.css'

// 카테고리 옵션
const CATEGORIES = [
  { value: '한식', label: '한식', icon: '🍚' },
  { value: '일식', label: '일식', icon: '🍣' },
  { value: '중식', label: '중식', icon: '🥡' },
  { value: '양식', label: '양식', icon: '🍝' },
  { value: '카페', label: '카페', icon: '☕' },
  { value: '치킨', label: '치킨', icon: '🍗' },
  { value: '피자', label: '피자', icon: '🍕' },
  { value: '분식', label: '분식', icon: '🍜' },
  { value: '디저트', label: '디저트', icon: '🍰' },
  { value: '기타', label: '기타', icon: '🍽️' },
]

// 요일 옵션
const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

// 조리 스테이션 옵션
const COOK_STATIONS = [
  { value: 'KITCHEN', label: '주방' },
  { value: 'BAR', label: '바' },
  { value: 'GRILL', label: '그릴' },
  { value: 'DESSERT', label: '디저트' },
  { value: 'DRINK', label: '음료' },
]

interface StoreFormData {
  name: string
  category: string
  store_tel_number: string
  sido: string
  sigungu: string
  eupmyeondong: string
  road_address: string
  detail_address: string
  latitude: number | null
  longitude: number | null
  amenities: {
    wifi: boolean
    parking: boolean
    pet_friendly: boolean
    power_outlet: boolean
    smoking_area: boolean
  }
  menus: MenuItemInput[]
  tables: TableInput[]
  hours: HourInput[]
}

interface FormErrors {
  name?: string
  category?: string
  store_tel_number?: string
  road_address?: string
  coordinates?: string
  menus?: string
  tables?: string
  hours?: string
}

const getDefaultHours = (): HourInput[] => {
  return DAY_NAMES.map((_, index) => ({
    day_of_week: index,
    open_time: '09:00',
    close_time: '22:00',
    is_closed: false,
    is_24hours: false,
  }))
}

export function StoreRegistrationPage() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const totalSteps = 6

  const [formData, setFormData] = useState<StoreFormData>({
    name: '',
    category: '',
    store_tel_number: '',
    sido: '',
    sigungu: '',
    eupmyeondong: '',
    road_address: '',
    detail_address: '',
    latitude: null,
    longitude: null,
    amenities: {
      wifi: false,
      parking: false,
      pet_friendly: false,
      power_outlet: false,
      smoking_area: false,
    },
    menus: [],
    tables: [],
    hours: getDefaultHours(),
  })

  const [newMenu, setNewMenu] = useState<MenuItemInput>({
    name: '',
    description: '',
    price: 0,
    cook_station: 'KITCHEN',
  })

  const [newTable, setNewTable] = useState<TableInput>({
    table_name: '',
    capacity: 2,
  })

  const formatPhoneNumber = (value: string): string => {
    const numbers = value.replace(/[^0-9]/g, '')
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    if (numbers.length <= 10) return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
  }

  const formatPrice = (value: number): string => {
    return value.toLocaleString('ko-KR')
  }

  const validateStep1 = (): boolean => {
    const newErrors: FormErrors = {}
    if (!formData.name.trim()) {
      newErrors.name = '매장명을 입력해주세요'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = '매장명은 2자 이상이어야 합니다'
    }
    if (!formData.category) {
      newErrors.category = '카테고리를 선택해주세요'
    }
    if (!formData.store_tel_number) {
      newErrors.store_tel_number = '전화번호를 입력해주세요'
    } else if (formData.store_tel_number.replace(/-/g, '').length < 9) {
      newErrors.store_tel_number = '올바른 전화번호를 입력해주세요'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = (): boolean => {
    const newErrors: FormErrors = {}
    if (!formData.road_address.trim()) {
      newErrors.road_address = '주소를 입력해주세요'
    }
    if (!formData.latitude || !formData.longitude) {
      newErrors.coordinates = '주소 검색을 통해 좌표를 설정해주세요 (필수)'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep3 = (): boolean => true

  const validateStep4 = (): boolean => {
    const newErrors: FormErrors = {}
    if (formData.menus.length === 0) {
      newErrors.menus = '최소 1개 이상의 메뉴를 등록해주세요'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep5 = (): boolean => {
    const newErrors: FormErrors = {}
    if (formData.tables.length === 0) {
      newErrors.tables = '최소 1개 이상의 테이블을 등록해주세요'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep6 = (): boolean => true

  const handleNextStep = () => {
    const validators: Record<number, () => boolean> = {
      1: validateStep1,
      2: validateStep2,
      3: validateStep3,
      4: validateStep4,
      5: validateStep5,
      6: validateStep6,
    }
    if (validators[currentStep]?.()) {
      setCurrentStep(currentStep + 1)
      setErrors({})
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setErrors({})
    }
  }

  const handleAddressSearch = () => {
    const dummyAddress = {
      sido: '서울특별시',
      sigungu: '강남구',
      eupmyeondong: '역삼동',
      road_address: '서울특별시 강남구 테헤란로 123',
      latitude: 37.5012,
      longitude: 127.0396,
    }
    setFormData(prev => ({ ...prev, ...dummyAddress }))
    alert('주소 검색 기능은 추후 구현 예정입니다.\n임시 주소가 입력되었습니다.')
  }

  const toggleAmenity = (key: keyof typeof formData.amenities) => {
    setFormData(prev => ({
      ...prev,
      amenities: { ...prev.amenities, [key]: !prev.amenities[key] },
    }))
  }

  const handleAddMenu = () => {
    if (!newMenu.name.trim()) {
      alert('메뉴 이름을 입력해주세요')
      return
    }
    if (newMenu.price <= 0) {
      alert('가격을 입력해주세요')
      return
    }
    setFormData(prev => ({ ...prev, menus: [...prev.menus, { ...newMenu }] }))
    setNewMenu({ name: '', description: '', price: 0, cook_station: 'KITCHEN' })
  }

  const handleRemoveMenu = (index: number) => {
    setFormData(prev => ({ ...prev, menus: prev.menus.filter((_, i) => i !== index) }))
  }

  const handleAddTable = () => {
    if (!newTable.table_name.trim()) {
      alert('테이블 이름을 입력해주세요')
      return
    }
    if (newTable.capacity <= 0) {
      alert('수용 인원을 입력해주세요')
      return
    }
    setFormData(prev => ({ ...prev, tables: [...prev.tables, { ...newTable }] }))
    setNewTable({ table_name: '', capacity: 2 })
  }

  const handleRemoveTable = (index: number) => {
    setFormData(prev => ({ ...prev, tables: prev.tables.filter((_, i) => i !== index) }))
  }

  const updateHour = (dayIndex: number, field: keyof HourInput, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      hours: prev.hours.map((hour, i) => (i === dayIndex ? { ...hour, [field]: value } : hour)),
    }))
  }

  const toggleClosed = (dayIndex: number) => {
    setFormData(prev => ({
      ...prev,
      hours: prev.hours.map((hour, i) => (i === dayIndex ? { ...hour, is_closed: !hour.is_closed } : hour)),
    }))
  }

  const toggle24Hours = (dayIndex: number) => {
    setFormData(prev => ({
      ...prev,
      hours: prev.hours.map((hour, i) => (i === dayIndex ? { ...hour, is_24hours: !hour.is_24hours } : hour)),
    }))
  }

  const handleSubmit = async () => {
    if (!validateStep6()) return
    setIsSubmitting(true)

    try {
      console.log('📤 매장 등록 데이터:', formData)

      const member = authApi.getMember()
      if (!member || !member.id) {
        alert('로그인 정보가 없습니다. 다시 로그인해주세요.')
        authApi.logout()
        window.location.reload()
        return
      }

      const response = await storeApi.createStore({
        memberId: member.id,
        name: formData.name,
        category: formData.category,
        store_tel_number: formData.store_tel_number.replace(/-/g, ''),
        sido: formData.sido,
        sigungu: formData.sigungu,
        eupmyeondong: formData.eupmyeondong,
        road_address: formData.road_address,
        detail_address: formData.detail_address,
        latitude: formData.latitude,
        longitude: formData.longitude,
        amenities: formData.amenities,
        menuItems: formData.menus,
        tables: formData.tables,
        hours: formData.hours,
      })

      if (!response.success) {
        alert(response.error || '매장 등록에 실패했습니다.')
        return
      }

      const newStore = {
        id: response.data?.store.id,
        ...formData,
        created_at: response.data?.store.created_at,
      }

      const existingStores = JSON.parse(localStorage.getItem('tlm_stores') || '[]')
      existingStores.push(newStore)
      localStorage.setItem('tlm_stores', JSON.stringify(existingStores))
      localStorage.setItem('tlm_current_store', JSON.stringify(newStore))

      console.log('✅ 매장 등록 완료:', newStore)
      navigate('/store')
    } catch (error) {
      console.error('❌ 매장 등록 실패:', error)
      alert('매장 등록에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogout = () => {
    authApi.logout()
    window.location.reload()
  }

  const stepTitles: Record<number, { title: string; subtitle: string }> = {
    1: { title: '기본 정보', subtitle: '매장의 기본 정보를 입력해주세요' },
    2: { title: '주소 정보', subtitle: '매장의 위치 정보를 입력해주세요' },
    3: { title: '편의시설', subtitle: '제공하는 편의시설을 선택해주세요 (선택)' },
    4: { title: '메뉴 등록', subtitle: '판매할 메뉴를 등록해주세요 (필수)' },
    5: { title: '테이블 등록', subtitle: '매장 테이블을 등록해주세요 (필수)' },
    6: { title: '영업시간 설정', subtitle: '요일별 영업시간을 설정해주세요' },
  }

  return (
    <div className="mobile-app">
      <div className="mobile-content">
        <div className={styles.page}>
          {/* 헤더 */}
          <div className={styles.header}>
            <button className={styles.backBtn} onClick={handleLogout}>
              ← 로그아웃
            </button>
            <div className={styles.stepIndicator}>
              {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step, index) => (
                <span key={step}>
                  <span className={currentStep >= step ? styles.active : ''}>{step}</span>
                  {index < totalSteps - 1 && <span className={styles.line}></span>}
                </span>
              ))}
            </div>
          </div>

          {/* 콘텐츠 */}
          <div className={styles.content}>
            {/* Step 1: 기본 정보 */}
            {currentStep === 1 && (
              <div className={styles.stepContent}>
                <h1 className={styles.title}>{stepTitles[1].title}</h1>
                <p className={styles.subtitle}>{stepTitles[1].subtitle}</p>

                <div className={styles.formGroup}>
                  <label>매장명 *</label>
                  <input
                    type="text"
                    placeholder="매장명을 입력하세요"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className={errors.name ? styles.inputError : ''}
                  />
                  {errors.name && <span className={styles.errorText}>{errors.name}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label>카테고리 *</label>
                  <div className={styles.categoryGrid}>
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        className={`${styles.categoryBtn} ${formData.category === cat.value ? styles.selected : ''}`}
                        onClick={() => setFormData(prev => ({ ...prev, category: cat.value }))}
                      >
                        <span className={styles.categoryIcon}>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </button>
                    ))}
                  </div>
                  {errors.category && <span className={styles.errorText}>{errors.category}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label>전화번호 *</label>
                  <input
                    type="tel"
                    placeholder="02-1234-5678"
                    value={formData.store_tel_number}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      store_tel_number: formatPhoneNumber(e.target.value)
                    }))}
                    className={errors.store_tel_number ? styles.inputError : ''}
                  />
                  {errors.store_tel_number && <span className={styles.errorText}>{errors.store_tel_number}</span>}
                </div>
              </div>
            )}

            {/* Step 2: 주소 정보 */}
            {currentStep === 2 && (
              <div className={styles.stepContent}>
                <h1 className={styles.title}>{stepTitles[2].title}</h1>
                <p className={styles.subtitle}>{stepTitles[2].subtitle}</p>

                <div className={styles.formGroup}>
                  <label>주소 검색 *</label>
                  <div className={styles.addressSearch}>
                    <input
                      type="text"
                      placeholder="주소를 검색하세요"
                      value={formData.road_address}
                      onChange={(e) => setFormData(prev => ({ ...prev, road_address: e.target.value }))}
                      className={errors.road_address ? styles.inputError : ''}
                      readOnly
                    />
                    <button type="button" onClick={handleAddressSearch}>
                      🔍 검색
                    </button>
                  </div>
                  {errors.road_address && <span className={styles.errorText}>{errors.road_address}</span>}
                  {errors.coordinates && <span className={styles.errorText}>{errors.coordinates}</span>}
                </div>

                {formData.road_address && (
                  <>
                    <div className={styles.addressInfo}>
                      <div className={styles.addressItem}>
                        <span className={styles.addressLabel}>시/도</span>
                        <span className={styles.addressValue}>{formData.sido}</span>
                      </div>
                      <div className={styles.addressItem}>
                        <span className={styles.addressLabel}>시/군/구</span>
                        <span className={styles.addressValue}>{formData.sigungu}</span>
                      </div>
                      <div className={styles.addressItem}>
                        <span className={styles.addressLabel}>읍/면/동</span>
                        <span className={styles.addressValue}>{formData.eupmyeondong}</span>
                      </div>
                      <div className={styles.addressItem}>
                        <span className={styles.addressLabel}>좌표</span>
                        <span className={styles.addressValue}>
                          {formData.latitude}, {formData.longitude}
                        </span>
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label>상세 주소</label>
                      <input
                        type="text"
                        placeholder="상세 주소를 입력하세요 (선택)"
                        value={formData.detail_address}
                        onChange={(e) => setFormData(prev => ({ ...prev, detail_address: e.target.value }))}
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 3: 편의시설 */}
            {currentStep === 3 && (
              <div className={styles.stepContent}>
                <h1 className={styles.title}>{stepTitles[3].title}</h1>
                <p className={styles.subtitle}>{stepTitles[3].subtitle}</p>

                <div className={styles.amenitiesGrid}>
                  <button
                    type="button"
                    className={`${styles.amenityBtn} ${formData.amenities.wifi ? styles.active : ''}`}
                    onClick={() => toggleAmenity('wifi')}
                  >
                    <span className={styles.amenityIcon}>📶</span>
                    <span>Wi-Fi</span>
                  </button>

                  <button
                    type="button"
                    className={`${styles.amenityBtn} ${formData.amenities.parking ? styles.active : ''}`}
                    onClick={() => toggleAmenity('parking')}
                  >
                    <span className={styles.amenityIcon}>🅿️</span>
                    <span>주차장</span>
                  </button>

                  <button
                    type="button"
                    className={`${styles.amenityBtn} ${formData.amenities.pet_friendly ? styles.active : ''}`}
                    onClick={() => toggleAmenity('pet_friendly')}
                  >
                    <span className={styles.amenityIcon}>🐕</span>
                    <span>반려동물</span>
                  </button>

                  <button
                    type="button"
                    className={`${styles.amenityBtn} ${formData.amenities.power_outlet ? styles.active : ''}`}
                    onClick={() => toggleAmenity('power_outlet')}
                  >
                    <span className={styles.amenityIcon}>🔌</span>
                    <span>콘센트</span>
                  </button>

                  <button
                    type="button"
                    className={`${styles.amenityBtn} ${formData.amenities.smoking_area ? styles.active : ''}`}
                    onClick={() => toggleAmenity('smoking_area')}
                  >
                    <span className={styles.amenityIcon}>🚬</span>
                    <span>흡연구역</span>
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: 메뉴 등록 */}
            {currentStep === 4 && (
              <div className={styles.stepContent}>
                <h1 className={styles.title}>{stepTitles[4].title}</h1>
                <p className={styles.subtitle}>{stepTitles[4].subtitle}</p>

                <div className={styles.inputCard}>
                  <div className={styles.inputRow}>
                    <div className={styles.inputField}>
                      <label>메뉴명 *</label>
                      <input
                        type="text"
                        placeholder="메뉴 이름"
                        value={newMenu.name}
                        onChange={(e) => setNewMenu(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div className={styles.inputField}>
                      <label>가격 *</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={newMenu.price || ''}
                        onChange={(e) => setNewMenu(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>
                  <div className={styles.inputRow}>
                    <div className={styles.inputField} style={{ flex: 2 }}>
                      <label>설명 (선택)</label>
                      <input
                        type="text"
                        placeholder="메뉴 설명"
                        value={newMenu.description}
                        onChange={(e) => setNewMenu(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                    <div className={styles.inputField}>
                      <label>조리대</label>
                      <select
                        value={newMenu.cook_station}
                        onChange={(e) => setNewMenu(prev => ({ ...prev, cook_station: e.target.value }))}
                      >
                        {COOK_STATIONS.map(station => (
                          <option key={station.value} value={station.value}>
                            {station.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button type="button" className={styles.addBtn} onClick={handleAddMenu}>
                    + 메뉴 추가
                  </button>
                </div>

                {formData.menus.length > 0 && (
                  <div className={styles.itemList}>
                    <h3>등록된 메뉴 ({formData.menus.length}개)</h3>
                    {formData.menus.map((menu, index) => (
                      <div key={index} className={styles.itemCard}>
                        <div className={styles.itemInfo}>
                          <span className={styles.itemName}>{menu.name}</span>
                          <span className={styles.itemPrice}>{formatPrice(menu.price)}원</span>
                        </div>
                        {menu.description && <span className={styles.itemDesc}>{menu.description}</span>}
                        <span className={styles.itemStation}>
                          {COOK_STATIONS.find(s => s.value === menu.cook_station)?.label || menu.cook_station}
                        </span>
                        <button type="button" className={styles.removeBtn} onClick={() => handleRemoveMenu(index)}>
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {errors.menus && <span className={styles.errorText}>{errors.menus}</span>}
              </div>
            )}

            {/* Step 5: 테이블 등록 */}
            {currentStep === 5 && (
              <div className={styles.stepContent}>
                <h1 className={styles.title}>{stepTitles[5].title}</h1>
                <p className={styles.subtitle}>{stepTitles[5].subtitle}</p>

                <div className={styles.inputCard}>
                  <div className={styles.inputRow}>
                    <div className={styles.inputField} style={{ flex: 2 }}>
                      <label>테이블명 *</label>
                      <input
                        type="text"
                        placeholder="예: 테이블 A, 창가석 1"
                        value={newTable.table_name}
                        onChange={(e) => setNewTable(prev => ({ ...prev, table_name: e.target.value }))}
                      />
                    </div>
                    <div className={styles.inputField}>
                      <label>수용 인원 *</label>
                      <input
                        type="number"
                        placeholder="2"
                        min="1"
                        max="20"
                        value={newTable.capacity}
                        onChange={(e) => setNewTable(prev => ({ ...prev, capacity: parseInt(e.target.value) || 2 }))}
                      />
                    </div>
                  </div>
                  <button type="button" className={styles.addBtn} onClick={handleAddTable}>
                    + 테이블 추가
                  </button>
                </div>

                <div className={styles.quickActions}>
                  <p>빠른 추가</p>
                  <button
                    type="button"
                    onClick={() => {
                      const count = formData.tables.length
                      const newTables = Array.from({ length: 5 }, (_, i) => ({
                        table_name: `테이블 ${count + i + 1}`,
                        capacity: 4,
                      }))
                      setFormData(prev => ({ ...prev, tables: [...prev.tables, ...newTables] }))
                    }}
                  >
                    4인석 5개 추가
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const count = formData.tables.length
                      const newTables = Array.from({ length: 3 }, (_, i) => ({
                        table_name: `테이블 ${count + i + 1}`,
                        capacity: 2,
                      }))
                      setFormData(prev => ({ ...prev, tables: [...prev.tables, ...newTables] }))
                    }}
                  >
                    2인석 3개 추가
                  </button>
                </div>

                {formData.tables.length > 0 && (
                  <div className={styles.itemList}>
                    <h3>등록된 테이블 ({formData.tables.length}개)</h3>
                    <div className={styles.tableGrid}>
                      {formData.tables.map((table, index) => (
                        <div key={index} className={styles.tableCard}>
                          <span className={styles.tableName}>{table.table_name}</span>
                          <span className={styles.tableCapacity}>{table.capacity}인석</span>
                          <button type="button" className={styles.removeBtn} onClick={() => handleRemoveTable(index)}>
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {errors.tables && <span className={styles.errorText}>{errors.tables}</span>}
              </div>
            )}

            {/* Step 6: 영업시간 설정 */}
            {currentStep === 6 && (
              <div className={styles.stepContent}>
                <h1 className={styles.title}>{stepTitles[6].title}</h1>
                <p className={styles.subtitle}>{stepTitles[6].subtitle}</p>

                <div className={styles.hoursContainer}>
                  {formData.hours.map((hour, index) => (
                    <div key={index} className={`${styles.hourRow} ${hour.is_closed ? styles.closed : ''}`}>
                      <div className={styles.dayName}>
                        <span>{DAY_NAMES[hour.day_of_week]}</span>
                      </div>

                      {hour.is_closed ? (
                        <div className={styles.closedLabel}>휴무일</div>
                      ) : hour.is_24hours ? (
                        <div className={styles.hour24Label}>24시간 영업</div>
                      ) : (
                        <div className={styles.timeInputs}>
                          <input
                            type="time"
                            value={hour.open_time}
                            onChange={(e) => updateHour(index, 'open_time', e.target.value)}
                          />
                          <span>~</span>
                          <input
                            type="time"
                            value={hour.close_time}
                            onChange={(e) => updateHour(index, 'close_time', e.target.value)}
                          />
                        </div>
                      )}

                      <div className={styles.hourActions}>
                        <button
                          type="button"
                          className={`${styles.hourToggle} ${hour.is_24hours ? styles.active : ''}`}
                          onClick={() => toggle24Hours(index)}
                          disabled={hour.is_closed}
                        >
                          24h
                        </button>
                        <button
                          type="button"
                          className={`${styles.hourToggle} ${hour.is_closed ? styles.active : ''}`}
                          onClick={() => toggleClosed(index)}
                        >
                          휴무
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={styles.summary}>
                  <h3>📋 입력 정보 확인</h3>
                  <div className={styles.summaryItem}>
                    <span>매장명</span>
                    <span>{formData.name}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span>카테고리</span>
                    <span>{formData.category}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span>전화번호</span>
                    <span>{formData.store_tel_number}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span>주소</span>
                    <span>{formData.road_address}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span>메뉴</span>
                    <span>{formData.menus.length}개</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span>테이블</span>
                    <span>{formData.tables.length}개</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 하단 버튼 */}
          <div className={styles.footer}>
            {currentStep > 1 && (
              <button type="button" className={styles.prevBtn} onClick={handlePrevStep}>
                이전
              </button>
            )}

            {currentStep < totalSteps ? (
              <button type="button" className={styles.nextBtn} onClick={handleNextStep}>
                다음
              </button>
            ) : (
              <button
                type="button"
                className={styles.submitBtn}
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? '등록 중...' : '매장 등록 완료'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
