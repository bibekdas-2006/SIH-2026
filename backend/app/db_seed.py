import json
import os
from .database import engine, Base, SessionLocal
from .models import (
    CitizenReport,
    Alert,
    RoadCorridor,
    HistoricalLandslide,
    Shelter,
    DistrictRecord,
    SensorRecord
)

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

SEED_CITIZEN_REPORTS = [
    {
        "id": "REPORT-2026-CR01",
        "reporter_name": "Tashi Bhutia (Local Resident)",
        "reporter_phone": "+91-98765-43210",
        "village": "Ravangla Upper Ridge",
        "district": "Namchi (South Sikkim)",
        "state": "Sikkim",
        "lat": 27.1720,
        "lng": 88.3510,
        "incident_type": "Tension Crack on Hill Slope",
        "crack_width_cm": 15.0,
        "crack_length_m": 45.0,
        "water_seepage_observed": True,
        "structures_threatened": "3 Residential Houses & Power Pylon",
        "description": "Noticed fresh 15cm wide ground fissures opening behind the primary school after heavy morning rain. Spring water turning muddy.",
        "image_url": "https://images.unsplash.com/photo-1541888946425-d0fbb180c5f9?w=600&auto=format&fit=crop&q=80",
        "status": "VERIFIED_ACTIVE_THREAT",
        "submitted_at": "2026-08-27T16:15:00Z",
        "verified_by": "Namchi PWD Geotechnical Sub-division",
        "ai_risk_alignment": "MATCHES_HIGH_SUSCEPTIBILITY"
    },
    {
        "id": "REPORT-2026-CR02",
        "reporter_name": "M. Lalthanpuia (Truck Driver)",
        "reporter_phone": "+91-94361-99881",
        "village": "Hunthar Veng",
        "district": "Aizawl",
        "state": "Mizoram",
        "lat": 23.7410,
        "lng": 92.7090,
        "incident_type": "Minor Mudslide & Retaining Wall Bulge",
        "crack_width_cm": 8.0,
        "crack_length_m": 20.0,
        "water_seepage_observed": True,
        "structures_threatened": "NH-306 Highway Shoulder",
        "description": "Small rockfall and retaining wall leaning towards road. Mud overflowing drainage canal.",
        "image_url": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80",
        "status": "PENDING_VERIFICATION",
        "submitted_at": "2026-08-27T17:05:00Z",
        "verified_by": None,
        "ai_risk_alignment": "PENDING_FIELD_VISIT"
    }
]

