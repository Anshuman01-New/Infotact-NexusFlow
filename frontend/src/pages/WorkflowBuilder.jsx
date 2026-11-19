import React, { useState, useRef, useCallback } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';

import SensorNode from '../components/CustomNodes/SensorNode';
import FilterNode from '../components/CustomNodes/FilterNode';
import ConditionNode from '../components/CustomNodes/ConditionNode';
import ActionNode from '../components/CustomNodes/ActionNode';
import Sidebar from '../components/Sidebar';
import { X, Code, CheckCircle, Sliders, Trash2 } from 'lucide-react';

const nodeTypes = {
  sensor: SensorNode,
  filter: FilterNode,
  condition: ConditionNode,
  action: ActionNode
};

// Initial sample workflow as described in the NexusFlow specification
const initialNodes = [
  {
    id: 'node-1',
    type: 'sensor',
    position: { x: 80, y: 160 },
    data: {
      label: 'Turbine Sensor',
      deviceId: 'TURBINE_001',
      metric: 'temperature',
      location: 'Factory Floor Block-A'
    }
  },
  {
    id: 'node-2',
    type: 'filter',
    position: { x: 380, y: 160 },
    data: {
      filterType: 'Moving Average',
      windowSize: 5
    }
  },
  {
    id: 'node-3',
    type: 'condition',
    position: { x: 670, y: 160 },
    data: {
      operator: '>',
      threshold: 80,
      unit: '°C'
    }
  },
  {
    id: 'node-4',
    type: 'action',
    position: { x: 960, y: 160 },
    data: {
      actionType: 'SMS Alert',
      target: '+1 (555) 019-2831',
      template: 'Warning: Turbine temperature exceeds 80°C!'
    }
  }
];

