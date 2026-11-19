import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { BellRing, Send, MessageSquare } from 'lucide-react';

const ActionNode = ({ data, selected }) => {
  const actionType = data.actionType || 'SMS Alert';
  const target = data.target || '+1 (555) 019-2831';
  const template = data.template || 'Warning: High Temperature threshold exceeded!';

  return (
    <div
      style={{
        padding: '12px 16px',
        borderRadius: '10px',
        background: '#241419',
        border: selected ? '2px solid #ef4444' : '1px solid #451a1a',
        boxShadow: selected ? '0 0 16px rgba(239, 68, 68, 0.4)' : '0 4px 12px rgba(0, 0, 0, 0.4)',
        minWidth: '220px',
        color: '#f8fafc',
        fontFamily: 'Inter, sans-serif'
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        style={{
          background: '#ef4444',
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
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#f87171',
              display: 'flex'
            }}
          >
            <BellRing size={16} />
          </div>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', fontWeight: 600 }}>
            Action Trigger
          </span>
        </div>
      </div>

      <div style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9', marginBottom: '4px' }}>
        {actionType}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '11px', color: '#94a3b8' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Target:</span>
          <span style={{ fontFamily: 'monospace', color: '#fca5a5' }}>{target}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Action:</span>
          <span style={{ color: '#64748b' }}>Dispatch Alert</span>
        </div>
      </div>
    </div>
  );
};

export default memo(ActionNode);
