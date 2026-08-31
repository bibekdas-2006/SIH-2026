import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { AudioSiren } from './components/AudioSiren';
import { GisDashboard } from './views/GisDashboard';
import { AlertCenter } from './views/AlertCenter';
import { CitizenPortal } from './views/CitizenPortal';
import { ResponderView } from './views/ResponderView';
import { GeologistLab } from './views/GeologistLab';
import { ReportGenerator } from './views/ReportGenerator';
import {
  Map,
  Bell,
  Truck,
  Cpu,
  Smartphone,
  FileSpreadsheet,
  Layers,
  ShieldAlert,
  Loader2
} from 'lucide-react';

const MainContent = () => {
  const { role, t, alerts, isLoading } = useApp();
  const [currentTab, setCurrentTab] = useState('gis_map');

  const unreadAlerts = alerts.filter(a => !a.acknowledged).length;

  const navTabs = [
    { id: 'gis_map', label: t.nav.gis_map, icon: Map },
    { id: 'alerts', label: t.nav.alerts, icon: Bell, badge: unreadAlerts > 0 ? unreadAlerts : null },
    { id: 'responders', label: t.nav.responders, icon: Truck },
    { id: 'geologist', label: t.nav.geologist, icon: Cpu },
    { id: 'citizen_view', label: t.nav.citizen_view, icon: Smartphone },
    { id: 'reports', label: t.nav.reports, icon: FileSpreadsheet }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <div className="text-center">
          <h2 className="text-lg font-bold">Initializing NER Landslide Early Warning System...</h2>
          <p className="text-xs text-slate-400">Loading ground telemetry streams & ML geological models</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      {/* Top Navbar */}
      <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Emergency Siren Broadcaster */}
      <AudioSiren />

      {/* Navigation Sub-Bar (Sticky below navbar) */}
      <div className="bg-slate-900/80 border-b border-slate-800/80 px-4 sm:px-6 py-2 flex items-center justify-between overflow-x-auto no-scrollbar gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/60 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="w-4 h-4 rounded-full bg-red-500 text-white font-mono text-[10px] flex items-center justify-center font-bold animate-pulse">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Real-Time Stream: <strong className="text-slate-200">Active</strong></span>
        </div>
      </div>

      {/* View Container */}
      <main className="flex-1 overflow-y-auto">
        {currentTab === 'gis_map' && <GisDashboard />}
        {currentTab === 'alerts' && <AlertCenter />}
        {currentTab === 'responders' && <ResponderView />}
        {currentTab === 'geologist' && <GeologistLab />}
        {currentTab === 'citizen_view' && <CitizenPortal />}
        {currentTab === 'reports' && <ReportGenerator />}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
