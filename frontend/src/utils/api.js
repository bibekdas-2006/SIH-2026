const API_BASE = 'https://sih-2026-8rqy.onrender.com/api';

export const api = {
  // Risk & Districts
  getDistricts: async () => {
    const res = await fetch(`${API_BASE}/risk/districts`);
    return res.json();
  },
  getDistrictDetail: async (id) => {
    const res = await fetch(`${API_BASE}/risk/districts/${id}`);
    return res.json();
  },
  getRegionalSummary: async () => {
    const res = await fetch(`${API_BASE}/risk/summary`);
    return res.json();
  },
  predictCustom: async (payload) => {
    const res = await fetch(`${API_BASE}/risk/predict/custom`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  // Telemetry & Sensors
  getSensors: async () => {
    const res = await fetch(`${API_BASE}/telemetry/sensors`);
    return res.json();
  },
  getSensorDetail: async (id) => {
    const res = await fetch(`${API_BASE}/telemetry/sensors/${id}`);
    return res.json();
  },
  injectSensorAnomaly: async (id) => {
    const res = await fetch(`${API_BASE}/telemetry/sensors/${id}/inject_anomaly`, {
      method: 'POST'
    });
    return res.json();
  },

  // Alerts & Escalation
  getAlerts: async () => {
    const res = await fetch(`${API_BASE}/alerts/`);
    return res.json();
  },
  broadcastAlert: async (payload) => {
    const res = await fetch(`${API_BASE}/alerts/broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  acknowledgeAlert: async (id, officerName) => {
    const res = await fetch(`${API_BASE}/alerts/${id}/acknowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ officer_name: officerName })
    });
    return res.json();
  },

  // Incidents & Crowdsourcing & Shelters
  getHistoricalLandslides: async () => {
    const res = await fetch(`${API_BASE}/incidents/historical`);
    return res.json();
  },
  getCrowdsourcedReports: async () => {
    const res = await fetch(`${API_BASE}/incidents/crowdsourced`);
    return res.json();
  },
  getShelters: async (districtId) => {
    const url = districtId ? `${API_BASE}/incidents/shelters?district_id=${districtId}` : `${API_BASE}/incidents/shelters`;
    const res = await fetch(url);
    return res.json();
  },
  submitCitizenReport: async (payload) => {
    const res = await fetch(`${API_BASE}/incidents/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  verifyReport: async (id, verified, officerName) => {
    const res = await fetch(`${API_BASE}/incidents/crowdsourced/${id}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verified, officer_name: officerName })
    });
    return res.json();
  },

  // Roads
  getRoads: async () => {
    const res = await fetch(`${API_BASE}/roads/`);
    return res.json();
  },
  updateRoadStatus: async (id, payload) => {
    const res = await fetch(`${API_BASE}/roads/${id}/update_status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  // Simulation
  getSimulationStatus: async () => {
    const res = await fetch(`${API_BASE}/simulation/status`);
    return res.json();
  },
  setScenario: async (scenario) => {
    const res = await fetch(`${API_BASE}/simulation/scenario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario })
    });
    return res.json();
  },

  // ML Lab
  getMLMetrics: async () => {
    const res = await fetch(`${API_BASE}/ml/metrics`);
    return res.json();
  },
  retrainML: async () => {
    const res = await fetch(`${API_BASE}/ml/retrain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return res.json();
  },

  // Reports
  getSummaryReport: async () => {
    const res = await fetch(`${API_BASE}/export/summary_report`);
    return res.json();
  },

  // Database
  getDbStats: async () => {
    const res = await fetch(`${API_BASE}/db/stats`);
    return res.json();
  }
};

