const mongoose = require('mongoose');

const DeviceSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      default: 'Turbine Sensor'
    },
    location: {
      type: String,
      default: 'Factory Floor'
    },
    status: {
      type: String,
      enum: ['online', 'offline', 'standby', 'error'],
      default: 'online'
    },
    // Last reading can be of any type, i.e., String, Number, Array, Object, etc.
    // This is because different devices can have different types of readings.
    lastReading: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    lastSeen: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Device', DeviceSchema);
