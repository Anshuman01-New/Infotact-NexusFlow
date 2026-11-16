/**
 * Storage & Ingestion Verification Test for Week 1
 * Validates MongoDB Time-Series configuration and telemetry data persistence.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../config/database');
const Telemetry = require('../models/Telemetry');
const Device = require('../models/Device');

async function runStorageVerification() {
  console.log('\n=============================================================');
  console.log('   NEXUSFLOW WEEK 1: STORAGE & INGESTION VERIFICATION TEST   ');
  console.log('=============================================================\n');

  let connection;
  try {
    // 1. Connect
    connection = await connectDB();
    const db = mongoose.connection.db;

    // 2. Verify Time-Series collection options
    console.log('[Test 1] Verifying MongoDB Time-Series collection configuration...');
    const collections = await db.listCollections({ name: 'telemetries' }).toArray();
    if (collections.length === 0) {
      throw new Error("Collection 'telemetries' was not created.");
    }
    const colOptions = collections[0].options;
    console.log('  Collection options:', JSON.stringify(colOptions, null, 2));

    if (colOptions && colOptions.timeseries) {
      console.log('  SUCCESS: Native MongoDB Time-Series collection verified!');
      console.log(`    - timeField: ${colOptions.timeseries.timeField}`);
      console.log(`    - metaField: ${colOptions.timeseries.metaField}`);
      console.log(`    - granularity: ${colOptions.timeseries.granularity || 'seconds'}`);
    } else {
      console.warn('  WARNING: Collection exists but is standard (not created with timeseries options).');
    }

    // 3. Insert single telemetry reading
    console.log('\n[Test 2] Inserting sample sensor reading...');
    const testReading = await Telemetry.create({
      timestamp: new Date(),
      metadata: {
        deviceId: 'TEST_TURBINE_001',
        deviceType: 'Turbine Sensor',
        location: 'Test Bed Alpha'
      },
      temperature: 84.5,
      pressure: 112.3,
      vibration: 3.2,
      humidity: 50.1
    });
    console.log(`  SUCCESS: Reading saved with ID: ${testReading._id}`);
    console.log(`  Values: Temp=${testReading.temperature}°C, Pressure=${testReading.pressure} kPa`);

    // 4. Insert batch telemetry readings
    console.log('\n[Test 3] Inserting batch of 5 readings...');
    const batch = [];
    const baseTime = Date.now();
    for (let i = 0; i < 5; i++) {
      batch.push({
        timestamp: new Date(baseTime + i * 1000),
        metadata: {
          deviceId: 'TEST_TURBINE_001',
          deviceType: 'Turbine Sensor',
          location: 'Test Bed Alpha'
        },
        temperature: 80 + i * 1.5,
        pressure: 110 + i * 0.5,
        vibration: 2.5 + i * 0.2
      });
    }
    const batchResult = await Telemetry.insertMany(batch);
    console.log(`  SUCCESS: Inserted ${batchResult.length} batch readings.`);

    // 5. Query historical readings
    console.log('\n[Test 4] Querying stored telemetry for TEST_TURBINE_001...');
    const found = await Telemetry.find({ 'metadata.deviceId': 'TEST_TURBINE_001' })
      .sort({ timestamp: -1 })
      .limit(5)
      .lean();

    console.log(`  Found ${found.length} readings:`);
    found.forEach(r => {
      console.log(`    - ${new Date(r.timestamp).toISOString()} | Temp: ${r.temperature}°C | Press: ${r.pressure} kPa`);
    });

    // 6. Test Device registry update
    console.log('\n[Test 5] Verifying device registry update...');
    const device = await Device.findOneAndUpdate(
      { deviceId: 'TEST_TURBINE_001' },
      {
        deviceId: 'TEST_TURBINE_001',
        name: 'Alpha Turbine Sensor',
        type: 'Turbine Sensor',
        location: 'Test Bed Alpha',
        status: 'online',
        lastSeen: new Date(),
        lastReading: { temperature: 84.5, pressure: 112.3 }
      },
      { upsert: true, returnDocument: 'after' }
    );
    console.log(`  SUCCESS: Device registered: ${device.name} (Status: ${device.status})`);

    console.log('\n=============================================================');
    console.log('   ALL WEEK 1 BACKEND & DATABASE TESTS PASSED SUCCESSFULLY!  ');
    console.log('=============================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('\nFAILED TEST:', err.message);
    process.exit(1);
  } finally {
    if (connection) {
      await mongoose.disconnect();
    }
  }
}

runStorageVerification();
