import { appState } from '../state/appState.js';
import { regionRepo } from '../repositories/regionRepo.js';

export const locationService = {
  async getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            text: '현재 위치'
          };
          appState.setLocation(location);
          resolve(location);
        },
        (error) => reject(error),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  },
  
  async getEupmyeondongCenter(sido, sigungu, eupmyeondong) {
    const data = await regionRepo.eupmyeondongCenter(sido, sigungu, eupmyeondong);
    if (data?.lat && data?.lng) {
      const location = {
        lat: data.lat,
        lng: data.lng,
        text: `${sido} ${sigungu} ${eupmyeondong}`
      };
      appState.setLocation(location);
      return location;
    }
    return null;
  },
  
  setLocation(lat, lng, text = '') {
    const location = { lat, lng, text };
    appState.setLocation(location);
    return location;
  },
  
  getLocation() {
    const state = appState.get();
    return state.location;
  }
};
