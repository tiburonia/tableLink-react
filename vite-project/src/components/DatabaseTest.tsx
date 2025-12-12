import { useState, useEffect } from 'react'
import { testConnection, getAllStores, getAllUsers } from '@/utils/db'
import './DatabaseTest.css'

interface DBStatus {
  connected: boolean
  storeCount: number
  userCount: number
  error?: string
}

export const DatabaseTest = () => {
  const [status, setStatus] = useState<DBStatus>({
    connected: false,
    storeCount: 0,
    userCount: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const testDB = async () => {
      try {
        const isConnected = await testConnection()

        if (isConnected) {
          try {
            const stores = await getAllStores()
            const users = await getAllUsers()

            setStatus({
              connected: true,
              storeCount: stores.length,
              userCount: users.length,
            })
          } catch {
            setStatus({
              connected: false,
              storeCount: 0,
              userCount: 0,
              error: '데이터 조회 실패',
            })
          }
        } else {
          setStatus({
            connected: false,
            storeCount: 0,
            userCount: 0,
            error: '데이터베이스 연결 실패',
          })
        }
      } catch {
        setStatus({
          connected: false,
          storeCount: 0,
          userCount: 0,
          error: '데이터베이스 테스트 오류',
        })
      } finally {
        setLoading(false)
      }
    }

    testDB()
  }, [])

  return (
    <div className="db-test">
      <h2>🗄️ 데이터베이스 연결 테스트</h2>

      {loading ? (
        <div className="db-loading">
          <p>데이터베이스 연결 중...</p>
        </div>
      ) : (
        <div className="db-status">
          <div className={`status-card ${status.connected ? 'success' : 'error'}`}>
            <div className="status-icon">
              {status.connected ? '✅' : '❌'}
            </div>
            <div className="status-info">
              <h3>{status.connected ? '연결됨' : '연결 실패'}</h3>
              {status.error && <p className="error-message">{status.error}</p>}
            </div>
          </div>

          {status.connected && (
            <div className="db-stats">
              <div className="stat-item">
                <div className="stat-icon">🏪</div>
                <div className="stat-content">
                  <div className="stat-label">매장</div>
                  <div className="stat-value">{status.storeCount}개</div>
                </div>
              </div>

              <div className="stat-item">
                <div className="stat-icon">👥</div>
                <div className="stat-content">
                  <div className="stat-label">사용자</div>
                  <div className="stat-value">{status.userCount}명</div>
                </div>
              </div>
            </div>
          )}

          <div className="db-info">
            <h4>📋 데이터베이스 정보</h4>
            <p>
              <strong>호스트:</strong> ep-royal-morning-a1c4rtwd-pooler.ap-southeast-1.aws.neon.tech
            </p>
            <p>
              <strong>데이터베이스:</strong> neondb
            </p>
            <p>
              <strong>위치:</strong> Singapore (ap-southeast-1)
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
