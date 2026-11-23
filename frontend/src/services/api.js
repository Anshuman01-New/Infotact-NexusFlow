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
  },

  // Week 2: Workflows & Stream Compiler
  validateWorkflow: async (graph) => {
    const response = await apiClient.post('/workflows/validate', { graph });
    return response.data;
  },

  testCompileWorkflow: async (graph, mockReadings) => {
    const response = await apiClient.post('/workflows/compile-test', {
      graph,
      mockReadings
    });
    return response.data;
  },

  getWorkflows: async () => {
    const response = await apiClient.get('/workflows');
    return response.data;
  },

  getWorkflowById: async (id) => {
    const response = await apiClient.get(`/workflows/${id}`);
    return response.data;
  },

  createWorkflow: async (workflowData) => {
    const response = await apiClient.post('/workflows', workflowData);
    return response.data;
  },

  updateWorkflow: async (id, workflowData) => {
    const response = await apiClient.put(`/workflows/${id}`, workflowData);
    return response.data;
  },

  deleteWorkflow: async (id) => {
    const response = await apiClient.delete(`/workflows/${id}`);
    return response.data;
  },

  toggleWorkflow: async (id) => {
    const response = await apiClient.patch(`/workflows/${id}/toggle`);
    return response.data;
  },

  getEngineStatus: async () => {
    const response = await apiClient.get('/workflows/engine/status');
    return response.data;
  }
};

export default api;