SEED_ALERTS = [
    {
        "id": "ALERT-2026-0827-01",
        "severity": "CRITICAL",
        "category": "EVACUATION_ORDER",
        "district_id": "NER-ML-EKH",
        "district_name": "East Khasi Hills",
        "state": "Meghalaya",
        "location": "Sohra (Cherrapunji) Cliff Escarpment & Mawkdok Valley",
        "title": "IMMINENT LANDSLIDE HAZARD - IMMEDIATE EVACUATION ORDER",
        "message": "Continuous torrential rainfall (142 mm/24h) and high inclinometer displacement (0.52°/hr) detected. High probability of catastrophic slope failure along Sohra-Shella road corridor. Move immediately to Cherrapunji Circuit House shelter.",
        "multilingual": {
            "en": "IMMINENT LANDSLIDE HAZARD: Urgent evacuation ordered for Sohra Escarpment settlements. Relocate to designated shelters immediately.",
            "hi": "आसन्न भूस्खलन चेतावनी: सोहरा ढलान बस्तियों के लिए तत्काल निकासी का आदेश। तुरंत राहत शिविरों में जाएं।",
            "as": "আসন্ন ভূমিস্খলনৰ সতৰ্কবাণী: চোহৰা পাহাৰীয়া এলেকাৰ বাবে জৰুৰী স্থানান্তৰৰ নিৰ্দেশ। লগে লগে আশ্ৰয় শিবিৰলৈ যাওক।",
            "bn": "আসন্ন ভূমিধস সতর্কতা: চোহরা এলাকার জন্য জরুরি স্থানান্তর নির্দেশ। অবিলম্বে আশ্রয়কেন্দ্রে যান।",
            "khasi": "JINGMAHAM JINGKHLOH KHYNDEW: Pynkynrih mardor ia ki shnong ha Sohra Escarpment sha ki jaka shong basa ba la pynkhreh.",
            "mizo": "LEI TIHNGAIHNA HLAUHAWM: Sohra biala chengte chu himna hmunah in sawn chhuak nghal rawh u."
        },
        "trigger_source": "AI_HYBRID (ML Susceptibility 0.92 + Sensor SENSOR-EKH-01 Anomaly)",
        "created_at": "2026-08-27T17:30:00Z",
        "sla_seconds": 120,
        "escalation_stage": "STAGE_3_POLICE_PANCHAYAT",
        "acknowledged": False,
        "acknowledged_by": None,
        "acknowledged_at": None,
        "dispatched_channels": {
            "sms": {"sent": 14200, "status": "DELIVERED"},
            "push_notification": {"sent": 8900, "status": "DELIVERED"},
            "ivr_voice_broadcast": {"calls_initiated": 4500, "status": "ACTIVE"},
            "siren_system": {"status": "ACTIVE_BLARING", "sound": "SIREN_LEVEL_4"},
            "ndrf_command_dispatch": {"status": "TEAMS_DISPATCHED", "unit": "1st NDRF Battalion Patgaon"}
        }
    },
    {
        "id": "ALERT-2026-0827-02",
        "severity": "HIGH",
        "category": "WARNING",
        "district_id": "NER-AS-DH",
        "district_name": "Dima Hasao",
        "state": "Assam",
        "location": "Haflong Hill Cut (NH-27 Highway Corridor)",
        "title": "LANDSLIDE WARNING - TRAFFIC DIVERSION IN FORCE",
        "message": "Heavy slope creep and mudflow observed near Jatinga-Harangajao mile 44. NH-27 partially blocked. Commuters advised to avoid travel.",
        "multilingual": {
            "en": "LANDSLIDE WARNING: NH-27 Haflong section restricted due to active debris flow. Follow PWD traffic diversions.",
            "hi": "भूस्खलन चेतावनी: एनएच-27 हाफलोंग खंड पर मलबा गिरने से यातायात प्रतिबंधित। वैकल्पिक मार्ग का उपयोग करें।",
            "as": "ভূমিস্খলন সতৰ্কবাণী: এনএইচ-২৭ হাফলং খণ্ডত ভূমিস্খলনৰ বাবে যান-বাহন চলাচল সীমিত কৰা হৈছে। বিকল্প পথ ব্যৱহাৰ কৰক।",
            "bn": "ভূমিধস সতর্কতা: এনএইচ-২৭ হাফলং অংশে যান চলাচল সীমিত করা হয়েছে। বিকল্প পথ ব্যবহার করুন।",
            "khasi": "JINGMAHAM: Ka surok NH-27 Haflong ka don ha ka jingma na ka jingkhloh khyndew.",
            "mizo": "NH-27 Haflong kawng chu lei min avangin motor tlan theih a ni lo."
        },
        "trigger_source": "Dynamic Risk Engine (Score: 78/100)",
        "created_at": "2026-08-27T17:35:00Z",
        "sla_seconds": 120,
        "escalation_stage": "STAGE_2_NDRF_SDRF",
        "acknowledged": True,
        "acknowledged_by": "Officer K. Sengyung (DDMA Dima Hasao)",
        "acknowledged_at": "2026-08-27T17:36:12Z",
        "dispatched_channels": {
            "sms": {"sent": 6800, "status": "DELIVERED"},
            "push_notification": {"sent": 4200, "status": "DELIVERED"},
            "ivr_voice_broadcast": {"calls_initiated": 1200, "status": "COMPLETED"},
            "siren_system": {"status": "STANDBY", "sound": "WARNING_BEEP"},
            "ndrf_command_dispatch": {"status": "STANDBY_DEPLOYMENT", "unit": "SDRF Assam 2nd Bn"}
        }
    }
]

