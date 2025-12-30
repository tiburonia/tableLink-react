"""
TL Decision Engine - FastAPI Entry Point
Stateless Decision Engine for TableLink
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.decision import router

app = FastAPI(
    title="TL Decision Engine",
    description="Stateless Decision Engine for TableLink - 결정만 한다",
    version="0.1.0"
)

# CORS 설정 (Node 서버에서 호출)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(router)


@app.get("/health")
def health():
    """헬스체크 - LB 연결용"""
    return {"status": "ok"}


@app.get("/")
def root():
    """루트 엔드포인트"""
    return {
        "service": "TL Decision Engine",
        "version": "0.1.0",
        "status": "running"
    }
