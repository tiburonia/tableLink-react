
/**
 * 매장 공지사항 HTML 모듈
 */
export const storeNoticeHTML = {
  /**
   * 공지사항 섹션 렌더링
   */
  render(notices) {
    if (!notices || notices.length === 0) {
      return this.renderEmpty();
    }

    return `
      <div class="store-notices">
        <div class="notices-header">
          <h3 class="notices-title">
            <span class="notices-icon">📢</span>
            공지사항
          </h3>
        </div>
        <div class="notices-list">
          ${notices.map(notice => this.renderNoticeItem(notice)).join('')}
        </div>
      </div>
      ${this.getStyles()}
    `;
  },

  /**
   * 공지사항 항목 렌더링
   */
  renderNoticeItem(notice) {
    const typeClass = notice.type === 'important' ? 'notice-important' : 'notice-event';
    const newBadge = notice.isNew ? '<span class="notice-new-badge">NEW</span>' : '';

    return `
      <div class="notice-item ${typeClass}">
        <div class="notice-icon">${notice.icon}</div>
        <div class="notice-content">
          <div class="notice-header">
            <h4 class="notice-title">${notice.title}</h4>
            ${newBadge}
          </div>
          <p class="notice-text">${notice.content}</p>
          <div class="notice-meta">
            <span class="notice-date">${notice.formattedDate}</span>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * 빈 상태 렌더링
   */
  renderEmpty() {
    return `
      <div class="store-notices empty">
        <div class="notices-empty">
          <span class="empty-icon">📭</span>
          <p class="empty-text">현재 공지사항이 없습니다</p>
        </div>
      </div>
      ${this.getStyles()}
    `;
  },

  /**
   * 스타일
   */
  getStyles() {
    return `
      <style>
        .store-notices {
          padding: 16px 0;
        }

        .notices-header {
          margin-bottom: 12px;
        }

        .notices-title {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          color: #1f2937;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .notices-icon {
          font-size: 20px;
        }

        .notices-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .notice-item {
          display: flex;
          gap: 12px;
          padding: 16px;
          background: white;
          border-radius: 12px;
          border-left: 4px solid #e5e7eb;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
          transition: all 0.2s ease;
        }

        .notice-item:hover {
          transform: translateX(4px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
        }

        .notice-item.notice-important {
          border-left-color: #ef4444;
          background: linear-gradient(to right, #fef2f2 0%, white 10%);
        }

        .notice-item.notice-event {
          border-left-color: #3b82f6;
          background: linear-gradient(to right, #eff6ff 0%, white 10%);
        }

        .notice-icon {
          font-size: 28px;
          line-height: 1;
          flex-shrink: 0;
        }

        .notice-content {
          flex: 1;
          min-width: 0;
        }

        .notice-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .notice-title {
          margin: 0;
          font-size: 15px;
          font-weight: 700;
          color: #1f2937;
          line-height: 1.4;
        }

        .notice-new-badge {
          display: inline-block;
          padding: 2px 6px;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          font-size: 10px;
          font-weight: 700;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .notice-text {
          margin: 0 0 8px 0;
          font-size: 14px;
          color: #4b5563;
          line-height: 1.5;
        }

        .notice-meta {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .notice-date {
          font-size: 12px;
          color: #9ca3af;
          font-weight: 500;
        }

        .notices-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          text-align: center;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 12px;
          opacity: 0.5;
        }

        .empty-text {
          margin: 0;
          font-size: 14px;
          color: #9ca3af;
        }
      </style>
    `;
  }
};

// 전역 등록
window.storeNoticeHTML = storeNoticeHTML;

console.log('✅ storeNoticeHTML 모듈 로드 완료');
