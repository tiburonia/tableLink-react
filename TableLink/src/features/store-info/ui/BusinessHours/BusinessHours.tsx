import type { BusinessHour } from '../../model'
import styles from './BusinessHours.module.css'

interface BusinessHoursProps {
  hours: BusinessHour[]
}

export const BusinessHours = ({ hours }: BusinessHoursProps) => {
  return (
    <section className={styles.section}>
      <h3 className={styles.title}>
        <span className={styles.titleIcon}>🕐</span>
        영업시간
      </h3>
      <div className={styles.hoursList}>
        {hours.map((item, index) => (
          <div key={index} className={styles.hoursItem}>
            <span className={styles.hoursDay}>{item.day}</span>
            <span className={`${styles.hoursTime} ${item.hours === '휴무' ? styles.closed : ''}`}>
              {item.hours}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
