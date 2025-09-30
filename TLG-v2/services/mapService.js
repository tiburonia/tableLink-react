import { initKakaoMap } from '../integrations/kakaoMap.js';
import { storeRepo } from '../repositories/storeRepo.js';

export const mapService = {
  init(container, options = {}) {
    const defaultOptions = { 
      lat: 37.5665, 
      lng: 126.9780, 
      level: 3 
    };
    return initKakaoMap(container, { ...defaultOptions, ...options });
  },
  
  async loadStoresInView(map) {
    const bounds = map.getBounds();
    const sw = `${bounds.getSouthWest().getLat()},${bounds.getSouthWest().getLng()}`;
    const ne = `${bounds.getNorthEast().getLat()},${bounds.getNorthEast().getLng()}`;
    const data = await storeRepo.byViewport({ sw, ne });
    return data?.stores ?? [];
  },
  
  panTo(map, lat, lng) {
    const position = new kakao.maps.LatLng(lat, lng);
    map.panTo(position);
  },
  
  setCenter(map, lat, lng) {
    const position = new kakao.maps.LatLng(lat, lng);
    map.setCenter(position);
  },
  
  getCurrentCenter(map) {
    const center = map.getCenter();
    return {
      lat: center.getLat(),
      lng: center.getLng()
    };
  }
};
