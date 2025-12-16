import type { Store } from '@/pages/Main/types'
import { PhotoGallery } from './PhotoGallery'
import { BusinessHours } from './BusinessHours'
import { StoreBasicInfo } from './StoreBasicInfo'

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
      <section className="store-section">
        <h3 className="section-title">소개</h3>
        <p className="description-text">
          {store.description || '품질 좋은 재료와 정성으로 만드는 음식을 제공합니다. 편안한 분위기에서 맛있는 식사를 즐기실 수 있습니다.'}
        </p>
      </section>

      <PhotoGallery photos={photos} onPhotoClick={onPhotoClick} />
      <BusinessHours hours={hours} />
      <StoreBasicInfo 
        phone={store.phone} 
        address={store.address} 
        isOpen={store.is_open} 
      />
    </div>
  )
}
