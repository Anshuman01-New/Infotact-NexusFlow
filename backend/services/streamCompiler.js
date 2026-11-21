const { Subject, Observable } = require('rxjs');
const { filter, map, scan, tap } = require('rxjs/operators');
const alertService = require('./alertService');

const SUPPORTED_NODE_TYPES = [
  'sensor',
  'datasource',
  'filter',
  'movingaverage',
  'math',
  'mathoperation',
  'condition',
  'action',
  'smsalert',
  'webhookalert'
];

/**
 * Normalizes node type names to standard canonical tokens
 */
function normalizeNodeType(type) {
  if (!type) return '';
  const lower = String(type).toLowerCase().replace(/[^a-z]/g, '');
  if (lower === 'sensor' || lower === 'datasource') return 'sensor';
  if (lower === 'filter' || lower === 'movingaverage') return 'filter';
  if (lower === 'math' || lower === 'mathoperation') return 'math';
  if (lower === 'condition') return 'condition';
  if (lower === 'action' || lower === 'smsalert' || lower === 'webhookalert' || lower === 'actiontrigger') return 'action';
  return lower;
}

/**
 * Validates a visual graph structure and node parameters.
 * Checks for DAG (Directed Acyclic Graph) validity, cycles, and connectivity.
 */
function validateGraph(graph) {
  const errors = [];
  const warnings = [];

  if (!graph || typeof graph !== 'object') {
    return { valid: false, errors: ['Graph specification must be a valid JSON object.'] };
  }

  const nodes = Array.isArray(graph.nodes) ? graph.nodes : [];
  const edges = Array.isArray(graph.edges) ? graph.edges : [];

  if (nodes.length === 0) {
    errors.push('Workflow graph must contain at least one node.');
    return { valid: false, errors, warnings };
  }

  // 1. Validate individual nodes
  const nodeMap = new Map();
  nodes.forEach((node, idx) => {
    if (!node.id) {
      errors.push(`Node at index ${idx} is missing a required 'id'.`);
      return;
    }

    if (nodeMap.has(node.id)) {
      errors.push(`Duplicate node ID detected: '${node.id}'.`);
    }

    const canonicalType = normalizeNodeType(node.type);
    if (!SUPPORTED_NODE_TYPES.includes(canonicalType)) {
      errors.push(`Node '${node.id}' has unsupported type '${node.type}'. Supported: sensor, filter, math, condition, action.`);
    }

    // Node configuration validation
    const data = node.data || {};
    if (canonicalType === 'sensor') {
      if (!data.deviceId) errors.push(`Sensor node '${node.id}' requires 'deviceId' in its data configuration.`);
      if (!data.metric) warnings.push(`Sensor node '${node.id}' metric not specified, defaulting to 'temperature'.`);
    } else if (canonicalType === 'filter') {
      const win = parseInt(data.windowSize, 10);
      if (isNaN(win) || win <= 0) {
        errors.push(`Filter node '${node.id}' requires a positive integer 'windowSize' (e.g., 5).`);
      }
    } else if (canonicalType === 'math') {
      const allowedOps = ['multiply', 'add', 'subtract', 'divide', 'scale'];
      if (!data.operation || !allowedOps.includes(String(data.operation).toLowerCase())) {
        errors.push(`Math node '${node.id}' requires a valid 'operation' (${allowedOps.join(', ')}).`);
      }
      if (typeof data.operand !== 'number' && isNaN(parseFloat(data.operand))) {
        errors.push(`Math node '${node.id}' requires a numeric 'operand'.`);
      }
    } else if (canonicalType === 'condition') {
      const allowedOps = ['>', '>=', '<', '<=', '==', '!='];
      if (!data.operator || !allowedOps.includes(data.operator)) {
        errors.push(`Condition node '${node.id}' requires a valid 'operator' (${allowedOps.join(', ')}).`);
      }
      if (typeof data.threshold !== 'number' && isNaN(parseFloat(data.threshold))) {
        errors.push(`Condition node '${node.id}' requires a numeric 'threshold'.`);
      }
    } else if (canonicalType === 'action') {
      if (!data.actionType && !data.target) {
        warnings.push(`Action node '${node.id}' should define 'actionType' or 'target'.`);
      }
    }

    nodeMap.set(node.id, { ...node, canonicalType });
  });

  // 2. Validate edges
  const inDegree = new Map();
  const outDegree = new Map();
  const adjacencyList = new Map();

  nodes.forEach(n => {
    inDegree.set(n.id, 0);
    outDegree.set(n.id, 0);
    adjacencyList.set(n.id, []);
  });

  edges.forEach((edge, idx) => {
    if (!edge.source || !edge.target) {
      errors.push(`Edge at index ${idx} must specify both 'source' and 'target'.`);
      return;
    }

    if (!nodeMap.has(edge.source)) {
      errors.push(`Edge references non-existent source node: '${edge.source}'.`);
      return;
    }

    if (!nodeMap.has(edge.target)) {
      errors.push(`Edge references non-existent target node: '${edge.target}'.`);
      return;
    }

    if (edge.source === edge.target) {
      errors.push(`Self-referencing cycle detected on node '${edge.source}'. Workflows must be a DAG.`);
      return;
    }

    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    outDegree.set(edge.source, (outDegree.get(edge.source) || 0) + 1);
    adjacencyList.get(edge.source).push(edge.target);
  });

  // 3. Connectivity & Roles Check
  const sensorNodes = nodes.filter(n => normalizeNodeType(n.type) === 'sensor');
  const actionNodes = nodes.filter(n => normalizeNodeType(n.type) === 'action');

  if (sensorNodes.length === 0) {
    errors.push('Graph must contain at least one Data Source (sensor) node to ingest data.');
  }

  if (actionNodes.length === 0) {
    warnings.push('Graph has no Action Trigger nodes. Stream will process without firing external alerts.');
  }

  // Check disconnected or dead-end nodes
  nodes.forEach(n => {
    const canonical = normalizeNodeType(n.type);
    const inCount = inDegree.get(n.id) || 0;
    const outCount = outDegree.get(n.id) || 0;

    if (canonical === 'sensor') {
      if (outCount === 0 && edges.length > 0) {
        warnings.push(`Sensor node '${n.id}' has no outgoing connections.`);
      }
    } else if (canonical === 'action') {
      if (inCount === 0 && edges.length > 0) {
        warnings.push(`Action node '${n.id}' has no incoming connections.`);
      }
    } else {
      if (inCount === 0 && edges.length > 0) {
        warnings.push(`Intermediate node '${n.id}' has no inputs.`);
      }
      if (outCount === 0 && edges.length > 0) {
        warnings.push(`Intermediate node '${n.id}' has no outputs.`);
      }
    }
  });

  // 4. Cycle Detection & Topological Sort (Kahn's Algorithm)
  const executionOrder = [];
  const inDegreeCopy = new Map(inDegree);
  const queue = [];

  nodes.forEach(n => {
    if (inDegreeCopy.get(n.id) === 0) {
      queue.push(n.id);
    }
  });

  while (queue.length > 0) {
    const currentId = queue.shift();
    executionOrder.push(currentId);

    const neighbors = adjacencyList.get(currentId) || [];
    neighbors.forEach(neighborId => {
      inDegreeCopy.set(neighborId, inDegreeCopy.get(neighborId) - 1);
      if (inDegreeCopy.get(neighborId) === 0) {
        queue.push(neighborId);
      }
    });
  }

  if (executionOrder.length !== nodes.length) {
    errors.push('Cycle detected in workflow graph! Workflows must be a Directed Acyclic Graph (DAG) without circular loops.');
  }

  const valid = errors.length === 0;
  return {
    valid,
    errors,
    warnings,
    executionOrder: valid ? executionOrder : [],
    nodeCount: nodes.length,
    edgeCount: edges.length
  };
}

