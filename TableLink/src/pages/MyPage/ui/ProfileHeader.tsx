/**
 * ProfileHeader - 프로필 헤더 컴포넌트
 */

import { useNavigate } from 'react-router-dom'
import styles from './ProfileHeader.module.css'

interface ProfileHeaderProps {
  displayName: string
}

export function ProfileHeader({ displayName }: ProfileHeaderProps) {
  const navigate = useNavigate()

  return (
    <header className={styles.header}>
      <span 
        className={styles.loginLink} 
        onClick={() => navigate('/setting')}
      >
        {displayName}&nbsp;&nbsp;
        <img
          width="17"
          height="17"
          src="https://img.icons8.com/external-others-inmotus-design/17/external-Right-basic-web-ui-elements-others-inmotus-design-4.png"
          alt="arrow"
        />
      </span>
    </header>
  )
}
