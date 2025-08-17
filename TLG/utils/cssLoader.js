
// 향상된 CSS 로딩 유틸리티
window.CSSLoader = {
  loadedStyles: new Set(),
  loadingPromises: new Map(),

  // CSS 파일 로드 (Promise 기반)
  async loadCSS(href, id = null) {
    // 이미 로드된 CSS인지 확인
    if (this.loadedStyles.has(href) || document.querySelector(`link[href="${href}"]`)) {
      console.log(`✅ CSS 이미 로드됨: ${href}`);
      return Promise.resolve();
    }

    // 이미 로딩 중인지 확인
    if (this.loadingPromises.has(href)) {
      console.log(`⏳ CSS 로딩 중: ${href}`);
      return this.loadingPromises.get(href);
    }

    // 새로운 CSS 로딩 Promise 생성
    const loadPromise = new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.type = 'text/css';
      link.href = href;
      if (id) link.id = id;

      link.onload = () => {
        this.loadedStyles.add(href);
        this.loadingPromises.delete(href);
        console.log(`✅ CSS 로드 완료: ${href}`);
        resolve();
      };

      link.onerror = () => {
        this.loadingPromises.delete(href);
        console.error(`❌ CSS 로드 실패: ${href}`);
        reject(new Error(`CSS 로드 실패: ${href}`));
      };

      document.head.appendChild(link);
    });

    this.loadingPromises.set(href, loadPromise);
    return loadPromise;
  },

  // 여러 CSS 파일 동시 로드
  async loadMultipleCSS(cssFiles) {
    const promises = cssFiles.map(css => {
      if (typeof css === 'string') {
        return this.loadCSS(css);
      } else {
        return this.loadCSS(css.href, css.id);
      }
    });

    try {
      await Promise.all(promises);
      console.log(`✅ 모든 CSS 파일 로드 완료: ${cssFiles.length}개`);
    } catch (error) {
      console.error('❌ CSS 파일 로드 중 오류:', error);
    }
  },

  // 모듈별 CSS 로드
  async loadModuleCSS(module) {
    const cssMap = {
      'mapPanel': ['/TLG/styles/mapPanelUI.css'],
      'store': ['/TLG/styles/renderStoreUI.css'],
      'myPage': ['/TLG/styles/renderMyPage.css'],
      'subMain': ['/TLG/styles/subMain.css'],
      'global': [
        '/shared/css/globalBody.css',
        '/shared/css/renderLogin.css',
        '/shared/css/favoriteStore.css'
      ]
    };

    if (cssMap[module]) {
      console.log(`🎨 ${module} 모듈 CSS 로드 시작...`);
      await this.loadMultipleCSS(cssMap[module]);
    } else {
      console.warn(`⚠️ 알 수 없는 모듈: ${module}`);
    }
  },

  // 모든 핵심 CSS 파일 미리 로드
  async preloadAllCSS() {
    console.log('🚀 모든 핵심 CSS 파일 미리 로드 시작...');
    
    const allCSS = [
      '/shared/css/globalBody.css',
      '/shared/css/renderLogin.css',
      '/shared/css/favoriteStore.css',
      '/TLG/styles/mapPanelUI.css',
      '/TLG/styles/renderStoreUI.css',
      '/TLG/styles/renderMyPage.css',
      '/TLG/styles/subMain.css'
    ];

    await this.loadMultipleCSS(allCSS);
    console.log('✅ 모든 핵심 CSS 파일 미리 로드 완료');
  },

  // 인라인 스타일 제거
  removeInlineStyles(selector) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      if (el.style) {
        el.removeAttribute('style');
      }
    });
    console.log(`🧹 인라인 스타일 제거: ${selector} (${elements.length}개 요소)`);
  },

  // CSS 캐시 클리어
  clearCache() {
    this.loadedStyles.clear();
    this.loadingPromises.clear();
    console.log('🧹 CSS 캐시 클리어 완료');
  }
};

// 초기화 시 모든 CSS 미리 로드
document.addEventListener('DOMContentLoaded', () => {
  window.CSSLoader.preloadAllCSS();
});
