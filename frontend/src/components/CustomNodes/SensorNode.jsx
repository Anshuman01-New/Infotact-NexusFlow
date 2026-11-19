import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Activity, Radio, Cpu } from 'lucide-react';

const SensorNode = ({ data, selected }) => {
  const deviceId = data.deviceId || 'TURBINE_001';
  const metric = data.metric || 'temperature';
  const label = data.label || 'Turbine Sensor';
  const location = data.location || 'Factory Floor';

  return (
    <div
      style={{
        padding: '12px 16px',
        borderRadius: '10px',
        background: '#161e2e',
        border: selected ? '2px solid #3b82f6' : '1px solid #2d3748',
        boxShadow: selected ? '0 0 16px rgba(59, 130, 246, 0.4)' : '0 4px 12px rgba(0, 0, 0, 0.4)',
        minWidth: '220px',
        color: '#f8fafc',
        fontFamily: 'Inter, sans-serif'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              padding: '6px',
              borderRadius: '6px',
              background: 'rgba(59, 130, 246, 0.15)',
              color: '#60a5fa',
              display: 'flex'
            }}
          >
            <Radio size={16} />
          </div>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', fontWeight: 600 }}>
            Data Source
          </span>
        </div>
        <span
          style={{
            fontSize: '10px',
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#34d399',
            padding: '2px 6px',
            borderRadius: '4px',
            fontWeight: 500
          }}
        >
          LIVE
        </span>
      </div>

      <div style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9', marginBottom: '4px' }}>
        {label}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '11px', color: '#94a3b8' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Device ID:</span>
          <span style={{ fontFamily: 'monospace', color: '#cbd5e1' }}>{deviceId}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Metric:</span>
          <span style={{ color: '#60a5fa', fontWeight: 500, textTransform: 'capitalize' }}>{metric}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Location:</span>
          <span style={{ color: '#64748b' }}>{location}</span>
        </div>
      </div>

      {/* Output handle for data stream */}
      <Handle
        type="source"
        position={Position.Right}
        id="out"
        style={{
          background: '#3b82f6',
          width: '10px',
          height: '10px',
          border: '2px solid #0f172a'
        }}
      />
    </div>
  );
};

export default memo(SensorNode);
