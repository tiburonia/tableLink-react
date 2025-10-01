
/**
 * 매장 렌더링 메인 함수 - 레이어드 아키텍처 적용
 * @param {Object} storeData - 표준화된 매장 데이터 객체
 * @param {number} storeData.id - 매장 ID (primary)
 * @param {number} storeData.store_id - 매장 ID (호환성)
 * @param {string} storeData.name - 매장명
 * @param {string} storeData.category - 카테고리
 * @param {string} storeData.address - 전체 주소
 * @param {number} storeData.ratingAverage - 평균 평점
 * @param {number} storeData.reviewCount - 리뷰 개수
 * @param {number} storeData.favoriteCount - 찜 개수
 * @param {boolean} storeData.isOpen - 운영 상태
 * @param {Object} storeData.coord - 좌표 { lat, lng }
 * @param {Object} storeData.region - 지역정보 { sido, sigungu, eupmyeondong }
 */
async function renderStore(storeData) {
  try {
    console.log('🏪 renderStore 호출:', storeData?.name, 'ID:', storeData?.id);

    // storeController 동적 로드
    let storeController;
    try {
      // Store Controller 모듈을 동적으로 임포트.
      const controllerModule = await import('./controllers/storeController.js');
      storeController = controllerModule.storeController;
    } catch (error) {
      // 모듈 임포트 실패 시 콘솔에 경고를 출력하고,
      // 전역에 이미 로드된 storeController 객체를 사용합니다 (폴백).
      console.warn('⚠️ storeController 모듈 임포트 실패:', error);
      storeController = window.storeController;
    }

    // storeController가 로드되었는지 확인합니다.
    if (!storeController) {
      console.error('❌ storeController를 찾을 수 없습니다');
      // 컨트롤러가 없으면 오류를 발생시켜 처리를 중단합니다.
      throw new Error('매장 컨트롤러 모듈을 로드할 수 없습니다');
    }

    // 매장 렌더링 로직 > 초기 렌더링 및 데이터 로딩
    await storeController.renderStore(storeData);

  } catch (error) {
    console.error('❌ renderStore 실행 실패:', error);

    // 렌더링 실패 시 사용자에게 오류 메시지를 표시합니다.
    const main = document.getElementById('main');
    if (main) {
      main.innerHTML = `
        <div style="padding: 20px; text-align: center; color: #666;">
          <h2>🚫 매장을 불러올 수 없습니다</h2>
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

/**
 * 테이블 배치도 렌더링
 */
async function renderTableLayout(store) {
  // TableInfoManager가 존재하고 renderTableLayout 함수가 있다면 호출합니다.
  if (window.TableInfoManager && typeof window.TableInfoManager.renderTableLayout === 'function') {
    await window.TableInfoManager.renderTableLayout(store);
  } else {
    console.warn('⚠️ TableInfoManager를 찾을 수 없습니다');
  }
}

/**
 * 프로모션 상세보기
 */
function showAllPromotions(store) {
  console.log('🎯 showAllPromotions 호출:', store?.name);

  // renderPromotionDetail 함수가 정의되어 있으면 호출합니다.
  if (typeof renderPromotionDetail === 'function') {
    renderPromotionDetail(store);
  } else if (window.renderPromotionDetail && typeof window.renderPromotionDetail === 'function') {
    // 전역 객체 window를 통해 함수를 찾습니다.
    window.renderPromotionDetail(store);
  } else {
    // 함수를 찾지 못하면 오류 메시지를 표시합니다.
    console.error('❌ renderPromotionDetail 함수를 찾을 수 없습니다');
    alert('프로모션 상세 페이지를 불러올 수 없습니다');
  }
}

/**
 * 상위 사용자 전체보기
 */
function showAllTopUsers(store) {
  console.log('🏆 상위 사용자 전체 보기:', store?.name);
  // 현재는 알림 메시지만 표시하고, 추후 구현 예정임을 알립니다.
  alert(`${store?.name}의 모든 단골 고객 목록을 보여줍니다. (개발 예정)`);
}

/**
 * 전역 함수 등록
 */
try {
  console.log('🔧 renderStore 전역 함수 등록 중...');

  // renderStore 함수 전역 등록
  window.renderStore = renderStore;

  console.log('✅ renderStore 전역 등록 완료');
} catch (error) {
  console.error('❌ renderStore 전역 등록 실패:', error);
}
