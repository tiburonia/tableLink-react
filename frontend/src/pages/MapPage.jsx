
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './MapPage.css';

export default function MapPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const naverMapRef = useRef(null);
  const markersRef = useRef([]);
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);

  // 네이버 지도 초기화
  useEffect(() => {

    const initMap = () => {
      if (!window.naver || !window.naver.maps) {
        console.error('네이버 지도 API가 로드되지 않았습니다');
        return;
      }

      const mapOptions = {
        center: new window.naver.maps.LatLng(37.5665, 126.9780), // 서울 중심
        zoom: 16,
        minZoom: 10,
        maxZoom: 19,
      };

      const map = new window.naver.maps.Map(mapRef.current, mapOptions);
      naverMapRef.current = map;

      // 지도 이동/줌 이벤트
      window.naver.maps.Event.addListener(map, 'idle', () => {
        loadStores();
      });

      // 초기 매장 로드
      loadStores();
    };

    // 네이버 지도 스크립트 로드
    if (!document.getElementById('naver-map-script')) {
      const script = document.createElement('script');
      script.id = 'naver-map-script';
      script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=y0z49cwule`;
      script.onload = initMap;
      document.head.appendChild(script);
    } else {
      initMap();
    }

    return () => {
      // 클린업
      if (naverMapRef.current) {
        naverMapRef.current = null;
      }
    };
  }, []);

  // 매장 데이터 로드
  const loadStores = async () => {
    if (!naverMapRef.current) return;

    const map = naverMapRef.current;
    const bounds = map.getBounds();
    const sw = bounds.getSW();
    const ne = bounds.getNE();

    try {
      const response = await fetch(
        `/api/stores?bbox=${sw.lng()},${sw.lat()},${ne.lng()},${ne.lat()}`
      );
      const data = await response.json();

      if (data.success) {
        setStores(data.stores || []);
        updateMarkers(data.stores || []);
      }
    } catch (error) {
      console.error('매장 데이터 로드 실패:', error);
    }
  };

  // 마커 업데이트
  const updateMarkers = (storeList) => {
    // 기존 마커 제거
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // 새 마커 생성
    storeList.forEach(store => {
      if (!store.latitude || !store.longitude) return;

      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(
          parseFloat(store.latitude),
          parseFloat(store.longitude)
        ),
        map: naverMapRef.current,
        title: store.name,
        icon: {
          content: `
            <div class="custom-marker ${store.isOpen ? 'open' : 'closed'}">
              <div class="marker-inner">${store.name}</div>
            </div>
          `,
          anchor: new window.naver.maps.Point(30, 40),
        },
      });

      // 마커 클릭 이벤트
      window.naver.maps.Event.addListener(marker, 'click', () => {
        setSelectedStore(store);
        naverMapRef.current.panTo(marker.getPosition());
      });

      markersRef.current.push(marker);
    });
  };

  // 매장 상세 페이지로 이동
  const goToStore = (storeId) => {
    navigate(`/store/${storeId}`);
  };

  return (
    <div className="map-page">
      {/* 상단 헤더 */}
      <header className="map-header">
        <h1>TableLink</h1>
        <div className="header-actions">
          <button onClick={() => navigate('/mypage')} className="icon-btn">
            👤
          </button>
        </div>
      </header>

      {/* 지도 영역 */}
      <div ref={mapRef} className="map-container"></div>

      {/* 매장 목록 패널 */}
      <div className={`store-panel ${selectedStore ? 'expanded' : ''}`}>
        {selectedStore ? (
          <div className="store-detail">
            <button 
              className="close-btn" 
              onClick={() => setSelectedStore(null)}
            >
              ✕
            </button>
            <h3>{selectedStore.name}</h3>
            <p className="category">
              {selectedStore.category || '분류 없음'}
            </p>
            <p className="rating">
              ⭐ {selectedStore.ratingAverage || '0.0'} ({selectedStore.reviewCount || 0}개 리뷰)
            </p>
            <p className="status">
              {selectedStore.isOpen ? '🟢 영업 중' : '🔴 영업 종료'}
            </p>
            <button 
              className="detail-btn"
              onClick={() => goToStore(selectedStore.id)}
            >
              상세 보기 →
            </button>
          </div>
        ) : (
          <div className="store-list">
            <h3>주변 매장 ({stores.length})</h3>
            <div className="store-cards">
              {stores.slice(0, 5).map(store => (
                <div 
                  key={store.id} 
                  className="store-card"
                  onClick={() => setSelectedStore(store)}
                >
                  <h4>{store.name}</h4>
                  <p className="category">{store.category || '분류 없음'}</p>
                  <p className="rating">
                    ⭐ {store.ratingAverage || '0.0'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
