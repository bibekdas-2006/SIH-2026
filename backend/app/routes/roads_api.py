from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import RoadCorridor

router = APIRouter(prefix="/roads", tags=["Road Network & Connectivity"])


@router.get("/")
def get_all_road_corridors(db: Session = Depends(get_db)):
    """Returns status of all key hill highway arteries and blocked chokepoints from persistent database"""
    roads = db.query(RoadCorridor).all()
    roads_list = [r.to_dict() for r in roads]

    blocked_count = sum(1 for r in roads_list if r["status"] == "BLOCKED")
    at_risk_count = sum(1 for r in roads_list if r["status"] == "AT_RISK")
    open_count = sum(1 for r in roads_list if r["status"] == "OPEN")

    return {
        "summary": {
            "total_corridors": len(roads_list),
            "blocked": blocked_count,
            "at_risk": at_risk_count,
            "open": open_count
        },
        "corridors": roads_list
    }


@router.post("/{road_id}/update_status")
def update_road_status(road_id: str, payload: Dict[str, Any], db: Session = Depends(get_db)):
    """Allows BRO / PWD / Police to update road status & clearance ETA in database"""
    road = db.query(RoadCorridor).filter(RoadCorridor.id == road_id).first()
    if not road:
        raise HTTPException(status_code=404, detail=f"Road corridor {road_id} not found")

    if "status" in payload:
        road.status = payload["status"]
    if "severity" in payload:
        road.severity = payload["severity"]
    if "estimated_clearance_hrs" in payload:
        road.estimated_clearance_hrs = float(payload["estimated_clearance_hrs"])
    if "deployed_machinery" in payload:
        road.deployed_machinery = payload["deployed_machinery"]
    if "bypass_route" in payload:
        road.bypass_route = payload["bypass_route"]
    road.last_updated = datetime.now(timezone.utc).isoformat()

    db.commit()
    db.refresh(road)

    return {"status": "SUCCESS", "corridor": road.to_dict()}
