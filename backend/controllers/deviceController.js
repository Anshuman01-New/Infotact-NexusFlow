const Device = require('../models/Device');

/**
 * Get all registered devices
 * GET /api/devices
 */
exports.getDevices = async (req, res) => {
  try {
    const devices = await Device.find().sort({ updatedAt: -1 }).lean();
    return res.json({
      success: true,
      count: devices.length,
      data: devices
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Register or update device
 * POST /api/devices
 */
exports.registerDevice = async (req, res) => {
  try {
    const { deviceId, name, type, location, status } = req.body;
    if (!deviceId || !name) {
      return res.status(400).json({
        success: false,
        error: 'deviceId and name are required'
      });
    }

    const device = await Device.findOneAndUpdate(
      { deviceId },
      {
        deviceId,
        name,
        type: type || 'Turbine Sensor',
        location: location || 'Factory Floor',
        status: status || 'online'
      },
      { upsert: true, returnDocument: 'after', runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Device registered / updated successfully',
      data: device
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get single device by deviceId
 * GET /api/devices/:deviceId
 */
exports.getDeviceById = async (req, res) => {
  try {
    const device = await Device.findOne({ deviceId: req.params.deviceId }).lean();
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }
    return res.json({
      success: true,
      data: device
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
