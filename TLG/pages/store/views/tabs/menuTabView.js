
/**
 * 메뉴 탭 뷰 - UI 렌더링
 */

export const homeTabView = {
  /**
   * 홈 탭 렌더링
   */
  render(store) {
    return`

    <div id="store-hour"</div>
    <div id="store-facility"></div>
    <div id="regular-customer"></div>
    <div id="store-menu"></div>
    <div id="store-review"></div>
    
      
    `;
  },


  
}

// 전역 등록
window.homeTabView = homeTabView;

console.log('✅ homeTabView 모듈 로드 완료');
