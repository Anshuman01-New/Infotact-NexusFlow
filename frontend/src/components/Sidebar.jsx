import React from 'react';
import { Radio, Sliders, GitCompare, BellRing, Info, Plus } from 'lucide-react';

const NODE_CATALOG = [
  {
    category: '1. Data Sources',
    color: '#3b82f6',
    items: [
      {
        type: 'sensor',
        label: 'Turbine Sensor',
        desc: 'Live telemetry from Turbine-001',
        data: {
          label: 'Turbine Sensor',
          deviceId: 'TURBINE_001',
          metric: 'temperature',
          location: 'Floor Block-A'
        }
      },
      {
        type: 'sensor',
        label: 'Boiler Sensor',
        desc: 'Pressure & heat readings',
        data: {
          label: 'Boiler Sensor',
          deviceId: 'BOILER_201',
          metric: 'pressure',
          location: 'Power Unit 2'
        }
      },
      {
        type: 'sensor',
        label: 'Motor Sensor',
        desc: 'Vibration & load metrics',
        data: {
          label: 'Motor Sensor',
          deviceId: 'MOTOR_102',
          metric: 'vibration',
          location: 'Assembly Line 1'
        }
      }
    ]
  },
  {
    category: '2. Stream Filters',
    color: '#8b5cf6',
    items: [
      {
        type: 'filter',
        label: 'Moving Average (5)',
        desc: 'Smooths last 5 readings',
        data: {
          filterType: 'Moving Average',
          windowSize: 5
        }
      },
      {
        type: 'filter',
        label: 'Moving Average (10)',
        desc: 'Smooths last 10 readings',
        data: {
          filterType: 'Moving Average',
          windowSize: 10
        }
      }
    ]
  },
  {
    category: '3. Conditions',
    color: '#f97316',
    items: [
      {
        type: 'condition',
        label: 'Temp > 80°C',
        desc: 'Checks if temperature > 80',
        data: {
          operator: '>',
          threshold: 80,
          unit: '°C'
        }
      },
      {
        type: 'condition',
        label: 'Pressure > 120 kPa',
        desc: 'High pressure safety check',
        data: {
          operator: '>',
          threshold: 120,
          unit: 'kPa'
        }
      }
    ]
  },
  {
    category: '4. Action Triggers',
    color: '#ef4444',
    items: [
      {
        type: 'action',
        label: 'SMS Alert',
        desc: 'Dispatches emergency SMS',
        data: {
          actionType: 'SMS Alert',
          target: '+1 (555) 019-2831',
          template: 'Alert: Critical condition triggered!'
        }
      },
      {
        type: 'action',
        label: 'Webhook Alert',
        desc: 'Posts payload to endpoint',
        data: {
          actionType: 'Webhook Alert',
          target: 'https://hooks.factory.internal/alert',
          template: 'POST alert payload'
        }
      }
    ]
  }
];

const Sidebar = () => {
  const onDragStart = (event, nodeType, initialData) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify({
      type: nodeType,
      data: initialData
    }));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside
      style={{
        width: '280px',
        background: '#0f172a',
        borderRight: '1px solid #1e293b',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflowY: 'auto',
        color: '#e2e8f0',
        userSelect: 'none'
      }}
    >
      <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid #1e293b' }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#f8fafc', letterSpacing: '0.02em' }}>
          NODE PALETTE
        </h3>
        <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#64748b' }}>
          Drag and drop blocks into the canvas
        </p>
      </div>

      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
        {NODE_CATALOG.map((group, groupIdx) => (
          <div key={groupIdx}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: group.color,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>{group.category}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {group.items.map((item, itemIdx) => (
                <div
                  key={itemIdx}
                  draggable
                  onDragStart={(e) => onDragStart(e, item.type, item.data)}
                  style={{
                    padding: '9px 12px',
                    borderRadius: '8px',
                    background: '#1e293b',
                    border: '1px solid #334155',
                    cursor: 'grab',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = group.color;
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#334155';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#f1f5f9' }}>
                      {item.label}
                    </span>
                    <Plus size={13} color="#94a3b8" />
                  </div>
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                    {item.desc}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          margin: '12px 14px 16px',
          padding: '12px',
          borderRadius: '8px',
          background: 'rgba(59, 130, 246, 0.08)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          fontSize: '11px',
          color: '#93c5fd',
          lineHeight: 1.4
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, marginBottom: '4px' }}>
          <Info size={14} /> Week 1 Workflow Tip
        </div>
        Connect <b>Sensor</b> &rarr; <b>Moving Average</b> &rarr; <b>Condition</b> &rarr; <b>SMS Alert</b> to define an IoT rule pipeline.
      </div>
    </aside>
  );
};

export default Sidebar;
