const { Subject } = require('rxjs');
const { compileGraph } = require('./streamCompiler');
const Workflow = require('../models/Workflow');

class RuleEngine {
  constructor() {
    this.telemetry$ = new Subject();
    this.activePipelines = new Map(); // workflowId -> { pipeline, workflow }
    this.stats = {
      processedReadings: 0,
      dispatchedAlerts: 0
    };
  }

  /**
   * Initializes the rule engine by compiling and deploying all active workflows from MongoDB
   */
  async initialize() {
    try {
      const activeWorkflows = await Workflow.find({ isActive: true }).lean();
      console.log(`[RuleEngine] Loading ${activeWorkflows.length} active workflows from database...`);

      for (const wf of activeWorkflows) {
        this.deployWorkflow(wf);
      }
      console.log(`[RuleEngine] Successfully loaded ${this.activePipelines.size} active pipelines.`);
    } catch (err) {
      console.error('[RuleEngine] Initialization error:', err.message);
    }
  }

  /**
   * Compiles and deploys a workflow into active memory
   */
  deployWorkflow(workflow) {
    const id = String(workflow._id || workflow.id);

    // Undeploy existing instance if already present
    if (this.activePipelines.has(id)) {
      this.undeployWorkflow(id);
    }

    try {
      const compiled = compileGraph(
        { nodes: workflow.nodes, edges: workflow.edges },
        {
          workflowId: id,
          workflowName: workflow.name,
          inputStream$: this.telemetry$,
          onAlert: () => {
            this.stats.dispatchedAlerts++;
          }
        }
      );

      this.activePipelines.set(id, {
        workflow,
        compiled,
        deployedAt: new Date()
      });

      console.log(`[RuleEngine] ✅ Deployed workflow '${workflow.name}' (${id}) with ${compiled.nodeCount} nodes.`);
      return { success: true, message: `Workflow '${workflow.name}' deployed successfully.` };
    } catch (err) {
      console.error(`[RuleEngine] ❌ Failed to deploy workflow '${workflow.name}':`, err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Undeploys and unsubscribes a workflow
   */
  undeployWorkflow(workflowId) {
    const entry = this.activePipelines.get(String(workflowId));
    if (entry) {
      entry.compiled.destroy();
      this.activePipelines.delete(String(workflowId));
      console.log(`[RuleEngine] ⏸ Undeployed workflow '${entry.workflow.name}' (${workflowId}).`);
      return true;
    }
    return false;
  }

  /**
   * Dispatches incoming telemetry reading into the RxJS reactive stream
   */
  processReading(reading) {
    this.stats.processedReadings++;
    this.telemetry$.next(reading);
  }

  /**
   * Get active rule engine status
   */
  getStatus() {
    const active = [];
    this.activePipelines.forEach((val, id) => {
      active.push({
        id,
        name: val.workflow.name,
        nodeCount: val.compiled.nodeCount,
        edgeCount: val.compiled.edgeCount,
        executionOrder: val.compiled.executionOrder,
        deployedAt: val.deployedAt
      });
    });

    return {
      activeWorkflowsCount: this.activePipelines.size,
      activeWorkflows: active,
      stats: this.stats
    };
  }
}

const ruleEngine = new RuleEngine();
module.exports = ruleEngine;
