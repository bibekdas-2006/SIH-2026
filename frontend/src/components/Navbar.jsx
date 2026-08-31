import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ScenarioController } from './ScenarioController';
import {
  ShieldAlert,
  Radio,
  Globe,
  UserCheck,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Clock,
  Activity,
  AlertOctagon,
  Layers,
  FileSpreadsheet
} from 'lucide-react';

export const Navbar = ({ currentTab, setCurrentTab }) => {
  const {
    role,
    setRole,
    lang,
    setLang,
    t,
    summary,
    isSirenActive,
    setIsSirenActive,
    isLowBandwidth,
    setIsLowBandwidth,
    alerts
  } = useApp();

  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' }) + ' IST');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const criticalCount = summary?.critical_districts || 0;
  const isEmergency = criticalCount > 0;

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिन्दी (Hindi)' },
    { code: 'as', label: 'অসমীয়া (Assamese)' },
    { code: 'bn', label: 'বাংলা (Bengali)' },
    { code: 'khasi', label: 'Khasi' },
    { code: 'mizo', label: 'Mizo' }
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md px-4 lg:px-6 py-2.5">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Brand & Status */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`p-2 rounded-xl border ${isEmergency ? 'bg-red-950/80 border-red-500 text-red-400 animate-pulse' : 'bg-indigo-950/80 border-indigo-500/50 text-indigo-400'}`}>
              <ShieldAlert className="w-5 h-5" />
            </div>
            {isEmergency && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm lg:text-base text-white tracking-tight flex items-center gap-1.5">
                {t.system_title}
                <span className="text-[10px] bg-indigo-600/30 text-indigo-300 font-mono px-1.5 py-0.5 rounded border border-indigo-500/30">
                  SIH26001
                </span>
              </h1>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              {t.subtitle} &bull; <span className="text-slate-300 font-medium">8 NER States</span>
            </p>
          </div>
        </div>

        {/* Center: Live Hazard Badge & Clock */}
        <div className="hidden xl:flex items-center gap-3 bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-1.5">
          <div className="flex items-center gap-1.5 text-xs">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-mono text-slate-200 font-semibold">{timeStr}</span>
          </div>

          <div className="h-3.5 w-px bg-slate-700" />

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">NER Regional Alert:</span>
            {isEmergency ? (
              <span className="flex items-center gap-1 text-[11px] font-bold text-red-400 bg-red-950/80 border border-red-600/60 px-2 py-0.5 rounded-full animate-pulse">
                <AlertOctagon className="w-3 h-3" />
                {criticalCount} SECTOR{criticalCount > 1 ? 'S' : ''} CRITICAL
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-600/40 px-2 py-0.5 rounded-full">
                <Activity className="w-3 h-3" />
                MONITORED NORMAL
              </span>
            )}
          </div>
        </div>

        {/* Right: Controls & Role Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Scenario Demo Controller */}
          <ScenarioController />

          {/* Role Switcher */}
          <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-xl p-0.5">
            <button
              onClick={() => { setRole('ddma_officer'); setCurrentTab('gis_map'); }}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                role === 'ddma_officer'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="District Disaster Management Authority Command"
            >
              DDMA
            </button>
            <button
              onClick={() => { setRole('ndrf_responder'); setCurrentTab('responders'); }}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                role === 'ndrf_responder'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="First Responder & NDRF Tactical View"
            >
              NDRF
            </button>
            <button
              onClick={() => { setRole('geologist'); setCurrentTab('geologist'); }}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                role === 'geologist'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Geologist Sensor Telemetry & AI Model Lab"
            >
              ML Lab
            </button>
            <button
              onClick={() => { setRole('citizen'); setCurrentTab('citizen_view'); }}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                role === 'citizen'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Citizen PWA / Public HillShield App"
            >
              Citizen PWA
            </button>
          </div>

          {/* Language Selector */}
          <div className="relative flex items-center">
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-xs font-medium text-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {languages.map((l) => (
                <option key={l.code} value={l.code} className="bg-slate-900 text-white">
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          {/* Siren Manual Toggle */}
          <button
            onClick={() => setIsSirenActive(!isSirenActive)}
            className={`p-1.5 rounded-xl border transition-all ${
              isSirenActive
                ? 'bg-red-600 border-red-400 text-white animate-bounce'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title={isSirenActive ? "Stop Emergency Siren" : "Test Emergency Siren Audio"}
          >
            {isSirenActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
