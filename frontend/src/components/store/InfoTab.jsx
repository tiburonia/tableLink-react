
import React from 'react';

export default function InfoTab({ store }) {
  return (
    <div className="info-tab">
      <section className="info-section">
        <h3>📍 위치</h3>
        <p>{store.address}</p>
      </section>

      <section className="info-section">
        <h3>📞 연락처</h3>
        <p>{store.phone || '정보 없음'}</p>
      </section>

      <section className="info-section">
        <h3>🕐 영업시간</h3>
        {store.hours ? (
          <div className="hours-list">
            {Object.entries(store.hours).map(([day, time]) => (
              <div key={day} className="hours-item">
                <span className="day">{day}</span>
                <span className="time">{time}</span>
              </div>
            ))}
          </div>
        ) : (
          <p>정보 없음</p>
        )}
      </section>

      <section className="info-section">
        <h3>ℹ️ 매장 소개</h3>
        <p>{store.description || '매장 소개가 없습니다.'}</p>
      </section>
    </div>
  );
}
