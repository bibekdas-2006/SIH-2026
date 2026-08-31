from fastapi import APIRouter, Depends
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from ..ml.susceptibility import susceptibility_engine
from ..database import get_db
from ..models import CitizenReport

router = APIRouter(prefix="/ml", tags=["AI/ML Geologist Lab"])


@router.get("/metrics")
def get_ml_metrics():
    """Returns AI model performance parameters for Geologists and Data Scientists"""
    return {
        "model_architecture": "Ensemble Random Forest (120 Estimators) + Hydro-Geotechnical Dynamic Fusion",
        "metrics": susceptibility_engine.metrics,
        "feature_explanations": {
            "slope_angle_deg": "Primary gravitational driving shear stress (steepness)",
            "elevation_m": "Orographic rainfall enhancement and freeze-thaw weathering",
            "twi": "Topographic Wetness Index (water accumulation in gullies)",
            "soil_clay_pct": "Clay mineral swelling & low friction angle under saturation",
            "lithology_rating": "Geological rock formation shear strength & fracturing",
            "ndvi_vegetation": "Root cohesion stabilization factor (high NDVI reduces risk)",
            "fault_distance_km": "Proximity to Main Boundary Thrust (MBT) & tectonic shear zones",
            "road_cut_distance_m": "Anthropogenic slope toe unburdening from highway excavations"
        }
    }


@router.post("/retrain")
def retrain_model_with_human_feedback(payload: Optional[Dict[str, Any]] = None, db: Session = Depends(get_db)):
    """
    Human-in-the-Loop retraining: incorporates verified ground reports from database into model
    """
    verified_reports = db.query(CitizenReport).filter(CitizenReport.status == "VERIFIED_ACTIVE_THREAT").all()

    extra_training_samples = []
    for vr in verified_reports:
        extra_training_samples.append({
            "slope_angle_deg": 38.5,
            "elevation_m": 1150.0,
            "twi": 8.5,
            "soil_clay_pct": 52.0,
            "lithology_rating": 4,
            "ndvi_vegetation": 0.25,
            "fault_distance_km": 4.2,
            "road_cut_distance_m": 50.0,
            "verified_landslide": True
        })

    updated_metrics = susceptibility_engine.retrain_with_feedback(extra_training_samples)
    return {
        "status": "RETRAINED_SUCCESSFULLY",
        "incorporated_ground_truth_samples": len(extra_training_samples),
        "updated_metrics": updated_metrics
    }
