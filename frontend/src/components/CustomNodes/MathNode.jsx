import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Calculator } from 'lucide-react';

const MathNode = ({ data, selected }) => {
  const operation = data.operation || 'multiply';
  const operand = data.operand !== undefined ? data.operand : 2;

  const getSymbol = (op) => {
    switch (String(op).toLowerCase()) {
      case 'multiply':
      case 'scale':
        return '×';
      case 'add':
        return '+';
      case 'subtract':
        return '−';
      case 'divide':
        return '÷';
      default:
        return '×';
    }
  };

  return (
    <div
      style={{
        padding: '12px 16px',
        borderRadius: '10px',
        background: '#13211e',
        border: selected ? '2px solid #10b981' : '1px solid #1e3a34',
        boxShadow: selected ? '0 0 16px rgba(16, 185, 129, 0.4)' : '0 4px 12px rgba(0, 0, 0, 0.4)',
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
          background: '#10b981',
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
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              display: 'flex'
            }}
          >
            <Calculator size={16} />
          </div>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', fontWeight: 600 }}>
            Math Operation
          </span>
        </div>
      </div>

      <div style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9', marginBottom: '4px', textTransform: 'capitalize' }}>
        {operation} ({getSymbol(operation)} {operand})
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '11px', color: '#94a3b8' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Transformation:</span>
          <span style={{ fontFamily: 'monospace', color: '#6ee7b7' }}>
            value {getSymbol(operation)} {operand}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Output:</span>
          <span style={{ color: '#64748b' }}>Scaled Stream</span>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="out"
        style={{
          background: '#10b981',
          width: '10px',
          height: '10px',
          border: '2px solid #0f172a'
        }}
      />
    </div>
  );
};

export default memo(MathNode);
