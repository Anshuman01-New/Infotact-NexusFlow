const Telemetry = require('../models/Telemetry');
const Device = require('../models/Device');

/**
 * Normalizes incoming payload into the schema expected by MongoDB Time-Series
 */
function normalizeTelemetryPayload(body) {
  const deviceId = body.deviceId || (body.metadata && body.metadata.deviceId);
  if (!deviceId) {
    throw new Error('Missing deviceId in telemetry reading');
  }

  const timestamp = body.timestamp ? new Date(body.timestamp) : new Date();

  const metadata = {
    deviceId: String(deviceId).trim(),
    deviceType: (body.metadata && body.metadata.deviceType) || body.deviceType || 'sensor',
    location: (body.metadata && body.metadata.location) || body.location || 'Factory Floor'
  };

  const doc = {
    timestamp,
    metadata
  };

  if (typeof body.temperature === 'number') doc.temperature = body.temperature;
  if (typeof body.pressure === 'number') doc.pressure = body.pressure;
  if (typeof body.vibration === 'number') doc.vibration = body.vibration;
  if (typeof body.humidity === 'number') doc.humidity = body.humidity;

  // Include any extra arbitrary custom metrics
  if (body.metrics && typeof body.metrics === 'object') {
    doc.metrics = body.metrics;
  }

  return doc;
}

/**
 * Ingest a single telemetry reading
 * POST /api/telemetry
 */
exports.ingestTelemetry = async (req, res) => {
  try {
    const rawData = req.body;
    const telemetryData = normalizeTelemetryPayload(rawData);

    const telemetry = new Telemetry(telemetryData);
    const saved = await telemetry.save();

    // Async update Device registry with last reading
    Device.findOneAndUpdate(
      { deviceId: telemetryData.metadata.deviceId },
      {
        $set: {
          name: rawData.name || `Device ${telemetryData.metadata.deviceId}`,
          type: telemetryData.metadata.deviceType,
          location: telemetryData.metadata.location,
          status: 'online',
          lastSeen: telemetryData.timestamp,
          lastReading: {
            temperature: telemetryData.temperature,
            pressure: telemetryData.pressure,
            vibration: telemetryData.vibration,
            humidity: telemetryData.humidity
          }
        }
      },
      { upsert: true, returnDocument: 'after' }
    ).catch(err => console.error('[Device Update Error]', err.message));

    return res.status(201).json({
      success: true,
      message: 'Telemetry reading ingested successfully',
      data: saved
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Ingest telemetry in batch (bulk writes)
 * POST /api/telemetry/batch
 */
exports.batchIngestTelemetry = async (req, res) => {
  try {
    const items = Array.isArray(req.body) ? req.body : req.body.readings;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Request body must be an array of telemetry readings or contain a readings array'
      });
    }

    const docs = items.map(normalizeTelemetryPayload);
    const result = await Telemetry.insertMany(docs, { ordered: false });

    return res.status(201).json({
      success: true,
      message: `Successfully ingested ${result.length} telemetry readings`,
      insertedCount: result.length
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Query historical telemetry
 * GET /api/telemetry
 */
exports.getTelemetry = async (req, res) => {
  try {
    const { deviceId, startDate, endDate, limit = 100, sort = 'desc' } = req.query;

    const filter = {};

    if (deviceId) {
      filter['metadata.deviceId'] = deviceId;
    }

    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    const sortOrder = sort === 'asc' ? 1 : -1;
    const maxLimit = Math.min(parseInt(limit, 10) || 100, 1000);

    const readings = await Telemetry.find(filter)
      .sort({ timestamp: sortOrder })
      .limit(maxLimit)
      .lean();

    return res.json({
      success: true,
      count: readings.length,
      data: readings
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get latest telemetry reading per device or for a single device
 * GET /api/telemetry/latest
 */
exports.getLatestTelemetry = async (req, res) => {
  try {
    const { deviceId } = req.query;

    if (deviceId) {
      const reading = await Telemetry.findOne({ 'metadata.deviceId': deviceId })
        .sort({ timestamp: -1 })
        .lean();

      if (!reading) {
        return res.status(404).json({
          success: false,
          error: `No telemetry found for device ${deviceId}`
        });
      }

      return res.json({
        success: true,
        data: reading
      });
    }

    // Aggregate latest reading per device
    const latestReadings = await Telemetry.aggregate([
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: '$metadata.deviceId',
          latestReading: { $first: '$$ROOT' }
        }
      },
      { $replaceRoot: { newRoot: '$latestReading' } }
    ]);

    return res.json({
      success: true,
      count: latestReadings.length,
      data: latestReadings
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get telemetry collection stats
 * GET /api/telemetry/stats
 */
exports.getTelemetryStats = async (req, res) => {
  try {
    const totalCount = await Telemetry.countDocuments();
    const distinctDevices = await Telemetry.distinct('metadata.deviceId');

    const oldest = await Telemetry.findOne().sort({ timestamp: 1 }).select('timestamp').lean();
    const newest = await Telemetry.findOne().sort({ timestamp: -1 }).select('timestamp').lean();

    return res.json({
      success: true,
      stats: {
        totalReadings: totalCount,
        activeDevicesCount: distinctDevices.length,
        devices: distinctDevices,
        firstRecordedAt: oldest ? oldest.timestamp : null,
        lastRecordedAt: newest ? newest.timestamp : null,
        storageEngine: 'MongoDB Time-Series Collection'
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
