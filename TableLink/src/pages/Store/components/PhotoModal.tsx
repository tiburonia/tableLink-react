interface PhotoModalProps {
  photoUrl: string
  onClose: () => void
}

export const PhotoModal = ({ photoUrl, onClose }: PhotoModalProps) => {
  return (
    <div className="photo-modal" onClick={onClose}>
      <button className="modal-close">✕</button>
      <img src={photoUrl} alt="매장 사진" />
    </div>
  )
}
