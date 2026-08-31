import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import {
  Truck,
  AlertTriangle,
  CheckCircle,
  Clock,
  Navigation,
  Shield,
  Wrench,
  Flame,
  Radio,
  ExternalLink,
  MapPin,
  Compass
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const ResponderView = () => {
  const { roads, refreshData } = useApp();
  const [updatingId, setUpdatingId] = useState(null);
  const [actionSuccess, setActionSuccess] = useState('');

  const handleUpdateStatus = async (roadId, newStatus, newSeverity) => {
    setUpdatingId(roadId);
    try {
      await api.updateRoadStatus(roadId, {
        status: newStatus,
        severity: newSeverity,
        estimated_clearance_hrs: newStatus === 'OPEN' ? 0 : 4.0
      });
      setActionSuccess(`Corridor status updated to ${newStatus}`);
      confetti({ particleCount: 40, spread: 60 });
      await refreshData();
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
            <Truck className="w-6 h-6 text-amber-400" />
            First Responder & Road Network Tactical Command (NDRF / SDRF / BRO)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time highway blockage surveillance, debris clearance ETAs, machinery logistics, and bypass corridors (FR4.4).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-red-950/80 border border-red-500/50 rounded-xl text-red-300 text-xs font-bold flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            {roads.filter(r => r.status === 'BLOCKED').length} Critical Blockages
          </div>
          <div className="px-3 py-1 bg-amber-950/80 border border-amber-500/50 rounded-xl text-amber-300 text-xs font-bold flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-400" />
            {roads.filter(r => r.status === 'AT_RISK').length} Corridors At Risk
          </div>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/60 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          {actionSuccess}
        </div>
      )}

      {/* Corridors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {roads.map((r) => {
          const isBlocked = r.status === 'BLOCKED';
          const isAtRisk = r.status === 'AT_RISK';

          return (
            <div
              key={r.id}
              className={`border rounded-2xl p-5 backdrop-blur-xl shadow-xl transition-all ${
                isBlocked
                  ? 'bg-red-950/30 border-red-500/50 shadow-red-950/40'
                  : isAtRisk
                  ? 'bg-amber-950/30 border-amber-500/50 shadow-amber-950/40'
                  : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                    {r.state} &bull; {r.length_km} KM
                  </span>
                  <h3 className="text-base font-bold text-white mt-0.5">{r.name}</h3>
                  <p className="text-xs text-slate-300 mt-0.5">{r.section}</p>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-xl text-xs font-extrabold uppercase tracking-wider ${
                    isBlocked
                      ? 'bg-red-600 text-white animate-pulse'
                      : isAtRisk
                      ? 'bg-amber-600 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {r.status}
                </span>
              </div>

              {/* Chokepoint & Debris Details */}
              <div className="py-3 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold">Active Chokepoint:</span>
                  <span className="text-white font-medium">{r.chokepoint_name}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold">Failure Mechanism:</span>
                  <span className="text-amber-300 font-medium">{r.blockage_type}</span>
                </div>

                {isBlocked && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-semibold">Estimated Debris Volume:</span>
                    <span className="font-mono text-red-300 font-bold">{r.debris_volume_m3?.toLocaleString()} m³</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold">Estimated Clearance Time:</span>
                  <span className="font-mono text-cyan-300 font-bold">
                    {r.estimated_clearance_hrs > 0 ? `${r.estimated_clearance_hrs} Hours` : "Clear"}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
                  <div className="text-slate-400 text-[11px] font-semibold flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-indigo-400" /> Deployed Machinery & Units:
                  </div>
                  <div className="text-slate-200 text-xs">{r.deployed_machinery}</div>
                </div>

                <div className="p-2.5 bg-indigo-950/30 border border-indigo-500/30 rounded-xl space-y-1">
                  <div className="text-indigo-300 text-[11px] font-semibold flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-indigo-400" /> Recommended Alternate Bypass:
                  </div>
                  <div className="text-indigo-100 text-xs">{r.bypass_route}</div>
                </div>
              </div>

              {/* Action Controls for Field Responders */}
              <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400">Update Tactical Status:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleUpdateStatus(r.id, 'BLOCKED', 'CRITICAL')}
                    disabled={updatingId === r.id || isBlocked}
                    className="px-2.5 py-1 bg-red-900/60 hover:bg-red-800 text-red-200 rounded-lg text-xs font-semibold border border-red-500/40 disabled:opacity-40"
                  >
                    Mark Blocked
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(r.id, 'AT_RISK', 'HIGH')}
                    disabled={updatingId === r.id || isAtRisk}
                    className="px-2.5 py-1 bg-amber-900/60 hover:bg-amber-800 text-amber-200 rounded-lg text-xs font-semibold border border-amber-500/40 disabled:opacity-40"
                  >
                    Mark At-Risk
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(r.id, 'OPEN', 'LOW')}
                    disabled={updatingId === r.id || (!isBlocked && !isAtRisk)}
                    className="px-2.5 py-1 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 rounded-lg text-xs font-semibold border border-emerald-500/40 disabled:opacity-40"
                  >
                    Mark Clear & Open
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
