export function initKakaoMap(container, { lat, lng, level }) {
  if (!window.kakao || !window.kakao.maps) {
    throw new Error('Kakao Maps SDK is not loaded');
  }
  
  const map = new kakao.maps.Map(container, {
    center: new kakao.maps.LatLng(lat, lng),
    level
  });
  
  return map;
}

export function createMarker(map, lat, lng, options = {}) {
  const position = new kakao.maps.LatLng(lat, lng);
  const marker = new kakao.maps.Marker({
    position,
    map,
    ...options
  });
  return marker;
}

export function createInfoWindow(content) {
  return new kakao.maps.InfoWindow({
    content,
    removable: true
  });
}

export function addClickListener(target, callback) {
  kakao.maps.event.addListener(target, 'click', callback);
}

export function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => reject(error),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}
