// 세부 패널 관리 모듈 (새로운 테이블 상세 패널 사용)

// 세부 패널 업데이트 (새 모듈 사용)
async function updateDetailPanel(tableNumber) {
  if (typeof renderTableDetailPanel === 'function') {
    await renderTableDetailPanel(tableNumber);
  } else {
    // 폴백 처리
    const panelTitle = document.getElementById('panelTitle');
    const panelContent = document.getElementById('panelContent');

    if (panelTitle) {
      panelTitle.textContent = `테이블 ${tableNumber}`;
    }

    if (panelContent) {
      panelContent.innerHTML = `
        <div class="loading-message">
          테이블 정보를 불러오는 중...
        </div>
      `;
    }

    console.error('❌ renderTableDetailPanel 함수를 찾을 수 없습니다');
  }
}

// 세부 패널 닫기
function closeDetailPanel() {
  document.querySelectorAll('.table-item').forEach(item => {
    item.classList.remove('selected');
  });

  window.currentTable = null;

  const panelTitle = document.getElementById('panelTitle');
  const panelContent = document.getElementById('panelContent');

  if (panelTitle) {
    panelTitle.textContent = '테이블을 선택하세요';
  }

  if (panelContent) {
    panelContent.innerHTML = `
      <div class="select-table-message">
        테이블을 클릭하여 주문 관리를 시작하세요
      </div>
    `;
  }
}

// 시간 포맷팅 함수들 (하위 호환성)
function formatOrderTime(orderDate) {
  const date = new Date(orderDate);
  const now = new Date();
  const diffMinutes = Math.floor((now - date) / (1000 * 60));

  if (diffMinutes < 1) return '방금 전';
  if (diffMinutes < 60) return `${diffMinutes}분 전`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;

  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString().slice(0, 5);
}

// 주문 소스 텍스트 변환 (하위 호환성)
function getOrderSourceText(source) {
  const sourceMap = {
    'TLL': 'TLL 주문',
    'POS': 'POS 주문',
    'POS_TLL': 'POS+TLL'
  };
  return sourceMap[source] || source;
}

// 기본 스타일 (새 모듈에서 더 자세한 스타일 제공)
function getDetailPanelStyles() {
  return `
    <style>
      .select-table-message, .loading-message {
        text-align: center;
        color: #64748b;
        padding: 32px 20px;
        background: #f8fafc;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
        font-size: 14px;
      }
    </style>
  `;
}

// 전역 함수 등록
window.updateDetailPanel = updateDetailPanel;
window.closeDetailPanel = closeDetailPanel;
window.formatOrderTime = formatOrderTime;
window.getOrderSourceText = getOrderSourceText;

console.log('✅ 세부 패널 모듈 로드 완료 (새 테이블 상세 패널 연동)');