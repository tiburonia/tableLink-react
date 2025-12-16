/**
 * MyPage Entry Point (리팩토링 버전)
 * 레이어드 아키텍처 기반 마이페이지
 */

/**
 * 마이페이지 렌더링 메인 함수
 */
async function renderMyPage() {
  try {
    console.log('🏠 renderMyPage 호출 (레이어드 아키텍처)');

    // 동적 import로 컨트롤러 로드
    const { mypageController } = await import('./controllers/mypageController.js');
    
    // 전역에서 접근 가능하도록 등록 (다른 페이지에서 중단 가능)
    window.mypageController = mypageController;
    
    await mypageController.renderMyPage();

  } catch (error) {
    console.error('❌ renderMyPage 실행 실패:', error);

    const main = document.getElementById('main');
    if (main) {
      main.innerHTML = `
        <div style="padding: 20px; text-align: center; color: #666;">
          <h2>🚫 마이페이지를 불러올 수 없습니다</h2>
          <p style="color: #999; margin: 10px 0;">${error.message}</p>
          <button onclick="renderMap()" style="
            padding: 10px 20px;
            background: #297efc;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
          ">지도로 돌아가기</button>
        </div>
      `;
    }
  }
}

// 즉시 전역 함수 등록
window.renderMyPage = renderMyPage;
console.log('✅ renderMyPage 전역 등록 완료 (레이어드 아키텍처)');