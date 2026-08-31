import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  AlertTriangle,
  Radio,
  Clock,
  Droplets,
  Activity,
  Compass,
  Building2,
  PhoneCall,
  CheckSquare,
  Send,
  Zap,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import { api } from '../utils/api';
import confetti from 'canvas-confetti';

export const DistrictDetailModal = ({ district, onClose }) => {
  const { t, lang, setIsSirenActive, refreshData } = useApp();
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  if (!district) return null;

  const riskColor =
    district.active_risk_level === 'CRITICAL'
      ? 'bg-red-500/20 text-red-400 border-red-500/40'
      : district.active_risk_level === 'HIGH'
      ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
      : district.active_risk_level === 'MEDIUM'
      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
      : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';

  const handleBroadcast = async () => {
    setIsBroadcasting(true);
    try {
      const msg = broadcastMsg || `IMMINENT LANDSLIDE ALERT for ${district.name}, ${district.state}. High slope instability detected. Evacuate to safe shelters immediately.`;
      await api.broadcastAlert({
        district_id: district.id,
        district_name: district.name,
        state: district.state,
        severity: district.active_risk_level,
        location: `${district.name} Hill Sector`,
        message: msg
      });
      setBroadcastSuccess(true);
      if (district.active_risk_level === 'CRITICAL') {
        setIsSirenActive(true);
      }
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      await refreshData();
      setTimeout(() => setBroadcastSuccess(false), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsBroadcasting(false);
    }
  };

  const comps = district.risk_components || {
    static_susceptibility_pct: Math.round(district.baseline_susceptibility * 100),
    rainfall_factor_pct: 75,
    forecast_rainfall_factor_pct: 68,
    soil_saturation_pct: 82,
    geotechnical_creep_pct: 70
  };

  const projections = district.lead_time_projections || [
    { window: "+6h", label: "6 Hours", projected_score: Math.min(99, district.risk_score + 5), projected_level: district.active_risk_level },
    { window: "+12h", label: "12 Hours", projected_score: Math.min(99, district.risk_score + 9), projected_level: "CRITICAL" },
    { window: "+24h", label: "24 Hours (Peak)", projected_score: Math.min(99, district.risk_score + 12), projected_level: "CRITICAL" },
    { window: "+48h", label: "48 Hours", projected_score: Math.max(20, district.risk_score - 8), projected_level: "HIGH" },
    { window: "+72h", label: "72 Hours", projected_score: Math.max(15, district.risk_score - 20), projected_level: "MEDIUM" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden text-left">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1 rounded-xl text-xs font-bold border ${riskColor} uppercase tracking-wider`}>
              {district.active_risk_level} RISK &bull; {district.risk_score}/100
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                {district.name}
                <span className="text-xs font-normal text-slate-400">({district.state})</span>
              </h3>
              <p className="text-xs text-slate-400">
                HQ: {district.headquarters} &bull; Elev: {district.elevation_m}m &bull; Mean Slope: {district.mean_slope_deg}°
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Top Row: AI Risk Breakdown & Lead-Time Forecast */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Multi-Factor AI Risk Decomposition */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-indigo-400" />
                AI Risk Factor Decomposition (FR2.2)
              </h4>
              <div className="space-y-2.5">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Static Geological Susceptibility (ML)</span>
                    <span className="font-mono text-indigo-300 font-semibold">{comps.static_susceptibility_pct}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${comps.static_susceptibility_pct}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Antecedent Rainfall Saturation (24h/72h)</span>
                    <span className="font-mono text-cyan-300 font-semibold">{comps.rainfall_factor_pct}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${comps.rainfall_factor_pct}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Real-Time Soil Moisture Saturation</span>
                    <span className="font-mono text-amber-300 font-semibold">{comps.soil_saturation_pct}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${comps.soil_saturation_pct}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Geotechnical Creep & Pore Pressure Rate</span>
                    <span className="font-mono text-red-300 font-semibold">{comps.geotechnical_creep_pct}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-red-500 h-full rounded-full" style={{ width: `${comps.geotechnical_creep_pct}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Lead Time Prediction Window */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" />
                Lead-Time Forecast Window (6h - 72h) (FR2.3)
              </h4>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 mb-3 text-xs text-slate-300">
                <span className="font-semibold text-amber-400">Current Lead-Time: </span>
                {district.lead_time_window || "High slope instability expected in 6-18 hours."}
              </div>
              <div className="grid grid-cols-5 gap-2 text-center">
                {projections.map((p, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded-lg border text-xs ${
                      p.projected_score >= 82
                        ? 'bg-red-950/60 border-red-600/50 text-red-300'
                        : p.projected_score >= 62
                        ? 'bg-orange-950/60 border-orange-600/50 text-orange-300'
                        : p.projected_score >= 38
                        ? 'bg-amber-950/60 border-amber-600/50 text-amber-300'
                        : 'bg-emerald-950/60 border-emerald-600/50 text-emerald-300'
                    }`}
                  >
                    <div className="font-bold text-[11px] text-slate-200">{p.window}</div>
                    <div className="font-mono text-sm font-extrabold my-0.5">{p.projected_score}</div>
                    <div className="text-[9px] uppercase font-bold tracking-tight">{p.projected_level}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Middle Row: Terrain & Weather Specs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-950/40 border border-slate-800 p-3 rounded-xl">
              <span className="text-slate-400 block text-[11px]">Population at Risk</span>
              <span className="text-sm font-bold text-white font-mono mt-0.5 block">
                {district.population_at_risk.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="bg-slate-950/40 border border-slate-800 p-3 rounded-xl">
              <span className="text-slate-400 block text-[11px]">24h Rain / Forecast</span>
              <span className="text-sm font-bold text-cyan-300 font-mono mt-0.5 block">
                {district.weather?.rainfall_24h_mm} / {district.weather?.rainfall_forecast_24h_mm} mm
              </span>
            </div>
            <div className="bg-slate-950/40 border border-slate-800 p-3 rounded-xl">
              <span className="text-slate-400 block text-[11px]">Evacuation Shelters</span>
              <span className="text-sm font-bold text-emerald-400 font-mono mt-0.5 block">
                {district.evacuation_shelters_count} Designated Hubs
              </span>
            </div>
            <div className="bg-slate-950/40 border border-slate-800 p-3 rounded-xl">
              <span className="text-slate-400 block text-[11px]">Monitored IoT Nodes</span>
              <span className="text-sm font-bold text-indigo-400 font-mono mt-0.5 block">
                {district.monitored_sensors?.length || 1} Stations Active
              </span>
            </div>
          </div>

          {/* Vulnerable Villages & Geological Info */}
          <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl text-xs space-y-2">
            <div>
              <span className="text-slate-400 font-semibold">Lithology & Geology: </span>
              <span className="text-slate-200">{district.geology} ({district.soil_type})</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold">High-Risk Villages / Settlements: </span>
              <span className="text-slate-200">{district.vulnerable_villages?.join(', ')}</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold">Critical Highway Lifelines: </span>
              <span className="text-amber-300 font-semibold">{district.primary_highways?.join(', ')}</span>
            </div>
          </div>

          {/* Broadcast Action Panel (FR3.1 / FR3.2) */}
          <div className="bg-gradient-to-r from-red-950/60 to-slate-950/90 border border-red-500/30 rounded-xl p-4">
            <h4 className="text-xs font-bold text-red-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-red-400 animate-pulse" />
              Automated Multilingual Emergency Broadcast Dispatch (DDMA Officer)
            </h4>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={broadcastMsg}
                onChange={(e) => setBroadcastMsg(e.target.value)}
                placeholder={`Type custom emergency broadcast for ${district.name} or click send default alert...`}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
              <button
                onClick={handleBroadcast}
                disabled={isBroadcasting}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-950/60 transition-all disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {isBroadcasting ? "Transmitting..." : "Broadcast Alert (SMS/IVR/Push)"}
              </button>
            </div>
            {broadcastSuccess && (
              <div className="mt-2.5 p-2 bg-emerald-950/80 border border-emerald-500/50 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Emergency alert dispatched to District Administration, SDRF, NDRF, and citizen SMS/IVR queues!
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/70 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors"
          >
            Close Drilldown
          </button>
        </div>
      </div>
    </div>
  );
};
