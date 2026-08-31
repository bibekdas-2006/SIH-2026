import numpy as np
from typing import Dict, Any, List

class DynamicRiskEngine:
    """
    Fuses static geological susceptibility with dynamic meteorology (IMD rainfall)
    and real-time IoT geotechnical ground telemetry.
    """
    def __init__(self):
        self.weights = {
            "susceptibility": 0.28,
            "antecedent_rain": 0.24,
            "forecast_rain": 0.16,
            "soil_moisture": 0.16,
            "geotechnical_creep": 0.16
        }

    def compute_dynamic_risk(
        self,
        static_susceptibility: float,
        rainfall_24h_mm: float,
        rainfall_72h_mm: float,
        rainfall_forecast_24h_mm: float,
        soil_moisture_pct: float,
        tilt_rate_deg_hr: float,
        pore_water_pressure_kpa: float,
        vibration_g: float = 0.0
    ) -> Dict[str, Any]:
        # 1. Normalized Antecedent Rain Factor (IMD Hill Warning Thresholds)
        f_rain_ant = min(1.0, (rainfall_24h_mm / 110.0) * 0.65 + (rainfall_72h_mm / 220.0) * 0.35)
        
        # 2. Forecast Rain Factor
        f_rain_fc = min(1.0, rainfall_forecast_24h_mm / 90.0)

        # 3. Soil Saturation Factor (Critical threshold starts above 60%)
        f_soil = np.clip((soil_moisture_pct - 35.0) / 55.0, 0.0, 1.0)

        # 4. Geotechnical Creep (Tilt velocity + Piezometric head)
        f_tilt = np.clip(tilt_rate_deg_hr / 0.45, 0.0, 1.0)
        f_pore = np.clip(pore_water_pressure_kpa / 70.0, 0.0, 1.0)
        f_vib = np.clip(vibration_g / 0.25, 0.0, 1.0)
        f_geo = min(1.0, f_tilt * 0.45 + f_pore * 0.35 + f_vib * 0.20)

        # Weighted Risk Sum (0.0 to 1.0)
        raw_risk = (
            self.weights["susceptibility"] * static_susceptibility +
            self.weights["antecedent_rain"] * f_rain_ant +
            self.weights["forecast_rain"] * f_rain_fc +
            self.weights["soil_moisture"] * f_soil +
            self.weights["geotechnical_creep"] * f_geo
        )

        # Non-linear amplification when multiple critical triggers coincide
        if f_soil > 0.8 and f_rain_ant > 0.7:
            raw_risk = min(1.0, raw_risk * 1.25)
        if tilt_rate_deg_hr >= 0.40 or vibration_g >= 0.25:
            raw_risk = max(raw_risk, 0.88)

        risk_score = int(np.clip(round(raw_risk * 100), 5, 100))

        # Risk Classification
        if risk_score >= 82:
            level = "CRITICAL"
            action_code = "EVACUATE_IMMEDIATE"
            lead_time_desc = "High failure probability within 2–6 hours"
        elif risk_score >= 62:
            level = "HIGH"
            action_code = "WARNING_STANDBY"
            lead_time_desc = "Slope instability expected within 6–18 hours"
        elif risk_score >= 38:
            level = "MEDIUM"
            action_code = "WATCH_MONITOR"
            lead_time_desc = "Moderate risk over 18–36 hours"
        else:
            level = "LOW"
            action_code = "ADVISORY_ROUTINE"
            lead_time_desc = "Stable conditions over next 72 hours"

        # Multi-window lead-time projections (6h, 12h, 24h, 48h, 72h)
        projections = self._calculate_lead_time_curve(risk_score, rainfall_forecast_24h_mm, tilt_rate_deg_hr)

        return {
            "risk_score": risk_score,
            "risk_level": level,
            "action_code": action_code,
            "lead_time_window": lead_time_desc,
            "components": {
                "static_susceptibility_pct": int(round(static_susceptibility * 100)),
                "rainfall_factor_pct": int(round(f_rain_ant * 100)),
                "forecast_rainfall_factor_pct": int(round(f_rain_fc * 100)),
                "soil_saturation_pct": int(round(f_soil * 100)),
                "geotechnical_creep_pct": int(round(f_geo * 100)),
            },
            "lead_time_projections": projections
        }

    def _calculate_lead_time_curve(self, current_score: int, forecast_rain_mm: float, tilt_rate: float) -> List[Dict[str, Any]]:
        trend_factor = 1.0
        if forecast_rain_mm > 80 or tilt_rate > 0.25:
            trend_factor = 1.18
        elif forecast_rain_mm < 25:
            trend_factor = 0.88

        windows = [
            {"hour": "+6h", "label": "6 Hours", "multiplier": 1.0 + (trend_factor - 1.0) * 0.4},
            {"hour": "+12h", "label": "12 Hours", "multiplier": 1.0 + (trend_factor - 1.0) * 0.75},
            {"hour": "+24h", "label": "24 Hours (Peak)", "multiplier": 1.0 + (trend_factor - 1.0) * 1.0},
            {"hour": "+48h", "label": "48 Hours", "multiplier": 1.0 + (trend_factor - 1.0) * 0.65},
            {"hour": "+72h", "label": "72 Hours", "multiplier": 1.0 + (trend_factor - 1.0) * 0.40},
        ]

        projections = []
        for w in windows:
            projected_val = int(np.clip(round(current_score * w["multiplier"]), 10, 99))
            projections.append({
                "window": w["hour"],
                "label": w["label"],
                "projected_score": projected_val,
                "projected_level": (
                    "CRITICAL" if projected_val >= 82 else
                    "HIGH" if projected_val >= 62 else
                    "MEDIUM" if projected_val >= 38 else "LOW"
                )
            })
        return projections

dynamic_risk_engine = DynamicRiskEngine()
