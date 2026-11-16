const mongoose = require('mongoose');

const TelemetrySchema = new mongoose.Schema(
  {
    timestamp: {
      type: Date,
      default: Date.now,
      required: true
    },
    metadata: {
      deviceId: {
        type: String,
        required: true,
        index: true
      },
      deviceType: {
        type: String,
        default: 'sensor'
      },
      location: {
        type: String,
        default: 'Factory_Floor'
      }
    },
    temperature: {
      type: Number
    },
    pressure: {
      type: Number
    },
    vibration: {
      type: Number
    },
    humidity: {
      type: Number
    },
    metrics: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  {
    timeseries: {
      timeField: 'timestamp',
      metaField: 'metadata',
      granularity: 'seconds'
    },
    timestamps: false
  }
);

TelemetrySchema.index({ 'metadata.deviceId': 1, timestamp: -1 });

module.exports = mongoose.model('Telemetry', TelemetrySchema);
