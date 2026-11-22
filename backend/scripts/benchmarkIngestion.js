/**
 * NexusFlow Mid-Project Review Benchmark:
 * Measures MongoDB Time-Series collection write throughput (writes/second)
 * and storage footprint to demonstrate high-volume sensor ingestion capability.
 *
 * Usage:
 *   node scripts/benchmarkIngestion.js
 *   node scripts/benchmarkIngestion.js --count 5000 --batchSize 1000
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../config/database');
const Telemetry = require('../models/Telemetry');

const args = process.argv.slice(2);
function getArg(flag, defaultValue) {
  const index = args.indexOf(flag);
  return index !== -1 && args[index + 1] ? args[index + 1] : defaultValue;
}

const TOTAL_WRITES = parseInt(getArg('--count', '5000'), 10);
const BATCH_SIZE = parseInt(getArg('--batchSize', '1000'), 10);

async function runBenchmark() {
  console.log('\n=============================================================');
  console.log('   NEXUSFLOW MID-PROJECT BENCHMARK: TIME-SERIES THROUGHPUT   ');
  console.log('=============================================================\n');
  console.log(` Target Ingestion Count : ${TOTAL_WRITES.toLocaleString()} readings`);
  console.log(` Batch Size             : ${BATCH_SIZE.toLocaleString()} per write`);
  console.log(` Target Storage Engine  : MongoDB Native Time-Series Collection`);
  console.log('-------------------------------------------------------------\n');

  let conn;
  try {
    conn = await connectDB();
    const db = mongoose.connection.db;

    // Get collection stats before benchmark
    let statsBefore = {};
    try {
      const statsCmd = await db.command({ collStats: 'telemetries' });
      statsBefore = {
        count: statsCmd.count || 0,
        sizeBytes: statsCmd.size || 0,
        storageSizeBytes: statsCmd.storageSize || 0
      };
    } catch {
      statsBefore = { count: 0, sizeBytes: 0, storageSizeBytes: 0 };
    }

    console.log(`[Benchmark] Starting write of ${TOTAL_WRITES} readings...`);
    const batches = Math.ceil(TOTAL_WRITES / BATCH_SIZE);
    const devices = ['TURBINE_BENCH_1', 'TURBINE_BENCH_2', 'MOTOR_BENCH_1', 'PUMP_BENCH_1'];

    const startTime = performance.now();

    for (let b = 0; b < batches; b++) {
      const currentBatchCount = Math.min(BATCH_SIZE, TOTAL_WRITES - b * BATCH_SIZE);
      const docs = [];
      const now = Date.now();

      for (let i = 0; i < currentBatchCount; i++) {
        const deviceId = devices[i % devices.length];
        docs.push({
          timestamp: new Date(now + (b * currentBatchCount + i)),
          metadata: {
            deviceId,
            deviceType: 'Benchmark Turbine',
            location: 'Benchmark Lab'
          },
          temperature: Math.round((70 + Math.random() * 30) * 10) / 10,
          pressure: Math.round((100 + Math.random() * 20) * 10) / 10,
          vibration: Math.round((1.0 + Math.random() * 3.0) * 10) / 10,
          humidity: 45
        });
      }

      await Telemetry.insertMany(docs, { ordered: false });
      process.stdout.write(`  Inserted batch ${b + 1}/${batches} (${(b + 1) * currentBatchCount} readings)...\r`);
    }

    const endTime = performance.now();
    const durationSeconds = (endTime - startTime) / 1000;
    const writesPerSecond = Math.round(TOTAL_WRITES / durationSeconds);

    console.log('\n\n-------------------------------------------------------------');
    console.log('   BENCHMARK RESULTS & MEASURED METRICS                      ');
    console.log('-------------------------------------------------------------');
    console.log(` Total Readings Ingested : ${TOTAL_WRITES.toLocaleString()}`);
    console.log(` Time Elapsed            : ${durationSeconds.toFixed(3)} seconds`);
    console.log(` Measured Throughput     : ${writesPerSecond.toLocaleString()} writes / second`);

    // Storage footprint evaluation
    try {
      const statsAfter = await db.command({ collStats: 'telemetries' });
      const addedSizeBytes = (statsAfter.size || 0) - statsBefore.sizeBytes;
      const bytesPerReading = Math.round((addedSizeBytes / TOTAL_WRITES) * 10) / 10;

      console.log(` Approximate Added Size : ${(addedSizeBytes / 1024).toFixed(2)} KB`);
      console.log(` Footprint Per Reading  : ~${bytesPerReading} bytes / reading (highly compressed)`);
    } catch {
      // collStats might not be directly available on all driver versions
    }

    console.log('=============================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('\n[Benchmark Error]', err.message);
    process.exit(1);
  } finally {
    if (conn) await mongoose.disconnect();
  }
}

runBenchmark();
