from fastapi import APIRouter, HTTPException, Query
from typing import Optional, Dict, Any, List
import json
import os
from ..ml.susceptibility import susceptibility_engine
from ..ml.dynamic_risk import dynamic_risk_engine
from ..simulator.iot_streamer import stream_simulator

router = APIRouter(prefix="/risk", tags=["Risk & Predictions"])

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")

@router.get("/districts")
def get_all_districts():
    """Returns all 8 NER states and high-risk hill districts with live computed risk"""
    stream_simulator.tick_stream()
    stream_simulator.recompute_all_districts()
    return {
        "count": len(stream_simulator.districts),
        "districts": stream_simulator.districts
    }

@router.get("/districts/{district_id}")
def get_district_detail(district_id: str):
    """Deep drilldown for a specific district"""
    stream_simulator.tick_stream()
    stream_simulator.recompute_all_districts()
    
    for d in stream_simulator.districts:
        if d["id"] == district_id:
            # Attach related sensors and their history
            matched_sensors = [s for s in stream_simulator.sensors if s["district_id"] == district_id]
            sensors_with_history = []
            for s in matched_sensors:
                s_copy = dict(s)
                s_copy["history"] = stream_simulator.history_buffers.get(s["id"], [])
                sensors_with_history.append(s_copy)
            
            return {
                "district": d,
                "sensors": sensors_with_history,
                "lead_time_projections": d.get("lead_time_projections", []),
                "weather": d.get("weather", {})
            }
            
    raise HTTPException(status_code=404, detail=f"District {district_id} not found")

@router.post("/predict/custom")
def predict_custom_point(payload: Dict[str, Any]):
    """
    On-demand AI inference for any arbitrary coordinate or user-entered terrain features
    """
    slope = float(payload.get("slope_angle_deg", 35.0))
    elevation = float(payload.get("elevation_m", 1200.0))
    twi = float(payload.get("twi", 7.5))
    soil_clay = float(payload.get("soil_clay_pct", 40.0))
    lithology = int(payload.get("lithology_rating", 3))
    ndvi = float(payload.get("ndvi_vegetation", 0.45))
    fault_dist = float(payload.get("fault_distance_km", 8.0))
    road_dist = float(payload.get("road_cut_distance_m", 150.0))

    # Real-time factors
    rain_24h = float(payload.get("rainfall_24h_mm", 45.0))
    rain_72h = float(payload.get("rainfall_72h_mm", 90.0))
    rain_fc = float(payload.get("rainfall_forecast_24h_mm", 60.0))
    moist = float(payload.get("soil_moisture_pct", 65.0))
    tilt_rate = float(payload.get("tilt_rate_deg_hr", 0.15))
    pore_press = float(payload.get("pore_water_pressure_kpa", 38.0))
    vib = float(payload.get("vibration_g", 0.05))

    # 1. Compute Static ML Susceptibility
    susceptibility_prob = susceptibility_engine.predict({
        "slope_angle_deg": slope,
        "elevation_m": elevation,
        "twi": twi,
        "soil_clay_pct": soil_clay,
        "lithology_rating": lithology,
        "ndvi_vegetation": ndvi,
        "fault_distance_km": fault_dist,
        "road_cut_distance_m": road_dist
    })

    # 2. Dynamic Fusion Risk
    dynamic_res = dynamic_risk_engine.compute_dynamic_risk(
        static_susceptibility=susceptibility_prob,
        rainfall_24h_mm=rain_24h,
        rainfall_72h_mm=rain_72h,
        rainfall_forecast_24h_mm=rain_fc,
        soil_moisture_pct=moist,
        tilt_rate_deg_hr=tilt_rate,
        pore_water_pressure_kpa=pore_press,
        vibration_g=vib
    )

    return {
        "static_susceptibility_score": susceptibility_prob,
        "dynamic_risk": dynamic_res,
        "model_confidence": 0.912,
        "algorithm": "Random Forest + Hydro-Geotechnical Dynamic Fusion"
    }

@router.get("/summary")
def get_regional_summary():
    """Aggregated NER risk statistics for the Executive & SDMA dashboard"""
    stream_simulator.tick_stream()
    stream_simulator.recompute_all_districts()
    
    total_districts = len(stream_simulator.districts)
    critical_count = sum(1 for d in stream_simulator.districts if d["active_risk_level"] == "CRITICAL")
    high_count = sum(1 for d in stream_simulator.districts if d["active_risk_level"] == "HIGH")
    medium_count = sum(1 for d in stream_simulator.districts if d["active_risk_level"] == "MEDIUM")
    low_count = sum(1 for d in stream_simulator.districts if d["active_risk_level"] == "LOW")
    
    total_pop_at_risk = sum(d["population_at_risk"] for d in stream_simulator.districts if d["active_risk_level"] in ["HIGH", "CRITICAL"])
    
    return {
        "total_monitored_districts": total_districts,
        "critical_districts": critical_count,
        "high_risk_districts": high_count,
        "medium_risk_districts": medium_count,
        "low_risk_districts": low_count,
        "total_population_at_high_risk": total_pop_at_risk,
        "current_scenario": stream_simulator.scenario,
        "overall_ner_status": "CRITICAL" if critical_count > 0 else "ELEVATED" if high_count > 0 else "NORMAL"
    }
