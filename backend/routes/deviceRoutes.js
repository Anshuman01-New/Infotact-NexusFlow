const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');

// GET /api/devices - List all devices
router.get('/', deviceController.getDevices);

// POST /api/devices - Register or update device
router.post('/', deviceController.registerDevice);

// GET /api/devices/:deviceId - Get specific device
router.get('/:deviceId', deviceController.getDeviceById);

module.exports = router;
