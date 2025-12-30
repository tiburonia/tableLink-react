"""
Config - 설정값 분리
하드코딩 ❌ / 설정 분리 ✅
나중에 실험/튜닝 쉬움
"""
import os

# ============================================
# Distance Settings
# ============================================
RELAXED_MAX_DISTANCE_KM = float(os.getenv("RELAXED_MAX_DISTANCE_KM", "1.0"))

# ============================================
# Time Settings
# ============================================
NO_SEATING_MINUTES = int(os.getenv("NO_SEATING_MINUTES", "15"))

# ============================================
# Score Settings (v1)
# ============================================
SCORE_THRESHOLD = float(os.getenv("SCORE_THRESHOLD", "50.0"))

# 가중치 (합계 = 1.0)
WEIGHT_DISTANCE = float(os.getenv("WEIGHT_DISTANCE", "0.25"))
WEIGHT_OCCUPANCY = float(os.getenv("WEIGHT_OCCUPANCY", "0.35"))
WEIGHT_RATING = float(os.getenv("WEIGHT_RATING", "0.20"))
WEIGHT_RECENT_SEATING = float(os.getenv("WEIGHT_RECENT_SEATING", "0.20"))

# ============================================
# Server Settings
# ============================================
HOST = os.getenv("ALGO_HOST", "0.0.0.0")
PORT = int(os.getenv("ALGO_PORT", "8000"))
DEBUG = os.getenv("ALGO_DEBUG", "false").lower() == "true"
