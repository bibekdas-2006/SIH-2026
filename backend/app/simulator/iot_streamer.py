import json
import os
import random
import time
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Any
from ..ml.anomaly_detector import anomaly_detector
from ..ml.dynamic_risk import dynamic_risk_engine

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")

class IoTStreamSimulator:
    def __init__(self):
        self.scenario = "NORMAL" # NORMAL | MONSOON_TORRENTIAL | SLOPE_ANOMALY | FLASH_FLOOD
        self.sensors: List[Dict[str, Any]] = []
        self.districts: List[Dict[str, Any]] = []
        self.history_buffers: Dict[str, List[Dict[str, Any]]] = {}
        self.active_alerts: List[Dict[str, Any]] = []
        self.load_initial_data()
        self.generate_initial_history()

    def load_initial_data(self):
        with open(os.path.join(DATA_DIR, "sensors_catalog.json"), "r", encoding="utf-8") as f:
            self.sensors = json.load(f)
        with open(os.path.join(DATA_DIR, "ner_districts.json"), "r", encoding="utf-8") as f:
            self.districts = json.load(f)

    def generate_initial_history(self):
        """Builds 24 hours of simulated historical time-series per sensor"""
        now = datetime.now(timezone.utc)
        for s in self.sensors:
            s_id = s["id"]
            self.history_buffers[s_id] = []
            base_moist = s["soil_moisture_pct"]
            base_tilt = s["tilt_angle_deg"]
            base_pore = s["pore_water_pressure_kpa"]
            base_rain = s["rainfall_rate_mm_hr"]

            for h in range(24, 0, -1):
                t_stamp = (now - timedelta(hours=h)).strftime("%H:%M")
                noise = (random.random() - 0.5) * 2.0
                self.history_buffers[s_id].append({
                    "timestamp": t_stamp,
                    "soil_moisture_pct": round(max(20.0, min(100.0, base_moist - h * 0.4 + noise)), 1),
                    "tilt_angle_deg": round(max(0.5, base_tilt - h * 0.08 + noise * 0.05), 2),
                    "tilt_rate_deg_hr": round(max(0.01, s["tilt_rate_deg_hr"] - h * 0.005), 3),
                    "pore_water_pressure_kpa": round(max(10.0, base_pore - h * 0.6 + noise), 1),
                    "rainfall_rate_mm_hr": round(max(0.0, base_rain - h * 0.5 + abs(noise) * 2), 1),
                    "vibration_g": round(max(0.01, s["vibration_acceleration_g"] - h * 0.003), 3)
                })

    def set_scenario(self, scenario_name: str) -> Dict[str, Any]:
        self.scenario = scenario_name
        self.apply_scenario_effects()
        return {"status": "SUCCESS", "scenario": self.scenario, "message": f"Scenario changed to {self.scenario}"}

    def apply_scenario_effects(self):
        now_str = datetime.now(timezone.utc).isoformat()
        
        for s in self.sensors:
            s_id = s["id"]
            if self.scenario == "NORMAL":
                s["rainfall_rate_mm_hr"] = round(random.uniform(0.0, 5.0), 1)
                s["soil_moisture_pct"] = round(random.uniform(35.0, 55.0), 1)
                s["tilt_angle_deg"] = round(random.uniform(2.0, 5.0), 1)
                s["tilt_rate_deg_hr"] = round(random.uniform(0.01, 0.05), 3)
                s["pore_water_pressure_kpa"] = round(random.uniform(15.0, 30.0), 1)
                s["vibration_acceleration_g"] = round(random.uniform(0.01, 0.04), 3)
                s["status"] = "LOW"

            elif self.scenario == "MONSOON_TORRENTIAL":
                if "EKH" in s_id or "DH" in s_id or "MG" in s_id or "SNP" in s_id:
                    s["rainfall_rate_mm_hr"] = round(random.uniform(38.0, 65.0), 1)
                    s["soil_moisture_pct"] = round(random.uniform(84.0, 95.0), 1)
                    s["tilt_angle_deg"] = round(random.uniform(11.0, 16.0), 1)
                    s["tilt_rate_deg_hr"] = round(random.uniform(0.35, 0.55), 3)
                    s["pore_water_pressure_kpa"] = round(random.uniform(62.0, 78.0), 1)
                    s["vibration_acceleration_g"] = round(random.uniform(0.18, 0.35), 3)
                    s["status"] = "CRITICAL" if s["tilt_rate_deg_hr"] > 0.45 else "HIGH"
                else:
                    s["rainfall_rate_mm_hr"] = round(random.uniform(18.0, 30.0), 1)
                    s["soil_moisture_pct"] = round(random.uniform(65.0, 78.0), 1)
                    s["status"] = "HIGH"

            elif self.scenario == "SLOPE_ANOMALY":
                # Instant massive slope slip on Sohra (East Khasi) and Haflong (Dima Hasao)
                if "EKH" in s_id:
                    s["tilt_rate_deg_hr"] = 0.88  # Massive sudden acceleration!
                    s["tilt_angle_deg"] = 18.5
                    s["vibration_acceleration_g"] = 0.48 # Seismic shock
                    s["soil_moisture_pct"] = 96.2
                    s["pore_water_pressure_kpa"] = 84.0
                    s["status"] = "CRITICAL"
                elif "DH" in s_id:
                    s["tilt_rate_deg_hr"] = 0.62
                    s["tilt_angle_deg"] = 14.2
                    s["vibration_acceleration_g"] = 0.38
                    s["status"] = "CRITICAL"

            elif self.scenario == "FLASH_FLOOD":
                if "SK" in s_id or "AZ" in s_id or "DH" in s_id:
                    s["rainfall_rate_mm_hr"] = round(random.uniform(55.0, 90.0), 1)
                    s["soil_moisture_pct"] = 98.0
                    s["pore_water_pressure_kpa"] = 88.0
                    s["status"] = "CRITICAL"

            s["last_ping_utc"] = now_str

        # Update district aggregate metrics
        self.recompute_all_districts()

    def recompute_all_districts(self):
        for d in self.districts:
            # Find related sensors
            matched_sensors = [s for s in self.sensors if s["district_id"] == d["id"]]
            if matched_sensors:
                avg_moist = sum(s["soil_moisture_pct"] for s in matched_sensors) / len(matched_sensors)
                max_tilt_rate = max(s["tilt_rate_deg_hr"] for s in matched_sensors)
                max_pore = max(s["pore_water_pressure_kpa"] for s in matched_sensors)
                max_vib = max(s["vibration_acceleration_g"] for s in matched_sensors)
            else:
                avg_moist = 50.0
                max_tilt_rate = 0.05
                max_pore = 25.0
                max_vib = 0.02

            # Compute dynamic risk
            eval_res = dynamic_risk_engine.compute_dynamic_risk(
                static_susceptibility=d["baseline_susceptibility"],
                rainfall_24h_mm=d["weather"]["rainfall_24h_mm"],
                rainfall_72h_mm=d["weather"]["rainfall_24h_mm"] * 2.2,
                rainfall_forecast_24h_mm=d["weather"]["rainfall_forecast_24h_mm"],
                soil_moisture_pct=avg_moist,
                tilt_rate_deg_hr=max_tilt_rate,
                pore_water_pressure_kpa=max_pore,
                vibration_g=max_vib
            )

            d["risk_score"] = eval_res["risk_score"]
            d["active_risk_level"] = eval_res["risk_level"]
            d["risk_components"] = eval_res["components"]
            d["lead_time_projections"] = eval_res["lead_time_projections"]
            d["lead_time_window"] = eval_res["lead_time_window"]

    def tick_stream(self):
        """Simulate real-time sensor fluctuation and add new timestamp to history"""
        now = datetime.now(timezone.utc)
        t_stamp = now.strftime("%H:%M:%S")

        for s in self.sensors:
            s_id = s["id"]
            # Small jitter
            jitter = (random.random() - 0.5) * 0.4
            s["soil_moisture_pct"] = round(min(100.0, max(15.0, s["soil_moisture_pct"] + jitter)), 1)
            s["last_ping_utc"] = now.isoformat()

            buf = self.history_buffers.setdefault(s_id, [])
            buf.append({
                "timestamp": t_stamp,
                "soil_moisture_pct": s["soil_moisture_pct"],
                "tilt_angle_deg": s["tilt_angle_deg"],
                "tilt_rate_deg_hr": s["tilt_rate_deg_hr"],
                "pore_water_pressure_kpa": s["pore_water_pressure_kpa"],
                "rainfall_rate_mm_hr": s["rainfall_rate_mm_hr"],
                "vibration_g": s["vibration_acceleration_g"]
            })
            if len(buf) > 30:
                buf.pop(0)

# Global singleton
stream_simulator = IoTStreamSimulator()
