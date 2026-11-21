const express = require('express');
const router = express.Router();
const workflowController = require('../controllers/workflowController');

// Graph Validation & Testing
router.post('/validate', workflowController.validateWorkflow);
router.post('/compile-test', workflowController.testCompileWorkflow);

// Engine Status
router.get('/engine/status', workflowController.getEngineStatus);

// CRUD
router.get('/', workflowController.getWorkflows);
router.post('/', workflowController.createWorkflow);
router.get('/:id', workflowController.getWorkflowById);
router.put('/:id', workflowController.updateWorkflow);
router.delete('/:id', workflowController.deleteWorkflow);
router.patch('/:id/toggle', workflowController.toggleWorkflow);

module.exports = router;
