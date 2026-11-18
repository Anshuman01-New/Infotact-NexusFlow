# NexusFlow - Backend (Week 1: Telemetry Ingestion & Storage)

NexusFlow's backend serves as the ingestion and stream-processing engine for high-volume IoT sensor measurements. In **Week 1**, the backend foundation is established using **Node.js**, **Express**, and **MongoDB Time-Series Collections**.

---

## 🛠️ Architecture & Tech Stack

- **Runtime**: Node.js (v18+)
- **API Framework**: Express.js
- **Database**: MongoDB (v6.0+) with **native Time-Series Collections** (`telemetries`)
- **ODM**: Mongoose
- **IoT Simulator**: Native Node.js HTTP stream simulator (`simulator/mockSensor.js`)
- **Reactive Engine Ready**: RxJS installed for Week 2 stream compilation

---

## 📁 Project Structure

```
backend/
├── config/
│   └── database.js           # MongoDB connection & Time-Series collection initializer
├── controllers/
│   ├── telemetryController.js # Ingestion, batch writes, queries & statistics
│   └── deviceController.js    # Device registry & status tracking
├── models/
│   ├── Telemetry.js          # Mongoose Time-Series schema (timeField: timestamp, metaField: metadata)
│   ├── Device.js             # IoT device registry schema
│   ├── Workflow.js           # Workflow schema (Week 2 preparation)
│   └── Alert.js              # Alert history schema (Week 4 preparation)
├── routes/
│   ├── telemetryRoutes.js    # /api/telemetry routes
│   └── deviceRoutes.js       # /api/devices routes
├── scripts/
│   └── testStorage.js        # Automated storage verification script
├── simulator/
│   └── mockSensor.js         # Configurable IoT device simulator
├── .env.example              # Environment variables template
├── package.json              # Backend dependencies and scripts
└── server.js                 # Express server entrypoint
```

---

## ⚙️ Environment Variables

Create a `.env` file in the `backend/` directory (or copy `.env.example`):

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/nexusflow
NODE_ENV=development
```

---

## 📡 REST API Reference

### 1. Telemetry Ingestion
- **`POST /api/telemetry`**
  - Ingests a single telemetry reading and updates the device's `lastSeen` status.
  - **Body Example**:
    ```json
    {
      "deviceId": "TURBINE_001",
      "temperature": 84.5,
      "pressure": 112.3,
      "vibration": 3.2,
      "humidity": 45.0,
      "metadata": {
        "deviceId": "TURBINE_001",
        "deviceType": "Turbine Sensor",
        "location": "Factory Floor Block-A"
      }
    }
    ```

### 2. High-Throughput Batch Ingestion
- **`POST /api/telemetry/batch`**
  - Accepts an array of telemetry readings for bulk write performance.
  - **Body Example**:
    ```json
    [
      { "deviceId": "TURBINE_001", "temperature": 82.1, "pressure": 105.0 },
      { "deviceId": "MOTOR_102", "temperature": 74.0, "vibration": 2.1 }
    ]
    ```

### 3. Historical Telemetry Queries
- **`GET /api/telemetry?deviceId=TURBINE_001&limit=50&sort=desc`**
  - Query parameters:
    - `deviceId`: Filter by device ID
    - `startDate`, `endDate`: ISO timestamp range filter
    - `limit`: Number of readings (default 100, max 1000)
    - `sort`: `desc` (newest first) or `asc`

### 4. Latest Readings & Statistics
- **`GET /api/telemetry/latest`**: Returns the most recent reading for each active device.
- **`GET /api/telemetry/stats`**: Returns total readings count, active devices count, and storage metadata.
- **`GET /api/devices`**: Lists registered IoT devices and their current status.
- **`GET /api/health`**: Health check reporting MongoDB connection and server uptime.

---

## 🧪 Steps Needed to Test the Week 1 Implementation

Follow these steps to thoroughly test the Week 1 backend implementation:

### Step 1: Ensure MongoDB is Running
Make sure MongoDB is running on your machine:
```powershell
# Windows PowerShell
Get-Service -Name MongoDB
```
*(If MongoDB is not started, run `Start-Service MongoDB` or launch `mongod` in a terminal).*

### Step 2: Install Backend Dependencies
Navigate to the backend folder:
```powershell
cd backend
npm install
```

### Step 3: Run the Automated Storage & Ingestion Verification Test
Execute the test script to verify MongoDB connection, native Time-Series collection creation, single write, batch write, historical queries, and device indexing:
```powershell
npm test
```
**Expected Output**:
- `[MongoDB] Connected successfully`
- `SUCCESS: Native MongoDB Time-Series collection verified!` (with `granularity: seconds`)
- `SUCCESS: Reading saved with ID: ...`
- `SUCCESS: Inserted 5 batch readings.`
- `ALL WEEK 1 BACKEND & DATABASE TESTS PASSED SUCCESSFULLY!`

### Step 4: Start the Express Server
Start the development server:
```powershell
npm run dev
# or: npm start
```
**Expected Output**:
Server listens on `http://localhost:5000`. You can test the health endpoint in your browser or curl:
```bash
curl http://localhost:5000/api/health
```

### Step 5: Run the IoT Mock Sensor Simulator
Open a second terminal window in the `backend/` directory and run:
```powershell
npm run simulate
```
- The simulator will generate readings for `TURBINE_001`, `TURBINE_002`, `PUMP_101`, and `BOILER_005` every second and post them to `http://localhost:5000/api/telemetry`.
- **Optional CLI options**:
  ```powershell
  # Run for 20 readings then exit
  node simulator/mockSensor.js --count 20

  # High-throughput batch mode (send 50 readings per batch)
  node simulator/mockSensor.js --batch 50 --count 500 --interval 200
  ```

### Step 6: Query Ingested Readings
Verify the readings in MongoDB by requesting the statistics and recent telemetry:
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/telemetry/stats" -Method Get
Invoke-RestMethod -Uri "http://localhost:5000/api/telemetry?limit=5" -Method Get
```
