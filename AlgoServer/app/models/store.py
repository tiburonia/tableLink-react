"""
Store Models - Node ↔ Algo 계약
AlgoServer는 DB 모른다. Node가 전부 만들어서 준다.
"""
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class Store(BaseModel):
    """매장 정보 (Node에서 전달)"""
    id: int = Field(..., description="매장 ID")
    lat: float = Field(..., description="위도")
    lng: float = Field(..., description="경도")
    rating: float = Field(default=0.0, description="평점 (0~5)")
    table_total: int = Field(..., description="전체 테이블 수")
    table_occupied: int = Field(..., description="사용 중인 테이블 수")
    last_seated_at: Optional[datetime] = Field(
        default=None, 
        description="마지막 착석 시간"
    )


class DecisionRequest(BaseModel):
    """결정 요청 데이터"""
    user_lat: float = Field(..., description="사용자 위도")
    user_lng: float = Field(..., description="사용자 경도")
    stores: List[Store] = Field(..., description="판단 대상 매장 목록")
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_lat": 37.5665,
                "user_lng": 126.9780,
                "stores": [
                    {
                        "id": 1,
                        "lat": 37.5670,
                        "lng": 126.9785,
                        "rating": 4.5,
                        "table_total": 10,
                        "table_occupied": 3,
                        "last_seated_at": "2025-12-29T10:00:00Z"
                    }
                ]
            }
        }


class StoreResult(BaseModel):
    """매장 판단 결과"""
    id: int = Field(..., description="매장 ID")
    distance_km: float = Field(..., description="사용자와의 거리 (km)")
    occupancy_rate: float = Field(..., description="점유율 (%)")
    is_relaxed: bool = Field(..., description="여유로운 매장 여부")
    reason: str = Field(..., description="판단 이유")
    score: Optional[float] = Field(default=None, description="점수 (v1)")


class DecisionResponse(BaseModel):
    """결정 응답 데이터"""
    success: bool = Field(..., description="성공 여부")
    count: int = Field(..., description="결과 개수")
    stores: List[StoreResult] = Field(..., description="판단 결과 목록")
