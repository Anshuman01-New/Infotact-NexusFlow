const express = require('express');
const router = express.Router();
const telemetryController = require('../controllers/telemetryController');

// POST /api/telemetry - Ingest single reading
router.post('/', telemetryController.ingestTelemetry);

// POST /api/telemetry/batch - Ingest batch readings
router.post('/batch', telemetryController.batchIngestTelemetry);

// GET /api/telemetry - Query telemetry readings
router.get('/', telemetryController.getTelemetry);

// GET /api/telemetry/latest - Get latest reading(s)
router.get('/latest', telemetryController.getLatestTelemetry);

// GET /api/telemetry/stats - Get time-series collection statistics
router.get('/stats', telemetryController.getTelemetryStats);

module.exports = router;
