interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  actionText?: string
  onAction?: () => void
}

export const EmptyState = ({
  icon = '📭',
  title,
  description,
  actionText,
  onAction,
}: EmptyStateProps) => {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h3 className="empty-title">{title}</h3>
      {description && <p className="empty-description">{description}</p>}
      {actionText && onAction && (
        <button className="empty-action" onClick={onAction}>
          {actionText}
        </button>
      )}
    </div>
  )
}
