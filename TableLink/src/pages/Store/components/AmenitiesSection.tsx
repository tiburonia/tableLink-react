import './AmenitiesSection.css'

interface AmenitiesSectionProps {
  amenities?: {
    wifi?: boolean
    parking?: boolean
    pet_friendly?: boolean
    power_outlet?: boolean
    smoking_area?: boolean
  }
}

interface AmenityConfig {
  icon: string
  name: string
}

export const AmenitiesSection = ({ amenities }: AmenitiesSectionProps) => {
  // 편의시설 아이콘 매핑
  const amenityConfig: Record<string, AmenityConfig> = {
    wifi: { 
      icon: '🌐',
      name: '무선 인터넷'
    },
    parking: { 
      icon: '🅿️',
      name: '주차 이용 가능'
    },
    pet_friendly: { 
      icon: '🐾',
      name: '반려동물 동반 가능'
    },
    power_outlet: { 
      icon: '🔌',
      name: '콘센트 구비'
    },
    smoking_area: { 
      icon: '🚬',
      name: '흡연구역'
    }
  }

  // available이 true인 항목만 필터링
  const availableAmenities = Object.keys(amenityConfig)
    .filter(key => amenities?.[key as keyof typeof amenities] === true)
    .map(key => amenityConfig[key])

  // 편의시설이 없으면 섹션 숨김
  if (availableAmenities.length === 0) {
    return null
  }

  return (
    <section className="store-section amenities-section">
      <div className="section-header">
        <h3 className="section-title">
          <span className="section-icon">🏪</span>
          편의시설
        </h3>
      </div>
      <div className="amenities-grid">
        {availableAmenities.map((amenity, index) => (
          <div key={index} className="amenity-card">
            <div className="amenity-icon">{amenity.icon}</div>
            <div className="amenity-name">{amenity.name}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
