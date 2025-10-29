
/**
 * 단골 소식 피드 페이지 진입점
 */

async function renderFeed(tab = 'following') {
  try {
    console.log('📰 단골 소식 피드 페이지 진입');

    // Controller 동적 로드
    const { feedController } = await import('/TLG/pages/feed/controllers/feedController.js');

    // 페이지 초기화
    await feedController.init(tab);

  } catch (error) {
    console.error('❌ 단골 소식 피드 페이지 렌더링 실패:', error);
    
    const main = document.getElementById('main');
    if (main) {
      main.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; padding: 20px; text-align: center;">
          <h2 style="color: #1f2937;">페이지를 불러올 수 없습니다</h2>
          <p style="color: #9ca3af; margin: 16px 0;">${error.message}</p>
          <button onclick="renderRegularPage()" style="padding: 12px 24px; background: #FF8A00; color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer;">
            단골매장으로 돌아가기
          </button>
        </div>
      `;
    }
  }
}

// 탭 전환 함수
async function switchFeedTab(tab) {
  console.log('🔄 피드 탭 전환:', tab);
  if (window.feedController) {
    await window.feedController.switchTab(tab);
  }
}

// 사이드 패널 제어 함수
function openSidePanel() {
  const panel = document.getElementById('sidePanel');
  if (panel) {
    panel.classList.add('active');
  }
}

function closeSidePanel() {
  const panel = document.getElementById('sidePanel');
  if (panel) {
    panel.classList.remove('active');
  }
}

// 전역으로 노출
window.renderFeed = renderFeed;
window.switchFeedTab = switchFeedTab;
window.openSidePanel = openSidePanel;
window.closeSidePanel = closeSidePanel;

console.log('✅ renderFeed 함수 전역 등록 완료');
