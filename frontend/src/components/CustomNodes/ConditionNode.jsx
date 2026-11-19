import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { GitCompare, AlertTriangle } from 'lucide-react';

const ConditionNode = ({ data, selected }) => {
  const operator = data.operator || '>';
  const threshold = data.threshold !== undefined ? data.threshold : 80;
  const unit = data.unit || '°C';

  return (
    <div
      style={{
        padding: '12px 16px',
        borderRadius: '10px',
        background: '#261b17',
        border: selected ? '2px solid #f97316' : '1px solid #43281c',
        boxShadow: selected ? '0 0 16px rgba(249, 115, 22, 0.4)' : '0 4px 12px rgba(0, 0, 0, 0.4)',
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
          background: '#f97316',
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
              background: 'rgba(249, 115, 22, 0.15)',
              color: '#fb923c',
              display: 'flex'
            }}
          >
            <GitCompare size={16} />
          </div>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', fontWeight: 600 }}>
            Condition
          </span>
        </div>
      </div>

      <div style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9', marginBottom: '4px' }}>
        Threshold Check
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '11px', color: '#94a3b8' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Rule:</span>
          <span
            style={{
              background: 'rgba(249, 115, 22, 0.2)',
              color: '#fdba74',
              padding: '2px 8px',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontWeight: 600
            }}
          >
            value {operator} {threshold} {unit}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Output:</span>
          <span style={{ color: '#64748b' }}>Triggers when True</span>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="out"
        style={{
          background: '#f97316',
          width: '10px',
          height: '10px',
          border: '2px solid #0f172a'
        }}
      />
    </div>
  );
};

export default memo(ConditionNode);
