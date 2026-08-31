from typing import Dict, Any, Optional
from ..core.config import settings

class FastPathAnomalyDetector:
    """
    Evaluates streaming sensor telemetry at high frequency (edge / gateway).
    If critical physical thresholds (tilt acceleration, seismic tremor, pore burst)
    are breached, triggers an instant CRITICAL alert bypassing slow ML batch cycles.
    """
    def __init__(self):
        self.tilt_rate_threshold = settings.TILT_RATE_CRITICAL_THRESHOLD
        self.tilt_angle_limit = settings.TILT_ANGLE_MAX_SAFE
        self.vibration_threshold = settings.VIBRATION_TRIGGER_G
        self.pore_pressure_threshold = settings.PORE_PRESSURE_LIMIT_KPA
        self.moisture_critical = settings.SOIL_MOISTURE_SATURATION_PCT

    def inspect_sensor_telemetry(self, sensor_data: Dict[str, Any]) -> Dict[str, Any]:
        tilt_rate = float(sensor_data.get("tilt_rate_deg_hr", 0.0))
        tilt_angle = float(sensor_data.get("tilt_angle_deg", 0.0))
        vibration = float(sensor_data.get("vibration_acceleration_g", 0.0))
        pore_pressure = float(sensor_data.get("pore_water_pressure_kpa", 0.0))
        moisture = float(sensor_data.get("soil_moisture_pct", 0.0))

        anomaly_detected = False
        reasons = []

        if tilt_rate >= self.tilt_rate_threshold:
            anomaly_detected = True
            reasons.append(f"Accelerated slope displacement: {tilt_rate:.2f}°/hr (Threshold: {self.tilt_rate_threshold}°/hr)")

        if tilt_angle >= self.tilt_angle_limit:
            anomaly_detected = True
            reasons.append(f"Excessive cumulative tilt angle: {tilt_angle:.1f}° (Max Safe: {self.tilt_angle_limit}°)")

        if vibration >= self.vibration_threshold:
            anomaly_detected = True
            reasons.append(f"Micro-seismic / Ground Vibration spike: {vibration:.2f}g (Trigger: {self.vibration_threshold}g)")

        if pore_pressure >= self.pore_pressure_threshold and moisture >= self.moisture_critical:
            anomaly_detected = True
            reasons.append(f"Piezometric pore water surge: {pore_pressure:.1f} kPa with {moisture:.1f}% soil saturation")

        return {
            "is_anomaly": anomaly_detected,
            "severity": "CRITICAL" if anomaly_detected else "NORMAL",
            "fast_path_alert_required": anomaly_detected,
            "anomaly_reasons": reasons,
            "sensor_id": sensor_data.get("id"),
            "district_name": sensor_data.get("district_name"),
            "timestamp": sensor_data.get("last_ping_utc")
        }

anomaly_detector = FastPathAnomalyDetector()
