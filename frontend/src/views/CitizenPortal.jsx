import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import {
  ShieldAlert,
  MapPin,
  Compass,
  AlertTriangle,
  Camera,
  Send,
  PhoneCall,
  Navigation,
  Building,
  CheckCircle2,
  Wifi,
  WifiOff,
  Search,
  UploadCloud,
  FileCheck,
  ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const CitizenPortal = () => {
  const { districts, t, lang, isLowBandwidth, setIsLowBandwidth } = useApp();
  const [selectedVillage, setSelectedVillage] = useState('Sohra (Cherrapunji)');
  const [currentRisk, setCurrentRisk] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [shelters, setShelters] = useState([]);
  
  // Incident Report Form State
  const [reporterName, setReporterName] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [crackWidth, setCrackWidth] = useState('10');
  const [waterSeepage, setWaterSeepage] = useState(true);
  const [description, setDescription] = useState('');
  const [incidentType, setIncidentType] = useState('Ground Crack / Slope Fissure');
  const [imagePreview, setImagePreview] = useState(null);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // SMS Subscribe State
  const [subPhone, setSubPhone] = useState('');
  const [subSuccess, setSubSuccess] = useState(false);

  useEffect(() => {
    // Default to East Khasi Hills / Sohra
    const ekh = districts.find(d => d.id === 'NER-ML-EKH') || districts[0];
    if (ekh) {
      setCurrentRisk(ekh);
    }
    const fetchShelters = async () => {
      try {
        const res = await api.getShelters();
        if (res?.shelters) setShelters(res.shelters);
      } catch (e) {
        console.error(e);
      }
    };
    fetchShelters();
  }, [districts]);

  const handleGpsCheck = () => {
    setGpsLoading(true);
    setTimeout(() => {
      // Simulate geolocation matching closest hill sector
      const matched = districts.find(d => d.id === 'NER-ML-EKH') || districts[0];
      setCurrentRisk(matched);
      setSelectedVillage("Sohra (Cherrapunji)");
      setGpsLoading(false);
    }, 1000);
  };

  const handleVillageChange = (vName) => {
    setSelectedVillage(vName);
    const found = districts.find(d => d.vulnerable_villages?.includes(vName) || d.name.includes(vName));
    if (found) setCurrentRisk(found);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.submitCitizenReport({
        reporter_name: reporterName || "Local Villager",
        reporter_phone: reporterPhone || "+91-98765-XXXXX",
        village: selectedVillage,
        district: currentRisk?.name || "East Khasi Hills",
        state: currentRisk?.state || "Meghalaya",
        lat: currentRisk?.lat || 25.275,
        lng: currentRisk?.lng || 91.732,
        incident_type: incidentType,
        crack_width_cm: parseFloat(crackWidth) || 10,
        crack_length_m: 25,
        water_seepage_observed: waterSeepage,
        description: description || "Noticed slope fissure opening after heavy downpour.",
        image_url: imagePreview || "https://images.unsplash.com/photo-1541888946425-d0fbb180c5f9?w=600&auto=format&fit=crop&q=80"
      });

      setReportSuccess(true);
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      setTimeout(() => {
        setReportSuccess(false);
        setDescription('');
        setImagePreview(null);
      }, 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!subPhone) return;
    setSubSuccess(true);
    setTimeout(() => {
      setSubSuccess(false);
      setSubPhone('');
    }, 4000);
  };

  const riskLevel = currentRisk?.active_risk_level || 'HIGH';
  const riskScore = currentRisk?.risk_score || 78;

  const isDanger = riskLevel === 'CRITICAL';
  const isHigh = riskLevel === 'HIGH';

  return (
    <div className="p-3 sm:p-6 max-w-4xl mx-auto space-y-6 text-left">
      {/* Citizen Header & 2G Switch */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-950 border border-purple-500/50 rounded-2xl text-purple-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
              NER Suraksha &bull; HillShield PWA
              <span className="text-[10px] bg-purple-600/30 text-purple-300 font-mono px-2 py-0.5 rounded-full border border-purple-500/40">
                CITIZEN PORTAL
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Community early warning, safe shelter routing & crowdsourced ground reports.
            </p>
          </div>
        </div>

        {/* 2G Low Bandwidth Toggle */}
        <button
          onClick={() => setIsLowBandwidth(!isLowBandwidth)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            isLowBandwidth
              ? 'bg-amber-950/80 border-amber-500 text-amber-300'
              : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-white'
          }`}
        >
          {isLowBandwidth ? <WifiOff className="w-4 h-4 text-amber-400" /> : <Wifi className="w-4 h-4 text-emerald-400" />}
          {isLowBandwidth ? "2G Low-Bandwidth Mode ON" : "High-Speed Mode"}
        </button>
      </div>

      {/* Hero GPS Check & Visual Safety Gauge (FR5.1) */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              {t.citizen.current_status}
            </h3>
            <div className="text-lg font-bold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-400" />
              <span>{selectedVillage}</span>
              <span className="text-xs font-normal text-slate-400">({currentRisk?.district_name || currentRisk?.name}, {currentRisk?.state})</span>
            </div>
          </div>

          <button
            onClick={handleGpsCheck}
            disabled={gpsLoading}
            className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/60 transition-all"
          >
            <Compass className={`w-4 h-4 ${gpsLoading ? 'animate-spin' : ''}`} />
            {gpsLoading ? "Acquiring GPS..." : t.citizen.check_risk}
          </button>
        </div>

        {/* Visual Speedometer / Gauge */}
        <div className="flex flex-col items-center justify-center py-4">
          <div className="relative w-48 h-24 flex items-end justify-center">
            {/* Semicircle Track */}
            <div className="absolute inset-0 rounded-t-full border-[14px] border-slate-800 border-b-0" />
            <div
              className={`absolute inset-0 rounded-t-full border-[14px] border-b-0 transition-all duration-700 ${
                isDanger ? 'border-red-500' : isHigh ? 'border-orange-500' : 'border-emerald-500'
              }`}
              style={{
                clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%)`,
                opacity: 0.9
              }}
            />
            {/* Center Score Text */}
            <div className="text-center z-10 -mb-2">
              <div className="font-mono text-3xl font-extrabold text-white">{riskScore}</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                HAZARD INDEX
              </div>
            </div>
          </div>

          {/* Status Label Banner */}
          <div className="mt-4 text-center">
            <span
              className={`px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider border inline-block ${
                isDanger
                  ? 'bg-red-950/90 text-red-300 border-red-500/70 animate-pulse'
                  : isHigh
                  ? 'bg-orange-950/90 text-orange-300 border-orange-500/70'
                  : 'bg-emerald-950/90 text-emerald-300 border-emerald-500/70'
              }`}
            >
              {isDanger ? t.risk_levels.CRITICAL : isHigh ? t.risk_levels.HIGH : t.risk_levels.LOW}
            </span>

            <p className="text-xs text-slate-200 mt-2 max-w-md mx-auto leading-relaxed">
              {isDanger ? t.citizen.danger_msg : isHigh ? t.citizen.warning_msg : t.citizen.safe_msg}
            </p>
          </div>
        </div>

        {/* 1-Tap SOS Button */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            Immediate emergency response needed in your area?
          </div>
          <a
            href="tel:112"
            className="w-full sm:w-auto px-5 py-3 bg-red-600 hover:bg-red-500 text-white rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2.5 shadow-xl shadow-red-950/80 animate-bounce"
          >
            <PhoneCall className="w-4 h-4" />
            {t.citizen.sos_button}
          </a>
        </div>
      </div>

      {/* Grid: Nearest Shelter & Crowdsource Report */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nearest Safe Evacuation Shelter (FR5.4) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
            <Building className="w-5 h-5 text-emerald-400" />
            <div>
              <h4 className="text-sm font-bold text-white">{t.citizen.nearest_shelter}</h4>
              <p className="text-[11px] text-slate-400">Verified safe designated community shelters</p>
            </div>
          </div>

          <div className="space-y-3">
            {shelters.slice(0, 3).map((sh) => (
              <div key={sh.id} className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white">{sh.name}</span>
                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-600/40">
                    OPEN
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-3">
                  <span>Capacity: <strong className="text-slate-200">{sh.capacity_persons}</strong></span>
                  <span>&bull;</span>
                  <span>Rations: <strong className="text-slate-200">{sh.supplies_ration_days} days</strong></span>
                </div>
                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-slate-400 text-[11px]">{sh.contact_officer}</span>
                  <a
                    href={`tel:${sh.phone}`}
                    className="text-indigo-400 hover:text-indigo-300 font-bold text-xs flex items-center gap-1"
                  >
                    <PhoneCall className="w-3 h-3" /> Call Shelter
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* SMS Subscription Opt-in (FR5.2) */}
          <form onSubmit={handleSubscribe} className="pt-2 border-t border-slate-800 space-y-2">
            <label className="text-[11px] font-semibold text-slate-300 block">
              Opt-in for Free SMS Alert Updates on Mobile:
            </label>
            <div className="flex gap-2">
              <input
                type="tel"
                value={subPhone}
                onChange={(e) => setSubPhone(e.target.value)}
                placeholder="+91 Mobile Number"
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold"
              >
                Subscribe
              </button>
            </div>
            {subSuccess && (
              <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Subscribed successfully! SMS alerts enabled for your sector.
              </p>
            )}
          </form>
        </div>

        {/* Crowdsourced Incident & Slope Crack Reporting (FR5.3) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
            <Camera className="w-5 h-5 text-indigo-400" />
            <div>
              <h4 className="text-sm font-bold text-white">{t.citizen.report_crack}</h4>
              <p className="text-[11px] text-slate-400">Crowdsourced slope monitoring & ground validation</p>
            </div>
          </div>

          <form onSubmit={handleSubmitReport} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 block mb-1">Your Name</label>
                <input
                  type="text"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={reporterPhone}
                  onChange={(e) => setReporterPhone(e.target.value)}
                  placeholder="+91-XXXXX-XXXXX"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 block mb-1">Observed Crack Width (cm)</label>
                <input
                  type="number"
                  value={crackWidth}
                  onChange={(e) => setCrackWidth(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Incident Type</label>
                <select
                  value={incidentType}
                  onChange={(e) => setIncidentType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-1.5 text-white"
                >
                  <option>Ground Crack / Tension Fissure</option>
                  <option>Mudflow / Debris Wash</option>
                  <option>Retaining Wall Bulge / Tilting</option>
                  <option>Rockfall on Road</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Description / Location Landmark</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe exact slope location, nearby buildings or spring water muddiness..."
                rows={2}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white"
              />
            </div>

            {/* Photo Attachment Simulator */}
            <div>
              <label className="text-slate-400 block mb-1">Upload Photo of Slope Crack / Damage</label>
              <div className="border-2 border-dashed border-slate-700 rounded-xl p-3 text-center bg-slate-950/40 hover:bg-slate-950 transition-colors">
                {imagePreview ? (
                  <div className="flex items-center gap-3">
                    <img src={imagePreview} alt="Preview" className="w-16 h-12 object-cover rounded-lg border border-slate-600" />
                    <span className="text-[11px] text-emerald-400 font-semibold">Photo Attached</span>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center gap-1">
                    <UploadCloud className="w-5 h-5 text-indigo-400" />
                    <span className="text-[11px] text-slate-300">Tap to capture or upload slope photo</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/60 transition-all disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {isSubmitting ? "Submitting to DDMA..." : "Submit Ground Report"}
            </button>

            {reportSuccess && (
              <div className="p-2.5 bg-emerald-950/80 border border-emerald-500/60 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                <FileCheck className="w-4 h-4" />
                Report logged! DDMA Geotechnical Engineers notified for ground-truth inspection.
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
