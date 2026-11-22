/**
 * NexusFlow Week 2 - Logic Engine & Stream Compiler Verification Suite
 * Tests Graph Validation, Topological Sorting, Cycle Detection,
 * RxJS Pipeline Compilation, Math Operations, Moving Average Filters, and Alert Triggers.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../config/database');
const { validateGraph, compileGraph } = require('../services/streamCompiler');
const ruleEngine = require('../services/ruleEngine');
const Workflow = require('../models/Workflow');
const Alert = require('../models/Alert');

async function runCompilerTests() {
  console.log('\n=============================================================');
  console.log('   NEXUSFLOW WEEK 2: LOGIC ENGINE & COMPILER VERIFICATION    ');
  console.log('=============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  ✅ PASS: ${testName} ${details ? '(' + details + ')' : ''}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${details ? '(' + details + ')' : ''}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // TEST 1: Graph Validation - Valid Linear Pipeline
    // -------------------------------------------------------------
    console.log('[Test 1] Validating a valid linear graph (Sensor -> Filter -> Condition -> Action)...');
    const validGraph = {
      nodes: [
        { id: 'n1', type: 'sensor', data: { deviceId: 'TURBINE_001', metric: 'temperature' } },
        { id: 'n2', type: 'filter', data: { filterType: 'Moving Average', windowSize: 3 } },
        { id: 'n3', type: 'condition', data: { operator: '>', threshold: 80 } },
        { id: 'n4', type: 'action', data: { actionType: 'SMS Alert', target: '+15551234567' } }
      ],
      edges: [
        { id: 'e1', source: 'n1', target: 'n2' },
        { id: 'e2', source: 'n2', target: 'n3' },
        { id: 'e3', source: 'n3', target: 'n4' }
      ]
    };

    const res1 = validateGraph(validGraph);
    assert(res1.valid === true, 'Valid graph passes validation', `errors: ${res1.errors.length}`);
    assert(res1.executionOrder.join('->') === 'n1->n2->n3->n4', 'Topological sort order is strictly n1->n2->n3->n4', res1.executionOrder.join('->'));

    // -------------------------------------------------------------
    // TEST 2: Cycle Detection (DAG validation)
    // -------------------------------------------------------------
    console.log('\n[Test 2] Testing Cycle Detection (A -> B -> C -> A)...');
    const cyclicGraph = {
      nodes: [
        { id: 'a', type: 'sensor', data: { deviceId: 'TURBINE_001', metric: 'temperature' } },
        { id: 'b', type: 'condition', data: { operator: '>', threshold: 80 } },
        { id: 'c', type: 'action', data: { actionType: 'SMS Alert' } }
      ],
      edges: [
        { id: 'e1', source: 'a', target: 'b' },
        { id: 'e2', source: 'b', target: 'c' },
        { id: 'e3', source: 'c', target: 'a' } // Circular back-edge!
      ]
    };

    const res2 = validateGraph(cyclicGraph);
    assert(res2.valid === false, 'Cyclic graph is correctly flagged as invalid');
    assert(res2.errors.some(e => e.includes('Cycle detected')), 'Cycle error message produced');

    // -------------------------------------------------------------
    // TEST 3: Validation of Node Configuration & Disconnected Graph
    // -------------------------------------------------------------
    console.log('\n[Test 3] Testing Missing Node Fields & Self-loops...');
    const invalidConfigGraph = {
      nodes: [
        { id: 's1', type: 'sensor', data: {} }, // Missing deviceId
        { id: 'c1', type: 'condition', data: { operator: 'INVALID' } }, // Invalid operator & missing threshold
        { id: 'm1', type: 'unknown_type', data: {} } // Unsupported type
      ],
      edges: [
        { id: 'self', source: 's1', target: 's1' } // Self-loop
      ]
    };

    const res3 = validateGraph(invalidConfigGraph);
    assert(res3.valid === false, 'Invalid node configurations correctly fail');
    assert(res3.errors.length >= 4, 'Multiple informative error messages returned', `Found ${res3.errors.length} errors`);

    // -------------------------------------------------------------
    // TEST 4: RxJS Compilation & Execution (Sensor -> Moving Average -> Condition -> Alert)
    // -------------------------------------------------------------
    console.log('\n[Test 4] Compiling and executing RxJS Stream Pipeline with Moving Average filter...');
    const alertsReceived = [];
    const stepLogs = [];

    const compiledPipeline = compileGraph(validGraph, {
      workflowName: 'Test Turbine High Temp',
      onAlert: (alert) => alertsReceived.push(alert),
      onStep: (nodeId, item) => stepLogs.push({ nodeId, val: item.value })
    });

    assert(typeof compiledPipeline.execute === 'function', 'Compiler returns executable pipeline');

    // Send sequence of simulated readings:
    // Window = 3 readings
    // 1. Temp: 70 -> Avg: 70 -> Cond (>80) = false
    compiledPipeline.execute({ deviceId: 'TURBINE_001', temperature: 70.0 });
    // 2. Temp: 74 -> Avg: (70+74)/2 = 72 -> Cond (>80) = false
    compiledPipeline.execute({ deviceId: 'TURBINE_001', temperature: 74.0 });
    // 3. Temp: 96 -> Avg: (70+74+96)/3 = 80.0 -> Cond (>80) = false (not strictly >)
    compiledPipeline.execute({ deviceId: 'TURBINE_001', temperature: 96.0 });
    // 4. Temp: 92 -> Avg: (74+96+92)/3 = 87.33 -> Cond (>80) = TRUE -> Dispatches Alert!
    compiledPipeline.execute({ deviceId: 'TURBINE_001', temperature: 92.0 });

    assert(alertsReceived.length === 1, 'Exactly 1 alert was triggered by moving average threshold', `Alerts: ${alertsReceived.length}`);
    if (alertsReceived.length > 0) {
      assert(alertsReceived[0].value === 87.33, 'Calculated moving average value is accurate', `Value: ${alertsReceived[0].value}°C`);
      assert(alertsReceived[0].deviceId === 'TURBINE_001', 'Alert has correct device ID');
    }

    compiledPipeline.destroy();

    // -------------------------------------------------------------
    // TEST 5: Math Operation Node Compilation (Multiply & Condition)
    // -------------------------------------------------------------
    console.log('\n[Test 5] Testing Math Operation Node (Scale / Multiply)...');
    const mathGraph = {
      nodes: [
        { id: 'src', type: 'sensor', data: { deviceId: 'MOTOR_102', metric: 'vibration' } },
        { id: 'mathNode', type: 'math', data: { operation: 'multiply', operand: 1.5 } },
        { id: 'condNode', type: 'condition', data: { operator: '>=', threshold: 10 } },
        { id: 'actNode', type: 'action', data: { actionType: 'Webhook Alert', target: 'http://test.internal' } }
      ],
      edges: [
        { id: 'e1', source: 'src', target: 'mathNode' },
        { id: 'e2', source: 'mathNode', target: 'condNode' },
        { id: 'e3', source: 'condNode', target: 'actNode' }
      ]
    };

    const mathAlerts = [];
    const mathPipeline = compileGraph(mathGraph, {
      workflowName: 'Test Motor Vibration Scaling',
      onAlert: (a) => mathAlerts.push(a)
    });

    // 1. Vibration: 4.0 -> Math: 4.0 * 1.5 = 6.0 (< 10) -> No alert
    mathPipeline.execute({ deviceId: 'MOTOR_102', vibration: 4.0 });
    // 2. Vibration: 8.0 -> Math: 8.0 * 1.5 = 12.0 (>= 10) -> Alert!
    mathPipeline.execute({ deviceId: 'MOTOR_102', vibration: 8.0 });

    assert(mathAlerts.length === 1, 'Math pipeline correctly scaled value and fired alert', `Alerts: ${mathAlerts.length}`);
    if (mathAlerts.length > 0) {
      assert(mathAlerts[0].value === 12.0, 'Scaled value is exactly 12.0', `Value: ${mathAlerts[0].value}`);
    }
    mathPipeline.destroy();

    // -------------------------------------------------------------
    // TEST 6: testRun API helper
    // -------------------------------------------------------------
    console.log('\n[Test 6] Testing testRun helper for isolated interactive simulations...');
    const testSimulation = await compiledPipeline.testRun([
      { deviceId: 'TURBINE_001', temperature: 60.0 },
      { deviceId: 'TURBINE_001', temperature: 89.0 },
      { deviceId: 'TURBINE_001', temperature: 95.0 }
    ]);

    assert(testSimulation.processedCount === 3, 'Simulation processed all 3 readings');
    assert(testSimulation.alertsEmitted.length >= 1, 'Simulation captured emitted alert');

    // -------------------------------------------------------------
    // TEST 7: Full Rule Engine Deployment & Database Integration
    // -------------------------------------------------------------
    console.log('\n[Test 7] Connecting to Database and testing Rule Engine deployment...');
    await connectDB();

    // Clear prior test workflow
    await Workflow.deleteMany({ name: 'Week 2 Automated Test Workflow' });

    const savedWf = await Workflow.create({
      name: 'Week 2 Automated Test Workflow',
      description: 'Created by automated test suite',
      isActive: true,
      nodes: validGraph.nodes,
      edges: validGraph.edges
    });

    // Deploy to ruleEngine
    const deployRes = ruleEngine.deployWorkflow(savedWf);
    assert(deployRes.success === true, 'RuleEngine successfully deployed saved workflow');

    // Send reading through the centralized rule engine stream
    const engineAlertsBefore = ruleEngine.stats.dispatchedAlerts;
    ruleEngine.processReading({ deviceId: 'TURBINE_001', temperature: 88.0 });
    ruleEngine.processReading({ deviceId: 'TURBINE_001', temperature: 90.0 });
    ruleEngine.processReading({ deviceId: 'TURBINE_001', temperature: 94.0 });

    assert(ruleEngine.stats.processedReadings >= 3, 'RuleEngine counted processed readings');
    assert(ruleEngine.stats.dispatchedAlerts > engineAlertsBefore, 'RuleEngine fired alert via reactive stream');

    // Undeploy
    ruleEngine.undeployWorkflow(savedWf._id);
    await Workflow.findByIdAndDelete(savedWf._id);

    console.log('\n=============================================================');
    console.log(`   TEST SUMMARY: ${passed} PASSED, ${failed} FAILED                 `);
    console.log('=============================================================\n');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('\n❌ FATAL TEST EXCEPTION:', err);
    process.exit(1);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  }
}

runCompilerTests();
