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
  return (
    <section className="store-section">
      <h3 className="section-title">사진</h3>
      <div className="photo-grid">
        {photos.map((photo) => (
          <div 
            key={photo.id} 
            className="photo-item"
            onClick={() => onPhotoClick(photo.url)}
          >
            <img src={photo.url} alt={photo.caption} />
          </div>
        ))}
      </div>
    </section>
  )
}
