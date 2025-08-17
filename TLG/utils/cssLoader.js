
// CSS 로딩 유틸리티
window.CSSLoader = {
  loadedStyles: new Set(),

  loadCSS(href, id = null) {
    // 이미 로드된 CSS인지 확인
    if (this.loadedStyles.has(href) || document.querySelector(`link[href="${href}"]`)) {
      console.log(`✅ CSS 이미 로드됨: ${href}`);
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = href;
    if (id) link.id = id;
    
    document.head.appendChild(link);
    this.loadedStyles.add(href);
    console.log(`✅ CSS 로드 완료: ${href}`);
  },

  loadModuleCSS(module) {
    const cssMap = {
      'mapPanel': '/TLG/styles/mapPanelUI.css',
      'store': '/TLG/styles/renderStoreUI.css',
      'myPage': '/TLG/styles/renderMyPage.css',
      'subMain': '/TLG/styles/subMain.css'
    };

    if (cssMap[module]) {
      this.loadCSS(cssMap[module], `${module}-styles`);
    } else {
      console.warn(`⚠️ 알 수 없는 모듈: ${module}`);
    }
  }
};
