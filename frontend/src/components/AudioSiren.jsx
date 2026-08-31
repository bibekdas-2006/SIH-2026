import React, { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Volume2, VolumeX, AlertTriangle, Radio } from 'lucide-react';

export const AudioSiren = () => {
  const { isSirenActive, setIsSirenActive, alerts, lang, t, playVoiceAnnouncement } = useApp();
  const audioCtxRef = useRef(null);
  const oscillatorRef = useRef(null);
  const gainNodeRef = useRef(null);
  const intervalRef = useRef(null);

  const startSiren = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Stop existing if any
      stopSirenSound();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      gain.gain.setValueAtTime(0.08, ctx.currentTime);

      osc.connect(gain);
      gain.connect(ctx.destination);

      let high = false;
      osc.frequency.setValueAtTime(480, ctx.currentTime);

      intervalRef.current = setInterval(() => {
        if (!oscillatorRef.current) return;
        const targetFreq = high ? 480 : 880;
        osc.frequency.exponentialRampToValueAtTime(targetFreq, ctx.currentTime + 0.35);
        high = !high;
      }, 400);

      osc.start();
      oscillatorRef.current = osc;
      gainNodeRef.current = gain;

      // Also trigger multilingual voice reading of top critical alert if available
      const topAlert = alerts.find(a => a.severity === 'CRITICAL');
      if (topAlert) {
        const textToRead = topAlert.multilingual[lang] || topAlert.multilingual.en;
        setTimeout(() => {
          playVoiceAnnouncement(textToRead);
        }, 1500);
      }
    } catch (e) {
      console.warn("Audio Context error:", e);
    }
  };

  const stopSirenSound = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      } catch (e) {}
      oscillatorRef.current = null;
    }
  };

  useEffect(() => {
    if (isSirenActive) {
      startSiren();
    } else {
      stopSirenSound();
    }
    return () => stopSirenSound();
  }, [isSirenActive]);

  if (!isSirenActive) return null;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-950/95 border-2 border-red-500 text-white px-6 py-3.5 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-4 animate-bounce">
      <div className="p-2 bg-red-600 rounded-full animate-ping-slow">
        <AlertTriangle className="w-6 h-6 text-white" />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-red-300 text-sm uppercase tracking-wider flex items-center gap-1.5">
            <Radio className="w-4 h-4 animate-pulse text-red-400" />
            CRITICAL EMERGENCY BROADCAST ACTIVE
          </span>
        </div>
        <p className="text-xs text-slate-200 mt-0.5">
          Acoustic siren blaring & IVR automated alerts dispatched to regional authorities.
        </p>
      </div>
      <button
        onClick={() => setIsSirenActive(false)}
        className="ml-3 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
      >
        <VolumeX className="w-4 h-4 text-red-400" />
        Silence Siren
      </button>
    </div>
  );
};
