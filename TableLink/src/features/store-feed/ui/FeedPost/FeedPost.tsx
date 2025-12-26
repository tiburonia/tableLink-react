import styles from './FeedPost.module.css'

interface FeedPostProps {
  id: number
  author: string
  avatar: string
  image: string | null
  caption: string
  date: string
  likes: number
  type: 'story' | 'promotion' | 'notice'
  isLiked: boolean
  title: string
  tags: string[]
  onLike: (id: number) => void
}

const typeLabels = {
  story: '스토리',
  promotion: '이벤트',
  notice: '공지',
}

export const FeedPost = ({
  id,
  author,
  avatar,
  image,
  caption,
  date,
  likes,
  type,
  isLiked,
  title,
  tags,
  onLike,
}: FeedPostProps) => {
  return (
    <article className={styles.postCard}>
      <div className={styles.postHeader}>
        <div className={styles.postAuthor}>
          <img src={avatar} alt={author} className={styles.authorAvatar} />
          <div className={styles.authorInfo}>
            <span className={styles.authorName}>{author}</span>
            <span className={styles.postDate}>{date}</span>
          </div>
        </div>
        <span className={`${styles.postType} ${styles[type]}`}>
          {typeLabels[type]}
        </span>
      </div>

      {image ? (
        <img src={image} alt={title} className={styles.postImage} />
      ) : (
        <div className={styles.noImage}>
          {type === 'story' ? '📖' : type === 'promotion' ? '🎁' : '📢'}
        </div>
      )}

      <div className={styles.postContent}>
        {title && <h3 className={styles.postTitle}>{title}</h3>}
        <p className={styles.postCaption}>{caption}</p>

        {tags.length > 0 && (
          <div className={styles.postTags}>
            {tags.map((tag, index) => (
              <span key={index} className={styles.tag}>#{tag}</span>
            ))}
          </div>
        )}

        <div className={styles.postActions}>
          <button
            className={`${styles.actionButton} ${isLiked ? styles.liked : ''}`}
            onClick={() => onLike(id)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <span className={styles.likeCount}>{likes}</span>
          </button>
          <button className={styles.actionButton}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>댓글</span>
          </button>
          <button className={styles.actionButton}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            <span>공유</span>
          </button>
        </div>
      </div>
    </article>
  )
}
