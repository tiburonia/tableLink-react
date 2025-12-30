"""
Relaxed Store Decision (v0: Rule 기반)
여유로운 맛집 판단 로직
"""
from typing import List
from datetime import datetime, timezone

from app.models.store import DecisionRequest, DecisionResponse, StoreResult
from app.utils.geo import distance_km
from app.utils.time import is_no_recent_seating
from app.config import RELAXED_MAX_DISTANCE_KM


def decide_relaxed(req: DecisionRequest) -> DecisionResponse:
    """
    여유로운 맛집 판단 (Rule 기반)
    
    판단 기준:
    1. 거리 1km 이내
    2. 점유율 40% 이하 → 여유로움
    3. 점유율 60% 이하 + 최근 15분간 착석 없음 → 여유로움
    """
    result: List[StoreResult] = []
    
    for store in req.stores:
        # 거리 계산
        dist = distance_km(
            req.user_lat, req.user_lng,
            store.lat, store.lng
        )
        
        # 거리 필터
        if dist > RELAXED_MAX_DISTANCE_KM:
            continue
        
        # 점유율 계산
        if store.table_total == 0:
            continue
            
        occupancy = (store.table_occupied / store.table_total) * 100
        
        # 판단 로직
        is_relaxed = False
        reason = ""
        
        if occupancy <= 40:
            is_relaxed = True
            reason = "low_occupancy"
        elif occupancy <= 60 and is_no_recent_seating(store.last_seated_at):
            is_relaxed = True
            reason = "moderate_with_no_recent_seating"
        
        if is_relaxed:
            result.append(StoreResult(
                id=store.id,
                distance_km=round(dist, 2),
                occupancy_rate=round(occupancy, 1),
                is_relaxed=True,
                reason=reason,
                score=None  # Rule 기반이라 점수 없음
            ))
    
    # 거리순 정렬
    result.sort(key=lambda x: x.distance_km)
    
    return DecisionResponse(
        success=True,
        count=len(result),
        stores=result
    )
