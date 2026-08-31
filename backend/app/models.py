from sqlalchemy import Column, String, Integer, Float, Boolean, Text, JSON, DateTime
from datetime import datetime, timezone
from .database import Base

class CitizenReport(Base):
    __tablename__ = 'citizen_reports'

    id = Column(String(64), primary_key=True, index=True)
    reporter_name = Column(String(255), default='Anonymous Citizen')
    reporter_phone = Column(String(64), default='Unspecified')
    village = Column(String(255), default='NER Hill Village')
    district = Column(String(255), default='Monitored District')
    state = Column(String(255), default='NER')
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    incident_type = Column(String(255), default='Ground Crack')
    crack_width_cm = Column(Float, default=5.0)
    crack_length_m = Column(Float, default=10.0)
    water_seepage_observed = Column(Boolean, default=False)
    structures_threatened = Column(Text, default='Road and houses')
    description = Column(Text, default='')
    image_url = Column(Text, default='')
    status = Column(String(64), default='PENDING_VERIFICATION')
    submitted_at = Column(String(64), default=lambda: datetime.now(timezone.utc).isoformat())
    verified_by = Column(String(255), nullable=True)
    ai_risk_alignment = Column(String(255), default='EVALUATING')

    def to_dict(self):
        return {
            'id': self.id,
            'reporter_name': self.reporter_name,
            'reporter_phone': self.reporter_phone,
            'village': self.village,
            'district': self.district,
            'state': self.state,
            'lat': self.lat,
            'lng': self.lng,
            'incident_type': self.incident_type,
            'crack_width_cm': self.crack_width_cm,
            'crack_length_m': self.crack_length_m,
            'water_seepage_observed': self.water_seepage_observed,
            'structures_threatened': self.structures_threatened,
            'description': self.description,
            'image_url': self.image_url,
            'status': self.status,
            'submitted_at': self.submitted_at,
            'verified_by': self.verified_by,
            'ai_risk_alignment': self.ai_risk_alignment
        }


class Alert(Base):
    __tablename__ = 'alerts'

    id = Column(String(64), primary_key=True, index=True)
    severity = Column(String(64), default='HIGH')  # CRITICAL, HIGH, MEDIUM, LOW
    category = Column(String(64), default='WARNING')  # EVACUATION_ORDER, WARNING, ADVISORY
    district_id = Column(String(64), index=True)
    district_name = Column(String(255))
    state = Column(String(255))
    location = Column(String(255))
    title = Column(String(255))
    message = Column(Text)
    multilingual = Column(JSON, default=dict)
    trigger_source = Column(String(255), default='AI_HYBRID')
    created_at = Column(String(64), default=lambda: datetime.now(timezone.utc).isoformat())
    sla_seconds = Column(Integer, default=120)
    escalation_stage = Column(String(64), default='STAGE_1_DDMA')
    acknowledged = Column(Boolean, default=False)
    acknowledged_by = Column(String(255), nullable=True)
    acknowledged_at = Column(String(64), nullable=True)
    dispatched_channels = Column(JSON, default=dict)

    def to_dict(self):
        return {
            'id': self.id,
            'severity': self.severity,
            'category': self.category,
            'district_id': self.district_id,
            'district_name': self.district_name,
            'state': self.state,
            'location': self.location,
            'title': self.title,
            'message': self.message,
            'multilingual': self.multilingual or {},
            'trigger_source': self.trigger_source,
            'created_at': self.created_at,
            'sla_seconds': self.sla_seconds,
            'escalation_stage': self.escalation_stage,
            'acknowledged': self.acknowledged,
            'acknowledged_by': self.acknowledged_by,
            'acknowledged_at': self.acknowledged_at,
            'dispatched_channels': self.dispatched_channels or {}
        }


class RoadCorridor(Base):
    __tablename__ = 'road_corridors'

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    section = Column(String(255))
    state = Column(String(255))
    length_km = Column(Float, default=0.0)
    status = Column(String(64), default='OPEN')  # BLOCKED, AT_RISK, OPEN
    severity = Column(String(64), default='LOW')
    chokepoint_name = Column(String(255))
    blockage_type = Column(String(255))
    debris_volume_m3 = Column(Float, default=0.0)
    affected_coordinates = Column(JSON, default=list)
    coordinates_path = Column(JSON, default=list)
    estimated_clearance_hrs = Column(Float, default=0.0)
    deployed_machinery = Column(Text, default='')
    bypass_route = Column(Text, default='')
    last_updated = Column(String(64), default=lambda: datetime.now(timezone.utc).isoformat())

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'section': self.section,
            'state': self.state,
            'length_km': self.length_km,
            'status': self.status,
            'severity': self.severity,
            'chokepoint_name': self.chokepoint_name,
            'blockage_type': self.blockage_type,
            'debris_volume_m3': self.debris_volume_m3,
            'affected_coordinates': self.affected_coordinates or [],
            'coordinates_path': self.coordinates_path or [],
            'estimated_clearance_hrs': self.estimated_clearance_hrs,
            'deployed_machinery': self.deployed_machinery,
            'bypass_route': self.bypass_route,
            'last_updated': self.last_updated
        }


