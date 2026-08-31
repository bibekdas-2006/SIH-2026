import os
import uuid
from datetime import datetime, timezone
from app.database import engine, SessionLocal, Base
from app.models import (
    CitizenReport,
    Alert,
    RoadCorridor,
    HistoricalLandslide,
    Shelter,
    DistrictRecord,
    SensorRecord
)
from app.db_seed import init_db
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_database_direct_crud():
    print("\n--- Testing Direct Database CRUD Operations ---")
    init_db()
    db = SessionLocal()
    try:
        # 1. CitizenReport CRUD
        test_rep_id = f"TEST-CR-{uuid.uuid4().hex[:6].upper()}"
        new_report = CitizenReport(
            id=test_rep_id,
            reporter_name="Test Citizen",
            reporter_phone="+91-99999-00000",
            village="Nongpoh Valley",
            district="Ri-Bhoi",
            state="Meghalaya",
            lat=25.90,
            lng=91.88,
            incident_type="Tension Crack",
            crack_width_cm=12.0,
            crack_length_m=30.0,
            water_seepage_observed=True,
            structures_threatened="Bridge Pier",
            description="Test crack observation",
            status="PENDING_VERIFICATION",
            submitted_at=datetime.now(timezone.utc).isoformat()
        )
        db.add(new_report)
        db.commit()

        # Query
        fetched = db.query(CitizenReport).filter(CitizenReport.id == test_rep_id).first()
        assert fetched is not None, "Failed to fetch inserted CitizenReport"
        assert fetched.reporter_name == "Test Citizen"
        print(f"[PASS] CitizenReport Insert & Query: {fetched.id}")

        # Update
        fetched.status = "VERIFIED_ACTIVE_THREAT"
        fetched.verified_by = "PWD Test Engineer"
        db.commit()
        refetched = db.query(CitizenReport).filter(CitizenReport.id == test_rep_id).first()
        assert refetched.status == "VERIFIED_ACTIVE_THREAT"
        print(f"[PASS] CitizenReport Update: Status={refetched.status}, VerifiedBy={refetched.verified_by}")

        # 2. Alert CRUD
        test_alert_id = f"TEST-AL-{uuid.uuid4().hex[:6].upper()}"
        new_alert = Alert(
            id=test_alert_id,
            severity="CRITICAL",
            category="EVACUATION_ORDER",
            district_id="NER-ML-EKH",
            district_name="East Khasi Hills",
            state="Meghalaya",
            location="Test Slope Zone",
            title="CRITICAL WARNING: TEST CORRIDOR",
            message="Immediate evacuation for test.",
            multilingual={"en": "Test warning", "hi": "परीक्षण चेतावनी"},
            trigger_source="TEST_SYSTEM"
        )
        db.add(new_alert)
        db.commit()

        fetched_alert = db.query(Alert).filter(Alert.id == test_alert_id).first()
        assert fetched_alert is not None
        assert fetched_alert.acknowledged is False
        print(f"[PASS] Alert Insert & Query: {fetched_alert.id}")

        fetched_alert.acknowledged = True
        fetched_alert.acknowledged_by = "Duty Officer"
        db.commit()
        refetched_alert = db.query(Alert).filter(Alert.id == test_alert_id).first()
        assert refetched_alert.acknowledged is True
        print(f"[PASS] Alert Acknowledgment Update: Acknowledged={refetched_alert.acknowledged}")

        # 3. Verify Table Seeding
        assert db.query(HistoricalLandslide).count() >= 5
        assert db.query(Shelter).count() >= 5
        assert db.query(RoadCorridor).count() >= 5
        assert db.query(DistrictRecord).count() >= 8
        assert db.query(SensorRecord).count() >= 8
        print("[PASS] Verified Pre-seeded Catalogs in Database")

        # Cleanup test entries
        db.delete(refetched)
        db.delete(refetched_alert)
        db.commit()
        print("[PASS] Test Cleanup completed successfully")

    finally:
        db.close()


