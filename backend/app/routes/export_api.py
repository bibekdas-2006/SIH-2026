from fastapi import APIRouter, Response, Depends
from datetime import datetime, timezone
import io
import csv
from sqlalchemy.orm import Session
from ..simulator.iot_streamer import stream_simulator
from ..database import get_db
from ..models import Alert, RoadCorridor

router = APIRouter(prefix="/export", tags=["Reports & Export"])


@router.get("/csv/district_status")
def export_district_csv():
    """Exports live district hazard situation table as CSV"""
    stream_simulator.tick_stream()
    stream_simulator.recompute_all_districts()

    output = io.StringIO()
    writer = csv.writer(output)

    # Headers
    writer.writerow([
        "District ID", "District Name", "State", "Risk Level", "Risk Score (0-100)",
        "Population At Risk", "Mean Slope (°)", "Baseline Susceptibility",
        "Rainfall 24h (mm)", "Forecast Rain (mm)", "Lead Time Window", "Monitored Sensors"
    ])

    for d in stream_simulator.districts:
        writer.writerow([
            d["id"],
            d["name"],
            d["state"],
            d["active_risk_level"],
            d["risk_score"],
            d["population_at_risk"],
            d["mean_slope_deg"],
            d["baseline_susceptibility"],
            d["weather"]["rainfall_24h_mm"],
            d["weather"]["rainfall_forecast_24h_mm"],
            d.get("lead_time_window", "N/A"),
            ", ".join(d.get("monitored_sensors", []))
        ])

    csv_content = output.getvalue()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=NER_Disaster_Report_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv"}
    )


@router.get("/summary_report")
def get_comprehensive_summary_report(db: Session = Depends(get_db)):
    """Returns a full structured briefing for DDMA / SDMA meeting printouts using database records"""
    stream_simulator.tick_stream()
    stream_simulator.recompute_all_districts()

    alerts_list = [a.to_dict() for a in db.query(Alert).order_by(Alert.created_at.desc()).all()]
    roads_list = [r.to_dict() for r in db.query(RoadCorridor).all()]

    return {
        "report_title": "NER Landslide Early Warning & Operational Hazard Assessment Briefing",
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "state_of_alert": "CRITICAL" if any(d["active_risk_level"] == "CRITICAL" for d in stream_simulator.districts) else "ELEVATED",
        "summary": {
            "districts_monitored": len(stream_simulator.districts),
            "critical_districts": [d["name"] for d in stream_simulator.districts if d["active_risk_level"] == "CRITICAL"],
            "high_risk_districts": [d["name"] for d in stream_simulator.districts if d["active_risk_level"] == "HIGH"],
            "active_alerts_count": len(alerts_list),
            "blocked_highways": [r["name"] for r in roads_list if r["status"] == "BLOCKED"],
            "deployed_sensors_count": len(stream_simulator.sensors)
        },
        "district_breakdown": stream_simulator.districts,
        "road_status": roads_list,
        "active_alerts": alerts_list
    }
