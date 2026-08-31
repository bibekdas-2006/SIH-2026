import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations } from '../utils/translations';
import { api } from '../utils/api';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [role, setRole] = useState('ddma_officer'); // ddma_officer | ndrf_responder | geologist | citizen
  const [lang, setLang] = useState('en');           // en | hi | as | bn | khasi | mizo
  const [districts, setDistricts] = useState([]);
  const [sensors, setSensors] = useState([]);
  const [roads, setRoads] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [activeScenario, setActiveScenario] = useState('NORMAL');
  const [isSirenActive, setIsSirenActive] = useState(false);
  const [isLowBandwidth, setIsLowBandwidth] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const t = translations[lang] || translations.en;

  const refreshData = useCallback(async () => {
    try {
      const [distRes, sensRes, alertRes, roadRes, sumRes] = await Promise.all([
        api.getDistricts(),
        api.getSensors(),
        api.getAlerts(),
        api.getRoads(),
        api.getRegionalSummary()
      ]);

      if (distRes?.districts) setDistricts(distRes.districts);
      if (sensRes?.sensors) setSensors(sensRes.sensors);
      if (alertRes?.alerts) {
        setAlerts(alertRes.alerts);
        // Auto-check if any critical unacknowledged alert is active
        const hasUnackedCritical = alertRes.alerts.some(a => a.severity === 'CRITICAL' && !a.acknowledged);
        if (hasUnackedCritical && !isSirenActive) {
          // Can flag alert state
        }
      }
      if (roadRes?.corridors) setRoads(roadRes.corridors);
      if (sumRes) {
        setSummary(sumRes);
        if (sumRes.current_scenario) setActiveScenario(sumRes.current_scenario);
      }
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to refresh real-time data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isSirenActive]);

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 5000); // 5-second live telemetry poll
    return () => clearInterval(interval);
  }, [refreshData]);

  const triggerScenario = async (scenarioId) => {
    try {
      await api.setScenario(scenarioId);
      setActiveScenario(scenarioId);
      await refreshData();
      if (scenarioId === 'SLOPE_ANOMALY' || scenarioId === 'MONSOON_TORRENTIAL') {
        setIsSirenActive(true);
      }
    } catch (err) {
      console.error("Failed to switch scenario:", err);
    }
  };

  const playVoiceAnnouncement = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        lang,
        setLang,
        t,
        districts,
        sensors,
        roads,
        alerts,
        summary,
        selectedDistrict,
        setSelectedDistrict,
        activeScenario,
        triggerScenario,
        isSirenActive,
        setIsSirenActive,
        isLowBandwidth,
        setIsLowBandwidth,
        isLoading,
        lastUpdated,
        refreshData,
        playVoiceAnnouncement
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
