import { mapService } from '../services/mapService.js';
import { renderMapShell, renderMarkers } from '../views/MapView.js';

export async function mountMap(root) {
  renderMapShell(root);
  
  const mapContainer = document.getElementById('map');
  if (!mapContainer) {
    console.error('Map container not found');
    return;
  }
  
  const map = mapService.init(mapContainer);
  
  kakao.maps.event.addListener(map, 'idle', async () => {
    try {
      const stores = await mapService.loadStoresInView(map);
      renderMarkers(map, stores);
    } catch (error) {
      console.error('Failed to load stores:', error);
    }
  });
  
  return map;
}

export async function panToLocation(map, lat, lng) {
  mapService.panTo(map, lat, lng);
}

export async function refreshStores(map) {
  const stores = await mapService.loadStoresInView(map);
  renderMarkers(map, stores);
}