def init_db():
    """Creates tables if not present and seeds initial datasets if empty."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # 1. Historical Landslides
        if db.query(HistoricalLandslide).count() == 0:
            hist_path = os.path.join(DATA_DIR, "historical_events.json")
            if os.path.exists(hist_path):
                with open(hist_path, "r", encoding="utf-8") as f:
                    items = json.load(f)
                    for item in items:
                        db.add(HistoricalLandslide(
                            id=item["id"],
                            date=item.get("date", ""),
                            location=item.get("location", ""),
                            district=item.get("district", ""),
                            state=item.get("state", ""),
                            lat=float(item.get("lat", 0.0)),
                            lng=float(item.get("lng", 0.0)),
                            severity=item.get("severity", "HIGH"),
                            fatalities=int(item.get("fatalities", 0)),
                            displaced_count=int(item.get("displaced_count", 0)),
                            estimated_loss_cr_inr=float(item.get("estimated_loss_cr_inr", 0.0)),
                            trigger=item.get("trigger", ""),
                            description=item.get("description", ""),
                            geological_cause=item.get("geological_cause", "")
                        ))
                db.commit()

        # 2. Evacuation Shelters
        if db.query(Shelter).count() == 0:
            shelters_path = os.path.join(DATA_DIR, "shelters.json")
            if os.path.exists(shelters_path):
                with open(shelters_path, "r", encoding="utf-8") as f:
                    items = json.load(f)
                    for item in items:
                        db.add(Shelter(
                            id=item["id"],
                            name=item.get("name", ""),
                            district_id=item.get("district_id", ""),
                            district_name=item.get("district_name", ""),
                            lat=float(item.get("lat", 0.0)),
                            lng=float(item.get("lng", 0.0)),
                            capacity_persons=int(item.get("capacity_persons", 500)),
                            current_occupancy=int(item.get("current_occupancy", 0)),
                            status=item.get("status", "OPERATIONAL"),
                            contact_officer=item.get("contact_officer", ""),
                            phone=item.get("phone", ""),
                            has_helipad=bool(item.get("has_helipad", False)),
                            has_medical_unit=bool(item.get("has_medical_unit", True)),
                            supplies_ration_days=int(item.get("supplies_ration_days", 10))
                        ))
                db.commit()

        # 3. Road Corridors
        if db.query(RoadCorridor).count() == 0:
            roads_path = os.path.join(DATA_DIR, "road_network.json")
            if os.path.exists(roads_path):
                with open(roads_path, "r", encoding="utf-8") as f:
                    items = json.load(f)
                    for item in items:
                        db.add(RoadCorridor(
                            id=item["id"],
                            name=item.get("name", ""),
                            section=item.get("section", ""),
                            state=item.get("state", ""),
                            length_km=float(item.get("length_km", 0.0)),
                            status=item.get("status", "OPEN"),
                            severity=item.get("severity", "LOW"),
                            chokepoint_name=item.get("chokepoint_name", ""),
                            blockage_type=item.get("blockage_type", ""),
                            debris_volume_m3=float(item.get("debris_volume_m3", 0.0)),
                            affected_coordinates=item.get("affected_coordinates", []),
                            coordinates_path=item.get("coordinates_path", []),
                            estimated_clearance_hrs=float(item.get("estimated_clearance_hrs", 0.0)),
                            deployed_machinery=item.get("deployed_machinery", ""),
                            bypass_route=item.get("bypass_route", ""),
                            last_updated=item.get("last_updated", "")
                        ))
                db.commit()

        # 4. Districts
        if db.query(DistrictRecord).count() == 0:
            districts_path = os.path.join(DATA_DIR, "ner_districts.json")
            if os.path.exists(districts_path):
                with open(districts_path, "r", encoding="utf-8") as f:
                    items = json.load(f)
                    for item in items:
                        db.add(DistrictRecord(
                            id=item["id"],
                            name=item.get("name", ""),
                            state=item.get("state", ""),
                            lat=float(item.get("lat", 0.0)),
                            lng=float(item.get("lng", 0.0)),
                            population_at_risk=int(item.get("population_at_risk", 0)),
                            mean_slope_deg=float(item.get("mean_slope_deg", 0.0)),
                            elevation_m=float(item.get("elevation_m", 0.0)),
                            baseline_susceptibility=float(item.get("baseline_susceptibility", 0.0)),
                            weather=item.get("weather", {}),
                            risk_score=float(item.get("risk_score", 0.0)),
                            active_risk_level=item.get("active_risk_level", "LOW"),
                            risk_components=item.get("risk_components", {}),
                            lead_time_projections=item.get("lead_time_projections", []),
                            lead_time_window=item.get("lead_time_window", "+24h Peak"),
                            monitored_sensors=item.get("monitored_sensors", [])
                        ))
                db.commit()

        # 5. Sensors
        if db.query(SensorRecord).count() == 0:
            sensors_path = os.path.join(DATA_DIR, "sensors_catalog.json")
            if os.path.exists(sensors_path):
                with open(sensors_path, "r", encoding="utf-8") as f:
                    items = json.load(f)
                    for item in items:
                        db.add(SensorRecord(
                            id=item["id"],
                            name=item.get("name", ""),
                            district_id=item.get("district_id", ""),
                            district_name=item.get("district_name", ""),
                            state=item.get("state", ""),
                            lat=float(item.get("lat", 0.0)),
                            lng=float(item.get("lng", 0.0)),
                            sensor_type=item.get("sensor_type", ""),
                            soil_moisture_pct=float(item.get("soil_moisture_pct", 0.0)),
                            tilt_angle_deg=float(item.get("tilt_angle_deg", 0.0)),
                            tilt_rate_deg_hr=float(item.get("tilt_rate_deg_hr", 0.0)),
                            pore_water_pressure_kpa=float(item.get("pore_water_pressure_kpa", 0.0)),
                            rainfall_rate_mm_hr=float(item.get("rainfall_rate_mm_hr", 0.0)),
                            vibration_acceleration_g=float(item.get("vibration_acceleration_g", 0.0)),
                            battery_pct=float(item.get("battery_pct", 100.0)),
                            status=item.get("status", "NORMAL"),
                            last_ping_utc=item.get("last_ping_utc", "")
                        ))
                db.commit()

        # 6. Citizen Reports
        if db.query(CitizenReport).count() == 0:
            for rep in SEED_CITIZEN_REPORTS:
                db.add(CitizenReport(**rep))
            db.commit()

        # 7. Alerts
        if db.query(Alert).count() == 0:
            for al in SEED_ALERTS:
                db.add(Alert(**al))
            db.commit()

    finally:
        db.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized and seeded successfully.")
