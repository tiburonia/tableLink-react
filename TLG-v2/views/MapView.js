import { SearchBar } from './partials/SearchBar.js';

export function renderMapShell(root) {
  root.innerHTML = `
    <main id="content">
      <div id="map" class="map"></div>
      <div class="searchbar-container">
        ${SearchBar('매장 검색')}
      </div>
    </main>
    <nav id="bottomBar" class="bottombar">
      <button data-route="" class="bottombar__btn active">
        <span>🏠</span>
        <span>홈</span>
      </button>
      <button data-route="search" class="bottombar__btn">
        <span>🔍</span>
        <span>검색</span>
      </button>
      <button data-route="cart" class="bottombar__btn">
        <span>🛒</span>
        <span>장바구니</span>
      </button>
      <button data-route="login" class="bottombar__btn">
        <span>👤</span>
        <span>마이</span>
      </button>
    </nav>
  `;
  
  document.querySelectorAll('.bottombar__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const route = btn.dataset.route;
      window.location.hash = `#/${route}`;
    });
  });
}

let markerManager = null;

export function renderMarkers(map, stores) {
  if (!markerManager) {
    markerManager = {
      markers: [],
      clear() {
        this.markers.forEach(marker => marker.setMap(null));
        this.markers = [];
      }
    };
  }
  
  markerManager.clear();
  
  stores.forEach(store => {
    const position = new kakao.maps.LatLng(store.latitude, store.longitude);
    const marker = new kakao.maps.Marker({
      position,
      map
    });
    
    kakao.maps.event.addListener(marker, 'click', () => {
      console.log('Store clicked:', store);
    });
    
    markerManager.markers.push(marker);
  });
  
  console.log(`Rendered ${stores.length} markers`);
}
