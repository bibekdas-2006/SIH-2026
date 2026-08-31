from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlalchemy.orm import Session
from .core.config import settings
from .database import get_db, engine
from .db_seed import init_db
from .models import (
    CitizenReport,
    Alert,
    RoadCorridor,
    HistoricalLandslide,
    Shelter,
    DistrictRecord,
    SensorRecord
)
from .routes import (
    risk_api,
    telemetry_api,
    alerts_api,
    incidents_api,
    roads_api,
    simulation_api,
    ml_api,
    export_api
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables and seed initial data
    init_db()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-Based Early Warning and Landslide Risk Monitoring System in the North Eastern Region of India (SIH 2026)",
    lifespan=lifespan
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(risk_api.router, prefix=settings.API_PREFIX)
app.include_router(telemetry_api.router, prefix=settings.API_PREFIX)
app.include_router(alerts_api.router, prefix=settings.API_PREFIX)
app.include_router(incidents_api.router, prefix=settings.API_PREFIX)
app.include_router(roads_api.router, prefix=settings.API_PREFIX)
app.include_router(simulation_api.router, prefix=settings.API_PREFIX)
app.include_router(ml_api.router, prefix=settings.API_PREFIX)
app.include_router(export_api.router, prefix=settings.API_PREFIX)


@app.get("/")
def root():
    return {
        "status": "ONLINE",
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "region_coverage": "8 North Eastern States of India (NER)",
        "database": "SQLite (SQLAlchemy 2.0)",
        "docs_url": "/docs"
    }


@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    try:
        # Check DB connectivity
        report_count = db.query(CitizenReport).count()
        return {
            "status": "HEALTHY",
            "database": "CONNECTED",
            "timestamp": "2026-08-27T17:45:00Z"
        }
    except Exception as e:
        return {
            "status": "DEGRADED",
            "database_error": str(e),
            "timestamp": "2026-08-27T17:45:00Z"
        }


@app.get("/api/db/stats", tags=["Database Administration"])
def get_database_stats(db: Session = Depends(get_db)):
    """Returns real-time database table row counts and health metadata."""
    return {
        "status": "SUCCESS",
        "engine": str(engine.url),
        "tables": {
            "citizen_reports": db.query(CitizenReport).count(),
            "alerts": db.query(Alert).count(),
            "road_corridors": db.query(RoadCorridor).count(),
            "historical_landslides": db.query(HistoricalLandslide).count(),
            "shelters": db.query(Shelter).count(),
            "districts": db.query(DistrictRecord).count(),
            "sensors": db.query(SensorRecord).count(),
        }
    }
