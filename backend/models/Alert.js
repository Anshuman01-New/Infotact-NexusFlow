const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema(
  {
    workflowId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workflow'
    },
    workflowName: {
      type: String
    },
    deviceId: {
      type: String,
      required: true
    },
    conditionDescription: {
      type: String,
      required: true
    },
    value: {
      type: Number
    },
    threshold: {
      type: Number
    },
    actionTaken: {
      type: String,
      default: 'LOG'
    },
    status: {
      type: String,
      enum: ['active', 'acknowledged', 'resolved'],
      default: 'active'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Alert', AlertSchema);
