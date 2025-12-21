import { useNavigate } from 'react-router-dom'
import { SettingsHeader, SNSConnections, AccountInfo, FooterButtons } from './ui'
import { useSettingsHandlers } from '@/features/settings'
import styles from './SettingsPage.module.css'

interface SettingsPageProps {
  onLogout: () => void
  userInfo?: {
    userId: number
    name?: string
    username?: string
    email?: string
    phone?: string
    emailVerified?: boolean
  }
}

export const SettingsPage = ({ onLogout, userInfo }: SettingsPageProps) => {
  const navigate = useNavigate()
  const {
    snsConnections,
    handleBack,
    handleSNSConnect,
    handleEditField,
    handleWithdraw,
    handleLogout,
  } = useSettingsHandlers(onLogout, navigate, userInfo)

  const displayName = userInfo?.name || userInfo?.username || '사용자'
  const email = userInfo?.email || ''
  const phone = userInfo?.phone || ''
  const isEmailVerified = email.includes('appleid.com') || userInfo?.emailVerified || false

  return (
    <div className="mobile-app">
      <div className="mobile-content">
        <div className={styles.accountSettingsWrapper}>
          <SettingsHeader onBack={handleBack} />

          <div className={styles.accountSettingsContent}>
            <SNSConnections connections={snsConnections} onConnect={handleSNSConnect} />
            <AccountInfo
              displayName={displayName}
              email={email}
              phone={phone}
              isEmailVerified={isEmailVerified}
              onEditField={handleEditField}
            />
            <FooterButtons onWithdraw={handleWithdraw} onLogout={handleLogout} />
          </div>
        </div>
      </div>
    </div>
  )
}
