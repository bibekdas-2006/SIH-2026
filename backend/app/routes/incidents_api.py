from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import uuid
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import CitizenReport, HistoricalLandslide, Shelter

router = APIRouter(prefix="/incidents", tags=["Incidents & Crowdsourcing"])


@router.get("/historical")
def get_historical_landslides(db: Session = Depends(get_db)):
    """Returns official GSI / NDMA historical landslide database from persistent database"""
    events = db.query(HistoricalLandslide).all()
    events_list = [e.to_dict() for e in events]
    return {"count": len(events_list), "events": events_list}


@router.get("/shelters")
def get_evacuation_shelters(district_id: Optional[str] = None, db: Session = Depends(get_db)):
    """Returns safe evacuation shelters & relief centers from persistent database"""
    query = db.query(Shelter)
    if district_id:
        query = query.filter(Shelter.district_id == district_id)
    shelters = query.all()
    shelters_list = [s.to_dict() for s in shelters]
    return {"count": len(shelters_list), "shelters": shelters_list}


@router.get("/crowdsourced")
def get_crowdsourced_reports(db: Session = Depends(get_db)):
    """Returns citizen submitted slope crack / landslide reports from persistent database"""
    reports = db.query(CitizenReport).order_by(CitizenReport.submitted_at.desc()).all()
    reports_list = [r.to_dict() for r in reports]
    return {
        "count": len(reports_list),
        "reports": reports_list
    }


@router.post("/report")
def submit_citizen_report(payload: Dict[str, Any], db: Session = Depends(get_db)):
    """Citizen PWA endpoint to submit slope crack / landslide hazard and save to database"""
    report_id = payload.get("id") or f"REPORT-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:4].upper()}"
    
    new_report = CitizenReport(
        id=report_id,
        reporter_name=payload.get("reporter_name", "Anonymous Citizen"),
        reporter_phone=payload.get("reporter_phone", "Unspecified"),
        village=payload.get("village", "NER Hill Village"),
        district=payload.get("district", "Monitored District"),
        state=payload.get("state", "NER"),
        lat=float(payload.get("lat", 25.275)),
        lng=float(payload.get("lng", 91.732)),
        incident_type=payload.get("incident_type", "Ground Crack"),
        crack_width_cm=float(payload.get("crack_width_cm", 5)),
        crack_length_m=float(payload.get("crack_length_m", 10)),
        water_seepage_observed=bool(payload.get("water_seepage_observed", False)),
        structures_threatened=payload.get("structures_threatened", "Road and houses"),
        description=payload.get("description", "Noticed slope instability during rain."),
        image_url=payload.get("image_url", "https://images.unsplash.com/photo-1541888946425-d0fbb180c5f9?w=600&auto=format&fit=crop&q=80"),
        status="PENDING_VERIFICATION",
        submitted_at=datetime.now(timezone.utc).isoformat(),
        verified_by=None,
        ai_risk_alignment=payload.get("ai_risk_alignment", "EVALUATING")
    )
    
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    
    return {
        "status": "SUCCESS",
        "report": new_report.to_dict(),
        "message": "Hazard report submitted successfully to DDMA control room."
    }


@router.post("/crowdsourced/{report_id}/verify")
def verify_citizen_report(report_id: str, payload: Dict[str, Any], db: Session = Depends(get_db)):
    """Authority action to verify or reject citizen report (FR4.5) in database"""
    verified = payload.get("verified", True)
    officer = payload.get("officer_name", "Field Inspection Officer")
    
    report = db.query(CitizenReport).filter(CitizenReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail=f"Report {report_id} not found")
        
    report.status = "VERIFIED_ACTIVE_THREAT" if verified else "REJECTED_FALSE_ALARM"
    report.verified_by = officer
    db.commit()
    db.refresh(report)
    
    return {"status": "UPDATED", "report": report.to_dict()}
