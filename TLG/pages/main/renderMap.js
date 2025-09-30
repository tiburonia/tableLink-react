import { mapController } from './controllers/mapController.js';

/**
 * 지도 렌더링 모듈 (Controller 사용)
 * MVP 패턴 적용: Controller가 Service와 View를 조율
 * 
 * 새로운 레이어드 아키텍처 모듈들:
 * - mapPanelController: 패널 UI 제어
 * - mapMarkerController: 마커 관리 제어
 */

// 새로운 아키텍처 모듈 로드
try {
  await import('./controllers/mapPanelController.js');
  await import('./controllers/mapMarkerController.js');
  console.log('✅ 새로운 아키텍처 컨트롤러 로드 완료');
} catch (error) {
  console.warn('⚠️ 새로운 아키텍처 컨트롤러 로드 실패, 레거시 모드로 진행:', error);
}


/**
 * 지도 페이지 진입점 (리팩토링된 버전)
 * 레이어드 아키텍처 적용: Repository → Service → Controller → View
 */
async function renderMap() {
  console.log('🗺️ 지도 페이지 진입 - 레이어드 아키텍처 버전');

  try {
    // 컨트롤러를 통한 지도 초기화
    await mapController.initializeMap();

    // 패널 및 마커 연동 (새로운 아키텍처 우선 적용)
    // this.connectMapPanelUI()는 mapController.initializeMap() 이후에 호출되어야 하므로,
    // mapController의 상태(map 객체)가 준비된 후 비동기적으로 실행되도록 합니다.
    // 실제 클래스 기반 컴포넌트에서는 this 컨텍스트가 달라질 수 있으므로,
    // 이 부분은 컴포넌트 구조에 맞게 조정이 필요할 수 있습니다.
    // 여기서는 renderMap 함수 내에서 직접 호출하는 형태로 가정합니다.
    await connectMapPanelUI();

    console.log('✅ 지도 페이지 렌더링 완료');
  } catch (error) {
    console.error('❌ 지도 페이지 렌더링 실패:', error);

    // 폴백 에러 화면
    const main = document.getElementById('main');
    main.innerHTML = `
      <div style="padding: 20px; text-align: center; color: red;">
        <h2>🚫 지도 로딩 실패</h2>
        <p>지도를 불러오는 중 오류가 발생했습니다.</p>
        <button onclick="location.reload()">다시 시도</button>
      </div>
    `;
  }
}

// connectMapPanelUI 함수를 renderMap 함수 내부에서 사용할 수 있도록 정의
async function connectMapPanelUI() {
  // mapController.getMap() 등을 통해 지도 객체를 가져와야 합니다.
  // 여기서는 mapController.initializeMap()이 완료된 후 지도 객체가 준비되었다고 가정합니다.
  // 실제 구현에서는 mapController에서 지도 객체를 반환받거나, 전역적으로 접근 가능하게 해야 합니다.
  const map = mapController.getMap(); // 가상의 getter 함수

  if (!map) {
    console.warn('⚠️ 지도 객체를 찾을 수 없어 패널/마커 연동을 건너<0xEB><0x9B><0x81>니다.');
    return;
  }

  setTimeout(async () => {
    try {
      // 새로운 패널 컨트롤러 사용
      if (window.mapPanelController) {
        await window.mapPanelController.initializePanel(map);
      }
      // 새로운 마커 컨트롤러 사용
      if (window.mapMarkerController) {
        await window.mapMarkerController.initializeMarkers(map);
      }

      // 레거시 지원 (폴백)
      if (!window.mapPanelController && window.MapPanelUI) {
        if (typeof window.MapPanelUI.initializeFiltering === 'function') {
          window.MapPanelUI.initializeFiltering();
        }
        if (typeof window.MapPanelUI.setupPanelDrag === 'function') {
          window.MapPanelUI.setupPanelDrag();
        }
        if (typeof window.MapPanelUI.connectToMap === 'function') {
          window.MapPanelUI.connectToMap(map);
        }
      }

      // 레거시 마커 매니저 지원 (폴백)
      if (!window.mapMarkerController && window.MapMarkerManager) {
        if (typeof window.MapMarkerManager.reset === 'function') {
          window.MapMarkerManager.reset();
        }
      }

      console.log('✅ 새로운 아키텍처 패널 및 마커 연동 완료');
    } catch (error) {
      console.error('❌ 패널/마커 연동 실패:', error);
    }
  }, 200);
}


// 기존 호환성을 위한 전역 함수 등록
window.renderMap = renderMap;

// 모듈 기본 내보내기 (ES6 모듈 시스템)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = renderMap;
} else if (typeof window !== 'undefined') {
  window.renderMap = renderMap;
}

// ES6 export (모듈 지원 환경에서)
export default renderMap;

console.log('✅ 리팩토링된 renderMap 모듈 로드 완료 (호환성 향상)');