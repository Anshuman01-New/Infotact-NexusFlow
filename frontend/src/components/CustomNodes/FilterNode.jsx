import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Sliders, TrendingUp } from 'lucide-react';

const FilterNode = ({ data, selected }) => {
  const filterType = data.filterType || 'Moving Average';
  const windowSize = data.windowSize || 5;

  return (
    <div
      style={{
        padding: '12px 16px',
        borderRadius: '10px',
        background: '#1a1f2c',
        border: selected ? '2px solid #8b5cf6' : '1px solid #2d3748',
        boxShadow: selected ? '0 0 16px rgba(139, 92, 246, 0.4)' : '0 4px 12px rgba(0, 0, 0, 0.4)',
        minWidth: '210px',
        color: '#f8fafc',
        fontFamily: 'Inter, sans-serif'
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        style={{
          background: '#8b5cf6',
          width: '10px',
          height: '10px',
          border: '2px solid #0f172a'
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              padding: '6px',
              borderRadius: '6px',
              background: 'rgba(139, 92, 246, 0.15)',
              color: '#a78bfa',
              display: 'flex'
            }}
          >
            <Sliders size={16} />
          </div>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', fontWeight: 600 }}>
            Filter / Transform
          </span>
        </div>
      </div>

      <div style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9', marginBottom: '4px' }}>
        {filterType}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '11px', color: '#94a3b8' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Window Size:</span>
          <span style={{ color: '#a78bfa', fontWeight: 600 }}>{windowSize} readings</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Operation:</span>
          <span style={{ color: '#64748b' }}>Buffer & Mean</span>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="out"
        style={{
          background: '#8b5cf6',
          width: '10px',
          height: '10px',
          border: '2px solid #0f172a'
        }}
      />
    </div>
  );
};

export default memo(FilterNode);