def test_fastapi_endpoints_with_db():
    print("\n--- Testing FastAPI Endpoints Backed by Database ---")

    # 1. Health
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json().get("database") == "CONNECTED"
    print("[PASS] Health Check Endpoint with DB Connection:", res.json())

    # 2. DB Stats
    res = client.get("/api/db/stats")
    assert res.status_code == 200
    stats = res.json()
    assert "tables" in stats
    assert stats["tables"]["historical_landslides"] > 0
    print("[PASS] Database Stats API:", stats["tables"])

    # 3. Incidents - Historical
    res = client.get("/api/incidents/historical")
    assert res.status_code == 200
    data = res.json()
    assert data["count"] > 0
    print(f"[PASS] Historical Landslides DB API: {data['count']} events loaded")

    # 4. Incidents - Shelters
    res = client.get("/api/incidents/shelters")
    assert res.status_code == 200
    data = res.json()
    assert data["count"] > 0
    print(f"[PASS] Shelters DB API: {data['count']} shelters loaded")

    # 5. Incidents - Submit Citizen Report
    payload = {
        "reporter_name": "Priya Sharma",
        "reporter_phone": "+91-98765-11111",
        "village": "Laitkor Peak",
        "district": "East Khasi Hills",
        "state": "Meghalaya",
        "lat": 25.54,
        "lng": 91.89,
        "incident_type": "Slope Bulge",
        "crack_width_cm": 18.0,
        "crack_length_m": 50.0,
        "water_seepage_observed": True,
        "structures_threatened": "2 Houses",
        "description": "Retaining wall cracking after torrential rain"
    }
    res = client.post("/api/incidents/report", json=payload)
    assert res.status_code == 200
    rep_res = res.json()
    assert rep_res["status"] == "SUCCESS"
    rep_id = rep_res["report"]["id"]
    print(f"[PASS] Citizen Report POST API: Created {rep_id}")

    # 6. Incidents - Verify Citizen Report
    res = client.post(f"/api/incidents/crowdsourced/{rep_id}/verify", json={
        "verified": True,
        "officer_name": "Dr. A. Roy (GSI Senior Geologist)"
    })
    assert res.status_code == 200
    assert res.json()["report"]["status"] == "VERIFIED_ACTIVE_THREAT"
    assert res.json()["report"]["verified_by"] == "Dr. A. Roy (GSI Senior Geologist)"
    print(f"[PASS] Citizen Report Verify API: Report {rep_id} updated to VERIFIED_ACTIVE_THREAT in DB")

    # 7. Alerts - Broadcast
    alert_payload = {
        "severity": "CRITICAL",
        "location": "Mawkdok Valley Corridor",
        "district_id": "NER-ML-EKH",
        "district_name": "East Khasi Hills",
        "state": "Meghalaya",
        "message": "Imminent rockfall warning after continuous 120mm downpour."
    }
    res = client.post("/api/alerts/broadcast", json=alert_payload)
    assert res.status_code == 200
    alert_id = res.json()["alert"]["id"]
    print(f"[PASS] Alert Broadcast POST API: Created {alert_id}")

    # 8. Alerts - Acknowledge
    res = client.post(f"/api/alerts/{alert_id}/acknowledge", json={
        "officer_name": "Duty Officer Lalramzauva"
    })
    assert res.status_code == 200
    assert res.json()["alert"]["acknowledged"] is True
    print(f"[PASS] Alert Acknowledge POST API: Alert {alert_id} acknowledged in DB")

    # 9. Roads - Update Status
    res = client.post("/api/roads/ROAD-NH27/update_status", json={
        "status": "BLOCKED",
        "severity": "CRITICAL",
        "estimated_clearance_hrs": 4.5,
        "deployed_machinery": "6 Excavators and BRO Team"
    })
    assert res.status_code == 200
    road = res.json()["corridor"]
    assert road["estimated_clearance_hrs"] == 4.5
    print(f"[PASS] Road Update Status POST API: NH-27 updated in DB")

    # 10. ML Lab - Human Feedback Retraining using DB
    res = client.post("/api/ml/retrain")
    assert res.status_code == 200
    retrain_res = res.json()
    assert retrain_res["status"] == "RETRAINED_SUCCESSFULLY"
    print(f"[PASS] ML Retrain API: Model retrained incorporating DB verified reports ({retrain_res['incorporated_ground_truth_samples']} samples)")

    # 11. Summary Report with DB Alerts and Roads
    res = client.get("/api/export/summary_report")
    assert res.status_code == 200
    summary = res.json()
    assert summary["summary"]["active_alerts_count"] >= 2
    print(f"[PASS] Export Summary Report API: Generated briefing with {summary['summary']['active_alerts_count']} alerts and {len(summary['road_status'])} road corridors")

    print("\nALL DATABASE TESTS PASSED WITH 100% SUCCESS!")

if __name__ == "__main__":
    test_database_direct_crud()
    test_fastapi_endpoints_with_db()
