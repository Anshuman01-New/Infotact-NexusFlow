const Alert = require('../models/Alert');
const alertService = require('../services/alertService');

/**
 * Get alerts with filtering and pagination
 * GET /api/alerts
 */
exports.getAlerts = async (req, res) => {
  try {
    const { deviceId, workflowId, status, limit = 50 } = req.query;
    const filter = {};

    if (deviceId) filter.deviceId = deviceId;
    if (workflowId) filter.workflowId = workflowId;
    if (status) filter.status = status;

    const maxLimit = Math.min(parseInt(limit, 10) || 50, 200);
    const alerts = await Alert.find(filter)
      .sort({ timestamp: -1 })
      .limit(maxLimit)
      .lean();

    const activeCount = await Alert.countDocuments({ status: 'active' });

    return res.json({
      success: true,
      count: alerts.length,
      activeCount,
      data: alerts
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Acknowledge an alert
 * PATCH /api/alerts/:id/acknowledge
 */
exports.acknowledgeAlert = async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'acknowledged' } },
      { returnDocument: 'after' }
    );

    if (!alert) {
      return res.status(404).json({ success: false, error: 'Alert not found' });
    }

    return res.json({ success: true, message: 'Alert acknowledged', data: alert });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Resolve an alert
 * PATCH /api/alerts/:id/resolve
 */
exports.resolveAlert = async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'resolved' } },
      { returnDocument: 'after' }
    );

    if (!alert) {
      return res.status(404).json({ success: false, error: 'Alert not found' });
    }

    return res.json({ success: true, message: 'Alert marked as resolved', data: alert });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Delete an alert
 * DELETE /api/alerts/:id
 */
exports.deleteAlert = async (req, res) => {
  try {
    const deleted = await Alert.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Alert not found' });
    }
    return res.json({ success: true, message: 'Alert deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Test dispatching a webhook
 * POST /api/alerts/test-webhook
 */
exports.testWebhook = async (req, res) => {
  try {
    const { target, samplePayload } = req.body;
    const testRecord = samplePayload || {
      deviceId: 'TEST_TURBINE_001',
      conditionDescription: 'temperature > 85',
      value: 88.5,
      threshold: 85,
      timestamp: new Date()
    };

    const result = await alertService.dispatchWebhook(target, testRecord, { actionType: 'Webhook Alert' });
    return res.json({ success: true, result });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
