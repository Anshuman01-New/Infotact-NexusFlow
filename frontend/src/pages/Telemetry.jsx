import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Database, Plus, RefreshCw, Layers, CheckCircle2, AlertCircle, Cpu, Thermometer, Gauge, Activity } from 'lucide-react';

const Telemetry = () => {
  const [stats, setStats] = useState(null);
  const [readings, setReadings] = useState([]);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [loading, setLoading] = useState(false);
  const [ingestStatus, setIngestStatus] = useState(null);

  // Form state for manual injection test
  const [testDevice, setTestDevice] = useState('TURBINE_001');
  const [testTemp, setTestTemp] = useState(85.5);
  const [testPressure, setTestPressure] = useState(115.0);
  const [testVibration, setTestVibration] = useState(3.4);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, telemetryRes, devicesRes] = await Promise.all([
        api.getTelemetryStats().catch(() => ({ stats: null })),
        api.getTelemetry({ deviceId: selectedDevice || undefined, limit: 25 }),
        api.getDevices().catch(() => ({ data: [] }))
      ]);

      if (statsRes.stats) setStats(statsRes.stats);
      if (telemetryRes.data) setReadings(telemetryRes.data);
      if (devicesRes.data) setDevices(devicesRes.data);
    } catch (err) {
      console.error('Error fetching telemetry data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDevice]);

  // Handle single reading ingestion test
  const handleIngestSingle = async (e) => {
    e.preventDefault();
    try {
      setIngestStatus({ loading: true, msg: 'Ingesting to MongoDB Time-Series...' });
      const payload = {
        deviceId: testDevice,
        temperature: parseFloat(testTemp),
        pressure: parseFloat(testPressure),
        vibration: parseFloat(testVibration),
        humidity: 45.0,
        metadata: {
          deviceId: testDevice,
          deviceType: testDevice.startsWith('TURBINE') ? 'Turbine Sensor' : 'Motor Sensor',
          location: 'Factory Floor Block-A'
        }
      };

      const res = await api.ingestTelemetry(payload);
      setIngestStatus({ success: true, msg: `Saved! ID: ${res.data._id}` });
      await fetchData();

      setTimeout(() => setIngestStatus(null), 4000);
    } catch (err) {
      setIngestStatus({ error: true, msg: `Ingestion failed: ${err.message}` });
    }
  };

  // Handle batch ingestion test (10 readings)
  const handleIngestBatch = async () => {
    try {
      setIngestStatus({ loading: true, msg: 'Inserting batch of 10 readings...' });
      const batch = [];
      const now = Date.now();
      for (let i = 0; i < 10; i++) {
        batch.push({
          deviceId: testDevice,
          timestamp: new Date(now - (9 - i) * 1000).toISOString(),
          temperature: Math.round((75 + Math.random() * 25) * 10) / 10,
          pressure: Math.round((90 + Math.random() * 30) * 10) / 10,
          vibration: Math.round((1.5 + Math.random() * 4.0) * 10) / 10,
          metadata: {
            deviceId: testDevice,
            deviceType: 'Turbine Sensor',
            location: 'Factory Floor Block-A'
          }
        });
      }

      const res = await api.ingestBatchTelemetry(batch);
      setIngestStatus({ success: true, msg: `Batch of ${res.insertedCount} readings saved into Time-Series!` });
      await fetchData();

      setTimeout(() => setIngestStatus(null), 4000);
    } catch (err) {
      setIngestStatus({ error: true, msg: `Batch failed: ${err.message}` });
    }
  };

  return (
    <div style={{ padding: '24px', background: '#090d16', minHeight: 'calc(100vh - 60px)', color: '#f8fafc', boxSizing: 'border-box' }}>
      {/* Top Banner / Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#94a3b8', fontSize: '12px' }}>
            <span>Time-Series Storage</span>
            <Database size={16} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#f1f5f9', marginTop: '8px' }}>
            {stats ? stats.totalReadings : '...'}
          </div>
          <div style={{ fontSize: '11px', color: '#34d399', marginTop: '4px' }}>
            MongoDB Time-Series Collection
          </div>
        </div>

        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#94a3b8', fontSize: '12px' }}>
            <span>Reporting Devices</span>
            <Cpu size={16} color="#818cf8" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#f1f5f9', marginTop: '8px' }}>
            {stats ? stats.activeDevicesCount : '...'}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
            Active IoT nodes in telemetry pool
          </div>
        </div>

        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#94a3b8', fontSize: '12px' }}>
            <span>Granularity & Span</span>
            <Activity size={16} color="#fbbf24" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#f1f5f9', marginTop: '8px' }}>
            Seconds
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
            timeField: timestamp | metaField: metadata
          </div>
        </div>
      </div>

      {/* Main Grid: Ingest Tester + Data Table */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '20px' }}>
        {/* Left: Ingestion Testing Panel */}
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', padding: '20px', height: 'fit-content' }}>
          <h3 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 700 }}>
            Telemetry Ingestion Tester
          </h3>
          <p style={{ margin: '0 0 16px', fontSize: '12px', color: '#94a3b8' }}>
            Test storing readings into the Week 1 MongoDB Time-Series collection directly via API.
          </p>

          <form onSubmit={handleIngestSingle} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Device ID</label>
              <select
                value={testDevice}
                onChange={(e) => setTestDevice(e.target.value)}
                style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '12px' }}
              >
                <option value="TURBINE_001">TURBINE_001 (Turbine Sensor)</option>
                <option value="TURBINE_002">TURBINE_002 (Turbine Sensor)</option>
                <option value="MOTOR_102">MOTOR_102 (Motor Sensor)</option>
                <option value="BOILER_201">BOILER_201 (Boiler Sensor)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Temperature (°C)</label>
              <input
                type="number"
                step="0.1"
                value={testTemp}
                onChange={(e) => setTestTemp(e.target.value)}
                style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '12px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Pressure (kPa)</label>
              <input
                type="number"
                step="0.1"
                value={testPressure}
                onChange={(e) => setTestPressure(e.target.value)}
                style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '12px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Vibration (mm/s)</label>
              <input
                type="number"
                step="0.1"
                value={testVibration}
                onChange={(e) => setTestVibration(e.target.value)}
                style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '12px' }}
              />
            </div>

            <button
              type="submit"
              style={{
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                padding: '10px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '4px'
              }}
            >
              <Plus size={16} /> Ingest Single Reading
            </button>

            <button
              type="button"
              onClick={handleIngestBatch}
              style={{
                background: '#1e293b',
                color: '#38bdf8',
                border: '1px solid #334155',
                padding: '10px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Layers size={16} /> Batch Ingest (10 Readings)
            </button>
          </form>

          {/* Feedback banner */}
          {ingestStatus && (
            <div
              style={{
                marginTop: '16px',
                padding: '10px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                background: ingestStatus.error ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                border: ingestStatus.error ? '1px solid #ef4444' : '1px solid #10b981',
                color: ingestStatus.error ? '#f87171' : '#34d399',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {ingestStatus.error ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
              <span>{ingestStatus.msg}</span>
            </div>
          )}
        </div>

        {/* Right: Telemetry Readings Explorer */}
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>
                Time-Series Telemetry Stream
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                Stored readings queried from MongoDB time-series collection: <code style={{ color: '#38bdf8' }}>telemetries</code>
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <select
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                style={{ background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '6px 12px', borderRadius: '6px', fontSize: '12px' }}
              >
                <option value="">All Devices</option>
                {devices.map(d => (
                  <option key={d.deviceId} value={d.deviceId}>{d.deviceId} ({d.name})</option>
                ))}
              </select>

              <button
                onClick={fetchData}
                disabled={loading}
                style={{
                  background: '#1e293b',
                  color: '#94a3b8',
                  border: '1px solid #334155',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px'
                }}
              >
                <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
              </button>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8', textTransform: 'uppercase', fontSize: '11px' }}>
                  <th style={{ padding: '10px 12px' }}>Timestamp (UTC)</th>
                  <th style={{ padding: '10px 12px' }}>Device ID</th>
                  <th style={{ padding: '10px 12px' }}>Temperature</th>
                  <th style={{ padding: '10px 12px' }}>Pressure</th>
                  <th style={{ padding: '10px 12px' }}>Vibration</th>
                  <th style={{ padding: '10px 12px' }}>Location</th>
                </tr>
              </thead>
              <tbody>
                {readings.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                      {loading ? 'Loading telemetry readings...' : 'No telemetry readings found. Use the Ingestion Tester or run `npm run simulate` in backend!'}
                    </td>
                  </tr>
                ) : (
                  readings.map((r, i) => (
                    <tr
                      key={r._id || i}
                      style={{
                        borderBottom: '1px solid #1e293b',
                        background: i % 2 === 0 ? 'rgba(30, 41, 59, 0.3)' : 'transparent'
                      }}
                    >
                      <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#cbd5e1' }}>
                        {new Date(r.timestamp).toLocaleTimeString()} ({new Date(r.timestamp).toLocaleDateString()})
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ fontFamily: 'monospace', color: '#38bdf8', fontWeight: 600 }}>
                          {r.metadata ? r.metadata.deviceId : r.deviceId}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ color: r.temperature > 80 ? '#f87171' : '#f1f5f9', fontWeight: r.temperature > 80 ? 700 : 400 }}>
                          {r.temperature !== undefined ? `${r.temperature}°C` : '-'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', color: '#cbd5e1' }}>
                        {r.pressure !== undefined ? `${r.pressure} kPa` : '-'}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#cbd5e1' }}>
                        {r.vibration !== undefined ? `${r.vibration} mm/s` : '-'}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#64748b' }}>
                        {r.metadata ? r.metadata.location : 'Factory Floor'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Telemetry;
