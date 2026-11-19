import axios from 'axios';

// Connect to backend (relative path uses Vite proxy, or direct localhost:5000)
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

export const api = {
  // System Health
  checkHealth: async () => {
    const response = await apiClient.get('/health');
    return response.data;
  },

  // Telemetry Ingestion & Querying
  ingestTelemetry: async (reading) => {
    const response = await apiClient.post('/telemetry', reading);
    return response.data;
  },

  ingestBatchTelemetry: async (readings) => {
    const response = await apiClient.post('/telemetry/batch', readings);
    return response.data;
  },

  getTelemetry: async (params = {}) => {
    const response = await apiClient.get('/telemetry', { params });
    return response.data;
  },

  getLatestTelemetry: async (deviceId) => {
    const response = await apiClient.get('/telemetry/latest', {
      params: deviceId ? { deviceId } : {}
    });
    return response.data;
  },

  getTelemetryStats: async () => {
    const response = await apiClient.get('/telemetry/stats');
    return response.data;
  },

  // Device Registry
  getDevices: async () => {
    const response = await apiClient.get('/devices');
    return response.data;
  },

  registerDevice: async (deviceData) => {
    const response = await apiClient.post('/devices', deviceData);
    return response.data;
  }
};

export default api;
