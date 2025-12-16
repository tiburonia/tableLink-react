interface StoreBasicInfoProps {
  phone?: string | null
  address?: string | null
  isOpen?: boolean
}

export const StoreBasicInfo = ({ phone, address, isOpen }: StoreBasicInfoProps) => {
  return (
    <section className="store-section">
      <h3 className="section-title">기본 정보</h3>
      <div className="info-list">
        {phone && (
          <div className="info-item">
            <span className="info-icon">📞</span>
            <div className="info-content">
              <span className="info-label">전화번호</span>
              <a href={`tel:${phone}`} className="info-value link">
                {phone}
              </a>
            </div>
          </div>
        )}
        
        <div className="info-item">
          <span className="info-icon">📍</span>
          <div className="info-content">
            <span className="info-label">주소</span>
            <span className="info-value">
              {address || '서울특별시 강남구 테헤란로 123'}
            </span>
          </div>
        </div>

        <div className="info-item">
          <span className="info-icon">🕐</span>
          <div className="info-content">
            <span className="info-label">영업 상태</span>
            <span className={`info-value ${isOpen ? 'open' : 'closed'}`}>
              {isOpen ? '영업 중' : '영업 종료'}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
