import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import {
  Bell,
  AlertTriangle,
  Radio,
  Clock,
  CheckCircle,
  Volume2,
  PhoneCall,
  MessageSquare,
  Send,
  ShieldAlert,
  Users,
  ShieldCheck,
  Check,
  Smartphone,
  Flame
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const AlertCenter = () => {
  const { alerts, lang, t, refreshData, playVoiceAnnouncement, setIsSirenActive } = useApp();
  const [officerName, setOfficerName] = useState('Duty Control Officer (DDMA)');
  const [selectedLangPreview, setSelectedLangPreview] = useState('en');
  const [ackingId, setAckingId] = useState(null);

  // 2-minute SLA Countdown Simulation
  const [slaTimers, setSlaTimers] = useState({});

  useEffect(() => {
    // Initialize timers for unacknowledged alerts
    const initial = {};
    alerts.forEach((a) => {
      if (!a.acknowledged) {
        initial[a.id] = Math.max(10, 120 - Math.floor((new Date() - new Date(a.created_at)) / 1000) % 120);
      }
    });
    setSlaTimers(initial);

    const interval = setInterval(() => {
      setSlaTimers((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((k) => {
          if (next[k] > 0) next[k] -= 1;
          else next[k] = 120; // reset cycle
        });
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [alerts]);

  const handleAcknowledge = async (alertId) => {
    setAckingId(alertId);
    try {
      await api.acknowledgeAlert(alertId, officerName);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      await refreshData();
    } catch (e) {
      console.error("Ack error:", e);
    } finally {
      setAckingId(null);
    }
  };

  const severityStyles = {
    CRITICAL: {
      border: 'border-red-500/60 bg-red-950/40',
      badge: 'bg-red-600 text-white',
      text: 'text-red-400',
      glow: 'shadow-red-950/50'
    },
    HIGH: {
      border: 'border-orange-500/60 bg-orange-950/40',
      badge: 'bg-orange-600 text-white',
      text: 'text-orange-400',
      glow: 'shadow-orange-950/50'
    },
    MEDIUM: {
      border: 'border-amber-500/60 bg-amber-950/40',
      badge: 'bg-amber-600 text-white',
      text: 'text-amber-400',
      glow: 'shadow-amber-950/50'
    },
    LOW: {
      border: 'border-emerald-500/60 bg-emerald-950/40',
      badge: 'bg-emerald-600 text-white',
      text: 'text-emerald-400',
      glow: 'shadow-emerald-950/50'
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 text-left">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-indigo-400" />
            Disaster Early Warning & Escalation Center (FR3)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Automated threshold triggers, 2-minute SLA auto-escalation matrix, and multilingual multi-channel broadcasting.
          </p>
        </div>

        {/* Officer Profile input */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
          <Users className="w-4 h-4 text-indigo-400" />
          <span className="text-slate-400 font-medium">Logged Officer:</span>
          <input
            type="text"
            value={officerName}
            onChange={(e) => setOfficerName(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 px-2 py-0.5 rounded text-xs font-semibold focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* SLA Matrix Explanation Banner */}
      <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600/30 rounded-xl border border-indigo-500/40 text-indigo-300">
            <Clock className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              {t.alerts_view.sla_title}
            </h4>
            <p className="text-xs text-slate-300 mt-0.5">
              Stage 1 (0–60s): DDMA Alert &bull; Stage 2 (60–120s): SDRF/NDRF Battalions &bull; Stage 3 (&gt;120s): Local Police & Village Headmen Loudspeakers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSirenActive(true)}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-red-950/60"
          >
            <Radio className="w-3.5 h-3.5" />
            Sound Acoustic Siren
          </button>
        </div>
      </div>

      {/* Alerts Grid */}
      <div className="space-y-4">
        {alerts.map((al) => {
          const style = severityStyles[al.severity] || severityStyles.HIGH;
          const timeLeft = slaTimers[al.id] ?? 120;
          const minutes = Math.floor(timeLeft / 60);
          const seconds = timeLeft % 60;

          return (
            <div
              key={al.id}
              className={`border rounded-2xl p-5 backdrop-blur-xl shadow-xl transition-all ${style.border} ${style.glow}`}
            >
              {/* Alert Top Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-xl text-xs font-extrabold uppercase tracking-wider ${style.badge}`}>
                    {al.severity} &bull; {al.category}
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-white">{al.title}</h3>
                    <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{al.location} ({al.district_name}, {al.state})</span>
                      <span>&bull;</span>
                      <span className="font-mono text-slate-500">ID: {al.id}</span>
                    </div>
                  </div>
                </div>

                {/* SLA Timer / Acknowledgment Status */}
                <div>
                  {al.acknowledged ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs font-semibold">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Actioned by {al.acknowledged_by}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-red-950/80 border border-red-500/60 rounded-xl text-red-300 text-xs font-semibold animate-pulse">
                      <Clock className="w-4 h-4 text-red-400" />
                      <span>SLA Escalation Window: </span>
                      <span className="font-mono font-bold text-white bg-red-900 px-1.5 py-0.5 rounded">
                        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Alert Body */}
              <div className="py-3 text-xs text-slate-200 leading-relaxed">
                {al.message}
              </div>

              {/* Multilingual Voice & Text Tabs */}
              <div className="mt-2 bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Multilingual Broadcast Translations (FR3.3)
                  </span>
                  <div className="flex items-center gap-1 overflow-x-auto">
                    {[
                      { code: 'en', label: 'English' },
                      { code: 'hi', label: 'हिन्दी' },
                      { code: 'as', label: 'অসমীয়া' },
                      { code: 'bn', label: 'বাংলা' },
                      { code: 'khasi', label: 'Khasi' },
                      { code: 'mizo', label: 'Mizo' }
                    ].map((langTab) => (
                      <button
                        key={langTab.code}
                        onClick={() => setSelectedLangPreview(langTab.code)}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                          selectedLangPreview === langTab.code
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {langTab.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 text-xs text-indigo-200 italic">
                  <p className="flex-1">
                    "{al.multilingual[selectedLangPreview] || al.multilingual.en}"
                  </p>
                  <button
                    onClick={() => playVoiceAnnouncement(al.multilingual[selectedLangPreview] || al.multilingual.en)}
                    className="px-2.5 py-1 bg-indigo-900/60 hover:bg-indigo-800/80 border border-indigo-500/40 text-indigo-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap"
                    title="Synthesize and play audio alert in this language"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-indigo-300" />
                    Read Voice
                  </button>
                </div>
              </div>

              {/* Multi-Channel Dispatch Progress */}
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div className="bg-slate-950/40 border border-slate-800 p-2 rounded-lg flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <div>
                    <span className="text-slate-400 block text-[10px]">SMS Delivered</span>
                    <span className="font-bold text-white font-mono">{al.dispatched_channels?.sms?.sent?.toLocaleString() || '12,400'}</span>
                  </div>
                </div>

                <div className="bg-slate-950/40 border border-slate-800 p-2 rounded-lg flex items-center gap-2">
                  <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                  <div>
                    <span className="text-slate-400 block text-[10px]">App Push Notifications</span>
                    <span className="font-bold text-white font-mono">{al.dispatched_channels?.push_notification?.sent?.toLocaleString() || '8,200'}</span>
                  </div>
                </div>

                <div className="bg-slate-950/40 border border-slate-800 p-2 rounded-lg flex items-center gap-2">
                  <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
                  <div>
                    <span className="text-slate-400 block text-[10px]">IVR Voice Broadcast</span>
                    <span className="font-bold text-white font-mono">{al.dispatched_channels?.ivr_voice_broadcast?.calls_initiated?.toLocaleString() || '4,500'}</span>
                  </div>
                </div>

                <div className="bg-slate-950/40 border border-slate-800 p-2 rounded-lg flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                  <div>
                    <span className="text-slate-400 block text-[10px]">Loudspeaker Sirens</span>
                    <span className="font-bold text-white">{al.dispatched_channels?.siren_system?.status || 'ACTIVE'}</span>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              {!al.acknowledged && (
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                  <span className="text-xs text-slate-400">
                    Mandatory Officer Verification Required:
                  </span>
                  <button
                    onClick={() => handleAcknowledge(al.id)}
                    disabled={ackingId === al.id}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/60 transition-all"
                  >
                    <Check className="w-4 h-4" />
                    {ackingId === al.id ? "Recording Action..." : t.alerts_view.ack_button}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