const initialEdges = [
  {
    id: 'e1-2',
    source: 'node-1',
    target: 'node-2',
    animated: true,
    style: { stroke: '#3b82f6', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' }
  },
  {
    id: 'e2-3',
    source: 'node-2',
    target: 'node-3',
    animated: true,
    style: { stroke: '#8b5cf6', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6' }
  },
  {
    id: 'e3-4',
    source: 'node-3',
    target: 'node-4',
    animated: true,
    style: { stroke: '#f97316', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#f97316' }
  }
];

let idCounter = 5;

const WorkflowBuilderContent = ({ jsonModalOpen, setJsonModalOpen, saveNotification, setSaveNotification }) => {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);

  const onConnect = useCallback(
    (params) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: true,
            style: { stroke: '#38bdf8', strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#38bdf8' }
          },
          eds
        )
      );
    },
    [setEdges]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const rawData = event.dataTransfer.getData('application/reactflow');
      if (!rawData) return;

      const { type, data } = JSON.parse(rawData);

      // Get drop position relative to canvas
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top
      });

      const newNode = {
        id: `node-${idCounter++}`,
        type,
        position,
        data: { ...data }
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // Update selected node data
  const updateSelectedNodeData = (key, value) => {
    if (!selectedNode) return;
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === selectedNode.id) {
          const updated = {
            ...n,
            data: { ...n.data, [key]: value }
          };
          setSelectedNode(updated);
          return updated;
        }
        return n;
      })
    );
  };

  const deleteSelectedNode = () => {
    if (!selectedNode) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
    setSelectedNode(null);
  };

  const graphJson = JSON.stringify(
    {
      workflowName: 'Turbine Temperature Alert Workflow',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      nodes: nodes.map((n) => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: n.data
      })),
      edges: edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target
      }))
    },
    null,
    2
  );

  return (
    <div style={{ display: 'flex', width: '100%', height: 'calc(100vh - 60px)', position: 'relative' }}>
      {/* Left Sidebar Palette */}
      <Sidebar />

      {/* Main Flow Canvas */}
      <div ref={reactFlowWrapper} style={{ flex: 1, height: '100%', background: '#090d16' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
        >
          <Controls
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              overflow: 'hidden'
            }}
          />
          <Background color="#1e293b" gap={20} size={1.5} />
          <MiniMap
            nodeStrokeColor="#475569"
            nodeColor="#1e293b"
            style={{
              background: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: '8px'
            }}
          />
        </ReactFlow>

        {/* Canvas floating quick info */}
        <div
          style={{
            position: 'absolute',
            top: '16px',
            left: '300px',
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            border: '1px solid #334155',
            padding: '8px 16px',
            borderRadius: '8px',
            color: '#94a3b8',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            zIndex: 10
          }}
        >
          <span>Nodes: <strong style={{ color: '#f1f5f9' }}>{nodes.length}</strong></span>
          <span>Connections: <strong style={{ color: '#f1f5f9' }}>{edges.length}</strong></span>
          <span style={{ color: '#38bdf8' }}>Drag nodes from left | Click to inspect</span>
        </div>
      </div>

      {/* Node Inspector Drawer */}
      {selectedNode && (
        <div
          style={{
            width: '300px',
            background: '#0f172a',
            borderLeft: '1px solid #1e293b',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            color: '#f8fafc',
            boxSizing: 'border-box',
            zIndex: 20
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={18} color="#38bdf8" />
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>Node Inspector</h3>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          </div>

          <div style={{ fontSize: '11px', color: '#64748b' }}>
            ID: <span style={{ fontFamily: 'monospace', color: '#cbd5e1' }}>{selectedNode.id}</span> | Type: <span style={{ textTransform: 'capitalize', color: '#38bdf8' }}>{selectedNode.type}</span>
          </div>

          {/* Node Type Specific Fields */}
          {selectedNode.type === 'sensor' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Device ID</label>
                <input
                  type="text"
                  value={selectedNode.data.deviceId || ''}
                  onChange={(e) => updateSelectedNodeData('deviceId', e.target.value)}
                  style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '12px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Metric</label>
                <select
                  value={selectedNode.data.metric || 'temperature'}
                  onChange={(e) => updateSelectedNodeData('metric', e.target.value)}
                  style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '12px' }}
                >
                  <option value="temperature">Temperature (°C)</option>
                  <option value="pressure">Pressure (kPa)</option>
                  <option value="vibration">Vibration (mm/s)</option>
                  <option value="humidity">Humidity (%)</option>
                </select>
              </div>
            </div>
          )}

          {selectedNode.type === 'filter' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Window Size (samples)</label>
                <input
                  type="number"
                  min="2"
                  max="50"
                  value={selectedNode.data.windowSize || 5}
                  onChange={(e) => updateSelectedNodeData('windowSize', parseInt(e.target.value, 10))}
                  style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '12px' }}
                />
              </div>
            </div>
          )}

          {selectedNode.type === 'condition' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Operator</label>
                <select
                  value={selectedNode.data.operator || '>'}
                  onChange={(e) => updateSelectedNodeData('operator', e.target.value)}
                  style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '12px' }}
                >
                  <option value=">">Greater than (&gt;)</option>
                  <option value=">=">Greater than or equal (&gt;=)</option>
                  <option value="<">Less than (&lt;)</option>
                  <option value="<=">Less than or equal (&lt;=)</option>
                  <option value="==">Equals (==)</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Threshold Value</label>
                <input
                  type="number"
                  value={selectedNode.data.threshold ?? 80}
                  onChange={(e) => updateSelectedNodeData('threshold', parseFloat(e.target.value))}
                  style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '12px' }}
                />
              </div>
            </div>
          )}

          {selectedNode.type === 'action' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Target / Recipient</label>
                <input
                  type="text"
                  value={selectedNode.data.target || ''}
                  onChange={(e) => updateSelectedNodeData('target', e.target.value)}
                  style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '12px' }}
                />
              </div>
            </div>
          )}

          <div style={{ marginTop: 'auto' }}>
            <button
              onClick={deleteSelectedNode}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '9px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Trash2 size={14} /> Remove Node
            </button>
          </div>
        </div>
      )}

      {/* JSON Modal */}
      {jsonModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100
          }}
        >
          <div
            style={{
              width: '640px',
              maxHeight: '80vh',
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #1e293b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Code size={18} color="#38bdf8" />
                <h3 style={{ margin: 0, fontSize: '15px', color: '#fff' }}>Serialized Graph JSON</h3>
              </div>
              <button
                onClick={() => setJsonModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
            <pre
              style={{
                padding: '16px 20px',
                margin: 0,
                overflowY: 'auto',
                fontSize: '12px',
                fontFamily: 'monospace',
                background: '#090d16',
                color: '#38bdf8',
                flex: 1
              }}
            >
              {graphJson}
            </pre>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #1e293b', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(graphJson);
                  alert('Graph JSON copied to clipboard!');
                }}
                style={{
                  background: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Copy to Clipboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Toast Notification */}
      {saveNotification && (
        <div
          style={{
            position: 'absolute',
            bottom: '24px',
            right: '24px',
            background: '#064e3b',
            border: '1px solid #059669',
            color: '#a7f3d0',
            padding: '12px 18px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)',
            zIndex: 100
          }}
        >
          <CheckCircle size={18} color="#34d399" />
          <span style={{ fontSize: '13px', fontWeight: 500 }}>Workflow configuration saved successfully!</span>
        </div>
      )}
    </div>
  );
};

const WorkflowBuilder = (props) => (
  <ReactFlowProvider>
    <WorkflowBuilderContent {...props} />
  </ReactFlowProvider>
);

export default WorkflowBuilder;