class HistoricalLandslide(Base):
    __tablename__ = 'historical_landslides'

    id = Column(String(64), primary_key=True, index=True)
    date = Column(String(64))
    location = Column(String(255))
    district = Column(String(255))
    state = Column(String(255))
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    severity = Column(String(64))
    fatalities = Column(Integer, default=0)
    displaced_count = Column(Integer, default=0)
    estimated_loss_cr_inr = Column(Float, default=0.0)
    trigger = Column(Text)
    description = Column(Text)
    geological_cause = Column(Text)

    def to_dict(self):
        return {
            'id': self.id,
            'date': self.date,
            'location': self.location,
            'district': self.district,
            'state': self.state,
            'lat': self.lat,
            'lng': self.lng,
            'severity': self.severity,
            'fatalities': self.fatalities,
            'displaced_count': self.displaced_count,
            'estimated_loss_cr_inr': self.estimated_loss_cr_inr,
            'trigger': self.trigger,
            'description': self.description,
            'geological_cause': self.geological_cause
        }


class Shelter(Base):
    __tablename__ = 'shelters'

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    district_id = Column(String(64), index=True)
    district_name = Column(String(255))
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    capacity_persons = Column(Integer, default=500)
    current_occupancy = Column(Integer, default=0)
    status = Column(String(64), default='OPERATIONAL')
    contact_officer = Column(String(255))
    phone = Column(String(64))
    has_helipad = Column(Boolean, default=False)
    has_medical_unit = Column(Boolean, default=True)
    supplies_ration_days = Column(Integer, default=10)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'district_id': self.district_id,
            'district_name': self.district_name,
            'lat': self.lat,
            'lng': self.lng,
            'capacity_persons': self.capacity_persons,
            'current_occupancy': self.current_occupancy,
            'status': self.status,
            'contact_officer': self.contact_officer,
            'phone': self.phone,
            'has_helipad': self.has_helipad,
            'has_medical_unit': self.has_medical_unit,
            'supplies_ration_days': self.supplies_ration_days
        }


class DistrictRecord(Base):
    __tablename__ = 'districts'

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    state = Column(String(255), nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    population_at_risk = Column(Integer, default=0)
    mean_slope_deg = Column(Float, default=0.0)
    elevation_m = Column(Float, default=0.0)
    baseline_susceptibility = Column(Float, default=0.0)
    weather = Column(JSON, default=dict)
    risk_score = Column(Float, default=0.0)
    active_risk_level = Column(String(64), default='LOW')
    risk_components = Column(JSON, default=dict)
    lead_time_projections = Column(JSON, default=list)
    lead_time_window = Column(String(64), default='+24h Peak')
    monitored_sensors = Column(JSON, default=list)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'state': self.state,
            'lat': self.lat,
            'lng': self.lng,
            'population_at_risk': self.population_at_risk,
            'mean_slope_deg': self.mean_slope_deg,
            'elevation_m': self.elevation_m,
            'baseline_susceptibility': self.baseline_susceptibility,
            'weather': self.weather or {},
            'risk_score': self.risk_score,
            'active_risk_level': self.active_risk_level,
            'risk_components': self.risk_components or {},
            'lead_time_projections': self.lead_time_projections or [],
            'lead_time_window': self.lead_time_window,
            'monitored_sensors': self.monitored_sensors or []
        }


class SensorRecord(Base):
    __tablename__ = 'sensors'

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    district_id = Column(String(64), index=True)
    district_name = Column(String(255))
    state = Column(String(255))
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    sensor_type = Column(String(255))
    soil_moisture_pct = Column(Float, default=0.0)
    tilt_angle_deg = Column(Float, default=0.0)
    tilt_rate_deg_hr = Column(Float, default=0.0)
    pore_water_pressure_kpa = Column(Float, default=0.0)
    rainfall_rate_mm_hr = Column(Float, default=0.0)
    vibration_acceleration_g = Column(Float, default=0.0)
    battery_pct = Column(Float, default=100.0)
    status = Column(String(64), default='NORMAL')
    last_ping_utc = Column(String(64), default=lambda: datetime.now(timezone.utc).isoformat())

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'district_id': self.district_id,
            'district_name': self.district_name,
            'state': self.state,
            'lat': self.lat,
            'lng': self.lng,
            'sensor_type': self.sensor_type,
            'soil_moisture_pct': self.soil_moisture_pct,
            'tilt_angle_deg': self.tilt_angle_deg,
            'tilt_rate_deg_hr': self.tilt_rate_deg_hr,
            'pore_water_pressure_kpa': self.pore_water_pressure_kpa,
            'rainfall_rate_mm_hr': self.rainfall_rate_mm_hr,
            'vibration_acceleration_g': self.vibration_acceleration_g,
            'battery_pct': self.battery_pct,
            'status': self.status,
            'last_ping_utc': self.last_ping_utc
        }
