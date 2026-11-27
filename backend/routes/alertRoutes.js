const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');

router.get('/', alertController.getAlerts);
router.patch('/:id/acknowledge', alertController.acknowledgeAlert);
router.patch('/:id/resolve', alertController.resolveAlert);
router.delete('/:id', alertController.deleteAlert);
router.post('/test-webhook', alertController.testWebhook);

module.exports = router;
