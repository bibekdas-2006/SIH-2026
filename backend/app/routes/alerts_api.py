from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import uuid
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Alert

router = APIRouter(prefix="/alerts", tags=["Alerts & Escalation"])


@router.get("/")
def list_alerts(db: Session = Depends(get_db)):
    """Returns active alerts and automated escalation status from persistent database"""
    alerts = db.query(Alert).order_by(Alert.created_at.desc()).all()
    alerts_list = [a.to_dict() for a in alerts]
    return {
        "active_alerts_count": len(alerts_list),
        "alerts": alerts_list
    }


@router.post("/broadcast")
def broadcast_new_alert(payload: Dict[str, Any], db: Session = Depends(get_db)):
    """Allows DDMA / SDMA Admin to manually broadcast or trigger early warning alert and save to database"""
    district_id = payload.get("district_id", "NER-ML-EKH")
    severity = payload.get("severity", "HIGH")
    location = payload.get("location", "NER Hill Sector")
    custom_msg = payload.get("message", "High landslide hazard detected. Stay vigilant.")
    alert_id = payload.get("id") or f"ALERT-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:4].upper()}"

    new_alert = Alert(
        id=alert_id,
        severity=severity,
        category="EVACUATION_ORDER" if severity == "CRITICAL" else "WARNING" if severity == "HIGH" else "ADVISORY",
        district_id=district_id,
        district_name=payload.get("district_name", "Monitored District"),
        state=payload.get("state", "Assam"),
        location=location,
        title=f"{severity} HAZARD ALERT: {location}",
        message=custom_msg,
        multilingual={
            "en": custom_msg,
            "hi": f"चेतावनी: {custom_msg}",
            "as": f"সতৰ্কবাণী: {custom_msg}",
            "bn": f"সতর্কতা: {custom_msg}",
            "khasi": f"Jingmaham: {custom_msg}",
            "mizo": f"Hlauhthawnna: {custom_msg}"
        },
        trigger_source=payload.get("trigger_source", "ADMIN_OFFICER_MANUAL_DISPATCH"),
        created_at=datetime.now(timezone.utc).isoformat(),
        sla_seconds=120,
        escalation_stage="STAGE_1_DDMA",
        acknowledged=False,
        acknowledged_by=None,
        acknowledged_at=None,
        dispatched_channels={
            "sms": {"sent": 2500, "status": "TRANSMITTING"},
            "push_notification": {"sent": 1800, "status": "TRANSMITTING"},
            "ivr_voice_broadcast": {"calls_initiated": 600, "status": "QUEUED"},
            "siren_system": {"status": "ACTIVE" if severity == "CRITICAL" else "STANDBY", "sound": "EMERGENCY_ALARM"},
            "ndrf_command_dispatch": {"status": "NOTIFIED", "unit": "Regional Disaster Response Force"}
        }
    )

    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)

    return {"status": "SUCCESS", "alert": new_alert.to_dict()}


@router.post("/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: str, payload: Optional[Dict[str, Any]] = None, db: Session = Depends(get_db)):
    """Marks an alert as seen and actioned by duty disaster officer (FR3.5) in database"""
    officer_name = payload.get("officer_name", "Duty Officer") if payload else "District Control Room Officer"
    
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found")
        
    alert.acknowledged = True
    alert.acknowledged_by = officer_name
    alert.acknowledged_at = datetime.now(timezone.utc).isoformat()
    db.commit()
    db.refresh(alert)
    
    return {"status": "ACKNOWLEDGED", "alert": alert.to_dict()}