/**
 * Evaluates a numeric condition against an operator and threshold
 */
function evaluateCondition(value, operator, threshold) {
  const numVal = parseFloat(value);
  const numThresh = parseFloat(threshold);
  if (isNaN(numVal) || isNaN(numThresh)) return false;

  switch (operator) {
    case '>': return numVal > numThresh;
    case '>=': return numVal >= numThresh;
    case '<': return numVal < numThresh;
    case '<=': return numVal <= numThresh;
    case '==':
    case '===': return numVal === numThresh;
    case '!=':
    case '!==': return numVal !== numThresh;
    default: return false;
  }
}

/**
 * Applies a mathematical operation to a numeric value
 */
function applyMath(value, operation, operand) {
  const v = parseFloat(value);
  const op = parseFloat(operand);
  if (isNaN(v) || isNaN(op)) return v;

  switch (String(operation).toLowerCase()) {
    case 'multiply':
    case 'scale':
      return Math.round(v * op * 100) / 100;
    case 'add':
      return Math.round((v + op) * 100) / 100;
    case 'subtract':
      return Math.round((v - op) * 100) / 100;
    case 'divide':
      return op !== 0 ? Math.round((v / op) * 100) / 100 : v;
    default:
      return v;
  }
}

/**
 * Compiles a visual graph JSON representation into an executable RxJS pipeline.
 *
 * @param {Object} graph - { nodes: [...], edges: [...] }
 * @param {Object} options - { workflowId, workflowName, inputStream$, onAlert, onStep }
 * @returns {Object} Compiled pipeline object
 */
