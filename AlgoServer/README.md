# TL Decision Engine (AlgoServer)

Stateless Decision Engine for TableLink

## 설계 원칙

1. **Stateless** - 상태 저장 ❌, 판단만 한다
2. **Single Responsibility** - "결정만" 한다
3. **API First** - Node가 주인, Algo는 부품
4. **점진적 진화 가능** - Rule → Score → Model

## 폴더 구조

```
AlgoServer/
├─ app/
│  ├─ main.py                # FastAPI entry
│  ├─ api/
│  │  └─ decision.py         # API endpoint
│  ├─ decision/
│  │  ├─ relaxed_store.py    # 여유로운 맛집 판단
│  │  ├─ scorer.py           # 점수 계산 (v1)
│  │  └─ base.py             # 공통 인터페이스
│  ├─ models/
│  │  └─ store.py            # 입력 데이터 스키마
│  ├─ utils/
│  │  ├─ geo.py              # 거리 계산
│  │  └─ time.py             # 시간 계산
│  └─ config.py              # threshold / 옵션
├─ requirements.txt
└─ README.md
```

## 설치 및 실행

```bash
# 가상환경 생성
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 서버 실행
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## API 엔드포인트

### Health Check
```
GET /health
```

### 여유로운 맛집 판단 (v0: Rule 기반)
```
POST /decision/relaxed-stores
```

**Request Body:**
```json
{
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
```

**Response:**
```json
{
  "success": true,
  "count": 1,
  "stores": [
    {
      "id": 1,
      "distance_km": 0.05,
      "occupancy_rate": 30.0,
      "is_relaxed": true,
      "reason": "low_occupancy",
      "score": null
    }
  ]
}
```

### 점수 기반 판단 (v1: Score 기반)
```
POST /decision/scored-stores
```

## Node.js 연동 예시

```javascript
// Node 서버에서 호출
async function getRelaxedStores(userLat, userLng, stores) {
  try {
    const response = await axios.post('http://localhost:8000/decision/relaxed-stores', {
      user_lat: userLat,
      user_lng: userLng,
      stores: stores
    });
    return response.data;
  } catch (error) {
    // Decision Engine은 "있으면 좋은 서버"
    // 없다고 서비스 멈추면 안 됨
    console.error('Decision Engine 호출 실패, 폴백 로직 실행');
    return fallbackLocalLogic(stores);
  }
}
```

## 설정값 (config.py)

| 설정 | 기본값 | 설명 |
|------|--------|------|
| `RELAXED_MAX_DISTANCE_KM` | 1.0 | 최대 거리 (km) |
| `NO_SEATING_MINUTES` | 15 | 최근 착석 없음 기준 (분) |
| `SCORE_THRESHOLD` | 50.0 | 점수 threshold |
| `WEIGHT_DISTANCE` | 0.25 | 거리 가중치 |
| `WEIGHT_OCCUPANCY` | 0.35 | 점유율 가중치 |
| `WEIGHT_RATING` | 0.20 | 평점 가중치 |
| `WEIGHT_RECENT_SEATING` | 0.20 | 착석 시간 가중치 |

## 진화 경로

| 단계 | 방식 | 상태 |
|------|------|------|
| v0 | Rule 기반 | ✅ 완료 |
| v1 | Score 기반 | ✅ 완료 |
| v2 | ML 모델 | 🔜 예정 |
| v3 | 시간대/요일 가중치 | 🔜 예정 |
| v4 | 개인화 | 🔜 예정 |

## 핵심 원칙

**AlgoServer는:**
- 인증 ❌
- DB ❌
- 트랜잭션 ❌
- 상태 ❌

**AlgoServer는 오직:**
- 결정 ✅
- 판단 ✅
- 점수 계산 ✅

> 이 경계 깨지는 순간 → 다시 단일 서버 지옥으로 돌아감
