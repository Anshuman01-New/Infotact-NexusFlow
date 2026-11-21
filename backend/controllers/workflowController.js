const Workflow = require('../models/Workflow');
const { validateGraph, compileGraph } = require('../services/streamCompiler');
const ruleEngine = require('../services/ruleEngine');

/**
 * Validates a workflow graph JSON structure without persisting
 * POST /api/workflows/validate
 */
exports.validateWorkflow = async (req, res) => {
  try {
    const graph = req.body.graph || req.body;
    const result = validateGraph(graph);

    return res.json({
      success: true,
      valid: result.valid,
      errors: result.errors,
      warnings: result.warnings,
      executionOrder: result.executionOrder,
      nodeCount: result.nodeCount,
      edgeCount: result.edgeCount
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Compiles and test-runs a workflow against mock sensor readings
 * POST /api/workflows/compile-test
 */
exports.testCompileWorkflow = async (req, res) => {
  try {
    const { graph, mockReadings } = req.body;
    if (!graph) {
      return res.status(400).json({ success: false, error: 'Workflow graph object is required.' });
    }

    const testData = Array.isArray(mockReadings) && mockReadings.length > 0
      ? mockReadings
      : [
          { deviceId: 'TURBINE_001', temperature: 72.0, pressure: 98.0, vibration: 1.8, timestamp: new Date().toISOString() },
          { deviceId: 'TURBINE_001', temperature: 78.5, pressure: 104.0, vibration: 2.3, timestamp: new Date().toISOString() },
          { deviceId: 'TURBINE_001', temperature: 84.0, pressure: 112.0, vibration: 3.1, timestamp: new Date().toISOString() },
          { deviceId: 'TURBINE_001', temperature: 91.5, pressure: 125.0, vibration: 4.5, timestamp: new Date().toISOString() }
        ];

    const validation = validateGraph(graph);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        valid: false,
        errors: validation.errors
      });
    }

    const compiled = compileGraph(graph, { workflowName: 'Interactive Simulation' });
    const runResult = await compiled.testRun(testData);

    return res.json({
      success: true,
      valid: true,
      executionOrder: validation.executionOrder,
      summary: {
        readingsEvaluated: runResult.processedCount,
        alertsEmittedCount: runResult.alertsEmitted.length
      },
      alertsEmitted: runResult.alertsEmitted,
      stepTraces: runResult.stepTraces
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get all workflows
 * GET /api/workflows
 */
exports.getWorkflows = async (req, res) => {
  try {
    const workflows = await Workflow.find().sort({ updatedAt: -1 }).lean();
    return res.json({
      success: true,
      count: workflows.length,
      data: workflows
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Create and save a new workflow
 * POST /api/workflows
 */
exports.createWorkflow = async (req, res) => {
  try {
    const { name, description, nodes, edges, viewport, isActive = true } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Workflow name is required.' });
    }

    // Validate graph structure before saving
    const validation = validateGraph({ nodes, edges });
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Graph validation failed',
        errors: validation.errors
      });
    }

    const workflow = new Workflow({
      name,
      description: description || '',
      isActive,
      nodes: nodes || [],
      edges: edges || [],
      viewport: viewport || {}
    });

    const saved = await workflow.save();

    // Deploy to rule engine if active
    if (saved.isActive) {
      ruleEngine.deployWorkflow(saved);
    }

    return res.status(201).json({
      success: true,
      message: 'Workflow created and validated successfully.',
      data: saved
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get workflow by ID
 * GET /api/workflows/:id
 */
exports.getWorkflowById = async (req, res) => {
  try {
    const workflow = await Workflow.findById(req.params.id).lean();
    if (!workflow) {
      return res.status(404).json({ success: false, error: 'Workflow not found.' });
    }
    return res.json({ success: true, data: workflow });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Update an existing workflow
 * PUT /api/workflows/:id
 */
exports.updateWorkflow = async (req, res) => {
  try {
    const { name, description, nodes, edges, viewport, isActive } = req.body;

    if (nodes && edges) {
      const validation = validateGraph({ nodes, edges });
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: 'Graph validation failed',
          errors: validation.errors
        });
      }
    }

    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (description !== undefined) updateFields.description = description;
    if (nodes !== undefined) updateFields.nodes = nodes;
    if (edges !== undefined) updateFields.edges = edges;
    if (viewport !== undefined) updateFields.viewport = viewport;
    if (isActive !== undefined) updateFields.isActive = isActive;

    const updated = await Workflow.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Workflow not found.' });
    }

    // Update in rule engine
    if (updated.isActive) {
      ruleEngine.deployWorkflow(updated);
    } else {
      ruleEngine.undeployWorkflow(updated._id);
    }

    return res.json({
      success: true,
      message: 'Workflow updated successfully.',
      data: updated
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Delete workflow
 * DELETE /api/workflows/:id
 */
exports.deleteWorkflow = async (req, res) => {
  try {
    const deleted = await Workflow.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Workflow not found.' });
    }

    ruleEngine.undeployWorkflow(deleted._id);

    return res.json({
      success: true,
      message: 'Workflow deleted and undeployed successfully.'
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Toggle active state of a workflow
 * PATCH /api/workflows/:id/toggle
 */
exports.toggleWorkflow = async (req, res) => {
  try {
    const workflow = await Workflow.findById(req.params.id);
    if (!workflow) {
      return res.status(404).json({ success: false, error: 'Workflow not found.' });
    }

    workflow.isActive = !workflow.isActive;
    await workflow.save();

    if (workflow.isActive) {
      ruleEngine.deployWorkflow(workflow);
    } else {
      ruleEngine.undeployWorkflow(workflow._id);
    }

    return res.json({
      success: true,
      message: `Workflow is now ${workflow.isActive ? 'active' : 'inactive'}.`,
      isActive: workflow.isActive
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get active rule engine deployment status
 * GET /api/workflows/engine/status
 */
exports.getEngineStatus = async (req, res) => {
  try {
    const status = ruleEngine.getStatus();
    return res.json({ success: true, data: status });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
