const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nexusflow';
    const conn = await mongoose.connect(mongoUri);

    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}/${conn.connection.name}`);

    // Ensure native MongoDB Time-Series collection exists
    await initTimeSeriesCollection(conn.connection.db);

    return conn;
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    process.exit(1);
  }
};

/**
 * Checks if the 'telemetries' collection is a native MongoDB Time-Series collection,
 * or creates it with time-series options if it does not yet exist.
 */
async function initTimeSeriesCollection(db) {
  try {
    const collections = await db.listCollections({ name: 'telemetries' }).toArray();

    if (collections.length === 0) {
      console.log("[MongoDB] Creating time-series collection 'telemetries'...");
      await db.createCollection('telemetries', {
        timeseries: {
          timeField: 'timestamp',
          metaField: 'metadata',
          granularity: 'seconds'
        }
      });
      console.log("[MongoDB] Time-series collection 'telemetries' created successfully.");
    } else {
      const colInfo = collections[0];
      const isTimeSeries = !!(colInfo.options && colInfo.options.timeseries);
      console.log(`[MongoDB] 'telemetries' collection exists (Type: ${isTimeSeries ? 'Time-Series' : 'Standard'}).`);
    }
  } catch (err) {
    // If the collection already exists or other non-fatal error, log and continue
    console.warn('[MongoDB] Note on time-series initialization:', err.message);
  }
}

module.exports = { connectDB, initTimeSeriesCollection };
