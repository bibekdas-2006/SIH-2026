import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Play, Sun, CloudRain, Zap, Waves, CheckCircle2, ChevronDown, ChevronUp, Sliders } from 'lucide-react';

export const ScenarioController = () => {
  const { activeScenario, triggerScenario } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  const scenarios = [
    {
      id: 'NORMAL',
      name: '1. Clear Weather / Baseline',
      icon: Sun,
      color: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40',
      activeColor: 'ring-2 ring-emerald-400 bg-emerald-900/60',
      badge: 'STABLE',
      desc: 'Routine dry season, low pore pressure, safe highway corridors.'
    },
    {
      id: 'MONSOON_TORRENTIAL',
      name: '2. Monsoon Torrential Rain',
      icon: CloudRain,
      color: 'text-amber-400 border-amber-500/40 bg-amber-950/40',
      activeColor: 'ring-2 ring-amber-400 bg-amber-900/60',
      badge: 'ELEVATED RISK',
      desc: 'Widespread cloudburst (50–140mm), soil saturation > 85%, orange alerts.'
    },
    {
      id: 'SLOPE_ANOMALY',
      name: '3. Sudden Slope Slip Anomaly',
      icon: Zap,
      color: 'text-red-400 border-red-500/40 bg-red-950/40',
      activeColor: 'ring-2 ring-red-500 bg-red-900/70 animate-pulse',
      badge: 'FAST-PATH CRITICAL',
      desc: 'Instant tilt acceleration (0.88°/hr) & micro-tremor at Sohra/Haflong. Evacuation sirens.'
    },
    {
      id: 'FLASH_FLOOD',
      name: '4. Teesta Flash Surge / Toe Erosion',
      icon: Waves,
      color: 'text-purple-400 border-purple-500/40 bg-purple-950/40',
      activeColor: 'ring-2 ring-purple-500 bg-purple-900/60',
      badge: 'HIGHWAY COLLAPSE',
      desc: 'River scouring causes NH-10 Sikkim lifeline collapse & debris inundation.'
    }
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-indigo-900/80 to-purple-900/80 hover:from-indigo-800 hover:to-purple-800 border border-indigo-500/50 rounded-xl text-xs font-semibold text-indigo-100 shadow-lg shadow-indigo-950/50 transition-all"
      >
        <Sliders className="w-3.5 h-3.5 text-indigo-300" />
        <span>Scenario: <strong className="text-white uppercase">{activeScenario.replace('_', ' ')}</strong></span>
        {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-10 w-96 bg-slate-900/95 border border-slate-700 rounded-2xl shadow-2xl backdrop-blur-xl p-4 z-50 text-left">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Play className="w-4 h-4 text-indigo-400 fill-indigo-400" />
                Live Hackathon Demo Simulator
              </h4>
              <p className="text-[11px] text-slate-400">Inject real-time hydro-geotechnical events</p>
            </div>
            <span className="text-[10px] px-2 py-0.5 bg-indigo-950 border border-indigo-600/40 text-indigo-300 font-mono rounded-full">
              LIVE ENGINE
            </span>
          </div>

          <div className="mt-3 space-y-2.5">
            {scenarios.map((sc) => {
              const Icon = sc.icon;
              const isActive = activeScenario === sc.id;
              return (
                <div
                  key={sc.id}
                  onClick={() => {
                    triggerScenario(sc.id);
                    setIsOpen(false);
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isActive ? sc.activeColor : `${sc.color} hover:bg-slate-800/80`
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4" />
                      <span className="text-xs font-bold text-white">{sc.name}</span>
                    </div>
                    {isActive ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-600/50">
                        <CheckCircle2 className="w-3 h-3" /> ACTIVE
                      </span>
                    ) : (
                      <span className="text-[9px] font-semibold text-slate-300 px-1.5 py-0.5 rounded bg-slate-800/80">
                        {sc.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed">
                    {sc.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
