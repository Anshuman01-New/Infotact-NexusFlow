import React, { useEffect, useState } from 'react';
import { Network, Database, RefreshCw, Cpu, Layers } from 'lucide-react';
import api from '../services/api';

const Navbar = ({ activeTab, setActiveTab, onSave, onExport, onClear }) => {
  const [health, setHealth] = useState({ status: 'checking', db: 'unknown' });

  const fetchHealth = async () => {
    try {
      const data = await api.checkHealth();
      setHealth({
        status: data.status === 'ok' ? 'online' : 'degraded',
        db: data.database.status
      });
    } catch {
      setHealth({ status: 'offline', db: 'disconnected' });
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      style={{
        height: '60px',
        background: '#0b1120',
        borderBottom: '1px solid #1e293b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        color: '#f8fafc',
        boxSizing: 'border-box'
      }}
    >
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            padding: '8px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 14px rgba(37, 99, 235, 0.4)'
          }}
        >
          <Network size={20} color="#ffffff" />
        </div>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>NEXUSFLOW</span>
            <span
              style={{
                fontSize: '10px',
                background: '#1e293b',
                color: '#38bdf8',
                border: '1px solid #334155',
                padding: '2px 6px',
                borderRadius: '4px',
                fontWeight: 600
              }}
            >
              WEEK 1
            </span>
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            Visual IoT Telemetry & Rule Engine
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <nav style={{ display: 'flex', gap: '6px', background: '#0f172a', padding: '4px', borderRadius: '8px', border: '1px solid #1e293b' }}>
        <button
          onClick={() => setActiveTab('builder')}
          style={{
            background: activeTab === 'builder' ? '#2563eb' : 'transparent',
            color: activeTab === 'builder' ? '#ffffff' : '#94a3b8',
            border: 'none',
            padding: '7px 16px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          Visual Workflow Builder
        </button>
        <button
          onClick={() => setActiveTab('telemetry')}
          style={{
            background: activeTab === 'telemetry' ? '#2563eb' : 'transparent',
            color: activeTab === 'telemetry' ? '#ffffff' : '#94a3b8',
            border: 'none',
            padding: '7px 16px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          Telemetry Storage & Data
        </button>
      </nav>

      {/* Status & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Backend & DB Health */}
        <div
          title={`Backend: ${health.status} | MongoDB: ${health.db}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '5px 12px',
            borderRadius: '20px',
            background: '#0f172a',
            border: '1px solid #1e293b',
            fontSize: '11px'
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: health.status === 'online' ? '#10b981' : health.status === 'checking' ? '#f59e0b' : '#ef4444'
            }}
          />
          <span style={{ color: '#cbd5e1' }}>
            MongoDB {health.db === 'connected' ? 'Time-Series OK' : 'Offline'}
          </span>
        </div>

        {activeTab === 'builder' && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onExport}
              style={{
                background: '#1e293b',
                color: '#e2e8f0',
                border: '1px solid #334155',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Export JSON
            </button>
            <button
              onClick={onSave}
              style={{
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Save Workflow
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
