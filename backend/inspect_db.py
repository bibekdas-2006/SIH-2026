import sys
from app.database import SessionLocal
from app.models import (
    CitizenReport,
    Alert,
    RoadCorridor,
    HistoricalLandslide,
    Shelter,
    DistrictRecord,
    SensorRecord
)


def inspect_database():
    db = SessionLocal()
    try:
        print("=" * 70)
        print("          DISASTER MANAGEMENT DATABASE INSPECTOR")
        print("=" * 70)

        # 1. Citizen Reports
        reports = db.query(CitizenReport).all()
        print(f"\n[1] CITIZEN REPORTS ({len(reports)} total):")
        print("-" * 70)
        for r in reports:
            print(f"  • ID: {r.id}")
            print(f"    Reporter: {r.reporter_name} ({r.reporter_phone}) | Location: {r.village}, {r.district}, {r.state}")
            print(f"    Hazard: {r.incident_type} (Crack: {r.crack_width_cm}cm x {r.crack_length_m}m)")
            print(f"    Status: {r.status} | Verified By: {r.verified_by or 'None'}")
            print(f"    Description: {r.description}")
            print()

        # 2. Alerts
        alerts = db.query(Alert).all()
        print(f"\n[2] DISASTER ALERTS ({len(alerts)} total):")
        print("-" * 70)
        for a in alerts:
            print(f"  • ID: {a.id} | Severity: {a.severity} | Category: {a.category}")
            print(f"    Location: {a.location} ({a.district_name}, {a.state})")
            print(f"    Title: {a.title}")
            print(f"    Stage: {a.escalation_stage} | Acknowledged: {a.acknowledged} (By: {a.acknowledged_by or 'None'})")
            print()

        # 3. Road Corridors
        roads = db.query(RoadCorridor).all()
        print(f"\n[3] ROAD & HIGHWAY CORRIDORS ({len(roads)} total):")
        print("-" * 70)
        for rd in roads:
            print(f"  • ID: {rd.id} | Name: {rd.name}")
            print(f"    Section: {rd.section} ({rd.state})")
            print(f"    Status: {rd.status} ({rd.severity}) | Chokepoint: {rd.chokepoint_name}")
            print(f"    Clearance ETA: {rd.estimated_clearance_hrs} hrs | Machinery: {rd.deployed_machinery}")
            print()

        # 4. Shelters
        shelters = db.query(Shelter).all()
        print(f"\n[4] EVACUATION SHELTERS ({len(shelters)} total):")
        print("-" * 70)
        for s in shelters:
            print(f"  • ID: {s.id} | {s.name} ({s.district_name})")
            print(f"    Capacity: {s.capacity_persons} | Occupancy: {s.current_occupancy} | Status: {s.status}")
            print(f"    Officer: {s.contact_officer} ({s.phone}) | Helipad: {s.has_helipad}")
            print()

        # 5. Historical Landslides
        events = db.query(HistoricalLandslide).all()
        print(f"\n[5] HISTORICAL LANDSLIDES ({len(events)} total):")
        print("-" * 70)
        for e in events:
            print(f"  • ID: {e.id} | Date: {e.date} | Location: {e.location} ({e.district}, {e.state})")
            print(f"    Fatalities: {e.fatalities} | Displaced: {e.displaced_count} | Loss: INR {e.estimated_loss_cr_inr} Cr")
            print(f"    Trigger: {e.trigger}")
            print()

        # 6. Districts & Sensors Counts
        districts_count = db.query(DistrictRecord).count()
        sensors_count = db.query(SensorRecord).count()
        print(f"\n[6] DISTRICTS & SENSORS:")
        print("-" * 70)
        print(f"  • Monitored Districts in DB: {districts_count}")
        print(f"  • IoT Ground Sensors in DB:  {sensors_count}")

        print("\n" + "=" * 70)
        print("              DATABASE INSPECTION COMPLETE")
        print("=" * 70)

    finally:
        db.close()


if __name__ == "__main__":
    inspect_database()
