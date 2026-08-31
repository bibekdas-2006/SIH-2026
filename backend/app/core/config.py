import os
from pydantic import BaseModel

class AppSettings(BaseModel):
    PROJECT_NAME: str = "NER Landslide Early Warning & Risk Monitoring System"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # ML & Risk Thresholds
    RISK_LEVEL_THRESHOLDS: dict = {
        "LOW": 0.25,
        "MEDIUM": 0.50,
        "HIGH": 0.75,
        "CRITICAL": 0.90
    }
    
    # Geotechnical Sensor Critical Triggers
    TILT_RATE_CRITICAL_THRESHOLD: float = 0.45  # degrees per hour
    TILT_ANGLE_MAX_SAFE: float = 12.0          # degrees absolute
    SOIL_MOISTURE_SATURATION_PCT: float = 82.0 # % volumetric saturation
    PORE_PRESSURE_LIMIT_KPA: float = 65.0      # kPa
    VIBRATION_TRIGGER_G: float = 0.28          # acceleration (g)
    RAINFALL_HOURLY_TRIGGER_MM: float = 25.0   # mm/hr
    RAINFALL_24H_TRIGGER_MM: float = 110.0     # mm/24hr (IMD heavy rain)
    
    # Escalation SLA (seconds)
    SLA_ESCALATION_SECONDS: int = 120  # 2 minutes auto-escalation
    
    # Default Coordinates (Center of NER)
    NER_CENTER_LAT: float = 26.2006
    NER_CENTER_LNG: float = 92.9376

settings = AppSettings()
