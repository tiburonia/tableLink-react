import type { Store } from '@/entities/store'
import { PhotoGallery } from './PhotoGallery'
import { BusinessHours } from './BusinessHours'
import { TableInfo } from '@/features/store-table'
import { PromotionSection } from '@/features/store-promotion'

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
    <div className="info-tab">
      {/* 소개 */}
      
      <TableInfo storeId={parseInt(store.id)} isOpen={store.is_open ?? false} />
      
      {/* 혜택 & 프로모션 섹션 추가 */}
      <PromotionSection storeId={parseInt(store.id)} />
      
      <PhotoGallery photos={photos} onPhotoClick={onPhotoClick} />
      <BusinessHours hours={hours} />
      
    </div>
  )
}
