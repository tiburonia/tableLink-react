import styles from './PhotoModal.module.css'

interface PhotoModalProps {
  photoUrl: string
  onClose: () => void
}

export const PhotoModal = ({ photoUrl, onClose }: PhotoModalProps) => {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.modalClose} onClick={onClose}>✕</button>
        <img src={photoUrl} alt="매장 사진" className={styles.modalImage} />
      </div>
    </div>
  )
}
