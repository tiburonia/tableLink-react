
// POS 알림 시스템
function showPOSNotification(message, type = 'info') {
  // 기존 알림 제거
  const existingNotification = document.querySelector('.pos-notification');
  if (existingNotification) {
    existingNotification.remove();
  }

  const notification = document.createElement('div');
  notification.className = `pos-notification ${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <span class="notification-message">${message}</span>
      <button class="notification-close" onclick="this.parentElement.parentElement.remove()">✕</button>
    </div>
    <style>
      .pos-notification {
        position: fixed;
        top: 80px;
        right: 20px;
        max-width: 400px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
        z-index: 9999;
        border-left: 4px solid #3b82f6;
        animation: slideInFromRight 0.3s ease-out;
      }

      .pos-notification.success {
        border-left-color: #10b981;
      }

      .pos-notification.warning {
        border-left-color: #f59e0b;
      }

      .pos-notification.error {
        border-left-color: #ef4444;
      }

      .notification-content {
        padding: 16px 20px;
        display: flex;
        align-items: flex-start;
        gap: 12px;
      }

      .notification-message {
        flex: 1;
        font-size: 14px;
        line-height: 1.5;
        color: #374151;
        white-space: pre-line;
      }

      .notification-close {
        background: none;
        border: none;
        font-size: 16px;
        cursor: pointer;
        color: #9ca3af;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .notification-close:hover {
        color: #6b7280;
      }

      @keyframes slideInFromRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    </style>
  `;

  document.body.appendChild(notification);

  // 5초 후 자동 제거
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 5000);
}

// 전역 함수 등록
window.showPOSNotification = showPOSNotification;indow.showPOSNotification = showPOSNotification;
