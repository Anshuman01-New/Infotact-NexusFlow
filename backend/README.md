# NexusFlow - Backend (Week 1 & Week 2: Telemetry Ingestion & Stream Logic Engine)

NexusFlow's backend serves as the ingestion and stream-processing engine for high-volume IoT sensor measurements.
- **Week 1**: Ingestion API, device registry, and storage in **MongoDB Time-Series Collections**.
- **Week 2**: Visual graph parsing, DAG cycle detection, and dynamic **RxJS Stream Pipeline Compilation** (`Sensor` &rarr; `Filter / Math` &rarr; `Condition` &rarr; `Action`).

---

## 🛠️ Architecture & Tech Stack

- **Runtime**: Node.js (v18+)
- **API Framework**: Express.js
- **Database**: MongoDB (v6.0+) with **native Time-Series Collections** (`telemetries`)
- **ODM**: Mongoose
- **Stream Processing Engine**: RxJS (`Subject`, `filter`, `map`, `scan`, `tap`)
- **Graph Compilation**: Topological Sorting (Kahn's Algorithm) & Cycle Detection for Directed Acyclic Graphs (DAGs)
- **IoT Simulator**: Native Node.js HTTP stream simulator (`simulator/mockSensor.js`)
- **Benchmark Suite**: High-throughput benchmark tool (`scripts/benchmarkIngestion.js`)

---

## 📁 Project Structure

```
backend/
├── config/
│   └── database.js             # MongoDB connection & Time-Series collection initializer
├── controllers/
│   ├── telemetryController.js  # Ingestion, batch writes, queries & pipeline streaming
│   ├── deviceController.js     # Device registry & status tracking
│   └── workflowController.js   # Graph validation, test compilation & CRUD
├── models/
│   ├── Telemetry.js            # Mongoose Time-Series schema (timeField: timestamp, metaField: metadata)
│   ├── Device.js               # IoT device registry schema
│   ├── Workflow.js             # Serialized workflow schema (nodes, edges, isActive)
│   └── Alert.js                # Dispatched alert log schema
├── routes/
│   ├── telemetryRoutes.js      # /api/telemetry routes
│   ├── deviceRoutes.js         # /api/devices routes
│   └── workflowRoutes.js       # /api/workflows routes
├── scripts/
│   ├── testCompiler.js         # Week 2: Graph parser & RxJS compilation test suite
│   ├── testStorage.js          # Week 1: Automated storage verification script
│   └── benchmarkIngestion.js   # Mid-Project Review: 5,000 writes/sec benchmark tool
├── services/
│   ├── streamCompiler.js       # Graph validation, DAG sorting & RxJS pipeline compiler
│   ├── ruleEngine.js           # Central active pipeline manager & telemetry dispatcher
│   └── alertService.js         # Mock SMS/Webhook dispatcher & alert persistence
├── simulator/
│   └── mockSensor.js           # Configurable IoT device simulator
├── .env.example                # Environment variables template
├── package.json                # Backend dependencies and scripts
└── server.js                   # Express server entrypoint
```

---

## ⚙️ Environment Variables

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/nexusflow
NODE_ENV=development
```

---

## 📡 REST API Reference

### 1. Telemetry Ingestion & Storage (Week 1)
- **`POST /api/telemetry`**: Ingest a single reading, store in Time-Series, and pass into active RxJS pipelines.
- **`POST /api/telemetry/batch`**: Bulk write ingestion using `Telemetry.insertMany(docs, { ordered: false })`.
- **`GET /api/telemetry`**: Query historical telemetry (`deviceId`, `startDate`, `endDate`, `limit`, `sort`).
- **`GET /api/telemetry/latest`**: Retrieve the most recent reading for each device.
- **`GET /api/telemetry/stats`**: Get collection stats (count, active devices, storage engine).

### 2. Logic Engine & Workflow APIs (Week 2)
- **`POST /api/workflows/validate`**: Validates a visual graph JSON without saving. Checks node configurations, connectivity, and verifies DAG cycle freedom using Kahn's algorithm.
  - **Sample Request**:
    ```json
    {
      "graph": {
        "nodes": [
          { "id": "1", "type": "sensor", "data": { "deviceId": "TURBINE_001", "metric": "temperature" } },
          { "id": "2", "type": "filter", "data": { "windowSize": 3 } },
          { "id": "3", "type": "condition", "data": { "operator": ">", "threshold": 80 } },
          { "id": "4", "type": "action", "data": { "actionType": "SMS Alert", "target": "+1555" } }
        ],
        "edges": [
          { "source": "1", "target": "2" },
          { "source": "2", "target": "3" },
          { "source": "3", "target": "4" }
        ]
      }
    }
    ```
  - **Sample Response**:
    ```json
    {
      "success": true,
      "valid": true,
      "errors": [],
      "warnings": [],
      "executionOrder": ["1", "2", "3", "4"],
      "nodeCount": 4,
      "edgeCount": 3
    }
    ```
- **`POST /api/workflows/compile-test`**: Compiles an RxJS pipeline and runs mock sensor readings through it, returning step-by-step traces and triggered alerts.
- **`GET /api/workflows`**: List all saved workflows.
- **`POST /api/workflows`**: Create a new workflow, validate its structure, and deploy it to the active rule engine.
- **`GET /api/workflows/:id`**: Get workflow details by ID.
- **`PUT /api/workflows/:id`**: Update workflow configuration and reload in the rule engine.
- **`DELETE /api/workflows/:id`**: Delete workflow and unregister its pipeline.
- **`PATCH /api/workflows/:id/toggle`**: Toggle active/inactive deployment state.
- **`GET /api/workflows/engine/status`**: View all currently deployed pipelines and execution metrics.

---

## 🧪 Steps Needed to Test the Week 1 Implementation

1. **Verify MongoDB is running**:
   ```powershell
   Get-Service -Name MongoDB
   ```
2. **Run the storage test**:
   ```powershell
   cd backend
   npm run test:storage
   ```
   *Verifies native Time-Series collection creation, single write, batch write, and querying.*
3. **Start the Express server**:
   ```powershell
   npm run dev
   ```
4. **Run the IoT mock sensor simulator**:
   ```powershell
   npm run simulate
   ```

---

## 🧪 Steps Needed to Test the Week 2 Implementation

Follow these steps to thoroughly test the Week 2 Logic Engine, Stream Compiler, and Mid-Project Review benchmark:

### Step 1: Run the Automated Logic Engine & Stream Compiler Test Suite
Execute the dedicated Week 2 verification script:
```powershell
cd backend
npm run test:compiler
```
**What this validates**:
- **Test 1**: Verifies valid DAG graph structures and asserts topological execution order (`n1 -> n2 -> n3 -> n4`).
- **Test 2**: Introduces a circular back-edge (`A -> B -> C -> A`) and confirms Kahn's algorithm catches the cycle and flags it as invalid.
- **Test 3**: Tests invalid node configurations (missing `deviceId`, invalid `operator`, self-loops) and asserts informative error diagnostics.
- **Test 4**: Compiles a real RxJS pipeline with a Moving Average filter (window of 3 samples). Feeds in 70°C, 74°C, 96°C, and 92°C, verifying that the alert only fires when the sliding average exceeds 80°C (at 87.33°C).
- **Test 5**: Tests Math Operation nodes (`multiply` / scaling by 1.5x) feeding into threshold checks.
- **Test 6**: Tests the interactive simulation helper (`testRun`) against test batches.
- **Test 7**: Connects to MongoDB, saves a workflow, deploys it to `RuleEngine`, processes live readings via `ruleEngine.processReading(...)`, and confirms automatic alert dispatching.

**Expected Result**: `TEST SUMMARY: 17 PASSED, 0 FAILED`.

### Step 2: Run the Mid-Project Review Ingestion Benchmark (5,000 writes/sec target)
Execute the mid-project benchmark tool:
```powershell
npm run benchmark
```
*(Optionally specify parameters: `node scripts/benchmarkIngestion.js --count 5000 --batchSize 1000`)*

**Expected Result**:
- Measures throughput on native MongoDB Time-Series collection (typically **5,000+ writes/second**).
- Computes approximate storage footprint (~10 bytes per compressed reading).

### Step 3: Test Graph Validation via HTTP API
With the backend server running (`npm run dev`), test the `/api/workflows/validate` endpoint using PowerShell or curl:
```powershell
$body = @{
    graph = @{
        nodes = @(
            @{ id = "s1"; type = "sensor"; data = @{ deviceId = "TURBINE_001"; metric = "temperature" } },
            @{ id = "c1"; type = "condition"; data = @{ operator = ">"; threshold = 85 } },
            @{ id = "a1"; type = "action"; data = @{ actionType = "SMS Alert"; target = "+1555" } }
        )
        edges = @(
            @{ source = "s1"; target = "c1" },
            @{ source = "c1"; target = "a1" }
        )
    }
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Uri "http://localhost:5000/api/workflows/validate" -Method Post -Body $body -ContentType "application/json"
```
**Expected Output**: `{"success":true,"valid":true,"errors":[],"executionOrder":["s1","c1","a1"],"nodeCount":3,"edgeCount":2}`.

### Step 4: Test Interactive Simulation API
Run a test stream through the compiled pipeline via HTTP:
```powershell
$sim = @{
    graph = @{
        nodes = @(
            @{ id = "s1"; type = "sensor"; data = @{ deviceId = "TURBINE_001"; metric = "temperature" } },
            @{ id = "m1"; type = "math"; data = @{ operation = "multiply"; operand = 2 } },
            @{ id = "c1"; type = "condition"; data = @{ operator = ">"; threshold = 150 } },
            @{ id = "a1"; type = "action"; data = @{ actionType = "SMS Alert"; target = "Operator" } }
        )
        edges = @(
            @{ source = "s1"; target = "m1" },
            @{ source = "m1"; target = "c1" },
            @{ source = "c1"; target = "a1" }
        )
    }
    mockReadings = @(
        @{ deviceId = "TURBINE_001"; temperature = 70 },
        @{ deviceId = "TURBINE_001"; temperature = 85 }
    )
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Uri "http://localhost:5000/api/workflows/compile-test" -Method Post -Body $sim -ContentType "application/json"
```
**Expected Output**: Reading 1 (70 * 2 = 140) produces no alert. Reading 2 (85 * 2 = 170) evaluates `170 > 150` = true, dispatching an alert with full execution trace.
