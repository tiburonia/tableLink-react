import type { StoreAmenities } from '../../model'
import { AMENITY_CONFIG } from '../../model'
import styles from './AmenitiesSection.module.css'

interface AmenitiesSectionProps {
  amenities?: StoreAmenities
}

export const AmenitiesSection = ({ amenities }: AmenitiesSectionProps) => {
  const availableAmenities = Object.keys(AMENITY_CONFIG)
    .filter(key => amenities?.[key as keyof StoreAmenities] === true)
    .map(key => AMENITY_CONFIG[key])

  if (availableAmenities.length === 0) {
    return null
  }

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          <span className={styles.titleIcon}>🏪</span>
          편의시설
        </h3>
      </div>
      <div className={styles.grid}>
        {availableAmenities.map((amenity, index) => (
          <div key={index} className={styles.card}>
            <div className={styles.cardIcon}>{amenity.icon}</div>
            <div className={styles.cardName}>{amenity.name}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
