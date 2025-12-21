/**
 * 네이버 지도 줌 레벨 ↔ 카카오 지도 레벨 변환 유틸리티
 * 
 * 네이버 지도: Zoom 6-21 (6=최대축소, 21=최대확대)
 * 카카오 지도: Level 1-14 (1=최대확대, 14=최대축소)
 */

export const mapLevelConverter = {
  /**
   * 네이버 줌 레벨을 카카오 레벨로 변환
   * @param {number} naverZoom - 네이버 지도 줌 레벨 (6-21)
   * @returns {number} 카카오 지도 레벨 (1-14)
   */
  naverZoomToKakaoLevel(naverZoom) {
    // 네이버: 6(축소) ~ 21(확대)
    // 카카오: 14(축소) ~ 1(확대)
    // 공식: kakaoLevel = 21 - naverZoom + 7
    // 또는: kakaoLevel = 28 - naverZoom
    
    // 범위 제한
    const clampedZoom = Math.max(6, Math.min(21, naverZoom));
    
    // 변환: 네이버 6 → 카카오 14, 네이버 21 → 카카오 1
    const kakaoLevel = 28 - clampedZoom;
    
    // 1-14 범위로 제한
    return Math.max(1, Math.min(14, Math.round(kakaoLevel)));
  },

  /**
   * 카카오 레벨을 네이버 줌으로 변환
   * @param {number} kakaoLevel - 카카오 지도 레벨 (1-14)
   * @returns {number} 네이버 지도 줌 레벨 (6-21)
   */
  kakaoLevelToNaverZoom(kakaoLevel) {
    // 범위 제한
    const clampedLevel = Math.max(1, Math.min(14, kakaoLevel));
    
    // 역변환: 카카오 14 → 네이버 6, 카카오 1 → 네이버 21
    const naverZoom = 28 - clampedLevel;
    
    // 6-21 범위로 제한
    return Math.max(6, Math.min(21, Math.round(naverZoom)));
  },

  /**
   * 변환된 레벨 정보 로깅
   */
  logConversion(naverZoom) {
    const kakaoLevel = this.naverZoomToKakaoLevel(naverZoom);
    console.log(`🔄 [레벨 변환] 네이버 줌 ${naverZoom} → 카카오 레벨 ${kakaoLevel}`);
    return kakaoLevel;
  }
};

// 전역 등록 (호환성)
if (typeof window !== 'undefined') {
  window.mapLevelConverter = mapLevelConverter;
}
