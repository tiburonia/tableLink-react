"""
Geo Utils - 거리 계산
"""
import math


def distance_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """
    두 좌표 간 거리 계산 (Haversine formula)
    
    Args:
        lat1, lng1: 첫 번째 좌표 (위도, 경도)
        lat2, lng2: 두 번째 좌표 (위도, 경도)
        
    Returns:
        거리 (km)
    """
    R = 6371  # 지구 반지름 (km)
    
    # 라디안 변환
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lng = math.radians(lng2 - lng1)
    
    # Haversine formula
    a = (
        math.sin(delta_lat / 2) ** 2 +
        math.cos(lat1_rad) * math.cos(lat2_rad) *
        math.sin(delta_lng / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c


def is_within_radius(
    user_lat: float, 
    user_lng: float, 
    target_lat: float, 
    target_lng: float, 
    radius_km: float
) -> bool:
    """
    대상이 반경 내에 있는지 확인
    
    Args:
        user_lat, user_lng: 사용자 좌표
        target_lat, target_lng: 대상 좌표
        radius_km: 반경 (km)
        
    Returns:
        반경 내 여부
    """
    dist = distance_km(user_lat, user_lng, target_lat, target_lng)
    return dist <= radius_km
