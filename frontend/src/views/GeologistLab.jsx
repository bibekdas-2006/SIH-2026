import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import {
  Activity,
  Cpu,
  BarChart3,
  RefreshCw,
  Zap,
  TrendingUp,
  AlertOctagon,
  Database,
  FileCheck2,
  Sliders,
  Radio,
  Layers
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const GeologistLab = () => {
  const { sensors, refreshData } = useApp();
  const [selectedSensorId, setSelectedSensorId] = useState('SENSOR-EKH-01');
  const [sensorData, setSensorData] = useState(null);
  const [mlMetrics, setMlMetrics] = useState(null);
  const [isRetraining, setIsRetraining] = useState(false);
  const [retrainSuccess, setRetrainSuccess] = useState(false);
  const [isInjecting, setIsInjecting] = useState(false);

  useEffect(() => {
    const fetchML = async () => {
      try {
        const [mlRes, sensRes] = await Promise.all([
          api.getMLMetrics(),
          api.getSensorDetail(selectedSensorId)
        ]);
        if (mlRes) setMlMetrics(mlRes);
        if (sensRes) setSensorData(sensRes);
      } catch (err) {
        console.error("Geologist lab load error:", err);
      }
    };
    fetchML();
  }, [selectedSensorId]);

  const handleRetrain = async () => {
    setIsRetraining(true);
    try {
      const res = await api.retrainML();
      if (res?.updated_metrics) {
        setMlMetrics(prev => ({ ...prev, metrics: res.updated_metrics }));
        setRetrainSuccess(true);
        confetti({ particleCount: 50, spread: 60 });
        setTimeout(() => setRetrainSuccess(false), 5000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRetraining(false);
    }
  };

  const handleInjectAnomaly = async () => {
    setIsInjecting(true);
    try {
      await api.injectSensorAnomaly(selectedSensorId);
      const updated = await api.getSensorDetail(selectedSensorId);
      if (updated) setSensorData(updated);
      await refreshData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsInjecting(false);
    }
  };

  const currentSensor = sensorData?.sensor || sensors[0] || {};
  const history = sensorData?.history || [];

  const metrics = mlMetrics?.metrics || {
    accuracy: 0.892,
    roc_auc: 0.914,
    false_alarm_rate: 0.125,
    true_positive_rate: 0.908,
    confusion_matrix: { true_negative: 262, false_positive: 38, false_negative: 28, true_positive: 272 },
    feature_importances: {
      slope_angle_deg: 0.28,
      twi: 0.18,
      soil_clay_pct: 0.16,
      lithology_rating: 0.14,
      road_cut_distance_m: 0.10,
      elevation_m: 0.08,
      fault_distance_km: 0.06
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
            <Cpu className="w-6 h-6 text-emerald-400" />
            Geologist & AI/ML Telemetry Analytics Lab (FR2 & FR4.5)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time IoT inclinometer/piezometer telemetry, model explainability, ROC curves, and human-in-the-loop retraining.
          </p>
        </div>

        {/* Retrain Model Action Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRetrain}
            disabled={isRetraining}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/60 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRetraining ? 'animate-spin' : ''}`} />
            {isRetraining ? "Retraining Model..." : "Retrain Model (Human Feedback)"}
          </button>
        </div>
      </div>

      {retrainSuccess && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/60 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
          <FileCheck2 className="w-4 h-4" />
          Model successfully recalibrated! Verified ground-truth incident data incorporated into decision trees.
        </div>
      )}

      {/* Top Row: AI Model Performance Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
          <span className="text-slate-400 block text-[11px]">Model Accuracy</span>
          <span className="text-lg font-bold text-white font-mono mt-0.5 block">
            {(metrics.accuracy * 100).toFixed(1)}%
          </span>
          <span className="text-[10px] text-emerald-400 font-semibold">GSI Validation Set</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
          <span className="text-slate-400 block text-[11px]">ROC-AUC Score</span>
          <span className="text-lg font-bold text-indigo-400 font-mono mt-0.5 block">
            {(metrics.roc_auc * 100).toFixed(1)}%
          </span>
          <span className="text-[10px] text-indigo-300 font-semibold">High Discriminative Power</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
          <span className="text-slate-400 block text-[11px]">False Alarm Rate (FPR)</span>
          <span className="text-lg font-bold text-amber-400 font-mono mt-0.5 block">
            {(metrics.false_alarm_rate * 100).toFixed(1)}%
          </span>
          <span className="text-[10px] text-slate-400 font-semibold">Target &lt; 15%</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
          <span className="text-slate-400 block text-[11px]">True Positive Rate (Recall)</span>
          <span className="text-lg font-bold text-emerald-400 font-mono mt-0.5 block">
            {(metrics.true_positive_rate * 100).toFixed(1)}%
          </span>
          <span className="text-[10px] text-emerald-400 font-semibold">Life-Safety Priority</span>
        </div>
      </div>

      {/* Middle Row: Feature Importances & Confusion Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Feature Importance Bar Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            Geological Feature Importance Weights
          </h4>
          <p className="text-[11px] text-slate-400">
            Random Forest Gini-impurity feature contributions for NER terrain failure:
          </p>
          <div className="space-y-2 text-xs pt-1">
            {Object.entries(metrics.feature_importances || {}).map(([key, val]) => (
              <div key={key}>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-300 font-mono">{key}</span>
                  <span className="font-mono text-indigo-300 font-bold">{(val * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${val * 250}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Confusion Matrix & Fast-Path Anomaly Interceptor */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" />
              Confusion Matrix on Validation Samples
            </h4>
            <div className="grid grid-cols-2 gap-2 mt-3 text-center text-xs">
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
                <span className="text-[10px] text-slate-400 block uppercase">True Negatives</span>
                <span className="font-mono text-base font-bold text-emerald-400 mt-1 block">
                  {metrics.confusion_matrix.true_negative}
                </span>
                <span className="text-[10px] text-slate-400">Correct Stable Slopes</span>
              </div>
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
                <span className="text-[10px] text-slate-400 block uppercase">False Positives</span>
                <span className="font-mono text-base font-bold text-amber-400 mt-1 block">
                  {metrics.confusion_matrix.false_positive}
                </span>
                <span className="text-[10px] text-slate-400">Precautionary Alarms</span>
              </div>
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
                <span className="text-[10px] text-slate-400 block uppercase">False Negatives</span>
                <span className="font-mono text-base font-bold text-red-400 mt-1 block">
                  {metrics.confusion_matrix.false_negative}
                </span>
                <span className="text-[10px] text-slate-400">Missed Events</span>
              </div>
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
                <span className="text-[10px] text-slate-400 block uppercase">True Positives</span>
                <span className="font-mono text-base font-bold text-emerald-400 mt-1 block">
                  {metrics.confusion_matrix.true_positive}
                </span>
                <span className="text-[10px] text-slate-400">Correct Landslides Flagged</span>
              </div>
            </div>
          </div>

          {/* Fast Path Trigger Info */}
          <div className="p-3 bg-indigo-950/40 border border-indigo-500/40 rounded-xl text-xs space-y-1">
            <span className="font-bold text-indigo-200 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              Fast-Path Edge Anomaly Rule (FR2.5):
            </span>
            <p className="text-[11px] text-slate-300">
              When Inclinometer Tilt Rate &ge; <strong>0.45°/hr</strong> or Accelerometer &ge; <strong>0.28g</strong>, an instant CRITICAL priority alert is fired immediately, bypassing slow batch modeling.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Section: Real-Time Sensor Telemetry Time-Series */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Radio className="w-5 h-5 text-indigo-400" />
            <div>
              <h4 className="text-sm font-bold text-white">Live Ground Station Inclinometer & Piezometer Telemetry</h4>
              <p className="text-[11px] text-slate-400">Time-series data from downhole borehole sensor array</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Sensor Selector */}
            <select
              value={selectedSensorId}
              onChange={(e) => setSelectedSensorId(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-xs font-semibold text-white rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              {sensors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id}: {s.name} ({s.district_name})
                </option>
              ))}
            </select>

            <button
              onClick={handleInjectAnomaly}
              disabled={isInjecting}
              className="px-3 py-1.5 bg-red-900/70 hover:bg-red-800 border border-red-500/50 text-red-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
              title="Force trigger tilt displacement spike on this sensor"
            >
              <Zap className="w-3.5 h-3.5 text-red-400" />
              {isInjecting ? "Injecting..." : "Simulate Spike"}
            </button>
          </div>
        </div>

        {/* Current Sensor Real-Time Meters */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-center text-xs">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Soil Moisture</span>
            <span className="font-mono text-base font-bold text-cyan-300 mt-1 block">
              {currentSensor.soil_moisture_pct}%
            </span>
            <span className="text-[9px] text-slate-400">Critical &gt; 82%</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Tilt Angle</span>
            <span className="font-mono text-base font-bold text-amber-300 mt-1 block">
              {currentSensor.tilt_angle_deg}°
            </span>
            <span className="text-[9px] text-slate-400">Max Safe 12.0°</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Displacement Velocity</span>
            <span className={`font-mono text-base font-bold mt-1 block ${currentSensor.tilt_rate_deg_hr >= 0.45 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
              {currentSensor.tilt_rate_deg_hr}°/hr
            </span>
            <span className="text-[9px] text-slate-400">Trigger &ge; 0.45°</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Pore Pressure</span>
            <span className="font-mono text-base font-bold text-indigo-300 mt-1 block">
              {currentSensor.pore_water_pressure_kpa} kPa
            </span>
            <span className="text-[9px] text-slate-400">Burst Limit 65 kPa</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Vibration (MEMS)</span>
            <span className="font-mono text-base font-bold text-purple-300 mt-1 block">
              {currentSensor.vibration_acceleration_g}g
            </span>
            <span className="text-[9px] text-slate-400">Tremor &ge; 0.28g</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Rainfall Rate</span>
            <span className="font-mono text-base font-bold text-blue-300 mt-1 block">
              {currentSensor.rainfall_rate_mm_hr} mm/h
            </span>
            <span className="text-[9px] text-slate-400">Heavy &ge; 25 mm</span>
          </div>
        </div>

        {/* Live SVG Graph Visualization */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold text-slate-200">24-Hour Inclinometer Tilt & Soil Moisture Saturation Curve</span>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Soil Moisture %</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Tilt Angle (x5)</span>
            </div>
          </div>

          {/* Simple Clean Responsive SVG Multi-Line Chart */}
          <div className="h-44 w-full relative">
            <svg className="w-full h-full" viewBox="0 0 800 160" preserveAspectRatio="none">
              {/* Horizontal Grid lines */}
              <line x1="0" y1="40" x2="800" y2="40" stroke="#334155" strokeDasharray="3 3" strokeWidth="1" />
              <line x1="0" y1="80" x2="800" y2="80" stroke="#334155" strokeDasharray="3 3" strokeWidth="1" />
              <line x1="0" y1="120" x2="800" y2="120" stroke="#334155" strokeDasharray="3 3" strokeWidth="1" />

              {/* Critical threshold line */}
              <line x1="0" y1="30" x2="800" y2="30" stroke="#ef4444" strokeDasharray="4 4" strokeWidth="1.5" />
              <text x="10" y="24" fill="#ef4444" fontSize="10" fontWeight="bold">Critical Saturation / Failure Threshold (85%)</text>

              {/* Soil Moisture Polyline */}
              {history.length > 1 && (
                <polyline
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                  points={history.map((pt, i) => {
                    const x = (i / (history.length - 1)) * 780 + 10;
                    const y = 150 - (pt.soil_moisture_pct / 100) * 130;
                    return `${x},${y}`;
                  }).join(' ')}
                />
              )}

              {/* Tilt Angle Polyline */}
              {history.length > 1 && (
                <polyline
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                  points={history.map((pt, i) => {
                    const x = (i / (history.length - 1)) * 780 + 10;
                    const y = 150 - (pt.tilt_angle_deg * 4.5);
                    return `${x},${y}`;
                  }).join(' ')}
                />
              )}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
