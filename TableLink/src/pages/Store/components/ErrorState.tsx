import { useNavigate } from 'react-router-dom'

interface ErrorStateProps {
  error: string
}

export const ErrorState = ({ error }: ErrorStateProps) => {
  const navigate = useNavigate()
  
  return (
    <div className="store-page">
      <div className="store-error">
        <div className="error-icon">⚠️</div>
        <h2>오류가 발생했습니다</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/')} className="back-button">
          홈으로 돌아가기
        </button>
      </div>
    </div>
  )
}
