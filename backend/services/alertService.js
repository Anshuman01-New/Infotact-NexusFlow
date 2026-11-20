const Alert = require('../models/Alert');

/**
 * Alert Service for dispatched rule engine actions.
 * Logs alerts, records them to the MongoDB Alert collection, and supports mock SMS / webhooks.
 */
class AlertService {
  constructor() {
    this.listeners = [];
  }

  /**
   * Register a listener for real-time alert broadcasts (used by WebSockets in Week 3)
   */
  onAlert(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Dispatch an alert triggered by a workflow action node
   * @param {Object} actionConfig - Configuration from action node (actionType, target, template)
   * @param {Object} alertContext - Trigger context { deviceId, value, threshold, operator, timestamp, workflowId, workflowName }
   */
  async dispatch(actionConfig, alertContext) {
    const actionType = actionConfig.actionType || 'SMS Alert';
    const target = actionConfig.target || 'Operator';
    const conditionDesc = `${alertContext.metric || 'value'} ${alertContext.operator} ${alertContext.threshold}`;

    const alertRecord = {
      workflowId: alertContext.workflowId || null,
      workflowName: alertContext.workflowName || 'Workflow Rule',
      deviceId: alertContext.deviceId || 'UNKNOWN_DEVICE',
      conditionDescription: conditionDesc,
      value: alertContext.value,
      threshold: alertContext.threshold,
      actionTaken: `${actionType} -> ${target}`,
      status: 'active',
      timestamp: alertContext.timestamp ? new Date(alertContext.timestamp) : new Date()
    };

    console.log(`[AlertService] 🚨 ${actionType} triggered for ${alertRecord.deviceId}! Condition: [${conditionDesc}], Current Value: ${alertRecord.value}`);

    // If SMS Alert mock
    if (actionType.toLowerCase().includes('sms')) {
      console.log(`[AlertService] [MOCK SMS] To: ${target} | Msg: ${actionConfig.template || `Alert: ${alertRecord.deviceId} exceeded threshold!`}`);
    } else if (actionType.toLowerCase().includes('webhook')) {
      console.log(`[AlertService] [MOCK WEBHOOK] POST ${target} | Payload:`, JSON.stringify(alertRecord));
    }

    // Persist alert in MongoDB (fail-safe)
    try {
      const savedAlert = await Alert.create(alertRecord);
      alertRecord._id = savedAlert._id;
    } catch (err) {
      console.warn('[AlertService] Failed to save alert to database:', err.message);
    }

    // Notify listeners
    this.listeners.forEach(fn => {
      try {
        fn(alertRecord);
      } catch (err) {
        console.error('[AlertService] Listener error:', err);
      }
    });

    return alertRecord;
  }
}

module.exports = new AlertService();
