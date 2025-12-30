"""
Score-based Decision (v1: Score 기반)
점수 계산 로직 - 진화의 다음 단계
"""
from typing import List
from datetime import datetime, timezone

from app.models.store import DecisionRequest, DecisionResponse, StoreResult
from app.utils.geo import distance_km
from app.utils.time import minutes_since
from app.config import (
    RELAXED_MAX_DISTANCE_KM,
    SCORE_THRESHOLD,
    WEIGHT_DISTANCE,
    WEIGHT_OCCUPANCY,
    WEIGHT_RATING,
    WEIGHT_RECENT_SEATING
)


def calculate_score(
    distance: float,
    occupancy_rate: float,
    rating: float,
    minutes_since_seating: float
) -> float:
    """
    매장 점수 계산
    
    점수 = 거리점수 + 점유율점수 + 평점점수 + 착석시간점수
    
    각 점수는 0~100 정규화 후 가중치 적용
    """
    # 거리 점수 (가까울수록 높음, 0~1km → 100~0)
    distance_score = max(0, 100 - (distance / RELAXED_MAX_DISTANCE_KM * 100))
    
    # 점유율 점수 (낮을수록 높음, 0~100% → 100~0)
    occupancy_score = max(0, 100 - occupancy_rate)
    
    # 평점 점수 (높을수록 높음, 0~5 → 0~100)
    rating_score = (rating / 5) * 100
    
    # 최근 착석 시간 점수 (오래될수록 높음, 0~60분 → 0~100)
    seating_score = min(100, (minutes_since_seating / 60) * 100)
    
    # 가중치 적용 합산
    total_score = (
        distance_score * WEIGHT_DISTANCE +
        occupancy_score * WEIGHT_OCCUPANCY +
        rating_score * WEIGHT_RATING +
        seating_score * WEIGHT_RECENT_SEATING
    )
    
    return round(total_score, 2)


def decide_by_score(req: DecisionRequest) -> DecisionResponse:
    """
    점수 기반 맛집 판단
    
    1. 각 매장의 점수 계산
    2. threshold 이상인 매장만 반환
    3. 점수 높은 순 정렬
    """
    result: List[StoreResult] = []
    
    for store in req.stores:
        # 거리 계산
        dist = distance_km(
            req.user_lat, req.user_lng,
            store.lat, store.lng
        )
        
        # 거리 필터 (1차 컷오프)
        if dist > RELAXED_MAX_DISTANCE_KM:
            continue
        
        # 점유율 계산
        if store.table_total == 0:
            continue
            
        occupancy_rate = (store.table_occupied / store.table_total) * 100
        
        # 최근 착석 시간 계산
        mins_since_seating = minutes_since(store.last_seated_at)
        
        # 점수 계산
        score = calculate_score(
            distance=dist,
            occupancy_rate=occupancy_rate,
            rating=store.rating,
            minutes_since_seating=mins_since_seating
        )
        
        # threshold 이상만 포함
        if score >= SCORE_THRESHOLD:
            result.append(StoreResult(
                id=store.id,
                distance_km=round(dist, 2),
                occupancy_rate=round(occupancy_rate, 1),
                is_relaxed=True,
                reason="high_score",
                score=score
            ))
    
    # 점수 높은 순 정렬
    result.sort(key=lambda x: x.score or 0, reverse=True)
    
    return DecisionResponse(
        success=True,
        count=len(result),
        stores=result
    )
