import type { Store } from '@/entities/store'
import { PhotoGallery } from '../PhotoGallery'
import { BusinessHours } from '../BusinessHours'
import { TableInfo } from '@/features/store-table'
import { PromotionSection } from '@/features/store-promotion'
import styles from './InfoTab.module.css'

interface Photo {
  id: string
  url: string
  caption?: string
}

interface HourItem {
  day: string
  hours: string
}

interface InfoTabProps {
  store: Store
  photos: Photo[]
  hours: HourItem[]
  onPhotoClick: (url: string) => void
}

export const InfoTab = ({ store, photos, hours, onPhotoClick }: InfoTabProps) => {
  return (
    <div className={styles.infoTab}>
      <TableInfo storeId={parseInt(store.id)} isOpen={store.is_open ?? false} />
      <PromotionSection storeId={parseInt(store.id)} />
      <PhotoGallery photos={photos} onPhotoClick={onPhotoClick} />
      <BusinessHours hours={hours} />
    </div>
  )
}
