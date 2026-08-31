from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from ..simulator.iot_streamer import stream_simulator
from ..ml.anomaly_detector import anomaly_detector

router = APIRouter(prefix="/telemetry", tags=["IoT Telemetry & Sensors"])

@router.get("/sensors")
def get_all_sensors():
    """Returns real-time telemetry from all ground IoT stations"""
    stream_simulator.tick_stream()
    
    # Run fast-path anomaly inspector on each sensor
    enriched_sensors = []
    for s in stream_simulator.sensors:
        s_copy = dict(s)
        anomaly_info = anomaly_detector.inspect_sensor_telemetry(s)
        s_copy["anomaly_check"] = anomaly_info
        enriched_sensors.append(s_copy)

    return {
        "count": len(enriched_sensors),
        "sensors": enriched_sensors
    }

@router.get("/sensors/{sensor_id}")
def get_sensor_detail(sensor_id: str):
    """Detailed time-series telemetry buffer for graphing"""
    stream_simulator.tick_stream()
    for s in stream_simulator.sensors:
        if s["id"] == sensor_id:
            history = stream_simulator.history_buffers.get(sensor_id, [])
            anomaly_info = anomaly_detector.inspect_sensor_telemetry(s)
            return {
                "sensor": s,
                "anomaly_check": anomaly_info,
                "history": history
            }
    raise HTTPException(status_code=404, detail=f"Sensor {sensor_id} not found")

@router.post("/sensors/{sensor_id}/inject_anomaly")
def inject_single_sensor_anomaly(sensor_id: str):
    """Developer/Tester tool to force trigger a slope failure anomaly on a specific sensor"""
    for s in stream_simulator.sensors:
        if s["id"] == sensor_id:
            s["tilt_rate_deg_hr"] = 0.95
            s["tilt_angle_deg"] = 19.2
            s["vibration_acceleration_g"] = 0.52
            s["soil_moisture_pct"] = 97.5
            s["pore_water_pressure_kpa"] = 89.0
            s["status"] = "CRITICAL"
            stream_simulator.tick_stream()
            stream_simulator.recompute_all_districts()
            
            anomaly_info = anomaly_detector.inspect_sensor_telemetry(s)
            return {
                "status": "ANOMALY_TRIGGERED",
                "sensor": s,
                "anomaly_info": anomaly_info
            }
    raise HTTPException(status_code=404, detail=f"Sensor {sensor_id} not found")
