
/**
 * 홈 탭 스켈레톤 - 로딩 상태 표시
 */
export const homeTabSkeleton = {
  render() {
    return `
      <div class="home-tab-skeleton">
        <!-- 테이블 상태 스켈레톤 -->
        <div class="skeleton-section">
          <div class="skeleton-header">
            <div class="skeleton-line" style="width: 120px; height: 20px;"></div>
          </div>
          <div class="skeleton-table-grid">
            ${Array(4).fill(0).map(() => `
              <div class="skeleton-table-card">
                <div class="skeleton-line" style="width: 60%; height: 18px;"></div>
                <div class="skeleton-line" style="width: 40%; height: 14px; margin-top: 8px;"></div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- 메뉴 섹션 스켈레톤 -->
        <div class="skeleton-section">
          <div class="skeleton-header">
            <div class="skeleton-line" style="width: 100px; height: 20px;"></div>
          </div>
          <div class="skeleton-menu-grid">
            ${Array(6).fill(0).map(() => `
              <div class="skeleton-menu-card">
                <div class="skeleton-image"></div>
                <div class="skeleton-line" style="width: 80%; height: 16px; margin-top: 12px;"></div>
                <div class="skeleton-line" style="width: 50%; height: 14px; margin-top: 8px;"></div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- 리뷰 프리뷰 스켈레톤 -->
        <div class="skeleton-section">
          <div class="skeleton-header">
            <div class="skeleton-line" style="width: 100px; height: 20px;"></div>
          </div>
          ${Array(3).fill(0).map(() => `
            <div class="skeleton-review-card">
              <div class="skeleton-review-header">
                <div class="skeleton-avatar"></div>
                <div style="flex: 1;">
                  <div class="skeleton-line" style="width: 100px; height: 16px;"></div>
                  <div class="skeleton-line" style="width: 60px; height: 14px; margin-top: 6px;"></div>
                </div>
              </div>
              <div class="skeleton-line" style="width: 100%; height: 16px; margin-top: 12px;"></div>
              <div class="skeleton-line" style="width: 85%; height: 16px; margin-top: 8px;"></div>
            </div>
          `).join('')}
        </div>
      </div>

      <style>
        .home-tab-skeleton {
          padding: 20px 16px;
        }

        .skeleton-section {
          margin-bottom: 32px;
        }

        .skeleton-header {
          margin-bottom: 16px;
        }

        .skeleton-line {
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: skeleton-loading 1.5s infinite;
          border-radius: 4px;
        }

        .skeleton-table-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .skeleton-table-card {
          background: white;
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .skeleton-menu-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .skeleton-menu-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          padding-bottom: 12px;
        }

        .skeleton-image {
          width: 100%;
          height: 120px;
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: skeleton-loading 1.5s infinite;
        }

        .skeleton-review-card {
          background: white;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .skeleton-review-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .skeleton-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: skeleton-loading 1.5s infinite;
        }

        @keyframes skeleton-loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      </style>
    `;
  }
};

console.log('✅ homeTabSkeleton 모듈 로드 완료');