function compileGraph(graph, options = {}) {
  const validation = validateGraph(graph);
  if (!validation.valid) {
    throw new Error(`Graph compilation failed with validation errors:\n- ${validation.errors.join('\n- ')}`);
  }

  const { nodes, edges } = graph;
  const nodeMap = new Map();
  nodes.forEach(n => nodeMap.set(n.id, { ...n, canonicalType: normalizeNodeType(n.type) }));

  const inputStream$ = options.inputStream$ || new Subject();
  const workflowId = options.workflowId || null;
  const workflowName = options.workflowName || 'Workflow';

  // Map each node to its incoming RxJS Observable stream
  const nodeStreams = new Map();
  const triggeredAlerts = [];

  // Wire pipelines along the topological order
  validation.executionOrder.forEach(nodeId => {
    const node = nodeMap.get(nodeId);
    const incomingEdges = edges.filter(e => e.target === nodeId);

    let stream$;

    if (node.canonicalType === 'sensor') {
      // Sensor node filters the raw input stream
      const targetDevice = node.data.deviceId;
      const targetMetric = node.data.metric || 'temperature';

      stream$ = inputStream$.pipe(
        filter(reading => {
          const readingDevice = reading.deviceId || (reading.metadata && reading.metadata.deviceId);
          return !targetDevice || targetDevice === '*' || readingDevice === targetDevice;
        }),
        map(reading => {
          const rawValue = reading[targetMetric] !== undefined ? reading[targetMetric] : (reading.metrics && reading.metrics[targetMetric]);
          const numValue = rawValue !== undefined ? parseFloat(rawValue) : 0;
          return {
            nodeId: node.id,
            deviceId: reading.deviceId || (reading.metadata && reading.metadata.deviceId),
            metric: targetMetric,
            value: numValue,
            timestamp: reading.timestamp || new Date().toISOString(),
            trace: [`Sensor(${targetDevice}): ${numValue}`]
          };
        })
      );
    } else {
      // Intermediate or Action node: inherits stream from source node(s)
      if (incomingEdges.length === 0) {
        // Disconnected node, ignore
        return;
      }

      // Pick source stream (for linear/tree pipeline)
      const primarySource = incomingEdges[0].source;
      const sourceStream$ = nodeStreams.get(primarySource);
      if (!sourceStream$) return;

      if (node.canonicalType === 'filter') {
        const windowSize = Math.max(parseInt(node.data.windowSize, 10) || 5, 1);
        stream$ = sourceStream$.pipe(
          scan((acc, item) => {
            const history = [...acc.history.slice(-(windowSize - 1)), item.value];
            const sum = history.reduce((a, b) => a + b, 0);
            const avg = Math.round((sum / history.length) * 100) / 100;
            return {
              history,
              latestItem: item,
              avg
            };
          }, { history: [], latestItem: null, avg: 0 }),
          filter(acc => acc.latestItem !== null),
          map(acc => {
            const item = acc.latestItem;
            return {
              ...item,
              nodeId: node.id,
              value: acc.avg,
              windowSamples: acc.history.length,
              trace: [...item.trace, `Filter(MovingAvg ${acc.history.length}/${windowSize}): ${acc.avg}`]
            };
          })
        );
      } else if (node.canonicalType === 'math') {
        const op = node.data.operation || 'multiply';
        const operand = parseFloat(node.data.operand) || 1;
        stream$ = sourceStream$.pipe(
          map(item => {
            const calculated = applyMath(item.value, op, operand);
            return {
              ...item,
              nodeId: node.id,
              value: calculated,
              trace: [...item.trace, `Math(${op} ${operand}): ${calculated}`]
            };
          })
        );
      } else if (node.canonicalType === 'condition') {
        const operator = node.data.operator || '>';
        const threshold = parseFloat(node.data.threshold) || 80;
        stream$ = sourceStream$.pipe(
          filter(item => evaluateCondition(item.value, operator, threshold)),
          map(item => ({
            ...item,
            nodeId: node.id,
            operator,
            threshold,
            conditionMet: true,
            trace: [...item.trace, `Condition(${operator} ${threshold}): TRUE`]
          }))
        );
      } else if (node.canonicalType === 'action') {
        stream$ = sourceStream$.pipe(
          tap(item => {
            const alertCtx = {
              workflowId,
              workflowName,
              deviceId: item.deviceId,
              metric: item.metric,
              value: item.value,
              operator: item.operator || 'exceeded',
              threshold: item.threshold,
              timestamp: item.timestamp,
              trace: [...item.trace, `Action(${node.data.actionType || 'SMS Alert'} dispatched)`]
            };

            triggeredAlerts.push(alertCtx);
            alertService.dispatch(node.data, alertCtx);

            if (typeof options.onAlert === 'function') {
              options.onAlert(alertCtx);
            }
          })
        );
      }
    }

    if (stream$) {
      if (typeof options.onStep === 'function') {
        stream$ = stream$.pipe(tap(val => options.onStep(node.id, val)));
      }
      nodeStreams.set(node.id, stream$);
    }
  });

  // Subscribe to all terminal sinks (Action nodes or leaf nodes)
  const subscriptions = [];
  const leafNodes = nodes.filter(n => {
    const outgoing = edges.filter(e => e.source === n.id);
    return outgoing.length === 0;
  });

  leafNodes.forEach(leaf => {
    const s$ = nodeStreams.get(leaf.id);
    if (s$) {
      subscriptions.push(s$.subscribe());
    }
  });

  return {
    validation,
    executionOrder: validation.executionOrder,
    nodeCount: nodes.length,
    edgeCount: edges.length,
    execute: (reading) => inputStream$.next(reading),
    getTriggeredAlerts: () => [...triggeredAlerts],
    /**
     * Executes an array of test readings synchronously/asynchronously and returns the results
     */
    testRun: async (readings) => {
      const results = [];
      const testAlerts = [];

      // Create a temporary isolated pipeline for testing
      const testInput$ = new Subject();
      const testCompiled = compileGraph(graph, {
        workflowName: `Test: ${workflowName}`,
        inputStream$: testInput$,
        onAlert: (alert) => testAlerts.push(alert),
        onStep: (nodeId, item) => results.push({ nodeId, item })
      });

      for (const reading of readings) {
        testInput$.next(reading);
      }

      testCompiled.destroy();
      return {
        processedCount: readings.length,
        stepTraces: results,
        alertsEmitted: testAlerts
      };
    },
    destroy: () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    }
  };
}

module.exports = {
  SUPPORTED_NODE_TYPES,
  validateGraph,
  compileGraph,
  evaluateCondition,
  applyMath
};
