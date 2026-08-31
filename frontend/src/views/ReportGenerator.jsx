import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import {
  FileSpreadsheet,
  Download,
  Printer,
  FileText,
  AlertTriangle,
  Shield,
  Truck,
  Layers,
  CheckCircle2,
  Calendar,
  Building
} from 'lucide-react';

export const ReportGenerator = () => {
  const { districts, roads, alerts, summary } = useApp();
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await api.getSummaryReport();
        if (res) setReportData(res);
      } catch (e) {
        console.error(e);
      }
    };
    fetchReport();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const downloadCSV = () => {
    window.open('/api/export/csv/district_status', '_blank');
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6 text-left">
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
            <FileSpreadsheet className="w-6 h-6 text-indigo-400" />
            Executive Disaster Hazard Assessment & Situation Report (FR4.6)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Downloadable analytics, multi-district vulnerability briefings, and GSI/IMD situational status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={downloadCSV}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-950/60 transition-all"
          >
            <Download className="w-4 h-4" />
            Export CSV Dataset
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
          >
            <Printer className="w-4 h-4" />
            Print Briefing PDF
          </button>
        </div>
      </div>

      {/* Printable Report Document Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl printable-area">
        {/* Document Header */}
        <div className="border-b-2 border-slate-700 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block font-mono">
              GOVERNMENT OF INDIA &bull; NORTH EASTERN DISASTER COUNCIL
            </span>
            <h3 className="text-lg font-extrabold text-white mt-1">
              Regional Landslide Hazard Risk & Early Warning Assessment
            </h3>
            <p className="text-xs text-slate-400">
              Generated for: DDMA / SDMA / NDMA Unified Command Briefing &bull; Smart India Hackathon 2026
            </p>
          </div>

          <div className="text-right text-xs">
            <span className="text-slate-400 block text-[11px]">Report Timestamp</span>
            <span className="font-mono text-white font-bold block">{new Date().toLocaleString('en-IN')} IST</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-red-950 text-red-400 font-bold border border-red-800 inline-block mt-1">
              STATUS: {summary?.overall_ner_status || 'CRITICAL'}
            </span>
          </div>
        </div>

        {/* Executive Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Monitored Hill Districts</span>
            <span className="text-base font-bold text-white font-mono mt-0.5 block">{districts.length} Sectors</span>
          </div>
          <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">At-Risk Population</span>
            <span className="text-base font-bold text-red-400 font-mono mt-0.5 block">
              {(summary?.total_population_at_high_risk || 320000).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Critical Alarms Active</span>
            <span className="text-base font-bold text-amber-400 font-mono mt-0.5 block">{alerts.length} Warnings</span>
          </div>
          <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Highways Blocked</span>
            <span className="text-base font-bold text-orange-400 font-mono mt-0.5 block">
              {roads.filter(r => r.status === 'BLOCKED').length} Arteries
            </span>
          </div>
        </div>

        {/* District Risk Table */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            1. Sector-Wise Hydro-Geotechnical Assessment Matrix
          </h4>
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 text-[11px] font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">District & State</th>
                  <th className="py-2.5 px-3">Risk Level</th>
                  <th className="py-2.5 px-3 font-mono">Score</th>
                  <th className="py-2.5 px-3">Rain (24h/FC)</th>
                  <th className="py-2.5 px-3">Slope (Mean)</th>
                  <th className="py-2.5 px-3">Population</th>
                  <th className="py-2.5 px-3">Lead Time Window</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {districts.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-950/60">
                    <td className="py-2 px-3 font-bold text-white">
                      {d.name} <span className="text-[10px] text-slate-400 font-normal">({d.state})</span>
                    </td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        d.active_risk_level === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                        d.active_risk_level === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                        d.active_risk_level === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {d.active_risk_level}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-mono font-bold">{d.risk_score}</td>
                    <td className="py-2 px-3 font-mono text-cyan-300">
                      {d.weather?.rainfall_24h_mm} / {d.weather?.rainfall_forecast_24h_mm} mm
                    </td>
                    <td className="py-2 px-3 font-mono">{d.mean_slope_deg}°</td>
                    <td className="py-2 px-3 font-mono">{d.population_at_risk?.toLocaleString()}</td>
                    <td className="py-2 px-3 text-[11px] text-slate-300">{d.lead_time_window}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Transportation & Highway Status */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            2. Strategic Transportation Corridors & Blockage Summary
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {roads.map((r) => (
              <div key={r.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white">{r.name}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.status === 'BLOCKED' ? 'bg-red-600 text-white' : r.status === 'AT_RISK' ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'}`}>
                    {r.status}
                  </span>
                </div>
                <div className="text-slate-400 text-[11px]">Chokepoint: {r.chokepoint_name} ({r.blockage_type})</div>
                <div className="text-indigo-300 text-[11px]">Bypass: {r.bypass_route}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
