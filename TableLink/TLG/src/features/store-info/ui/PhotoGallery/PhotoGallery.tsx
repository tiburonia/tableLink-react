import styles from './PhotoGallery.module.css'

interface Photo {
  id: string
  url: string
  caption?: string
}

interface PhotoGalleryProps {
  photos: Photo[]
  onPhotoClick: (url: string) => void
}

export const PhotoGallery = ({ photos, onPhotoClick }: PhotoGalleryProps) => {
  if (photos.length === 0) {
    return (
      <section className={styles.section}>
        <h3 className={styles.title}>
          <span className={styles.titleIcon}>📷</span>
          사진
        </h3>
        <div className={styles.emptyPhotos}>
          <div className={styles.emptyIcon}>📷</div>
          <p className={styles.emptyText}>등록된 사진이 없습니다</p>
        </div>
      </section>
    )
  }

  return (
    <section className={styles.section}>
      <h3 className={styles.title}>
        <span className={styles.titleIcon}>📷</span>
        사진
      </h3>
      <div className={styles.photoGrid}>
        {photos.map((photo) => (
          <div 
            key={photo.id} 
            className={styles.photoItem}
            onClick={() => onPhotoClick(photo.url)}
          >
            <img src={photo.url} alt={photo.caption || '매장 사진'} />
          </div>
        ))}
      </div>
    </section>
  )
}
