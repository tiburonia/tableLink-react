"""
Decision Base - 공통 인터페이스
"""
from abc import ABC, abstractmethod
from typing import List
from app.models.store import DecisionRequest, StoreResult


class BaseDecider(ABC):
    """결정 로직의 기본 인터페이스"""
    
    @abstractmethod
    def decide(self, req: DecisionRequest) -> List[StoreResult]:
        """
        결정 로직 실행
        
        Args:
            req: 결정 요청 데이터
            
        Returns:
            판단 결과 리스트
        """
        pass
    
    @abstractmethod
    def get_name(self) -> str:
        """결정 로직 이름 반환"""
        pass
