
import React, { useState } from 'react';

export default function HomeTab({ store }) {
  const [selectedDay, setSelectedDay] = useState('화');

  // 더미 대기시간 데이터 (실제로는 API에서 가져와야 함)
  const weeklyData = {
    "월": [{ hour: "12시", value: 40 }, { hour: "13시", value: 30 }, { hour: "14시", value: 20 }, { hour: "15시", value: 10 }],
    "화": [{ hour: "12시", value: 59 }, { hour: "13시", value: 39 }, { hour: "14시", value: 31 }, { hour: "15시", value: 22 }],
    "수": [{ hour: "12시", value: 20 }, { hour: "13시", value: 10 }, { hour: "14시", value: 15 }, { hour: "15시", value: 5 }],
    "목": [{ hour: "12시", value: 25 }, { hour: "13시", value: 30 }, { hour: "14시", value: 18 }, { hour: "15시", value: 8 }],
    "금": [{ hour: "12시", value: 50 }, { hour: "13시", value: 45 }, { hour: "14시", value: 40 }, { hour: "15시", value: 35 }],
    "토": [{ hour: "12시", value: 70 }, { hour: "13시", value: 60 }, { hour: "14시", value: 50 }, { hour: "15시", value: 40 }],
    "일": [{ hour: "12시", value: 10 }, { hour: "13시", value: 15 }, { hour: "14시", value: 20 }, { hour: "15시", value: 5 }],
  };

  const amenitiesConfig = {
    wifi: { icon: '📶', name: 'WiFi', color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    parking: { icon: '🅿️', name: '주차', color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    pet_friendly: { icon: '🐾', name: '반려동물', color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
    power_outlet: { icon: '🔌', name: '콘센트', color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
    smoking_area: { icon: '🚬', name: '흡연구역', color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  };

  const availableAmenities = Object.keys(amenitiesConfig)
    .filter(key => store.amenities?.[key] === true)
    .map(key => ({ ...amenitiesConfig[key], key }));

  const maxValue = Math.max(...weeklyData[selectedDay].map(d => d.value));

  return (
    <div className="home-tab">
      {/* 대기시간 섹션 */}
      <section className="waiting-section">
        <div className="section-header">
          <h3>⏰ 요일별 대기시간</h3>
          <span className="info-badge">실시간 업데이트</span>
        </div>

        <div className="day-selector">
          {Object.keys(weeklyData).map((day) => (
            <button
              key={day}
              className={`day-btn ${selectedDay === day ? 'active' : ''}`}
              onClick={() => setSelectedDay(day)}
            >
              {day}
            </button>
          ))}
        </div>

        <div className="waiting-chart">
          {weeklyData[selectedDay].map((data, index) => (
            <div key={index} className="bar-item">
              <div className="bar-value">{data.value}분</div>
              <div 
                className="bar" 
                style={{ height: `${(data.value / maxValue) * 120}px` }}
              />
              <div className="bar-label">{data.hour}</div>
            </div>
          ))}
        </div>

        <div className="waiting-notice">
          <span>💡</span>
          <span>시간대별 평균 대기시간입니다</span>
        </div>
      </section>

      {/* 편의시설 섹션 */}
      {availableAmenities.length > 0 && (
        <section className="facilities-section">
          <div className="section-header">
            <h3>🏪 편의시설</h3>
            <span className="count-badge">{availableAmenities.length}개</span>
          </div>
          <div className="facilities-grid">
            {availableAmenities.map((amenity) => (
              <div key={amenity.key} className="facility-card">
                <div className="facility-icon" style={{ background: amenity.color }}>
                  {amenity.icon}
                </div>
                <span className="facility-name">{amenity.name}</span>
                <div className="facility-check">✓</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 메뉴 미리보기 */}
      {store.menu && store.menu.length > 0 && (
        <section className="menu-preview-section">
          <div className="section-header">
            <h3>🍽️ 메뉴</h3>
          </div>
          <div className="menu-preview-grid">
            {store.menu.slice(0, 4).map((item) => (
              <div key={item.id} className="menu-preview-card">
                <h4>{item.name}</h4>
                <p className="menu-price">{item.price.toLocaleString()}원</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
