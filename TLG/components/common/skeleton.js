
/**
 * 공통 스켈레톤 컴포넌트
 */

// 기본 스켈레톤 스타일
export const skeletonStyles = `
  .skeleton-loading {
    background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
    background-size: 200% 100%;
    animation: skeleton-loading 1.5s infinite;
    border-radius: 4px;
  }

  @keyframes skeleton-loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  .skeleton-fade-in {
    animation: skeleton-fade-in 0.3s ease-out;
  }

  @keyframes skeleton-fade-in {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

// 로그인 폼 스켈레톤
export function createLoginSkeleton() {
  return `
    <div class="login-skeleton skeleton-fade-in">
      <!-- 폼 스켈레톤 -->
      <div class="skeleton-form-section">
        <div class="skeleton-form-group">
          <div class="skeleton-input-wrapper">
            <div class="skeleton-input skeleton-loading"></div>
          </div>
        </div>
        <div class="skeleton-form-group">
          <div class="skeleton-input-wrapper">
            <div class="skeleton-input skeleton-loading"></div>
          </div>
        </div>
        <div class="skeleton-btn skeleton-loading"></div>
      </div>

      <!-- 구분선 스켈레톤 -->
      <div class="skeleton-divider">
        <div class="skeleton-divider-line skeleton-loading"></div>
        <div class="skeleton-divider-text skeleton-loading"></div>
      </div>

      <!-- 빠른 액세스 스켈레톤 -->
      <div class="skeleton-quick-section">
        <div class="skeleton-section-title skeleton-loading"></div>
        <div class="skeleton-quick-grid">
          <div class="skeleton-quick-btn skeleton-loading"></div>
          <div class="skeleton-quick-btn skeleton-loading"></div>
        </div>
        <div class="skeleton-system-grid">
          <div class="skeleton-system-btn skeleton-loading"></div>
          <div class="skeleton-system-btn skeleton-loading"></div>
          <div class="skeleton-system-btn skeleton-loading"></div>
          <div class="skeleton-system-btn skeleton-loading"></div>
        </div>
      </div>

      <!-- 푸터 스켈레톤 -->
      <div class="skeleton-footer">
        <div class="skeleton-footer-line skeleton-loading"></div>
        <div class="skeleton-footer-text skeleton-loading"></div>
      </div>
    </div>

    <style>
      ${skeletonStyles}

      .skeleton-form-section {
        margin-bottom: 32px;
        padding-top: 20px;
      }

      .skeleton-form-group {
        margin-bottom: 24px;
      }

      .skeleton-input {
        width: 100%;
        height: 54px;
        border-radius: 12px;
      }

      .skeleton-btn {
        width: 100%;
        height: 54px;
        border-radius: 12px;
        margin-bottom: 20px;
      }

      .skeleton-divider {
        position: relative;
        margin: 32px 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .skeleton-divider-line {
        position: absolute;
        width: 100%;
        height: 1px;
      }

      .skeleton-divider-text {
        width: 60px;
        height: 16px;
        border-radius: 8px;
        z-index: 1;
      }

      .skeleton-section-title {
        width: 120px;
        height: 20px;
        border-radius: 10px;
        margin: 0 auto 16px auto;
      }

      .skeleton-quick-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        margin: 20px 0 16px 0;
      }

      .skeleton-quick-btn {
        height: 60px;
        border-radius: 12px;
      }

      .skeleton-system-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
        margin: 16px 0 20px 0;
      }

      .skeleton-system-btn {
        height: 70px;
        border-radius: 10px;
        margin-bottom: 8px;
      }

      .skeleton-footer {
        padding-top: 20px;
        margin-top: 40px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
      }

      .skeleton-footer-line {
        width: 100%;
        height: 1px;
      }

      .skeleton-footer-text {
        width: 200px;
        height: 14px;
        border-radius: 7px;
      }

      @media (max-width: 480px) {
        .skeleton-quick-grid {
          grid-template-columns: 1fr;
          gap: 10px;
        }
      }
    </style>
  `;
}
