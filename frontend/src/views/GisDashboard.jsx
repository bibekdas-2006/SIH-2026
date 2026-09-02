import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Popup, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useApp } from '../context/AppContext';
import { DistrictDetailModal } from './DistrictDetailModal';
import { api } from '../utils/api';
import {
  Layers,
  Activity,
  AlertTriangle,
  Radio,
  Clock,
  Droplets,
  Shield,
  Truck,
  History,
  Building,
  Navigation,
  Eye,
  Filter,
  Maximize2,
  HelpCircle,
  Flame
} from 'lucide-react';

// Fix standard Leaflet default icon path issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom Sensor DivIcon generator
const createSensorIcon = (status) => {
  const color =
    status === 'CRITICAL' ? '#ef4444' :
    status === 'HIGH' ? '#f97316' :
    status === 'MEDIUM' ? '#f59e0b' : '#10b981';
  
  return L.divIcon({
    className: 'custom-sensor-icon',
    html: `
      <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background-color: ${color}; opacity: 0.35; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: relative; width: 14px; height: 14px; border-radius: 50%; background-color: ${color}; border: 2px solid white; box-shadow: 0 0 8px ${color};"></div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

const createShelterIcon = () => {
  return L.divIcon({
    className: 'custom-shelter-icon',
    html: `
      <div style="background-color: #10b981; border: 2px solid white; border-radius: 6px; padding: 3px; box-shadow: 0 2px 6px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; width: 22px; height: 22px;">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 10h6"/></svg>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  });
};

const createHistoricalIcon = () => {
  return L.divIcon({
    className: 'custom-hist-icon',
    html: `
      <div style="background-color: #6366f1; border: 2px solid white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 6px rgba(99,102,241,0.8);">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

// Map Recenter Helper Component
const RecenterMap = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

export const GisDashboard = () => {
  const { districts, sensors, roads, summary, t } = useApp();
  const [selectedState, setSelectedState] = useState('ALL');
  const [selectedDistrictDetail, setSelectedDistrictDetail] = useState(null);
  const [historicalEvents, setHistoricalEvents] = useState([]);
  const [shelters, setShelters] = useState([]);
  
  // Layer Toggles
  const [showRiskZones, setShowRiskZones] = useState(true);
  const [showRainRadar, setShowRainRadar] = useState(true);
  const [showSensors, setShowSensors] = useState(true);
  const [showRoads, setShowRoads] = useState(true);
  const [showHistorical, setShowHistorical] = useState(false);
  const [showShelters, setShowShelters] = useState(true);
  const [baseMap, setBaseMap] = useState('dark'); // 'dark' | 'satellite' | 'topo'

  // Map view position: default center of NER (Assam/Meghalaya)
  const [mapCenter, setMapCenter] = useState([25.80, 92.50]);
  const [mapZoom, setMapZoom] = useState(7);

  useEffect(() => {
    const fetchAuxData = async () => {
      try {
        const [histRes, sheltRes] = await Promise.all([
          api.getHistoricalLandslides(),
          api.getShelters()
        ]);
        if (histRes?.events) setHistoricalEvents(histRes.events);
        if (sheltRes?.shelters) setShelters(sheltRes.shelters);
      } catch (err) {
        console.error("Aux data error:", err);
      }
    };
    fetchAuxData();
  }, []);

  const filteredDistricts = selectedState === 'ALL'
    ? districts
    : districts.filter(d => d.state.toLowerCase() === selectedState.toLowerCase());

  const statesList = ['ALL', 'Assam', 'Meghalaya', 'Sikkim', 'Mizoram', 'Nagaland', 'Manipur', 'Arunachal Pradesh', 'Tripura'];

  // Tile Providers
  const tileUrls = {
    dark: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    topo: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'
  };

  const tileAttributions = {
    dark: 'Tiles &copy; Esri',
    satellite: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    topo: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap'
  };

  return (
    <div className="flex flex-col h-[calc(100vh-57px)] overflow-hidden bg-slate-950">
      {/* Top KPI Summary Header Bar */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left State Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400 font-medium">State:</span>
          <div className="flex items-center gap-1 overflow-x-auto py-0.5 max-w-[320px] sm:max-w-none no-scrollbar">
            {statesList.map((st) => (
              <button
                key={st}
                onClick={() => setSelectedState(st)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap ${
                  selectedState === st
                    ? 'bg-indigo-600 text-white shadow'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Right KPI Badges */}
        <div className="flex items-center gap-2 sm:gap-4 font-medium">
          <div className="flex items-center gap-1.5 bg-slate-950/70 border border-slate-800 px-2.5 py-1 rounded-lg">
            <Flame className="w-3.5 h-3.5 text-red-400" />
            <span className="text-slate-400">At-Risk Pop:</span>
            <span className="font-mono text-red-300 font-bold">
              {(summary?.total_population_at_high_risk || 320000).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950/70 border border-slate-800 px-2.5 py-1 rounded-lg">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">Critical Sectors:</span>
            <span className="font-mono text-amber-300 font-bold">
              {summary?.critical_districts || 0}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950/70 border border-slate-800 px-2.5 py-1 rounded-lg">
            <Truck className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-slate-400">Blocked Highways:</span>
            <span className="font-mono text-orange-300 font-bold">
              {roads.filter(r => r.status === 'BLOCKED').length}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 bg-slate-950/70 border border-slate-800 px-2.5 py-1 rounded-lg">
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">IoT Nodes:</span>
            <span className="font-mono text-emerald-300 font-bold">
              {sensors.length} Online
            </span>
          </div>
        </div>
      </div>

      {/* Main Map & Floating Controls Area */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        {/* Leaflet Map Canvas */}
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          zoomControl={false}
          className="w-full h-full z-0"
        >
          <RecenterMap center={mapCenter} zoom={mapZoom} />

          {/* Base Tile Layer */}
          <TileLayer
            url={tileUrls[baseMap]}
            attribution={tileAttributions[baseMap]}
            maxZoom={18}
          />

          {/* Layer 1: Landslide Risk Zones (Districts) */}
          {showRiskZones && filteredDistricts.map((d) => {
            const color =
              d.active_risk_level === 'CRITICAL' ? '#ef4444' :
              d.active_risk_level === 'HIGH' ? '#f97316' :
              d.active_risk_level === 'MEDIUM' ? '#f59e0b' : '#10b981';

            const radius = d.active_risk_level === 'CRITICAL' ? 38000 : 28000;

            return (
              <React.Fragment key={d.id}>
                {/* Translucent Heat Circle */}
                <CircleMarker
                  center={[d.lat, d.lng]}
                  radius={24}
                  pathOptions={{
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.35,
                    weight: 2
                  }}
                  eventHandlers={{
                    click: () => setSelectedDistrictDetail(d)
                  }}
                >
                  <Tooltip direction="top" offset={[0, -10]} opacity={0.9} permanent={false}>
                    <div className="text-xs p-1 text-slate-900">
                      <strong>{d.name} ({d.state})</strong><br />
                      Risk Level: <span style={{ color }}>{d.active_risk_level} ({d.risk_score}/100)</span><br />
                      Rainfall 24h: {d.weather?.rainfall_24h_mm} mm
                    </div>
                  </Tooltip>
                </CircleMarker>
              </React.Fragment>
            );
          })}

          {/* Layer 2: Simulated Rainfall Radar Isohyets / Cloud Pulsing */}
          {showRainRadar && districts.filter(d => d.weather?.rainfall_24h_mm > 40).map((d) => (
            <CircleMarker
              key={`radar-${d.id}`}
              center={[d.lat, d.lng]}
              radius={40}
              pathOptions={{
                color: '#38bdf8',
                fillColor: '#0284c7',
                fillOpacity: 0.18,
                weight: 1,
                dashArray: '4, 4'
              }}
            />
          ))}

          {/* Layer 3: National Highway Corridors */}
          {showRoads && roads.map((r) => {
            const roadColor =
              r.status === 'BLOCKED' ? '#ef4444' :
              r.status === 'AT_RISK' ? '#f97316' : '#10b981';

            return (
              <React.Fragment key={r.id}>
                <Polyline
                  positions={r.coordinates_path}
                  pathOptions={{
                    color: roadColor,
                    weight: r.status === 'BLOCKED' ? 5 : 3.5,
                    opacity: 0.85,
                    dashArray: r.status === 'BLOCKED' ? '8, 6' : undefined
                  }}
                >
                  <Popup>
                    <div className="text-xs p-1 text-slate-900 max-w-xs">
                      <div className="font-bold text-sm text-indigo-950 mb-1">{r.name}</div>
                      <div className="mb-1">
                        <span className="font-semibold">Status: </span>
                        <span className={`font-bold ${r.status === 'BLOCKED' ? 'text-red-600' : r.status === 'AT_RISK' ? 'text-orange-600' : 'text-emerald-600'}`}>
                          {r.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-700 mb-1">
                        <strong>Chokepoint:</strong> {r.chokepoint_name} ({r.blockage_type})
                      </div>
                      {r.status === 'BLOCKED' && (
                        <div className="p-1.5 bg-red-50 border border-red-200 rounded text-red-800 text-[10px]">
                          <strong>Clearance ETA:</strong> {r.estimated_clearance_hrs} hrs<br />
                          <strong>Bypass:</strong> {r.bypass_route}
                        </div>
                      )}
                    </div>
                  </Popup>
                </Polyline>
              </React.Fragment>
            );
          })}

          {/* Layer 4: Active Ground IoT Sensors */}
          {showSensors && sensors.map((s) => (
            <Marker
              key={s.id}
              position={[s.lat, s.lng]}
              icon={createSensorIcon(s.status)}
            >
              <Popup>
                <div className="text-xs p-1 text-slate-900 max-w-xs">
                  <div className="flex items-center justify-between gap-2 border-b pb-1 mb-1.5">
                    <span className="font-bold text-slate-900">{s.name}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${s.status === 'CRITICAL' ? 'bg-red-600' : s.status === 'HIGH' ? 'bg-orange-500' : 'bg-emerald-600'}`}>
                      {s.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-700 mb-2">
                    <div>Soil Moisture: <strong>{s.soil_moisture_pct}%</strong></div>
                    <div>Tilt Angle: <strong>{s.tilt_angle_deg}°</strong></div>
                    <div>Displacement Rate: <strong>{s.tilt_rate_deg_hr}°/hr</strong></div>
                    <div>Pore Pressure: <strong>{s.pore_water_pressure_kpa} kPa</strong></div>
                    <div>Micro-Seismic: <strong>{s.vibration_acceleration_g}g</strong></div>
                    <div>Rain Rate: <strong>{s.rainfall_rate_mm_hr} mm/h</strong></div>
                  </div>
                  <button
                    onClick={() => {
                      const matched = districts.find(d => d.id === s.district_id);
                      if (matched) setSelectedDistrictDetail(matched);
                    }}
                    className="w-full py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-semibold"
                  >
                    View Slope Detail & Analytics
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Layer 5: Historical Landslide Disasters */}
          {showHistorical && historicalEvents.map((h) => (
            <Marker
              key={h.id}
              position={[h.lat, h.lng]}
              icon={createHistoricalIcon()}
            >
              <Popup>
                <div className="text-xs p-1 text-slate-900 max-w-xs">
                  <div className="font-bold text-indigo-900">{h.location} ({h.date})</div>
                  <div className="text-[11px] text-red-600 font-semibold mb-1">
                    Fatalities: {h.fatalities} &bull; Displaced: {h.displaced_count.toLocaleString()}
                  </div>
                  <p className="text-[10px] text-slate-700 mb-1 leading-tight">{h.description}</p>
                  <div className="text-[9px] text-slate-500 italic">
                    <strong>Cause:</strong> {h.geological_cause}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Layer 6: Safe Evacuation Shelters */}
          {showShelters && shelters.map((sh) => (
            <Marker
              key={sh.id}
              position={[sh.lat, sh.lng]}
              icon={createShelterIcon()}
            >
              <Popup>
                <div className="text-xs p-1 text-slate-900 max-w-xs">
                  <div className="font-bold text-emerald-800 text-sm mb-0.5">{sh.name}</div>
                  <div className="text-[11px] text-slate-600 mb-1">
                    Capacity: <strong>{sh.capacity_persons}</strong> persons &bull; Occupancy: <strong>{sh.current_occupancy}</strong>
                  </div>
                  <div className="text-[11px] text-slate-700 mb-1">
                    <strong>Nodal Officer:</strong> {sh.contact_officer}<br />
                    <strong>Emergency Phone:</strong> <a href={`tel:${sh.phone}`} className="text-indigo-600 font-semibold">{sh.phone}</a>
                  </div>
                  <div className="text-[10px] text-emerald-700 bg-emerald-50 p-1 rounded">
                    Ration Available: {sh.supplies_ration_days} days &bull; Helipad: {sh.has_helipad ? 'Yes' : 'No'}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Floating Layer Toggles Panel (Top-Right) */}
        <div className="absolute top-4 right-4 z-10 bg-slate-900/95 border border-slate-700/80 rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl max-w-xs text-left">
          <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              {t.layers.title}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setBaseMap('dark')}
                className={`px-1.5 py-0.5 text-[10px] rounded ${baseMap === 'dark' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
              >
                Dark
              </button>
              <button
                onClick={() => setBaseMap('satellite')}
                className={`px-1.5 py-0.5 text-[10px] rounded ${baseMap === 'satellite' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
              >
                Sat
              </button>
              <button
                onClick={() => setBaseMap('topo')}
                className={`px-1.5 py-0.5 text-[10px] rounded ${baseMap === 'topo' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
              >
                Topo
              </button>
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            <label className="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer select-none">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                {t.layers.susceptibility}
              </span>
              <input
                type="checkbox"
                checked={showRiskZones}
                onChange={(e) => setShowRiskZones(e.target.checked)}
                className="rounded accent-indigo-600"
              />
            </label>

            <label className="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer select-none">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                {t.layers.rainfall}
              </span>
              <input
                type="checkbox"
                checked={showRainRadar}
                onChange={(e) => setShowRainRadar(e.target.checked)}
                className="rounded accent-indigo-600"
              />
            </label>

            <label className="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer select-none">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping-slow" />
                {t.layers.sensors}
              </span>
              <input
                type="checkbox"
                checked={showSensors}
                onChange={(e) => setShowSensors(e.target.checked)}
                className="rounded accent-indigo-600"
              />
            </label>

            <label className="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer select-none">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                {t.layers.roads}
              </span>
              <input
                type="checkbox"
                checked={showRoads}
                onChange={(e) => setShowRoads(e.target.checked)}
                className="rounded accent-indigo-600"
              />
            </label>

            <label className="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer select-none">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                {t.layers.historical}
              </span>
              <input
                type="checkbox"
                checked={showHistorical}
                onChange={(e) => setShowHistorical(e.target.checked)}
                className="rounded accent-indigo-600"
              />
            </label>

            <label className="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer select-none">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                {t.layers.shelters}
              </span>
              <input
                type="checkbox"
                checked={showShelters}
                onChange={(e) => setShowShelters(e.target.checked)}
                className="rounded accent-indigo-600"
              />
            </label>
          </div>
        </div>

        {/* Floating Quick Legend & District Quick Cards (Bottom-Left) */}
        <div className="absolute bottom-4 left-4 z-10 max-w-sm hidden lg:block text-left">
          <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>NER Monitored Sectors</span>
              <span className="text-[10px] text-slate-400 font-normal">Click to Inspect</span>
            </h4>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {filteredDistricts.slice(0, 5).map((d) => (
                <div
                  key={d.id}
                  onClick={() => setSelectedDistrictDetail(d)}
                  className="p-2 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 cursor-pointer flex items-center justify-between transition-all"
                >
                  <div>
                    <div className="text-xs font-bold text-white">{d.name}</div>
                    <div className="text-[10px] text-slate-400">{d.state} &bull; Rain: {d.weather?.rainfall_24h_mm}mm</div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      d.active_risk_level === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                      d.active_risk_level === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' :
                      d.active_risk_level === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                      'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    }`}
                  >
                    {d.risk_score}/100
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* District Detail Modal */}
      {selectedDistrictDetail && (
        <DistrictDetailModal
          district={selectedDistrictDetail}
          onClose={() => setSelectedDistrictDetail(null)}
        />
      )}
    </div>
  );
};
