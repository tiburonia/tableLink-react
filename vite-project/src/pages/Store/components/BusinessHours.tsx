interface HourItem {
  day: string
  hours: string
}

interface BusinessHoursProps {
  hours: HourItem[]
}

export const BusinessHours = ({ hours }: BusinessHoursProps) => {
  return (
    <section className="store-section">
      <h3 className="section-title">영업시간</h3>
      <div className="hours-list">
        {hours.map((item, index) => (
          <div key={index} className="hours-item">
            <span className="hours-day">{item.day}</span>
            <span className={`hours-time ${item.hours === '휴무' ? 'closed' : ''}`}>
              {item.hours}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
