import React, { useState, useRef, useCallback, useEffect } from 'react';
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
import MathNode from '../components/CustomNodes/MathNode';
import ConditionNode from '../components/CustomNodes/ConditionNode';
import ActionNode from '../components/CustomNodes/ActionNode';
import Sidebar from '../components/Sidebar';
import api from '../services/api';

import {
  X,
  Code,
  CheckCircle,
  AlertTriangle,
  Play,
  CheckCheck,
  Save,
  FolderOpen,
  Download,
  Upload,
  Trash2,
  Sliders,
  RefreshCw,
  Cpu,
  Layers,
  ArrowRight
} from 'lucide-react';

const nodeTypes = {
  sensor: SensorNode,
  filter: FilterNode,
  math: MathNode,
  condition: ConditionNode,
  action: ActionNode
};

// Initial sample workflow as described in the NexusFlow specification
const initialNodes = [
  {
    id: 'node-1',
    type: 'sensor',
    position: { x: 60, y: 160 },
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
    position: { x: 340, y: 160 },
    data: {
      filterType: 'Moving Average',
      windowSize: 3
    }
  },
  {
    id: 'node-3',
    type: 'condition',
    position: { x: 620, y: 160 },
    data: {
      operator: '>',
      threshold: 80,
      unit: '°C'
    }
  },
  {
    id: 'node-4',
    type: 'action',
    position: { x: 900, y: 160 },
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

let idCounter = 10;

const WorkflowBuilderContent = ({ jsonModalOpen, setJsonModalOpen }) => {
  const reactFlowWrapper = useRef(null);
  const fileInputRef = useRef(null);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [workflowName, setWorkflowName] = useState('Turbine Temperature Alert Workflow');

  // Modals & Panels
  const [validationResult, setValidationResult] = useState(null);
  const [validationModalOpen, setValidationModalOpen] = useState(false);
  const [validating, setValidating] = useState(false);

  const [simModalOpen, setSimModalOpen] = useState(false);
  const [simLoading, setSimLoading] = useState(false);
  const [simResult, setSimResult] = useState(null);

  const [savedWorkflowsModal, setSavedWorkflowsModal] = useState(false);
  const [savedList, setSavedList] = useState([]);
  const [saveToast, setSaveToast] = useState(null);

  // Connect Nodes
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

  // Build clean graph JSON
  const getSerializedGraph = () => ({
    workflowName,
    version: '2.0.0',
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
  });

  // Week 2: Validate graph with backend StreamCompiler
  const handleValidateGraph = async () => {
    setValidating(true);
    try {
      const graph = getSerializedGraph();
      const res = await api.validateWorkflow(graph);
      setValidationResult(res);
      setValidationModalOpen(true);
    } catch (err) {
      setValidationResult({
        valid: false,
        errors: [err.response?.data?.error || err.message || 'Validation request failed']
      });
      setValidationModalOpen(true);
    } finally {
      setValidating(false);
    }
  };

  // Week 2: Test compile and execute simulation
  const handleRunSimulation = async () => {
    setSimLoading(true);
    setSimModalOpen(true);
    setSimResult(null);

    try {
      const graph = getSerializedGraph();
      const mockReadings = [
        { deviceId: 'TURBINE_001', temperature: 72.0, pressure: 100, vibration: 2.0, timestamp: new Date(Date.now() - 3000).toISOString() },
        { deviceId: 'TURBINE_001', temperature: 76.5, pressure: 108, vibration: 2.5, timestamp: new Date(Date.now() - 2000).toISOString() },
        { deviceId: 'TURBINE_001', temperature: 84.0, pressure: 115, vibration: 3.2, timestamp: new Date(Date.now() - 1000).toISOString() },
        { deviceId: 'TURBINE_001', temperature: 92.5, pressure: 128, vibration: 4.8, timestamp: new Date().toISOString() }
      ];

      const res = await api.testCompileWorkflow(graph, mockReadings);
      setSimResult(res);
    } catch (err) {
      setSimResult({
        success: false,
        error: err.response?.data?.error || err.message || 'Simulation test failed.'
      });
    } finally {
      setSimLoading(false);
    }
  };

  // Week 2: Save workflow to MongoDB
  const handleSaveToBackend = async () => {
    try {
      const graph = getSerializedGraph();
      const payload = {
        name: workflowName,
        nodes: graph.nodes,
        edges: graph.edges,
        isActive: true
      };

      await api.createWorkflow(payload);
      setSaveToast({ success: true, message: `Saved & Deployed '${workflowName}' to MongoDB!` });
      setTimeout(() => setSaveToast(null), 4000);
    } catch (err) {
      setSaveToast({ success: false, message: `Save error: ${err.response?.data?.error || err.message}` });
      setTimeout(() => setSaveToast(null), 5000);
    }
  };

  // Week 2: Load workflows list
  const handleOpenLoadModal = async () => {
    try {
      const res = await api.getWorkflows();
      setSavedList(res.data || []);
      setSavedWorkflowsModal(true);
    } catch (err) {
      alert(`Could not fetch saved workflows: ${err.message}`);
    }
  };

  const handleSelectWorkflow = (wf) => {
    setWorkflowName(wf.name || 'Imported Workflow');
    if (wf.nodes && wf.nodes.length > 0) setNodes(wf.nodes);
    if (wf.edges) setEdges(wf.edges);
    setSavedWorkflowsModal(false);
    setSaveToast({ success: true, message: `Loaded workflow '${wf.name}'` });
    setTimeout(() => setSaveToast(null), 3000);
  };

  // JSON Download
  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(getSerializedGraph(), null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${workflowName.toLowerCase().replace(/\s+/g, '-')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // JSON Import
  const handleFileImport = (e) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          if (parsed.nodes && parsed.edges) {
            setNodes(parsed.nodes);
            setEdges(parsed.edges);
            if (parsed.workflowName) setWorkflowName(parsed.workflowName);
            setSaveToast({ success: true, message: 'Workflow imported successfully!' });
            setTimeout(() => setSaveToast(null), 3000);
          } else {
            alert('Invalid workflow file format. Must contain nodes and edges.');
          }
        } catch (err) {
          alert('Failed to parse JSON file.');
        }
      };
    }
  };

  const graphJson = JSON.stringify(getSerializedGraph(), null, 2);

  return (
    <div style={{ display: 'flex', width: '100%', height: 'calc(100vh - 60px)', position: 'relative' }}>
      {/* Left Sidebar Palette */}
      <Sidebar />

      {/* Main Flow Canvas */}
      <div ref={reactFlowWrapper} style={{ flex: 1, height: '100%', background: '#090d16', position: 'relative' }}>
        {/* Canvas Toolbar */}
        <div
          style={{
            position: 'absolute',
            top: '14px',
            left: '20px',
            right: '20px',
            background: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(8px)',
            border: '1px solid #1e293b',
            padding: '8px 16px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 10,
            gap: '12px'
          }}
        >
          {/* Workflow Name input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Workflow:</span>
            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              style={{
                background: '#1e293b',
                border: '1px solid #334155',
                color: '#f8fafc',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                width: '260px'
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Week 2: Validate Graph */}
            <button
              onClick={handleValidateGraph}
              disabled={validating}
              style={{
                background: '#1e293b',
                color: '#38bdf8',
                border: '1px solid #0284c7',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <CheckCheck size={14} /> Validate Graph
            </button>

            {/* Week 2: Test Simulation */}
            <button
              onClick={handleRunSimulation}
              disabled={simLoading}
              style={{
                background: '#166534',
                color: '#86efac',
                border: '1px solid #22c55e',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Play size={14} fill="#86efac" /> Run Simulation
            </button>

            {/* Save to Backend */}
            <button
              onClick={handleSaveToBackend}
              style={{
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Save size={14} /> Save to Cloud
            </button>

            {/* Load Saved */}
            <button
              onClick={handleOpenLoadModal}
              style={{
                background: '#1e293b',
                color: '#cbd5e1',
                border: '1px solid #334155',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <FolderOpen size={14} /> Load
            </button>

            {/* Export JSON */}
            <button
              onClick={() => setJsonModalOpen(true)}
              style={{
                background: '#1e293b',
                color: '#cbd5e1',
                border: '1px solid #334155',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              <Code size={14} />
            </button>

            {/* File Upload Hidden Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileImport}
              accept=".json"
              style={{ display: 'none' }}
            />
            <button
              title="Import JSON Workflow"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              style={{
                background: '#1e293b',
                color: '#cbd5e1',
                border: '1px solid #334155',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              <Upload size={14} />
            </button>
          </div>
        </div>

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

        {/* Floating summary badge */}
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid #334155',
            padding: '6px 14px',
            borderRadius: '8px',
            fontSize: '11px',
            color: '#94a3b8',
            display: 'flex',
            gap: '12px',
            zIndex: 10
          }}
        >
          <span>Nodes: <strong style={{ color: '#fff' }}>{nodes.length}</strong></span>
          <span>Connections: <strong style={{ color: '#fff' }}>{edges.length}</strong></span>
          <span style={{ color: '#38bdf8' }}>Week 2 Logic Engine Active</span>
        </div>
      </div>

      {/* Node Inspector Drawer */}
      {selectedNode && (
        <div
          style={{
            width: '320px',
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

          {/* SENSOR NODE FORM */}
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
                <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Metric Stream</label>
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

          {/* FILTER NODE FORM */}
          {selectedNode.type === 'filter' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Filter Type</label>
                <input
                  type="text"
                  readOnly
                  value="Moving Average (Sliding Window)"
                  style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', color: '#cbd5e1', padding: '8px', borderRadius: '6px', fontSize: '12px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Window Size (readings)</label>
                <input
                  type="number"
                  min="2"
                  max="50"
                  value={selectedNode.data.windowSize || 3}
                  onChange={(e) => updateSelectedNodeData('windowSize', parseInt(e.target.value, 10))}
                  style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '12px' }}
                />
              </div>
            </div>
          )}

          {/* MATH NODE FORM (WEEK 2) */}
          {selectedNode.type === 'math' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Math Operation</label>
                <select
                  value={selectedNode.data.operation || 'multiply'}
                  onChange={(e) => updateSelectedNodeData('operation', e.target.value)}
                  style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '12px' }}
                >
                  <option value="multiply">Multiply (×)</option>
                  <option value="add">Add / Offset (+)</option>
                  <option value="subtract">Subtract (−)</option>
                  <option value="divide">Divide (÷)</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Operand Value</label>
                <input
                  type="number"
                  step="0.1"
                  value={selectedNode.data.operand ?? 2}
                  onChange={(e) => updateSelectedNodeData('operand', parseFloat(e.target.value))}
                  style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '12px' }}
                />
              </div>
            </div>
          )}

          {/* CONDITION NODE FORM */}
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
                  <option value="!=">Not equal (!=)</option>
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

          {/* ACTION NODE FORM */}
          {selectedNode.type === 'action' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Action Trigger Type</label>
                <select
                  value={selectedNode.data.actionType || 'SMS Alert'}
                  onChange={(e) => updateSelectedNodeData('actionType', e.target.value)}
                  style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '12px' }}
                >
                  <option value="SMS Alert">SMS Alert</option>
                  <option value="Webhook Alert">Webhook Alert</option>
                  <option value="Incident Log">Incident Log</option>
                  <option value="Emergency Shutoff">Emergency Shutoff</option>
                </select>
              </div>
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

      {/* WEEK 2: VALIDATION MODAL */}
      {validationModalOpen && validationResult && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 110
          }}
        >
          <div
            style={{
              width: '560px',
              background: '#0f172a',
              border: validationResult.valid ? '1px solid #059669' : '1px solid #dc2626',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {validationResult.valid ? (
                  <CheckCircle size={22} color="#34d399" />
                ) : (
                  <AlertTriangle size={22} color="#f87171" />
                )}
                <h3 style={{ margin: 0, fontSize: '16px', color: '#f8fafc' }}>
                  {validationResult.valid ? 'Graph Structure Valid (DAG)' : 'Graph Validation Errors'}
                </h3>
              </div>
              <button
                onClick={() => setValidationModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {validationResult.valid ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: '#cbd5e1' }}>
                <p style={{ margin: 0 }}>
                  This workflow is a valid <b>Directed Acyclic Graph (DAG)</b> with 0 circular loops.
                </p>
                <div style={{ background: '#1e293b', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Topological Execution Order (Kahn's Algorithm):
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                    {validationResult.executionOrder?.map((nodeId, idx) => (
                      <React.Fragment key={nodeId}>
                        <span style={{ background: '#0284c7', color: '#fff', padding: '3px 8px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '12px' }}>
                          {nodeId}
                        </span>
                        {idx < validationResult.executionOrder.length - 1 && <ArrowRight size={12} color="#64748b" />}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
                {validationResult.warnings && validationResult.warnings.length > 0 && (
                  <div style={{ background: 'rgba(234, 179, 8, 0.1)', border: '1px solid #eab308', padding: '10px', borderRadius: '6px', fontSize: '12px', color: '#fde047' }}>
                    <strong>Warnings:</strong>
                    <ul style={{ margin: '4px 0 0 16px' }}>
                      {validationResult.warnings.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#fca5a5' }}>
                  The backend Stream Compiler identified issues in the graph:
                </p>
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', padding: '12px', borderRadius: '8px' }}>
                  <ul style={{ margin: 0, paddingLeft: '20px', color: '#f87171', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {validationResult.errors?.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setValidationModalOpen(false)}
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
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WEEK 2: SIMULATION TEST RUN MODAL */}
      {simModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 110
          }}
        >
          <div
            style={{
              width: '680px',
              maxHeight: '80vh',
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
            }}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Play size={18} color="#22c55e" fill="#22c55e" />
                <h3 style={{ margin: 0, fontSize: '15px', color: '#fff' }}>RxJS Pipeline Simulation & Test Run</h3>
              </div>
              <button
                onClick={() => setSimModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {simLoading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                  <RefreshCw size={24} className="spin" style={{ marginBottom: '12px', color: '#38bdf8' }} />
                  <div>Compiling RxJS pipeline and executing test stream...</div>
                </div>
              ) : simResult && simResult.success ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                    <div style={{ background: '#1e293b', padding: '12px', borderRadius: '8px' }}>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>Readings Evaluated:</span>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: '#38bdf8' }}>{simResult.summary?.readingsEvaluated}</div>
                    </div>
                    <div style={{ background: '#1e293b', padding: '12px', borderRadius: '8px' }}>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>Alerts Dispatched:</span>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: simResult.summary?.alertsEmittedCount > 0 ? '#ef4444' : '#34d399' }}>
                        {simResult.summary?.alertsEmittedCount}
                      </div>
                    </div>
                  </div>

                  {/* Dispatched Alerts */}
                  {simResult.alertsEmitted && simResult.alertsEmitted.length > 0 && (
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#f87171', marginBottom: '8px' }}>Dispatched Alerts:</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {simResult.alertsEmitted.map((alert, i) => (
                          <div key={i} style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', padding: '10px 14px', borderRadius: '8px', fontSize: '12px' }}>
                            <div style={{ fontWeight: 600, color: '#fca5a5' }}>
                              🚨 {alert.workflowName} Triggered for {alert.deviceId}
                            </div>
                            <div style={{ color: '#cbd5e1', marginTop: '4px' }}>
                              Trigger Value: <b>{alert.value}</b> ({alert.metric}) | Condition: <b>{alert.operator} {alert.threshold}</b>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Execution Trace */}
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px' }}>
                      Node Step Traces (RxJS transformations):
                    </div>
                    <div style={{ background: '#090d16', padding: '12px', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace', maxHeight: '200px', overflowY: 'auto' }}>
                      {simResult.stepTraces?.map((step, i) => (
                        <div key={i} style={{ padding: '3px 0', borderBottom: '1px solid #1e293b', color: '#94a3b8' }}>
                          <span style={{ color: '#38bdf8' }}>[{step.nodeId}]</span> {step.item.trace?.join(' ➔ ')}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', padding: '16px', borderRadius: '8px', color: '#f87171', fontSize: '13px' }}>
                  {simResult?.error || 'Simulation failed to execute.'}
                </div>
              )}
            </div>

            <div style={{ padding: '12px 20px', borderTop: '1px solid #1e293b', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSimModalOpen(false)}
                style={{ background: '#1e293b', color: '#fff', border: '1px solid #334155', padding: '7px 16px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SAVED WORKFLOWS MODAL */}
      {savedWorkflowsModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 110
          }}
        >
          <div
            style={{
              width: '600px',
              maxHeight: '75vh',
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '12px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FolderOpen size={18} color="#38bdf8" />
                <h3 style={{ margin: 0, fontSize: '16px', color: '#fff' }}>Saved Workflows in MongoDB</h3>
              </div>
              <button onClick={() => setSavedWorkflowsModal(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {savedList.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                  No saved workflows found in database. Use "Save to Cloud" to persist workflows!
                </div>
              ) : (
                savedList.map((wf) => (
                  <div
                    key={wf._id}
                    onClick={() => handleSelectWorkflow(wf)}
                    style={{
                      background: '#1e293b',
                      border: '1px solid #334155',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#38bdf8'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#334155'; }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9' }}>{wf.name}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                        Nodes: {wf.nodes?.length || 0} | Edges: {wf.edges?.length || 0} | Last updated: {new Date(wf.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', background: wf.isActive ? 'rgba(34, 197, 94, 0.15)' : 'rgba(100, 116, 139, 0.15)', color: wf.isActive ? '#4ade80' : '#94a3b8', padding: '3px 8px', borderRadius: '4px' }}>
                      {wf.isActive ? 'Active' : 'Draft'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* JSON MODAL */}
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
            <div style={{ padding: '12px 20px', borderTop: '1px solid #1e293b', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={handleDownloadJson}
                style={{
                  background: '#1e293b',
                  color: '#cbd5e1',
                  border: '1px solid #334155',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Download size={14} /> Download .json
              </button>
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

      {/* Save Notification Toast */}
      {saveToast && (
        <div
          style={{
            position: 'absolute',
            bottom: '24px',
            right: '24px',
            background: saveToast.success ? '#064e3b' : '#7f1d1d',
            border: saveToast.success ? '1px solid #059669' : '1px solid #dc2626',
            color: saveToast.success ? '#a7f3d0' : '#fca5a5',
            padding: '12px 18px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)',
            zIndex: 100
          }}
        >
          {saveToast.success ? <CheckCircle size={18} color="#34d399" /> : <AlertTriangle size={18} color="#f87171" />}
          <span style={{ fontSize: '13px', fontWeight: 500 }}>{saveToast.message}</span>
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
