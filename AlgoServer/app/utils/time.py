"""
Time Utils - 시간 계산
"""
from datetime import datetime, timezone
from typing import Optional

from app.config import NO_SEATING_MINUTES


def minutes_since(dt: Optional[datetime]) -> float:
    """
    특정 시간으로부터 경과된 분 계산
    
    Args:
        dt: 기준 시간 (None이면 무한대 반환)
        
    Returns:
        경과 시간 (분)
    """
    if dt is None:
        return float('inf')
    
    now = datetime.now(timezone.utc)
    
    # timezone-aware로 변환
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    
    delta = now - dt
    return delta.total_seconds() / 60


def is_no_recent_seating(last_seated_at: Optional[datetime]) -> bool:
    """
    최근 착석이 없었는지 확인
    
    Args:
        last_seated_at: 마지막 착석 시간
        
    Returns:
        최근 N분간 착석이 없었으면 True
    """
    minutes = minutes_since(last_seated_at)
    return minutes >= NO_SEATING_MINUTES
