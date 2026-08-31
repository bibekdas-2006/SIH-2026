import requests
import sys

BASE_URL = "http://127.0.0.1:8000/api"

def test_endpoints():
    print("Testing Backend Endpoints...")
    try:
        # 1. Health
        r = requests.get("http://127.0.0.1:8000/health")
        assert r.status_code == 200, f"Health check failed: {r.status_code}"
        health_data = r.json()
        assert health_data.get("database") == "CONNECTED"
        print("[PASS] Health Check & Database Connection Passed")

        # 2. Database Stats
        r = requests.get(f"{BASE_URL}/db/stats")
        assert r.status_code == 200
        stats = r.json()
        assert "tables" in stats
        print(f"[PASS] Database Stats API Passed (Connected Engine: {stats.get('engine')}, Tables: {list(stats['tables'].keys())})")

        # 3. Districts
        r = requests.get(f"{BASE_URL}/risk/districts")
        assert r.status_code == 200
        districts = r.json().get("districts", [])
        assert len(districts) >= 8, f"Expected 8+ districts, got {len(districts)}"
        print(f"[PASS] Districts API Passed ({len(districts)} monitored sectors across 8 NER states)")

        # 4. Dynamic Prediction Custom
        payload = {
            "slope_angle_deg": 42.0,
            "elevation_m": 1400.0,
            "twi": 8.2,
            "soil_clay_pct": 55.0,
            "lithology_rating": 4,
            "rainfall_24h_mm": 120.0,
            "soil_moisture_pct": 88.0,
            "tilt_rate_deg_hr": 0.48
        }
        r = requests.post(f"{BASE_URL}/risk/predict/custom", json=payload)
        assert r.status_code == 200
        res = r.json()
        assert "dynamic_risk" in res
        print(f"[PASS] AI Prediction Engine Passed (Risk Score: {res['dynamic_risk']['risk_score']}/100, Level: {res['dynamic_risk']['risk_level']})")

        # 5. Telemetry Sensors
        r = requests.get(f"{BASE_URL}/telemetry/sensors")
        assert r.status_code == 200
        sensors = r.json().get("sensors", [])
        assert len(sensors) >= 10
        print(f"[PASS] IoT Telemetry API Passed ({len(sensors)} ground stations active)")

        # 6. Alerts
        r = requests.get(f"{BASE_URL}/alerts/")
        assert r.status_code == 200
        alerts = r.json().get("alerts", [])
        assert len(alerts) >= 1
        print(f"[PASS] Alerts API Passed ({len(alerts)} active warning advisories in DB)")

        # 7. Crowdsourced Incidents & Shelters
        r = requests.get(f"{BASE_URL}/incidents/crowdsourced")
        assert r.status_code == 200
        reports = r.json().get("reports", [])
        print(f"[PASS] Crowdsourced Incidents DB API Passed ({len(reports)} reports in DB)")

        r = requests.get(f"{BASE_URL}/incidents/shelters")
        assert r.status_code == 200
        shelters = r.json().get("shelters", [])
        print(f"[PASS] Shelters DB API Passed ({len(shelters)} shelters registered in DB)")

        # 8. Roads
        r = requests.get(f"{BASE_URL}/roads/")
        assert r.status_code == 200
        roads = r.json().get("corridors", [])
        print(f"[PASS] National Highway Network API Passed ({len(roads)} corridors monitored in DB)")

        # 9. Simulation Scenarios
        r = requests.get(f"{BASE_URL}/simulation/status")
        assert r.status_code == 200
        scenarios = r.json().get("available_scenarios", [])
        print(f"[PASS] Scenario Simulation Engine Passed ({len(scenarios)} interactive scenarios)")

        # 10. ML Metrics
        r = requests.get(f"{BASE_URL}/ml/metrics")
        assert r.status_code == 200
        metrics = r.json().get("metrics", {})
        print(f"[PASS] ML Geologist Lab Metrics Passed (Accuracy: {metrics.get('accuracy')*100:.1f}%, ROC-AUC: {metrics.get('roc_auc')*100:.1f}%)")

        print("\nALL BACKEND & DATABASE TESTS PASSED SUCCESSFULLY! 100% READY FOR DEMO.")

    except Exception as e:
        print(f"[FAIL] Test Failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    test_endpoints()
