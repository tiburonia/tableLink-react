// 매장 캐시 시스템 제거됨
// 뷰포트 기반 실시간 로딩으로 변경

console.log('ℹ️ 매장 캐시 시스템이 제거되었습니다. 뷰포트 기반 실시간 로딩을 사용합니다.');

// 하위 호환성을 위한 더미 객체
window.storeCache = {
  getStoreData() { return null; },
  setStoreData() { },
  setStoreDataAsync() { return Promise.resolve(); },
  clearCache() { },
  clearCacheAsync() { return Promise.resolve(); },
  hasCachedData() { return false; }
};