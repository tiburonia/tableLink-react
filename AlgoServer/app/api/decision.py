"""
Decision API Endpoints
Node가 부르는 진짜 입구 - API는 얇아야 함
"""
from fastapi import APIRouter
from typing import List

from app.models.store import (
    DecisionRequest,
    DecisionResponse,
    StoreResult
)
from app.decision.relaxed_store import decide_relaxed

router = APIRouter(prefix="/decision", tags=["Decision"])


@router.post("/relaxed-stores", response_model=DecisionResponse)
def relaxed_stores(req: DecisionRequest):
    """
    여유로운 맛집 판단 API
    
    - 점유율 40% 이하: 여유로움
    - 점유율 60% 이하 + 최근 착석 없음: 여유로움
    """
    return decide_relaxed(req)


@router.post("/scored-stores", response_model=DecisionResponse)
def scored_stores(req: DecisionRequest):
    """
    점수 기반 맛집 판단 API (v1)
    
    점수 계산 후 threshold 이상인 매장 반환
    """
    from app.decision.scorer import decide_by_score
    return decide_by_score(req)
