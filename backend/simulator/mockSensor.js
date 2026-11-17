/**
 * NexusFlow Mock IoT Sensor Simulator
 * Generates simulated telemetry readings (temperature, pressure, vibration, humidity)
 * and posts them to the NexusFlow telemetry ingestion API.
 *
 * Usage:
 *   node simulator/mockSensor.js
 *   node simulator/mockSensor.js --interval 500 --devices TURBINE_001,PUMP_002
 *   node simulator/mockSensor.js --count 20
 *   node simulator/mockSensor.js --batch 50 --count 500
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

// Parse CLI arguments
const args = process.argv.slice(2);
function getArg(flag, defaultValue) {
  const index = args.indexOf(flag);
  if (index !== -1 && args[index + 1]) {
    return args[index + 1];
  }
  return defaultValue;
}

const API_URL = getArg('--url', process.env.TELEMETRY_API_URL || 'http://localhost:5000/api/telemetry');
const INTERVAL_MS = parseInt(getArg('--interval', '1000'), 10);
const MAX_COUNT = args.includes('--count') ? parseInt(getArg('--count', '0'), 10) : 0;
const BATCH_SIZE = parseInt(getArg('--batch', '1'), 10);
const DEVICE_LIST = getArg('--devices', 'TURBINE_001,TURBINE_002,PUMP_101,BOILER_005')
  .split(',')
  .map(d => d.trim())
  .filter(Boolean);

// Sensor baseline state
const deviceState = {};
DEVICE_LIST.forEach(deviceId => {
  deviceState[deviceId] = {
    temperature: 65 + Math.random() * 15,
    pressure: 95 + Math.random() * 20,
    vibration: 2.0 + Math.random() * 1.5,
    humidity: 45 + Math.random() * 10
  };
});

function randomWalk(val, min, max, step) {
  const delta = (Math.random() - 0.5) * 2 * step;
  let next = val + delta;
  if (next < min) next = min + Math.random() * step;
  if (next > max) next = max - Math.random() * step;
  return Math.round(next * 10) / 10;
}

function generateReading(deviceId) {
  const current = deviceState[deviceId];
  current.temperature = randomWalk(current.temperature, 50, 110, 2.5);
  current.pressure = randomWalk(current.pressure, 80, 140, 1.8);
  current.vibration = randomWalk(current.vibration, 0.5, 9.0, 0.4);
  current.humidity = randomWalk(current.humidity, 30, 85, 1.0);

  return {
    deviceId,
    timestamp: new Date().toISOString(),
    temperature: current.temperature,
    pressure: current.pressure,
    vibration: current.vibration,
    humidity: current.humidity,
    metadata: {
      deviceId,
      deviceType: deviceId.startsWith('TURBINE') ? 'Turbine Sensor' : deviceId.startsWith('BOILER') ? 'Boiler Sensor' : 'Pump Sensor',
      location: 'Factory Floor Block-A'
    }
  };
}

function sendHttpPost(urlStr, data) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const postData = JSON.stringify(data);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = client.request(options, res => {
      let responseBody = '';
      res.on('data', chunk => {
        responseBody += chunk;
      });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ status: res.statusCode, body: responseBody });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${responseBody}`));
        }
      });
    });

    req.on('error', err => {
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

let sentCount = 0;
console.log('='.repeat(65));
console.log('  NEXUSFLOW - Mock IoT Sensor Simulator');
console.log('='.repeat(65));
console.log(` Target API   : ${API_URL}`);
console.log(` Devices      : ${DEVICE_LIST.join(', ')}`);
console.log(` Interval     : ${INTERVAL_MS} ms`);
console.log(` Batch Size   : ${BATCH_SIZE}`);
console.log(` Target Count : ${MAX_COUNT > 0 ? MAX_COUNT : 'Continuous (Ctrl+C to stop)'}`);
console.log('='.repeat(65));

async function tick() {
  try {
    if (BATCH_SIZE > 1) {
      // Batch mode
      const readings = [];
      for (let i = 0; i < BATCH_SIZE; i++) {
        const deviceId = DEVICE_LIST[Math.floor(Math.random() * DEVICE_LIST.length)];
        readings.push(generateReading(deviceId));
      }

      const targetUrl = API_URL.endsWith('/batch') ? API_URL : `${API_URL}/batch`;
      await sendHttpPost(targetUrl, readings);
      sentCount += readings.length;
      console.log(`[Simulator] Sent batch of ${readings.length} readings (Total: ${sentCount})`);
    } else {
      // Single reading mode (cycles through devices)
      for (const deviceId of DEVICE_LIST) {
        const reading = generateReading(deviceId);
        await sendHttpPost(API_URL, reading);
        sentCount++;
        console.log(`[Simulator] Ingested -> ${deviceId} | Temp: ${reading.temperature}°C | Press: ${reading.pressure} kPa | Vib: ${reading.vibration} mm/s`);
      }
    }

    if (MAX_COUNT > 0 && sentCount >= MAX_COUNT) {
      console.log(`[Simulator] Reached target count of ${sentCount} readings. Stopping.`);
      process.exit(0);
    }
  } catch (err) {
    console.error(`[Simulator Error] Failed to post telemetry: ${err.message}`);
  }
}

// Start simulation loop
const timer = setInterval(tick, INTERVAL_MS);
tick(); // First run immediately

process.on('SIGINT', () => {
  clearInterval(timer);
  console.log(`\n[Simulator] Stopped. Total sent: ${sentCount}`);
  process.exit(0);
});
